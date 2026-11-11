/**
 * SwiftCent Invoice Lifecycle State Machine
 */

export type InvoiceStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'partially_paid'
  | 'paid'
  | 'overdue'
  | 'void'
  | 'refunded';

export interface InvoiceStateEvent {
  action: string;
  fromStatus: InvoiceStatus;
  toStatus: InvoiceStatus;
  timestamp: Date;
  actor: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Permitted status transitions table.
 */
export const ALLOWED_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  draft: ['sent', 'void'],
  sent: ['viewed', 'partially_paid', 'paid', 'overdue', 'void'],
  viewed: ['partially_paid', 'paid', 'overdue', 'void'],
  partially_paid: ['paid', 'overdue', 'void'],
  paid: ['refunded'],
  overdue: ['viewed', 'partially_paid', 'paid', 'void'],
  void: [],
  refunded: [],
};

/**
 * Checks whether an invoice's line items are locked from direct editing.
 * Invoices that have been dispatched (sent/viewed/paid) must preserve historical accuracy.
 */
export function isInvoiceLocked(status: InvoiceStatus): boolean {
  return status !== 'draft';
}

/**
 * Validates if transition from `currentStatus` to `targetStatus` is permissible.
 */
export function canTransition(currentStatus: InvoiceStatus, targetStatus: InvoiceStatus): boolean {
  if (currentStatus === targetStatus) return true;
  const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
  return allowed.includes(targetStatus);
}

/**
 * Computes status automatically based on payments and due date.
 */
export function resolvePaymentStatus(
  currentStatus: InvoiceStatus,
  grandTotalCents: number,
  paidCents: number,
  dueDate?: Date | string
): InvoiceStatus {
  // If already void or refunded, payment recalculation does not revive it
  if (currentStatus === 'void' || currentStatus === 'refunded') {
    return currentStatus;
  }

  // If fully paid
  if (paidCents >= grandTotalCents && grandTotalCents > 0) {
    return 'paid';
  }

  // If partially paid
  if (paidCents > 0 && paidCents < grandTotalCents) {
    // Check if overdue
    if (dueDate && new Date(dueDate).getTime() < Date.now()) {
      return 'overdue';
    }
    return 'partially_paid';
  }

  // If unpaid and past due date
  if (dueDate && new Date(dueDate).getTime() < Date.now() && currentStatus !== 'draft') {
    return 'overdue';
  }

  return currentStatus;
}

/**
 * Generates an immutable audit trail entry for state changes.
 */
export function createAuditEvent(
  fromStatus: InvoiceStatus,
  toStatus: InvoiceStatus,
  action: string,
  actor: string = 'system',
  notes?: string,
  metadata?: Record<string, unknown>
): InvoiceStateEvent {
  return {
    action,
    fromStatus,
    toStatus,
    timestamp: new Date(),
    actor,
    notes,
    metadata,
  };
}

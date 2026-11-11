export interface SampleDataActionResult {
  success: boolean;
  message?: string;
  error?: string;
  deleted?: {
    invoices: number;
    quotes: number;
    clients: number;
    products: number;
    payments: number;
  };
}

async function callSampleDataEndpoint(
  method: 'POST' | 'DELETE',
  organizationId?: string
): Promise<SampleDataActionResult> {
  const res = await fetch('/api/workspace/sample-data', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ organizationId }),
  });
  return res.json();
}

/**
 * Triggers allowlisted sample data population for the active workspace.
 * Enforced server-side via DEV_SAMPLE_ACCOUNT_EMAILS and workspace ownership.
 */
export async function loadSampleWorkspaceData(
  organizationId?: string
): Promise<SampleDataActionResult> {
  return callSampleDataEndpoint('POST', organizationId);
}

/**
 * Removes sample clients, invoices, quotes, payments, and products cleanly in one click
 * while preserving real user-created records.
 */
export async function clearSampleWorkspaceData(
  organizationId?: string
): Promise<SampleDataActionResult> {
  return callSampleDataEndpoint('DELETE', organizationId);
}

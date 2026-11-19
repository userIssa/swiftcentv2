'use client';

import React from 'react';
import { MessageCircle } from 'lucide-react';

interface WhatsAppShareButtonProps {
  documentType: 'quote' | 'invoice';
  documentNumber: string;
  clientName?: string;
  clientPhone?: string;
  businessName?: string;
  formattedTotal?: string;
  portalUrl: string;
  className?: string;
  variant?: 'solid' | 'outline';
}

export function WhatsAppShareButton({
  documentType,
  documentNumber,
  clientName,
  clientPhone,
  businessName,
  formattedTotal,
  portalUrl,
  className = '',
  variant = 'outline',
}: WhatsAppShareButtonProps) {
  const handleShare = () => {
    const docLabel = documentType === 'quote' ? 'Proposal' : 'Invoice';
    const recipient = clientName ? `Hello ${clientName}, ` : 'Hello, ';
    const org = businessName ? `from ${businessName}` : '';
    const total = formattedTotal ? ` for ${formattedTotal}` : '';

    const text = `${recipient}here is your ${docLabel} ${documentNumber} ${org}${total}:\n\n${portalUrl}\n\nYou can review details and approve/pay directly through this secure client portal.`;

    // Clean phone number: remove non-digits
    const cleanPhone = clientPhone ? clientPhone.replace(/\D/g, '') : '';
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (variant === 'solid') {
    return (
      <button
        type="button"
        onClick={handleShare}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer ${className}`}
        title="Share directly via WhatsApp"
      >
        <MessageCircle className="w-3.5 h-3.5 fill-current" />
        <span>Share via WhatsApp</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#25D366]/40 hover:border-[#25D366] text-[#128C7E] dark:text-[#25D366] hover:bg-[#25D366]/10 rounded-lg text-xs font-medium transition-colors cursor-pointer ${className}`}
      title="Share directly via WhatsApp"
    >
      <MessageCircle className="w-3.5 h-3.5" />
      <span>WhatsApp</span>
    </button>
  );
}


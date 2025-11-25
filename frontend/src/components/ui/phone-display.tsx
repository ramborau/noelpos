'use client';

import { formatPhoneWithCountry } from '@/lib/phone-utils';

interface PhoneDisplayProps {
  phone: string;
  className?: string;
}

export function PhoneDisplay({ phone, className = '' }: PhoneDisplayProps) {
  if (!phone) return null;

  const phoneData = formatPhoneWithCountry(phone);

  // If country was detected, show flag + formatted number
  if (phoneData.countryCode) {
    return (
      <span className={`inline-flex items-center gap-2 ${className}`}>
        <span
          className={`fi fi-${phoneData.countryCode.toLowerCase()} rounded-sm`}
          style={{ width: '20px', height: '15px' }}
        />
        <span>{phoneData.formattedNumber}</span>
      </span>
    );
  }

  // Fallback: show formatted number without flag
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span>{phoneData.formattedNumber || phone}</span>
    </span>
  );
}

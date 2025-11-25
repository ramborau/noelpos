// Dial code to country code mapping (sorted by dial code length for accurate matching)
const dialCodeMap: { dialCode: string; code: string; name: string }[] = [
  // Longer codes first for accurate matching
  { dialCode: '+1868', code: 'TT', name: 'Trinidad and Tobago' },
  { dialCode: '+1876', code: 'JM', name: 'Jamaica' },
  { dialCode: '+1809', code: 'DO', name: 'Dominican Republic' },
  { dialCode: '+1787', code: 'PR', name: 'Puerto Rico' },
  { dialCode: '+1671', code: 'GU', name: 'Guam' },
  { dialCode: '+1340', code: 'VI', name: 'US Virgin Islands' },
  { dialCode: '+1268', code: 'AG', name: 'Antigua and Barbuda' },
  { dialCode: '+1246', code: 'BB', name: 'Barbados' },
  { dialCode: '+1242', code: 'BS', name: 'Bahamas' },
  { dialCode: '+994', code: 'AZ', name: 'Azerbaijan' },
  { dialCode: '+993', code: 'TM', name: 'Turkmenistan' },
  { dialCode: '+992', code: 'TJ', name: 'Tajikistan' },
  { dialCode: '+977', code: 'NP', name: 'Nepal' },
  { dialCode: '+976', code: 'MN', name: 'Mongolia' },
  { dialCode: '+975', code: 'BT', name: 'Bhutan' },
  { dialCode: '+974', code: 'QA', name: 'Qatar' },
  { dialCode: '+973', code: 'BH', name: 'Bahrain' },
  { dialCode: '+972', code: 'IL', name: 'Israel' },
  { dialCode: '+971', code: 'AE', name: 'UAE' },
  { dialCode: '+968', code: 'OM', name: 'Oman' },
  { dialCode: '+967', code: 'YE', name: 'Yemen' },
  { dialCode: '+966', code: 'SA', name: 'Saudi Arabia' },
  { dialCode: '+965', code: 'KW', name: 'Kuwait' },
  { dialCode: '+964', code: 'IQ', name: 'Iraq' },
  { dialCode: '+963', code: 'SY', name: 'Syria' },
  { dialCode: '+962', code: 'JO', name: 'Jordan' },
  { dialCode: '+961', code: 'LB', name: 'Lebanon' },
  { dialCode: '+960', code: 'MV', name: 'Maldives' },
  { dialCode: '+886', code: 'TW', name: 'Taiwan' },
  { dialCode: '+880', code: 'BD', name: 'Bangladesh' },
  { dialCode: '+856', code: 'LA', name: 'Laos' },
  { dialCode: '+855', code: 'KH', name: 'Cambodia' },
  { dialCode: '+852', code: 'HK', name: 'Hong Kong' },
  { dialCode: '+853', code: 'MO', name: 'Macau' },
  { dialCode: '+98', code: 'IR', name: 'Iran' },
  { dialCode: '+95', code: 'MM', name: 'Myanmar' },
  { dialCode: '+94', code: 'LK', name: 'Sri Lanka' },
  { dialCode: '+93', code: 'AF', name: 'Afghanistan' },
  { dialCode: '+92', code: 'PK', name: 'Pakistan' },
  { dialCode: '+91', code: 'IN', name: 'India' },
  { dialCode: '+90', code: 'TR', name: 'Turkey' },
  { dialCode: '+86', code: 'CN', name: 'China' },
  { dialCode: '+84', code: 'VN', name: 'Vietnam' },
  { dialCode: '+82', code: 'KR', name: 'South Korea' },
  { dialCode: '+81', code: 'JP', name: 'Japan' },
  { dialCode: '+66', code: 'TH', name: 'Thailand' },
  { dialCode: '+65', code: 'SG', name: 'Singapore' },
  { dialCode: '+63', code: 'PH', name: 'Philippines' },
  { dialCode: '+62', code: 'ID', name: 'Indonesia' },
  { dialCode: '+61', code: 'AU', name: 'Australia' },
  { dialCode: '+60', code: 'MY', name: 'Malaysia' },
  { dialCode: '+55', code: 'BR', name: 'Brazil' },
  { dialCode: '+54', code: 'AR', name: 'Argentina' },
  { dialCode: '+52', code: 'MX', name: 'Mexico' },
  { dialCode: '+51', code: 'PE', name: 'Peru' },
  { dialCode: '+49', code: 'DE', name: 'Germany' },
  { dialCode: '+48', code: 'PL', name: 'Poland' },
  { dialCode: '+47', code: 'NO', name: 'Norway' },
  { dialCode: '+46', code: 'SE', name: 'Sweden' },
  { dialCode: '+45', code: 'DK', name: 'Denmark' },
  { dialCode: '+44', code: 'GB', name: 'United Kingdom' },
  { dialCode: '+43', code: 'AT', name: 'Austria' },
  { dialCode: '+41', code: 'CH', name: 'Switzerland' },
  { dialCode: '+40', code: 'RO', name: 'Romania' },
  { dialCode: '+39', code: 'IT', name: 'Italy' },
  { dialCode: '+36', code: 'HU', name: 'Hungary' },
  { dialCode: '+34', code: 'ES', name: 'Spain' },
  { dialCode: '+33', code: 'FR', name: 'France' },
  { dialCode: '+32', code: 'BE', name: 'Belgium' },
  { dialCode: '+31', code: 'NL', name: 'Netherlands' },
  { dialCode: '+30', code: 'GR', name: 'Greece' },
  { dialCode: '+27', code: 'ZA', name: 'South Africa' },
  { dialCode: '+20', code: 'EG', name: 'Egypt' },
  { dialCode: '+7', code: 'RU', name: 'Russia' },
  { dialCode: '+1', code: 'US', name: 'United States' },
];

/**
 * Detect country from phone number based on dial code
 */
function getCountryFromPhone(phone: string): { code: string; name: string; dialCode: string } | null {
  if (!phone) return null;

  // Clean the phone number
  let cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  if (!cleanPhone.startsWith('+')) {
    cleanPhone = '+' + cleanPhone;
  }

  // Try to match dial codes (longer codes are first in the array)
  for (const country of dialCodeMap) {
    if (cleanPhone.startsWith(country.dialCode)) {
      return country;
    }
  }

  return null;
}

/**
 * Format phone number with country detection
 * @param phone - Raw phone number
 * @returns Object with countryCode for flag-icons CSS class and formatted number
 */
export function formatPhoneWithCountry(phone: string): {
  formattedNumber: string;
  countryCode: string;
  countryName: string;
} {
  if (!phone) {
    return {
      formattedNumber: '',
      countryCode: '',
      countryName: 'Unknown',
    };
  }

  // Clean the phone number
  let cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  if (!cleanPhone.startsWith('+')) {
    cleanPhone = '+' + cleanPhone;
  }

  const country = getCountryFromPhone(cleanPhone);

  if (country) {
    // Remove the dial code to get the local number
    const localNumber = cleanPhone.replace(country.dialCode, '');
    const formattedLocal = formatLocalNumber(localNumber, country.code);

    return {
      formattedNumber: formattedLocal,
      countryCode: country.code,
      countryName: country.name,
    };
  }

  // Fallback - format the number generically
  return {
    formattedNumber: formatGenericNumber(cleanPhone),
    countryCode: '',
    countryName: 'Unknown',
  };
}

/**
 * Format local number based on country code
 */
function formatLocalNumber(number: string, countryCode: string): string {
  // Remove any leading zeros
  const cleanNumber = number.replace(/^0+/, '');

  // Country-specific formatting
  switch (countryCode) {
    case 'IN': // India: XXXXX XXXXX
      if (cleanNumber.length === 10) {
        return `${cleanNumber.slice(0, 5)} ${cleanNumber.slice(5)}`;
      }
      break;
    case 'BH': // Bahrain: XXXX XXXX
      if (cleanNumber.length === 8) {
        return `${cleanNumber.slice(0, 4)} ${cleanNumber.slice(4)}`;
      }
      break;
    case 'AE': // UAE: XX XXX XXXX
      if (cleanNumber.length === 9) {
        return `${cleanNumber.slice(0, 2)} ${cleanNumber.slice(2, 5)} ${cleanNumber.slice(5)}`;
      }
      break;
    case 'SA': // Saudi Arabia: XX XXX XXXX
      if (cleanNumber.length === 9) {
        return `${cleanNumber.slice(0, 2)} ${cleanNumber.slice(2, 5)} ${cleanNumber.slice(5)}`;
      }
      break;
    case 'KW': // Kuwait: XXXX XXXX
      if (cleanNumber.length === 8) {
        return `${cleanNumber.slice(0, 4)} ${cleanNumber.slice(4)}`;
      }
      break;
    case 'QA': // Qatar: XXXX XXXX
      if (cleanNumber.length === 8) {
        return `${cleanNumber.slice(0, 4)} ${cleanNumber.slice(4)}`;
      }
      break;
    case 'OM': // Oman: XXXX XXXX
      if (cleanNumber.length === 8) {
        return `${cleanNumber.slice(0, 4)} ${cleanNumber.slice(4)}`;
      }
      break;
    case 'US': // US: XXX XXX XXXX
    case 'CA': // Canada
      if (cleanNumber.length === 10) {
        return `${cleanNumber.slice(0, 3)} ${cleanNumber.slice(3, 6)} ${cleanNumber.slice(6)}`;
      }
      break;
    case 'GB': // UK: XXXX XXX XXXX
      if (cleanNumber.length === 10 || cleanNumber.length === 11) {
        return `${cleanNumber.slice(0, 4)} ${cleanNumber.slice(4, 7)} ${cleanNumber.slice(7)}`;
      }
      break;
    case 'PK': // Pakistan: XXX XXX XXXX
      if (cleanNumber.length === 10) {
        return `${cleanNumber.slice(0, 3)} ${cleanNumber.slice(3, 6)} ${cleanNumber.slice(6)}`;
      }
      break;
    case 'PH': // Philippines: XXX XXX XXXX
      if (cleanNumber.length === 10) {
        return `${cleanNumber.slice(0, 3)} ${cleanNumber.slice(3, 6)} ${cleanNumber.slice(6)}`;
      }
      break;
    case 'EG': // Egypt: XX XXXX XXXX
      if (cleanNumber.length === 10) {
        return `${cleanNumber.slice(0, 2)} ${cleanNumber.slice(2, 6)} ${cleanNumber.slice(6)}`;
      }
      break;
    case 'JO': // Jordan: X XXXX XXXX
      if (cleanNumber.length === 9) {
        return `${cleanNumber.slice(0, 1)} ${cleanNumber.slice(1, 5)} ${cleanNumber.slice(5)}`;
      }
      break;
    case 'LB': // Lebanon: XX XXX XXX
      if (cleanNumber.length === 8) {
        return `${cleanNumber.slice(0, 2)} ${cleanNumber.slice(2, 5)} ${cleanNumber.slice(5)}`;
      }
      break;
  }

  // Default: split in groups of 4
  return formatGenericNumber(cleanNumber);
}

/**
 * Generic number formatting - groups of 4
 */
function formatGenericNumber(number: string): string {
  const cleanNumber = number.replace(/^\+/, '');
  const chunks = [];
  for (let i = 0; i < cleanNumber.length; i += 4) {
    chunks.push(cleanNumber.slice(i, i + 4));
  }
  return chunks.join(' ');
}

import QRCode from 'qrcode';

export interface DynamicQROptions {
  studioName: string;
  studioGcashNumber: string;
  amount: number;
  bookingId?: string;
  orderId?: string;
  paymentType: 'downpayment' | 'full' | 'balance' | 'print_order';
}

/**
 * Calculates standard CRC16-CCITT checksum for EMVCo / QR Ph standard (polynomial 0x1021, init 0xFFFF)
 */
function calculateCRC16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Formats a tag-length-value (TLV) element
 */
function formatTag(tag: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${tag}${len}${value}`;
}

/**
 * Builds an EMVCo-compliant QR Ph string for the exact order amount and studio
 * Compatible with Bangko Sentral ng Pilipinas (BSP) QR Ph national QR code standard.
 */
export function buildQRPhPayload(options: DynamicQROptions): string {
  const cleanNumber = (options.studioGcashNumber || '09178221010').replace(/[^0-9]/g, '');
  const mobileWithPrefix = cleanNumber.startsWith('63')
    ? `+${cleanNumber}`
    : cleanNumber.startsWith('0')
    ? `+63${cleanNumber.slice(1)}`
    : `+63${cleanNumber}`;
  const localMobileNumber = cleanNumber.startsWith('63') ? `0${cleanNumber.slice(2)}` : cleanNumber;

  const merchantName = (options.studioName || 'Cainta Studio')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .substring(0, 25)
    .trim() || 'Cainta Photo Studio';

  const amountStr = Number(options.amount || 0).toFixed(2);
  const refId = (options.bookingId || options.orderId || `ORD-${Date.now().toString().slice(-6)}`).toUpperCase();

  // Tag 26: QR Ph P2P (Person to Person / Individual GCash Account standard)
  // Subtag 00: Globally Unique ID ('ph.ppmi.p2p')
  // Subtag 01: GCash Clearing / Institution Code ('02046001' - G-Xchange Inc)
  // Subtag 02: Recipient Mobile Number (+639XXXXXXXXX)
  // Subtag 03: Account Type ('1' for mobile wallet)
  const tag26_sub00 = formatTag('00', 'ph.ppmi.p2p');
  const tag26_sub01 = formatTag('01', '02046001'); // GCash Bank Switch Code
  const tag26_sub02 = formatTag('02', mobileWithPrefix);
  const tag26_sub03 = formatTag('03', '1');
  const tag26 = formatTag('26', `${tag26_sub00}${tag26_sub01}${tag26_sub02}${tag26_sub03}`);

  // Tag 28: QR Ph P2M (Person to Merchant national identifier)
  const tag28_sub00 = formatTag('00', 'ph.ppmi.p2m');
  const tag28_sub01 = formatTag('01', '02046001');
  const tag28_sub02 = formatTag('02', localMobileNumber);
  const tag28 = formatTag('28', `${tag28_sub00}${tag28_sub01}${tag28_sub02}`);

  // Tag 62: Additional Data (Bill Number / Booking Reference)
  const tag62_sub01 = formatTag('01', refId);
  const tag62_sub05 = formatTag('05', refId.slice(-8));
  const tag62 = formatTag('62', `${tag62_sub01}${tag62_sub05}`);

  let raw = '';
  raw += formatTag('00', '01'); // Payload Format Indicator
  raw += formatTag('01', '12'); // Point of Initiation Method: 12 = Dynamic QR (Contains specific transaction amount)
  raw += tag26; // QR Ph P2P
  raw += tag28; // QR Ph P2M
  raw += formatTag('52', '7221'); // Merchant Category Code: 7221 (Photographic Studios)
  raw += formatTag('53', '608'); // Transaction Currency: 608 (Philippine Peso PHP)
  raw += formatTag('54', amountStr); // Exact Transaction Amount
  raw += formatTag('58', 'PH'); // Country Code: PH
  raw += formatTag('59', merchantName); // Merchant/Studio Name
  raw += formatTag('60', 'Cainta'); // Merchant City
  raw += tag62; // Reference data

  // Append Tag 63 ID + Length '04' placeholder then compute CRC16
  const toChecksum = `${raw}6304`;
  const checksum = calculateCRC16(toChecksum);

  return `${toChecksum}${checksum}`;
}

/**
 * Generates high-resolution data URL for order-specific Dynamic QR
 */
export async function generateOrderDynamicQRCode(options: DynamicQROptions): Promise<string> {
  const payload = buildQRPhPayload(options);

  return await QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 320,
    color: {
      dark: '#003eb3', // Deep GCash Navy
      light: '#ffffff'
    }
  });
}

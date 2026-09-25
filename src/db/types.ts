export type UserRole = 'SUPER_ADMIN' | 'STUDIO_ADMIN' | 'STUDIO_STAFF' | 'CUSTOMER';

export interface User {
  id: string;
  email: string;
  passwordHash?: string;
  fullName: string;
  role: UserRole;
  studioId?: string;
  contactNumber?: string;
  address?: string;
  avatar?: string;
  status?: 'active' | 'suspended';
  createdAt: string;
}

export interface Customer {
  id: string;
  email: string;
  fullName: string;
  contactNumber?: string;
  address?: string;
  createdAt: string;
}

export interface StudioSocialLinks {
  facebook?: string;
  website?: string;
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  twitter?: string;
  other?: string;
}

export interface Studio {
  id: string;
  name: string;
  ownerId: string;
  logo: string;
  coverImage: string;
  location: string;
  rating: number;
  reviewCount: number;
  startingPrice: number;
  categories: string[];
  description: string;
  address: string;
  contactInfo: string;
  email: string;
  businessHours: string;
  isApproved: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'archived' | 'Approved' | 'Pending' | 'Suspended';
  printingAvailable: boolean;
  latitude: number;
  longitude: number;
  businessPermit?: string;
  businessPermitDoc?: string;
  validId?: string;
  otherDocs?: string[];
  blockedDates?: string[];
  gcashName?: string;
  gcashNumber?: string;
  gcashQrCode?: string;
  portfolioImages?: string[];
  servicesOffered?: string[];
  website?: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  twitter?: string;
  socialLinks?: StudioSocialLinks;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface Service {
  id: string;
  studioId: string;
  name: string;
  description: string;
  category: string;
  basePrice: number;
  durationMinutes: number;
  image: string;
  images?: string[];
  isActive: boolean;
  availableDays: number[]; // 0 = Sunday, 1 = Monday, etc.
  availableSlots: string[]; // ["09:00", "10:30", "13:00", ...]
  requirements?: string;
  createdAt: string;
}

export interface Package {
  id: string;
  studioId: string;
  name: string;
  description: string;
  price: number;
  durationMinutes: number;
  editedPhotosCount: number;
  includedPrints: string;
  photographerCount: number;
  includedServices?: string[];
  termsAndConditions?: string;
  image: string;
  images?: string[];
  isActive: boolean;
  createdAt: string;
}

export interface Addon {
  id: string;
  studioId: string;
  name: string;
  price: number;
  description: string;
  image?: string;
  createdAt: string;
}

export type BookingStatus =
  | 'Pending'
  | 'Awaiting Payment'
  | 'Payment Under Review'
  | 'Confirmed'
  | 'Ongoing'
  | 'Completed'
  | 'Cancelled'
  | 'Rescheduled'
  | 'No Show'
  | 'Expired';

export type PaymentStatus = 'unpaid' | 'pending_verification' | 'downpayment_paid' | 'fully_paid' | 'refunded';

export interface Booking {
  id: string;
  studioId: string;
  customerId: string;
  serviceId?: string;
  packageId?: string;
  bookingDate: string; // YYYY-MM-DD
  timeSlot: string; // "14:00"
  addons: { addonId: string; name: string; price: number; quantity: number }[];
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerNotes?: string;
  requirementsDoc?: string;
  status: BookingStatus;
  totalAmount: number;
  amountPaid: number;
  downPaymentAmount: number;
  remainingBalance: number;
  paymentStatus: PaymentStatus;
  finalPaymentStatus: 'unpaid' | 'paid' | 'waived';
  paymentOption: 'downpayment' | 'full';
  paymentDueAt: string;
  paymentReference?: string;
  proofOfPayment?: string;
  cancellationReason?: string;
  cancelledBy?: string;
  cancelledAt?: string;
  assignedStaffId?: string;
  checklist?: { item: string; completed: boolean }[];
  lastReminderSentAt?: string;
  reminderCount?: number;
  archivedByCustomer?: boolean;
  archivedAt?: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  gcashSessionId?: string;
  bookingId?: string;
  printOrderId?: string;
  studioId: string;
  customerId: string;
  amount: number;
  paymentType: 'downpayment' | 'full' | 'balance' | 'print_order';
  paymentMethod: 'gcash' | 'cash' | 'bank_transfer';
  paymentStatus: 'pending_verification' | 'verified' | 'rejected' | 'refunded';
  proofOfPayment?: string;
  referenceNumber?: string;
  gatewayTransactionId?: string;
  fraudScore?: number;
  paymentChannel?: string;
  paymentDate: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

export interface GCashQRSession {
  id: string;
  paymentId?: string;
  bookingId?: string;
  printOrderId?: string;
  studioId: string;
  studioName?: string;
  studioGcashName?: string;
  studioGcashNumber?: string;
  customerId: string;
  gateway: 'paymongo' | 'direct_gcash';
  gatewayPaymentIntentId: string;
  qrCodeData: string; // base64 QR image or direct studio QR image
  amount: number;
  fullAmount?: number;
  downPaymentAmount?: number;
  paymentType: 'downpayment' | 'full' | 'balance' | 'print_order';
  status: 'pending' | 'paid' | 'expired';
  expiresAt: string;
  paidAt?: string;
  createdAt: string;
}

export interface PrintProduct {
  id: string;
  studioId: string;
  name: string;
  description: string;
  size: string;
  price: number;
  image: string;
  inStock: boolean;
  estimatedHours: number;
  isActive: boolean;
  createdAt: string;
}

export type PrintOrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Processing'
  | 'Quality Check'
  | 'Ready for Pickup'
  | 'Out for Delivery'
  | 'Completed'
  | 'Cancelled'
  | 'submitted'
  | 'printing'
  | 'framed'
  | 'shipped'
  | 'delivered';

export interface PrintOrder {
  id: string;
  studioId: string;
  customerId: string;
  productId: string;
  quantity: number;
  uploadedPhoto: string;
  status: PrintOrderStatus;
  totalAmount: number;
  paymentMethod: 'gcash' | 'cash' | 'bank_transfer';
  paymentStatus: 'unpaid' | 'pending_verification' | 'verified' | 'refunded';
  proofOfPayment?: string;
  referenceNumber?: string;
  shippingAddress?: string;
  trackingNumber?: string;
  notes?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  studioId: string;
  customerId: string;
  customerName: string;
  bookingId?: string;
  rating: number; // 1-5
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  isVisible: boolean;
  reply?: string;
  replyAt?: string;
  createdAt: string;
}

export interface PhotoProofing {
  id: string;
  bookingId: string;
  studioId: string;
  customerId: string;
  photos: {
    id: string;
    url: string;
    isStarred?: boolean;
    clientFeedback?: string;
    originalName?: string;
  }[];
  watermarkText: string;
  watermarkPosition: 'center' | 'bottom_right' | 'repeat_diagonal';
  watermarkOpacity: number; // 0.1 to 1.0
  finalDriveLink?: string;
  status: 'draft' | 'pending_client_selection' | 'selections_submitted' | 'delivered';
  createdAt: string;
  updatedAt: string;
}

export interface FAQ {
  id: string;
  studioId?: string;
  question: string;
  answer: string;
  category: string;
  frequency?: number;
  createdAt: string;
}

export interface Promotion {
  id: string;
  studioId?: string;
  title: string;
  subtitle: string;
  discount: string;
  code: string;
  location: string;
  validUntil: string;
  description: string;
  image: string;
  badge: string;
  isActive: boolean;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  studioId?: string;
  title: string;
  message: string;
  isRead: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
  link?: string;
  channel?: 'in_app' | 'email';
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  timestamp: string;
  ipAddress?: string;
}

export type GearCategory = 'camera' | 'lens' | 'lighting' | 'audio' | 'accessory';
export type GearStatus = 'available' | 'in-use' | 'maintenance';

export interface StudioInventoryItem {
  id: string;
  studioId: string;
  name: string;
  brand: string;
  model: string;
  category: GearCategory;
  serialNumber?: string;
  status: GearStatus;
  locationRack?: string;
  assignedTo?: string;
  lastMaintenance?: string;
  notes?: string;
  purchaseDate?: string;
  condition?: 'mint' | 'good' | 'fair';
  createdAt: string;
  updatedAt?: string;
}

export interface StudioAvailability {
  id: string;
  studioId: string;
  dayOfWeek: number; // 0=Sun, 1=Mon, ..., 6=Sat
  openingTime: string; // "09:00"
  closingTime: string; // "18:00"
  isAvailable: boolean;
  slotDurationMinutes: number;
}

export interface AvailabilityBlackout {
  id: string;
  studioId: string;
  blackoutDate: string; // YYYY-MM-DD
  startTime?: string;
  endTime?: string;
  reason: string;
  isRecurring: boolean;
}

export interface CustomPageBlock {
  id: string;
  type: 'hero' | 'text' | 'gallery' | 'faq' | 'cta' | 'pricing';
  title?: string;
  subtitle?: string;
  content?: string;
  buttonText?: string;
  buttonLink?: string;
  imageUrl?: string;
  images?: string[];
  items?: { question?: string; answer?: string; title?: string; price?: string; description?: string }[];
}

export interface CustomPage {
  id: string;
  slug: string;
  title: string;
  blocks: CustomPageBlock[];
  content?: string;
  isPublished: boolean;
  showInNavbar: boolean;
  showInFooter?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface SystemSetting {
  id: string;
  key: string;
  value: string;
  description?: string;
  category?: string;
  updatedAt?: string;
}

export interface CMSSettings {
  heroTitle: string;
  heroSubtitle: string;
  heroBackground: string;
  aboutTitle: string;
  aboutDescription: string;
  featuresTitle: string;
  featuresSubtitle: string;
  demoVideoUrl?: string;
  audioUrl?: string;
  audioEnabled?: boolean;
}

export interface SystemTheme {
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  fontFamily: 'sans' | 'serif' | 'mono';
  headerStyle: 'modern' | 'minimal' | 'bold';
}

export interface SystemModules {
  chatbotEnabled: boolean;
  printStoreEnabled: boolean;
  bookingEnabled: boolean;
  mapEnabled: boolean;
  hiddenNavItems: string[];
}

export type CRMNoteCategory = 'preference' | 'vip' | 'style' | 'billing' | 'milestone' | 'general';

export interface StudioClientNote {
  id: string;
  studioId: string;
  clientEmail: string;
  note: string;
  category: CRMNoteCategory;
  authorName: string;
  createdAt: string;
}

export interface StudioClientCRM {
  id: string;
  customerId?: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  lifetimeValue: number;
  totalPaid: number;
  outstandingBalance: number;
  firstBookingDate: string;
  lastBookingDate: string;
  preferredServices: string[];
  tags: string[];
  notes: StudioClientNote[];
  bookings: Booking[];
}

export type ReminderType = 'downpayment_due' | 'balance_due';

export interface AutomatedReminderLog {
  id: string;
  studioId: string;
  bookingId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  reminderType: ReminderType;
  amountDue: number;
  bookingDate: string;
  timeSlot: string;
  serviceTitle: string;
  channels: ('in_app' | 'email' | 'sms')[];
  status: 'sent' | 'delivered';
  message: string;
  sentAt: string;
  triggeredBy: 'background_service' | 'manual';
}

export interface StudioReminderSettings {
  autoRemindersEnabled: boolean;
  checkIntervalSeconds: number;
  remindDownpaymentHoursBefore: number;
  remindBalanceDaysBefore: number;
  minHoursBetweenReminders: number;
  notifyViaInApp: boolean;
  notifyViaEmail: boolean;
  notifyViaSMS: boolean;
}

export interface ReminderCheckResult {
  checkedCount: number;
  unpaidDownpaymentsFound: number;
  unpaidBalancesFound: number;
  remindersSent: AutomatedReminderLog[];
  skippedCooldownCount: number;
  timestamp: string;
}

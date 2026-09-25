import fs from 'fs';
import path from 'path';
import type {
  User,
  Customer,
  Studio,
  Category,
  Service,
  Package,
  Addon,
  Booking,
  Payment,
  GCashQRSession,
  PrintProduct,
  PrintOrder,
  Review,
  PhotoProofing,
  FAQ,
  Notification,
  AuditLog,
  StudioAvailability,
  AvailabilityBlackout,
  CustomPage,
  CMSSettings,
  SystemTheme,
  SystemModules,
  StudioInventoryItem,
  StudioClientNote,
  AutomatedReminderLog,
  StudioReminderSettings,
  Promotion
} from './types.js';

export interface DatabaseStore {
  users: User[];
  customers: Customer[];
  studios: Studio[];
  categories: Category[];
  services: Service[];
  packages: Package[];
  addons: Addon[];
  bookings: Booking[];
  payments: Payment[];
  gcashSessions: GCashQRSession[];
  printProducts: PrintProduct[];
  printOrders: PrintOrder[];
  reviews: Review[];
  photoProofings: PhotoProofing[];
  faqs: FAQ[];
  promotions: Promotion[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  favorites: { id: string; customerId: string; studioId: string; createdAt: string }[];
  availability: StudioAvailability[];
  blackouts: AvailabilityBlackout[];
  customPages: CustomPage[];
  cmsSettings: CMSSettings;
  theme: SystemTheme;
  modules: SystemModules;
  inventory: StudioInventoryItem[];
  clientNotes: StudioClientNote[];
  reminderLogs: AutomatedReminderLog[];
  reminderSettings: Record<string, StudioReminderSettings>;
}

const DB_FILE_PATH = path.join(process.cwd(), 'db.json');

// Default initial state
const defaultStore: DatabaseStore = {
  users: [
    {
      id: 'usr_superadmin',
      email: 'superadmin@cainta-studios.ph',
      fullName: 'Chief Super Admin',
      role: 'SUPER_ADMIN',
      contactNumber: '+63 917 800 0001',
      address: 'Municipal Hall Complex, Cainta, Rizal',
      status: 'active',
      createdAt: '2025-01-01T08:00:00.000Z'
    },
    {
      id: 'usr_lumiere_owner',
      email: 'lumiere@cainta-studios.ph',
      fullName: 'Carlos Mendoza',
      role: 'STUDIO_ADMIN',
      studioId: 'std_lumiere',
      contactNumber: '+63 917 822 1010',
      address: 'Felix Ave, Cainta, Rizal',
      status: 'active',
      createdAt: '2025-01-10T08:00:00.000Z'
    },
    {
      id: 'usr_focusflare_owner',
      email: 'focusflare@cainta-studios.ph',
      fullName: 'Maria Santos-Reyes',
      role: 'STUDIO_ADMIN',
      studioId: 'std_focusflare',
      contactNumber: '+63 918 555 4321',
      address: 'A. Bonifacio Ave, Cainta Poblacion',
      status: 'active',
      createdAt: '2025-01-12T08:00:00.000Z'
    },
    {
      id: 'usr_lumiere_staff',
      email: 'staff@lumiere.ph',
      fullName: 'Juan Paolo Cruz',
      role: 'STUDIO_STAFF',
      studioId: 'std_lumiere',
      contactNumber: '+63 920 111 2233',
      address: 'San Isidro, Cainta, Rizal',
      status: 'active',
      createdAt: '2025-01-15T08:00:00.000Z'
    },
    {
      id: 'usr_customer_demo',
      email: 'customer@gmail.com',
      fullName: 'Bianca Dela Cruz',
      role: 'CUSTOMER',
      contactNumber: '+63 919 789 4567',
      address: 'Greenwoods Executive Village, Cainta, Rizal',
      status: 'active',
      createdAt: '2025-01-20T08:00:00.000Z'
    }
  ],
  customers: [
    {
      id: 'usr_customer_demo',
      email: 'customer@gmail.com',
      fullName: 'Bianca Dela Cruz',
      contactNumber: '+63 919 789 4567',
      address: 'Greenwoods Executive Village, Cainta, Rizal',
      createdAt: '2025-01-20T08:00:00.000Z'
    }
  ],
  studios: [
    {
      id: 'std_lumiere',
      name: 'Studio Lumiere Cainta',
      ownerId: 'usr_lumiere_owner',
      logo: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=240&auto=format&fit=crop&q=80',
      coverImage: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1200&auto=format&fit=crop&q=80',
      location: 'Felix Avenue, near Robinsons Place Cainta',
      rating: 4.9,
      reviewCount: 48,
      startingPrice: 1499,
      categories: ['Portrait Photography', 'Graduation Photography', 'Wedding Photography'],
      description: 'Premier studio equipped with Profoto lighting and high-end backdrops. Specializing in timeless graduation milestones, high-fashion portraits, and intimate wedding coverage.',
      address: '2nd Floor, V&M Building, Felix Ave, Brgy. San Isidro, Cainta, Rizal',
      contactInfo: '+63 917 822 1010 / hello@studiolumiere.ph',
      email: 'lumiere@cainta-studios.ph',
      businessHours: 'Mon - Sat: 9:00 AM - 7:00 PM | Sun: 10:00 AM - 5:00 PM',
      isApproved: true,
      status: 'approved',
      printingAvailable: true,
      latitude: 14.582,
      longitude: 121.115,
      gcashName: 'Studio Lumiere Cainta Inc.',
      gcashNumber: '09178221010',
      createdAt: '2025-01-10T08:00:00.000Z'
    },
    {
      id: 'std_focusflare',
      name: 'Focus & Flare Rizal',
      ownerId: 'usr_focusflare_owner',
      logo: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=240&auto=format&fit=crop&q=80',
      coverImage: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=1200&auto=format&fit=crop&q=80',
      location: 'A. Bonifacio Ave, Cainta Poblacion',
      rating: 4.8,
      reviewCount: 32,
      startingPrice: 899,
      categories: ['Self-Shoot Studio', 'Family Photography', 'Portrait Photography'],
      description: 'Cainta’s favorite self-shoot studio with wireless remote shutters, curated props, aesthetic backdrops, and instant high-res photo strip prints.',
      address: '88 A. Bonifacio Ave, Brgy. San Roque (near Cainta Church), Cainta, Rizal',
      contactInfo: '+63 918 555 4321 / shoot@focusandflare.ph',
      email: 'focusflare@cainta-studios.ph',
      businessHours: 'Tue - Sun: 10:00 AM - 8:00 PM',
      isApproved: true,
      status: 'approved',
      printingAvailable: true,
      latitude: 14.571,
      longitude: 121.118,
      gcashName: 'Maria Santos Reyes',
      gcashNumber: '09185554321',
      createdAt: '2025-01-12T08:00:00.000Z'
    },
    {
      id: 'std_masinag',
      name: 'Lumina Photo Studio Masinag',
      ownerId: 'usr_superadmin',
      logo: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=240&auto=format&fit=crop&q=80',
      coverImage: 'https://images.unsplash.com/photo-1471341971476-ae15ff5dd4ea?w=1200&auto=format&fit=crop&q=80',
      location: 'Marcos Highway / Masinag Corridor',
      rating: 4.7,
      reviewCount: 29,
      startingPrice: 699,
      categories: ['ID/Passport Photography', 'Graduation Photography', 'Family Photography'],
      description: 'Fast, government-compliant biometric passport and visa pictures, combined with dedicated air-conditioned studio spaces for family portraits.',
      address: 'LRT-2 Masinag Station Hub, Marcos Highway, Cainta/Antipolo Boundary',
      contactInfo: '+63 920 999 8877 / contact@luminamasinag.ph',
      email: 'masinag@cainta-studios.ph',
      businessHours: 'Daily: 8:30 AM - 7:30 PM',
      isApproved: true,
      status: 'approved',
      printingAvailable: true,
      latitude: 14.622,
      longitude: 121.121,
      gcashName: 'Lumina Masinag Services',
      gcashNumber: '09209998877',
      createdAt: '2025-01-14T08:00:00.000Z'
    },
    {
      id: 'std_arthouse',
      name: 'ArtHouse Studio Cainta',
      ownerId: 'usr_superadmin',
      logo: 'https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=240&auto=format&fit=crop&q=80',
      coverImage: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1200&auto=format&fit=crop&q=80',
      location: 'Ortigas Ave Extension, Cainta Junction',
      rating: 4.9,
      reviewCount: 41,
      startingPrice: 1999,
      categories: ['Wedding Photography', 'Portrait Photography'],
      description: 'Cinematic lighting, bespoke bridal sets, and high-end retouchers. We turn your intimate milestones into gallery-grade fine art.',
      address: 'Km. 17 Ortigas Ave Ext, Brgy. Sto. Domingo, Cainta, Rizal',
      contactInfo: '+63 927 345 6789 / info@arthousestudiocainta.com',
      email: 'arthouse@cainta-studios.ph',
      businessHours: 'Wed - Mon: 9:00 AM - 6:00 PM',
      isApproved: true,
      status: 'approved',
      printingAvailable: true,
      latitude: 14.586,
      longitude: 121.124,
      gcashName: 'ArtHouse Photography Studio',
      gcashNumber: '09273456789',
      createdAt: '2025-01-16T08:00:00.000Z'
    },
    {
      id: 'std_pending_velvet',
      name: 'Velvet Lens Studio Cainta',
      ownerId: 'usr_superadmin',
      logo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=240&auto=format&fit=crop&q=80',
      coverImage: 'https://images.unsplash.com/photo-1607462109225-6b64ae2dd3cb?w=1200&auto=format&fit=crop&q=80',
      location: 'Cainta Greenpark Village',
      rating: 5.0,
      reviewCount: 0,
      startingPrice: 1299,
      categories: ['Portrait Photography', 'Self-Shoot Studio'],
      description: 'Newly constructed cozy studio offering Scandinavian minimalist setups and baby milestone photography.',
      address: 'Phase 3, Cainta Greenpark Village, Cainta, Rizal',
      contactInfo: '+63 999 444 3322 / velvetlens@cainta.ph',
      email: 'velvetlens@cainta.ph',
      businessHours: 'Mon - Sat: 10:00 AM - 6:00 PM',
      isApproved: false,
      status: 'pending',
      printingAvailable: false,
      latitude: 14.593,
      longitude: 121.108,
      businessPermit: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80',
      validId: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80',
      otherDocs: ['DTI Certificate of Business Name Registration - Cainta, Rizal'],
      createdAt: '2025-02-01T08:00:00.000Z'
    }
  ],
  categories: [
    {
      id: 'cat_portrait',
      name: 'Portrait Photography',
      description: 'Professional close-up, corporate, creative headshots and profile pictures.',
      createdAt: '2025-01-01T08:00:00.000Z'
    },
    {
      id: 'cat_graduation',
      name: 'Graduation Photography',
      description: 'Celebrate academic milestones with premium toga, cap, hood, and gown sessions.',
      createdAt: '2025-01-01T08:00:00.000Z'
    },
    {
      id: 'cat_wedding',
      name: 'Wedding Photography',
      description: 'Timeless visual storytelling of your nuptial vows, prenup shoots, and receptions.',
      createdAt: '2025-01-01T08:00:00.000Z'
    },
    {
      id: 'cat_family',
      name: 'Family Photography',
      description: 'Cherish precious bonding moments and generational portraits in crisp frames.',
      createdAt: '2025-01-01T08:00:00.000Z'
    },
    {
      id: 'cat_selfshoot',
      name: 'Self-Shoot Studio',
      description: 'Express yourself freely behind a private clicker with studio flash and props.',
      createdAt: '2025-01-01T08:00:00.000Z'
    },
    {
      id: 'cat_id',
      name: 'ID/Passport Photography',
      description: 'Official, embassy and DFA compliant biometric photos in instant minutes.',
      createdAt: '2025-01-01T08:00:00.000Z'
    }
  ],
  services: [
    {
      id: 'srv_lum_portrait',
      studioId: 'std_lumiere',
      name: 'Executive Studio Portrait',
      description: 'Full studio lighting setup with 2 backdrop changes, professional posing assistance, and high-frequency separation skin retouching.',
      category: 'Portrait Photography',
      basePrice: 1499,
      durationMinutes: 45,
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
      isActive: true,
      availableDays: [1, 2, 3, 4, 5, 6],
      availableSlots: ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'],
      requirements: 'Please bring your corporate attire or chosen outfit. Arrive 15 minutes before the session.',
      createdAt: '2025-01-10T08:00:00.000Z'
    },
    {
      id: 'srv_lum_grad',
      studioId: 'std_lumiere',
      name: 'Prestige Graduation Milestone Session',
      description: 'Complete academic regalia session with authentic university togas, hood, cap, diploma tube, and family portrait add-on inclusion.',
      category: 'Graduation Photography',
      basePrice: 2499,
      durationMinutes: 60,
      image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80',
      isActive: true,
      availableDays: [1, 2, 3, 4, 5, 6, 0],
      availableSlots: ['09:30', '11:00', '13:30', '15:00', '16:30'],
      requirements: 'Indicate your school and college degree for matching hood color scheme.',
      createdAt: '2025-01-10T08:00:00.000Z'
    },
    {
      id: 'srv_ff_selfshoot',
      studioId: 'std_focusflare',
      name: 'Unlimited Duo Self-Shoot Session',
      description: '30 minutes of unlimited clicker shots for 2 people with complete access to funny and aesthetic props, plus 2 high-res print strips.',
      category: 'Self-Shoot Studio',
      basePrice: 899,
      durationMinutes: 30,
      image: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&auto=format&fit=crop&q=80',
      isActive: true,
      availableDays: [2, 3, 4, 5, 6, 0],
      availableSlots: ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'],
      requirements: 'Come ready in your favorite casual, streetwear, or retro outfits!',
      createdAt: '2025-01-12T08:00:00.000Z'
    },
    {
      id: 'srv_ff_family',
      studioId: 'std_focusflare',
      name: 'Warm Hearth Family Gathering Shoot',
      description: 'Capture multigenerational joy with up to 8 family members. Includes both posed group portraits and candid laughter shots.',
      category: 'Family Photography',
      basePrice: 2200,
      durationMinutes: 60,
      image: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&auto=format&fit=crop&q=80',
      isActive: true,
      availableDays: [5, 6, 0],
      availableSlots: ['10:30', '13:00', '15:00', '17:00'],
      requirements: 'Color coordinated neutral or earthy wardrobe recommended.',
      createdAt: '2025-01-12T08:00:00.000Z'
    },
    {
      id: 'srv_mas_id',
      studioId: 'std_masinag',
      name: 'Express Biometric Passport & Visa Package',
      description: 'ISO-compliant lighting and framing for DFA, US Visa, Schengen, PRC, and Corporate IDs with digital copy emailed instantly.',
      category: 'ID/Passport Photography',
      basePrice: 350,
      durationMinutes: 15,
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80',
      isActive: true,
      availableDays: [1, 2, 3, 4, 5, 6, 0],
      availableSlots: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00'],
      requirements: 'Wear dark-collared shirts for passport compliance (no sleeveless, no colored contacts).',
      createdAt: '2025-01-14T08:00:00.000Z'
    },
    {
      id: 'srv_art_bridal',
      studioId: 'std_arthouse',
      name: 'Fine-Art Bridal & Prenup Studio Session',
      description: 'Editorial-grade pre-wedding shoot featuring three distinct architectural studio setups, custom floral arches, and magazine-quality color grading.',
      category: 'Wedding Photography',
      basePrice: 5500,
      durationMinutes: 120,
      image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80',
      isActive: true,
      availableDays: [1, 3, 4, 5, 6],
      availableSlots: ['10:00', '13:30', '16:00'],
      requirements: 'Moodboard submission recommended at least 3 days prior.',
      createdAt: '2025-01-16T08:00:00.000Z'
    }
  ],
  packages: [
    {
      id: 'pkg_lum_gold',
      studioId: 'std_lumiere',
      name: 'Lumiere Signature Milestone Package',
      description: 'The ultimate all-inclusive package with hair & makeup artist, 3 outfit changes, and a deluxe framed canvas print.',
      price: 4999,
      durationMinutes: 90,
      editedPhotosCount: 15,
      includedPrints: '1pc 12x18 Framed Canvas + 4pcs 5R Prints + 8pcs Wallet Size',
      photographerCount: 2,
      includedServices: ['HMUA touchup', 'Raw files copy via Google Drive', 'Studio Props access'],
      termsAndConditions: 'Rescheduling allowed up to 48 hours before shoot date. 30% downpayment required to secure time slot.',
      image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&auto=format&fit=crop&q=80',
      isActive: true,
      createdAt: '2025-01-10T08:00:00.000Z'
    },
    {
      id: 'pkg_ff_group',
      studioId: 'std_focusflare',
      name: 'Focus & Flare Squad Blowout',
      description: 'Up to 6 friends with 45 minutes unlimited clicker shooting, GIF maker booth, and 6 customized photo cards.',
      price: 1899,
      durationMinutes: 45,
      editedPhotosCount: 20,
      includedPrints: '6pcs Bookmark Photo Strips + 2pcs 4R Prints',
      photographerCount: 1,
      includedServices: ['Digital copy of all raw shots', 'Access to sunglass and hat props'],
      termsAndConditions: 'Please keep studio tidy and avoid stepping on backdrop seams.',
      image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&auto=format&fit=crop&q=80',
      isActive: true,
      createdAt: '2025-01-12T08:00:00.000Z'
    }
  ],
  addons: [
    {
      id: 'add_hmua',
      studioId: 'std_lumiere',
      name: 'Professional Hair & Makeup Artist',
      price: 1200,
      description: 'Full face airbrush makeup and hair styling suited to studio lights.',
      createdAt: '2025-01-10T08:00:00.000Z'
    },
    {
      id: 'add_raw_files',
      studioId: 'std_lumiere',
      name: 'All High-Res Raw Softcopies',
      price: 500,
      description: 'Receive full unedited digital files via Google Drive link within 24 hours.',
      createdAt: '2025-01-10T08:00:00.000Z'
    },
    {
      id: 'add_extra_person',
      studioId: 'std_focusflare',
      name: 'Additional Person / Pet',
      price: 250,
      description: 'Include one extra person or pet into your session with extra print strip.',
      createdAt: '2025-01-12T08:00:00.000Z'
    },
    {
      id: 'add_wooden_frame',
      studioId: 'std_focusflare',
      name: 'Nordic Wooden Desk Frame (5x7)',
      price: 350,
      description: 'Solid oak tabletop photo frame with matte glass finish.',
      createdAt: '2025-01-12T08:00:00.000Z'
    }
  ],
  bookings: [
    {
      id: 'bkg_20250210_01',
      studioId: 'std_lumiere',
      customerId: 'usr_customer_demo',
      serviceId: 'srv_lum_portrait',
      bookingDate: '2025-02-15',
      timeSlot: '14:00',
      addons: [{ addonId: 'add_raw_files', name: 'All High-Res Raw Softcopies', price: 500, quantity: 1 }],
      customerName: 'Bianca Dela Cruz',
      customerEmail: 'customer@gmail.com',
      customerPhone: '+63 919 789 4567',
      customerNotes: 'Need formal profile picture for corporate LinkedIn and company annual report.',
      status: 'Confirmed',
      totalAmount: 1999,
      amountPaid: 600,
      downPaymentAmount: 600,
      remainingBalance: 1399,
      paymentStatus: 'downpayment_paid',
      finalPaymentStatus: 'unpaid',
      paymentOption: 'downpayment',
      paymentDueAt: '2025-02-14T23:59:59.000Z',
      checklist: [
        { item: 'Lighting check (key + rim)', completed: true },
        { item: 'Client wardrobe inspect', completed: true },
        { item: 'Backdrop cleaned', completed: false }
      ],
      createdAt: '2025-02-10T09:30:00.000Z'
    },
    {
      id: 'bkg_20250205_02',
      studioId: 'std_lumiere',
      customerId: 'usr_customer_demo',
      serviceId: 'srv_lum_grad',
      bookingDate: '2025-02-08',
      timeSlot: '11:00',
      addons: [],
      customerName: 'Bianca Dela Cruz',
      customerEmail: 'customer@gmail.com',
      customerPhone: '+63 919 789 4567',
      customerNotes: 'Graduation shoot with parents.',
      status: 'Completed',
      totalAmount: 2499,
      amountPaid: 2499,
      downPaymentAmount: 750,
      remainingBalance: 0,
      paymentStatus: 'fully_paid',
      finalPaymentStatus: 'paid',
      paymentOption: 'full',
      paymentDueAt: '2025-02-06T23:59:59.000Z',
      createdAt: '2025-02-01T14:15:00.000Z'
    },
    {
      id: 'bkg_20250212_03',
      studioId: 'std_focusflare',
      customerId: 'usr_customer_demo',
      serviceId: 'srv_ff_selfshoot',
      bookingDate: '2025-02-20',
      timeSlot: '15:00',
      addons: [],
      customerName: 'Bianca Dela Cruz',
      customerEmail: 'customer@gmail.com',
      customerPhone: '+63 919 789 4567',
      customerNotes: 'Best friends photoshoot celebration.',
      status: 'Awaiting Payment',
      totalAmount: 899,
      amountPaid: 0,
      downPaymentAmount: 270,
      remainingBalance: 899,
      paymentStatus: 'unpaid',
      finalPaymentStatus: 'unpaid',
      paymentOption: 'downpayment',
      paymentDueAt: '2025-02-19T15:00:00.000Z',
      createdAt: '2025-02-12T10:00:00.000Z'
    }
  ],
  payments: [
    {
      id: 'pay_001',
      bookingId: 'bkg_20250210_01',
      studioId: 'std_lumiere',
      customerId: 'usr_customer_demo',
      amount: 600,
      paymentType: 'downpayment',
      paymentMethod: 'gcash',
      paymentStatus: 'verified',
      proofOfPayment: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
      referenceNumber: 'GCASH-9823471012',
      gatewayTransactionId: 'pay_qr_99218201',
      paymentDate: '2025-02-10T10:00:00.000Z',
      reviewedBy: 'Carlos Mendoza',
      reviewedAt: '2025-02-10T10:15:00.000Z',
      createdAt: '2025-02-10T10:00:00.000Z'
    },
    {
      id: 'pay_002',
      bookingId: 'bkg_20250205_02',
      studioId: 'std_lumiere',
      customerId: 'usr_customer_demo',
      amount: 2499,
      paymentType: 'full',
      paymentMethod: 'gcash',
      paymentStatus: 'verified',
      referenceNumber: 'GCASH-7718293041',
      gatewayTransactionId: 'pay_qr_55219902',
      paymentDate: '2025-02-01T15:00:00.000Z',
      reviewedBy: 'Carlos Mendoza',
      reviewedAt: '2025-02-01T15:20:00.000Z',
      createdAt: '2025-02-01T15:00:00.000Z'
    }
  ],
  gcashSessions: [],
  printProducts: [
    {
      id: 'prod_canvas_12x18',
      studioId: 'std_lumiere',
      name: 'Fine-Art Gallery Canvas Wrap (12" x 18")',
      description: 'Archival grade 380gsm cotton canvas stretched on kiln-dried pine wood frame. UV resistant and ready to hang.',
      size: '12 x 18 inches',
      price: 1850,
      image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80',
      inStock: true,
      estimatedHours: 48,
      isActive: true,
      createdAt: '2025-01-10T08:00:00.000Z'
    },
    {
      id: 'prod_acrylic_8x10',
      studioId: 'std_lumiere',
      name: 'High-Gloss Crystal Acrylic Block (8" x 10")',
      description: 'Sleek freestanding crystal clear acrylic display. High depth visual impact with beveled polished edges.',
      size: '8 x 10 inches',
      price: 1450,
      image: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
      inStock: true,
      estimatedHours: 72,
      isActive: true,
      createdAt: '2025-01-10T08:00:00.000Z'
    },
    {
      id: 'prod_photobook_20p',
      studioId: 'std_lumiere',
      name: 'Hardcover Layflat Keepsake Album (20 Pages)',
      description: 'Lustre photo paper mounted on rigid boards with metallic embossed title cover. The definitive heirloom piece.',
      size: '8.5 x 11 inches',
      price: 3200,
      image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
      inStock: true,
      estimatedHours: 120,
      isActive: true,
      createdAt: '2025-01-10T08:00:00.000Z'
    },
    {
      id: 'prod_wallet_set8',
      studioId: 'std_focusflare',
      name: 'Laminated Wallet Cards (Set of 8)',
      description: 'Waterproof matte or glossy wallet prints perfect for IDs, family keepsakes, and gift giving.',
      size: '2.5 x 3.5 inches',
      price: 190,
      image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80',
      inStock: true,
      estimatedHours: 24,
      isActive: true,
      createdAt: '2025-01-12T08:00:00.000Z'
    }
  ],
  printOrders: [
    {
      id: 'pord_001',
      studioId: 'std_lumiere',
      customerId: 'usr_customer_demo',
      productId: 'prod_canvas_12x18',
      quantity: 1,
      uploadedPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
      status: 'Processing',
      totalAmount: 1850,
      paymentMethod: 'gcash',
      paymentStatus: 'verified',
      referenceNumber: 'GCASH-4491028301',
      shippingAddress: 'Greenwoods Executive Village, Cainta, Rizal',
      notes: 'Please ensure colors match warm tones.',
      createdAt: '2025-02-09T11:00:00.000Z'
    }
  ],
  reviews: [
    {
      id: 'rev_001',
      studioId: 'std_lumiere',
      customerId: 'usr_customer_demo',
      customerName: 'Bianca Dela Cruz',
      bookingId: 'bkg_20250205_02',
      rating: 5,
      comment: 'Super fast and helpful photographers! The lighting at Studio Lumiere made our graduation photos look like they belong on a magazine cover. Will definitely book again!',
      status: 'approved',
      isVisible: true,
      reply: 'Maraming salamat Bianca! It was an honor capturing your milestone. Congratulations on your graduation!',
      replyAt: '2025-02-09T14:30:00.000Z',
      createdAt: '2025-02-09T10:00:00.000Z'
    },
    {
      id: 'rev_002',
      studioId: 'std_focusflare',
      customerId: 'usr_customer_demo',
      customerName: 'Aira Gomez',
      rating: 5,
      comment: 'Super fun self shoot session! The clicker is wireless and the props are very cute. The prints were handed to us in under 5 minutes.',
      status: 'approved',
      isVisible: true,
      createdAt: '2025-02-02T16:00:00.000Z'
    }
  ],
  photoProofings: [
    {
      id: 'prf_001',
      bookingId: 'bkg_20250205_02',
      studioId: 'std_lumiere',
      customerId: 'usr_customer_demo',
      photos: [
        {
          id: 'ph_1',
          url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80',
          isStarred: true,
          clientFeedback: 'Please smooth flyaway hair on the left side.',
          originalName: 'IMG_4812_proof.jpg'
        },
        {
          id: 'ph_2',
          url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
          isStarred: true,
          clientFeedback: 'Love this smile! Ready for framing.',
          originalName: 'IMG_4815_proof.jpg'
        },
        {
          id: 'ph_3',
          url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80',
          isStarred: false,
          clientFeedback: '',
          originalName: 'IMG_4820_proof.jpg'
        }
      ],
      watermarkText: 'STUDIO LUMIERE PROOF',
      watermarkPosition: 'repeat_diagonal',
      watermarkOpacity: 0.35,
      finalDriveLink: 'https://drive.google.com/drive/folders/sample-cainta-studio-milestones',
      status: 'selections_submitted',
      createdAt: '2025-02-08T18:00:00.000Z',
      updatedAt: '2025-02-09T12:00:00.000Z'
    }
  ],
  faqs: [
    {
      id: 'faq_01',
      question: 'How do I book a photography studio session in Cainta?',
      answer: 'Browse the Studio Directory, select your favorite Cainta accredited studio, choose your desired service and time slot, and confirm your reservation with a 30% GCash or cash downpayment.',
      category: 'Booking',
      frequency: 14,
      createdAt: '2025-01-01T08:00:00.000Z'
    },
    {
      id: 'faq_02',
      question: 'Can I pay via GCash QR Ph in real time?',
      answer: 'Yes! When selecting GCash at checkout, a dynamic QR Ph code is generated instantly. Once scanned using your GCash app, our system confirms your reservation in real-time via payment push notifications.',
      category: 'Payments',
      frequency: 11,
      createdAt: '2025-01-01T08:00:00.000Z'
    },
    {
      id: 'faq_03',
      question: 'What is the cancellation and rescheduling policy?',
      answer: 'You may reschedule up to 48 hours before your booking date without penalty. Cancellations within 24 hours are subject to studio terms.',
      category: 'Policy',
      frequency: 8,
      createdAt: '2025-01-01T08:00:00.000Z'
    },
    {
      id: 'faq_04',
      question: 'How do photo proofing and print store orders work?',
      answer: 'After your session, the studio uploads watermarked previews to your Photo Proofing tab. You star your favorite images, write retouch notes, and can also order acrylic or canvas prints directly.',
      category: 'Prints & Proofing',
      frequency: 9,
      createdAt: '2025-01-01T08:00:00.000Z'
    }
  ],
  notifications: [
    {
      id: 'notif_001',
      userId: 'usr_customer_demo',
      studioId: 'std_lumiere',
      title: 'Booking Confirmed!',
      message: 'Your booking for Executive Studio Portrait on Feb 15, 2025 at 14:00 has been confirmed.',
      isRead: false,
      type: 'success',
      createdAt: '2025-02-10T10:15:00.000Z'
    }
  ],
  auditLogs: [
    {
      id: 'aud_001',
      userId: 'usr_superadmin',
      userEmail: 'superadmin@cainta-studios.ph',
      action: 'SYSTEM_BOOT',
      entityType: 'SYSTEM',
      entityId: 'cainta-mis-core',
      timestamp: '2025-01-01T08:00:00.000Z',
      ipAddress: '127.0.0.1'
    }
  ],
  favorites: [
    {
      id: 'fav_001',
      customerId: 'usr_customer_demo',
      studioId: 'std_lumiere',
      createdAt: '2025-02-01T12:00:00.000Z'
    }
  ],
  availability: [
    { id: 'av_1', studioId: 'std_lumiere', dayOfWeek: 1, openingTime: '09:00', closingTime: '19:00', isAvailable: true, slotDurationMinutes: 60 },
    { id: 'av_2', studioId: 'std_lumiere', dayOfWeek: 2, openingTime: '09:00', closingTime: '19:00', isAvailable: true, slotDurationMinutes: 60 },
    { id: 'av_3', studioId: 'std_lumiere', dayOfWeek: 3, openingTime: '09:00', closingTime: '19:00', isAvailable: true, slotDurationMinutes: 60 },
    { id: 'av_4', studioId: 'std_lumiere', dayOfWeek: 4, openingTime: '09:00', closingTime: '19:00', isAvailable: true, slotDurationMinutes: 60 },
    { id: 'av_5', studioId: 'std_lumiere', dayOfWeek: 5, openingTime: '09:00', closingTime: '19:00', isAvailable: true, slotDurationMinutes: 60 },
    { id: 'av_6', studioId: 'std_lumiere', dayOfWeek: 6, openingTime: '09:00', closingTime: '19:00', isAvailable: true, slotDurationMinutes: 60 },
    { id: 'av_7', studioId: 'std_lumiere', dayOfWeek: 0, openingTime: '10:00', closingTime: '17:00', isAvailable: true, slotDurationMinutes: 60 }
  ],
  blackouts: [
    {
      id: 'blk_1',
      studioId: 'std_lumiere',
      blackoutDate: '2025-12-25',
      startTime: '00:00',
      endTime: '23:59',
      reason: 'Christmas Holiday Studio Maintenance',
      isRecurring: true
    }
  ],
  customPages: [
    {
      id: 'page_guidelines',
      slug: 'studio-guidelines',
      title: 'Studio Guidelines & Dress Code',
      isPublished: true,
      showInNavbar: true,
      createdAt: '2025-01-05T08:00:00.000Z',
      blocks: [
        {
          id: 'blk_hero',
          type: 'hero',
          title: 'Studio Etiquette & Preparations',
          subtitle: 'Tips to make your Cainta studio portrait session memorable and seamless.',
          imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1200&auto=format&fit=crop&q=80'
        },
        {
          id: 'blk_text',
          type: 'text',
          content: 'We take pride in delivering pristine studio lighting and comfort across all accredited Cainta studios. Please review the following checklist: Arrive 15 minutes ahead of your booking, bring outfit changes on hangers to avoid wrinkles, and ensure makeup is matte-finished to reduce specular hotspots under Profoto strobes.'
        },
        {
          id: 'blk_pricing',
          type: 'pricing',
          items: [
            { title: 'Wardrobe Steam Pressing', price: '₱150', description: 'Steam ironing service before your studio session' },
            { title: 'Additional Studio Hour', price: '₱800', description: 'Extend your shoot time subject to room availability' },
            { title: 'Rush 24-Hour Retouching', price: '₱400', description: 'Fast-tracked priority delivery of edited images' }
          ]
        }
      ]
    }
  ],
  cmsSettings: {
    heroTitle: 'Frame Your Story. <br /> Book Cainta Studios.',
    heroSubtitle: 'Discover accredited photography studios in Cainta, Rizal. Book verified portrait sessions, order fine-art prints, and manage photo proofing seamlessly.',
    heroBackground: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1600&auto=format&fit=crop&q=80',
    aboutTitle: 'Pristine Studio Lighting & Retouching',
    aboutDescription: 'Experience the difference of calibrated Profoto strobes, curated backdrops, and experienced local photographers in Cainta. From graduation celebrations and wedding prenups to quick biometric IDs and fun self-shoot clickers.',
    featuresTitle: 'Spotlight Studios in Cainta, Rizal',
    featuresSubtitle: 'Explore photography styles and packages suited to your milestones.',
    demoVideoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    audioUrl: '/Cainta Photography Studio.mp3',
    audioEnabled: true
  },
  theme: {
    primaryColor: '#2c2a29',
    accentColor: '#d97706',
    backgroundColor: '#faf9f6',
    fontFamily: 'sans',
    headerStyle: 'modern'
  },
  modules: {
    chatbotEnabled: true,
    printStoreEnabled: true,
    bookingEnabled: true,
    mapEnabled: true,
    hiddenNavItems: []
  },
  inventory: [
    // Cameras
    {
      id: 'inv_cam_001',
      studioId: 'std_lumiere',
      name: 'Sony Alpha 7 IV (Body A)',
      brand: 'Sony',
      model: 'ILCE-7M4',
      category: 'camera',
      serialNumber: 'SN-SNY-774912',
      status: 'available',
      locationRack: 'Bay 1 Locker Shelf A',
      condition: 'mint',
      purchaseDate: '2024-03-15',
      lastMaintenance: '2026-08-10',
      notes: 'Main studio full-frame portrait body. Dual slot configured.',
      createdAt: '2025-01-10T08:00:00.000Z'
    },
    {
      id: 'inv_cam_002',
      studioId: 'std_lumiere',
      name: 'Canon EOS R5 (High-Res 45MP)',
      brand: 'Canon',
      model: 'EOS R5',
      category: 'camera',
      serialNumber: 'SN-CAN-882319',
      status: 'in-use',
      locationRack: 'Studio Bay 1 (Main Set)',
      assignedTo: 'Studio Bay 1 - Graduation Session',
      condition: 'mint',
      purchaseDate: '2024-06-20',
      lastMaintenance: '2026-07-25',
      notes: 'Dedicated for commercial graduations and fine-art portraits.',
      createdAt: '2025-01-10T08:00:00.000Z'
    },
    {
      id: 'inv_cam_003',
      studioId: 'std_lumiere',
      name: 'Fujifilm X-T5 (Film Sim Retro)',
      brand: 'Fujifilm',
      model: 'X-T5 Black',
      category: 'camera',
      serialNumber: 'SN-FUJ-443910',
      status: 'available',
      locationRack: 'Bay 2 Cabinet #3',
      condition: 'good',
      purchaseDate: '2024-11-05',
      lastMaintenance: '2026-09-02',
      notes: 'Popular for creative color grading and social self-shoots.',
      createdAt: '2025-01-10T08:00:00.000Z'
    },
    {
      id: 'inv_cam_004',
      studioId: 'std_lumiere',
      name: 'Sony Alpha 7 III (Backup Body)',
      brand: 'Sony',
      model: 'ILCE-7M3',
      category: 'camera',
      serialNumber: 'SN-SNY-312984',
      status: 'maintenance',
      locationRack: 'Workshop Bench (Cainta Tech)',
      condition: 'fair',
      purchaseDate: '2023-08-14',
      lastMaintenance: '2026-09-18',
      notes: 'Undergoing sensor wet cleaning and shutter calibration check.',
      createdAt: '2025-01-10T08:00:00.000Z'
    },

    // Lenses
    {
      id: 'inv_len_001',
      studioId: 'std_lumiere',
      name: 'Sony FE 24-70mm f/2.8 GM II',
      brand: 'Sony',
      model: 'SEL2470GM2',
      category: 'lens',
      serialNumber: 'SN-LNS-991201',
      status: 'in-use',
      locationRack: 'Studio Bay 1 (Main Set)',
      assignedTo: 'Studio Bay 1 - Graduation Session',
      condition: 'mint',
      purchaseDate: '2024-04-10',
      lastMaintenance: '2026-08-12',
      notes: 'Primary walk-around workhorse zoom lens.',
      createdAt: '2025-01-10T08:00:00.000Z'
    },
    {
      id: 'inv_len_002',
      studioId: 'std_lumiere',
      name: 'Canon RF 85mm f/1.2L USM',
      brand: 'Canon',
      model: 'RF85mm F1.2 L',
      category: 'lens',
      serialNumber: 'SN-LNS-552391',
      status: 'available',
      locationRack: 'Glass Cabinet B-1',
      condition: 'mint',
      purchaseDate: '2024-07-15',
      lastMaintenance: '2026-07-20',
      notes: 'Creamy bokeh portrait prime with Blue Spectrum Refractive optics.',
      createdAt: '2025-01-10T08:00:00.000Z'
    },
    {
      id: 'inv_len_003',
      studioId: 'std_lumiere',
      name: 'Sony FE 50mm f/1.2 GM Prime',
      brand: 'Sony',
      model: 'SEL50F12GM',
      category: 'lens',
      serialNumber: 'SN-LNS-663812',
      status: 'available',
      locationRack: 'Glass Cabinet B-2',
      condition: 'mint',
      purchaseDate: '2024-09-01',
      lastMaintenance: '2026-08-01',
      notes: 'Standard prime for editorial half-body portraits.',
      createdAt: '2025-01-10T08:00:00.000Z'
    },
    {
      id: 'inv_len_004',
      studioId: 'std_lumiere',
      name: 'Sigma 35mm f/1.4 DG DN Art',
      brand: 'Sigma',
      model: '35mm F1.4 Art (E-mount)',
      category: 'lens',
      serialNumber: 'SN-SIG-112940',
      status: 'maintenance',
      locationRack: 'Dry Box Shelf C',
      condition: 'good',
      purchaseDate: '2023-11-20',
      lastMaintenance: '2026-09-15',
      notes: 'Front element cleaning and micro-focus tuning in progress.',
      createdAt: '2025-01-10T08:00:00.000Z'
    },
    {
      id: 'inv_len_005',
      studioId: 'std_lumiere',
      name: 'Canon RF 70-200mm f/2.8L IS USM',
      brand: 'Canon',
      model: 'RF70-200mm F2.8 L',
      category: 'lens',
      serialNumber: 'SN-CAN-702001',
      status: 'available',
      locationRack: 'Glass Cabinet B-3',
      condition: 'mint',
      purchaseDate: '2025-02-10',
      lastMaintenance: '2026-08-20',
      notes: 'Compact telephoto zoom for runway and compression shots.',
      createdAt: '2025-02-10T08:00:00.000Z'
    },

    // Lighting Equipment
    {
      id: 'inv_lgt_001',
      studioId: 'std_lumiere',
      name: 'Godox AD600Pro All-in-One Strobe',
      brand: 'Godox',
      model: 'AD600Pro (Bowens)',
      category: 'lighting',
      serialNumber: 'SN-GDX-600122',
      status: 'in-use',
      locationRack: 'Studio Bay 1 (Main C-Stand)',
      assignedTo: 'Studio Bay 1 - Key Light Softbox',
      condition: 'good',
      purchaseDate: '2024-01-15',
      lastMaintenance: '2026-08-15',
      notes: '600Ws TTL strobe paired with 120cm Octabox.',
      createdAt: '2025-01-10T08:00:00.000Z'
    },
    {
      id: 'inv_lgt_002',
      studioId: 'std_lumiere',
      name: 'Profoto B10X Plus Monolight (500Ws)',
      brand: 'Profoto',
      model: 'B10X Plus AirX',
      category: 'lighting',
      serialNumber: 'SN-PRF-500918',
      status: 'available',
      locationRack: 'Lighting Bay Stand 2',
      condition: 'mint',
      purchaseDate: '2024-05-18',
      lastMaintenance: '2026-07-30',
      notes: 'Color temperature stable flash head with continuous bi-color LED.',
      createdAt: '2025-01-10T08:00:00.000Z'
    },
    {
      id: 'inv_lgt_003',
      studioId: 'std_lumiere',
      name: 'Nanlite Forza 300B II Bi-Color LED',
      brand: 'Nanlite',
      model: 'Forza 300B II',
      category: 'lighting',
      serialNumber: 'SN-NL-300088',
      status: 'available',
      locationRack: 'Video Lighting Rack',
      condition: 'mint',
      purchaseDate: '2024-10-12',
      lastMaintenance: '2026-09-01',
      notes: 'Continuous video and creative portrait backlight with Fresnel lens.',
      createdAt: '2025-01-10T08:00:00.000Z'
    },
    {
      id: 'inv_lgt_004',
      studioId: 'std_lumiere',
      name: 'Aputure Amaran 200d S Daylight LED',
      brand: 'Aputure',
      model: 'Amaran 200d S',
      category: 'lighting',
      serialNumber: 'SN-APT-200902',
      status: 'available',
      locationRack: 'Locker Shelf D',
      condition: 'good',
      purchaseDate: '2024-02-28',
      lastMaintenance: '2026-06-15',
      notes: 'High CRI 96+ continuous key light for biometric ID portraits.',
      createdAt: '2025-01-10T08:00:00.000Z'
    },
    {
      id: 'inv_lgt_005',
      studioId: 'std_lumiere',
      name: 'Godox V1 Round-Head Flash (Trigger/Fill)',
      brand: 'Godox',
      model: 'V1-S (Sony TTL)',
      category: 'lighting',
      serialNumber: 'SN-GDX-119280',
      status: 'maintenance',
      locationRack: 'Repair Bin / Desk',
      condition: 'fair',
      purchaseDate: '2023-09-10',
      lastMaintenance: '2026-09-20',
      notes: 'Li-ion battery latch loose; replacement door ordered.',
      createdAt: '2025-01-10T08:00:00.000Z'
    }
  ],
  clientNotes: [
    {
      id: 'cn_001',
      studioId: 'std_lumiere',
      clientEmail: 'customer@gmail.com',
      note: 'Prefers dramatic Rembrandt lighting with Profoto softbox. Needs warm color grading for corporate headshots.',
      category: 'preference',
      authorName: 'Studio Lumiere Lead',
      createdAt: '2025-02-10T11:00:00.000Z'
    },
    {
      id: 'cn_002',
      studioId: 'std_lumiere',
      clientEmail: 'customer@gmail.com',
      note: 'VIP returning corporate client from Greenwoods Cainta. Inquired about booking 2026 family Christmas portrait mini-sessions.',
      category: 'vip',
      authorName: 'Studio Lumiere Lead',
      createdAt: '2025-02-11T16:30:00.000Z'
    }
  ],
  reminderLogs: [
    {
      id: 'rem_001',
      studioId: 'std_lumiere',
      bookingId: 'bkg_20250210_01',
      customerId: 'usr_customer_demo',
      customerName: 'Bianca Dela Cruz',
      customerEmail: 'customer@gmail.com',
      customerPhone: '+63 919 789 4567',
      reminderType: 'balance_due',
      amountDue: 1399,
      bookingDate: '2025-02-15',
      timeSlot: '14:00',
      serviceTitle: 'Executive Studio Portrait',
      channels: ['in_app', 'email', 'sms'],
      status: 'delivered',
      message: 'Friendly reminder from Studio Lumiere: Remaining balance of ₱1,399 for Executive Studio Portrait is due before or upon shoot day.',
      sentAt: '2025-02-13T09:00:00.000Z',
      triggeredBy: 'background_service'
    }
  ],
  reminderSettings: {
    std_lumiere: {
      autoRemindersEnabled: true,
      checkIntervalSeconds: 60,
      remindDownpaymentHoursBefore: 48,
      remindBalanceDaysBefore: 3,
      minHoursBetweenReminders: 12,
      notifyViaInApp: true,
      notifyViaEmail: true,
      notifyViaSMS: true
    }
  },
  promotions: [
    {
      id: 'promo-1',
      studioId: 'std_lumiere',
      title: 'Cainta Fiesta & Summer Portrait Special',
      subtitle: 'Felix Avenue Photography Hubs',
      discount: '20% OFF',
      code: 'CAINTASUMMER20',
      location: 'Felix Ave, Cainta',
      validUntil: 'October 31, 2026',
      description: 'Enjoy 20% off all graduation portrait, professional headshot, and family studio packages along Felix Avenue.',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80',
      badge: 'Seasonal Feature',
      isActive: true,
      createdAt: '2025-01-01T08:00:00.000Z'
    },
    {
      id: 'promo-2',
      studioId: 'std_arthouse',
      title: 'Ortigas Extension Wedding & Debut Holiday Bundle',
      subtitle: 'Ortigas Ave Extension Corridor',
      discount: 'Free Drone & Reel',
      code: 'ORTIGASWEDDING',
      location: 'Ortigas Ext, Cainta',
      validUntil: 'December 20, 2026',
      description: 'Book full-day wedding or 18th birthday coverage with premier Cainta studios and receive complimentary drone aerial cinematography.',
      image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
      badge: 'Holiday Offer',
      isActive: true,
      createdAt: '2025-01-01T08:00:00.000Z'
    }
  ]
};

class Database {
  private store: DatabaseStore;

  constructor() {
    this.store = this.load();
  }

  private load(): DatabaseStore {
    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const data = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(data);
        return {
          ...defaultStore,
          ...parsed,
          cmsSettings: { ...defaultStore.cmsSettings, ...(parsed.cmsSettings || {}) },
          theme: { ...defaultStore.theme, ...(parsed.theme || {}) },
          modules: { ...defaultStore.modules, ...(parsed.modules || {}) },
          inventory: parsed.inventory || defaultStore.inventory || [],
          clientNotes: parsed.clientNotes || defaultStore.clientNotes || [],
          reminderLogs: parsed.reminderLogs || defaultStore.reminderLogs || [],
          reminderSettings: { ...(defaultStore.reminderSettings || {}), ...(parsed.reminderSettings || {}) }
        };
      }
    } catch (err) {
      console.warn('Could not read db.json, falling back to default seed data:', err);
    }
    this.save(defaultStore);
    return defaultStore;
  }

  private save(store: DatabaseStore) {
    try {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(store, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write db.json:', err);
    }
  }

  public getStore(): DatabaseStore {
    return this.store;
  }

  public mutate<T>(fn: (store: DatabaseStore) => T): T {
    const result = fn(this.store);
    this.save(this.store);
    return result;
  }
}

export const db = new Database();

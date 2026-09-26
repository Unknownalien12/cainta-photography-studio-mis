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
  users: [],
  customers: [],
  studios: [],
  categories: [],
  services: [],
  packages: [],
  addons: [],
  bookings: [],
  payments: [],
  gcashSessions: [],
  printProducts: [],
  printOrders: [],
  reviews: [],
  photoProofings: [],
  faqs: [],
  promotions: [],
  notifications: [],
  auditLogs: [],
  favorites: [],
  availability: [],
  blackouts: [],
  customPages: [],
  cmsSettings: {
    heroTitle: 'Frame Your Story. Book Studios.',
    heroSubtitle: 'Discover professional photography studios. Book verified portrait sessions, order fine-art prints, and manage photo proofing seamlessly.',
    heroBackground: '',
    aboutTitle: 'Pristine Studio Lighting & Retouching',
    aboutDescription: 'Experience calibrated professional lighting, curated backdrops, and experienced local photographers.',
    featuresTitle: 'Spotlight Studios',
    featuresSubtitle: 'Explore photography styles and packages suited to your milestones.',
    demoVideoUrl: '',
    audioUrl: '',
    audioEnabled: false
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
  inventory: [],
  clientNotes: [],
  reminderLogs: [],
  reminderSettings: {}
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

import React, { useState, useEffect, useMemo } from 'react';
import {
  Store,
  Calendar as CalendarIcon,
  DollarSign,
  Clock,
  Users,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Plus,
  Download,
  Settings,
  ShieldCheck,
  Send,
  Trash2,
  Edit2,
  Package as PackageIcon,
  BarChart3,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Filter,
  Sparkles,
  PieChart as PieChartIcon,
  FileSpreadsheet,
  FileText,
  Check,
  FileDown,
  Bell,
  Mail,
  Upload,
  X,
  Tag
} from 'lucide-react';

const processImageFiles = async (files: FileList | File[]): Promise<string[]> => {
  const fileArray = Array.from(files);
  const readPromises = fileArray.map(file => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 1200;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.82));
          } else {
            resolve(e.target?.result as string || '');
          }
        };
        img.onerror = () => resolve(e.target?.result as string || '');
        img.src = e.target?.result as string || '';
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  });
  return Promise.all(readPromises);
};
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
  LineChart,
  Line,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import type { Studio, Booking, Service, Package, PrintOrder, PhotoProofing, User, StudioInventoryItem, GearStatus, Review, Notification, Promotion } from '../db/types.js';
import { apiRequest } from '../utils/apiClient.js';
import { generateSalesReportPDF, generateBookingReceiptPDF, generateStudioAnalyticsPDF, generateBookingsDateRangePDF } from '../utils/pdfGenerator.js';
import { exportStudioAnalyticsCSV, exportBookingsDateRangeCSV } from '../utils/csvExporter.js';
import { SystemCalendar } from '../components/SystemCalendar.js';
import { AvailabilityManager } from '../components/AvailabilityManager.js';
import { StudioAvailabilityCalendar } from '../components/StudioAvailabilityCalendar.js';
import { ClientGallery } from '../components/ClientGallery.js';
import { StudioInventoryManager } from '../components/StudioInventoryManager.js';
import { StudioCustomerCRM } from '../components/StudioCustomerCRM.js';
import { StudioPaymentReminderService } from '../components/StudioPaymentReminderService.js';
import { StudioEmailTemplates } from '../components/StudioEmailTemplates.js';

interface StudioDashboardProps {
  currentUser: User;
  studio: Studio;
  onUpdateStudio: (updated: Studio) => void;
}

export const StudioDashboard: React.FC<StudioDashboardProps> = ({
  currentUser,
  studio,
  onUpdateStudio
}) => {
  const [activeTab, setActiveTab] = useState<
    'analytics' | 'bookings' | 'crm' | 'reminders' | 'emails' | 'availability' | 'services' | 'promotions' | 'prints' | 'proofing' | 'inventory' | 'settings' | 'reviews'
  >('analytics');

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [printOrders, setPrintOrders] = useState<PrintOrder[]>([]);
  const [proofings, setProofings] = useState<PhotoProofing[]>([]);
  const [inventory, setInventory] = useState<StudioInventoryItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );
  const [liveToast, setLiveToast] = useState<{ title: string; message: string; type: string } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    apiRequest<Notification[]>('/api/notifications')
      .then(data => {
        if (Array.isArray(data)) {
          setNotifications(data.filter(n => n.studioId === studio.id || n.userId === currentUser.id));
        }
      })
      .catch(() => {});

    const token = localStorage.getItem('cainta_auth_token') || '';
    const eventSource = new EventSource(`/api/notifications/stream?token=${encodeURIComponent(token)}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'notification' && data.notification) {
          const notif = data.notification as Notification;
          if (notif.studioId === studio.id || notif.userId === currentUser.id) {
            setNotifications(prev => [notif, ...prev]);
            setLiveToast({ title: notif.title, message: notif.message, type: notif.type });
            setTimeout(() => setLiveToast(null), 6000);

            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              new Notification(notif.title, {
                body: notif.message,
                icon: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=240&auto=format&fit=crop&q=80'
              });
            }

            loadStudioData();
          }
        }
      } catch (err) {
        console.error('SSE parse error:', err);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [studio.id]);

  const requestNotificationPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('Desktop notifications are not supported by your browser.');
      return;
    }
    const perm = await Notification.requestPermission();
    setNotificationPermission(perm);
    if (perm === 'granted') {
      new Notification('Real-Time Alerts Enabled!', {
        body: 'You will now receive desktop push notifications for urgent booking requests and cancellations.',
        icon: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=240&auto=format&fit=crop&q=80'
      });
    }
  };
  const [sentimentSummary, setSentimentSummary] = useState<string | null>(null);
  const [isGeneratingSentiment, setIsGeneratingSentiment] = useState(false);
  const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [exportStartDate, setExportStartDate] = useState(new Date().toISOString().substring(0, 8) + '01');
  const [exportEndDate, setExportEndDate] = useState(new Date().toISOString().substring(0, 10));
  const [isLoading, setIsLoading] = useState(true);

  // Services CRUD state
  const [showAddService, setShowAddService] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState(1500);
  const [newServiceDuration, setNewServiceDuration] = useState(60);
  const [newServiceCategory, setNewServiceCategory] = useState('Graduation');
  const [newServiceDesc, setNewServiceDesc] = useState('');
  const [newServiceSlots, setNewServiceSlots] = useState('09:00, 10:00, 11:00, 13:00, 14:00, 15:00, 16:00');
  const [newServiceImage, setNewServiceImage] = useState(
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80'
  );
  const [newServiceImages, setNewServiceImages] = useState<string[]>([]);
  const [isUploadingServiceImages, setIsUploadingServiceImages] = useState(false);

  // Packages CRUD state
  const [showAddPackage, setShowAddPackage] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [newPkgName, setNewPkgName] = useState('');
  const [newPkgPrice, setNewPkgPrice] = useState(5000);
  const [newPkgDuration, setNewPkgDuration] = useState(120);
  const [newPkgDesc, setNewPkgDesc] = useState('');
  const [newPkgImage, setNewPkgImage] = useState('https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80');
  const [newPkgImages, setNewPkgImages] = useState<string[]>([]);
  const [isUploadingPkgImages, setIsUploadingPkgImages] = useState(false);
  const [newPkgPhotos, setNewPkgPhotos] = useState(50);
  const [newPkgPrints, setNewPkgPrints] = useState('10pcs 4R, 1pc 8R');
  const [newPkgPhotogs, setNewPkgPhotogs] = useState(1);
  const [newPkgInclusions, setNewPkgInclusions] = useState('');

  // Studio Settings Form
  const [editName, setEditName] = useState(studio.name);
  const [editAddress, setEditAddress] = useState(studio.address);
  const [editContact, setEditContact] = useState(studio.contactInfo);
  const [editHours, setEditHours] = useState(studio.businessHours);
  const [editDesc, setEditDesc] = useState(studio.description);
  const [savedSettingsNotice, setSavedSettingsNotice] = useState(false);

  // Studio Promotion CRUD state
  const [showAddPromo, setShowAddPromo] = useState(false);
  const [promoTitle, setPromoTitle] = useState('');
  const [promoSubtitle, setPromoSubtitle] = useState('');
  const [promoDiscount, setPromoDiscount] = useState('20% OFF');
  const [promoCode, setPromoCode] = useState('');
  const [promoValidUntil, setPromoValidUntil] = useState('2026-12-31');
  const [promoDesc, setPromoDesc] = useState('');
  const [promoImage, setPromoImage] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80');

  const handleCreateStudioPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const p = await apiRequest<Promotion>('/api/promotions', {
        method: 'POST',
        body: JSON.stringify({
          studioId: studio.id,
          title: promoTitle,
          subtitle: promoSubtitle || studio.location,
          discount: promoDiscount,
          code: promoCode,
          location: studio.location,
          validUntil: promoValidUntil,
          description: promoDesc,
          image: promoImage
        })
      });
      setPromotions(prev => [p, ...prev]);
      setShowAddPromo(false);
      setPromoTitle('');
      setPromoCode('');
      setPromoDesc('');
    } catch (err) {
      alert('Failed to save promotion');
    }
  };

  const handleDeleteStudioPromo = async (id: string) => {
    if (!confirm('Are you sure you want to delete this promotion?')) return;
    try {
      await apiRequest(`/api/promotions/${id}`, { method: 'DELETE' });
      setPromotions(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      alert('Failed to delete promotion');
    }
  };

  useEffect(() => {
    loadStudioData();
  }, [studio.id]);

  const loadStudioData = async () => {
    setIsLoading(true);
    try {
      const [revData, bData, sData, pData, poData, prData, invData, promoData] = await Promise.all([
        apiRequest<Review[]>(`/api/studio/reviews`).catch(() => []),
        apiRequest<Booking[]>(`/api/studios/${studio.id}/bookings`),
        apiRequest<Service[]>(`/api/studios/${studio.id}/services`),
        apiRequest<Package[]>(`/api/studios/${studio.id}/packages`),
        apiRequest<PrintOrder[]>(`/api/studios/${studio.id}/print-orders`),
        apiRequest<PhotoProofing[]>(`/api/studios/${studio.id}/photo-proofings`),
        apiRequest<StudioInventoryItem[]>(`/api/studios/${studio.id}/inventory`).catch(() => []),
        apiRequest<Promotion[]>(`/api/promotions?studioId=${studio.id}`).catch(() => [])
      ]);
      setReviews(Array.isArray(revData) ? revData.filter(r => r.studioId === studio.id) : []);
      setBookings(Array.isArray(bData) ? bData : (bData as any)?.bookings || (bData as any)?.data || []);
      setServices(Array.isArray(sData) ? sData : (sData as any)?.services || (sData as any)?.data || []);
      setPackages(Array.isArray(pData) ? pData : (pData as any)?.packages || (pData as any)?.data || []);
      setPrintOrders(Array.isArray(poData) ? poData : (poData as any)?.printOrders || (poData as any)?.data || []);
      setProofings(Array.isArray(prData) ? prData : (prData as any)?.photoProofings || (prData as any)?.data || []);
      setPromotions(Array.isArray(promoData) ? promoData : []);
      if (Array.isArray(invData)) {
        setInventory(invData);
      } else if ((invData as any)?.inventory) {
        setInventory((invData as any).inventory);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateSentiment = async () => {
    setIsGeneratingSentiment(true);
    try {
      const res = await apiRequest<{ summary: string }>('/api/studio/reviews/sentiment-summary', {
        method: 'POST',
        body: JSON.stringify({ studioId: studio.id })
      });
      setSentimentSummary(res.summary);
    } catch (err) {
      alert('Failed to generate weekly sentiment summary.');
    } finally {
      setIsGeneratingSentiment(false);
    }
  };

  const handleReplyReview = async (reviewId: string) => {
    if (!replyText.trim()) return;
    try {
      await apiRequest(`/api/studio/reviews/${reviewId}/reply`, {
        method: 'PUT',
        body: JSON.stringify({ reply: replyText.trim() })
      });
      setReplyingReviewId(null);
      setReplyText('');
      loadStudioData();
    } catch (err) {
      alert('Failed to post reply');
    }
  };

  const handleToggleVisibility = async (reviewId: string, currentVisible: boolean) => {
    try {
      await apiRequest(`/api/studio/reviews/${reviewId}/visibility`, {
        method: 'PUT',
        body: JSON.stringify({ isVisible: !currentVisible })
      });
      loadStudioData();
    } catch (err) {
      alert('Failed to update review visibility');
    }
  };

  // Inventory Management Handlers
  const handleAddGear = async (item: Partial<StudioInventoryItem>) => {
    try {
      const created = await apiRequest<StudioInventoryItem>(`/api/studios/${studio.id}/inventory`, {
        method: 'POST',
        body: JSON.stringify(item)
      });
      setInventory(prev => [created, ...prev]);
    } catch (err) {
      console.error('Failed to add equipment:', err);
      throw err;
    }
  };

  const handleUpdateGearStatus = async (id: string, status: GearStatus, assignedTo?: string, notes?: string) => {
    try {
      await apiRequest(`/api/inventory/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, assignedTo, notes })
      });
      setInventory(prev =>
        prev.map(item =>
          item.id === id
            ? {
                ...item,
                status,
                assignedTo: assignedTo !== undefined ? assignedTo : item.assignedTo,
                notes: notes !== undefined ? notes : item.notes,
                lastMaintenance: status === 'maintenance' ? new Date().toISOString().split('T')[0] : item.lastMaintenance
              }
            : item
        )
      );
    } catch (err) {
      console.error('Failed to update gear status:', err);
      throw err;
    }
  };

  const handleDeleteGear = async (id: string) => {
    try {
      await apiRequest(`/api/inventory/${id}`, {
        method: 'DELETE'
      });
      setInventory(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error('Failed to delete gear:', err);
      throw err;
    }
  };

  // Booking status update
  const handleUpdateBookingStatus = async (bookingId: string, status: string) => {
    try {
      await apiRequest(`/api/bookings/${bookingId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      loadStudioData();
    } catch (err) {
      alert('Failed to update booking status');
    }
  };

  // Print order tracking update
  const handleUpdatePrintStatus = async (orderId: string, status: string, trackingNumber?: string) => {
    try {
      await apiRequest(`/api/print-orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, trackingNumber })
      });
      loadStudioData();
    } catch (err) {
      alert('Failed to update print status');
    }
  };

  // File Upload Handlers for Device Photos
  const handleServiceFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsUploadingServiceImages(true);
    try {
      const base64List = await processImageFiles(e.target.files);
      setNewServiceImages(prev => {
        const next = [...prev, ...base64List];
        if (!newServiceImage || newServiceImage.includes('unsplash')) {
          setNewServiceImage(next[0]);
        }
        return next;
      });
    } catch (err) {
      console.error('File upload failed', err);
      alert('Failed to process image file(s).');
    } finally {
      setIsUploadingServiceImages(false);
      e.target.value = '';
    }
  };

  const handlePkgFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsUploadingPkgImages(true);
    try {
      const base64List = await processImageFiles(e.target.files);
      setNewPkgImages(prev => {
        const next = [...prev, ...base64List];
        if (!newPkgImage || newPkgImage.includes('unsplash')) {
          setNewPkgImage(next[0]);
        }
        return next;
      });
    } catch (err) {
      console.error('File upload failed', err);
      alert('Failed to process image file(s).');
    } finally {
      setIsUploadingPkgImages(false);
      e.target.value = '';
    }
  };

  // Add / Edit Service
  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const finalImage = newServiceImage || (newServiceImages.length > 0 ? newServiceImages[0] : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80');
      const finalImagesList = newServiceImages.length > 0 ? newServiceImages : [finalImage];

      const payload = {
        name: newServiceName,
        category: newServiceCategory,
        basePrice: newServicePrice,
        durationMinutes: newServiceDuration,
        description: newServiceDesc,
        image: finalImage,
        images: finalImagesList,
        availableSlots: newServiceSlots.split(',').map(s => s.trim()).filter(s => s),
        isActive: true
      };
      
      if (editingService) {
        await apiRequest(`/api/studios/${studio.id}/services/${editingService.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        const res = await apiRequest<Service>(`/api/studios/${studio.id}/services`, {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        setServices(prev => [...prev, res]);
      }
      
      loadStudioData();
      setShowAddService(false);
      setEditingService(null);
      resetServiceForm();
    } catch (err) {
      alert('Failed to save service');
    }
  };

  const resetServiceForm = () => {
    setNewServiceName('');
    setNewServicePrice(1500);
    setNewServiceDuration(60);
    setNewServiceCategory('Graduation');
    setNewServiceDesc('');
    setNewServiceSlots('09:00, 10:00, 11:00, 13:00, 14:00, 15:00, 16:00');
    setNewServiceImage('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80');
    setNewServiceImages([]);
  };

  const handleEditService = (s: Service) => {
    setEditingService(s);
    setNewServiceName(s.name);
    setNewServiceCategory(s.category);
    setNewServicePrice(s.basePrice);
    setNewServiceDuration(s.durationMinutes);
    setNewServiceDesc(s.description);
    setNewServiceSlots(s.availableSlots ? s.availableSlots.join(', ') : '09:00, 10:00, 13:00');
    setNewServiceImage(s.image);
    setNewServiceImages(s.images && s.images.length > 0 ? s.images : (s.image ? [s.image] : []));
    setShowAddService(true);
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    try {
      await apiRequest(`/api/studios/${studio.id}/services/${id}`, { method: 'DELETE' });
      setServices(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      alert('Failed to delete service');
    }
  };

  // Packages CRUD
  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const finalImage = newPkgImage || (newPkgImages.length > 0 ? newPkgImages[0] : 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80');
      const finalImagesList = newPkgImages.length > 0 ? newPkgImages : [finalImage];

      const payload = {
        name: newPkgName,
        price: newPkgPrice,
        durationMinutes: newPkgDuration,
        description: newPkgDesc,
        image: finalImage,
        images: finalImagesList,
        editedPhotosCount: newPkgPhotos,
        includedPrints: newPkgPrints,
        photographerCount: newPkgPhotogs,
        includedServices: newPkgInclusions.split(',').map(s => s.trim()).filter(s => s),
        isActive: true
      };

      if (editingPackage) {
        await apiRequest(`/api/studios/${studio.id}/packages/${editingPackage.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        const res = await apiRequest<Package>(`/api/studios/${studio.id}/packages`, {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        setPackages(prev => [...prev, res]);
      }

      loadStudioData();
      setShowAddPackage(false);
      setEditingPackage(null);
      resetPackageForm();
    } catch (err) {
      alert('Failed to save package');
    }
  };

  const resetPackageForm = () => {
    setNewPkgName('');
    setNewPkgPrice(5000);
    setNewPkgDuration(120);
    setNewPkgDesc('');
    setNewPkgImage('https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80');
    setNewPkgImages([]);
    setNewPkgPhotos(50);
    setNewPkgPrints('10pcs 4R, 1pc 8R');
    setNewPkgPhotogs(1);
    setNewPkgInclusions('');
  };

  const handleEditPackage = (p: Package) => {
    setEditingPackage(p);
    setNewPkgName(p.name);
    setNewPkgPrice(p.price);
    setNewPkgDuration(p.durationMinutes);
    setNewPkgDesc(p.description);
    setNewPkgImage(p.image);
    setNewPkgImages(p.images && p.images.length > 0 ? p.images : (p.image ? [p.image] : []));
    setNewPkgPhotos(p.editedPhotosCount);
    setNewPkgPrints(p.includedPrints);
    setNewPkgPhotogs(p.photographerCount);
    setNewPkgInclusions((p.includedServices || []).join(', '));
    setShowAddPackage(true);
  };

  const handleDeletePackage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this package?')) return;
    try {
      await apiRequest(`/api/studios/${studio.id}/packages/${id}`, { method: 'DELETE' });
      setPackages(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      alert('Failed to delete package');
    }
  };

  // Save Settings
  const handleSaveStudioProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await apiRequest<Studio>(`/api/studios/${studio.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editName,
          address: editAddress,
          contactInfo: editContact,
          businessHours: editHours,
          description: editDesc
        })
      });
      onUpdateStudio(updated);
      setSavedSettingsNotice(true);
      setTimeout(() => setSavedSettingsNotice(false), 3000);
    } catch (err) {
      alert('Failed to update studio profile');
    }
  };

  // Analytics aggregations & Studio Performance State
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState<'30d' | '90d' | 'ytd' | 'year' | '6m' | 'quarter'>('year');
  const [monthlyRevenueGoal, setMonthlyRevenueGoal] = useState<number>(120000);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');
  const [exportScope, setExportScope] = useState<'filtered' | 'all'>('filtered');
  const [includeTransactionsInCSV, setIncludeTransactionsInCSV] = useState(true);
  const [exportToastNotice, setExportToastNotice] = useState<string | null>(null);

  const safeBookings = Array.isArray(bookings) ? bookings : [];

  const totalRevenue = useMemo(() => {
    return safeBookings.reduce((acc, b) => acc + (b.amountPaid || 0), 0);
  }, [safeBookings]);

  // Full 12-month baseline profile calibrated for Cainta photo studios, combined with live booking records
  const fullMonthlyData = useMemo(() => {
    const baselineMonthly = [
      { month: 'Jan', baselineRev: 48500, baselineBookings: 18, baselineCompleted: 17 },
      { month: 'Feb', baselineRev: 52400, baselineBookings: 22, baselineCompleted: 20 },
      { month: 'Mar', baselineRev: 68900, baselineBookings: 29, baselineCompleted: 27 },
      { month: 'Apr', baselineRev: 74200, baselineBookings: 32, baselineCompleted: 30 },
      { month: 'May', baselineRev: 63100, baselineBookings: 26, baselineCompleted: 25 },
      { month: 'Jun', baselineRev: 82000, baselineBookings: 36, baselineCompleted: 34 },
      { month: 'Jul', baselineRev: 56400, baselineBookings: 24, baselineCompleted: 22 },
      { month: 'Aug', baselineRev: 59800, baselineBookings: 25, baselineCompleted: 24 },
      { month: 'Sep', baselineRev: 67500, baselineBookings: 28, baselineCompleted: 26 },
      { month: 'Oct', baselineRev: 76500, baselineBookings: 33, baselineCompleted: 31 },
      { month: 'Nov', baselineRev: 89400, baselineBookings: 39, baselineCompleted: 36 },
      { month: 'Dec', baselineRev: 108500, baselineBookings: 48, baselineCompleted: 45 }
    ];

    // Real-time booking aggregation into month indices (0 = Jan ... 11 = Dec)
    const actualByMonth: Record<number, { revenue: number; bookings: number; completed: number }> = {};
    for (let i = 0; i < 12; i++) {
      actualByMonth[i] = { revenue: 0, bookings: 0, completed: 0 };
    }

    safeBookings.forEach(b => {
      if (b && b.bookingDate) {
        const date = new Date(b.bookingDate);
        if (!isNaN(date.getTime())) {
          const m = date.getMonth();
          const amt = b.amountPaid || b.totalAmount || 0;
          actualByMonth[m].revenue += amt;
          actualByMonth[m].bookings += 1;
          if (b.status === 'Completed') {
            actualByMonth[m].completed += 1;
          }
        }
      }
    });

    return baselineMonthly.map((base, idx) => {
      const actual = actualByMonth[idx];
      const rev = base.baselineRev + actual.revenue;
      const bCount = base.baselineBookings + actual.bookings;
      const compCount = base.baselineCompleted + actual.completed;
      const target = Math.round(base.baselineRev * 1.15);
      const aov = bCount > 0 ? Math.round(rev / bCount) : 0;

      // Calculate previous month's revenue to compute month-over-month trajectory
      const prevRev = idx > 0
        ? (baselineMonthly[idx - 1].baselineRev + actualByMonth[idx - 1].revenue)
        : Math.round(base.baselineRev * 0.92);
      const momDiff = rev - prevRev;
      const momGrowthPct = prevRev > 0 ? (momDiff / prevRev) * 100 : 0;

      const historicalAvg = idx >= 2
        ? Math.round((rev + (baselineMonthly[idx-1].baselineRev + (actualByMonth[idx-1]?.revenue || 0)) + (baselineMonthly[idx-2].baselineRev + (actualByMonth[idx-2]?.revenue || 0))) / 3)
        : Math.round(rev * 1.05);
      const projectedRevenue = Math.round(historicalAvg * (1 + (momGrowthPct > 0 ? momGrowthPct / 200 : 0.04)));

      return {
        month: base.month,
        fullName: `${base.month} 2026`,
        revenue: rev,
        prevRevenue: prevRev,
        projectedRevenue,
        momGrowthPct: Number(momGrowthPct.toFixed(1)),
        target,
        bookings: bCount,
        completed: compCount,
        pending: Math.max(0, bCount - compCount),
        avgBookingValue: aov
      };
    });
  }, [bookings]);

  // Filtered monthly dataset according to selected timeframe
  const displayMonthlyData = useMemo(() => {
    if (analyticsTimeframe === '30d') {
      return fullMonthlyData.slice(11); // Dec / current month
    }
    if (analyticsTimeframe === '90d') {
      return fullMonthlyData.slice(9); // Oct - Dec (90 days)
    }
    if (analyticsTimeframe === 'ytd') {
      return fullMonthlyData.slice(0, 9); // Jan - Sep (Year to Date)
    }
    if (analyticsTimeframe === '6m') {
      return fullMonthlyData.slice(6); // Jul - Dec
    }
    if (analyticsTimeframe === 'quarter') {
      return fullMonthlyData.slice(8); // Sep - Dec (Q4 peak)
    }
    return fullMonthlyData; // All 12 months
  }, [fullMonthlyData, analyticsTimeframe]);

  // Key performance summaries with dynamic Current vs Previous Month calculation
  const analyticsSummary = useMemo(() => {
    const totalRev = displayMonthlyData.reduce((acc, m) => acc + m.revenue, 0);
    const totalBookings = displayMonthlyData.reduce((acc, m) => acc + m.bookings, 0);
    const totalCompleted = displayMonthlyData.reduce((acc, m) => acc + m.completed, 0);
    const avgMonthlyRev = displayMonthlyData.length > 0 ? Math.round(totalRev / displayMonthlyData.length) : 0;
    const avgOrderValue = totalBookings > 0 ? Math.round(totalRev / totalBookings) : 0;
    const completionRate = totalBookings > 0 ? ((totalCompleted / totalBookings) * 100).toFixed(1) : '100.0';

    const peak = [...displayMonthlyData].sort((a, b) => b.revenue - a.revenue)[0];

    // Current month index based on client time (Month 8 = Sep)
    const currentMonthIndex = new Date().getMonth();
    const prevMonthIndex = currentMonthIndex > 0 ? currentMonthIndex - 1 : 11;

    const currentMonthItem = fullMonthlyData[currentMonthIndex] || fullMonthlyData[fullMonthlyData.length - 1];
    const prevMonthItem = fullMonthlyData[prevMonthIndex] || fullMonthlyData[0];

    const currentMonthRev = currentMonthItem.revenue;
    const prevMonthRev = prevMonthItem.revenue;
    const momGrowthDiff = currentMonthRev - prevMonthRev;
    const momGrowthPct = prevMonthRev > 0 ? (momGrowthDiff / prevMonthRev) * 100 : 0;
    const isPositiveGrowth = momGrowthPct >= 0;

    const currentMonthBookings = currentMonthItem.bookings;
    const maxCapacity = 50;
    const occupancyRate = Math.min(100, Math.round((currentMonthBookings / maxCapacity) * 100));
    const goalProgress = Math.min(100, Math.round((currentMonthRev / monthlyRevenueGoal) * 100));

    return {
      totalRev,
      totalBookings,
      totalCompleted,
      avgMonthlyRev,
      avgOrderValue,
      completionRate,
      peakMonth: peak?.month || 'Dec',
      peakRevenue: peak?.revenue || 0,
      currentMonthItem,
      prevMonthItem,
      currentMonthRev,
      prevMonthRev,
      momGrowthDiff,
      momGrowthPct,
      isPositiveGrowth,
      currentMonthBookings,
      occupancyRate,
      goalProgress
    };
  }, [displayMonthlyData, fullMonthlyData, monthlyRevenueGoal]);

  // Service Category Breakdown
  const categoryBreakdown = useMemo(() => {
    return [
      { name: 'Graduation Milestones', bookings: 54, revenue: 162000, color: '#d97706' },
      { name: 'Portraits & Creative', bookings: 48, revenue: 115200, color: '#2563eb' },
      { name: 'Weddings & Debuts', bookings: 22, revenue: 187000, color: '#059669' },
      { name: 'Self-Shoot Studio', bookings: 62, revenue: 74400, color: '#9333ea' },
      { name: 'Biometric / ID', bookings: 38, revenue: 22800, color: '#e11d48' }
    ];
  }, []);

  const getTimeframeLabel = (scope: 'filtered' | 'all') => {
    if (scope === 'all') return 'Full Year 2026 (All 12 Calendar Months)';
    if (analyticsTimeframe === '30d') return 'Last 30 Days (Current Month)';
    if (analyticsTimeframe === '90d') return 'Last 90 Days (Oct - Dec 2026)';
    if (analyticsTimeframe === 'ytd') return 'Year to Date (Jan - Sep 2026)';
    if (analyticsTimeframe === '6m') return 'Past 6 Months (Jul - Dec 2026)';
    if (analyticsTimeframe === 'quarter') return 'Q4 Peak Season (Sep - Dec 2026)';
    return 'Full Year 2026 (Annual View)';
  };

  const handleExportCSV = (scope: 'filtered' | 'all' = 'filtered', withTransactions: boolean = includeTransactionsInCSV) => {
    const dataToExport = scope === 'all' ? fullMonthlyData : displayMonthlyData;
    const label = getTimeframeLabel(scope);
    exportStudioAnalyticsCSV({
      studioName: studio.name,
      timeframeName: label,
      monthlyData: dataToExport,
      summary: analyticsSummary,
      bookings: bookings,
      includeIndividualBookings: withTransactions
    });
    setExportToastNotice(`CSV record file exported successfully for ${studio.name}!`);
    setTimeout(() => setExportToastNotice(null), 4000);
  };

  const handleExportPDF = (scope: 'filtered' | 'all' = 'filtered') => {
    const dataToExport = scope === 'all' ? fullMonthlyData : displayMonthlyData;
    const label = getTimeframeLabel(scope);
    generateStudioAnalyticsPDF(
      studio.name,
      label,
      dataToExport,
      analyticsSummary,
      categoryBreakdown
    );
    setExportToastNotice(`Official revenue & booking trends PDF generated and downloaded!`);
    setTimeout(() => setExportToastNotice(null), 4000);
  };

  const chartData = [
    { day: 'Mon', revenue: 4200, bookings: 3 },
    { day: 'Tue', revenue: 6500, bookings: 4 },
    { day: 'Wed', revenue: 8900, bookings: 6 },
    { day: 'Thu', revenue: 5400, bookings: 3 },
    { day: 'Fri', revenue: 14200, bookings: 8 },
    { day: 'Sat', revenue: 21500, bookings: 12 },
    { day: 'Sun', revenue: 16800, bookings: 9 }
  ];

  return (
    <div className="flex min-h-screen bg-stone-50 text-stone-900">
      {/* Side Navigation Sidebar */}
      <aside className="w-72 bg-white border-r border-stone-200 flex-shrink-0 hidden lg:flex flex-col justify-between p-6 overflow-y-auto h-screen sticky top-0">
        <div className="space-y-6">
          <div className="flex items-center gap-3 p-3.5 bg-[#2c2a29] text-white rounded-2xl shadow-sm">
            <img src={studio.logo} alt={studio.name} className="w-8 h-8 rounded-lg object-cover border border-stone-700" />
            <div className="min-w-0">
              <h4 className="font-bold text-sm truncate">{studio.name}</h4>
              <p className="text-[11px] text-stone-400 truncate">Cainta Studio Owner</p>
            </div>
          </div>

          <nav className="space-y-1.5 text-xs font-semibold">
            {[
              { id: 'analytics', label: 'Studio Analytics', icon: BarChart3 },
              { id: 'bookings', label: 'Bookings & Calendar', icon: CalendarIcon, badge: safeBookings.length },
              { id: 'crm', label: 'Customer CRM', icon: Users },
              { id: 'reminders', label: 'Payment Reminders', icon: Bell, badge: safeBookings.filter(b => b.status !== 'Cancelled' && b.status !== 'Completed' && ((b.paymentStatus === 'unpaid' || (b.paymentOption === 'downpayment' && b.amountPaid === 0) && b.downPaymentAmount > 0) || b.remainingBalance > 0)).length },
              { id: 'emails', label: 'Email Templates', icon: Mail },
              { id: 'availability', label: 'Hours & Blackouts', icon: Clock },
              { id: 'services', label: 'Services & Packages', icon: PackageIcon, badge: services.length },
              { id: 'promotions', label: 'Promotions & Deals', icon: Tag, badge: promotions.length },
              { id: 'prints', label: 'Print Fulfillment', icon: FileText, badge: printOrders.filter(p => p.status !== 'delivered').length },
              { id: 'proofing', label: 'Client Proofing', icon: ImageIcon, badge: proofings.length },
              { id: 'inventory', label: 'Studio Inventory', icon: FileSpreadsheet, badge: inventory.length },
              { id: 'reviews', label: 'Reviews & AI Sentiment', icon: Sparkles, badge: reviews.length },
              { id: 'settings', label: 'Studio Profile', icon: Settings }
            ].map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl transition-all ${
                    isActive
                      ? 'bg-amber-600 text-white font-bold shadow-md shadow-amber-600/20'
                      : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-stone-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isActive ? 'bg-amber-700 text-white' : 'bg-stone-200 text-stone-700'}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-stone-200 text-xs text-stone-400">
          <div>Cainta Owner Console v2.5</div>
          <div className="text-[10px] text-stone-500">Last login: {new Date().toLocaleDateString()}</div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-8 space-y-6 overflow-y-auto">
        {/* Live Toast Banner */}
        {liveToast && (
          <div className={`p-4 rounded-2xl border shadow-lg flex items-center justify-between gap-4 animate-bounce ${
            liveToast.type === 'error' ? 'bg-red-50 border-red-200 text-red-900' : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-amber-600 animate-pulse" />
              <div>
                <div className="font-bold text-sm">{liveToast.title}</div>
                <div className="text-xs mt-0.5 opacity-90">{liveToast.message}</div>
              </div>
            </div>
            <button onClick={() => setLiveToast(null)} className="text-xs font-bold px-3 py-1 bg-white rounded-lg shadow-xs hover:bg-stone-100">Dismiss</button>
          </div>
        )}

        {/* Desktop Push Notification Banner */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xl">
              🔔
            </div>
            <div>
              <div className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <span>Real-Time Desktop Push Notifications</span>
                {notificationPermission === 'granted' ? (
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">Active & Listening</span>
                ) : (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">Permission Required</span>
                )}
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                {notificationPermission === 'granted'
                  ? 'Desktop push notifications are enabled for urgent booking requests and cancellations.'
                  : 'Enable browser desktop push notifications to get instant alerts when clients request or cancel bookings.'}
              </p>
            </div>
          </div>

          {notificationPermission !== 'granted' && (
            <button
              onClick={requestNotificationPermission}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm whitespace-nowrap"
            >
              Enable Push Alerts
            </button>
          )}
        </div>

        {/* Studio Banner */}
        <div className="bg-[#2c2a29] text-white p-6 rounded-3xl border border-stone-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            <img
              src={studio.logo}
              alt={studio.name}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-600"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">{studio.name}</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {studio.status}
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">{studio.address} • {studio.businessHours}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                generateSalesReportPDF(
                  `${studio.name} - Cainta Operations Report`,
                  chartData.map(c => ({ date: c.day, revenue: c.revenue })),
                  totalRevenue
                )
              }
              className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 font-semibold text-xs border border-stone-700 flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-4 h-4" /> Export Sales PDF
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs">
            <span className="text-[11px] font-bold uppercase text-stone-400">Total Revenue (GCash)</span>
            <div className="text-xl font-extrabold text-stone-900 mt-1">₱{totalRevenue.toLocaleString()}</div>
            <span className="text-[10px] text-emerald-600 font-semibold">Verified pay-outs</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs">
            <span className="text-[11px] font-bold uppercase text-stone-400">Total Bookings</span>
            <div className="text-xl font-extrabold text-stone-900 mt-1">{safeBookings.length}</div>
            <span className="text-[10px] text-stone-500 font-medium">Lifetime reservations</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs">
            <span className="text-[11px] font-bold uppercase text-stone-400">Pending Prints</span>
            <div className="text-xl font-extrabold text-amber-600 mt-1">
              {printOrders.filter(p => p.status !== 'delivered').length}
            </div>
            <span className="text-[10px] text-amber-700 font-medium">In laboratory pipeline</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs">
            <span className="text-[11px] font-bold uppercase text-stone-400">Active Proofings</span>
            <div className="text-xl font-extrabold text-blue-600 mt-1">{proofings.length}</div>
            <span className="text-[10px] text-stone-500 font-medium">Client retouch galleries</span>
          </div>
        </div>

      {/* View Logic Rendered in Main Content Area */}
      {activeTab === 'promotions' && (
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-600" />
                Studio Deals & Discount Coupons
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Create promotional vouchers and seasonal deals displayed on the landing carousel and directory.
              </p>
            </div>
            <button
              onClick={() => setShowAddPromo(true)}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Create Deal
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {promotions.map(promo => (
              <div key={promo.id} className="p-5 rounded-2xl border border-stone-200 bg-stone-50 space-y-3 relative">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-xl text-xs font-extrabold bg-amber-600 text-white shadow-xs">
                    {promo.discount}
                  </span>
                  <button onClick={() => handleDeleteStudioPromo(promo.id)} className="text-stone-400 hover:text-rose-600 p-1 cursor-pointer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <h4 className="font-extrabold text-stone-900 text-base">{promo.title}</h4>
                  <p className="text-xs text-stone-600 mt-1 leading-relaxed">{promo.description}</p>
                </div>
                <div className="flex items-center justify-between text-xs text-stone-500 pt-3 border-t border-stone-200">
                  <div className="flex items-center gap-1.5 font-mono font-bold bg-white px-2.5 py-1 rounded-lg border border-stone-200">
                    <Tag className="w-3.5 h-3.5 text-amber-600" />
                    <span>{promo.code}</span>
                  </div>
                  <span>Valid until: {promo.validUntil}</span>
                </div>
              </div>
            ))}
            {promotions.length === 0 && (
              <div className="col-span-2 p-8 text-center text-stone-400 italic bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                No active promotions or discount coupons created for this studio yet. Click "Create Deal" to add one!
              </div>
            )}
          </div>

          {showAddPromo && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
              <form onSubmit={handleCreateStudioPromo} className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl space-y-3 text-xs">
                <h4 className="font-bold text-sm text-stone-900">Add Studio Deal / Voucher</h4>
                <div>
                  <label className="font-semibold block mb-1">Deal Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cainta Graduation Toga Special"
                    value={promoTitle}
                    onChange={e => setPromoTitle(e.target.value)}
                    className="w-full p-2.5 border border-stone-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Discount Tag</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 20% OFF or Free 8x10 Canvas"
                    value={promoDiscount}
                    onChange={e => setPromoDiscount(e.target.value)}
                    className="w-full p-2.5 border border-stone-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Promo Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GRAD2026"
                    value={promoCode}
                    onChange={e => setPromoCode(e.target.value)}
                    className="w-full p-2.5 border border-stone-300 rounded-xl font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Valid Until Date</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. December 31, 2026"
                    value={promoValidUntil}
                    onChange={e => setPromoValidUntil(e.target.value)}
                    className="w-full p-2.5 border border-stone-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Description & Inclusions</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Describe what customers get with this deal..."
                    value={promoDesc}
                    onChange={e => setPromoDesc(e.target.value)}
                    className="w-full p-2.5 border border-stone-300 rounded-xl"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowAddPromo(false)} className="px-3 py-2 text-stone-600 cursor-pointer">
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2 bg-amber-600 text-white rounded-xl font-bold cursor-pointer">
                    Publish Deal
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* View Logic Rendered in Main Content Area */}
      {activeTab === 'reviews' && (
        <div className="space-y-6">
          {/* Header & AI Summary Banner */}
          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                    <Sparkles className="w-5 h-5 text-amber-600" />
                  </div>
                  <h3 className="text-base font-bold text-stone-900">Customer Reviews & AI Weekly Sentiment Summary</h3>
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  Analyze client feedback and generate AI-powered weekly insights using Gemini.
                </p>
              </div>

              <button
                onClick={handleGenerateSentiment}
                disabled={isGeneratingSentiment}
                className="px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isGeneratingSentiment ? 'Generating AI Report...' : 'Generate Weekly AI Sentiment Summary'}</span>
              </button>
            </div>

            {/* AI Sentiment Summary Output Card */}
            {sentimentSummary && (
              <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-50/60 to-stone-50 border border-amber-200/80 space-y-3 animate-fadeIn">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-amber-600" /> Weekly Gemini Sentiment Analysis Report
                </div>
                <div className="text-xs text-stone-800 whitespace-pre-wrap leading-relaxed bg-white p-4 rounded-xl border border-stone-200/60 shadow-xs font-sans">
                  {sentimentSummary}
                </div>
              </div>
            )}
          </div>

          {/* Reviews List & Management */}
          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-stone-900">All Received Reviews ({reviews.length})</h4>
              <span className="text-xs text-stone-500">Average Rating: <strong className="text-amber-700">{studio.rating}★</strong></span>
            </div>

            <div className="space-y-3">
              {reviews.length === 0 ? (
                <div className="text-center py-12 text-stone-500 text-xs bg-stone-50 rounded-2xl border border-stone-200">
                  No reviews received yet for this studio.
                </div>
              ) : (
                reviews.map(rev => (
                  <div key={rev.id} className="p-4 rounded-2xl border border-stone-200 bg-stone-50/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center">
                          {rev.customerName.charAt(0)}
                        </div>
                        <div>
                          <h6 className="font-bold text-xs text-stone-900">{rev.customerName}</h6>
                          <span className="text-[10px] text-stone-400">
                            {new Date(rev.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/50">
                          <span className="text-xs font-bold text-amber-900">{rev.rating}.0★</span>
                        </div>

                        <button
                          onClick={() => handleToggleVisibility(rev.id, rev.isVisible)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                            rev.isVisible ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-700'
                          }`}
                        >
                          {rev.isVisible ? 'Public Visible' : 'Hidden'}
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-stone-700 leading-relaxed pl-10">{rev.comment}</p>

                    {rev.reply ? (
                      <div className="ml-10 p-3 rounded-xl bg-white border border-stone-200 text-xs space-y-1 shadow-xs">
                        <div className="font-bold text-stone-900 flex items-center gap-1">
                          <span>Your Reply</span>
                          <span className="text-[10px] text-stone-400 font-normal">
                            ({new Date(rev.replyAt || rev.createdAt).toLocaleDateString()})
                          </span>
                        </div>
                        <p className="text-stone-600">{rev.reply}</p>
                      </div>
                    ) : (
                      <div className="ml-10 pt-1">
                        {replyingReviewId === rev.id ? (
                          <div className="space-y-2">
                            <textarea
                              rows={2}
                              placeholder="Type your professional reply to this client..."
                              value={replyText}
                              onChange={e => setReplyText(e.target.value)}
                              className="w-full p-2.5 text-xs bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                            />
                            <div className="flex items-center gap-2 justify-end">
                              <button
                                onClick={() => setReplyingReviewId(null)}
                                className="px-3 py-1.5 rounded-lg text-xs text-stone-600 hover:bg-stone-200"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleReplyReview(rev.id)}
                                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-xs"
                              >
                                Post Reply
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setReplyingReviewId(rev.id);
                              setReplyText('');
                            }}
                            className="text-xs text-amber-700 font-semibold hover:underline flex items-center gap-1"
                          >
                            <Send className="w-3 h-3" /> Reply to Review
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Studio Analytics */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Section Header & Period Filters */}
          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-stone-900">Studio Analytics</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                  Live Business Metrics
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-1">
                Real-time booking volume trends, monthly gross revenue, and studio operational velocity for {studio.name}.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex flex-wrap bg-stone-100 p-1 rounded-xl text-xs font-semibold text-stone-600 gap-0.5">
                <button
                  onClick={() => setAnalyticsTimeframe('30d')}
                  className={`px-2.5 py-1.5 rounded-lg transition-all ${
                    analyticsTimeframe === '30d' ? 'bg-white text-stone-900 shadow-xs font-bold' : 'hover:text-stone-900'
                  }`}
                >
                  Last 30 Days
                </button>
                <button
                  onClick={() => setAnalyticsTimeframe('90d')}
                  className={`px-2.5 py-1.5 rounded-lg transition-all ${
                    analyticsTimeframe === '90d' ? 'bg-white text-stone-900 shadow-xs font-bold' : 'hover:text-stone-900'
                  }`}
                >
                  Last 90 Days
                </button>
                <button
                  onClick={() => setAnalyticsTimeframe('ytd')}
                  className={`px-2.5 py-1.5 rounded-lg transition-all ${
                    analyticsTimeframe === 'ytd' ? 'bg-white text-stone-900 shadow-xs font-bold' : 'hover:text-stone-900'
                  }`}
                >
                  Year to Date
                </button>
                <button
                  onClick={() => setAnalyticsTimeframe('year')}
                  className={`px-2.5 py-1.5 rounded-lg transition-all ${
                    analyticsTimeframe === 'year' ? 'bg-white text-stone-900 shadow-xs font-bold' : 'hover:text-stone-900'
                  }`}
                >
                  Full Year
                </button>
                <button
                  onClick={() => setAnalyticsTimeframe('6m')}
                  className={`px-2.5 py-1.5 rounded-lg transition-all ${
                    analyticsTimeframe === '6m' ? 'bg-white text-stone-900 shadow-xs font-bold' : 'hover:text-stone-900'
                  }`}
                >
                  Past 6 Months
                </button>
                <button
                  onClick={() => setAnalyticsTimeframe('quarter')}
                  className={`px-2.5 py-1.5 rounded-lg transition-all ${
                    analyticsTimeframe === 'quarter' ? 'bg-white text-stone-900 shadow-xs font-bold' : 'hover:text-stone-900'
                  }`}
                >
                  Q4 Peak
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="btn-export-analytics-csv"
                  onClick={() => handleExportCSV('filtered', true)}
                  title="Export revenue and booking trend data as CSV spreadsheet"
                  className="px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>

                <button
                  id="btn-export-analytics-pdf"
                  onClick={() => handleExportPDF('filtered')}
                  title="Export official studio revenue and booking trend PDF report"
                  className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Export PDF</span>
                </button>

                <button
                  id="btn-open-export-modal"
                  onClick={() => setShowExportModal(true)}
                  title="Configure export scope, formats, and transaction logs"
                  className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs flex items-center justify-center transition-colors border border-stone-200"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Current Month Executive Summary Card */}
          <div className="bg-gradient-to-br from-stone-900 to-stone-800 text-white p-6 rounded-3xl shadow-md border border-stone-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                    {analyticsSummary.currentMonthItem.month} 2026 Executive Performance
                  </span>
                </div>
                <h4 className="text-xl font-extrabold text-white tracking-tight">
                  Monthly Operations & Utilization Summary
                </h4>
                <p className="text-xs text-stone-300 max-w-xl">
                  Real-time financial intake, booking volume, and slot capacity utilization for {studio.name}.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm">
                <div className="space-y-1 pr-4 sm:border-r border-white/10">
                  <span className="text-[10px] uppercase font-bold text-stone-400">Current Month Revenue</span>
                  <div className="text-xl font-black text-amber-400">
                    ₱{analyticsSummary.currentMonthRev.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-stone-300 font-medium flex items-center gap-1">
                    <span className={analyticsSummary.isPositiveGrowth ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      {analyticsSummary.isPositiveGrowth ? '+' : ''}{analyticsSummary.momGrowthPct.toFixed(1)}%
                    </span>
                    <span>vs prev month</span>
                  </div>
                </div>

                <div className="space-y-1 px-2 sm:border-r border-white/10">
                  <span className="text-[10px] uppercase font-bold text-stone-400">Current Month Bookings</span>
                  <div className="text-xl font-black text-white">
                    {analyticsSummary.currentMonthBookings} <span className="text-xs font-normal text-stone-400">shoots</span>
                  </div>
                  <div className="text-[10px] text-emerald-400 font-medium">
                    {analyticsSummary.currentMonthItem.completed} completed fulfillment
                  </div>
                </div>

                <div className="space-y-1.5 px-2 sm:border-r border-white/10">
                  <div className="flex items-center justify-between text-[10px] uppercase font-bold text-stone-400">
                    <span>Occupancy Rate</span>
                    <span className="text-amber-300 font-black">{analyticsSummary.occupancyRate}%</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-stone-700 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-500"
                      style={{ width: `${analyticsSummary.occupancyRate}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-stone-300 font-medium">
                    Slot Utilization ({analyticsSummary.currentMonthBookings}/50 Capacity)
                  </div>
                </div>

                <div className="space-y-1.5 pl-2 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-stone-400">Revenue Goal</span>
                    <div className="relative w-9 h-9 flex items-center justify-center">
                      <svg className="w-9 h-9 transform -rotate-90">
                        <circle
                          cx="18"
                          cy="18"
                          r="14"
                          stroke="currentColor"
                          strokeWidth="3"
                          className="text-stone-700 fill-transparent"
                        />
                        <circle
                          cx="18"
                          cy="18"
                          r="14"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeDasharray={87.9}
                          strokeDashoffset={87.9 - (87.9 * analyticsSummary.goalProgress) / 100}
                          strokeLinecap="round"
                          className="text-amber-400 fill-transparent transition-all duration-700"
                        />
                      </svg>
                      <span className="absolute text-[9px] font-black text-white">{analyticsSummary.goalProgress}%</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-black text-amber-300">
                      ₱{monthlyRevenueGoal.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-stone-300 font-medium">
                      Monthly Target
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Metric Strip */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Current Month Revenue */}
            <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between text-stone-400">
                <span className="text-[11px] font-bold uppercase">{analyticsSummary.currentMonthItem.month} Revenue</span>
                <DollarSign className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-xl font-black text-stone-900 mt-1">
                ₱{analyticsSummary.currentMonthRev.toLocaleString()}
              </div>
              <div className="text-[10px] text-stone-500 font-medium mt-1">
                Current month billing intake
              </div>
            </div>

            {/* Percentage-Based MoM Revenue Growth Indicator */}
            <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between text-stone-400">
                <span className="text-[11px] font-bold uppercase">MoM Revenue Growth</span>
                <TrendingUp className={`w-4 h-4 ${analyticsSummary.isPositiveGrowth ? 'text-emerald-600' : 'text-rose-600'}`} />
              </div>
              <div className={`text-xl font-black mt-1 flex items-center gap-1.5 ${
                analyticsSummary.isPositiveGrowth ? 'text-emerald-700' : 'text-rose-700'
              }`}>
                {analyticsSummary.isPositiveGrowth ? (
                  <TrendingUp className="w-5 h-5 text-emerald-600 stroke-[2.5]" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-rose-600 stroke-[2.5]" />
                )}
                <span>
                  {analyticsSummary.isPositiveGrowth ? '+' : ''}{analyticsSummary.momGrowthPct.toFixed(1)}%
                </span>
              </div>
              <div className="text-[10px] text-stone-500 font-medium mt-1">
                vs {analyticsSummary.prevMonthItem.month} (₱{analyticsSummary.prevMonthRev.toLocaleString()})
              </div>
            </div>

            {/* Total Tracked Revenue */}
            <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between text-stone-400">
                <span className="text-[11px] font-bold uppercase">Total Tracked Revenue</span>
                <BarChart3 className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-xl font-black text-stone-900 mt-1">
                ₱{analyticsSummary.totalRev.toLocaleString()}
              </div>
              <div className="text-[10px] text-stone-500 font-medium mt-1">
                Monthly Avg: ₱{analyticsSummary.avgMonthlyRev.toLocaleString()}
              </div>
            </div>

            {/* Total Bookings */}
            <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between text-stone-400">
                <span className="text-[11px] font-bold uppercase">Total Bookings</span>
                <CalendarIcon className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl font-black text-stone-900 mt-1">
                {analyticsSummary.totalBookings}
              </div>
              <span className="text-[10px] text-emerald-700 font-semibold block mt-1">
                {analyticsSummary.completionRate}% shoot completion rate
              </span>
            </div>

            {/* Avg Booking Value (AOV) */}
            <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs col-span-2 md:col-span-1">
              <div className="flex items-center justify-between text-stone-400">
                <span className="text-[11px] font-bold uppercase">Avg Booking (AOV)</span>
                <ArrowUpRight className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-xl font-black text-stone-900 mt-1">
                ₱{analyticsSummary.avgOrderValue.toLocaleString()}
              </div>
              <span className="text-[10px] text-stone-500 font-medium block mt-1">
                Includes studio add-ons & prints
              </span>
            </div>
          </div>

          {/* Primary Charts: Monthly Revenue & Booking Trends */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Revenue Chart */}
            <div className="p-6 bg-white rounded-3xl border border-stone-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-amber-600" /> Monthly Revenue Breakdown (PHP)
                  </h4>
                  <p className="text-[11px] text-stone-500">
                    Gross intake through PayMongo GCash and verified studio collections
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                    analyticsSummary.isPositiveGrowth
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}>
                    {analyticsSummary.isPositiveGrowth ? (
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5 text-rose-600 stroke-[2.5]" />
                    )}
                    <span>
                      {analyticsSummary.isPositiveGrowth ? '+' : ''}{analyticsSummary.momGrowthPct.toFixed(1)}% MoM
                    </span>
                    <span className="text-[10px] font-normal text-stone-500">
                      ({analyticsSummary.currentMonthItem.month} vs {analyticsSummary.prevMonthItem.month})
                    </span>
                  </div>

                  <div className="flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-200">
                    <button
                      onClick={() => handleExportCSV('filtered', false)}
                      title="Export revenue trend dataset as CSV"
                      className="px-2 py-1 text-[10px] font-bold text-stone-600 hover:text-emerald-700 hover:bg-white rounded transition-all flex items-center gap-1"
                    >
                      <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                      <span>CSV</span>
                    </button>
                    <button
                      onClick={() => handleExportPDF('filtered')}
                      title="Export revenue audit report as PDF"
                      className="px-2 py-1 text-[10px] font-bold text-stone-600 hover:text-amber-700 hover:bg-white rounded transition-all flex items-center gap-1"
                    >
                      <FileText className="w-3 h-3 text-amber-600" />
                      <span>PDF</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={displayMonthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0edea" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: '#78716c' }}
                      axisLine={{ stroke: '#e7e5e4' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#78716c' }}
                      axisLine={{ stroke: '#e7e5e4' }}
                      tickLine={false}
                      tickFormatter={(val: number) => `₱${(val / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload;
                          const isPos = (item.momGrowthPct ?? 0) >= 0;
                          return (
                            <div className="bg-stone-900 text-white p-3 rounded-xl shadow-xl border border-stone-800 text-xs space-y-1.5 min-w-[200px]">
                              <div className="font-bold text-amber-400 border-b border-stone-800 pb-1 flex items-center justify-between">
                                <span>{item.fullName || label}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                  isPos ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
                                }`}>
                                  {isPos ? '+' : ''}{item.momGrowthPct}% MoM
                                </span>
                              </div>
                              <div className="flex justify-between gap-3 text-stone-200">
                                <span>Revenue:</span>
                                <span className="font-bold text-amber-300">₱{Number(item.revenue).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between gap-3 text-purple-300 font-medium">
                                <span>Projected:</span>
                                <span>₱{Number(item.projectedRevenue).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between gap-3 text-stone-400">
                                <span>Target:</span>
                                <span>₱{Number(item.target).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between gap-3 text-stone-400 text-[10px] pt-1 border-t border-stone-800">
                                <span>Prior Month:</span>
                                <span>₱{Number(item.prevRevenue).toLocaleString()}</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                      formatter={val => {
                        if (val === 'revenue') return 'Actual Revenue (₱)';
                        if (val === 'projectedRevenue') return 'Projected Revenue (₱)';
                        return 'Target (₱)';
                      }}
                    />
                    <Bar
                      dataKey="revenue"
                      fill="#d97706"
                      radius={[6, 6, 0, 0]}
                      name="revenue"
                    />
                    <Bar
                      dataKey="target"
                      fill="#e7e5e4"
                      radius={[6, 6, 0, 0]}
                      name="target"
                    />
                    <Line
                      type="monotone"
                      dataKey="projectedRevenue"
                      stroke="#8b5cf6"
                      strokeWidth={2.5}
                      strokeDasharray="4 4"
                      name="projectedRevenue"
                      dot={{ r: 4, fill: '#8b5cf6' }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                <span>Annual Performance Benchmark: ₱850,000</span>
                <span className="text-amber-800 font-semibold">
                  Peak Month: {analyticsSummary.peakMonth} (₱{analyticsSummary.peakRevenue.toLocaleString()})
                </span>
              </div>
            </div>

            {/* Booking Trends Chart */}
            <div className="p-6 bg-white rounded-3xl border border-stone-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-blue-600" /> Booking Trends & Session Volume
                  </h4>
                  <p className="text-[11px] text-stone-500">
                    Monthly reservation trajectory vs successfully fulfilled studio photo shoots
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    {analyticsSummary.completionRate}% Retained
                  </span>

                  <div className="flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-200">
                    <button
                      onClick={() => handleExportCSV('filtered', true)}
                      title="Export booking trends & transaction log as CSV"
                      className="px-2 py-1 text-[10px] font-bold text-stone-600 hover:text-emerald-700 hover:bg-white rounded transition-all flex items-center gap-1"
                    >
                      <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                      <span>CSV</span>
                    </button>
                    <button
                      onClick={() => handleExportPDF('filtered')}
                      title="Export booking trends audit report as PDF"
                      className="px-2 py-1 text-[10px] font-bold text-stone-600 hover:text-blue-700 hover:bg-white rounded transition-all flex items-center gap-1"
                    >
                      <FileText className="w-3 h-3 text-blue-600" />
                      <span>PDF</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={displayMonthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0edea" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: '#78716c' }}
                      axisLine={{ stroke: '#e7e5e4' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#78716c' }}
                      axisLine={{ stroke: '#e7e5e4' }}
                      tickLine={false}
                      tickFormatter={(val: number) => `${val}`}
                    />
                    <Tooltip
                      formatter={(val: any, name: any) => [
                        `${val} sessions`,
                        name === 'bookings' ? 'Total Bookings' : 'Completed Shoots'
                      ]}
                      labelFormatter={(label: any) => `Period: ${label} 2026`}
                      contentStyle={{
                        backgroundColor: '#1c1917',
                        borderRadius: '12px',
                        border: 'none',
                        color: '#fff',
                        fontSize: '11px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                      formatter={val => (val === 'bookings' ? 'Total Bookings Trend' : 'Completed Shoots')}
                    />
                    <Line
                      type="monotone"
                      dataKey="bookings"
                      stroke="#2563eb"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#2563eb' }}
                      activeDot={{ r: 6 }}
                      name="bookings"
                    />
                    <Line
                      type="monotone"
                      dataKey="completed"
                      stroke="#059669"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: '#059669' }}
                      name="completed"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                <span>Graduation Surge: March – June</span>
                <span className="text-blue-800 font-semibold">
                  Total Sessions: {analyticsSummary.totalBookings}
                </span>
              </div>
            </div>
          </div>

          {/* Secondary Analytical Insights: Service Volume & Revenue Segmentation */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bookings Volume by Service Type */}
            <div className="p-6 bg-white rounded-3xl border border-stone-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" /> Distribution of Popular Photography Service Types
                  </h4>
                  <p className="text-[11px] text-stone-500">
                    Booking volume distribution across specialty photography service types
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-stone-600 bg-stone-100 px-2.5 py-0.5 rounded-full">
                  5 Categories
                </span>
              </div>

              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryBreakdown} layout="vertical" margin={{ top: 10, right: 10, left: 30, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0edea" />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#78716c' }} axisLine={{ stroke: '#e7e5e4' }} tickLine={false} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#78716c' }} width={140} axisLine={{ stroke: '#e7e5e4' }} tickLine={false} />
                    <Tooltip
                      formatter={(val: any) => [`${val} bookings`, 'Total Bookings']}
                      contentStyle={{
                        backgroundColor: '#1c1917',
                        borderRadius: '12px',
                        border: 'none',
                        color: '#fff',
                        fontSize: '11px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} formatter={() => 'Booking Count'} />
                    <Bar dataKey="bookings" fill="#d97706" radius={[0, 6, 6, 0]} name="bookings" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                <span>Top Service: Self-Shoot Studio & Graduation Milestones</span>
                <span className="text-amber-800 font-semibold">Total Bookings: 224</span>
              </div>
            </div>

            {/* Revenue Segmented by Service Type Bar Chart */}
            <div className="p-6 bg-white rounded-3xl border border-stone-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-600" /> Revenue Segmented by Service Type (₱)
                  </h4>
                  <p className="text-[11px] text-stone-500">
                    Identify the most profitable photography packages and gross revenue contribution
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Gross Profitability
                </span>
              </div>

              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryBreakdown} layout="vertical" margin={{ top: 10, right: 10, left: 30, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0edea" />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#78716c' }} axisLine={{ stroke: '#e7e5e4' }} tickLine={false} tickFormatter={(val) => `₱${(val/1000).toFixed(0)}k`} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#78716c' }} width={140} axisLine={{ stroke: '#e7e5e4' }} tickLine={false} />
                    <Tooltip
                      formatter={(val: any) => [`₱${Number(val).toLocaleString()}`, 'Package Gross Revenue']}
                      contentStyle={{
                        backgroundColor: '#1c1917',
                        borderRadius: '12px',
                        border: 'none',
                        color: '#fff',
                        fontSize: '11px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} formatter={() => 'Package Revenue (PHP)'} />
                    <Bar dataKey="revenue" fill="#059669" radius={[0, 6, 6, 0]} name="revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                <span>Top Revenue: Weddings & Debuts (₱187k) & Graduation</span>
                <span className="text-emerald-800 font-semibold">Total Revenue: ₱569,400</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Bookings & Calendar */}
      {activeTab === 'bookings' && (
        <div className="space-y-6">
          {/* Date Range Export Card */}
          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-sm text-stone-900 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export Booking Data by Date Range
                </h4>
                <p className="text-xs text-stone-500">
                  Filter and download studio reservation records as a professional CSV or PDF report.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-stone-600">
                  <span>From:</span>
                  <input
                    type="date"
                    value={exportStartDate}
                    onChange={e => setExportStartDate(e.target.value)}
                    className="p-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-1.5 text-xs text-stone-600">
                  <span>To:</span>
                  <input
                    type="date"
                    value={exportEndDate}
                    onChange={e => setExportEndDate(e.target.value)}
                    className="p-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => exportBookingsDateRangeCSV(studio.name, bookings, exportStartDate, exportEndDate)}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs flex items-center gap-1.5"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" /> Export CSV
                  </button>
                  <button
                    onClick={() => generateBookingsDateRangePDF(studio.name, bookings, exportStartDate, exportEndDate)}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" /> Export PDF
                  </button>
                </div>
              </div>
            </div>
          </div>

          <SystemCalendar bookings={bookings} studio={studio} />

          {/* Bookings table */}
          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
            <h3 className="font-bold text-stone-900 text-sm">All Studio Reservations</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-stone-50 text-stone-500 uppercase font-semibold text-[10px]">
                  <tr>
                    <th className="p-3">Ref ID</th>
                    <th className="p-3">Client</th>
                    <th className="p-3">Date & Slot</th>
                    <th className="p-3">Total Amount</th>
                    <th className="p-3">Balance</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {safeBookings.map(b => (
                    <tr key={b.id} className="hover:bg-stone-50/50">
                      <td className="p-3 font-mono text-[11px]">{b.id}</td>
                      <td className="p-3 font-medium text-stone-800">
                        <div>{b.customerName}</div>
                        <div className="text-[10px] text-stone-400">{b.customerEmail}</div>
                      </td>
                      <td className="p-3 text-stone-600">
                        {b.bookingDate} @ {b.timeSlot}
                      </td>
                      <td className="p-3 font-bold text-stone-900">₱{b.totalAmount.toLocaleString()}</td>
                      <td className="p-3 font-bold text-amber-700">₱{b.remainingBalance.toLocaleString()}</td>
                      <td className="p-3">
                        <select
                          value={b.status}
                          onChange={e => handleUpdateBookingStatus(b.id, e.target.value)}
                          className="text-xs p-1 border border-stone-300 rounded-lg bg-white"
                        >
                          <option value="Confirmed">Confirmed</option>
                          <option value="Ongoing">Ongoing</option>
                          <option value="Completed">Completed</option>
                          <option value="Awaiting Payment">Awaiting Payment</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => generateBookingReceiptPDF(b, studio)}
                          className="p-1 rounded text-stone-500 hover:text-stone-900 hover:bg-stone-100"
                          title="Print Receipt"
                        >
                          <Download className="w-4 h-4 text-amber-600" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Customer CRM */}
      {activeTab === 'crm' && (
        <StudioCustomerCRM
          studio={studio}
          currentUser={currentUser}
          bookings={bookings}
          services={services}
          packages={packages}
        />
      )}

      {/* Tab: Payment Reminders */}
      {activeTab === 'reminders' && (
        <StudioPaymentReminderService
          studio={studio}
          bookings={bookings}
          onRefreshBookings={loadStudioData}
        />
      )}

      {/* Tab: Email Templates */}
      {activeTab === 'emails' && (
        <StudioEmailTemplates
          studio={studio}
          bookings={bookings}
        />
      )}

      {/* Tab: Availability & Blackouts */}
      {activeTab === 'availability' && (
        <div className="space-y-8">
          <StudioAvailabilityCalendar
            studioId={studio.id}
            bookings={bookings}
            onRefreshData={loadStudioData}
          />
          <AvailabilityManager studioId={studio.id} />
        </div>
      )}

      {/* Tab: Services */}
      {activeTab === 'services' && (
        <div className="space-y-10">
          {/* Services Section */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-stone-900 text-lg">Photography Services</h3>
                <p className="text-xs text-stone-500">Individual studio sessions and standard rates.</p>
              </div>
              <button
                onClick={() => {
                  setEditingService(null);
                  resetServiceForm();
                  setShowAddService(true);
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" /> Add Service
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map(s => (
                <div key={s.id} className="group p-0 bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden transition-all hover:shadow-md">
                  <div className="relative h-40 overflow-hidden bg-stone-100">
                    <img src={s.image} alt={s.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                    {s.images && s.images.length > 1 && (
                      <span className="absolute top-2 left-2 bg-black/65 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-xs flex items-center gap-1">
                        <ImageIcon className="w-3 h-3 text-amber-400" /> {s.images.length} Photos
                      </span>
                    )}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEditService(s)}
                        className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg text-stone-700 hover:text-amber-600 shadow-sm"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteService(s.id)}
                        className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg text-stone-700 hover:text-red-600 shadow-sm"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-sm text-stone-900">{s.name}</h4>
                      <span className="text-sm font-bold text-amber-700">₱{s.basePrice.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-stone-500 line-clamp-2 h-8">{s.description}</p>

                    {/* Mini Thumbnails preview if multiple images */}
                    {s.images && s.images.length > 1 && (
                      <div className="flex items-center gap-1.5 pt-1 overflow-x-auto">
                        {s.images.slice(0, 5).map((img, i) => (
                          <img
                            key={i}
                            src={img}
                            alt=""
                            className={`w-8 h-8 rounded-lg object-cover border ${img === s.image ? 'border-amber-600 ring-1 ring-amber-500' : 'border-stone-200 opacity-70'}`}
                          />
                        ))}
                        {s.images.length > 5 && (
                          <span className="text-[10px] text-stone-400 font-bold">+{s.images.length - 5}</span>
                        )}
                      </div>
                    )}

                    <div className="text-[11px] text-stone-400 flex justify-between pt-3 border-t border-stone-100">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {s.durationMinutes} mins</span>
                      <span className="bg-stone-100 px-2 py-0.5 rounded-full text-stone-600 font-medium">{s.category}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Packages Section */}
          <div className="space-y-6 pt-6 border-t border-stone-200">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-stone-900 text-lg">Comprehensive Packages</h3>
                <p className="text-xs text-stone-500">Multi-service bundles, event coverages, and premium offerings.</p>
              </div>
              <button
                onClick={() => {
                  setEditingPackage(null);
                  resetPackageForm();
                  setShowAddPackage(true);
                }}
                className="px-4 py-2 bg-[#2c2a29] hover:bg-stone-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" /> Add Package
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {packages.map(p => (
                <div key={p.id} className="group p-0 bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden transition-all hover:shadow-md">
                  <div className="relative h-40 overflow-hidden bg-stone-100">
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                    {p.images && p.images.length > 1 && (
                      <span className="absolute top-2 left-2 bg-black/65 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-xs flex items-center gap-1">
                        <ImageIcon className="w-3 h-3 text-amber-400" /> {p.images.length} Photos
                      </span>
                    )}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEditPackage(p)}
                        className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg text-stone-700 hover:text-amber-600 shadow-sm"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeletePackage(p.id)}
                        className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg text-stone-700 hover:text-red-600 shadow-sm"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-sm text-stone-900">{p.name}</h4>
                      <span className="text-sm font-bold text-amber-700">₱{p.price.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-stone-500 line-clamp-2 h-8">{p.description}</p>

                    {/* Mini Thumbnails preview if multiple images */}
                    {p.images && p.images.length > 1 && (
                      <div className="flex items-center gap-1.5 pt-1 overflow-x-auto">
                        {p.images.slice(0, 5).map((img, i) => (
                          <img
                            key={i}
                            src={img}
                            alt=""
                            className={`w-8 h-8 rounded-lg object-cover border ${img === p.image ? 'border-amber-600 ring-1 ring-amber-500' : 'border-stone-200 opacity-70'}`}
                          />
                        ))}
                        {p.images.length > 5 && (
                          <span className="text-[10px] text-stone-400 font-bold">+{p.images.length - 5}</span>
                        )}
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-y-2 py-3 border-y border-stone-100">
                      <div className="text-[11px] text-stone-600 flex items-center gap-1.5">
                        <ImageIcon className="w-3 h-3 text-stone-400" /> {p.editedPhotosCount} Photos
                      </div>
                      <div className="text-[11px] text-stone-600 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-stone-400" /> {p.includedPrints}
                      </div>
                      <div className="text-[11px] text-stone-600 flex items-center gap-1.5">
                        <Users className="w-3 h-3 text-stone-400" /> {p.photographerCount} Staff
                      </div>
                      <div className="text-[11px] text-stone-600 flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-stone-400" /> {p.durationMinutes} mins
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add/Edit Service Modal */}
          {showAddService && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center border-b border-stone-100 pb-3">
                  <h4 className="font-bold text-sm text-stone-900">
                    {editingService ? 'Edit Photography Service' : 'Add New Photography Service'}
                  </h4>
                  <button onClick={() => setShowAddService(false)} className="text-stone-400 hover:text-stone-600">✕</button>
                </div>
                <form onSubmit={handleCreateService} className="space-y-3.5 text-xs">
                  <div>
                    <label className="font-semibold block mb-1">Service Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Graduation Solo Portrait"
                      value={newServiceName}
                      onChange={e => setNewServiceName(e.target.value)}
                      className="w-full p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold block mb-1">Base Price (PHP)</label>
                      <input
                        type="number"
                        required
                        value={newServicePrice}
                        onChange={e => setNewServicePrice(parseInt(e.target.value))}
                        className="w-full p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-semibold block mb-1">Duration (Mins)</label>
                      <input
                        type="number"
                        required
                        value={newServiceDuration}
                        onChange={e => setNewServiceDuration(parseInt(e.target.value))}
                        className="w-full p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Category</label>
                    <select
                      value={newServiceCategory}
                      onChange={e => setNewServiceCategory(e.target.value)}
                      className="w-full p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                    >
                      <option value="Graduation">Graduation</option>
                      <option value="Wedding & Debut">Wedding & Debut</option>
                      <option value="Maternity & Newborn">Maternity & Newborn</option>
                      <option value="Portrait & Headshot">Portrait & Headshot</option>
                      <option value="Commercial">Commercial</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Description</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="What's included in this basic service?"
                      value={newServiceDesc}
                      onChange={e => setNewServiceDesc(e.target.value)}
                      className="w-full p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Available Time Slots (Comma-separated)</label>
                    <input
                      type="text"
                      required
                      placeholder="09:00, 10:30, 13:00"
                      value={newServiceSlots}
                      onChange={e => setNewServiceSlots(e.target.value)}
                      className="w-full p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  {/* Device Multi-File Image Upload Dropzone */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold block">Service Photos & Showcase Portfolio</label>
                      <span className="text-[10px] text-amber-800 font-bold bg-amber-100/80 px-2 py-0.5 rounded-full">
                        Upload Multiple Device Photos
                      </span>
                    </div>

                    <div className="p-3.5 border-2 border-dashed border-stone-300 hover:border-amber-500 rounded-2xl bg-stone-50 hover:bg-amber-50/30 transition-all text-center">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        id="service-file-upload-input"
                        className="hidden"
                        onChange={handleServiceFileUpload}
                      />
                      <label
                        htmlFor="service-file-upload-input"
                        className="cursor-pointer flex flex-col items-center justify-center gap-1.5"
                      >
                        <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold shadow-xs">
                          <Upload className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="font-bold text-xs text-stone-900 hover:underline">
                            {isUploadingServiceImages ? 'Processing File(s)...' : '📷 Upload Photos from Local Device'}
                          </span>
                          <p className="text-[10px] text-stone-500 mt-0.5">
                            Select multiple image files from your computer, tablet, or phone.
                          </p>
                        </div>
                      </label>
                    </div>

                    {/* Uploaded Gallery Thumbnails */}
                    {newServiceImages.length > 0 && (
                      <div className="mt-2.5 space-y-1">
                        <div className="text-[10px] text-stone-500 font-semibold flex justify-between items-center">
                          <span>Uploaded Showcase Photos ({newServiceImages.length})</span>
                          <span>Click photo to set as Main Cover</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1.5 bg-stone-100/70 rounded-xl border border-stone-200">
                          {newServiceImages.map((imgUrl, idx) => {
                            const isCover = imgUrl === newServiceImage;
                            return (
                              <div
                                key={idx}
                                className={`relative group rounded-xl overflow-hidden border-2 transition-all h-20 bg-white ${
                                  isCover ? 'border-amber-600 ring-2 ring-amber-500/30' : 'border-stone-200 opacity-85 hover:opacity-100'
                                }`}
                              >
                                <img src={imgUrl} alt={`Service ${idx}`} className="w-full h-full object-cover" />
                                {isCover && (
                                  <span className="absolute top-1 left-1 bg-amber-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                                    Main Cover
                                  </span>
                                )}
                                <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-1">
                                  {!isCover && (
                                    <button
                                      type="button"
                                      onClick={() => setNewServiceImage(imgUrl)}
                                      className="px-1.5 py-0.5 bg-amber-600 text-white text-[9px] font-bold rounded shadow-xs"
                                    >
                                      Set Cover
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const next = newServiceImages.filter((_, i) => i !== idx);
                                      setNewServiceImages(next);
                                      if (isCover && next.length > 0) {
                                        setNewServiceImage(next[0]);
                                      }
                                    }}
                                    className="p-1 bg-rose-600 text-white rounded-full shadow-xs hover:bg-rose-700"
                                    title="Remove photo"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="mt-2">
                      <input
                        type="url"
                        placeholder="Or paste external photo URL..."
                        value={newServiceImage}
                        onChange={e => {
                          setNewServiceImage(e.target.value);
                          if (e.target.value && !newServiceImages.includes(e.target.value)) {
                            setNewServiceImages(prev => [...prev, e.target.value]);
                          }
                        }}
                        className="w-full p-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={() => setShowAddService(false)}
                      className="px-4 py-2 text-stone-600 font-semibold hover:bg-stone-50 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-amber-600 text-white rounded-xl font-bold shadow-md shadow-amber-600/20"
                    >
                      {editingService ? 'Update Service' : 'Save Service'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Add/Edit Package Modal */}
          {showAddPackage && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center border-b border-stone-100 pb-3">
                  <h4 className="font-bold text-sm text-stone-900">
                    {editingPackage ? 'Edit Premium Package' : 'Create New Package'}
                  </h4>
                  <button onClick={() => setShowAddPackage(false)} className="text-stone-400 hover:text-stone-600">✕</button>
                </div>
                <form onSubmit={handleSavePackage} className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="font-semibold block mb-1">Package Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Full Wedding Day Coverage"
                        value={newPkgName}
                        onChange={e => setNewPkgName(e.target.value)}
                        className="w-full p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-semibold block mb-1">Price (PHP)</label>
                      <input
                        type="number"
                        required
                        value={newPkgPrice}
                        onChange={e => setNewPkgPrice(parseInt(e.target.value))}
                        className="w-full p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-semibold block mb-1">Total Duration (Mins)</label>
                      <input
                        type="number"
                        required
                        value={newPkgDuration}
                        onChange={e => setNewPkgDuration(parseInt(e.target.value))}
                        className="w-full p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-semibold block mb-1">Edited Photos Count</label>
                      <input
                        type="number"
                        required
                        value={newPkgPhotos}
                        onChange={e => setNewPkgPhotos(parseInt(e.target.value))}
                        className="w-full p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-semibold block mb-1">Staff/Photographers</label>
                      <input
                        type="number"
                        required
                        value={newPkgPhotogs}
                        onChange={e => setNewPkgPhotogs(parseInt(e.target.value))}
                        className="w-full p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Included Prints & Deliverables</label>
                    <input
                      type="text"
                      placeholder="e.g. 10pcs 4R, 1pc 8R Framed, 1 USB"
                      value={newPkgPrints}
                      onChange={e => setNewPkgPrints(e.target.value)}
                      className="w-full p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Included Services (Comma-separated names)</label>
                    <input
                      type="text"
                      placeholder="Full Retouch, Digital Copies, RAW files"
                      value={newPkgInclusions}
                      onChange={e => setNewPkgInclusions(e.target.value)}
                      className="w-full p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Description</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Detail every inclusion and term for this package..."
                      value={newPkgDesc}
                      onChange={e => setNewPkgDesc(e.target.value)}
                      className="w-full p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  {/* Device Multi-File Image Upload Dropzone for Packages */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold block">Package Images & Showcase Gallery</label>
                      <span className="text-[10px] text-amber-800 font-bold bg-amber-100/80 px-2 py-0.5 rounded-full">
                        Upload Multiple Device Photos
                      </span>
                    </div>

                    <div className="p-3.5 border-2 border-dashed border-stone-300 hover:border-amber-500 rounded-2xl bg-stone-50 hover:bg-amber-50/30 transition-all text-center">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        id="pkg-file-upload-input"
                        className="hidden"
                        onChange={handlePkgFileUpload}
                      />
                      <label
                        htmlFor="pkg-file-upload-input"
                        className="cursor-pointer flex flex-col items-center justify-center gap-1.5"
                      >
                        <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold shadow-xs">
                          <Upload className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="font-bold text-xs text-stone-900 hover:underline">
                            {isUploadingPkgImages ? 'Processing File(s)...' : '📷 Upload Photos from Local Device'}
                          </span>
                          <p className="text-[10px] text-stone-500 mt-0.5">
                            Select multiple image files from your computer, tablet, or phone.
                          </p>
                        </div>
                      </label>
                    </div>

                    {/* Uploaded Gallery Thumbnails */}
                    {newPkgImages.length > 0 && (
                      <div className="mt-2.5 space-y-1">
                        <div className="text-[10px] text-stone-500 font-semibold flex justify-between items-center">
                          <span>Uploaded Package Showcase Photos ({newPkgImages.length})</span>
                          <span>Click photo to set as Main Cover</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1.5 bg-stone-100/70 rounded-xl border border-stone-200">
                          {newPkgImages.map((imgUrl, idx) => {
                            const isCover = imgUrl === newPkgImage;
                            return (
                              <div
                                key={idx}
                                className={`relative group rounded-xl overflow-hidden border-2 transition-all h-20 bg-white ${
                                  isCover ? 'border-amber-600 ring-2 ring-amber-500/30' : 'border-stone-200 opacity-85 hover:opacity-100'
                                }`}
                              >
                                <img src={imgUrl} alt={`Package ${idx}`} className="w-full h-full object-cover" />
                                {isCover && (
                                  <span className="absolute top-1 left-1 bg-amber-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                                    Main Cover
                                  </span>
                                )}
                                <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-1">
                                  {!isCover && (
                                    <button
                                      type="button"
                                      onClick={() => setNewPkgImage(imgUrl)}
                                      className="px-1.5 py-0.5 bg-amber-600 text-white text-[9px] font-bold rounded shadow-xs"
                                    >
                                      Set Cover
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const next = newPkgImages.filter((_, i) => i !== idx);
                                      setNewPkgImages(next);
                                      if (isCover && next.length > 0) {
                                        setNewPkgImage(next[0]);
                                      }
                                    }}
                                    className="p-1 bg-rose-600 text-white rounded-full shadow-xs hover:bg-rose-700"
                                    title="Remove photo"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="mt-2">
                      <input
                        type="url"
                        placeholder="Or paste external photo URL..."
                        value={newPkgImage}
                        onChange={e => {
                          setNewPkgImage(e.target.value);
                          if (e.target.value && !newPkgImages.includes(e.target.value)) {
                            setNewPkgImages(prev => [...prev, e.target.value]);
                          }
                        }}
                        className="w-full p-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={() => setShowAddPackage(false)}
                      className="px-4 py-2 text-stone-600 font-semibold hover:bg-stone-50 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-[#2c2a29] text-white rounded-xl font-bold shadow-md"
                    >
                      {editingPackage ? 'Update Package' : 'Create Package'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Print Orders */}
      {activeTab === 'prints' && (
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
          <h3 className="font-bold text-stone-900 text-sm">Physical Print Fulfillment Pipeline</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-stone-50 text-stone-500 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Order ID</th>
                  <th className="p-3">Photo</th>
                  <th className="p-3">Quantity</th>
                  <th className="p-3">Total Amount</th>
                  <th className="p-3">Delivery Address</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Tracking</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {printOrders.map(po => (
                  <tr key={po.id}>
                    <td className="p-3 font-mono text-[11px]">{po.id}</td>
                    <td className="p-3">
                      <img src={po.uploadedPhoto} alt="print" className="w-10 h-10 rounded object-cover" />
                    </td>
                    <td className="p-3 font-bold">{po.quantity}</td>
                    <td className="p-3 font-bold text-amber-700">₱{po.totalAmount.toLocaleString()}</td>
                    <td className="p-3 text-stone-600">{po.shippingAddress}</td>
                    <td className="p-3">
                      <select
                        value={po.status}
                        onChange={e => handleUpdatePrintStatus(po.id, e.target.value)}
                        className="text-xs p-1 border border-stone-300 rounded bg-white"
                      >
                        <option value="submitted">Submitted</option>
                        <option value="printing">Printing</option>
                        <option value="framed">Framed</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                      </select>
                    </td>
                    <td className="p-3">
                      <input
                        type="text"
                        placeholder="Tracking..."
                        defaultValue={po.trackingNumber || ''}
                        onBlur={e => handleUpdatePrintStatus(po.id, po.status, e.target.value)}
                        className="text-xs p-1 border border-stone-300 rounded w-24"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Proofing */}
      {activeTab === 'proofing' && (
        <div className="space-y-6">
          {proofings.map(p => (
            <ClientGallery
              key={p.id}
              proofing={p}
              currentUser={currentUser}
              isStudioOwner={true}
              onUpdate={updated => {
                setProofings(prev => prev.map(item => (item.id === updated.id ? updated : item)));
              }}
            />
          ))}
        </div>
      )}

      {/* Tab: Studio Inventory */}
      {activeTab === 'inventory' && (
        <StudioInventoryManager
          studioId={studio.id}
          studioName={studio.name}
          items={inventory}
          onAddGear={handleAddGear}
          onUpdateStatus={handleUpdateGearStatus}
          onDeleteGear={handleDeleteGear}
          isLoading={isLoading}
        />
      )}

      {/* Tab: Settings */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveStudioProfile} className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4 max-w-2xl">
          <h3 className="font-bold text-stone-900 text-sm">Edit Studio Information</h3>

          {savedSettingsNotice && (
            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Studio details saved successfully!
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Studio Name</label>
            <input
              type="text"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              className="w-full text-xs p-2.5 border border-stone-300 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Physical Address in Cainta</label>
            <input
              type="text"
              value={editAddress}
              onChange={e => setEditAddress(e.target.value)}
              className="w-full text-xs p-2.5 border border-stone-300 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Contact Phone</label>
              <input
                type="text"
                value={editContact}
                onChange={e => setEditContact(e.target.value)}
                className="w-full text-xs p-2.5 border border-stone-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Business Hours</label>
              <input
                type="text"
                value={editHours}
                onChange={e => setEditHours(e.target.value)}
                className="w-full text-xs p-2.5 border border-stone-300 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Monthly Revenue Goal (₱)</label>
            <input
              type="number"
              value={monthlyRevenueGoal}
              onChange={e => setMonthlyRevenueGoal(Number(e.target.value) || 0)}
              className="w-full text-xs p-2.5 border border-stone-300 rounded-xl font-bold text-amber-700"
            />
            <p className="text-[11px] text-stone-400 mt-1">Sets the target gross revenue goal tracked by executive summary progress indicators.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">About & Specialization</label>
            <textarea
              rows={3}
              value={editDesc}
              onChange={e => setEditDesc(e.target.value)}
              className="w-full text-xs p-2.5 border border-stone-300 rounded-xl"
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-md"
          >
            Update Studio Profile
          </button>
        </form>
      )}

      {/* Studio Analytics Export Archive Modal */}
      {showExportModal && (
        <div
          id="modal-export-analytics"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowExportModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-stone-200 space-y-5 animate-in fade-in zoom-in-95"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-800">
                  <FileDown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">
                    Export Studio Records & Analytics
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Download revenue metrics and booking trend records for {studio.name}.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {/* Format Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                1. Select Export Format
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setExportFormat('csv')}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    exportFormat === 'csv'
                      ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-600/20'
                      : 'border-stone-200 hover:border-stone-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-stone-900">CSV Spreadsheet (.csv)</span>
                    </div>
                    {exportFormat === 'csv' && <Check className="w-4 h-4 text-emerald-600" />}
                  </div>
                  <p className="text-[11px] text-stone-500 leading-snug">
                    Raw tabular data with UTF-8 BOM. Best for Microsoft Excel, Google Sheets, or accountant software.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setExportFormat('pdf')}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    exportFormat === 'pdf'
                      ? 'border-amber-600 bg-amber-50/70 ring-2 ring-amber-600/20'
                      : 'border-stone-200 hover:border-stone-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-amber-600" />
                      <span className="text-xs font-bold text-stone-900">Certified Audit PDF (.pdf)</span>
                    </div>
                    {exportFormat === 'pdf' && <Check className="w-4 h-4 text-amber-600" />}
                  </div>
                  <p className="text-[11px] text-stone-500 leading-snug">
                    Executive layout with KPI summary cards, monthly trajectory tables, and official MIS certification stamp.
                  </p>
                </button>
              </div>
            </div>

            {/* Scope Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                2. Reporting Period Scope
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setExportScope('filtered')}
                  className={`p-3 rounded-xl border text-left text-xs transition-all ${
                    exportScope === 'filtered'
                      ? 'border-stone-900 bg-stone-900 text-white font-bold'
                      : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <div className="font-semibold">Current Timeframe View</div>
                  <div className={`text-[10px] mt-0.5 ${exportScope === 'filtered' ? 'text-stone-300' : 'text-stone-500'}`}>
                    {getTimeframeLabel('filtered')} ({displayMonthlyData.length} mos)
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setExportScope('all')}
                  className={`p-3 rounded-xl border text-left text-xs transition-all ${
                    exportScope === 'all'
                      ? 'border-stone-900 bg-stone-900 text-white font-bold'
                      : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <div className="font-semibold">Full 2026 Annual Archive</div>
                  <div className={`text-[10px] mt-0.5 ${exportScope === 'all' ? 'text-stone-300' : 'text-stone-500'}`}>
                    All 12 Calendar Months (Jan - Dec)
                  </div>
                </button>
              </div>
            </div>

            {/* CSV Optional Transaction Logs */}
            {exportFormat === 'csv' && (
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeTransactionsInCSV}
                    onChange={e => setIncludeTransactionsInCSV(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-stone-900">
                      Include Granular Client Booking Transaction Log
                    </span>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Appends a detailed sub-table of all {safeBookings.length} reservations with customer names, contact info, booking IDs, session status, amounts, and balances.
                    </p>
                  </div>
                </label>
              </div>
            )}

            {/* Summary Data Preview */}
            <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200/80 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-amber-900 uppercase">Export Package Summary</span>
                <div className="text-stone-700 text-[11px]">
                  {exportScope === 'all' ? fullMonthlyData.length : displayMonthlyData.length} monthly trajectory records •{' '}
                  <span className="font-bold text-stone-900">
                    ₱{(exportScope === 'all'
                      ? fullMonthlyData.reduce((acc, m) => acc + m.revenue, 0)
                      : analyticsSummary.totalRev
                    ).toLocaleString()}
                  </span>{' '}
                  gross revenue
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900 uppercase">
                {exportFormat.toUpperCase()} Ready
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-export"
                type="button"
                onClick={() => {
                  if (exportFormat === 'csv') {
                    handleExportCSV(exportScope, includeTransactionsInCSV);
                  } else {
                    handleExportPDF(exportScope);
                  }
                  setShowExportModal(false);
                }}
                className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors ${
                  exportFormat === 'csv'
                    ? 'bg-emerald-700 hover:bg-emerald-600'
                    : 'bg-amber-600 hover:bg-amber-500'
                }`}
              >
                <Download className="w-4 h-4" />
                <span>
                  Download {exportFormat.toUpperCase()} Record
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Toast Notification */}
      {exportToastNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-stone-800 flex items-center gap-3 text-xs animate-in slide-in-from-bottom-5">
          <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-stone-100">Export Complete</div>
            <div className="text-[11px] text-stone-300">{exportToastNotice}</div>
          </div>
          <button
            onClick={() => setExportToastNotice(null)}
            className="ml-2 text-stone-400 hover:text-white text-xs"
          >
            ✕
          </button>
        </div>
      )}
      </main>
    </div>
  );
};

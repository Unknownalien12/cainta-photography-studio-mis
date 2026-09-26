import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  DollarSign,
  Calendar,
  Clock,
  Phone,
  Mail,
  Plus,
  Trash2,
  Tag,
  ChevronRight,
  Star,
  Award,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  X,
  RefreshCw,
  UserCheck,
  Sparkles,
  TrendingUp,
  MessageSquare,
  MapPin,
  CreditCard,
  ArrowUpDown
} from 'lucide-react';
import type {
  Studio,
  Booking,
  Service,
  Package,
  User,
  StudioClientCRM,
  StudioClientNote,
  CRMNoteCategory
} from '../db/types.js';
import { apiRequest } from '../utils/apiClient.js';
import { toast } from '../utils/toast.js';

interface StudioCustomerCRMProps {
  studio: Studio;
  currentUser: User;
  bookings: Booking[];
  services: Service[];
  packages: Package[];
}

export const StudioCustomerCRM: React.FC<StudioCustomerCRMProps> = ({
  studio,
  currentUser,
  bookings,
  services,
  packages
}) => {
  const [clients, setClients] = useState<StudioClientCRM[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'ltv-desc' | 'ltv-asc' | 'bookings-desc' | 'recent' | 'name'>('ltv-desc');
  const [selectedClient, setSelectedClient] = useState<StudioClientCRM | null>(null);

  // Note creation form state
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteCategory, setNewNoteCategory] = useState<CRMNoteCategory>('preference');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [crmToast, setCrmToast] = useState<string | null>(null);

  // Compute fallback client CRM data directly from bookings to guarantee instant data
  const fallbackClients = useMemo(() => {
    const map = new Map<string, {
      bookings: Booking[];
      email: string;
      name: string;
      phone: string;
      customerId?: string;
    }>();

    for (const b of bookings) {
      const emailKey = (b.customerEmail || '').trim().toLowerCase();
      if (!emailKey) continue;

      if (!map.has(emailKey)) {
        map.set(emailKey, {
          bookings: [],
          email: b.customerEmail,
          name: b.customerName,
          phone: b.customerPhone,
          customerId: b.customerId
        });
      }
      const c = map.get(emailKey)!;
      c.bookings.push(b);
      if (b.customerName) c.name = b.customerName;
      if (b.customerPhone) c.phone = b.customerPhone;
      if (b.customerId) c.customerId = b.customerId;
    }

    const res: StudioClientCRM[] = [];
    for (const [emailKey, cData] of map.entries()) {
      const sorted = [...cData.bookings].sort(
        (a, b) => new Date(b.bookingDate || b.createdAt).getTime() - new Date(a.bookingDate || a.createdAt).getTime()
      );

      const totalBookings = sorted.length;
      const completedBookings = sorted.filter(b => b.status === 'Completed').length;
      const cancelledBookings = sorted.filter(b => b.status === 'Cancelled').length;

      const lifetimeValue = sorted.reduce((sum, b) => {
        if (b.status === 'Completed') return sum + (b.totalAmount || b.amountPaid || 0);
        if (b.status !== 'Cancelled') return sum + (b.amountPaid || 0);
        return sum;
      }, 0);

      const totalPaid = sorted.reduce((sum, b) => sum + (b.amountPaid || 0), 0);
      const outstandingBalance = sorted.reduce((sum, b) => {
        if (b.status !== 'Cancelled' && b.status !== 'Completed') {
          return sum + (b.remainingBalance || 0);
        }
        return sum;
      }, 0);

      const firstBookingDate = sorted.length > 0 ? sorted[sorted.length - 1].bookingDate : 'N/A';
      const lastBookingDate = sorted.length > 0 ? sorted[0].bookingDate : 'N/A';

      const srvFreq = new Map<string, number>();
      for (const b of sorted) {
        const sName = services.find(s => s.id === b.serviceId)?.name ||
                      packages.find(p => p.id === b.packageId)?.name ||
                      'Studio Session';
        srvFreq.set(sName, (srvFreq.get(sName) || 0) + 1);
      }
      const preferredServices = Array.from(srvFreq.entries())
        .sort((a, b) => b[1] - a[1])
        .map(entry => entry[0]);

      const tags: string[] = [];
      if (lifetimeValue >= 3500 || totalBookings >= 3) tags.push('VIP Client');
      if (totalBookings > 1) tags.push('Repeat Client');
      if (totalBookings === 1) tags.push('First-Time Client');
      if (outstandingBalance > 0) tags.push('Balance Due');
      if (completedBookings >= 2) tags.push('Loyal Patron');

      res.push({
        id: cData.customerId || `crm_${emailKey}`,
        customerId: cData.customerId,
        name: cData.name || 'Client',
        email: cData.email,
        phone: cData.phone || 'N/A',
        totalBookings,
        completedBookings,
        cancelledBookings,
        lifetimeValue,
        totalPaid,
        outstandingBalance,
        firstBookingDate,
        lastBookingDate,
        preferredServices,
        tags,
        notes: [],
        bookings: sorted
      });
    }

    return res.sort((a, b) => b.lifetimeValue - a.lifetimeValue);
  }, [bookings, services, packages]);

  // Fetch from server CRM endpoint
  const fetchCRMClients = async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest<StudioClientCRM[]>(`/api/studios/${studio.id}/crm/customers`);
      if (Array.isArray(data) && data.length > 0) {
        setClients(data);
        // Also update selectedClient if one was active
        if (selectedClient) {
          const fresh = data.find(c => c.email.toLowerCase() === selectedClient.email.toLowerCase());
          if (fresh) setSelectedClient(fresh);
        }
      } else {
        setClients(fallbackClients);
      }
    } catch (err) {
      console.warn('Could not fetch server CRM data, using active booking records:', err);
      setClients(fallbackClients);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCRMClients();
  }, [studio.id, fallbackClients]);

  // Overall CRM metrics
  const crmMetrics = useMemo(() => {
    const list = clients.length > 0 ? clients : fallbackClients;
    const totalClients = list.length;
    const totalLTV = list.reduce((acc, c) => acc + c.lifetimeValue, 0);
    const avgLTV = totalClients > 0 ? Math.round(totalLTV / totalClients) : 0;
    const repeatClients = list.filter(c => c.totalBookings > 1).length;
    const repeatRate = totalClients > 0 ? Math.round((repeatClients / totalClients) * 100) : 0;
    const totalOutstanding = list.reduce((acc, c) => acc + c.outstandingBalance, 0);
    const totalNotes = list.reduce((acc, c) => acc + (c.notes?.length || 0), 0);

    return {
      totalClients,
      totalLTV,
      avgLTV,
      repeatClients,
      repeatRate,
      totalOutstanding,
      totalNotes
    };
  }, [clients, fallbackClients]);

  // Filtered and sorted clients
  const displayedClients = useMemo(() => {
    const list = clients.length > 0 ? clients : fallbackClients;
    return list
      .filter(client => {
        const matchesSearch =
          client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          client.phone.includes(searchQuery);

        if (!matchesSearch) return false;

        if (selectedTag === 'all') return true;
        if (selectedTag === 'has-notes') return (client.notes?.length || 0) > 0;
        return client.tags.includes(selectedTag);
      })
      .sort((a, b) => {
        if (sortBy === 'ltv-desc') return b.lifetimeValue - a.lifetimeValue;
        if (sortBy === 'ltv-asc') return a.lifetimeValue - b.lifetimeValue;
        if (sortBy === 'bookings-desc') return b.totalBookings - a.totalBookings;
        if (sortBy === 'recent') {
          return new Date(b.lastBookingDate).getTime() - new Date(a.lastBookingDate).getTime();
        }
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return 0;
      });
  }, [clients, fallbackClients, searchQuery, selectedTag, sortBy]);

  // Add a consultation note for client
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !newNoteText.trim()) return;

    setIsSubmittingNote(true);
    try {
      const emailEncoded = encodeURIComponent(selectedClient.email.toLowerCase());
      const note = await apiRequest<StudioClientNote>(
        `/api/studios/${studio.id}/crm/customers/${emailEncoded}/notes`,
        {
          method: 'POST',
          body: JSON.stringify({
            note: newNoteText.trim(),
            category: newNoteCategory
          })
        }
      );

      // Update state locally
      setClients(prev =>
        prev.map(c => {
          if (c.email.toLowerCase() === selectedClient.email.toLowerCase()) {
            return {
              ...c,
              notes: [note, ...(c.notes || [])]
            };
          }
          return c;
        })
      );

      setSelectedClient(prev => {
        if (!prev) return null;
        return {
          ...prev,
          notes: [note, ...(prev.notes || [])]
        };
      });

      setNewNoteText('');
      toast.success('Naitala ang client consultation note!', { title: 'CRM Note Added' });
      setCrmToast('Client note recorded successfully!');
      setTimeout(() => setCrmToast(null), 3500);
    } catch (err: any) {
      console.error('Error adding client note:', err);
      // Fallback local update if network is unavailable
      const localNote: StudioClientNote = {
        id: `cn_${Date.now()}`,
        studioId: studio.id,
        clientEmail: selectedClient.email.toLowerCase(),
        note: newNoteText.trim(),
        category: newNoteCategory,
        authorName: currentUser.fullName || 'Studio Staff',
        createdAt: new Date().toISOString()
      };

      setClients(prev =>
        prev.map(c => {
          if (c.email.toLowerCase() === selectedClient.email.toLowerCase()) {
            return {
              ...c,
              notes: [localNote, ...(c.notes || [])]
            };
          }
          return c;
        })
      );

      setSelectedClient(prev => {
        if (!prev) return null;
        return {
          ...prev,
          notes: [localNote, ...(prev.notes || [])]
        };
      });

      setNewNoteText('');
      toast.info('Nai-save ang note sa local CRM cache.', { title: 'CRM Note Saved' });
      setCrmToast('Client note saved locally!');
      setTimeout(() => setCrmToast(null), 3500);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  // Delete a note
  const handleDeleteNote = async (noteId: string) => {
    if (!selectedClient) return;

    try {
      const emailEncoded = encodeURIComponent(selectedClient.email.toLowerCase());
      await apiRequest(
        `/api/studios/${studio.id}/crm/customers/${emailEncoded}/notes/${noteId}`,
        { method: 'DELETE' }
      );

      setClients(prev =>
        prev.map(c => {
          if (c.email.toLowerCase() === selectedClient.email.toLowerCase()) {
            return {
              ...c,
              notes: (c.notes || []).filter(n => n.id !== noteId)
            };
          }
          return c;
        })
      );

      setSelectedClient(prev => {
        if (!prev) return null;
        return {
          ...prev,
          notes: (prev.notes || []).filter(n => n.id !== noteId)
        };
      });

      toast.success('Tinanggal ang note mula sa client history.', { title: 'Note Deleted' });
      setCrmToast('Client note removed.');
      setTimeout(() => setCrmToast(null), 3000);
    } catch (err: any) {
      console.error('Error deleting note:', err);
      toast.error('Nabigo ang pagbura ng note.');
    }
  };

  // Export CRM Roster as CSV
  const handleExportCRMCSV = () => {
    const list = displayedClients;
    const rows = [
      ['Customer Name', 'Email', 'Contact Phone', 'Lifetime Value (PHP)', 'Total Bookings', 'Completed Shoots', 'Balance Due (PHP)', 'First Session Date', 'Last Session Date', 'Customer Tags', 'Notes Count']
    ];

    for (const c of list) {
      rows.push([
        `"${c.name.replace(/"/g, '""')}"`,
        `"${c.email.replace(/"/g, '""')}"`,
        `"${c.phone.replace(/"/g, '""')}"`,
        c.lifetimeValue.toString(),
        c.totalBookings.toString(),
        c.completedBookings.toString(),
        c.outstandingBalance.toString(),
        c.firstBookingDate,
        c.lastBookingDate,
        `"${c.tags.join('; ')}"`,
        (c.notes?.length || 0).toString()
      ]);
    }

    const csvContent = '\uFEFF' + rows.map(r => r.join(',')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${studio.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_customer_crm_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Matagumpay na na-export ang ${list.length} CRM client records sa CSV!`, { title: 'CSV Exported' });
    setCrmToast('Client CRM roster exported as CSV!');
    setTimeout(() => setCrmToast(null), 3500);
  };

  const getCategoryColor = (cat: CRMNoteCategory) => {
    switch (cat) {
      case 'preference':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'vip':
        return 'bg-amber-50 text-amber-900 border-amber-200';
      case 'style':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'billing':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'milestone':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      default:
        return 'bg-stone-100 text-stone-700 border-stone-200';
    }
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* CRM Header Card */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-stone-900">Customer CRM</h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
              {crmMetrics.totalClients} Total Clients
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Track client booking history, lifetime customer value (LTV), preferences, and private studio consultation notes for {studio.name}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchCRMClients}
            disabled={isLoading}
            className="px-3 py-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Refresh CRM records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>

          <button
            id="btn-export-crm-csv"
            onClick={handleExportCRMCSV}
            className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export CRM CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
            <span>Total Clients</span>
            <UserCheck className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-black text-stone-900">{crmMetrics.totalClients}</div>
          <div className="text-[10px] text-stone-500 mt-1">Unique booking patrons</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
            <span>Studio Lifetime Value</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-700">
            ₱{crmMetrics.totalLTV.toLocaleString()}
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-1">
            ₱{crmMetrics.avgLTV.toLocaleString()} avg / client
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
            <span>Repeat Clients</span>
            <Award className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-black text-blue-700">{crmMetrics.repeatClients}</div>
          <div className="text-[10px] text-stone-500 mt-1">
            {crmMetrics.repeatRate}% loyalty retention rate
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
            <span>Balance Due</span>
            <CreditCard className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-black text-amber-700">
            ₱{crmMetrics.totalOutstanding.toLocaleString()}
          </div>
          <div className="text-[10px] text-stone-500 mt-1">Active shoot balances</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
            <span>Client Notes Logged</span>
            <MessageSquare className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-black text-purple-700">{crmMetrics.totalNotes}</div>
          <div className="text-[10px] text-stone-500 mt-1">Private studio insights</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md bg-stone-50 px-3 py-2 rounded-xl border border-stone-200">
          <Search className="w-4 h-4 text-stone-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by client name, email, or contact number..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-stone-900 placeholder:text-stone-400 focus:outline-hidden"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-stone-400 hover:text-stone-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tag Filter Chips */}
          <div className="flex flex-wrap items-center gap-1">
            {[
              { id: 'all', label: 'All' },
              { id: 'VIP Client', label: 'VIP' },
              { id: 'Repeat Client', label: 'Repeat' },
              { id: 'First-Time Client', label: 'First-Time' },
              { id: 'Balance Due', label: 'Balance Due' },
              { id: 'has-notes', label: 'Has Notes' }
            ].map(tag => (
              <button
                key={tag.id}
                onClick={() => setSelectedTag(tag.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  selectedTag === tag.id
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {tag.label}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-stone-200">
            <ArrowUpDown className="w-3.5 h-3.5 text-stone-400" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="text-xs bg-stone-50 border border-stone-200 rounded-lg py-1 px-2 text-stone-700 font-semibold focus:outline-hidden"
            >
              <option value="ltv-desc">Highest LTV (₱)</option>
              <option value="ltv-asc">Lowest LTV (₱)</option>
              <option value="bookings-desc">Most Bookings</option>
              <option value="recent">Most Recent Shoot</option>
              <option value="name">Client Name (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customer Client Cards / Grid */}
      {displayedClients.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-stone-200">
          <Users className="w-10 h-10 text-stone-300 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-stone-700">No matching clients found</h4>
          <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
            {searchQuery || selectedTag !== 'all'
              ? 'Try changing your search query or removing the active filters.'
              : 'As clients book photography sessions with Studio Lumiere, their CRM profiles and lifetime metrics will appear here.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedClients.map(client => {
            const initials = getInitials(client.name);
            const notesCount = client.notes?.length || 0;

            return (
              <div
                key={client.email}
                className="bg-white rounded-3xl border border-stone-200 p-5 shadow-xs hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Top Card Row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-amber-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-stone-900 truncate">{client.name}</h4>
                        <div className="text-[11px] text-stone-500 truncate flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-stone-400 shrink-0" />
                          <span className="truncate">{client.email}</span>
                        </div>
                        {client.phone && client.phone !== 'N/A' && (
                          <div className="text-[11px] text-stone-500 truncate flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-stone-400 shrink-0" />
                            <span>{client.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs text-stone-400 font-semibold">LTV</div>
                      <div className="text-base font-black text-emerald-700">
                        ₱{client.lifetimeValue.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Tags Strip */}
                  <div className="flex flex-wrap gap-1.5 mt-3.5">
                    {client.tags.map(tag => (
                      <span
                        key={tag}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          tag === 'VIP Client'
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : tag === 'Repeat Client'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : tag === 'Balance Due'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : 'bg-stone-100 text-stone-700 border-stone-200'
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                    {notesCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200 flex items-center gap-1">
                        <MessageSquare className="w-2.5 h-2.5" />
                        {notesCount} {notesCount === 1 ? 'note' : 'notes'}
                      </span>
                    )}
                  </div>

                  {/* Summary Metric Row */}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-stone-100 text-xs">
                    <div>
                      <span className="text-[10px] text-stone-400 font-semibold block">Bookings</span>
                      <span className="font-bold text-stone-800">
                        {client.totalBookings} {client.totalBookings === 1 ? 'session' : 'sessions'}
                      </span>
                      <span className="text-[10px] text-emerald-700 block">
                        ({client.completedBookings} fulfilled)
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-stone-400 font-semibold block">Latest Session</span>
                      <span className="font-bold text-stone-800">{client.lastBookingDate}</span>
                      {client.outstandingBalance > 0 && (
                        <span className="text-[10px] text-rose-600 font-bold block">
                          ₱{client.outstandingBalance.toLocaleString()} bal
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Preferred Services Pill */}
                  {client.preferredServices.length > 0 && (
                    <div className="mt-3 text-[11px] text-stone-500 bg-stone-50 p-2 rounded-xl border border-stone-100">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-0.5">
                        Preferred Photography
                      </span>
                      <span className="text-stone-800 font-medium truncate block">
                        {client.preferredServices.slice(0, 2).join(' • ')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Action */}
                <button
                  id={`btn-view-client-${client.email.replace(/[^a-z0-9]/gi, '_')}`}
                  onClick={() => setSelectedClient(client)}
                  className="w-full py-2.5 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                >
                  <span>View History & Client Notes</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Customer CRM Detailed Drawer / Modal */}
      {selectedClient && (
        <div
          id="modal-client-crm-drawer"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedClient(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-stone-200 space-y-6 my-8 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header & Client Profile */}
            <div className="flex items-start justify-between pb-4 border-b border-stone-100">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-600 text-white font-black text-lg flex items-center justify-center shadow-md">
                  {getInitials(selectedClient.name)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-stone-900">{selectedClient.name}</h3>
                    {selectedClient.tags.includes('VIP Client') && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> VIP
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500 mt-1">
                    <a
                      href={`mailto:${selectedClient.email}`}
                      className="flex items-center gap-1 hover:text-amber-700 transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5 text-stone-400" />
                      <span>{selectedClient.email}</span>
                    </a>
                    {selectedClient.phone && selectedClient.phone !== 'N/A' && (
                      <a
                        href={`tel:${selectedClient.phone}`}
                        className="flex items-center gap-1 hover:text-amber-700 transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5 text-stone-400" />
                        <span>{selectedClient.phone}</span>
                      </a>
                    )}
                    {selectedClient.address && (
                      <div className="flex items-center gap-1 text-stone-400">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="truncate max-w-xs">{selectedClient.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedClient(null)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Financial & LTV Statistics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-50 p-4 rounded-2xl border border-stone-200">
              <div>
                <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">
                  Lifetime Value (LTV)
                </span>
                <span className="text-lg font-black text-emerald-700 block mt-0.5">
                  ₱{selectedClient.lifetimeValue.toLocaleString()}
                </span>
                <span className="text-[10px] text-stone-500">Gross studio revenue</span>
              </div>

              <div>
                <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">
                  Total Collected
                </span>
                <span className="text-lg font-black text-stone-900 block mt-0.5">
                  ₱{selectedClient.totalPaid.toLocaleString()}
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold">Verified intake</span>
              </div>

              <div>
                <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">
                  Outstanding Balance
                </span>
                <span
                  className={`text-lg font-black block mt-0.5 ${
                    selectedClient.outstandingBalance > 0 ? 'text-rose-600' : 'text-stone-400'
                  }`}
                >
                  ₱{selectedClient.outstandingBalance.toLocaleString()}
                </span>
                <span className="text-[10px] text-stone-500">
                  {selectedClient.outstandingBalance > 0 ? 'Pending on shoots' : 'No balance due'}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">
                  Total Shoots
                </span>
                <span className="text-lg font-black text-blue-700 block mt-0.5">
                  {selectedClient.totalBookings}
                </span>
                <span className="text-[10px] text-stone-500">
                  {selectedClient.completedBookings} fulfilled / {selectedClient.cancelledBookings} cancelled
                </span>
              </div>
            </div>

            {/* Two-Column Section: Booking History & Studio Notes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
              {/* Left Column: Full Booking History Timeline */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>Booking History ({ (Array.isArray(selectedClient.bookings) ? selectedClient.bookings : []).length })</span>
                  </h4>
                  <span className="text-[11px] text-stone-400">Chronological</span>
                </div>

                {(Array.isArray(selectedClient.bookings) ? selectedClient.bookings : []).length === 0 ? (
                  <div className="p-6 text-center bg-stone-50 rounded-2xl border border-stone-200 text-xs text-stone-400">
                    No booking records found for this client.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                    {(Array.isArray(selectedClient.bookings) ? selectedClient.bookings : []).map(b => (
                      <div
                        key={b.id}
                        className="p-3.5 rounded-2xl border border-stone-200 bg-white hover:border-stone-300 transition-all text-xs space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-bold text-stone-900 block">
                              {services.find(s => s.id === b.serviceId)?.name ||
                               packages.find(p => p.id === b.packageId)?.name ||
                               'Photography Shoot'}
                            </span>
                            <div className="text-[11px] text-stone-500 flex items-center gap-2 mt-0.5">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-stone-400" />
                                {b.bookingDate}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-stone-400" />
                                {b.timeSlot}
                              </span>
                            </div>
                          </div>

                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              b.status === 'Completed'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : b.status === 'Confirmed'
                                ? 'bg-blue-50 text-blue-800 border-blue-200'
                                : b.status === 'Cancelled'
                                ? 'bg-rose-50 text-rose-800 border-rose-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            {b.status}
                          </span>
                        </div>

                        {/* Financials & Balances */}
                        <div className="flex items-center justify-between text-[11px] bg-stone-50 p-2 rounded-xl">
                          <span className="text-stone-500">
                            Total: <strong className="text-stone-800">₱{b.totalAmount.toLocaleString()}</strong>
                          </span>
                          <span className="text-stone-500">
                            Paid: <strong className="text-emerald-700">₱{b.amountPaid.toLocaleString()}</strong>
                          </span>
                          {b.remainingBalance > 0 ? (
                            <span className="text-rose-600 font-bold">
                              Bal: ₱{b.remainingBalance.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-semibold">Settled</span>
                          )}
                        </div>

                        {/* Customer note submitted during booking */}
                        {b.customerNotes && (
                          <div className="text-[11px] text-stone-600 bg-amber-50/50 p-2 rounded-xl border border-amber-100 italic">
                            "{b.customerNotes}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Studio Consultation & Preference Notes */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
                    <span>Private Studio Notes ({(selectedClient.notes || []).length})</span>
                  </h4>
                  <span className="text-[10px] text-stone-400">Visible to Studio Staff Only</span>
                </div>

                {/* Add Note Form */}
                <form
                  onSubmit={handleAddNote}
                  className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 space-y-2.5"
                >
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">
                      Add Client Consultation Note
                    </label>
                    <textarea
                      rows={2}
                      value={newNoteText}
                      onChange={e => setNewNoteText(e.target.value)}
                      placeholder="e.g. Prefers soft lighting, bringing 2 wardrobe changes, daughter's graduation..."
                      className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:border-amber-600"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1 text-[11px]">
                      <span className="text-stone-400 text-[10px] font-bold uppercase mr-1">Category:</span>
                      <select
                        value={newNoteCategory}
                        onChange={e => setNewNoteCategory(e.target.value as CRMNoteCategory)}
                        className="text-xs bg-white border border-stone-200 rounded-lg p-1 text-stone-700 focus:outline-hidden"
                      >
                        <option value="preference">Preference & Gear</option>
                        <option value="vip">VIP / Loyalty</option>
                        <option value="style">Wardrobe & Style</option>
                        <option value="billing">Billing & GCash</option>
                        <option value="milestone">Family / Milestone</option>
                        <option value="general">General Note</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingNote || !newNoteText.trim()}
                      className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1 disabled:opacity-50 transition-colors shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isSubmittingNote ? 'Saving...' : 'Add Note'}</span>
                    </button>
                  </div>
                </form>

                {/* Existing Notes List */}
                { (Array.isArray(selectedClient.notes) ? selectedClient.notes : []).length === 0 ? (
                  <div className="p-6 text-center bg-stone-50 rounded-2xl border border-stone-200 text-xs text-stone-400">
                    No private notes recorded yet for this client. Use the form above to log preferences, styling needs, or milestone details.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                    {(Array.isArray(selectedClient.notes) ? selectedClient.notes : []).map(note => (
                      <div
                        key={note.id}
                        className="p-3 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${getCategoryColor(
                              note.category
                            )}`}
                          >
                            {note.category}
                          </span>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-stone-400">
                              {new Date(note.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                            <button
                              onClick={() => handleDeleteNote(note.id)}
                              className="text-stone-300 hover:text-rose-600 p-0.5 rounded transition-colors"
                              title="Delete note"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <p className="text-xs text-stone-800 leading-relaxed font-normal">{note.note}</p>

                        <div className="text-[10px] text-stone-400 flex items-center justify-between pt-1 border-t border-stone-100">
                          <span>Logged by {note.authorName || 'Studio Staff'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-stone-100">
              <div className="text-xs text-stone-500">
                Customer Record ID: <span className="font-mono text-[11px]">{selectedClient.id}</span>
              </div>
              <button
                onClick={() => setSelectedClient(null)}
                className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Close CRM Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CRM Toast Notification */}
      {crmToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-stone-800 flex items-center gap-3 text-xs animate-in slide-in-from-bottom-5">
          <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-stone-100">Customer CRM</div>
            <div className="text-[11px] text-stone-300">{crmToast}</div>
          </div>
          <button onClick={() => setCrmToast(null)} className="ml-2 text-stone-400 hover:text-white text-xs">
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

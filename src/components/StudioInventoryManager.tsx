import React, { useState, useMemo } from 'react';
import {
  Camera,
  Aperture,
  Zap,
  Wrench,
  CheckCircle2,
  Clock,
  Search,
  Plus,
  Trash2,
  Box,
  Layers,
  Sparkles,
  SlidersHorizontal,
  X,
  Tag,
  MapPin,
  Calendar,
  AlertCircle
} from 'lucide-react';
import type { StudioInventoryItem, GearCategory, GearStatus } from '../db/types.js';

interface StudioInventoryManagerProps {
  studioId: string;
  studioName: string;
  items: StudioInventoryItem[];
  onAddGear: (item: Partial<StudioInventoryItem>) => Promise<void>;
  onUpdateStatus: (id: string, status: GearStatus, assignedTo?: string, notes?: string) => Promise<void>;
  onDeleteGear: (id: string) => Promise<void>;
  isLoading?: boolean;
}

export const StudioInventoryManager: React.FC<StudioInventoryManagerProps> = ({
  studioId,
  studioName,
  items,
  onAddGear,
  onUpdateStatus,
  onDeleteGear,
  isLoading = false
}) => {
  const [selectedCategory, setSelectedCategory] = useState<GearCategory | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<GearStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Status Change Dialog
  const [statusDialogItem, setStatusDialogItem] = useState<StudioInventoryItem | null>(null);
  const [newStatus, setNewStatus] = useState<GearStatus>('available');
  const [statusAssignedTo, setStatusAssignedTo] = useState('');
  const [statusNotes, setStatusNotes] = useState('');

  // New Equipment Form State
  const [formData, setFormData] = useState({
    name: '',
    brand: 'Sony',
    model: '',
    category: 'camera' as GearCategory,
    serialNumber: '',
    status: 'available' as GearStatus,
    locationRack: 'Bay 1 Locker',
    assignedTo: '',
    condition: 'mint' as 'mint' | 'good' | 'fair',
    notes: '',
    purchaseDate: new Date().toISOString().split('T')[0]
  });

  // KPI Metrics calculation
  const metrics = useMemo(() => {
    const total = items.length;
    const available = items.filter(i => i.status === 'available').length;
    const inUse = items.filter(i => i.status === 'in-use').length;
    const maintenance = items.filter(i => i.status === 'maintenance').length;

    const camerasCount = items.filter(i => i.category === 'camera').length;
    const lensesCount = items.filter(i => i.category === 'lens').length;
    const lightingCount = items.filter(i => i.category === 'lighting').length;

    const availableRate = total > 0 ? ((available / total) * 100).toFixed(0) : '0';

    return {
      total,
      available,
      inUse,
      maintenance,
      camerasCount,
      lensesCount,
      lightingCount,
      availableRate
    };
  }, [items]);

  // Filtered gear items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      // Status filter
      if (selectedStatus !== 'all' && item.status !== selectedStatus) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchBrand = item.brand.toLowerCase().includes(q);
        const matchModel = item.model.toLowerCase().includes(q);
        const matchSerial = (item.serialNumber || '').toLowerCase().includes(q);
        const matchRack = (item.locationRack || '').toLowerCase().includes(q);
        const matchAssigned = (item.assignedTo || '').toLowerCase().includes(q);
        if (!matchName && !matchBrand && !matchModel && !matchSerial && !matchRack && !matchAssigned) {
          return false;
        }
      }
      return true;
    });
  }, [items, selectedCategory, selectedStatus, searchQuery]);

  const handleOpenStatusModal = (item: StudioInventoryItem) => {
    setStatusDialogItem(item);
    setNewStatus(item.status);
    setStatusAssignedTo(item.assignedTo || '');
    setStatusNotes(item.notes || '');
  };

  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusDialogItem) return;
    setIsSubmitting(true);
    try {
      await onUpdateStatus(
        statusDialogItem.id,
        newStatus,
        newStatus === 'in-use' ? statusAssignedTo : '',
        statusNotes
      );
      setStatusDialogItem(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateGear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddGear({
        ...formData,
        studioId
      });
      setShowAddModal(false);
      // Reset form
      setFormData({
        name: '',
        brand: 'Sony',
        model: '',
        category: 'camera',
        serialNumber: '',
        status: 'available',
        locationRack: 'Bay 1 Locker',
        assignedTo: '',
        condition: 'mint',
        notes: '',
        purchaseDate: new Date().toISOString().split('T')[0]
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryIcon = (category: GearCategory) => {
    switch (category) {
      case 'camera':
        return <Camera className="w-4 h-4 text-amber-600" />;
      case 'lens':
        return <Aperture className="w-4 h-4 text-blue-600" />;
      case 'lighting':
        return <Zap className="w-4 h-4 text-amber-500" />;
      default:
        return <Box className="w-4 h-4 text-purple-600" />;
    }
  };

  const getStatusBadge = (status: GearStatus) => {
    switch (status) {
      case 'available':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Available
          </span>
        );
      case 'in-use':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3.5 h-3.5" />
            In-Use
          </span>
        );
      case 'maintenance':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300">
            <Wrench className="w-3.5 h-3.5" />
            Maintenance
          </span>
        );
    }
  };

  return (
    <div className="space-y-6" id="studio-inventory-tab">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-100 text-amber-800 rounded-xl">
              <Camera className="w-5 h-5" />
            </span>
            <h3 className="text-lg font-bold text-stone-900">Studio Inventory & Equipment</h3>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Real-time status tracking for camera gear, optical lenses, and lighting equipment at {studioName}.
          </p>
        </div>

        <button
          id="btn-add-gear"
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add New Equipment
        </button>
      </div>

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Assets */}
        <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-[11px] font-bold uppercase">Total Tracked Gear</span>
            <Box className="w-4 h-4 text-stone-600" />
          </div>
          <div className="text-2xl font-black text-stone-900 mt-1">{metrics.total}</div>
          <div className="text-[10px] text-stone-500 font-medium mt-0.5">
            {metrics.camerasCount} bodies • {metrics.lensesCount} lenses • {metrics.lightingCount} lights
          </div>
        </div>

        {/* Available Equipment */}
        <div className="p-4 bg-white rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-white to-emerald-50/20 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-[11px] font-bold uppercase">Available on Shelf</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-emerald-800 mt-1">{metrics.available}</div>
          <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
            {metrics.availableRate}% ready for immediate shoot
          </div>
        </div>

        {/* In-Use Equipment */}
        <div className="p-4 bg-white rounded-2xl border border-blue-200/80 bg-gradient-to-br from-white to-blue-50/20 shadow-xs">
          <div className="flex items-center justify-between text-blue-600">
            <span className="text-[11px] font-bold uppercase">Currently In-Use</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-blue-800 mt-1">{metrics.inUse}</div>
          <div className="text-[10px] text-blue-700 font-medium mt-0.5">
            Assigned to live sessions & studio bays
          </div>
        </div>

        {/* Under Maintenance */}
        <div className="p-4 bg-white rounded-2xl border border-amber-200/80 bg-gradient-to-br from-white to-amber-50/20 shadow-xs">
          <div className="flex items-center justify-between text-amber-700">
            <span className="text-[11px] font-bold uppercase">Under Maintenance</span>
            <Wrench className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-amber-800 mt-1">{metrics.maintenance}</div>
          <div className="text-[10px] text-amber-700 font-medium mt-0.5">
            Calibration, sensor cleaning, or repairs
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs font-semibold">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                selectedCategory === 'all'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> All Gear ({metrics.total})
            </button>
            <button
              onClick={() => setSelectedCategory('camera')}
              className={`px-3 py-1.5 rounded-xl transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                selectedCategory === 'camera'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              <Camera className="w-3.5 h-3.5" /> Cameras ({metrics.camerasCount})
            </button>
            <button
              onClick={() => setSelectedCategory('lens')}
              className={`px-3 py-1.5 rounded-xl transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                selectedCategory === 'lens'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              <Aperture className="w-3.5 h-3.5" /> Lenses ({metrics.lensesCount})
            </button>
            <button
              onClick={() => setSelectedCategory('lighting')}
              className={`px-3 py-1.5 rounded-xl transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                selectedCategory === 'lighting'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" /> Lighting ({metrics.lightingCount})
            </button>
          </div>

          {/* Status Quick Pill Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-stone-400 font-semibold text-[11px] uppercase mr-1 hidden sm:inline-block">Status:</span>
            <button
              onClick={() => setSelectedStatus('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                selectedStatus === 'all'
                  ? 'bg-stone-800 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedStatus('available')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                selectedStatus === 'available'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" /> Available
            </button>
            <button
              onClick={() => setSelectedStatus('in-use')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                selectedStatus === 'in-use'
                  ? 'bg-blue-700 text-white'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              <Clock className="w-3 h-3" /> In-Use
            </button>
            <button
              onClick={() => setSelectedStatus('maintenance')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                selectedStatus === 'maintenance'
                  ? 'bg-amber-700 text-white'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              <Wrench className="w-3 h-3" /> Maintenance
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search gear by name, brand, model, serial number, or rack location..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Equipment List Grid */}
      {filteredItems.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-stone-200 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-stone-900">No equipment matches your filters</h4>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Try adjusting your search query, or change category and status filters.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSelectedStatus('all');
              setSearchQuery('');
            }}
            className="text-xs font-bold text-amber-700 hover:underline"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map(item => (
            <div
              key={item.id}
              className="p-5 bg-white rounded-2xl border border-stone-200 shadow-xs hover:border-amber-400 transition-all flex flex-col justify-between space-y-4 group"
            >
              {/* Card Header */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="p-2 bg-stone-100 rounded-xl group-hover:bg-amber-50 transition-colors">
                      {getCategoryIcon(item.category)}
                    </span>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                        {item.brand} • {item.category}
                      </span>
                      <h4 className="text-sm font-bold text-stone-900 leading-snug">{item.name}</h4>
                    </div>
                  </div>
                  {getStatusBadge(item.status)}
                </div>

                {/* Model & Serial Tag */}
                <div className="flex flex-wrap items-center gap-1.5 mt-3 text-[11px] text-stone-500">
                  <span className="px-2 py-0.5 bg-stone-100 rounded font-mono text-[10px] text-stone-700">
                    Model: {item.model || 'Standard'}
                  </span>
                  {item.serialNumber && (
                    <span className="px-2 py-0.5 bg-stone-100 rounded font-mono text-[10px] text-stone-600">
                      {item.serialNumber}
                    </span>
                  )}
                  {item.condition && (
                    <span className="px-2 py-0.5 bg-stone-50 border border-stone-200 rounded capitalize text-[10px] text-stone-600">
                      {item.condition} condition
                    </span>
                  )}
                </div>

                {/* Status-specific banner */}
                {item.status === 'in-use' && item.assignedTo && (
                  <div className="mt-3 p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-900 text-xs flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <div className="truncate">
                      <span className="font-bold">Assigned: </span>
                      <span>{item.assignedTo}</span>
                    </div>
                  </div>
                )}

                {item.status === 'maintenance' && item.notes && (
                  <div className="mt-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                    <Wrench className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                    <div className="leading-snug">
                      <span className="font-bold">Service Note: </span>
                      <span>{item.notes}</span>
                    </div>
                  </div>
                )}

                {/* Location Rack & Details */}
                <div className="mt-3 pt-3 border-t border-stone-100 text-[11px] text-stone-500 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-stone-400">
                      <MapPin className="w-3 h-3" /> Location:
                    </span>
                    <span className="font-medium text-stone-700">{item.locationRack || 'Studio Cabinet'}</span>
                  </div>
                  {item.lastMaintenance && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-stone-400">
                        <Calendar className="w-3 h-3" /> Checked:
                      </span>
                      <span className="font-medium text-stone-700">{item.lastMaintenance}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleOpenStatusModal(item)}
                  className="flex-1 py-1.5 px-3 bg-stone-100 hover:bg-amber-600 hover:text-white text-stone-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" /> Update Status
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Remove ${item.name} from studio equipment list?`)) {
                      onDeleteGear(item.id);
                    }
                  }}
                  title="Decommission Equipment"
                  className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Status Update Modal */}
      {statusDialogItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Quick Status Change</span>
                <h3 className="text-base font-bold text-stone-900">{statusDialogItem.name}</h3>
              </div>
              <button
                onClick={() => setStatusDialogItem(null)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStatus} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-2">
                  Select Equipment Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewStatus('available')}
                    className={`py-2.5 px-3 rounded-xl font-bold border text-center transition-all ${
                      newStatus === 'available'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-emerald-50'
                    }`}
                  >
                    Available
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewStatus('in-use')}
                    className={`py-2.5 px-3 rounded-xl font-bold border text-center transition-all ${
                      newStatus === 'in-use'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-blue-50'
                    }`}
                  >
                    In-Use
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewStatus('maintenance')}
                    className={`py-2.5 px-3 rounded-xl font-bold border text-center transition-all ${
                      newStatus === 'maintenance'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-amber-50'
                    }`}
                  >
                    Maintenance
                  </button>
                </div>
              </div>

              {newStatus === 'in-use' && (
                <div className="space-y-1.5 p-3 rounded-2xl bg-blue-50/50 border border-blue-100">
                  <label className="block font-bold text-blue-950">
                    Assigned Session or Staff Member
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Studio Bay 1 - Graduation Shoot / John (Photographer)"
                    value={statusAssignedTo}
                    onChange={e => setStatusAssignedTo(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              )}

              {newStatus === 'maintenance' && (
                <div className="space-y-1.5 p-3 rounded-2xl bg-amber-50/50 border border-amber-200">
                  <label className="block font-bold text-amber-950">
                    Maintenance Reason & Service Note
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g., Routine sensor cleaning, shutter checkup, lens calibration..."
                    value={statusNotes}
                    onChange={e => setStatusNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              )}

              {newStatus === 'available' && (
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Marking as available will return this gear to inventory racks for all studio bookings.</span>
                </div>
              )}

              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setStatusDialogItem(null)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Confirm Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Equipment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-stone-200 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Studio Asset Management</span>
                <h3 className="text-base font-bold text-stone-900">Add New Studio Equipment</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGear} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-[11px] font-bold text-stone-700 uppercase">
                    Equipment Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Sony Alpha 7 IV (Body B)"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-stone-700 uppercase">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value as GearCategory })}
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  >
                    <option value="camera">Camera Body</option>
                    <option value="lens">Optical Lens</option>
                    <option value="lighting">Lighting Equipment</option>
                    <option value="audio">Audio / Mic</option>
                    <option value="accessory">Studio Accessory</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-stone-700 uppercase">
                    Brand / Manufacturer
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Sony, Canon, Godox, Profoto"
                    value={formData.brand}
                    onChange={e => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-stone-700 uppercase">
                    Model Identifier
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., ILCE-7M4, AD600Pro"
                    value={formData.model}
                    onChange={e => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-stone-700 uppercase">
                    Serial Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., SN-SNY-884920"
                    value={formData.serialNumber}
                    onChange={e => setFormData({ ...formData, serialNumber: e.target.value })}
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-stone-700 uppercase">
                    Storage Bay / Locker Rack
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Bay 1 Shelf A, Glass Cabinet 2"
                    value={formData.locationRack}
                    onChange={e => setFormData({ ...formData, locationRack: e.target.value })}
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-stone-700 uppercase">
                    Initial Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as GearStatus })}
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  >
                    <option value="available">Available on Shelf</option>
                    <option value="in-use">In-Use (Assigned)</option>
                    <option value="maintenance">Under Maintenance</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-stone-700 uppercase">
                    Physical Condition
                  </label>
                  <select
                    value={formData.condition}
                    onChange={e => setFormData({ ...formData, condition: e.target.value as 'mint' | 'good' | 'fair' })}
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  >
                    <option value="mint">Mint (Like New)</option>
                    <option value="good">Good (Normal studio wear)</option>
                    <option value="fair">Fair (Minor blemishes)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-stone-700 uppercase">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    value={formData.purchaseDate}
                    onChange={e => setFormData({ ...formData, purchaseDate: e.target.value })}
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-[11px] font-bold text-stone-700 uppercase">
                    Notes & Maintenance Remarks
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g., Equipped with SmallRig cage, UV filter attached, dual Sony batteries included..."
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Registering...' : 'Register Equipment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

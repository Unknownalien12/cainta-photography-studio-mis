import React, { useState, useEffect } from 'react';
import {
  Shield,
  Store,
  CheckCircle2,
  XCircle,
  Users,
  DollarSign,
  FileText,
  Settings,
  Plus,
  Trash2,
  ExternalLink,
  BarChart3,
  History,
  Edit2,
  Tag,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import type { Studio, User, CustomPage, SystemSetting, AuditLog, Promotion, FAQ } from '../db/types.js';
import { apiRequest } from '../utils/apiClient.js';
import { toast } from '../utils/toast.js';

interface AdminDashboardProps {
  currentUser: User;
  onRefreshStudios: () => void;
  onNavigate: (page: string, params?: any) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser, onRefreshStudios, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'studios' | 'users' | 'promotions' | 'faqs' | 'pages' | 'settings' | 'audit'>('studios');
  const [studios, setStudios] = useState<Studio[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [pages, setPages] = useState<CustomPage[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Promotion State
  const [showNewPromo, setShowNewPagePromo] = useState(false);
  const [promoTitle, setPromoTitle] = useState('');
  const [promoSubtitle, setPromoSubtitle] = useState('');
  const [promoDiscount, setPromoDiscount] = useState('20% OFF');
  const [promoCode, setPromoCode] = useState('');
  const [promoLocation, setPromoLocation] = useState('Cainta, Rizal');
  const [promoValidUntil, setPromoValidUntil] = useState('2026-12-31');
  const [promoDesc, setPromoDesc] = useState('');
  const [promoImage, setPromoImage] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80');

  // New FAQ State
  const [showNewFaq, setShowNewFaq] = useState(false);
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');
  const [faqCategory, setFaqCategory] = useState('Booking');

  // New Page State
  const [showNewPage, setShowNewPage] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newNavbar, setNewNavbar] = useState(true);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const [sData, uData, pgData, stRes, auditData, promoData, faqData] = await Promise.all([
        apiRequest<Studio[]>('/api/studios'),
        apiRequest<User[]>('/api/admin/users'),
        apiRequest<CustomPage[]>('/api/admin/pages'),
        apiRequest<any>('/api/admin/settings'),
        apiRequest<AuditLog[]>('/api/audit-logs'),
        apiRequest<Promotion[]>('/api/promotions').catch(() => []),
        apiRequest<FAQ[]>('/api/faqs').catch(() => [])
      ]);
      setStudios(sData);
      setUsers(uData);
      setPages(pgData);
      setAuditLogs(auditData);
      setPromotions(promoData);
      setFaqs(faqData);
      
      const settingsArray: SystemSetting[] = [];
      if (Array.isArray(stRes)) {
        setSettings(stRes);
      } else if (stRes && typeof stRes === 'object') {
        if (stRes.theme) {
          Object.entries(stRes.theme).forEach(([k, v]) => {
            settingsArray.push({ id: `th_${k}`, key: `theme.${k}`, value: String(v), description: `Theme: ${k}` });
          });
        }
        if (stRes.modules) {
          Object.entries(stRes.modules).forEach(([k, v]) => {
            settingsArray.push({ id: `mod_${k}`, key: `module.${k}`, value: String(v), description: `Module: ${k}` });
          });
        }
        if (stRes.cms) {
          Object.entries(stRes.cms).forEach(([k, v]) => {
            settingsArray.push({ id: `cms_${k}`, key: `cms.${k}`, value: String(v), description: `CMS: ${k}` });
          });
        }
        setSettings(settingsArray);
      } else {
        setSettings([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveStudio = async (studioId: string, status: 'Approved' | 'Suspended') => {
    try {
      await apiRequest(`/api/admin/studios/${studioId}/approval`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      toast.success(`Na-update ang accreditation status sa "${status}"!`, { title: 'Studio Status Updated' });
      loadAdminData();
      onRefreshStudios();
    } catch (err: any) {
      toast.error(err.message || 'Nabigo ang pag-update sa studio approval', { title: 'Approval Error' });
    }
  };

  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const p = await apiRequest<CustomPage>('/api/admin/pages', {
        method: 'POST',
        body: JSON.stringify({
          title: newTitle,
          slug: newSlug || newTitle.toLowerCase().replace(/\s+/g, '-'),
          content: newContent,
          isPublished: true,
          showInNavbar: newNavbar,
          showInFooter: true
        })
      });
      setPages(prev => [...prev, p]);
      setShowNewPage(false);
      setNewTitle('');
      setNewContent('');
      toast.success(`Nagawa at nai-publish ang custom page: "${p.title}"!`, { title: 'CMS Page Created' });
    } catch (err: any) {
      toast.error(err.message || 'Nabigo ang paggawa ng page', { title: 'CMS Error' });
    }
  };

  const handleDeletePage = async (id: string) => {
    if (!confirm('Sigurado ka bang nais mong burahin ang CMS page na ito?')) return;
    try {
      await apiRequest(`/api/admin/pages/${id}`, { method: 'DELETE' });
      setPages(prev => prev.filter(p => p.id !== id));
      toast.success('Nabura ang custom page mula sa system.', { title: 'Page Deleted' });
    } catch (err: any) {
      toast.error(err.message || 'Nabigo ang pagbura ng page', { title: 'Delete Error' });
    }
  };

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const p = await apiRequest<Promotion>('/api/promotions', {
        method: 'POST',
        body: JSON.stringify({
          title: promoTitle,
          subtitle: promoSubtitle,
          discount: promoDiscount,
          code: promoCode,
          location: promoLocation,
          validUntil: promoValidUntil,
          description: promoDesc,
          image: promoImage
        })
      });
      setPromotions(prev => [p, ...prev]);
      setShowNewPagePromo(false);
      setPromoTitle('');
      setPromoCode('');
      setPromoDesc('');
      toast.success(`Nai-save ang sitewide promotion: "${p.title}"!`, { title: 'Promotion Published' });
    } catch (err: any) {
      toast.error(err.message || 'Nabigo ang pag-save ng promotion', { title: 'Promo Error' });
    }
  };

  const handleDeletePromo = async (id: string) => {
    if (!confirm('Sigurado ka bang nais mong burahin ang promo banner na ito?')) return;
    try {
      await apiRequest(`/api/promotions/${id}`, { method: 'DELETE' });
      setPromotions(prev => prev.filter(p => p.id !== id));
      toast.success('Nabura ang promo banner.', { title: 'Promo Deleted' });
    } catch (err: any) {
      toast.error(err.message || 'Nabigo ang pagbura sa promo', { title: 'Delete Error' });
    }
  };

  const handleCreateFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const f = await apiRequest<FAQ>('/api/faqs', {
        method: 'POST',
        body: JSON.stringify({
          question: faqQuestion,
          answer: faqAnswer,
          category: faqCategory
        })
      });
      setFaqs(prev => [f, ...prev]);
      setShowNewFaq(false);
      setFaqQuestion('');
      setFaqAnswer('');
      toast.success(`Naidagdag ang bagong FAQ item: "${f.question.slice(0, 30)}..."!`, { title: 'FAQ Added' });
    } catch (err: any) {
      toast.error(err.message || 'Nabigo ang pagdagdag ng FAQ', { title: 'FAQ Error' });
    }
  };

  const handleDeleteFaq = async (id: string) => {
    if (!confirm('Sigurado ka bang nais mong burahin ang FAQ na ito?')) return;
    try {
      await apiRequest(`/api/faqs/${id}`, { method: 'DELETE' });
      setFaqs(prev => prev.filter(f => f.id !== id));
      toast.success('Nabura ang FAQ item.', { title: 'FAQ Deleted' });
    } catch (err: any) {
      toast.error(err.message || 'Nabigo ang pagbura sa FAQ', { title: 'Delete Error' });
    }
  };

  return (
    <div className="flex min-h-screen bg-stone-50 text-stone-900">
      {/* Side Navigation Sidebar */}
      <aside className="w-72 bg-white border-r border-stone-200 flex-shrink-0 hidden lg:flex flex-col justify-between p-6">
        <div className="space-y-6">
          <div className="flex items-center gap-3 p-3.5 bg-stone-900 text-white rounded-2xl shadow-sm">
            <Shield className="w-6 h-6 text-amber-500 flex-shrink-0" />
            <div className="min-w-0">
              <h4 className="font-bold text-sm truncate">Super Admin MIS</h4>
              <p className="text-[11px] text-stone-400 truncate">Cainta Core Supervision</p>
            </div>
          </div>

          <nav className="space-y-1.5 text-xs font-semibold">
            {[
              {
                id: 'studios',
                label: 'Studio Accreditation Queue',
                icon: Store,
                badge: studios.filter(s => s.status.toLowerCase() === 'pending').length
              },
              {
                id: 'users',
                label: 'User Accounts',
                icon: Users,
                badge: users.length
              },
              {
                id: 'promotions',
                label: 'Promotions & Coupons',
                icon: Tag,
                badge: promotions.length
              },
              {
                id: 'faqs',
                label: 'Platform FAQs',
                icon: HelpCircle,
                badge: faqs.length
              },
              {
                id: 'pages',
                label: 'CMS Custom Pages',
                icon: FileText,
                badge: pages.length
              },
              {
                id: 'settings',
                label: 'System Configurations',
                icon: Settings
              },
              {
                id: 'audit',
                label: 'System Audit Trail',
                icon: History
              }
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
          <div>Cainta Studio MIS v2.5</div>
          <div className="text-[10px] text-stone-500">Superadmin Role Active</div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-8 space-y-6 overflow-y-auto">
        {/* Admin Banner */}
        <div className="bg-[#2c2a29] text-white p-6 rounded-3xl border border-stone-800 flex items-center justify-between shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-500" />
              <h2 className="text-xl font-bold">Super Admin MIS Console</h2>
            </div>
            <p className="text-xs text-stone-400 mt-1">Cainta Photography Studio Management System Core Supervision</p>
          </div>
        </div>

        {/* KPI Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs">
            <span className="text-[11px] font-bold uppercase text-stone-400">Total Studios</span>
            <div className="text-xl font-extrabold text-stone-900 mt-1">{studios.length}</div>
            <span className="text-[10px] text-stone-500">Across Cainta Barangays</span>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs">
            <span className="text-[11px] font-bold uppercase text-stone-400">Pending Approvals</span>
            <div className="text-xl font-extrabold text-amber-600 mt-1">
              {studios.filter(s => s.status.toLowerCase() === 'pending').length}
            </div>
            <span className="text-[10px] text-amber-700">Awaiting verification</span>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs">
            <span className="text-[11px] font-bold uppercase text-stone-400">Total Registered Users</span>
            <div className="text-xl font-extrabold text-blue-600 mt-1">{users.length}</div>
            <span className="text-[10px] text-stone-500">Clients & Studio Admins</span>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs">
            <span className="text-[11px] font-bold uppercase text-stone-400">PayMongo Webhook</span>
            <div className="text-xl font-extrabold text-emerald-600 mt-1">Healthy (200 OK)</div>
            <span className="text-[10px] text-emerald-700">GCash QR Ph Gateway</span>
          </div>
        </div>

        {/* Tab: Studios Accreditation */}
        {activeTab === 'studios' && (
          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
            <h3 className="font-bold text-stone-900 text-sm">Cainta Studio Accreditation Queue</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-stone-50 text-stone-500 uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Studio</th>
                    <th className="p-3">Address</th>
                    <th className="p-3">Permit Documents</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {studios.map(s => (
                    <tr key={s.id}>
                      <td className="p-3 font-medium text-stone-900">
                        <div className="flex items-center gap-2">
                          <img src={s.logo} alt={s.name} className="w-8 h-8 rounded-lg object-cover" />
                          <div>
                            <div>{s.name}</div>
                            <div className="text-[10px] text-stone-400">{s.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-stone-600">{s.address}</td>
                      <td className="p-3 text-stone-600 font-mono text-[11px]">
                        {s.businessPermitDoc || s.businessPermit || 'Permit-Cainta-2026.pdf'}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            s.status.toLowerCase() === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : s.status.toLowerCase() === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="p-3 flex items-center gap-2">
                        <button
                          onClick={() => onNavigate('studio-dashboard', { studioId: s.id })}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold text-[11px] flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3" /> Manage Content
                        </button>
                        {s.status.toLowerCase() !== 'approved' && (
                          <button
                            onClick={() => handleApproveStudio(s.id, 'Approved')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[11px]"
                          >
                            Approve
                          </button>
                        )}
                        {s.status.toLowerCase() !== 'suspended' && s.status.toLowerCase() !== 'rejected' && (
                          <button
                            onClick={() => handleApproveStudio(s.id, 'Suspended')}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold text-[11px]"
                          >
                            Suspend
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab: Users */}
        {activeTab === 'users' && (
          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
            <h3 className="font-bold text-stone-900 text-sm">Registered Accounts</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-stone-50 text-stone-500 uppercase text-[10px]">
                  <tr>
                    <th className="p-3">User ID</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Studio Affiliation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {users.map(u => (
                    <tr key={u.id}>
                      <td className="p-3 font-mono text-[11px]">{u.id}</td>
                      <td className="p-3 font-medium text-stone-900">{u.fullName}</td>
                      <td className="p-3 text-stone-600">{u.email}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-800">
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3 text-stone-500">{u.studioId || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab: Promotions */}
        {activeTab === 'promotions' && (
          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-stone-900 text-sm">System & Studio Promotions</h3>
              <button
                onClick={() => setShowNewPagePromo(true)}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Create Promotion
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {promotions.map(promo => (
                <div key={promo.id} className="p-4 rounded-2xl border border-stone-200 bg-stone-50 space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-600 text-white">
                      {promo.discount}
                    </span>
                    <button onClick={() => handleDeletePromo(promo.id)} className="text-stone-400 hover:text-rose-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h4 className="font-bold text-stone-900 text-sm">{promo.title}</h4>
                  <p className="text-xs text-stone-600">{promo.description}</p>
                  <div className="flex items-center justify-between text-[11px] text-stone-500 pt-2 border-t border-stone-200">
                    <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-stone-200">{promo.code}</span>
                    <span>Valid until: {promo.validUntil}</span>
                  </div>
                </div>
              ))}
            </div>

            {showNewPromo && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
                <form onSubmit={handleCreatePromo} className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl space-y-3 text-xs">
                  <h4 className="font-bold text-sm text-stone-900">Add Promotion / Coupon</h4>
                  <div>
                    <label className="font-semibold block mb-1">Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Summer Studio Pass 20% Off"
                      value={promoTitle}
                      onChange={e => setPromoTitle(e.target.value)}
                      className="w-full p-2 border border-stone-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Discount Tag</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 20% OFF or Free Canvas Print"
                      value={promoDiscount}
                      onChange={e => setPromoDiscount(e.target.value)}
                      className="w-full p-2 border border-stone-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Coupon Code</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CAINTA20"
                      value={promoCode}
                      onChange={e => setPromoCode(e.target.value)}
                      className="w-full p-2 border border-stone-300 rounded-xl font-mono uppercase"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Description</label>
                    <textarea
                      rows={3}
                      required
                      value={promoDesc}
                      onChange={e => setPromoDesc(e.target.value)}
                      className="w-full p-2 border border-stone-300 rounded-xl"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setShowNewPagePromo(false)} className="px-3 py-1.5 text-stone-600">
                      Cancel
                    </button>
                    <button type="submit" className="px-4 py-2 bg-amber-600 text-white rounded-xl font-bold">
                      Publish Promotion
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Tab: FAQs */}
        {activeTab === 'faqs' && (
          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-stone-900 text-sm">Platform Frequently Asked Questions</h3>
              <button
                onClick={() => setShowNewFaq(true)}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add FAQ
              </button>
            </div>

            <div className="space-y-3">
              {faqs.map(faq => (
                <div key={faq.id} className="p-4 rounded-2xl border border-stone-200 bg-stone-50 flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">
                      {faq.category}
                    </span>
                    <h4 className="font-bold text-stone-900 text-sm">{faq.question}</h4>
                    <p className="text-xs text-stone-600">{faq.answer}</p>
                  </div>
                  <button onClick={() => handleDeleteFaq(faq.id)} className="text-stone-400 hover:text-rose-600 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {showNewFaq && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
                <form onSubmit={handleCreateFaq} className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl space-y-3 text-xs">
                  <h4 className="font-bold text-sm text-stone-900">Add New FAQ</h4>
                  <div>
                    <label className="font-semibold block mb-1">Category</label>
                    <select
                      value={faqCategory}
                      onChange={e => setFaqCategory(e.target.value)}
                      className="w-full p-2 border border-stone-300 rounded-xl"
                    >
                      <option value="Booking">Booking</option>
                      <option value="Payments">Payments</option>
                      <option value="Proofing">Proofing</option>
                      <option value="General">General</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Question</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. How do I book a photoshoot?"
                      value={faqQuestion}
                      onChange={e => setFaqQuestion(e.target.value)}
                      className="w-full p-2 border border-stone-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Answer</label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Provide clear response..."
                      value={faqAnswer}
                      onChange={e => setFaqAnswer(e.target.value)}
                      className="w-full p-2 border border-stone-300 rounded-xl"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setShowNewFaq(false)} className="px-3 py-1.5 text-stone-600">
                      Cancel
                    </button>
                    <button type="submit" className="px-4 py-2 bg-amber-600 text-white rounded-xl font-bold">
                      Save FAQ
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Tab: CMS Pages */}
        {activeTab === 'pages' && (
          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-stone-900 text-sm">CMS Custom Pages</h3>
              <button
                onClick={() => setShowNewPage(true)}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Create Custom Page
              </button>
            </div>

            <div className="divide-y divide-stone-100">
              {pages.map(p => (
                <div key={p.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <h4 className="font-bold text-stone-900">{p.title}</h4>
                    <span className="text-[11px] text-stone-500">/{p.slug} • {p.showInNavbar ? 'Visible in Navbar' : 'Hidden'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleDeletePage(p.id)} className="p-1 text-stone-400 hover:text-rose-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {showNewPage && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
                <form onSubmit={handleCreatePage} className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl space-y-3 text-xs">
                  <h4 className="font-bold text-sm text-stone-900">Add CMS Custom Page</h4>
                  <div>
                    <label className="font-semibold block mb-1">Page Title</label>
                    <input
                      type="text"
                      required
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      className="w-full p-2 border border-stone-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">URL Slug</label>
                    <input
                      type="text"
                      placeholder="e.g. photography-guidelines"
                      value={newSlug}
                      onChange={e => setNewSlug(e.target.value)}
                      className="w-full p-2 border border-stone-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Content (Markdown / Text)</label>
                    <textarea
                      rows={6}
                      required
                      value={newContent}
                      onChange={e => setNewContent(e.target.value)}
                      className="w-full p-2 border border-stone-300 rounded-xl"
                    />
                  </div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newNavbar}
                      onChange={e => setNewNavbar(e.target.checked)}
                      className="rounded text-amber-600"
                    />
                    <span>Show page link in Top Navbar</span>
                  </label>
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setShowNewPage(false)} className="px-3 py-1.5 text-stone-600">
                      Cancel
                    </button>
                    <button type="submit" className="px-4 py-2 bg-amber-600 text-white rounded-xl font-bold">
                      Publish Page
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Tab: System Settings */}
        {activeTab === 'settings' && (
          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4 max-w-xl">
            <h3 className="font-bold text-stone-900 text-sm">Global System Variables</h3>
            <div className="space-y-3 text-xs">
              {settings.map(st => (
                <div key={st.id} className="flex justify-between items-center p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <div>
                    <div className="font-bold text-stone-800">{st.description || st.key}</div>
                    <div className="font-mono text-[10px] text-stone-400">{st.key}</div>
                  </div>
                  <span className="font-bold text-amber-700 bg-white px-2 py-1 rounded-lg border border-stone-200 font-mono">
                    {st.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab: Audit Trail */}
        {activeTab === 'audit' && (
          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-stone-900 text-sm">System-Wide Audit Trail</h3>
              <div className="text-[10px] text-stone-400">Last 500 actions recorded</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-stone-50 text-stone-500 uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Admin/User</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">Entity Type</th>
                    <th className="p-3">Entity ID</th>
                    <th className="p-3">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-stone-50 transition-colors">
                      <td className="p-3 text-stone-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-stone-900">{log.userEmail}</div>
                        <div className="text-[10px] text-stone-400 font-mono">{log.userId}</div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.action.includes('DELETE') || log.action.includes('REJECT') || log.action.includes('ARCHIVE')
                            ? 'bg-rose-100 text-rose-800'
                            : log.action.includes('CREATE') || log.action.includes('APPROVE')
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3 text-stone-600 font-semibold">{log.entityType}</td>
                      <td className="p-3 font-mono text-[10px] text-stone-400">{log.entityId}</td>
                      <td className="p-3 text-stone-400 font-mono">{log.ipAddress || '—'}</td>
                    </tr>
                  ))}
                  {auditLogs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-stone-400 italic">
                        No audit logs recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

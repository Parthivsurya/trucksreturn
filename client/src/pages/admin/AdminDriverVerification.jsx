import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/AdminLayout.jsx';
import { useAdminApi } from '../../hooks/useAdminApi.js';
import {
  ShieldCheck, Clock, XCircle, CheckCircle, ChevronDown, ChevronUp,
  FileText, Truck, Phone, Hash, Weight, MapPin, Eye, AlertTriangle, Search, History,
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_TABS = [
  { key: 'pending',  label: 'Pending',  color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
  { key: 'verified', label: 'Verified', color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
  { key: 'rejected', label: 'Rejected', color: 'text-red-600',   bg: 'bg-red-50 border-red-200'     },
  { key: 'all',      label: 'All',      color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200' },
];

const DOC_LABEL = {
  RC: 'RC Book', licence: "Driver's Licence", permit: 'National Permit',
  insurance: 'Insurance', PUC: 'PUC',
  vehicle_front: 'Front View', vehicle_left: 'Left Side', vehicle_right: 'Right Side',
};

const VEHICLE_KEYS = ['vehicle_front', 'vehicle_left', 'vehicle_right'];

const BACKEND = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : '';

function docUrl(file_url) { return `${BACKEND}${file_url}`; }

export default function AdminDriverVerification() {
  const api = useAdminApi();
  const [tab, setTab]           = useState('pending');
  const [search, setSearch]     = useState('');
  const [drivers, setDrivers]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [docMap, setDocMap]     = useState({});
  const [historyMap, setHistoryMap] = useState({});
  const [loadingDocs, setLoadingDocs]     = useState({});
  const [loadingHistory, setLoadingHistory] = useState({});
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectNote, setRejectNote]   = useState('');
  const [actioning, setActioning]     = useState({});

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: tab });
      if (search.trim()) params.set('search', search.trim());
      const res = await api.get(`/drivers/verification?${params}`);
      setDrivers(res.drivers || []);
    } catch { toast.error('Failed to load drivers'); }
    setLoading(false);
  }, [tab, search]);

  useEffect(() => {
    const t = setTimeout(fetchDrivers, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchDrivers]);

  async function toggleExpand(driverId) {
    if (expanded === driverId) { setExpanded(null); return; }
    setExpanded(driverId);

    // Load docs
    setLoadingDocs(p => ({ ...p, [driverId]: true }));
    try {
      const res = await api.get(`/drivers/${driverId}/documents`);
      setDocMap(p => ({ ...p, [driverId]: res.documents || [] }));
    } catch { toast.error('Failed to load documents'); }
    setLoadingDocs(p => ({ ...p, [driverId]: false }));

    // Load history
    setLoadingHistory(p => ({ ...p, [driverId]: true }));
    try {
      const res = await api.get(`/drivers/${driverId}/history`);
      setHistoryMap(p => ({ ...p, [driverId]: res.history || [] }));
    } catch {}
    setLoadingHistory(p => ({ ...p, [driverId]: false }));
  }

  async function verify(driverId) {
    setActioning(p => ({ ...p, [driverId]: true }));
    try {
      await api.put(`/drivers/${driverId}/verify`, { is_verified: 1 });
      toast.success('Driver verified — they can now accept loads');
      setExpanded(null);
      setDocMap(p => { const n = { ...p }; delete n[driverId]; return n; });
      setHistoryMap(p => { const n = { ...p }; delete n[driverId]; return n; });
      await fetchDrivers();
    } catch (err) { toast.error(err.message || 'Failed'); }
    setActioning(p => ({ ...p, [driverId]: false }));
  }

  async function reject() {
    if (!rejectNote.trim()) { toast.error('Enter a rejection reason'); return; }
    const { driverId } = rejectModal;
    setActioning(p => ({ ...p, [driverId]: true }));
    try {
      await api.put(`/drivers/${driverId}/verify`, { is_verified: 2, verification_note: rejectNote });
      toast.success('Driver rejected');
      setRejectModal(null);
      setRejectNote('');
      setExpanded(null);
      setDocMap(p => { const n = { ...p }; delete n[driverId]; return n; });
      setHistoryMap(p => { const n = { ...p }; delete n[driverId]; return n; });
      await fetchDrivers();
    } catch (err) { toast.error(err.message || 'Failed'); }
    setActioning(p => ({ ...p, [driverId]: false }));
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-navy-900">Driver Verification</h1>
          <p className="text-sm text-slate-500 mt-1">Review uploaded documents and verify drivers before they can accept loads</p>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email or registration number…"
            className="input-field !pl-9 w-full"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {STATUS_TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                tab === t.key ? `${t.bg} ${t.color}` : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="card animate-pulse h-20" />)}
          </div>
        ) : drivers.length === 0 ? (
          <div className="card text-center py-16">
            <ShieldCheck size={40} className="text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500">
              {search ? `No drivers matching "${search}"` : `No ${tab === 'all' ? '' : tab} drivers found.`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {drivers.map(driver => {
              const isOpen     = expanded === driver.id;
              const docs       = docMap[driver.id] || [];
              const history    = historyMap[driver.id] || [];
              const isVerified = driver.is_verified === 1;
              const isRejected = driver.is_verified === 2;
              const isPending  = driver.is_verified === 0;

              const regularDocs  = docs.filter(d => !VEHICLE_KEYS.includes(d.doc_type));
              const vehiclePhotos = docs.filter(d => VEHICLE_KEYS.includes(d.doc_type));

              return (
                <div key={driver.id} className="card !p-0 overflow-hidden">
                  <button
                    className="w-full flex items-center gap-4 p-4 text-left hover:bg-slate-50 transition-colors"
                    onClick={() => toggleExpand(driver.id)}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isVerified ? 'bg-green-50' : isRejected ? 'bg-red-50' : 'bg-amber-50'
                    }`}>
                      {isVerified && <CheckCircle size={18} className="text-green-600" />}
                      {isRejected && <XCircle     size={18} className="text-red-500" />}
                      {isPending  && <Clock        size={18} className="text-amber-500" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-navy-900">{driver.name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                          isVerified ? 'bg-green-50 border-green-200 text-green-700' :
                          isRejected ? 'bg-red-50 border-red-200 text-red-600' :
                          'bg-amber-50 border-amber-200 text-amber-700'
                        }`}>
                          {isVerified ? 'Verified' : isRejected ? 'Rejected' : 'Pending'}
                        </span>
                        <span className="text-xs text-slate-400">{driver.doc_count} doc{driver.doc_count !== 1 ? 's' : ''} uploaded</span>
                        {parseInt(driver.rejection_count) > 0 && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-600">
                            {driver.rejection_count} rejection{driver.rejection_count > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {driver.email} · {driver.truck_type} · {driver.registration_number}
                      </p>
                    </div>

                    <div className="text-slate-400 shrink-0">
                      {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-slate-100 p-4 space-y-6 bg-slate-50/60">

                      {/* Truck details */}
                      <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-3">Truck Details</p>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                          {[
                            { icon: Truck,  label: 'Type',          val: driver.truck_type },
                            { icon: Weight, label: 'Capacity',       val: `${driver.capacity_tons} tons` },
                            { icon: Hash,   label: 'Reg. Number',    val: driver.registration_number },
                            { icon: Hash,   label: 'Permit Number',  val: driver.permit_number || '—' },
                            { icon: MapPin, label: 'Home State',      val: driver.home_state || '—' },
                            { icon: Phone,  label: 'Phone',          val: driver.phone || '—' },
                          ].map(({ icon: Icon, label, val }) => (
                            <div key={label} className="flex items-start gap-2 p-3 rounded-xl bg-white border border-slate-200">
                              <Icon size={13} className="text-slate-400 mt-0.5 shrink-0" />
                              <div>
                                <p className="text-xs text-slate-400">{label}</p>
                                <p className="font-medium text-navy-900 text-sm">{val}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Current rejection note */}
                      {isRejected && driver.verification_note && (
                        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
                          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                          <div><span className="font-semibold">Current rejection reason: </span>{driver.verification_note}</div>
                        </div>
                      )}

                      {/* Documents */}
                      <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-3">Uploaded Documents</p>
                        {loadingDocs[driver.id] ? (
                          <p className="text-sm text-slate-400">Loading documents…</p>
                        ) : docs.length === 0 ? (
                          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-700 flex items-center gap-2">
                            <AlertTriangle size={15} className="shrink-0" />
                            No documents uploaded yet.
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {regularDocs.length > 0 && (
                              <div className="grid sm:grid-cols-2 gap-3">
                                {regularDocs.map(doc => (
                                  <a key={doc.id} href={docUrl(doc.file_url)} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 hover:border-navy-300 hover:bg-navy-50 transition-colors group"
                                  >
                                    <div className="w-9 h-9 rounded-lg bg-navy-50 border border-navy-200 flex items-center justify-center shrink-0 group-hover:bg-navy-100">
                                      <FileText size={16} className="text-navy-900" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-semibold text-navy-900">{DOC_LABEL[doc.doc_type] || doc.doc_type}</p>
                                      <p className="text-xs text-slate-400">
                                        {new Date(doc.uploaded_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                      </p>
                                    </div>
                                    <Eye size={14} className="text-slate-400 group-hover:text-navy-900 shrink-0" />
                                  </a>
                                ))}
                              </div>
                            )}

                            {/* Vehicle photos as image grid */}
                            {vehiclePhotos.length > 0 && (
                              <div>
                                <p className="text-xs text-slate-400 font-medium mb-2">Vehicle Photos</p>
                                <div className="grid grid-cols-3 gap-3">
                                  {vehiclePhotos.map(doc => (
                                    <a key={doc.id} href={docUrl(doc.file_url)} target="_blank" rel="noopener noreferrer"
                                      className="group relative rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-100"
                                    >
                                      <img
                                        src={docUrl(doc.file_url)}
                                        alt={DOC_LABEL[doc.doc_type]}
                                        className="w-full h-full object-cover"
                                      />
                                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                        <Eye size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                      </div>
                                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs py-1 px-2 text-center">
                                        {DOC_LABEL[doc.doc_type]}
                                      </div>
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Rejection history */}
                      {(history.length > 0 || loadingHistory[driver.id]) && (
                        <div>
                          <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-3 flex items-center gap-1.5">
                            <History size={12} /> Verification History
                          </p>
                          {loadingHistory[driver.id] ? (
                            <p className="text-sm text-slate-400">Loading history…</p>
                          ) : (
                            <div className="space-y-2">
                              {history.map(h => (
                                <div key={h.id} className={`flex items-start gap-2.5 p-3 rounded-xl text-sm border ${
                                  h.action === 'rejected' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
                                }`}>
                                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                                    h.action === 'rejected' ? 'bg-red-200' : 'bg-blue-200'
                                  }`}>
                                    {h.action === 'rejected'
                                      ? <XCircle size={11} className="text-red-600" />
                                      : <CheckCircle size={11} className="text-blue-600" />
                                    }
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className={`font-semibold capitalize text-xs ${
                                        h.action === 'rejected' ? 'text-red-700' : 'text-blue-700'
                                      }`}>
                                        {h.action === 'rejected' ? 'Rejected' : 'Re-submitted by driver'}
                                      </span>
                                      <span className="text-xs text-slate-400 shrink-0">
                                        {new Date(h.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>
                                    {h.note && <p className="text-xs text-slate-600 mt-0.5">{h.note}</p>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action buttons */}
                      {!isVerified && (
                        <div className="flex gap-3 pt-1">
                          <button onClick={() => verify(driver.id)} disabled={actioning[driver.id]}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-60"
                          >
                            <CheckCircle size={15} />
                            {actioning[driver.id] ? 'Verifying…' : 'Verify Driver'}
                          </button>
                          <button
                            onClick={() => { setRejectModal({ driverId: driver.id, name: driver.name }); setRejectNote(''); }}
                            disabled={actioning[driver.id]}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 transition-colors disabled:opacity-60"
                          >
                            <XCircle size={15} /> Reject
                          </button>
                        </div>
                      )}
                      {isVerified && (
                        <button
                          onClick={() => { setRejectModal({ driverId: driver.id, name: driver.name }); setRejectNote(''); }}
                          disabled={actioning[driver.id]}
                          className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 transition-colors disabled:opacity-60"
                        >
                          <XCircle size={15} /> Revoke Verification
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reject modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setRejectModal(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl border border-slate-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                <XCircle size={22} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-navy-900">Reject Driver</h3>
                <p className="text-xs text-slate-500 mt-0.5">{rejectModal.name}</p>
              </div>
            </div>
            <label className="text-sm font-medium text-slate-600 block mb-1.5">Reason for rejection</label>
            <textarea
              value={rejectNote}
              onChange={e => setRejectNote(e.target.value)}
              rows={3}
              className="input-field mb-4"
              placeholder="e.g. RC book image is blurry, please re-upload…"
            />
            <div className="flex gap-3">
              <button onClick={() => setRejectModal(null)} className="btn-secondary flex-1 !py-2.5 text-sm">Cancel</button>
              <button
                onClick={reject}
                disabled={!rejectNote.trim() || actioning[rejectModal?.driverId]}
                className="flex-1 !py-2.5 text-sm rounded-xl font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

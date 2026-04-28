import { useState, useEffect } from 'react';

const BACKEND = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : '';

import { useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  Truck, Hash, MapPin, Weight, CheckCircle, Upload, FileText,
  Clock, XCircle, Eye, Send, Camera,
} from 'lucide-react';
import toast from 'react-hot-toast';

const TRUCK_TYPES = ['Tata Prima', 'Ashok Leyland', 'Eicher Pro', 'BharatBenz', 'Mahindra Blazo', 'Tata Signa', 'Other'];
const HOME_STATES = ['Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'Gujarat', 'Uttar Pradesh', 'Punjab', 'Haryana', 'West Bengal', 'Kerala', 'Rajasthan'];

const DOC_TYPES = [
  { key: 'RC',        label: 'RC Book',              desc: 'Vehicle Registration Certificate', accept: '.pdf,.jpg,.jpeg,.png,.webp' },
  { key: 'licence',   label: "Driver's Licence",     desc: 'Valid driving licence',            accept: '.pdf,.jpg,.jpeg,.png,.webp' },
  { key: 'permit',    label: 'National Permit',       desc: 'All-India goods permit',           accept: '.pdf,.jpg,.jpeg,.png,.webp' },
  { key: 'insurance', label: 'Insurance Certificate', desc: 'Valid vehicle insurance',          accept: '.pdf,.jpg,.jpeg,.png,.webp' },
  { key: 'PUC',       label: 'PUC Certificate',       desc: 'Pollution Under Control',          accept: '.pdf,.jpg,.jpeg,.png,.webp' },
];

const VEHICLE_PHOTOS = [
  { key: 'vehicle_front', label: 'Front View',     desc: 'Clear photo of the front of the truck', accept: '.jpg,.jpeg,.png,.webp' },
  { key: 'vehicle_left',  label: 'Left Side View', desc: 'Full left side of the truck',            accept: '.jpg,.jpeg,.png,.webp' },
  { key: 'vehicle_right', label: 'Right Side View', desc: 'Full right side of the truck',           accept: '.jpg,.jpeg,.png,.webp' },
];

const ALL_DOCS = [...DOC_TYPES, ...VEHICLE_PHOTOS];

export default function RegisterTruck() {
  const api      = useApi();
  const { user, fetchUser } = useAuth();
  const navigate = useNavigate();

  const isEditing      = !!user?.truck;
  const isVerified     = user?.truck?.is_verified === 1;
  const isRejected     = user?.truck?.is_verified === 2;
  const verificationStatus = user?.truck?.is_verified;

  // Truck form fields
  const [form, setForm] = useState({
    truck_type:          user?.truck?.truck_type || '',
    capacity_tons:       user?.truck?.capacity_tons ?? '',
    permit_number:       user?.truck?.permit_number || '',
    home_state:          user?.truck?.home_state || '',
    registration_number: user?.truck?.registration_number || '',
  });

  // Already-saved documents from server
  const [savedDocs, setSavedDocs] = useState([]);

  // Staged files (not yet uploaded) — { [docKey]: File }
  const [staged, setStaged] = useState({});

  // Preview URLs for staged files
  const [previews, setPreviews] = useState({});

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isEditing) refreshDocs();
  }, [isEditing]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => Object.values(previews).forEach(url => URL.revokeObjectURL(url));
  }, []);

  async function refreshDocs() {
    const res = await api.get('/documents/mine').catch(() => ({ documents: [] }));
    setSavedDocs(res.documents || []);
  }

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function stageFile(docKey, file) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error(`${file.name} exceeds 5 MB. Please choose a smaller file.`);
      return;
    }
    // Revoke old preview
    if (previews[docKey]) URL.revokeObjectURL(previews[docKey]);
    const previewUrl = URL.createObjectURL(file);
    setStaged(prev => ({ ...prev, [docKey]: file }));
    setPreviews(prev => ({ ...prev, [docKey]: previewUrl }));
  }

  // One submit: save truck → upload all staged docs → submit for review
  async function handleSubmit(e) {
    e.preventDefault();

    // Validate truck form
    if (!form.truck_type || !form.capacity_tons || !form.registration_number || !form.home_state) {
      toast.error('Fill in all required truck details');
      return;
    }

    // If not editing (first time), all docs must be staged
    if (!isEditing) {
      const missing = ALL_DOCS.filter(d => !staged[d.key]);
      if (missing.length > 0) {
        toast.error(`Upload required: ${missing.map(d => d.label).join(', ')}`);
        return;
      }
    }

    // If editing and not verified, must have all docs (saved or staged)
    if (isEditing && !isVerified) {
      const missing = ALL_DOCS.filter(d => !savedDocs.find(s => s.doc_type === d.key) && !staged[d.key]);
      if (missing.length > 0) {
        toast.error(`Upload required: ${missing.map(d => d.label).join(', ')}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      // Step 1: Save truck details
      await api.post('/drivers/truck', { ...form, capacity_tons: parseFloat(form.capacity_tons) });

      // Step 2: Upload all staged files
      const token = localStorage.getItem('token');
      const uploadPromises = Object.entries(staged).map(async ([docKey, file]) => {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('doc_type', docKey);
        const res = await fetch('/api/documents', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(`${docKey}: ${data.error || 'Upload failed'}`);
        }
      });
      await Promise.all(uploadPromises);

      // Step 3: Submit for review (only if not already verified)
      if (!isVerified) {
        await api.post('/drivers/submit-verification');
      }

      await fetchUser();
      setStaged({});
      setPreviews({});
      await refreshDocs();

      toast.success(isEditing
        ? (isRejected ? 'Re-submitted for admin review!' : 'Details updated and submitted for review!')
        : 'Registered and submitted for admin verification!'
      );
    } catch (err) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  function DocRow({ doc, isPhoto }) {
    const saved       = savedDocs.find(d => d.doc_type === doc.key);
    const stagedFile  = staged[doc.key];
    const previewUrl  = previews[doc.key];
    const hasFile     = !!saved || !!stagedFile;

    const thumbSrc = isPhoto
      ? (previewUrl || (saved ? `${BACKEND}${saved.file_url}` : null))
      : null;

    return (
      <div className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border transition-colors ${
        isVerified && saved ? 'border-green-300 bg-green-50' :
        hasFile             ? 'border-green-200 bg-green-50/60' :
                              'border-slate-200 bg-slate-50'
      }`}>
        <div className="min-w-0 flex items-center gap-3">
          {isPhoto && (
            <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center bg-slate-200 shrink-0">
              {thumbSrc
                ? <img src={thumbSrc} alt="" className="w-full h-full object-cover" onError={e => { e.target.style.display='none'; }} />
                : <Camera size={16} className="text-slate-400" />
              }
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-navy-900">{doc.label}</p>
            <p className="text-xs text-slate-400">{doc.desc}</p>
            {isVerified && saved && (
              <p className="text-xs text-green-700 mt-0.5 font-semibold flex items-center gap-1">
                <CheckCircle size={11} /> Verified by Admin
              </p>
            )}
            {!isVerified && stagedFile && (
              <p className="text-xs text-blue-600 mt-0.5 font-medium">📎 {stagedFile.name} — ready to upload</p>
            )}
            {!isVerified && !stagedFile && saved && (
              <p className="text-xs text-green-600 mt-0.5 font-medium">✓ Previously uploaded</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* View saved file */}
          {saved && !stagedFile && (
            <a
              href={`${BACKEND}${saved.file_url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-100"
            >
              <Eye size={12} /> View
            </a>
          )}

          {/* Upload button — hidden when verified */}
          {!isVerified && (
            <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              hasFile
                ? 'bg-white border border-green-200 text-green-700 hover:bg-green-100'
                : 'btn-primary !py-1.5 !text-xs'
            }`}>
              {isPhoto ? <Camera size={12} /> : <Upload size={12} />}
              {hasFile ? 'Change' : 'Choose'}
              <input
                type="file"
                accept={doc.accept}
                className="hidden"
                onChange={e => stageFile(doc.key, e.target.files[0])}
              />
            </label>
          )}
        </div>
      </div>
    );
  }

  const submitLabel = () => {
    if (submitting) return 'Saving…';
    if (!isEditing)  return 'Register Truck & Submit for Verification';
    if (isRejected)  return 'Save Changes & Re-submit for Review';
    if (isVerified)  return 'Save Truck Details';
    return 'Save & Submit for Review';
  };

  return (
    <div className="page-container">
      <div className="max-w-2xl mx-auto">

        {/* Verification status banner */}
        {isEditing && (
          <div className={`mb-6 p-4 rounded-xl border flex items-start gap-3 ${
            isVerified  ? 'bg-green-50 border-green-200' :
            isRejected  ? 'bg-red-50 border-red-200' :
                          'bg-amber-50 border-amber-200'
          }`}>
            {isVerified  && <CheckCircle size={20} className="text-green-600 shrink-0 mt-0.5" />}
            {isRejected  && <XCircle     size={20} className="text-red-500 shrink-0 mt-0.5" />}
            {!isVerified && !isRejected && <Clock size={20} className="text-amber-500 shrink-0 mt-0.5" />}
            <div>
              <p className={`font-semibold text-sm ${isVerified ? 'text-green-700' : isRejected ? 'text-red-600' : 'text-amber-700'}`}>
                {isVerified ? 'Verified — you can accept loads' :
                 isRejected ? 'Rejected — fix issues and re-submit' :
                 'Pending admin verification'}
              </p>
              {isRejected && user.truck.verification_note && (
                <p className="text-xs text-red-600 mt-1">Reason: {user.truck.verification_note}</p>
              )}
            </div>
          </div>
        )}

        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-navy-900 flex items-center justify-center mx-auto mb-4">
            <Truck size={26} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-navy-900">
            {isEditing ? 'Edit Truck & Documents' : 'Register Your Truck'}
          </h1>
          <p className="text-slate-500 text-sm mt-2">
            {isEditing
              ? 'Update your truck details and documents, then save.'
              : 'Fill in your truck details and upload all documents in one go.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── Truck details ── */}
          <div className="card space-y-5">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Truck Details</p>

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-600 mb-2">
                  <Truck size={13} /> Truck Type
                </label>
                <select required value={form.truck_type} onChange={e => update('truck_type', e.target.value)} className="input-field">
                  <option value="">Select Type</option>
                  {TRUCK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-600 mb-2">
                  <Weight size={13} /> Capacity (Tons)
                </label>
                <input type="number" step="0.5" min="1" required value={form.capacity_tons}
                  onChange={e => update('capacity_tons', e.target.value)}
                  className="input-field" placeholder="e.g. 15.5" />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-slate-600 mb-2">
                <Hash size={13} /> Registration Number
              </label>
              <input type="text" required value={form.registration_number}
                onChange={e => update('registration_number', e.target.value.toUpperCase())}
                className="input-field uppercase" placeholder="e.g. MH04-AB-1234" />
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-600 mb-2">
                  <MapPin size={13} /> Home State
                </label>
                <select required value={form.home_state} onChange={e => update('home_state', e.target.value)} className="input-field">
                  <option value="">Select State</option>
                  {HOME_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-600 mb-2">
                  <CheckCircle size={13} /> National Permit Number
                </label>
                <input type="text" value={form.permit_number}
                  onChange={e => update('permit_number', e.target.value.toUpperCase())}
                  className="input-field uppercase" placeholder="e.g. NP-MH-2024-001" />
              </div>
            </div>
          </div>

          {/* ── Documents ── */}
          <div className="card space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <FileText size={16} className="text-navy-900" />
              <p className="font-bold text-navy-900">Documents</p>
            </div>
            <p className="text-xs text-slate-500 -mt-1">Upload clear photos or PDFs. Max 5 MB each.</p>
            {DOC_TYPES.map(doc => <DocRow key={doc.key} doc={doc} isPhoto={false} />)}
          </div>

          {/* ── Vehicle photos ── */}
          <div className="card space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Camera size={16} className="text-navy-900" />
              <p className="font-bold text-navy-900">Vehicle Photos</p>
            </div>
            <p className="text-xs text-slate-500 -mt-1">Front, left side and right side photos of your truck.</p>
            {VEHICLE_PHOTOS.map(doc => <DocRow key={doc.key} doc={doc} isPhoto={true} />)}
          </div>

          <p className="text-xs text-center text-slate-400">
            Documents: PDF, JPG, PNG, WebP · Photos: JPG, PNG, WebP · Max 5 MB per file
          </p>

          {/* ── Submit ── */}
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full !py-3.5 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Send size={16} />
            {submitLabel()}
          </button>
        </form>
      </div>
    </div>
  );
}

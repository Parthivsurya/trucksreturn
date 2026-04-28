import { useState, useEffect } from 'react';

const BACKEND = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : '';

import { useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Truck, Hash, MapPin, Weight, CheckCircle, Upload, FileText, Clock, XCircle, Eye, Send, Camera } from 'lucide-react';
import toast from 'react-hot-toast';

const TRUCK_TYPES = ['Tata Prima', 'Ashok Leyland', 'Eicher Pro', 'BharatBenz', 'Mahindra Blazo', 'Tata Signa', 'Other'];
const HOME_STATES = ['Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'Gujarat', 'Uttar Pradesh', 'Punjab', 'Haryana', 'West Bengal', 'Kerala', 'Rajasthan'];

const DOC_TYPES = [
  { key: 'RC',        label: 'RC Book',              desc: 'Vehicle Registration Certificate' },
  { key: 'licence',   label: "Driver's Licence",     desc: 'Valid driving licence' },
  { key: 'permit',    label: 'National Permit',       desc: 'All-India goods permit' },
  { key: 'insurance', label: 'Insurance Certificate', desc: 'Valid vehicle insurance' },
  { key: 'PUC',       label: 'PUC Certificate',       desc: 'Pollution Under Control' },
];

const VEHICLE_PHOTOS = [
  { key: 'vehicle_front', label: 'Front View',      desc: 'Clear photo of the front of the truck' },
  { key: 'vehicle_left',  label: 'Left Side View',  desc: 'Full left side of the truck' },
  { key: 'vehicle_right', label: 'Right Side View', desc: 'Full right side of the truck' },
];

export default function RegisterTruck() {
  const api = useApi();
  const { user, fetchUser } = useAuth();
  const navigate = useNavigate();
  const isEditing = !!user?.truck;

  const [loading, setLoading]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState({});
  const [form, setForm] = useState({
    truck_type:          user?.truck?.truck_type || '',
    capacity_tons:       user?.truck?.capacity_tons ?? '',
    permit_number:       user?.truck?.permit_number || '',
    home_state:          user?.truck?.home_state || '',
    registration_number: user?.truck?.registration_number || '',
  });

  useEffect(() => {
    if (user?.truck) refreshDocs();
  }, [user?.truck]);

  async function refreshDocs() {
    const res = await api.get('/documents/mine').catch(() => ({ documents: [] }));
    setDocuments(res.documents || []);
  }

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/drivers/truck', { ...form, capacity_tons: parseFloat(form.capacity_tons) });
      await fetchUser();
      toast.success(isEditing ? 'Truck details updated!' : 'Truck registered! Now upload your documents.');
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Failed to register truck');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(docType, file) {
    if (!file) return;
    setUploading(prev => ({ ...prev, [docType]: true }));
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('doc_type', docType);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      const allDocs = [...DOC_TYPES, ...VEHICLE_PHOTOS];
      toast.success(`${allDocs.find(d => d.key === docType)?.label} uploaded`);
      await refreshDocs();
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(prev => ({ ...prev, [docType]: false }));
    }
  }

  async function handleSubmitForReview() {
    const allRequired = [...DOC_TYPES, ...VEHICLE_PHOTOS];
    const missing = allRequired.filter(d => !documents.find(doc => doc.doc_type === d.key));
    if (missing.length > 0) {
      toast.error(`Please upload: ${missing.map(d => d.label).join(', ')}`);
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/drivers/submit-verification');
      await fetchUser();
      toast.success('Submitted for admin review!');
    } catch (err) {
      toast.error(err.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  }

  const verificationStatus = user?.truck?.is_verified;
  const allUploaded = [...DOC_TYPES, ...VEHICLE_PHOTOS].every(d => documents.find(doc => doc.doc_type === d.key));

  function DocRow({ doc, isPhoto }) {
    const uploaded    = documents.find(d => d.doc_type === doc.key);
    const isUploading = uploading[doc.key];
    const isVerified  = verificationStatus === 1;

    return (
      <div className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border ${
        isVerified && uploaded ? 'border-green-300 bg-green-50' :
        uploaded ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-slate-50'
      }`}>
        <div className="min-w-0 flex items-center gap-3">
          {isPhoto && (
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${uploaded ? 'bg-green-100' : 'bg-slate-200'}`}>
              {uploaded
                ? <img src={`${BACKEND}${uploaded.file_url}`} alt="" className="w-9 h-9 object-cover rounded-lg" onError={e => { e.target.style.display='none'; }} />
                : <Camera size={16} className="text-slate-400" />
              }
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-navy-900">{doc.label}</p>
            <p className="text-xs text-slate-400">{doc.desc}</p>
            {uploaded && !isVerified && (
              <p className="text-xs text-green-600 mt-0.5 font-medium">
                ✓ Uploaded {new Date(uploaded.uploaded_at).toLocaleDateString('en-IN')}
              </p>
            )}
            {uploaded && isVerified && (
              <p className="text-xs text-green-700 mt-0.5 font-semibold flex items-center gap-1">
                <CheckCircle size={11} /> Verified by Admin
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {uploaded && (
            <a
              href={`${BACKEND}${uploaded.file_url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-100"
            >
              <Eye size={12} /> View
            </a>
          )}
          {/* Lock uploads once verified */}
          {!isVerified && (
            <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              uploaded ? 'bg-white border border-green-200 text-green-700 hover:bg-green-100' : 'btn-primary !py-1.5 !text-xs'
            }`}>
              {isUploading
                ? <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                : (isPhoto ? <Camera size={12} /> : <Upload size={12} />)
              }
              {uploaded ? 'Replace' : 'Upload'}
              <input
                type="file"
                accept={isPhoto ? '.jpg,.jpeg,.png,.webp' : '.pdf,.jpg,.jpeg,.png,.webp'}
                className="hidden"
                disabled={isUploading}
                onChange={e => handleUpload(doc.key, e.target.files[0])}
              />
            </label>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="max-w-2xl mx-auto">

        {/* Verification status banner */}
        {isEditing && (
          <div className={`mb-6 p-4 rounded-xl border flex items-start gap-3 ${
            verificationStatus === 1 ? 'bg-green-50 border-green-200' :
            verificationStatus === 2 ? 'bg-red-50 border-red-200' :
            'bg-amber-50 border-amber-200'
          }`}>
            {verificationStatus === 1 && <CheckCircle size={20} className="text-green-600 shrink-0 mt-0.5" />}
            {verificationStatus === 2 && <XCircle size={20} className="text-red-500 shrink-0 mt-0.5" />}
            {(verificationStatus === 0 || verificationStatus === undefined) && <Clock size={20} className="text-amber-500 shrink-0 mt-0.5" />}
            <div>
              <p className={`font-semibold text-sm ${
                verificationStatus === 1 ? 'text-green-700' :
                verificationStatus === 2 ? 'text-red-600' : 'text-amber-700'
              }`}>
                {verificationStatus === 1 ? 'Verified — you can accept loads' :
                 verificationStatus === 2 ? 'Rejected — re-upload your documents and submit again' :
                 'Pending verification — upload all documents and submit for review'}
              </p>
              {verificationStatus === 2 && user.truck.verification_note && (
                <p className="text-xs text-red-600 mt-1">Reason: {user.truck.verification_note}</p>
              )}
            </div>
          </div>
        )}

        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-navy-900 flex items-center justify-center mx-auto mb-4">
            <Truck size={26} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-navy-900">{isEditing ? 'Edit Truck Details' : 'Register Your Truck'}</h1>
          <p className="text-slate-500 text-sm mt-2">
            {isEditing ? 'Update your truck information below' : 'Register your truck and upload documents for verification'}
          </p>
        </div>

        {/* Truck details form */}
        <form onSubmit={handleSubmit} className="card space-y-5 mb-6">
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

          <button type="submit" disabled={loading} className="btn-primary w-full !py-3.5 mt-2">
            {loading ? (isEditing ? 'Saving…' : 'Registering…') : (isEditing ? 'Save Changes' : 'Register Truck')}
          </button>
        </form>

        {/* Document upload section */}
        {user?.truck && (
          <div className="card space-y-6">

            {/* Documents */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FileText size={17} className="text-navy-900" />
                <h2 className="font-bold text-navy-900">Documents</h2>
              </div>
              <p className="text-xs text-slate-500 mb-4">Upload clear photos or PDFs. Max 5 MB per file.</p>
              <div className="space-y-3">
                {DOC_TYPES.map(doc => <DocRow key={doc.key} doc={doc} isPhoto={false} />)}
              </div>
            </div>

            {/* Vehicle photos */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Camera size={17} className="text-navy-900" />
                <h2 className="font-bold text-navy-900">Vehicle Photos</h2>
              </div>
              <p className="text-xs text-slate-500 mb-4">Upload 3 clear photos of your truck (front, left side, right side).</p>
              <div className="space-y-3">
                {VEHICLE_PHOTOS.map(doc => <DocRow key={doc.key} doc={doc} isPhoto={true} />)}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-500">
              Documents: JPG, PNG, WebP, PDF · Vehicle photos: JPG, PNG, WebP · Max 5 MB each
            </div>

            {/* Submit for Review button — disabled when already verified or nothing uploaded */}
            {verificationStatus !== 1 && (
              <button
                onClick={handleSubmitForReview}
                disabled={submitting || !allUploaded}
                className="btn-primary w-full !py-3.5 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send size={16} />
                {submitting ? 'Submitting…' : verificationStatus === 2 ? 'Re-submit for Review' : 'Submit for Review'}
              </button>
            )}
            {verificationStatus !== 1 && !allUploaded && (
              <p className="text-xs text-center text-slate-400 -mt-3">
                Upload all {DOC_TYPES.length + VEHICLE_PHOTOS.length} documents and photos to enable submission
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

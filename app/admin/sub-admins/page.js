"use client";

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { 
  ShieldCheck, 
  UserPlus, 
  ShieldAlert, 
  Trash2, 
  Edit3, 
  X, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  LockIcon,
  ShieldIcon,
  UserCheck
} from 'lucide-react';

const PERMISSION_MODULES = [
  { key: 'users', label: 'Users' },
  { key: 'pages', label: 'Pages & Content' },
  { key: 'categories', label: 'Categories' },
  { key: 'services', label: 'Services' },
  { key: 'orders', label: 'Orders' },
  { key: 'enquiries', label: 'Enquiries' },
  { key: 'gallery', label: 'Gallery' },
  { key: 'settings', label: 'System Settings' },
  { key: 'dashboard', label: 'Dashboard Stats' },
];

export default function SubAdminsPage() {
  const [subAdmins, setSubAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const initialForm = {
    name: '',
    email: '',
    password: '',
      permissions: {
        users: { view: false, edit: false },
        pages: { view: true, edit: false },
        categories: { view: true, edit: false },
        services: { view: true, edit: false },
        orders: { view: true, edit: false },
        enquiries: { view: true, edit: false },
        gallery: { view: false, edit: false },
        settings: { view: false, edit: false },
        dashboard: { view: false, edit: false },
    }
  };
  
  const [formData, setFormData] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  const fetchSubAdmins = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/sub-admins');
      const data = await res.json();
      if (data.success) {
        setSubAdmins(data.data);
      }
    } catch (error) {
      toast.error("Failed to load sub-admins");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(fetchSubAdmins);
  }, [fetchSubAdmins]);

  const handleTogglePermission = (module, type) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [module]: {
          ...prev.permissions[module],
          [type]: !prev.permissions[module][type]
        }
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const url = isEditing 
        ? `/api/admin/sub-admins/${editingId}` 
        : '/api/admin/sub-admins';
      
      const method = isEditing ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success(isEditing ? "Permissions updated!" : "Sub-admin created!");
        setModalOpen(false);
        fetchSubAdmins();
        setFormData(initialForm);
      } else {
        toast.error(data.error || "Operation failed");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (admin) => {
    setFormData({
      name: admin.name,
      email: admin.email,
      password: '', // Don't show password
      permissions: {
        ...initialForm.permissions,
        ...(admin.permissions || {})
      }
    });
    setEditingId(admin._id);
    setIsEditing(true);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure? This will remove all access for this sub-admin.")) return;
    
    try {
      const res = await fetch(`/api/admin/sub-admins/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success("Sub-admin removed");
        fetchSubAdmins();
      }
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  const labelClass = "block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1";
  const inputClass = "w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-100 transition-all font-medium text-sm";

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-violet-600">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Access Management</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase italic">
            Sub-Admin <span className="text-violet-600">Portal</span>
          </h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Delegated authority & Role-Based Control</p>
        </div>
        
        <button 
          onClick={() => {
            setFormData(initialForm);
            setIsEditing(false);
            setModalOpen(true);
          }}
          className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200 group"
        >
          <UserPlus className="w-4 h-4 group-hover:scale-110 transition-transform" />
          Onboard Sub-Admin
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="w-10 h-10 text-violet-600 animate-spin" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Decrypting permissions...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subAdmins.map(admin => (
            <div key={admin._id} className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm hover:shadow-xl hover:shadow-slate-100 transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-bl-[4rem] -mr-8 -mt-8 transition-all group-hover:bg-violet-50" />
              
              <div className="relative z-10 space-y-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-xl font-black italic">
                      {admin.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 uppercase tracking-tight">{admin.name}</h3>
                      <p className="text-[10px] font-bold text-slate-400 truncate max-w-[150px]">{admin.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(admin)} className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-all">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(admin._id)} className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest border-b border-slate-50 pb-2">Active Privileges</p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(admin.permissions || {}).map(([key, val]) => (
                      val.view && (
                        <div key={key} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl">
                          <CheckCircle2 className={`w-3 h-3 ${val.edit ? 'text-emerald-500' : 'text-amber-500'}`} />
                          <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter truncate">
                            {PERMISSION_MODULES.find(m => m.key === key)?.label}
                            {val.edit && <span className="text-[7px] ml-1 text-slate-400">(Edit)</span>}
                          </span>
                        </div>
                      )
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 pt-2">
                  <ShieldIcon className="w-3 h-3 text-violet-500" />
                  <span className="text-[9px] font-bold text-violet-600 uppercase">Sub-Admin Protocol Active</span>
                </div>
              </div>
            </div>
          ))}
          
          {subAdmins.length === 0 && (
            <div className="col-span-full py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center space-y-4">
              <ShieldAlert className="w-12 h-12 text-slate-200" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                No active sub-admins.<br/>Authority is currently centralized.
              </p>
            </div>
          )}
        </div>
      )}

      {/* MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-10 space-y-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">
                    {isEditing ? 'Configure Privileges' : 'Provision Sub-Admin'}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Assign roles & access levels</p>
                </div>
                <button onClick={() => setModalOpen(false)} className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={labelClass}>Full Name</label>
                    <input 
                      type="text" required value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      placeholder="Admin Name" className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Email Address</label>
                    <input 
                      type="email" required value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      placeholder="email@nexus.com" className={inputClass}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelClass}>{isEditing ? 'New Password (Leave blank to keep current)' : 'Access Password'}</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                      <input 
                        type="password" required={!isEditing} value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                        className={`${inputClass} pl-12`}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6 bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
                   <div className="flex items-center gap-2 mb-2">
                     <LockIcon className="w-4 h-4 text-violet-600" />
                     <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Permission Matrix</h3>
                   </div>
                   
                   <div className="grid grid-cols-1 gap-4">
                     {PERMISSION_MODULES.map(module => (
                       <div key={module.key} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                         <div>
                            <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{module.label}</p>
                            <p className="text-[9px] text-slate-400 font-bold">Manage {module.label.toLowerCase()} system</p>
                         </div>
                         <div className="flex items-center gap-6">
                           <button 
                             type="button"
                             onClick={() => handleTogglePermission(module.key, 'view')}
                             className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all ${
                               formData.permissions[module.key]?.view 
                                ? 'bg-violet-50 border-violet-200 text-violet-600' 
                                : 'bg-slate-50 border-transparent text-slate-300'
                             }`}
                           >
                             {formData.permissions[module.key]?.view ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                             <span className="text-[9px] font-black uppercase">View</span>
                           </button>
                           
                           <button 
                             type="button"
                             onClick={() => handleTogglePermission(module.key, 'edit')}
                             disabled={!formData.permissions[module.key]?.view}
                             className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all ${
                               formData.permissions[module.key]?.edit 
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                                : 'bg-slate-50 border-transparent text-slate-300 disabled:opacity-30'
                             }`}
                           >
                             <Edit3 className="w-3.5 h-3.5" />
                             <span className="text-[9px] font-black uppercase">Edit</span>
                           </button>
                         </div>
                       </div>
                     ))}
                   </div>
                </div>

                <button 
                  type="submit"
                  disabled={submitting}
                  className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-2xl shadow-slate-200 flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserCheck className="w-5 h-5" />}
                  {submitting ? 'Syncing...' : isEditing ? 'Update Protocol' : 'Deploy Sub-Admin'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

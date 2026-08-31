"use client";

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { usePermissions } from '@/hooks/usePermissions';

export default function EditUser({ params }) {
  const router = useRouter();
  const { id } = use(params);
  const { hasPermission, isLoading } = usePermissions();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user',
    isBlocked: false,
  });

  useEffect(() => {
    if (!isLoading && !hasPermission('users', 'edit')) {
      router.replace('/admin/users');
    }
  }, [hasPermission, id, isLoading, router]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/users/${id}`);
        const data = await res.json();
        if (data.success) {
          setFormData({
            name: data.data.name,
            email: data.data.email,
            role: data.data.role,
            isBlocked: data.data.isBlocked,
          });
        } else {
          toast.error(data.error || 'Failed to load user');
          router.push('/admin/users');
        }
      } catch (err) {
        toast.error('Network Error');
      } finally {
        setFetching(false);
      }
    };
    fetchUser();
  }, [id, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('User Updated!');
        router.push('/admin/users');
      } else {
        toast.error(data.error || 'Update failed');
      }
    } catch (err) {
      toast.error('Submission error');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-white border border-slate-200 text-slate-800 placeholder-slate-400 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all shadow-sm";
  const labelClass = "block text-sm font-semibold text-slate-700 mb-1.5";
  const cardClass = "bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5";

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-4">
          <svg className="w-10 h-10 animate-spin text-violet-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" />
          </svg>
          <p className="text-slate-500 text-sm">Loading user...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <nav className="flex items-center gap-2 text-sm text-slate-400">
        <Link href="/admin/users" className="hover:text-violet-600 transition-colors font-medium">Users</Link>
        <span>/</span>
        <span className="text-slate-700 font-semibold truncate">Edit: {formData.name}</span>
      </nav>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className={cardClass}>
          <h2 className="text-slate-900 font-bold text-base pb-3 border-b border-slate-100">User Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Name</label>
              <input 
                type="text" 
                value={formData.name} 
                onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                className={inputClass} 
                required
              />
            </div>

            <div>
              <label className={labelClass}>Email Address</label>
              <input 
                type="email" 
                value={formData.email} 
                className={`${inputClass} bg-slate-50 text-slate-500 cursor-not-allowed`}
                disabled
              />
              <p className="text-[11px] text-slate-400 mt-1">Email cannot be changed.</p>
            </div>

            <div>
              <label className={labelClass}>User Role</label>
              <select 
                value={formData.role} 
                onChange={(e) => setFormData({ ...formData, role: e.target.value })} 
                className={`${inputClass} cursor-pointer`}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 mt-2">
              <input 
                type="checkbox" 
                id="isBlocked"
                checked={formData.isBlocked} 
                onChange={(e) => setFormData({ ...formData, isBlocked: e.target.checked })} 
                className="w-4 h-4 text-violet-600 rounded border-slate-300 focus:ring-violet-500 cursor-pointer"
              />
              <label htmlFor="isBlocked" className="text-sm font-medium text-slate-700 cursor-pointer select-none">
                Blocked (Restrict user access)
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pb-2">
          <Link href="/admin/users"
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-sm font-semibold transition-colors">
            Cancel
          </Link>
          <button type="submit" disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
            {loading && (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" />
              </svg>
            )}
            {loading ? 'Saving...' : 'Update User'}
          </button>
        </div>
      </form>
    </div>
  );
}

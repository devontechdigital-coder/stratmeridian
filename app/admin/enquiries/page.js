"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { ChevronLeft, ChevronRight, Loader2, MessageSquareText, RefreshCcw, Search } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';

const statusOptions = ['new', 'contacted', 'in_progress', 'closed'];
const sourceOptions = ['home', 'service'];

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString();
}

export default function AdminEnquiriesPage() {
  const { hasPermission, isLoading } = usePermissions();
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    source: '',
    dateFrom: '',
    dateTo: '',
    limit: '10',
  });
  const canEdit = hasPermission('enquiries', 'edit');

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set('page', String(pagination.page));
    params.set('limit', filters.limit);
    Object.entries(filters).forEach(([key, value]) => {
      if (key !== 'limit' && value) params.set(key, value);
    });
    return params.toString();
  }, [filters, pagination.page]);

  const fetchEnquiries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/enquiries?${queryString}`);
      const data = await res.json();
      if (data.success) {
        setEnquiries(data.data || []);
        setPagination((prev) => ({ ...prev, ...(data.pagination || {}) }));
      } else {
        toast.error(data.message || 'Failed to load enquiries');
      }
    } catch {
      toast.error('Failed to load enquiries');
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    if (!isLoading && hasPermission('enquiries', 'view')) {
      Promise.resolve().then(fetchEnquiries);
    }
  }, [fetchEnquiries, hasPermission, isLoading]);

  const setFilter = (field, value) => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const updateEnquiry = async (id, patch) => {
    try {
      const res = await fetch(`/api/admin/enquiries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (data.success) {
        setEnquiries((prev) => prev.map((item) => (item._id === id ? data.data : item)));
        toast.success('Enquiry updated');
      } else {
        toast.error(data.message || 'Update failed');
      }
    } catch {
      toast.error('Update failed');
    }
  };

  if (isLoading || loading) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-violet-600" /></div>;
  }

  if (!hasPermission('enquiries', 'view')) {
    return <div className="rounded-2xl bg-white p-10 text-center text-sm font-semibold text-slate-500">You do not have access to enquiries.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Enquiries</h1>
          <p className="text-sm text-slate-500">Review leads from homepage and service enquiry forms.</p>
        </div>
        <button type="button" onClick={fetchEnquiries} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
          <RefreshCcw className="h-4 w-4" /> Refresh
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <label className="relative xl:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={filters.search} onChange={(e) => setFilter('search', e.target.value)} placeholder="Search name, email, phone, service..." className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-violet-300" />
          </label>
          <select value={filters.status} onChange={(e) => setFilter('status', e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-violet-300">
            <option value="">All statuses</option>
            {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <select value={filters.source} onChange={(e) => setFilter('source', e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-violet-300">
            <option value="">All sources</option>
            {sourceOptions.map((source) => <option key={source} value={source}>{source}</option>)}
          </select>
          <input type="date" value={filters.dateFrom} onChange={(e) => setFilter('dateFrom', e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-violet-300" />
          <input type="date" value={filters.dateTo} onChange={(e) => setFilter('dateTo', e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-violet-300" />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Date</th>
                <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Customer</th>
                <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Source</th>
                <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Requirement</th>
                <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {enquiries.map((enquiry) => (
                <tr key={enquiry._id} className="align-top hover:bg-slate-50/60">
                  <td className="whitespace-nowrap px-5 py-4 text-xs font-semibold text-slate-500">{formatDate(enquiry.createdAt)}</td>
                  <td className="px-5 py-4">
                    <div className="text-sm font-semibold text-slate-900">{enquiry.fullName}</div>
                    <div className="text-xs text-slate-500">{enquiry.email}</div>
                    <div className="text-xs text-slate-500">{enquiry.phone}</div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase text-slate-600">{enquiry.source || 'home'}</span>
                    {(enquiry.serviceTitle || enquiry.service?.title) && <div className="mt-2 text-xs font-semibold text-slate-600">{enquiry.serviceTitle || enquiry.service?.title}</div>}
                  </td>
                  <td className="max-w-md px-5 py-4 text-sm text-slate-600">{enquiry.comment}</td>
                  <td className="px-5 py-4">
                    <select disabled={!canEdit} value={enquiry.status} onChange={(e) => updateEnquiry(enquiry._id, { status: e.target.value })} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold uppercase text-slate-700 disabled:bg-slate-50">
                      {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </td>
                  <td className="min-w-64 px-5 py-4">
                    <textarea
                      disabled={!canEdit}
                      defaultValue={enquiry.notes || ''}
                      onBlur={(e) => {
                        if ((enquiry.notes || '') !== e.target.value.trim()) updateEnquiry(enquiry._id, { notes: e.target.value });
                      }}
                      placeholder="Internal notes"
                      className="min-h-20 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none disabled:bg-slate-50"
                    />
                  </td>
                </tr>
              ))}
              {enquiries.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-5 py-14 text-center">
                    <MessageSquareText className="mx-auto mb-3 h-10 w-10 text-slate-200" />
                    <p className="text-sm font-semibold text-slate-400">No enquiries found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs font-semibold text-slate-500">
            Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </div>
          <div className="flex items-center gap-2">
            <select value={filters.limit} onChange={(e) => setFilter('limit', e.target.value)} className="rounded-lg border border-slate-200 px-2 py-2 text-xs font-bold text-slate-700">
              {['10', '25', '50'].map((limit) => <option key={limit} value={limit}>{limit} / page</option>)}
            </select>
            <button type="button" disabled={pagination.page <= 1} onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))} className="rounded-lg border border-slate-200 p-2 text-slate-600 disabled:opacity-40">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button type="button" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))} className="rounded-lg border border-slate-200 p-2 text-slate-600 disabled:opacity-40">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

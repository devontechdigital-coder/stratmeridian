"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import {
  Edit3,
  Eye,
  FileText,
  Loader2,
  PackageCheck,
  Plus,
  RefreshCcw,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';

const statusOptions = ['new', 'pending', 'processing', 'completed', 'cancelled'];

function money(amount, currency = 'usd') {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'usd' }).format(Number(amount || 0));
}

function normalizeStatus(status) {
  return status === 'submitted' ? 'new' : (status || 'new');
}

function statusClass(status) {
  const classes = {
    new: 'bg-sky-50 text-sky-700 ring-sky-100',
    pending: 'bg-amber-50 text-amber-700 ring-amber-100',
    processing: 'bg-blue-50 text-blue-700 ring-blue-100',
    completed: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    cancelled: 'bg-rose-50 text-rose-700 ring-rose-100',
  };
  return classes[normalizeStatus(status)] || classes.new;
}

function paymentClass(status) {
  const classes = {
    paid: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    pending: 'bg-amber-50 text-amber-700 ring-amber-100',
    failed: 'bg-rose-50 text-rose-700 ring-rose-100',
    not_required: 'bg-slate-50 text-slate-600 ring-slate-100',
  };
  return classes[status] || classes.not_required;
}

function blankDocumentRow() {
  return { id: `${Date.now()}-${Math.random()}`, name: '', file: null };
}

function documentTitle(doc) {
  return doc.displayName || String(doc.name || '').split('/').pop() || 'Document';
}

function isAdminDocument(doc) {
  return doc.source === 'admin' || String(doc.publicId || doc.name || '').includes('/admin-documents/');
}

export default function AdminOrdersPage() {
  const { hasPermission, isLoading } = usePermissions();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingOrder, setEditingOrder] = useState(null);
  const [editForm, setEditForm] = useState({ status: 'new', adminComment: '', documents: [blankDocumentRow()] });
  const [saving, setSaving] = useState(false);
  const canEdit = hasPermission('orders', 'edit');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/orders');
      const data = await res.json();
      if (data.success) setOrders(data.data || []);
      else toast.error(data.message || 'Failed to load orders');
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && hasPermission('orders', 'view')) {
      Promise.resolve().then(fetchOrders);
    }
  }, [fetchOrders, hasPermission, isLoading]);

  const openEdit = (order) => {
    setEditingOrder(order);
    setEditForm({
      status: normalizeStatus(order.status),
      adminComment: order.adminComment || '',
      documents: [blankDocumentRow()],
    });
  };

  const closeEdit = () => {
    if (saving) return;
    setEditingOrder(null);
  };

  const updateDocumentRow = (id, patch) => {
    setEditForm((prev) => ({
      ...prev,
      documents: prev.documents.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    }));
  };

  const addDocumentRow = () => {
    setEditForm((prev) => ({ ...prev, documents: [...prev.documents, blankDocumentRow()] }));
  };

  const removeDocumentRow = (id) => {
    setEditForm((prev) => ({
      ...prev,
      documents: prev.documents.length === 1
        ? [blankDocumentRow()]
        : prev.documents.filter((row) => row.id !== id),
    }));
  };

  const saveOrder = async () => {
    if (!editingOrder) return;

    const rowsWithFiles = editForm.documents.filter((row) => row.file);
    const missingName = rowsWithFiles.some((row) => !row.name.trim());
    if (missingName) {
      toast.error('Document name is required for every admin upload');
      return;
    }

    setSaving(true);
    try {
      const body = new FormData();
      body.append('status', editForm.status);
      body.append('adminComment', editForm.adminComment);
      rowsWithFiles.forEach((row) => {
        body.append('documentNames', row.name.trim());
        body.append('documents', row.file);
      });

      const res = await fetch(`/api/admin/orders/${editingOrder._id}`, {
        method: 'PUT',
        body,
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) => prev.map((order) => (order._id === editingOrder._id ? data.data : order)));
        setEditingOrder(null);
        setEditForm({
          status: normalizeStatus(data.data.status),
          adminComment: data.data.adminComment || '',
          documents: [blankDocumentRow()],
        });
        toast.success('Order updated');
      } else {
        toast.error(data.message || 'Update failed');
      }
    } catch {
      toast.error('Update failed');
    } finally {
      setSaving(false);
    }
  };

  const modalDocuments = useMemo(() => {
    const docs = editingOrder?.documents || [];
    return {
      user: docs.filter((doc) => !isAdminDocument(doc)),
      admin: docs.filter(isAdminDocument),
    };
  }, [editingOrder]);

  if (isLoading || loading) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-violet-600" /></div>;
  }

  if (!hasPermission('orders', 'view')) {
    return <div className="rounded-2xl bg-white p-10 text-center text-sm font-semibold text-slate-500">You do not have access to orders.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
          <p className="text-sm text-slate-500">Review service submissions, documents, and order progress.</p>
        </div>
        <button type="button" onClick={fetchOrders} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
          <RefreshCcw className="h-4 w-4" /> Refresh
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Order</th>
                <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Customer</th>
                <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Service</th>
                <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Amount</th>
                <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Payment</th>
                <th className="px-5 py-3 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((order) => (
                <tr key={order._id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-4">
                    <div className="font-mono text-xs font-bold text-slate-900">#{order._id.slice(-8).toUpperCase()}</div>
                    <div className="text-xs text-slate-400">{new Date(order.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-sm font-semibold text-slate-900">{order.fullName || order.user?.name}</div>
                    <div className="text-xs text-slate-500">{order.email || order.user?.email}</div>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">{order.service?.title || 'Service'}</td>
                  <td className="px-5 py-4 text-sm font-bold text-slate-900">{money(order.amount, order.currency)}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black uppercase ring-1 ${statusClass(order.status)}`}>
                      {normalizeStatus(order.status)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black uppercase ring-1 ${paymentClass(order.paymentStatus)}`}>
                      {order.paymentStatus || 'not_required'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      {canEdit && (
                        <button type="button" onClick={() => openEdit(order)} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-700">
                          <Edit3 className="h-3.5 w-3.5" /> Edit
                        </button>
                      )}
                      <Link href={`/admin/orders/${order._id}`} className="inline-flex items-center gap-2 rounded-lg bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700 hover:bg-violet-100">
                        <Eye className="h-3.5 w-3.5" /> View
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-5 py-14 text-center">
                    <PackageCheck className="mx-auto mb-3 h-10 w-10 text-slate-200" />
                    <p className="text-sm font-semibold text-slate-400">No orders yet.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/50 px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-2xl font-black text-slate-950">Update Order</h2>
                <p className="mt-2 text-sm text-slate-500">
                  {editingOrder.service?.title || 'Service'} / {editingOrder.fullName || editingOrder.user?.name || 'Customer'} / {editingOrder.phone || editingOrder.email}
                </p>
              </div>
              <button type="button" onClick={closeEdit} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close update order">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6 bg-slate-50 px-6 py-6">
              <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
                <label className="block">
                  <span className="text-sm font-black text-slate-900">Status</span>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value }))}
                    className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 shadow-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  >
                    {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-black text-slate-900">Comment</span>
                  <input
                    value={editForm.adminComment}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, adminComment: e.target.value }))}
                    className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 shadow-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    placeholder="Add a note for this order"
                  />
                </label>
              </div>

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-700">
                    <Upload className="h-4 w-4" /> Admin Documents
                  </h3>
                  <button type="button" onClick={addDocumentRow} className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-black text-blue-700 hover:bg-blue-100">
                    <Plus className="h-4 w-4" /> Add
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {editForm.documents.map((row) => (
                    <div key={row.id} className="grid gap-3 md:grid-cols-[1fr_1.2fr_auto]">
                      <input
                        value={row.name}
                        onChange={(e) => updateDocumentRow(row.id, { name: e.target.value })}
                        className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                        placeholder="Document name"
                      />
                      <input
                        type="file"
                        onChange={(e) => updateDocumentRow(row.id, { file: e.target.files?.[0] || null })}
                        className="h-12 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-bold file:text-slate-700"
                      />
                      <button type="button" onClick={() => removeDocumentRow(row.id)} className="inline-flex h-12 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-3 text-rose-600 hover:bg-rose-100" aria-label="Remove document row">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              <div className="grid gap-5 lg:grid-cols-2">
                <DocumentList title="User Documents" source="user" documents={modalDocuments.user} />
                <DocumentList title="Admin Documents" source="admin" documents={modalDocuments.admin} />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 bg-white px-6 py-5">
              <button type="button" onClick={closeEdit} disabled={saving} className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-60">
                Cancel
              </button>
              <button type="button" onClick={saveOrder} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-60">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DocumentList({ title, source, documents }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-black uppercase tracking-widest text-slate-700">{title}</h3>
      <div className="mt-4 space-y-3">
        {documents.map((doc) => (
          <div key={doc.publicId || doc.url} className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="flex items-center gap-2 truncate text-sm font-bold text-slate-900">
                <FileText className="h-4 w-4 shrink-0 text-slate-400" /> {documentTitle(doc)}
              </p>
              <p className="mt-1 text-xs text-slate-500">{doc.contentType || 'Document'} / {Math.round((doc.size || 0) / 1024)} KB</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${source === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                {source}
              </span>
              {doc.url && (
                <a href={doc.url} target="_blank" rel="noreferrer" className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-black text-blue-700 hover:bg-blue-50">
                  View
                </a>
              )}
            </div>
          </div>
        ))}
        {documents.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm font-semibold text-slate-400">No documents uploaded.</p>
        )}
      </div>
    </section>
  );
}

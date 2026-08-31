"use client";

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Copy } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';

export default function ServicesList() {
  const router = useRouter();
  const { hasPermission, isLoading } = usePermissions();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchServices = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/services');
      const data = await res.json();
      if (data.success) setServices(data.data);
    } catch (error) {
      toast.error('Failed to fetch services');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && !hasPermission('services', 'view')) {
      router.replace('/admin');
    }
  }, [hasPermission, isLoading, router]);

  useEffect(() => {
    Promise.resolve().then(fetchServices);
  }, [fetchServices]);

  const deleteService = async (id) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    try {
      const res = await fetch(`/api/admin/services/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Service deleted');
        setServices(services.filter((service) => service._id !== id));
      } else {
        toast.error(data.message || 'Failed to delete service');
      }
    } catch (error) {
      toast.error('Failed to delete service');
    }
  };

  const copyServiceUrl = async (slug) => {
    try {
      const url = `${window.location.origin}/service/${slug}`;
      await navigator.clipboard.writeText(url);
      toast.success('Service URL copied');
    } catch (error) {
      toast.error('Failed to copy URL');
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading services...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Services</h1>
        {hasPermission('services', 'edit') && (
          <Link href="/admin/services/add" className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors shadow-sm flex items-center gap-2">
            <span className="text-lg leading-none">+</span>
            Add New Service
          </Link>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Slug</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Background</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {services.map((service) => (
                <tr key={service._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4"><p className="font-semibold text-slate-700">{service.title}</p></td>
                  <td className="px-6 py-4 text-slate-500 font-mono text-sm">/{service.slug}</td>
                  <td className="px-6 py-4 text-slate-700 font-semibold">{Number(service.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="px-6 py-4">
                    {service.backgroundImageUrl ? (
                      <a href={service.backgroundImageUrl} target="_blank" className="text-xs font-semibold text-violet-600 hover:text-violet-800">
                        View image
                      </a>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-sm">{service.category?.title || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${service.status === 'active' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                      {service.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/service/${service.slug}`} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-blue-100 text-blue-600 rounded transition-colors" title="View">View</Link>
                      <button onClick={() => copyServiceUrl(service.slug)} className="p-1.5 hover:bg-slate-100 text-slate-600 rounded transition-colors" title="Copy public URL" type="button" aria-label={`Copy URL for ${service.title}`}>
                        <Copy className="h-4 w-4" />
                      </button>
                      {hasPermission('services', 'edit') && (
                        <>
                        <Link href={`/admin/services/edit/${service._id}`} className="p-1.5 hover:bg-violet-100 text-violet-600 rounded transition-colors" title="Edit">Edit</Link>
                        <button onClick={() => deleteService(service._id)} className="p-1.5 hover:bg-red-100 text-red-600 rounded transition-colors" title="Delete" type="button">Delete</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {services.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-400 italic">No services found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

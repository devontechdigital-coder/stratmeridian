"use client";

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';

export default function PagesList() {
  const router = useRouter();
  const { hasPermission, isLoading } = usePermissions();
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPages = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/pages');
      const data = await res.json();
      if (data.success) {
        setPages(data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch pages');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && !hasPermission('pages', 'view')) {
      router.replace('/admin');
    }
  }, [hasPermission, isLoading, router]);

  useEffect(() => {
    Promise.resolve().then(fetchPages);
  }, [fetchPages]);

  const deletePage = async (id) => {
    if (!confirm('Are you sure you want to delete this page?')) return;
    try {
      const res = await fetch(`/api/admin/pages/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Page deleted');
        setPages(pages.filter(p => p._id !== id));
      }
    } catch (error) {
      toast.error('Failed to delete page');
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading pages...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Dynamic Pages</h1>
        {hasPermission('pages', 'edit') && (
          <Link
            href="/admin/pages/add"
            className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors shadow-sm flex items-center gap-2"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add New Page
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
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pages.map((page) => (
                <tr key={page._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-700">{page.title}</p>
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-mono text-sm">
                    /{page.slug}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      page.status === 'active' 
                        ? "bg-green-100 text-green-700 border-green-200" 
                        : "bg-amber-100 text-amber-700 border-amber-200"
                    }`}>
                      {page.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <Link
                        href={`/${page.slug}`}
                        target="_blank"
                        className="p-1.5 hover:bg-blue-100 text-blue-600 rounded transition-colors"
                        title="View"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                        </svg>
                      </Link>
                      {hasPermission('pages', 'edit') && (
                        <>
                          <Link
                            href={`/admin/pages/edit/${page._id}`}
                            className="p-1.5 hover:bg-violet-100 text-violet-600 rounded transition-colors"
                            title="Edit"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </Link>
                          <button
                            onClick={() => deletePage(page._id)}
                            className="p-1.5 hover:bg-red-100 text-red-600 rounded transition-colors"
                            title="Delete"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                              <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {pages.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-slate-400 italic">
                    No pages found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
import { Layout, Code, Eye, Settings, Globe, FileText, ChevronLeft, Save, ShieldAlert, Cpu } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { toSeoSlug } from '@/utils/seoSlug';

// Dynamically import Quill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill-new'), {
  ssr: false,
  loading: () => <div className="h-[400px] bg-slate-50 animate-pulse rounded-xl" />
});

const PageForm = ({ initialData, isEditing = false }) => {
  const router = useRouter();
  const { hasPermission, isLoading } = usePermissions();
  const [activeTab, setActiveTab] = useState('editor'); // 'editor' or 'assets'
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    slug: initialData?.slug || '',
    htmlContent: initialData?.htmlContent || '',
    rawHtml: initialData?.rawHtml || initialData?.htmlContent || '',
    editorPreference: initialData?.editorPreference || (isEditing ? 'raw' : 'rich'),
    metaTitle: initialData?.metaTitle || '',
    metaDescription: initialData?.metaDescription || '',
    metaKeywords: initialData?.metaKeywords || '',
    customCss: initialData?.customCss || '',
    customJs: initialData?.customJs || '',
    status: initialData?.status || 'active',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && !hasPermission('pages', 'edit')) {
      router.replace('/admin/pages');
    }
  }, [hasPermission, isLoading, router]);

  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      ['link', 'image'],
      ['clean']
    ],
  }), []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = isEditing ? `/api/admin/pages/${initialData._id}` : '/api/admin/pages';
      const method = isEditing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Page ${isEditing ? 'updated' : 'created'} successfully`);
        router.push('/admin/pages');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Failed to save page');
    } finally {
      setLoading(false);
    }
  };

  const updateTitle = (title) => {
    setFormData({ ...formData, title, slug: toSeoSlug(title) });
  };

  const updateSlug = (slug) => {
    setFormData({ ...formData, slug: toSeoSlug(slug) });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-6xl mx-auto pb-20">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-30 bg-slate-50/90 backdrop-blur-md py-4 -mx-4 px-4 border-b border-slate-200">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 hover:bg-white rounded-lg border border-slate-200 shadow-sm transition-all text-slate-500"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800">{isEditing ? 'Edit Page' : 'Create New Page'}</h1>
            <p className="text-[10px] font-bold text-violet-600 uppercase tracking-widest mt-0.5 flex items-center gap-1">
              <Cpu className="w-3 h-3" />
              {formData.editorPreference === 'rich' ? 'Visual Builder Enabled' : 'Code Only Mode'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-6">

          {/* Editor Tabs & Choice */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-6">
                <button
                  type="button"
                  onClick={() => setActiveTab('editor')}
                  className={`text-sm font-bold uppercase tracking-wider pb-1 border-b-2 transition-all ${activeTab === 'editor' ? 'border-violet-600 text-violet-600' : 'border-transparent text-slate-400'}`}
                >
                  Page Content
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('assets')}
                  className={`text-sm font-bold uppercase tracking-wider pb-1 border-b-2 transition-all ${activeTab === 'assets' ? 'border-violet-600 text-violet-600' : 'border-transparent text-slate-400'}`}
                >
                  CSS & JS
                </button>
              </div>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, editorPreference: 'rich' })}
                  className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${formData.editorPreference === 'rich' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Visual
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, editorPreference: 'raw' })}
                  className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${formData.editorPreference === 'raw' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Raw HTML
                </button>
              </div>
            </div>

            <div className="p-6">
              {activeTab === 'editor' ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Page Title</label>
                      <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => updateTitle(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500 outline-none transition-all font-bold text-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">URL slug</label>
                      <input
                        type="text"
                        value={formData.slug}
                        onChange={(e) => updateSlug(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500 outline-none transition-all font-mono text-sm"
                      />
                    </div>
                  </div>

                  {formData.editorPreference === 'rich' ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-700">
                        <Eye className="w-4 h-4 shrink-0" />
                        <p className="text-xs font-semibold uppercase leading-tight tracking-wider">
                          Visual mode enabled. Note: Custom classes may be filtered out. Use Raw HTML for complex designs.
                        </p>
                      </div>
                      <div className="min-h-[450px] border border-slate-200 rounded-2xl overflow-hidden shadow-inner">
                        <ReactQuill
                          theme="snow"
                          value={formData.htmlContent}
                          onChange={(content) => setFormData({ ...formData, htmlContent: content })}
                          modules={modules}
                          className="h-[380px] bg-white border-none"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-700">
                        <Code className="w-4 h-4 shrink-0" />
                        <p className="text-xs font-semibold uppercase tracking-wider leading-tight">
                          Raw HTML Mode. No filters applied. Your custom classes and structure will be preserved EXACTLY as written.
                        </p>
                      </div>
                      <textarea
                        rows={22}
                        value={formData.rawHtml || ''}
                        onChange={(e) => setFormData({ ...formData, rawHtml: e.target.value })}
                        placeholder="<div class='custom-premium-box'>...</div>"
                        className="w-full px-6 py-6 bg-[#0E1117] text-[#C9D1D9] border border-slate-800 rounded-2xl outline-none font-mono text-sm leading-relaxed min-h-[450px] shadow-2xl"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Page Specific CSS</label>
                    <textarea
                      rows={12}
                      value={formData.customCss || ''}
                      onChange={(e) => setFormData({ ...formData, customCss: e.target.value })}
                      placeholder=".custom-style { ... }"
                      className="w-full px-6 py-6 bg-[#161B22] text-emerald-400 border border-slate-800 rounded-2xl outline-none font-mono text-sm shadow-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Page Specific JS</label>
                    <textarea
                      rows={12}
                      value={formData.customJs || ''}
                      onChange={(e) => setFormData({ ...formData, customJs: e.target.value })}
                      placeholder="function init() { ... }"
                      className="w-full px-6 py-6 bg-[#161B22] text-amber-400 border border-slate-800 rounded-2xl outline-none font-mono text-sm shadow-xl"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Info Area */}
        <div className="space-y-6">
          {/* Warning for switching */}
          {formData.editorPreference === 'rich' && (
            <div className="bg-amber-100/50 border border-amber-200 rounded-2xl p-4 flex gap-3 text-amber-800">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <p className="text-[10px] font-bold uppercase leading-relaxed tracking-wider">
                Avoid switching to Visual mode if you have complex custom HTML in the Code view to prevent loss of classes.
              </p>
            </div>
          )}

          {/* Status Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4 text-violet-500" /> Visibility
            </h3>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500 outline-none transition-all font-bold text-slate-700 text-xs uppercase"
            >
              <option value="active">🟢 Published Page</option>
              <option value="draft">🟡 Hidden Draft</option>
            </select>
          </div>

          {/* SEO Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-800 mb-2 flex items-center gap-2">
              <Settings className="w-4 h-4 text-violet-500" /> SEO Engine
            </h3>
            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Title Tag</label>
              <input
                type="text"
                value={formData.metaTitle || ''}
                onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Description</label>
              <textarea
                rows={4}
                value={formData.metaDescription || ''}
                onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] leading-relaxed"
              />
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Keywords</label>
              <input
                type="text"
                value={formData.metaKeywords || ''}
                onChange={(e) => setFormData({ ...formData, metaKeywords: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px]"
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

export default PageForm;

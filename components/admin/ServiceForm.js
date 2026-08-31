"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
import { ChevronLeft, Code, Cpu, Eye, Globe, Plus, Save, Settings, ShieldAlert, Trash2 } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { toSeoSlug } from '@/utils/seoSlug';

const ReactQuill = dynamic(() => import('react-quill-new'), {
  ssr: false,
  loading: () => <div className="h-[400px] bg-slate-50 animate-pulse rounded-xl" />
});

const emptyForm = {
  title: '',
  slug: '',
  price: '',
  backgroundImageUrl: '',
  uploadLabel: 'Upload documents',
  buttonLabel: 'Submit Order',
  shortParagraph: '',
  heroFeatures: [],
  category: '',
  htmlContent: '',
  rawHtml: '',
  editorPreference: 'rich',
  metaTitle: '',
  metaDescription: '',
  metaKeywords: '',
  customCss: '',
  customJs: '',
  status: 'active',
};

export default function ServiceForm({ initialData, isEditing = false }) {
  const router = useRouter();
  const { hasPermission, isLoading } = usePermissions();
  const [activeTab, setActiveTab] = useState('editor');
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    ...emptyForm,
    ...initialData,
    category: initialData?.category?._id || initialData?.category || '',
    price: initialData?.price ?? '',
    heroFeatures: Array.isArray(initialData?.heroFeatures) ? initialData.heroFeatures : [],
    rawHtml: initialData?.rawHtml || initialData?.htmlContent || '',
    editorPreference: initialData?.editorPreference || (isEditing ? 'raw' : 'rich'),
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && !hasPermission('services', 'edit')) {
      router.replace('/admin/services');
    }
  }, [hasPermission, isLoading, router]);

  useEffect(() => {
    fetch('/api/admin/categories')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setCategories(data.data);
      })
      .catch(() => {});
  }, []);

  const modules = useMemo(() => ({
    toolbar: [
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ color: [] }, { background: [] }],
      ['link', 'image'],
      ['clean']
    ],
  }), []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = isEditing ? `/api/admin/services/${initialData._id}` : '/api/admin/services';
      const method = isEditing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Service ${isEditing ? 'updated' : 'created'} successfully`);
        router.push('/admin/services');
      } else {
        toast.error(data.message || data.error || 'Failed to save service');
      }
    } catch (error) {
      toast.error('Failed to save service');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500 outline-none transition-all font-bold text-slate-700";
  const labelClass = "block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1";
  const updateTitle = (title) => {
    setFormData({ ...formData, title, slug: toSeoSlug(title) });
  };
  const updateSlug = (slug) => {
    setFormData({ ...formData, slug: toSeoSlug(slug) });
  };
  const addHeroFeature = () => {
    setFormData({
      ...formData,
      heroFeatures: [
        ...(formData.heroFeatures || []),
        { icon: 'bi-shield-check', title: '', description: '' },
      ],
    });
  };
  const updateHeroFeature = (index, patch) => {
    setFormData({
      ...formData,
      heroFeatures: (formData.heroFeatures || []).map((feature, featureIndex) => (
        featureIndex === index ? { ...feature, ...patch } : feature
      )),
    });
  };
  const removeHeroFeature = (index) => {
    setFormData({
      ...formData,
      heroFeatures: (formData.heroFeatures || []).filter((_, featureIndex) => featureIndex !== index),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-6xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-30 bg-slate-50/90 backdrop-blur-md py-4 -mx-4 px-4 border-b border-slate-200">
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => router.back()} className="p-2 hover:bg-white rounded-lg border border-slate-200 shadow-sm transition-all text-slate-500">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800">{isEditing ? 'Edit Service' : 'Create New Service'}</h1>
            <p className="text-[10px] font-bold text-violet-600 uppercase tracking-widest mt-0.5 flex items-center gap-1">
              <Cpu className="w-3 h-3" />
              {formData.editorPreference === 'rich' ? 'Visual Builder Enabled' : 'Code Only Mode'}
            </p>
          </div>
        </div>
        <button type="submit" disabled={loading} className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
          <Save className="w-4 h-4" />
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-6">
                <button type="button" onClick={() => setActiveTab('editor')} className={`text-sm font-bold uppercase tracking-wider pb-1 border-b-2 transition-all ${activeTab === 'editor' ? 'border-violet-600 text-violet-600' : 'border-transparent text-slate-400'}`}>Service Content</button>
                <button type="button" onClick={() => setActiveTab('assets')} className={`text-sm font-bold uppercase tracking-wider pb-1 border-b-2 transition-all ${activeTab === 'assets' ? 'border-violet-600 text-violet-600' : 'border-transparent text-slate-400'}`}>CSS & JS</button>
              </div>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button type="button" onClick={() => setFormData({ ...formData, editorPreference: 'rich' })} className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${formData.editorPreference === 'rich' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Visual</button>
                <button type="button" onClick={() => setFormData({ ...formData, editorPreference: 'raw' })} className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${formData.editorPreference === 'raw' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Raw HTML</button>
              </div>
            </div>

            <div className="p-6">
              {activeTab === 'editor' ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={labelClass}>Service Title</label>
                      <input type="text" required value={formData.title} onChange={(e) => updateTitle(e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>URL Slug</label>
                      <input type="text" value={formData.slug} onChange={(e) => updateSlug(e.target.value)} className={`${inputClass} font-mono text-sm`} />
                    </div>
                    <div>
                      <label className={labelClass}>Price</label>
                      <input type="number" min="0" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Category</label>
                      <select value={formData.category || ''} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className={inputClass}>
                        <option value="">No category</option>
                        {categories.map((category) => (
                          <option key={category._id} value={category._id}>{category.title}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Background Image URL</label>
                      <input
                        type="url"
                        value={formData.backgroundImageUrl || ''}
                        onChange={(e) => setFormData({ ...formData, backgroundImageUrl: e.target.value })}
                        placeholder="https://example.com/service-bg.jpg"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Upload Label</label>
                      <input
                        type="text"
                        value={formData.uploadLabel || ''}
                        onChange={(e) => setFormData({ ...formData, uploadLabel: e.target.value })}
                        placeholder="Upload your tax documents"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Button Label</label>
                      <input
                        type="text"
                        value={formData.buttonLabel || ''}
                        onChange={(e) => setFormData({ ...formData, buttonLabel: e.target.value })}
                        placeholder="Submit Order"
                        className={inputClass}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelClass}>Short Paragraph</label>
                      <textarea
                        rows={3}
                        value={formData.shortParagraph || ''}
                        onChange={(e) => setFormData({ ...formData, shortParagraph: e.target.value })}
                        placeholder="Add a short note shown above the public order form."
                        className={`${inputClass} min-h-[96px] resize-y leading-relaxed`}
                      />
                    </div>
                    <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">Hero Right Features</h3>
                          <p className="mt-1 text-xs font-semibold text-slate-400">These cards appear in the public service hero right section.</p>
                        </div>
                        <button type="button" onClick={addHeroFeature} className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-sm hover:bg-violet-700">
                          <Plus className="h-4 w-4" /> Add Feature
                        </button>
                      </div>
                      <div className="space-y-3">
                        {(formData.heroFeatures || []).map((feature, index) => (
                          <div key={index} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-[160px_1fr_auto]">
                            <div>
                              <label className={labelClass}>Icon</label>
                              <select
                                value={feature.icon || 'bi-shield-check'}
                                onChange={(e) => updateHeroFeature(index, { icon: e.target.value })}
                                className={inputClass}
                              >
                                <option value="bi-shield-check">Shield</option>
                                <option value="bi-file-earmark-check">Document</option>
                                <option value="bi-lightning-charge">Fast</option>
                                <option value="bi-calculator">Calculator</option>
                                <option value="bi-person-check">Expert</option>
                                <option value="bi-patch-check">Verified</option>
                              </select>
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                              <div>
                                <label className={labelClass}>Title</label>
                                <input
                                  type="text"
                                  value={feature.title || ''}
                                  onChange={(e) => updateHeroFeature(index, { title: e.target.value })}
                                  className={inputClass}
                                  placeholder="Expert review"
                                />
                              </div>
                              <div>
                                <label className={labelClass}>Description</label>
                                <input
                                  type="text"
                                  value={feature.description || ''}
                                  onChange={(e) => updateHeroFeature(index, { description: e.target.value })}
                                  className={inputClass}
                                  placeholder="Reviewed before filing"
                                />
                              </div>
                            </div>
                            <button type="button" onClick={() => removeHeroFeature(index)} className="inline-flex h-12 items-center justify-center self-end rounded-xl border border-red-100 bg-red-50 px-4 text-red-600 hover:bg-red-100" aria-label="Remove feature">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        {(formData.heroFeatures || []).length === 0 && (
                          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm font-bold text-slate-400">
                            No custom hero features yet. Public page will use the default feature cards.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {formData.editorPreference === 'rich' ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-700">
                        <Eye className="w-4 h-4 shrink-0" />
                        <p className="text-xs font-semibold uppercase leading-tight tracking-wider">Visual mode enabled. Use Raw HTML for complex designs.</p>
                      </div>
                      <div className="min-h-[450px] border border-slate-200 rounded-2xl overflow-hidden shadow-inner">
                        <ReactQuill theme="snow" value={formData.htmlContent} onChange={(content) => setFormData({ ...formData, htmlContent: content })} modules={modules} className="h-[380px] bg-white border-none" />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-700">
                        <Code className="w-4 h-4 shrink-0" />
                        <p className="text-xs font-semibold uppercase tracking-wider leading-tight">Raw HTML mode preserves your custom classes and structure.</p>
                      </div>
                      <textarea rows={22} value={formData.rawHtml || ''} onChange={(e) => setFormData({ ...formData, rawHtml: e.target.value })} className="w-full px-6 py-6 bg-[#0E1117] text-[#C9D1D9] border border-slate-800 rounded-2xl outline-none font-mono text-sm leading-relaxed min-h-[450px] shadow-2xl" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  <textarea rows={12} value={formData.customCss || ''} onChange={(e) => setFormData({ ...formData, customCss: e.target.value })} placeholder=".custom-style { ... }" className="w-full px-6 py-6 bg-[#161B22] text-emerald-400 border border-slate-800 rounded-2xl outline-none font-mono text-sm shadow-xl" />
                  <textarea rows={12} value={formData.customJs || ''} onChange={(e) => setFormData({ ...formData, customJs: e.target.value })} placeholder="function init() { ... }" className="w-full px-6 py-6 bg-[#161B22] text-amber-400 border border-slate-800 rounded-2xl outline-none font-mono text-sm shadow-xl" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {formData.editorPreference === 'rich' && (
            <div className="bg-amber-100/50 border border-amber-200 rounded-2xl p-4 flex gap-3 text-amber-800">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <p className="text-[10px] font-bold uppercase leading-relaxed tracking-wider">Avoid switching to Visual mode if you have complex custom HTML in Code view.</p>
            </div>
          )}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2"><Globe className="w-4 h-4 text-violet-500" /> Visibility</h3>
            <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500 outline-none transition-all font-bold text-slate-700 text-xs uppercase">
              <option value="active">Published Service</option>
              <option value="draft">Hidden Draft</option>
            </select>
          </div>
          <SeoCard formData={formData} setFormData={setFormData} />
        </div>
      </div>
    </form>
  );
}

function SeoCard({ formData, setFormData }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
      <h3 className="text-sm font-black text-slate-800 mb-2 flex items-center gap-2"><Settings className="w-4 h-4 text-violet-500" /> SEO Engine</h3>
      <input type="text" value={formData.metaTitle || ''} onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })} placeholder="Title tag" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold" />
      <textarea rows={4} value={formData.metaDescription || ''} onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })} placeholder="Description" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] leading-relaxed" />
      <input type="text" value={formData.metaKeywords || ''} onChange={(e) => setFormData({ ...formData, metaKeywords: e.target.value })} placeholder="Keywords" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px]" />
    </div>
  );
}

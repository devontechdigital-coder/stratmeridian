"use client";

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Save, Globe, Info, ShieldCheck, Mail, Phone, MapPin, Code, Image as ImageIcon, Trash2, CreditCard } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { formatPhoneInput, getPhoneCountries, normalizePhoneCountry, validateAndFormatPhone } from '@/utils/phone';

const phoneCountries = getPhoneCountries();
const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

function getAddressComponent(components = [], type) {
  return components.find((component) => component.types?.includes(type))?.long_name || '';
}

function extractAddressParts(place) {
  const components = place?.address_components || [];
  return {
    city: getAddressComponent(components, 'locality')
      || getAddressComponent(components, 'postal_town')
      || getAddressComponent(components, 'administrative_area_level_2'),
    state: getAddressComponent(components, 'administrative_area_level_1'),
    country: getAddressComponent(components, 'country'),
  };
}

function loadGoogleMapsScript() {
  if (!googleMapsApiKey) return Promise.resolve(null);
  if (window.google?.maps?.places) return Promise.resolve(window.google);
  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector('script[data-google-maps-places="true"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.google));
      existingScript.addEventListener('error', reject);
      return;
    }
    const callbackName = 'initAdminThemeGooglePlaces';
    window[callbackName] = () => resolve(window.google);
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    script.dataset.googleMapsPlaces = 'true';
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

const ThemeSettingsForm = () => {
  const router = useRouter();
  const { hasPermission, isLoading } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [addressSearching, setAddressSearching] = useState(false);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [addressSearchEnabled, setAddressSearchEnabled] = useState(false);
  const [formData, setFormData] = useState({
    websiteName: '',
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    headCode: '',
    metaLogo: '',
    metaFavicon: '',
    footerCredit: '',
    phoneNumber: '',
    defaultPhoneCountry: 'US',
    emailId: '',
    address: '',
    city: '',
    state: '',
    country: '',
    smtpHost: '',
    smtpPort: 587,
    smtpSecure: false,
    smtpUser: '',
    smtpPassword: '',
    smtpFromEmail: '',
    smtpFromName: '',
    stripeEnabled: false,
    stripePublishableKey: '',
    stripeSecretKey: '',
    stripeCurrency: 'usd',
  });

  const canEdit = hasPermission('settings', 'edit');
  const canView = hasPermission('settings', 'view');

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings/theme');
      const data = await res.json();
      if (data.success) {
        setFormData({
          ...data.data,
          defaultPhoneCountry: normalizePhoneCountry(data.data?.defaultPhoneCountry),
        });
      }
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(fetchSettings);
  }, [fetchSettings]);

  useEffect(() => {
    const query = formData.address?.trim() || '';
    if (!addressSearchEnabled || query.length < 3) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      setAddressSearching(true);
      try {
        const google = await loadGoogleMapsScript();
        if (!google?.maps?.places || cancelled) return;
        const service = new google.maps.places.AutocompleteService();
        service.getPlacePredictions({ input: query }, (predictions) => {
          if (!cancelled) {
            setAddressSuggestions(predictions || []);
            setShowAddressSuggestions(true);
          }
        });
      } catch {
        if (!cancelled) setAddressSuggestions([]);
      } finally {
        if (!cancelled) setAddressSearching(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [addressSearchEnabled, formData.address]);

  useEffect(() => {
    if (!isLoading && !canView) {
      router.replace('/admin');
    }
  }, [canView, isLoading, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const selectAddressSuggestion = async (suggestion) => {
    const fallback = suggestion.description || '';
    const google = await loadGoogleMapsScript();

    if (!google?.maps?.Geocoder) {
      if (fallback) setFormData((prev) => ({ ...prev, address: fallback }));
      setAddressSearchEnabled(false);
      setAddressSuggestions([]);
      setShowAddressSuggestions(false);
      return;
    }

    new google.maps.Geocoder().geocode({ placeId: suggestion.place_id }, (results, status) => {
      if (status === 'OK' && results?.[0]) {
        const address = results[0].formatted_address || fallback;
        const addressParts = extractAddressParts(results[0]);
        setFormData((prev) => ({ ...prev, address, ...addressParts }));
      } else if (fallback) {
        setFormData((prev) => ({ ...prev, address: fallback }));
      }
      setAddressSearchEnabled(false);
      setAddressSuggestions([]);
      setShowAddressSuggestions(false);
    });
  };

  const handlePhoneChange = (e) => {
    setFormData(prev => ({
      ...prev,
      phoneNumber: formatPhoneInput(e.target.value, prev.defaultPhoneCountry),
    }));
  };

  const handlePhoneBlur = () => {
    if (!formData.phoneNumber) return;
    const phone = validateAndFormatPhone(formData.phoneNumber, formData.defaultPhoneCountry);
    if (!phone.valid) {
      toast.error('Please enter a valid phone number');
      return;
    }
    setFormData(prev => ({
      ...prev,
      phoneNumber: phone.formatted,
    }));
  };

  const handleImageUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: reader.result })
        });
        const data = await res.json();
        if (data.url) {
          setFormData(prev => ({ ...prev, [field]: data.url }));
          toast.success('Image uploaded successfully');
        } else {
          toast.error('Upload failed');
        }
      } catch (error) {
        toast.error('Error uploading image');
      }
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      defaultPhoneCountry: normalizePhoneCountry(formData.defaultPhoneCountry),
    };

    if (formData.phoneNumber) {
      const phone = validateAndFormatPhone(formData.phoneNumber, payload.defaultPhoneCountry);
      if (!phone.valid) {
        toast.error('Please enter a valid phone number');
        return;
      }
      payload.phoneNumber = phone.formatted;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/settings/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Settings updated successfully');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-30 bg-slate-50/90 backdrop-blur-md py-4 -mx-4 px-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Theme Settings</h1>
          <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Managed by Administrator
          </p>
        </div>
        <button
          type="submit"
          disabled={saving || !canEdit}
          className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="flex gap-2 p-1 bg-white border border-slate-200 rounded-2xl w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'general' ? 'bg-violet-600 text-white shadow-md shadow-violet-200' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          General & SEO
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('contact')}
          className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'contact' ? 'bg-violet-600 text-white shadow-md shadow-violet-200' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          Contact & Footer
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('email')}
          className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'email' ? 'bg-violet-600 text-white shadow-md shadow-violet-200' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          Email
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('payment')}
          className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'payment' ? 'bg-violet-600 text-white shadow-md shadow-violet-200' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          Payment
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('advanced')}
          className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'advanced' ? 'bg-violet-600 text-white shadow-md shadow-violet-200' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          Advanced
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-violet-500" />
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Website Information</h3>
                </div>
                <div className="p-6 space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Website Name</label>
                    <input
                      type="text"
                      name="websiteName"
                      value={formData.websiteName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500 outline-none transition-all font-bold text-slate-700"
                      placeholder="e.g. Your Website"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Meta Title</label>
                      <input
                        type="text"
                        name="metaTitle"
                        value={formData.metaTitle}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500 outline-none transition-all text-sm"
                        placeholder="Page title for search engines"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Meta Description</label>
                      <textarea
                        name="metaDescription"
                        value={formData.metaDescription}
                        onChange={handleChange}
                        rows={1}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500 outline-none transition-all text-sm"
                        placeholder="Brief description"
                      />
                    </div>

                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Meta Keywords</label>
                    <textarea
                      name="metaKeywords"
                      value={formData.metaKeywords}
                      onChange={handleChange}
                      rows={1}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500 outline-none transition-all text-sm"
                      placeholder="e.g. company, services, website"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Default Phone Country</label>
                    <select
                      name="defaultPhoneCountry"
                      value={formData.defaultPhoneCountry || 'US'}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500 outline-none transition-all text-sm font-bold text-slate-700"
                    >
                      {phoneCountries.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.code} (+{country.callingCode})
                        </option>
                      ))}
                    </select>
                  </div>

                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-violet-500" />
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Brand Assets</h3>
                </div>
                <div className="p-6 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Website Logo</label>
                      <div className="relative group">
                        <div className="w-full aspect-[3/1] bg-slate-100 rounded-2xl border border-dashed border-slate-300 flex items-center justify-center overflow-hidden transition-all group-hover:border-violet-400">
                          {formData.metaLogo ? (
                            <>
                              <img src={formData.metaLogo} alt="Logo Preview" className="h-full w-full object-contain p-4" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity gap-2">
                                <label className="p-2 bg-white rounded-lg cursor-pointer hover:bg-slate-50 shadow-sm">
                                  <ImageIcon className="w-4 h-4 text-slate-600" />
                                  <input type="file" className="hidden" onChange={(e) => handleImageUpload(e, 'metaLogo')} accept="image/*" />
                                </label>
                                <button type="button" onClick={() => setFormData({ ...formData, metaLogo: '' })} className="p-2 bg-white rounded-lg hover:text-red-600 shadow-sm">
                                  <Trash2 className="w-4 h-4 text-current" />
                                </button>
                              </div>
                            </>
                          ) : (
                            <label className="cursor-pointer flex flex-col items-center">
                              <ImageIcon className="w-8 h-8 text-slate-400 mb-2" />
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Upload Logo</span>
                              <input type="file" className="hidden" onChange={(e) => handleImageUpload(e, 'metaLogo')} accept="image/*" />
                            </label>
                          )}
                        </div>
                      </div>
                      <div className="pt-2">
                        <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Or Logo URL</label>
                        <input
                          type="text"
                          name="metaLogo"
                          value={formData.metaLogo}
                          onChange={handleChange}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500 outline-none transition-all text-xs font-medium"
                          placeholder="https://example.com/logo.png"
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Favicon</label>
                      <div className="relative group">
                        <div className="w-24 h-24 mx-auto bg-slate-100 rounded-2xl border border-dashed border-slate-300 flex items-center justify-center overflow-hidden transition-all group-hover:border-violet-400">
                          {formData.metaFavicon ? (
                            <>
                              <img src={formData.metaFavicon} alt="Favicon Preview" className="w-12 h-12 object-contain" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity gap-2">
                                <label className="p-2 bg-white rounded-lg cursor-pointer hover:bg-slate-50 shadow-sm">
                                  <ImageIcon className="w-4 h-4 text-slate-600" />
                                  <input type="file" className="hidden" onChange={(e) => handleImageUpload(e, 'metaFavicon')} accept="image/*" />
                                </label>
                                <button type="button" onClick={() => setFormData({ ...formData, metaFavicon: '' })} className="p-2 bg-white rounded-lg hover:text-red-600 shadow-sm">
                                  <Trash2 className="w-4 h-4 text-current" />
                                </button>
                              </div>
                            </>
                          ) : (
                            <label className="cursor-pointer flex flex-col items-center">
                              <ImageIcon className="w-6 h-6 text-slate-400 mb-2" />
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Favicon<br />(1:1)</span>
                              <input type="file" className="hidden" onChange={(e) => handleImageUpload(e, 'metaFavicon')} accept="image/*" />
                            </label>
                          )}
                        </div>
                      </div>
                      <div className="pt-2">
                        <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1 text-center md:text-left">Or Favicon URL</label>
                        <input
                          type="text"
                          name="metaFavicon"
                          value={formData.metaFavicon}
                          onChange={handleChange}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500 outline-none transition-all text-xs font-medium"
                          placeholder="https://example.com/favicon.ico"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-violet-500" />
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Contact Details</h3>
                </div>
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          name="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={handlePhoneChange}
                          onBlur={handlePhoneBlur}
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500 outline-none transition-all font-semibold text-slate-700"
                          placeholder="+1 234 567 890"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="email"
                          name="emailId"
                          value={formData.emailId}
                          onChange={handleChange}
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500 outline-none transition-all font-semibold text-slate-700"
                          placeholder="hello@yourstore.com"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Business Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
                      <textarea
                        name="address"
                        value={formData.address || ''}
                        onChange={(e) => {
                          handleChange(e);
                          setAddressSearchEnabled(true);
                        }}
                        onFocus={() => {
                          setAddressSearchEnabled(true);
                          if (addressSuggestions.length > 0) setShowAddressSuggestions(true);
                        }}
                        rows={3}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500 outline-none transition-all font-semibold text-slate-700"
                        placeholder="Search business address..."
                      />
                      {showAddressSuggestions && (addressSearching || addressSuggestions.length > 0) && (
                        <div className="absolute z-40 left-0 right-0 top-full mt-2 overflow-hidden rounded-xl border border-violet-200 bg-white shadow-2xl">
                          {addressSearching && <div className="px-4 py-3 text-xs font-bold text-slate-400">Searching addresses...</div>}
                          {addressSuggestions.map((suggestion) => (
                            <button
                              type="button"
                              key={suggestion.place_id}
                              onClick={() => selectAddressSuggestion(suggestion)}
                              className="block w-full border-0 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-violet-50"
                            >
                              {suggestion.description}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">City</label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city || ''}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500 outline-none transition-all font-semibold text-slate-700"
                          placeholder="City"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">State</label>
                        <input
                          type="text"
                          name="state"
                          value={formData.state || ''}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500 outline-none transition-all font-semibold text-slate-700"
                          placeholder="State"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Country</label>
                        <input
                          type="text"
                          name="country"
                          value={formData.country || ''}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500 outline-none transition-all font-semibold text-slate-700"
                          placeholder="Country"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                  <Info className="w-4 h-4 text-violet-500" />
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Footer Settings</h3>
                </div>
                <div className="p-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Footer Copyright Credit</label>
                    <input
                      type="text"
                      name="footerCredit"
                      value={formData.footerCredit}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500 outline-none transition-all font-semibold text-slate-700"
                      placeholder="© 2024 Your Company. All rights reserved."
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'email' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-violet-500" />
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">SMTP Email Configuration</h3>
                </div>
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">SMTP Host</label>
                      <input
                        type="text"
                        name="smtpHost"
                        value={formData.smtpHost || ''}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500 outline-none transition-all font-semibold text-slate-700"
                        placeholder="smtp.gmail.com"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">SMTP Port</label>
                      <input
                        type="number"
                        name="smtpPort"
                        value={formData.smtpPort || 587}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500 outline-none transition-all font-semibold text-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">SMTP User</label>
                      <input
                        type="text"
                        name="smtpUser"
                        value={formData.smtpUser || ''}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500 outline-none transition-all font-semibold text-slate-700"
                        placeholder="email@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">SMTP Password</label>
                      <input
                        type="password"
                        name="smtpPassword"
                        value={formData.smtpPassword || ''}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500 outline-none transition-all font-semibold text-slate-700"
                        placeholder="App password or SMTP password"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">From Email</label>
                      <input
                        type="email"
                        name="smtpFromEmail"
                        value={formData.smtpFromEmail || ''}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500 outline-none transition-all font-semibold text-slate-700"
                        placeholder="no-reply@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">From Name</label>
                      <input
                        type="text"
                        name="smtpFromName"
                        value={formData.smtpFromName || ''}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500 outline-none transition-all font-semibold text-slate-700"
                        placeholder="Website Support"
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 border border-slate-200">
                    <input
                      type="checkbox"
                      name="smtpSecure"
                      checked={Boolean(formData.smtpSecure)}
                      onChange={(e) => setFormData(prev => ({ ...prev, smtpSecure: e.target.checked }))}
                      className="h-4 w-4"
                    />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-600">Use secure SSL/TLS connection</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'payment' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-violet-500" />
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Stripe Payment Gateway</h3>
                </div>
                <div className="p-6 space-y-6">
                  <label className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-5 py-4 border border-slate-200">
                    <span>
                      <span className="block text-xs font-black uppercase tracking-widest text-slate-700">Stripe Gateway</span>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Active sends paid service orders to Stripe Checkout.</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={Boolean(formData.stripeEnabled)}
                      onChange={(e) => setFormData(prev => ({ ...prev, stripeEnabled: e.target.checked }))}
                      className="h-5 w-5"
                    />
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Publishable Key</label>
                      <input
                        type="text"
                        name="stripePublishableKey"
                        value={formData.stripePublishableKey || ''}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500 outline-none transition-all font-semibold text-slate-700"
                        placeholder="pk_test_..."
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Secret Key</label>
                      <input
                        type="password"
                        name="stripeSecretKey"
                        value={formData.stripeSecretKey || ''}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500 outline-none transition-all font-semibold text-slate-700"
                        placeholder="sk_test_..."
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Currency</label>
                      <input
                        type="text"
                        name="stripeCurrency"
                        value={formData.stripeCurrency || 'usd'}
                        onChange={(e) => setFormData(prev => ({ ...prev, stripeCurrency: e.target.value.toLowerCase().slice(0, 3) }))}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500 outline-none transition-all font-semibold text-slate-700 uppercase"
                        placeholder="usd"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'advanced' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                  <Code className="w-4 h-4 text-violet-500" />
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Custom Header Code</h3>
                </div>
                <div className="p-6 space-y-3">
                  <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-700">
                    <Info className="w-4 h-4 shrink-0" />
                    <p className="text-[10px] font-bold uppercase leading-tight tracking-wider">
                      This code will be injected into the &lt;head&gt; of every page. Use it for Google Analytics, Meta pixels, or custom fonts.
                    </p>
                  </div>
                  <textarea
                    name="headCode"
                    value={formData.headCode}
                    onChange={handleChange}
                    rows={12}
                    className="w-full px-6 py-6 bg-[#0E1117] text-emerald-400 border border-slate-800 rounded-2xl outline-none font-mono text-xs leading-relaxed shadow-xl"
                    placeholder="<!-- Add your custom scripts here -->"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-violet-600 rounded-3xl p-6 text-white shadow-xl shadow-violet-200 relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
              <Info className="w-5 h-5" /> Need Help?
            </h3>
            <p className="text-white/80 text-xs font-medium leading-relaxed mb-4">
              Theme settings control the global appearance and metadata of your storefront. These changes will reflect across all pages instantly.
            </p>
            <div className="space-y-3">
              {[
                'Logos should be PNG/SVG',
                'Favicons are 32x32 recommended',
                'Changes are real-time'
              ].map((tip, i) => (
                <div key={i} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
                  <div className="w-1 h-1 rounded-full bg-white"></div>
                  {tip}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm lg:sticky lg:top-24">
            <h3 className="text-sm font-black text-slate-800 mb-4 uppercase tracking-wider">Live Preview</h3>
            <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-slate-100 px-3 py-2 flex items-center gap-1.5 border-b border-slate-200">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                  <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                  <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                </div>
                <div className="flex-1 bg-white rounded-md h-5 flex items-center px-2">
                  <Globe className="w-2.5 h-2.5 text-slate-300 mr-1" />
                  <span className="text-[8px] font-bold text-slate-400 truncate tracking-tight">
                    {formData.websiteName || 'yourstore.com'}
                  </span>
                </div>
              </div>
              <div className="p-4 bg-white min-h-[120px] flex flex-col items-center justify-center text-center space-y-3">
                {formData.metaLogo ? (
                  <img src={formData.metaLogo} alt="Preview" className="h-8 object-contain" />
                ) : (
                  <div className="h-8 w-16 bg-slate-50 rounded flex items-center justify-center border border-slate-100">
                    <ImageIcon className="w-4 h-4 text-slate-200" />
                  </div>
                )}
                <div>
                  <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{formData.metaTitle || 'Website Title'}</h4>
                  <p className="text-[9px] text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">{formData.metaDescription || 'No description set yet...'}</p>
                </div>
              </div>
              <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Footer</span>
                <span className="text-[7px] text-slate-400 truncate max-w-[120px]">{formData.footerCredit}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

export default ThemeSettingsForm;

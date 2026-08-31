"use client";

import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { formatPhoneInput, getPhoneCountries, normalizePhoneCountry } from '@/utils/phone';

const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const phoneCountries = getPhoneCountries();

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
    const callbackName = 'initServiceOrderGooglePlaces';
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

export default function UserProfileForm({ user }) {
  const [saving, setSaving] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [addressSearching, setAddressSearching] = useState(false);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [addressSearchEnabled, setAddressSearchEnabled] = useState(false);
  const [addressSelected, setAddressSelected] = useState(Boolean(user?.address));
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    phoneCountry: normalizePhoneCountry(user?.phoneCountry),
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    country: user?.country || '',
  });

  const setField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    const query = formData.address.trim();
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

  const selectSuggestion = async (suggestion) => {
    const fallback = suggestion.description || '';
    const google = await loadGoogleMapsScript();

    if (!google?.maps?.Geocoder) {
      if (fallback) setFormData((prev) => ({ ...prev, address: fallback }));
      setAddressSelected(Boolean(fallback));
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
        setAddressSelected(true);
      } else if (fallback) {
        setFormData((prev) => ({ ...prev, address: fallback }));
        setAddressSelected(true);
      }
      setAddressSearchEnabled(false);
      setAddressSuggestions([]);
      setShowAddressSuggestions(false);
    });
  };

  const setPhoneCountry = (country) => {
    const normalized = normalizePhoneCountry(country);
    setFormData((prev) => ({
      ...prev,
      phoneCountry: normalized,
      phone: prev.phone ? formatPhoneInput(prev.phone, normalized) : '',
    }));
  };

  const submitProfile = async (event) => {
    event.preventDefault();
    if (formData.address.trim() && !addressSelected) {
      toast.error('Please select a location from the address suggestions');
      return;
    }
    setSaving(true);

    try {
      const response = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (!data.success) {
        toast.error(data.message || 'Failed to update profile');
        return;
      }

      setFormData((prev) => ({
        ...prev,
        ...data.data,
        phoneCountry: normalizePhoneCountry(data.data?.phoneCountry),
      }));
      setAddressSelected(Boolean(data.data?.address));
      setAddressSearchEnabled(false);
      setAddressSuggestions([]);
      setShowAddressSuggestions(false);
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submitProfile} className="row g-3">
      <Field label="Name">
        <input className="form-control ud-input" value={formData.name} onChange={(e) => setField('name', e.target.value)} required />
      </Field>
      <Field label="Email Address">
        <input className="form-control ud-input" value={formData.email} readOnly />
      </Field>
      <Field label="Phone Country">
        <select className="form-select ud-input" value={formData.phoneCountry} onChange={(e) => setPhoneCountry(e.target.value)}>
          {phoneCountries.map((country) => (
            <option key={country.code} value={country.code}>{country.code} +{country.callingCode}</option>
          ))}
        </select>
      </Field>
      <Field label="Phone Number">
        <input className="form-control ud-input" value={formData.phone} placeholder="Phone number" onChange={(e) => setField('phone', formatPhoneInput(e.target.value, formData.phoneCountry))} />
      </Field>

         <div className="col-12">
        <label className="form-label text-secondary text-uppercase small fw-bold">Search Address</label>
        <div className="ud-address-wrap">
          <input
            className="form-control ud-input  " 
            value={formData.address}
            placeholder="Start typing your address"
            onChange={(e) => {
              setAddressSearchEnabled(true);
              setAddressSelected(false);
              setField('address', e.target.value);
              if (e.target.value.trim().length < 3) {
                setAddressSuggestions([]);
                setShowAddressSuggestions(false);
              } else {
                setShowAddressSuggestions(true);
              }
            }}
            onFocus={() => {
              if (addressSearchEnabled && addressSuggestions.length > 0) setShowAddressSuggestions(true);
            }}
            onBlur={() => setTimeout(() => setShowAddressSuggestions(false), 150)}
          />
          {showAddressSuggestions && (addressSearching || addressSuggestions.length > 0) && (
            <div className="ud-address-list">
              {addressSearching && <div className="ud-address-searching">Searching...</div>}
              {addressSuggestions.map((suggestion) => (
                <button
                  type="button"
                  key={suggestion.place_id}
                  className="ud-address-item"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectSuggestion(suggestion)}
                >
                  {suggestion.description}
                </button>
              ))}
            </div>
          )}
        </div>
        {addressSelected && formData.address && <p className="ud-address-selected">Selected location: {formData.address}</p>}
      </div>

      <Field label="Country">
        <input className="form-control ud-input" value={formData.country} placeholder="Country" onChange={(e) => setField('country', e.target.value)} />
      </Field>
      <Field label="State">
        <input className="form-control ud-input" value={formData.state} placeholder="State" onChange={(e) => setField('state', e.target.value)} />
      </Field>
      <Field label="City">
        <input className="form-control ud-input" value={formData.city} placeholder="City" onChange={(e) => setField('city', e.target.value)} />
      </Field>
   
      <div className="col-12">
        <button className="ud-main-btn border-0" type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }) {
  return (
    <div className="col-md-6">
      <label className="form-label text-secondary text-uppercase small fw-bold">{label}</label>
      {children}
    </div>
  );
}

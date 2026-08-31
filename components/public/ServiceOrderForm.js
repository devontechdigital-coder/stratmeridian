"use client";

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { formatPhoneInput, getPhoneCountries, normalizePhoneCountry, validateAndFormatPhone } from '@/utils/phone';
import { savePendingCheckoutDraft } from '@/lib/pendingCheckoutStore';

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
    script.async = true; script.defer = true;
    script.dataset.googleMapsPlaces = 'true';
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function formatFileSize(size = 0) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function splitFileName(name = '') {
  const dotIndex = name.lastIndexOf('.');
  if (dotIndex <= 0) return { base: name, ext: '' };
  return { base: name.slice(0, dotIndex), ext: name.slice(dotIndex) };
}

function cleanFileNamePart(value = '') {
  return value.trim().replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ');
}

function fileWithCustomName(file, customName) {
  const cleanName = cleanFileNamePart(customName);
  if (!cleanName || cleanName === file.name) return file;
  const { ext } = splitFileName(file.name);
  const finalName = cleanName.toLowerCase().endsWith(ext.toLowerCase()) ? cleanName : `${cleanName}${ext}`;
  return new File([file], finalName, { type: file.type, lastModified: file.lastModified });
}

const css = `
 
.f-root {
  --bg: #f7f6f3;
  --white: #ffffff;
  --border: #e4e2dc;
  --border-focus: #5a9e8f;
  --accent: #3d8b7a;
  --accent-light: #edf6f4;
  --accent-mid: rgba(61,139,122,0.12);
  --text: #1a1a1a;
  --text-mid: #5a5a5a;
  --text-muted: #9a9a9a;
  --danger: #d95b5b;
  --success: #3a9e6a;
  --success-bg: #edf8f3;
  --warn-bg: #fffbea;
  --warn: #c69a00;
  --radius: 10px;
  --radius-sm: 7px;
  --shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04);
   min-height: 100vh;
}
.f-wrap {   margin: 0 auto; }

.f-title { margin-bottom: 20px; }
.f-title h2 {
  font-family: 'Lora', serif;
  font-size: 22px; font-weight: 500;
  color: var(--text); margin: 0 0 4px;
  letter-spacing: -0.01em;
}
.f-title p { font-size: 13px; color: var(--text-muted); margin: 0; font-weight: 300; }

.f-steps {
  display: flex; align-items: center;
  margin-bottom: 20px;
}
.f-step {
  display: flex; align-items: center; gap: 6px;
  font-size: 11px; font-weight: 500;
  color: var(--text-muted); letter-spacing: 0.03em;
}
.f-step.active { color: var(--accent); }
.f-step.done { color: var(--success); }
.f-step-dot {
  width: 20px; height: 20px; border-radius: 50%;
  border: 1.5px solid var(--border);
  display: flex; align-items: center; justify-content: center;
  font-size: 9px; font-weight: 600;
  background: var(--white); color: var(--text-muted);
  flex-shrink: 0; transition: all 0.2s;
}
.f-step.active .f-step-dot { border-color: var(--accent); background: var(--accent); color: white; }
.f-step.done .f-step-dot { border-color: var(--success); background: var(--success-bg); color: var(--success); }
.f-step-line { flex: 1; height: 1px; background: var(--border); margin: 0 8px; }

.f-card {
  background: var(--white); border: 1px solid var(--border);
  border-radius: var(--radius); box-shadow: var(--shadow);
  padding: 18px; margin-bottom: 10px;
  animation: f-in 0.3s ease;
}
@keyframes f-in {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
.f-card-head {
  display: flex; align-items: center; gap: 9px;
  margin-bottom: 14px; padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}
.f-card-icon {
  width: 26px; height: 26px; border-radius: 7px;
  background: var(--accent-light);
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; flex-shrink: 0;
}
.f-card-label { font-size: 13px; font-weight: 600; color: var(--text); margin: 0; }

.f-field { display: flex; flex-direction: column; gap: 5px; margin-bottom: 10px; }
.f-field:last-child { margin-bottom: 0; }
.f-contact-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 12px;
}
.f-grid-full { grid-column: 1 / -1; }

.f-label {
  font-size: 11px; font-weight: 600; color: var(--text-mid);
  letter-spacing: 0.06em; text-transform: uppercase;
}

.f-input {
  background: #fafaf8; border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 9px 11px;
   font-size: 13px; font-weight: 400; color: var(--text);
  width: 100%; box-sizing: border-box;
  outline: none; transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
  -webkit-appearance: none;
}
.f-input::placeholder { color: var(--text-muted); }
.f-input:focus {
  border-color: var(--border-focus); background: black;
  box-shadow: 0 0 0 3px rgba(61,139,122,0.1);
}

.f-email-row { display: flex; gap: 6px; }
.f-email-row .f-input { flex: 1; min-width: 0; }

.f-verify-btn {
  padding: 9px 12px; border-radius: var(--radius-sm);
  border: 1px solid var(--accent); background: var(--accent-light); color: var(--accent);
   font-size: 11px; font-weight: 600; letter-spacing: 0.04em;
  cursor: pointer; white-space: nowrap; transition: all 0.18s; flex-shrink: 0;
}
.f-verify-btn:hover:not(:disabled) { background: var(--accent); color: white; }
.f-verify-btn.verified { border-color: var(--success); background: var(--success-bg); color: var(--success); cursor: default; }
.f-verify-btn:disabled { opacity: 0.45; cursor: not-allowed; }

.f-pill {
  display: flex; align-items: center; gap: 4px;
  padding: 3px 8px; border-radius: 20px;
  font-size: 10px; font-weight: 600; letter-spacing: 0.04em;
  margin-top: 4px; width: 100%;
  justify-content: center;
}
.f-pill.sent {  color: var(--warn); }
.f-pill.ok   { background: var(--success-bg); color: var(--success); border: 1px solid rgba(58,158,106,0.2); }

.f-otp-wrap { display: flex; gap: 6px; margin-top: 0; width: 100%; animation: f-in 0.2s ease; }
.f-otp-input {
  flex: 1; background: black; border: 1px solid var(--border);
  border-radius: var(--radius-sm); padding: 9px 11px;
   font-size: 15px; font-weight: 600; letter-spacing: 0.22em;
  text-align: center; color: var(--text); outline: none;
  transition: border-color 0.18s, box-shadow 0.18s;
}
.f-otp-input:focus { border-color: var(--border-focus); box-shadow: 0 0 0 3px rgba(61,139,122,0.1); }
.f-otp-btn {
  padding: 9px 14px; border-radius: var(--radius-sm);
  background: var(--accent); color: white; border: none;
   font-size: 12px; font-weight: 600; cursor: pointer;
  white-space: nowrap; transition: opacity 0.18s, transform 0.1s;
}
.f-otp-btn:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
.f-otp-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

.f-phone-row {
  display: grid;
  grid-template-columns: minmax(82px, 96px) minmax(0, 1fr);
  gap: 6px;
}
.f-country-select {
  background: #fafaf8; 
  border: 1px solid var(--border);
  border-radius: var(--radius-sm); padding: 9px 8px;
   font-size: 12px; color: var(--text);
  outline: none; cursor: pointer; width: 100%; min-width: 0;
  transition: border-color 0.18s;
}
.f-country-select:focus { border-color: var(--border-focus); }
.f-phone-inner {
  min-width: 0; display: flex; align-items: center;
  background: #fafaf8; border: 1px solid var(--border);
  border-radius: var(--radius-sm); padding: 0 11px; gap: 5px;
  transition: border-color 0.18s, box-shadow 0.18s;
}
.f-phone-inner:focus-within {
  border-color: var(--border-focus); background: black;
  box-shadow: 0 0 0 3px rgba(61,139,122,0.1);
}
.f-phone-inner input {
  flex: 1; min-width: 0; border: none; background: transparent; outline: none;
   font-size: 13px; color: var(--text); padding: 9px 0;
}

.f-addr-wrap { position: relative; }
.f-addr-list {
  position: absolute; top: calc(100% + 4px); left: 0; right: 0;
  background:black; border: 1px solid var(--border-focus);
  border-radius: var(--radius-sm); z-index: 100;
  box-shadow: 0 8px 24px rgba(0,0,0,0.1); overflow: hidden;
  animation: f-in 0.15s ease;
}
.f-addr-item {
  display: block; width: 100%; text-align: left;
  background: none; border: none; border-bottom: 1px solid var(--border);
  padding: 9px 12px;
   font-size: 12px; color: var(--text-mid);
  cursor: pointer; transition: background 0.12s;
}
.f-addr-item:last-child { border-bottom: none; }
.f-addr-item:hover { background: var(--accent-light); color: var(--accent); }
.f-addr-searching { padding: 9px 12px; font-size: 11px; color: var(--text-muted); font-style: italic; }
.f-addr-chosen {
  margin-top: 5px; font-size: 11px; color: var(--accent);
  display: flex; align-items: flex-start; gap: 4px; line-height: 1.4;
}
.f-location-card {
  border: 1px solid rgba(61,139,122,0.2);
  background: var(--accent-light);
  border-radius: var(--radius-sm);
  padding: 12px;
  min-width: 0;
  overflow: hidden;
}
.f-location-top {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: 12px;
  min-width: 0;
}
.f-location-copy {
  min-width: 0;
  flex: 1;
}
.f-location-address {
  margin: 0; color: var(--text); font-size: 13px; line-height: 1.5; font-weight: 600;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.f-location-meta {
  margin: 6px 0 0; color: var(--text-mid); font-size: 11px; line-height: 1.4;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.f-location-edit {
  flex-shrink: 0; border: 1px solid rgba(61,139,122,0.35); border-radius: 999px;
  color: var(--accent); background: black; padding: 6px 10px;
  font-size: 11px; font-weight: 700; text-decoration: none;
}
.f-location-edit:hover { color: var(--accent);  }

.f-drop {
  border: 1.5px dashed #c8d5d2; border-radius: var(--radius);
  padding: 20px 14px; text-align: center; cursor: pointer;
  background: #fafcfb; transition: all 0.18s;
  display: flex; flex-direction: column; align-items: center; gap: 5px;
}
.f-drop:hover, .f-drop.drag { border-color: var(--accent); background: var(--accent-light); }
.f-drop-icon {
  width: 32px; height: 32px; border-radius: 8px;
  background: var(--accent-light); border: 1px solid rgba(61,139,122,0.2);
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; color: var(--accent); margin-bottom: 2px;
  transition: transform 0.18s;
}
.f-drop:hover .f-drop-icon { transform: translateY(-2px); }
.f-drop-title { font-size: 13px; font-weight: 500; color: var(--text); margin: 0; }
.f-drop-sub { font-size: 11px; color: var(--text-muted); margin: 0; font-weight: 300; }
.f-drop-btns { display: flex; gap: 6px; margin-top: 6px; flex-wrap: wrap; justify-content: center; }
.f-drop-btn {
  padding: 5px 12px; border-radius: 20px;
  border: 1px solid var(--border); background: var(--white);
   font-size: 11px; font-weight: 500; color: var(--text-mid);
  cursor: pointer; transition: all 0.15s;
}
.f-drop-btn:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-light); }

.f-files { display: flex; flex-direction: column; gap: 7px; margin-top: 10px; }
.f-file {
  display: flex; align-items: center; gap: 9px;
  background: #fafaf8; border: 1px solid var(--border);
  border-radius: var(--radius-sm); padding: 8px 11px;
  animation: f-in 0.2s ease; transition: border-color 0.15s;
}
.f-file:hover { border-color: #c8d5d2; }
.f-file-thumb {
  width: 34px; height: 34px; border-radius: 6px;
  background: var(--accent-light); border: 1px solid rgba(61,139,122,0.15);
  overflow: hidden; display: flex; align-items: center; justify-content: center;
  font-size: 9px; font-weight: 700; color: var(--accent); flex-shrink: 0;
}
.f-file-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.f-file-info { flex: 1; min-width: 0; }
.f-file-name { font-size: 12px; font-weight: 500; color: var(--text); margin: 0 0 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.f-file-label-input {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--white);
  color: var(--text);
  padding: 7px 9px;
  font-size: 12px;
  outline: none;
  margin: 5px 0;
}
.f-file-label-input:focus {
  border-color: var(--border-focus);
  box-shadow: 0 0 0 3px rgba(61,139,122,0.1);
}
.f-file-meta { display: flex; gap: 8px; font-size: 10px; color: var(--text-muted); align-items: center; }
.f-file-link { color: var(--accent); text-decoration: none; opacity: 0.8; }
.f-file-link:hover { opacity: 1; }
.f-file-acts { display: flex; gap: 5px; flex-shrink: 0; }
.f-file-btn {
  padding: 4px 9px; border-radius: 5px; border: 1px solid var(--border);
  background: var(--white);
   font-size: 10px; font-weight: 500; cursor: pointer;
  transition: all 0.14s; color: var(--text-mid);
}
.f-file-btn:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-light); }
.f-file-btn.rm { color: var(--danger); border-color: rgba(217,91,91,0.2); }
.f-file-btn.rm:hover { border-color: var(--danger); background: #fef3f3; }

.f-submit-btn {
  width: 100%; padding: 13px; border-radius: var(--radius);
  border: none; background: var(--accent); color: white;
   font-size: 13px; font-weight: 600; letter-spacing: 0.04em;
  cursor: pointer; transition: all 0.2s;
  position: relative; overflow: hidden; margin-top: 4px;
}
.f-submit-btn::after {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 100%);
}
.f-submit-btn:hover:not(:disabled) {
  background: #357a6c; transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(61,139,122,0.3);
}
.f-submit-btn:active:not(:disabled) { transform: none; }
.f-submit-btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none; box-shadow: none; }

.f-submit-note {
  text-align: center; font-size: 10px; color: var(--text-muted);
  margin-top: 10px; display: flex; align-items: center;
  justify-content: center; gap: 4px;
}

.f-modal-bg {
  position: fixed; inset: 0; background: rgba(0,0,0,0.4);
  backdrop-filter: blur(4px); z-index: 1000;
  display: flex; align-items: center; justify-content: center;
  padding: 20px; animation: f-fade 0.2s ease;
}
@keyframes f-fade { from { opacity: 0; } to { opacity: 1; } }
.f-modal {
  background: var(--white); border: 1px solid var(--border);
  border-radius: 14px; max-width: 680px; width: 100%;
  max-height: 88vh; display: flex; flex-direction: column;
  box-shadow: 0 24px 60px rgba(0,0,0,0.15);
  animation: f-modal-in 0.22s cubic-bezier(0.34,1.56,0.64,1);
  overflow: hidden; position: relative; z-index: 1;
}
@keyframes f-modal-in {
  from { opacity: 0; transform: scale(0.95) translateY(10px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
.f-modal-head {
  display: flex; align-items: flex-start;
  justify-content: space-between;
  padding: 14px 18px; border-bottom: 1px solid var(--border); gap: 12px;
}
.f-modal-head h3 { font-size: 13px; font-weight: 600; color: var(--text); margin: 0 0 3px; }
.f-modal-head p { font-size: 11px; color: var(--text-muted); margin: 0; }
.f-modal-close {
  width: 26px; height: 26px; border-radius: 6px;
  border: 1px solid var(--border); background: #fafaf8;
  color: var(--text-mid); display: flex; align-items: center;
  justify-content: center; cursor: pointer; font-size: 12px; flex-shrink: 0;
  transition: all 0.14s;
}
.f-modal-close:hover { background: var(--accent-light); color: var(--accent); border-color: rgba(61,139,122,0.3); }
.f-modal-body {
  flex: 1; overflow: auto; display: flex;
  align-items: center; justify-content: center;
  padding: 20px; background: var(--bg);
}
.f-modal-body img { max-width: 100%; max-height: 60vh; border-radius: 8px; object-fit: contain; }
.f-modal-body iframe { width: 100%; height: 60vh; border: none; border-radius: 8px; }
.f-modal-fallback { text-align: center; color: var(--text-muted); display: flex; flex-direction: column; align-items: center; gap: 10px; }
.f-modal-fallback strong { font-size: 28px; color: var(--accent); font-family: 'Lora', serif; }
.f-modal-fallback a { color: var(--accent); font-size: 12px; text-decoration: underline; text-underline-offset: 3px; }

@media (max-width: 520px) {
  .f-root { padding: 20px 12px 48px; }
  .f-contact-grid { grid-template-columns: 1fr; }
  .f-email-row, .f-otp-wrap { flex-direction: column; }
  .f-phone-row { grid-template-columns: 1fr; }
  .f-country-select { width: 100%; }
  .f-location-top { flex-direction: column; }
  .f-location-edit { align-self: flex-start; }
}
`;

export default function ServiceOrderForm({ serviceId, serviceTitle = 'Service', servicePrice = 0, uploadLabel, submitButtonLabel, defaultPhoneCountry = 'US', formId, hideSubmitButton = false, directCheckout = false }) {
  const router = useRouter();
  const { data: session } = useSession();
  const addressInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const initialPhoneCountry = normalizePhoneCountry(defaultPhoneCountry);
  const resolvedSubmitButtonLabel = 'Go to Checkout →';

  const [formData, setFormData] = useState({ fullName: '', email: '', phone: '', phoneCountry: initialPhoneCountry, address: '', city: '', state: '', country: '' });
  const [emailVerified, setEmailVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [emailVerificationToken, setEmailVerificationToken] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [fileAccept, setFileAccept] = useState('image/*,.pdf,.doc,.docx');
  const [activePreview, setActivePreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [addressSearching, setAddressSearching] = useState(false);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [addressSearchEnabled, setAddressSearchEnabled] = useState(false);
  const [addressSelected, setAddressSelected] = useState(false);
  const [savedLocationAvailable, setSavedLocationAvailable] = useState(false);
  const sessionEmail = session?.user?.email?.trim().toLowerCase() || '';
  const currentEmail = formData.email.trim().toLowerCase();
  const loggedInEmailVerified = Boolean(sessionEmail && currentEmail === sessionEmail);

  useEffect(() => {
    if (!session?.user?.email) return;
    const normalizedEmail = session.user.email.trim().toLowerCase();
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) return;
      setFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || session.user.name || '',
        email: normalizedEmail,
      }));
      setEmailVerified(true);
      setOtpSent(false);
      setOtp('');
      setEmailVerificationToken('');
    });

    return () => { cancelled = true; };
  }, [session?.user?.email, session?.user?.name]);

  useEffect(() => {
    if (!session?.user?.email) return;
    let cancelled = false;

    fetch('/api/account/profile')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || !data.success || !data.data) return;
        const profile = data.data;
        setFormData((prev) => ({
          ...prev,
          fullName: prev.fullName || profile.name || '',
          phone: prev.phone || formatPhoneInput(profile.phone || '', profile.phoneCountry || prev.phoneCountry),
          phoneCountry: profile.phoneCountry || prev.phoneCountry,
          address: prev.address || profile.address || '',
          city: prev.city || profile.city || '',
          state: prev.state || profile.state || '',
          country: prev.country || profile.country || '',
        }));
        if (profile.address) {
          setAddressSelected(true);
          setSavedLocationAvailable(true);
        }
      })
      .catch(() => {});

    fetch('/api/account/orders')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || !data.success || !data.data?.length) return;
        const latestOrder = data.data[0];

        setFormData((prev) => ({
          ...prev,
          phone: prev.phone || formatPhoneInput(latestOrder.phone || '', latestOrder.phoneCountry || prev.phoneCountry),
          phoneCountry: latestOrder.phoneCountry || prev.phoneCountry,
          address: prev.address || latestOrder.address || '',
          city: prev.city || latestOrder.city || '',
          state: prev.state || latestOrder.state || '',
          country: prev.country || latestOrder.country || '',
        }));
        if (latestOrder.address) {
          setAddressSelected(true);
          setSavedLocationAvailable(true);
        }
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [session?.user?.email]);

  useEffect(() => {
    const query = formData.address.trim();
    if (!addressSearchEnabled || query.length < 3) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      setAddressSearching(true);
      try {
        const google = await loadGoogleMapsScript();
        if (!google?.maps?.places || cancelled) return;
        const svc = new google.maps.places.AutocompleteService();
        svc.getPlacePredictions({ input: query }, (pred) => {
          if (!cancelled) { setAddressSuggestions(pred || []); setShowAddressSuggestions(true); }
        });
      } catch { if (!cancelled) setAddressSuggestions([]); }
      finally { if (!cancelled) setAddressSearching(false); }
    }, 350);
    return () => { cancelled = true; clearTimeout(t); };
  }, [addressSearchEnabled, formData.address]);

  const setField = (field, value) => {
    setFormData((p) => ({ ...p, [field]: value }));
    if (field === 'email') {
      const trustedSessionEmail = sessionEmail && value.trim().toLowerCase() === sessionEmail;
      setEmailVerified(Boolean(trustedSessionEmail));
      setOtpSent(false);
      setOtp('');
      setEmailVerificationToken('');
    }
  };
  const setPhone = (value) => setFormData((p) => ({ ...p, phone: formatPhoneInput(value, p.phoneCountry) }));
  const setPhoneCountry = (country) => {
    const n = normalizePhoneCountry(country);
    setFormData((p) => ({ ...p, phoneCountry: n, phone: p.phone ? formatPhoneInput(p.phone, n) : '' }));
  };
  const validatePhone = () => {
    const ph = validateAndFormatPhone(formData.phone, formData.phoneCountry);
    if (!ph.valid) { toast.error('Please enter a valid phone number'); return false; }
    setFormData((p) => ({ ...p, phone: ph.formatted, phoneCountry: ph.country }));
    return true;
  };

  const selectSuggestion = async (s) => {
    const fallback = s.description || '';
    const google = await loadGoogleMapsScript();
    if (!google?.maps?.Geocoder) {
      setAddressSearchEnabled(false);
      setAddressSelected(Boolean(fallback));
      if (fallback) setFormData((p) => ({ ...p, address: fallback }));
      setAddressSuggestions([]); setShowAddressSuggestions(false); return;
    }
    new google.maps.Geocoder().geocode({ placeId: s.place_id }, (results, status) => {
      if (status === 'OK' && results?.[0]) {
        const address = results[0].formatted_address || fallback;
        const addressParts = extractAddressParts(results[0]);
        setAddressSearchEnabled(false);
        setAddressSelected(true);
        setFormData((p) => ({ ...p, address, ...addressParts }));
      } else if (fallback) {
        setAddressSearchEnabled(false);
        setAddressSelected(true);
        setFormData((p) => ({ ...p, address: fallback, city: '', state: '', country: '' }));
      }
      setAddressSuggestions([]); setShowAddressSuggestions(false);
    });
  };

  const addFiles = (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setDocuments((p) => [...p, ...files.map((f) => ({ file: f, url: URL.createObjectURL(f), documentName: '' }))]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  const setDocumentName = (index, value) => {
    setDocuments((p) => p.map((doc, i) => (i === index ? { ...doc, documentName: value } : doc)));
  };
  const removeFile = (i) => {
    setDocuments((p) => {
      const n = [...p]; const [r] = n.splice(i, 1);
      if (r?.url) URL.revokeObjectURL(r.url); return n;
    });
    setActivePreview((p) => (p === documents[i] ? null : p));
  };
  const openFilePicker = (accept = 'image/*,.pdf,.doc,.docx') => {
    setFileAccept(accept);
    setTimeout(() => fileInputRef.current?.click(), 0);
  };

  const verifyEmail = async () => {
    const email = formData.email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) { toast.error('Enter a valid email'); return; }
    setVerifying(true);
    try {
      const res = await fetch('/api/verify-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const d = await res.json();
      if (d.success) { setOtpSent(true); toast.success('OTP sent to your email'); }
      else toast.error(d.message || 'Failed to send OTP');
    } catch { toast.error('Failed to send OTP'); }
    finally { setVerifying(false); }
  };

  const confirmOtp = async () => {
    setVerifying(true);
    try {
      const res = await fetch('/api/verify-email/confirm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: formData.email, otp }) });
      const d = await res.json();
      if (d.success) {
        setEmailVerified(true);
        setEmailVerificationToken(d.token);

        if (d.user) {
          if (d.user.address) {
            setAddressSelected(true);
            setSavedLocationAvailable(true);
          }
          setFormData((prev) => ({
            ...prev,
            fullName: prev.fullName || d.user.name || '',
            email: d.user.email || prev.email,
            phone: prev.phone || formatPhoneInput(d.user.phone || '', d.user.phoneCountry || prev.phoneCountry),
            phoneCountry: d.user.phoneCountry || prev.phoneCountry,
            address: prev.address || d.user.address || '',
            city: prev.city || d.user.city || '',
            state: prev.state || d.user.state || '',
            country: prev.country || d.user.country || '',
          }));
        }

        if (!session?.user && d.loginEmail && d.orderLoginToken) {
          await signIn('credentials', {
            redirect: false,
            email: d.loginEmail,
            orderLoginToken: d.orderLoginToken,
          });
        }

        toast.success('Email verified');
        return;
      }
      if (d.success) { setEmailVerified(true); setEmailVerificationToken(d.token); toast.success('Email verified ✓'); }
      else toast.error(d.message || 'Invalid OTP');
    } catch { toast.error('Verification failed'); }
    finally { setVerifying(false); }
  };

  const submitOrder = async (e) => {
    e.preventDefault();
    if (!emailVerified && !loggedInEmailVerified) { toast.error('Please verify your email first'); return; }
    if (!formData.address.trim()) { toast.error('Please select your address'); return; }
    if (!addressSelected) { toast.error('Please select a location from the address suggestions'); return; }
    if (documents.length === 0) {
      toast.error('Please upload at least one document');
      return;
    }
    if (documents.some((document) => !cleanFileNamePart(document.documentName))) {
      toast.error('Please enter a document name for every uploaded file');
      return;
    }
    const ph = validateAndFormatPhone(formData.phone, formData.phoneCountry);
    if (!ph.valid) { toast.error('Invalid phone number'); return; }
    const metadata = {
      serviceId,
      serviceTitle,
      servicePrice: Number(servicePrice || 0),
      fullName: formData.fullName,
      email: formData.email,
      phone: ph.formatted,
      phoneCountry: ph.country,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      country: formData.country,
      emailVerificationToken,
    };
    const files = documents.map((document) => fileWithCustomName(document.file, document.documentName));
    setSubmitting(true);
    try {
      if (directCheckout) {
        const payload = new FormData();
        Object.entries(metadata).forEach(([key, value]) => payload.append(key, value ?? ''));
        files.forEach((file) => payload.append('documents', file));

        const orderResponse = await fetch('/api/orders', { method: 'POST', body: payload });
        const orderData = await orderResponse.json();
        if (!orderData.success) {
          toast.error(orderData.message || 'Unable to create order');
          return;
        }

        if (orderData.data?.loginEmail && orderData.data?.orderLoginToken) {
          await signIn('credentials', {
            redirect: false,
            email: orderData.data.loginEmail,
            orderLoginToken: orderData.data.orderLoginToken,
          });
        }

        if (!orderData.data?.paymentRequired) {
          window.location.href = `/thank-you?orderId=${orderData.data?.orderId || ''}`;
          return;
        }

        const checkoutResponse = await fetch(`/api/orders/${orderData.data.orderId}/checkout`, { method: 'POST' });
        const checkoutData = await checkoutResponse.json();
        if (checkoutData.success && checkoutData.checkoutUrl) {
          window.location.href = checkoutData.checkoutUrl;
        } else {
          toast.error(checkoutData.message || 'Unable to start checkout');
        }
        return;
      }

      await savePendingCheckoutDraft({
        metadata,
        files,
      });
      toast.success('Continue to checkout');
      router.push('/checkout?pendingService=1');
    } catch { toast.error('Failed to prepare checkout'); }
    finally { setSubmitting(false); }
  };

  const step1Done = !!formData.fullName && (emailVerified || loggedInEmailVerified);
  const step2Done = !!formData.phone && !!formData.address;

  return (
    <>
      <style>{css}</style>
      <div className="f-root">
        <div className="f-wrap">

          <div className="f-title">
            {/* <h2>Complete Your Order</h2> */}
            <p>Takes less than 2 minutes · All fields are required</p>
          </div>

          <div className="f-steps">
            <div className={`f-step ${step1Done ? 'done' : 'active'}`}>
              <div className="f-step-dot">{step1Done ? '✓' : '1'}</div>
              <span>Identity</span>
            </div>
            <div className="f-step-line" />
            <div className={`f-step ${step2Done ? 'done' : step1Done ? 'active' : ''}`}>
              <div className="f-step-dot">{step2Done ? '✓' : '2'}</div>
              <span>Contact</span>
            </div>
            <div className="f-step-line" />
            <div className={`f-step ${documents.length > 0 ? 'done' : step2Done ? 'active' : ''}`}>
              <div className="f-step-dot">{documents.length > 0 ? '✓' : '3'}</div>
              <span>Documents</span>
            </div>
          </div>

          <form id={formId} onSubmit={submitOrder}>

            {/* Card 1 */}
            <div className="f-card">
           
              <div className="f-card-head">
                <div className="f-card-icon">👤</div>
                <p className="f-card-label">Your Identity</p>
              </div>
              <div className="f-field">
                <label className="f-label">Full Name *</label>
                <input
                  className="f-input" required placeholder="e.g. Rahul Sharma"
                  value={formData.fullName}
                  onChange={(e) => setField('fullName', e.target.value)}
                />
              </div>

              <div className="f-contact-grid">
                <div className="f-field">
                <label className="f-label">Email Address *</label>
                <div className="f-email-row">
                  <input
                    type="email" className="f-input" required placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setField('email', e.target.value)}
                    disabled={loggedInEmailVerified}
                  />
                  {!loggedInEmailVerified && (
                  <button
                    type="button"
                    className={`f-verify-btn ${emailVerified ? 'verified' : ''}`}
                    onClick={verifyEmail}
                    disabled={verifying || !formData.email || emailVerified}
                  >
                    {emailVerified ? '✓ Done' : verifying ?  <div className="spinner-border" role="status"/> : otpSent ? 'Resend' : 'Verify'}
                  </button>
                  )}
                </div>
                {emailVerified && <span className="f-pill ok">✓ Email verified</span>}
                </div>

                <div className="f-field">
                <label className="f-label">Phone Number *</label>
                <div className="f-phone-row">
                  <select className="f-country-select" value={formData.phoneCountry} onChange={(e) => setPhoneCountry(e.target.value)}>
                    {phoneCountries.map((c) => (
                      <option key={c.code} value={c.code}>{c.code} +{c.callingCode}</option>
                    ))}
                  </select>
                  <div className="f-phone-inner">
                     <input
                      required placeholder="98765 43210"
                      value={formData.phone}
                      onChange={(e) => setPhone(e.target.value)}
                      onBlur={validatePhone}
                    />
                  </div>
                </div>
                </div>

                {otpSent && !emailVerified && (
                  <div className="f-field f-grid-full">
                    <span className="f-pill sent">📨 Check your inbox for OTP</span>
                  <div className="f-otp-wrap">
                    <input
                      className="f-otp-input" type="text" inputMode="numeric"
                      maxLength={6} placeholder="· · · · · ·"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    />
                    <button type="button" className="f-otp-btn" onClick={confirmOtp} disabled={verifying || otp.length !== 6}>
                      {verifying ? 'Checking…' : 'Confirm'}
                    </button>
                  </div>
                  </div>
                )}

                <div className="f-field f-grid-full">
                  {savedLocationAvailable && formData.address ? (
                    <div className="f-location-card">
                      <div className="f-location-top">
                        <div className="f-location-copy">
                          <label className="f-label">Saved Location</label>
                          <p className="f-location-address" title={formData.address}>{formData.address}</p>
                          {(formData.city || formData.state || formData.country) && (
                            <p className="f-location-meta" title={[formData.city, formData.state, formData.country].filter(Boolean).join(', ')}>
                              {[formData.city, formData.state, formData.country].filter(Boolean).join(', ')}
                            </p>
                          )}
                        </div>
                        <Link href="/dashboard/profile" className="f-location-edit ">Edit</Link>
                      </div>
                    </div>
                  ) : (
                    <>
                      <label className="f-label">Service Address *</label>
                      <div className="f-addr-wrap">
                        <input
                          ref={addressInputRef}
                          className="f-input" required placeholder="Start typing your address…"
                          value={formData.address}
                          onChange={(e) => {
                            setAddressSearchEnabled(true);
                            setAddressSelected(false);
                            setSavedLocationAvailable(false);
                            setField('address', e.target.value);
                            setFormData((p) => ({ ...p, city: '', state: '', country: '' }));
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
                          <div className="f-addr-list">
                            {addressSearching && <div className="f-addr-searching">Searching…</div>}
                            {addressSuggestions.map((s) => (
                              <button
                                type="button" key={s.place_id} className="f-addr-item"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => selectSuggestion(s)}
                              >
                                {s.description}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {formData.address && <p className="f-addr-chosen">📍 {formData.address}</p>}
                    </>
                  )}
                </div>


              </div>
            </div>

       

            {/* Card 3 */}
            <div className="f-card">
              <div className="f-card-head">
                <div className="f-card-icon">📎</div>
                <p className="f-card-label">{uploadLabel || 'Upload Documents'}</p>
              </div>

              <div
                className={`f-drop ${isDragging ? 'drag' : ''}`}
                onClick={() => openFilePicker()}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => { e.preventDefault(); setIsDragging(false); addFiles(e.dataTransfer.files); }}
                role="button" tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openFilePicker(); }}
              >
                <div className="f-drop-icon">↑</div>
                <p className="f-drop-title">Drop files or click to upload</p>
                <p className="f-drop-sub">Images, PDF, DOC, DOCX supported</p>
                <div className="f-drop-btns">
                  <button type="button" className="f-drop-btn" onClick={(e) => { e.stopPropagation(); openFilePicker('image/*'); }}>📷 Image</button>
                  <button type="button" className="f-drop-btn" onClick={(e) => { e.stopPropagation(); openFilePicker('.pdf,application/pdf'); }}>📄 PDF</button>
                  <button type="button" className="f-drop-btn" onClick={(e) => { e.stopPropagation(); openFilePicker('.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'); }}>📝 DOC</button>
                </div>
              </div>

              <input
                ref={fileInputRef} style={{ display: 'none' }}
                type="file" multiple accept={fileAccept}
                onChange={(e) => addFiles(e.target.files)}
              />

              {documents.length > 0 && (
                <div className="f-files">
                  {documents.map((doc, i) => {
                    const isImg = doc.file.type.startsWith('image/');
                    const isPdf = doc.file.type === 'application/pdf';
                    return (
                      <div className="f-file" key={`${doc.file.name}-${doc.file.lastModified}-${i}`}>
                        <div className="f-file-thumb">
                          {isImg ? <img src={doc.url} alt={doc.file.name} /> : isPdf ? 'PDF' : 'DOC'}
                        </div>
                        <div className="f-file-info">
                          <p className="f-file-name">{doc.file.name}</p>
                          <input
                            className="f-file-label-input"
                            type="text"
                            required
                            value={doc.documentName || ''}
                            onChange={(e) => setDocumentName(i, e.target.value)}
                            placeholder="Document name *"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="f-file-meta">
                            <span>{formatFileSize(doc.file.size)}</span>
                            <a href={doc.url} target="_blank" rel="noreferrer" className="f-file-link">Open ↗</a>
                          </div>
                        </div>
                        <div className="f-file-acts">
                          <button type="button" className="f-file-btn" onClick={() => setActivePreview(doc)}>Preview</button>
                          <button type="button" className="f-file-btn rm" onClick={() => removeFile(i)}>Remove</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {!hideSubmitButton && (
              <>
                <button type="submit" className="f-submit-btn" disabled={submitting || !emailVerified}>
                  {submitting ? 'Submitting…' : resolvedSubmitButtonLabel}
                </button>
                <p className="f-submit-note">🔒 Your data is encrypted &amp; secure</p>
              </>
            )}

          </form>
        </div>
      </div>

      {activePreview && (
        <div className="f-modal-bg" role="dialog" aria-modal="true">
          <div style={{ position: 'absolute', inset: 0 }} onClick={() => setActivePreview(null)} />
          <div className="f-modal">
            <div className="f-modal-head">
              <div>
                <h3 className='text-dark'>{activePreview.documentName || activePreview.file.name}</h3>
                <p className='text-dark'>{formatFileSize(activePreview.file.size)}</p>
              </div>
              <button type="button" className="f-modal-close bg-dark text-white" onClick={() => setActivePreview(null)}>✕</button>
            </div>
            <div className="f-modal-body">
              {activePreview.file.type.startsWith('image/') ? (
                <img src={activePreview.url} alt={activePreview.file.name} />
              ) : activePreview.file.type === 'application/pdf' ? (
                <iframe src={activePreview.url} title={activePreview.file.name} />
              ) : (
                <div className="f-modal-fallback">
                  <strong>DOC</strong>
                  <p>Preview not available for this file type.</p>
                  <a href={activePreview.url} target="_blank" rel="noreferrer">Open file ↗</a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

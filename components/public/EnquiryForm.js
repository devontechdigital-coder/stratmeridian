"use client";

import { useState } from 'react';
import { toast } from 'react-hot-toast';

const initialForm = {
  fullName: '',
  email: '',
  phone: '',
  comment: '',
};

export default function EnquiryForm({
  source = 'home',
  serviceId = '',
  serviceTitle = '',
  variant = 'card',
  content = {},
}) {
  const [formData, setFormData] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  const setField = (field) => (event) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          source,
          serviceId,
          serviceTitle,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.message || 'Unable to submit enquiry');
        return;
      }
      setFormData(initialForm);
      toast.success('Enquiry submitted');
    } catch {
      toast.error('Unable to submit enquiry');
    } finally {
      setSubmitting(false);
    }
  };

  if (variant === 'strip') {
    return (
      <form className="service-enquiry-strip" onSubmit={submit}>
        <div className="service-enquiry-field">
          <label>Full Name *</label>
          <input required value={formData.fullName} onChange={setField('fullName')} placeholder="Your full name" />
        </div>
        <div className="service-enquiry-field">
          <label>Phone No. *</label>
          <input required type="tel" value={formData.phone} onChange={setField('phone')} placeholder="+91 98765 43210" />
        </div>
        <div className="service-enquiry-field">
          <label>Email ID</label>
          <input required type="email" value={formData.email} onChange={setField('email')} placeholder="you@example.com" />
        </div>
        <div className="service-enquiry-field service-enquiry-wide">
          <label>Requirement *</label>
          <input required value={formData.comment} onChange={setField('comment')} placeholder="Tell us what you need help with" />
        </div>
        <button type="submit" disabled={submitting} className="service-enquiry-submit">
          {submitting ? 'Submitting...' : 'Submit Enquiry'} <i className="bi bi-arrow-right-circle-fill" />
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={submit}>
      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label">{content.fullNameLabel || 'Full Name'}</label>
          <input required type="text" className="form-control" placeholder={content.fullNamePlaceholder || 'John Doe'} value={formData.fullName} onChange={setField('fullName')} />
        </div>
        <div className="col-md-6">
          <label className="form-label">{content.emailLabel || 'Email Address'}</label>
          <input required type="email" className="form-control" placeholder={content.emailPlaceholder || 'john@email.com'} value={formData.email} onChange={setField('email')} />
        </div>
        <div className="col-md-6">
          <label className="form-label">{content.phoneLabel || 'Phone Number'}</label>
          <input required type="tel" className="form-control" placeholder={content.phonePlaceholder || '+1 234 567 890'} value={formData.phone} onChange={setField('phone')} />
        </div>
        <div className="col-12">
          <label className="form-label">{content.commentLabel || 'Comment'}</label>
          <textarea required className="form-control" placeholder={content.commentPlaceholder || 'Tell us what you need help with...'} value={formData.comment} onChange={setField('comment')} />
        </div>
        <div className="col-12 mt-2">
          <button type="submit" disabled={submitting} className="btn btn-main w-100" style={{ justifyContent: "center" }}>
            {submitting ? 'Submitting...' : (content.buttonLabel || 'Submit Enquiry')} <i className="bi bi-arrow-right" />
          </button>
        </div>
      </div>
    </form>
  );
}

"use client";

import { useEffect, useState, use } from 'react';
import ServiceForm from '@/components/admin/ServiceForm';

export default function EditService({ params }) {
  const { id } = use(params);
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchService = async () => {
      try {
        const res = await fetch(`/api/admin/services/${id}`);
        const data = await res.json();
        if (data.success) setInitialData(data.data);
      } catch (error) {
        console.error('Failed to fetch service data');
      } finally {
        setLoading(false);
      }
    };
    fetchService();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading service data...</div>;
  if (!initialData) return <div className="p-8 text-center text-red-500">Service not found.</div>;

  return <ServiceForm key={initialData._id} initialData={initialData} isEditing={true} />;
}

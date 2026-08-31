"use client";

import { useEffect, useState, use } from 'react';
import PageForm from '@/components/admin/PageForm';

export default function EditPage({ params }) {
  const { id } = use(params);
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const res = await fetch(`/api/admin/pages/${id}`);
        const data = await res.json();
        if (data.success) {
          setInitialData(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch page data');
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading page data...</div>;
  if (!initialData) return <div className="p-8 text-center text-red-500">Page not found.</div>;

  return <PageForm key={initialData._id} initialData={initialData} isEditing={true} />;
}

"use client";

import { useEffect, useState, use } from 'react';
import CategoryForm from '@/components/admin/CategoryForm';

export default function EditCategory({ params }) {
  const { id } = use(params);
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const res = await fetch(`/api/admin/categories/${id}`);
        const data = await res.json();
        if (data.success) setInitialData(data.data);
      } catch (error) {
        console.error('Failed to fetch category data');
      } finally {
        setLoading(false);
      }
    };
    fetchCategory();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading category data...</div>;
  if (!initialData) return <div className="p-8 text-center text-red-500">Category not found.</div>;

  return <CategoryForm key={initialData._id} initialData={initialData} isEditing={true} />;
}

"use client";

import { useCallback, useEffect, useState } from 'react';
import Nestable from 'react-nestable';
import 'react-nestable/dist/styles/index.css';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';

const MenuBuilder = ({ type, title }) => {
  const router = useRouter();
  const { hasPermission, isLoading } = usePermissions();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const canEdit = hasPermission('settings', 'edit');

  const fetchMenu = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/menus?type=${type}`);
      const data = await res.json();
      if (data.success) {
        // Ensure data consistency for all items
        const normalizeItems = (list) => {
          return (list || []).map(item => ({
            ...item,
            target: item.target || '_self',
            children: normalizeItems(item.children)
          }));
        };
        setItems(normalizeItems(data.data.items));
      }
    } catch (error) {
      toast.error('Failed to fetch menu');
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    Promise.resolve().then(fetchMenu);
  }, [fetchMenu]);

  useEffect(() => {
    if (!isLoading && !hasPermission('settings', 'view')) {
      router.replace('/admin');
    }
  }, [hasPermission, isLoading, router]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/menus', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, items }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`${title} saved successfully`);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Failed to save menu');
    } finally {
      setSaving(false);
    }
  };

  const addItem = () => {
    const newItem = {
      id: Date.now().toString(),
      text: 'New Menu Item',
      href: '/',
      target: '_self',
      children: [],
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id) => {
    const removeRecursive = (list, targetId) => {
      return list
        .filter(item => item.id !== targetId)
        .map(item => ({
          ...item,
          children: removeRecursive(item.children || [], targetId)
        }));
    };
    setItems(removeRecursive(items, id));
  };

  const updateItem = (id, updates) => {
    const updateRecursive = (list, targetId, data) => {
      return list.map(item => {
        if (item.id === targetId) {
          return { ...item, ...data };
        }
        return {
          ...item,
          children: updateRecursive(item.children || [], targetId, data)
        };
      });
    };
    setItems(updateRecursive(items, id, updates));
    setEditingItem(null);
  };

  const renderItem = ({ item, collapseIcon, handler }) => {
    return (
      <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg shadow-sm mb-2 group">
        {handler}
        {collapseIcon}
        <div className="flex-1">
          <span className="font-medium text-slate-700">{item.text}</span>
          <span className="ml-2 text-xs text-slate-400 font-mono">{item.href}</span>
          {item.target === '_blank' && (
            <span className="ml-2 px-1 pb-0.5 rounded bg-slate-100 text-[10px] text-slate-400 border border-slate-200">New Tab</span>
          )}
        </div>
        {canEdit && (
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setEditingItem(item)}
              className="p-1 hover:bg-violet-100 text-violet-600 rounded"
              title="Edit"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button
              onClick={() => removeItem(item.id)}
              className="p-1 hover:bg-red-100 text-red-600 rounded"
              title="Delete"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
            </button>
          </div>
        )}
      </div>
    );
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading menu...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
        <div className="flex gap-3">
          {canEdit && (
            <button
              onClick={addItem}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Item
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !canEdit}
            className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? 'Saving...' : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                Save {title}
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
        {Array.isArray(items) ? (
          <Nestable
            items={items}
            renderItem={renderItem}
            onChange={({ items: newItems }) => {
              if (canEdit) {
                setItems(newItems);
              }
            }}
            maxDepth={3}
            handler={
              <div className="cursor-grab text-slate-400 hover:text-slate-600">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <line x1="8" y1="9" x2="16" y2="9" /><line x1="8" x2="16" y1="15" y2="15" />
                </svg>
              </div>
            }
          />
        ) : (
          <div className="text-center py-12 text-red-400 font-medium italic">
            Error: Menu structure is corrupted. Please refresh or reset.
          </div>
        )}
        {items.length === 0 && (
          <div className="text-center py-12 text-slate-400 italic">
            No menu items yet. Click &quot;Add Item&quot; to start.
          </div>
        )}
      </div>

      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800">Edit Menu Item</h3>
              <button 
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Label</label>
                <input
                  type="text"
                  value={editingItem.text}
                  onChange={(e) => setEditingItem({ ...editingItem, text: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">URL (href)</label>
                <input
                  type="text"
                  value={editingItem.href}
                  onChange={(e) => setEditingItem({ ...editingItem, href: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Target</label>
                <select
                  value={editingItem.target || '_self'}
                  onChange={(e) => setEditingItem({ ...editingItem, target: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none"
                >
                  <option value="_self">Same Window (_self)</option>
                  <option value="_blank">New Tab (_blank)</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => updateItem(editingItem.id, { 
                    text: editingItem.text, 
                    href: editingItem.href, 
                    target: editingItem.target || '_self' 
                  })}
                  className="flex-1 px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium shadow-sm"
                >
                  Update Item
                </button>
                <button
                  onClick={() => setEditingItem(null)}
                  className="flex-1 px-6 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuBuilder;

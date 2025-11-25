'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Category {
  id: number;
  name: string;
}

interface Subcategory {
  id: number;
  category_id: number;
  category_name: string;
  name: string;
  status: 'active' | 'inactive';
  sort_order: number;
}

export default function ServiceTypesPage() {
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Subcategory | null>(null);
  const [formData, setFormData] = useState({ category_id: '', name: '', status: 'active', sort_order: 0 });
  const [filterCategory, setFilterCategory] = useState('');

  const fetchData = async () => {
    try {
      const [subcatRes, catRes] = await Promise.all([
        fetch(`${API_URL}/subcategories/list.php`),
        fetch(`${API_URL}/categories/list.php`),
      ]);
      const subcatData = await subcatRes.json();
      const catData = await catRes.json();

      if (subcatData.success) setSubcategories(subcatData.data);
      if (catData.success) setCategories(catData.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateDialog = () => {
    setEditingItem(null);
    setFormData({ category_id: categories[0]?.id?.toString() || '', name: '', status: 'active', sort_order: 0 });
    setDialogOpen(true);
  };

  const openEditDialog = (item: Subcategory) => {
    setEditingItem(item);
    setFormData({
      category_id: item.category_id.toString(),
      name: item.name,
      status: item.status,
      sort_order: item.sort_order,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const url = editingItem
        ? `${API_URL}/subcategories/update.php`
        : `${API_URL}/subcategories/create.php`;

      const body = editingItem
        ? { ...formData, category_id: parseInt(formData.category_id), id: editingItem.id }
        : { ...formData, category_id: parseInt(formData.category_id) };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(editingItem ? 'Service type updated' : 'Service type created');
        setDialogOpen(false);
        fetchData();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this service type? This will also delete all services under it.')) return;

    try {
      const res = await fetch(`${API_URL}/subcategories/delete.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Service type deleted');
        fetchData();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const filteredSubcategories = filterCategory
    ? subcategories.filter((s) => s.category_id.toString() === filterCategory)
    : subcategories;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <h1 className="text-2xl font-bold" style={{ color: '#085e54' }}>Service Types</h1>
          <div className="flex gap-2">
            <select
              className="p-2 border rounded-md"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <Button onClick={openCreateDialog} style={{ backgroundColor: '#02c30a' }}>
              Add Service Type
            </Button>
          </div>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredSubcategories.map((item) => (
              <Card key={item.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="flex justify-between items-center text-base">
                    <span style={{ color: '#085e54' }}>{item.name}</span>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        item.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {item.status}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-2" style={{ color: '#02c30a' }}>{item.category_name}</p>
                  <p className="text-sm text-gray-500 mb-4">Sort: {item.sort_order}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(item)}>
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600"
                      onClick={() => handleDelete(item.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="w-[700px] max-w-[700px]">
            <DialogHeader>
              <DialogTitle style={{ color: '#085e54' }}>
                {editingItem ? 'Edit Service Type' : 'Add Service Type'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium">Category</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Service type name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Sort Order</label>
                <Input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} style={{ backgroundColor: '#02c30a' }}>
                {editingItem ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

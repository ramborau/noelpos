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
  name: string;
}

interface Service {
  id: number;
  category_id: number;
  subcategory_id: number;
  category_name: string;
  subcategory_name: string;
  type: 'Service' | 'Offer';
  item_name: string;
  price: number;
  currency: string;
  status: 'active' | 'inactive';
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    category_id: '',
    subcategory_id: '',
    type: 'Service',
    item_name: '',
    price: '',
    currency: 'BHD',
    status: 'active',
  });
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSubcategory, setFilterSubcategory] = useState('');
  const [filterType, setFilterType] = useState('');

  const fetchData = async () => {
    try {
      const [servRes, catRes, subcatRes] = await Promise.all([
        fetch(`${API_URL}/services/list.php`),
        fetch(`${API_URL}/categories/list.php`),
        fetch(`${API_URL}/subcategories/list.php`),
      ]);

      const servData = await servRes.json();
      const catData = await catRes.json();
      const subcatData = await subcatRes.json();

      if (servData.success) setServices(servData.data);
      if (catData.success) setCategories(catData.data);
      if (subcatData.success) setSubcategories(subcatData.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredSubcategoriesForForm = formData.category_id
    ? subcategories.filter((s) => s.category_id.toString() === formData.category_id)
    : subcategories;

  const openCreateDialog = () => {
    setEditingItem(null);
    setFormData({
      category_id: categories[0]?.id?.toString() || '',
      subcategory_id: '',
      type: 'Service',
      item_name: '',
      price: '',
      currency: 'BHD',
      status: 'active',
    });
    setDialogOpen(true);
  };

  const openEditDialog = (item: Service) => {
    setEditingItem(item);
    setFormData({
      category_id: item.category_id.toString(),
      subcategory_id: item.subcategory_id.toString(),
      type: item.type,
      item_name: item.item_name,
      price: item.price.toString(),
      currency: item.currency,
      status: item.status,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const url = editingItem
        ? `${API_URL}/services/update.php`
        : `${API_URL}/services/create.php`;

      const body = {
        category_id: parseInt(formData.category_id),
        subcategory_id: parseInt(formData.subcategory_id),
        type: formData.type,
        item_name: formData.item_name,
        price: parseFloat(formData.price),
        currency: formData.currency,
        status: formData.status,
        ...(editingItem && { id: editingItem.id }),
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(editingItem ? 'Service updated' : 'Service created');
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
    if (!confirm('Delete this service?')) return;

    try {
      const res = await fetch(`${API_URL}/services/delete.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Service deleted');
        fetchData();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const filteredServices = services.filter((s) => {
    if (filterCategory && s.category_id.toString() !== filterCategory) return false;
    if (filterSubcategory && s.subcategory_id.toString() !== filterSubcategory) return false;
    if (filterType && s.type !== filterType) return false;
    return true;
  });

  const formatPrice = (price: number) => {
    return price.toFixed(3) + ' BHD';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <h1 className="text-2xl font-bold" style={{ color: '#085e54' }}>Services</h1>
          <Button onClick={openCreateDialog} style={{ backgroundColor: '#02c30a' }}>
            Add Service
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <select
            className="p-2 border rounded-md"
            value={filterCategory}
            onChange={(e) => {
              setFilterCategory(e.target.value);
              setFilterSubcategory('');
            }}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <select
            className="p-2 border rounded-md"
            value={filterSubcategory}
            onChange={(e) => setFilterSubcategory(e.target.value)}
          >
            <option value="">All Service Types</option>
            {subcategories
              .filter((s) => !filterCategory || s.category_id.toString() === filterCategory)
              .map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
          </select>
          <select
            className="p-2 border rounded-md"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="Service">Service</option>
            <option value="Offer">Offer</option>
          </select>
        </div>

        <p className="text-sm text-gray-500">{filteredServices.length} services found</p>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredServices.map((item) => (
              <Card key={item.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex justify-between items-start">
                    <span style={{ color: '#085e54' }}>{item.item_name}</span>
                    <span
                      className={`text-xs px-2 py-1 rounded whitespace-nowrap ${
                        item.type === 'Service'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}
                    >
                      {item.type}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-bold" style={{ color: '#02c30a' }}>{formatPrice(item.price)}</p>
                  <p className="text-xs text-gray-500">{item.category_name} &gt; {item.subcategory_name}</p>
                  <div className="flex gap-2 mt-3">
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
                {editingItem ? 'Edit Service' : 'Add Service'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="text-sm font-medium">Category</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value, subcategory_id: '' })}
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Service Type</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={formData.subcategory_id}
                  onChange={(e) => setFormData({ ...formData, subcategory_id: e.target.value })}
                >
                  <option value="">Select Service Type</option>
                  {filteredSubcategoriesForForm.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Type</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="Service">Service</option>
                  <option value="Offer">Offer</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Item Name</label>
                <Input
                  value={formData.item_name}
                  onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                  placeholder="Service name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Price (BHD)</label>
                <Input
                  type="number"
                  step="0.001"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.000"
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

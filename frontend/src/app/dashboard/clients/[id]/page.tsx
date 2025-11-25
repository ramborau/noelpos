'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Customer {
  id: number;
  name: string;
  mobile: string;
  created_at: string;
}

interface Address {
  id: number;
  formatted_address: string;
  location_type: string;
  block: string;
  city: string;
  governorate: string;
  road_no: string;
  flat_house_no: string;
  floor_no: string;
  latitude: number | null;
  longitude: number | null;
  is_default: boolean;
}

interface OrderItem {
  id: number;
  name: string;
  type: string;
  price: number;
  quantity: number;
}

interface Order {
  id: number;
  order_number: string;
  status: string;
  total_amount: string;
  payment_method: string;
  items: OrderItem[];
  rider_name: string | null;
  created_at: string;
}

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingAddressId, setDeletingAddressId] = useState<number | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<number | null>(null);

  useEffect(() => {
    fetchCustomerData();
  }, [customerId]);

  const fetchCustomerData = async () => {
    try {
      const res = await fetch(`${API_URL}/customers/get.php?id=${customerId}`);
      const data = await res.json();

      if (data.success) {
        setCustomer(data.customer);
        setAddresses(data.addresses || []);
        setOrders(data.orders || []);
      } else {
        toast.error(data.message || 'Customer not found');
        router.push('/dashboard/clients');
      }
    } catch (error) {
      console.error('Failed to fetch customer:', error);
      toast.error('Failed to fetch customer details');
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (addressId: number) => {
    setSettingDefaultId(addressId);
    try {
      const res = await fetch(`${API_URL}/addresses/set-default.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: addressId })
      });
      const data = await res.json();

      if (data.success) {
        toast.success('Default address updated');
        setAddresses(prev => prev.map(addr => ({
          ...addr,
          is_default: addr.id === addressId
        })));
      } else {
        toast.error(data.message || 'Failed to update default address');
      }
    } catch (error) {
      toast.error('Failed to update default address');
    } finally {
      setSettingDefaultId(null);
    }
  };

  const handleDeleteAddress = async (addressId: number) => {
    if (!confirm('Are you sure you want to delete this address?')) return;

    setDeletingAddressId(addressId);
    try {
      const res = await fetch(`${API_URL}/addresses/delete.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: addressId })
      });
      const data = await res.json();

      if (data.success) {
        toast.success('Address deleted');
        setAddresses(prev => prev.filter(addr => addr.id !== addressId));
      } else {
        toast.error(data.message || 'Failed to delete address');
      }
    } catch (error) {
      toast.error('Failed to delete address');
    } finally {
      setDeletingAddressId(null);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `BHD ${num.toFixed(3)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'rider_assigned': return 'bg-blue-100 text-blue-700';
      case 'picked_up': return 'bg-purple-100 text-purple-700';
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'home':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        );
      case 'work':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
    }
  };

  // Calculate stats
  const totalOrders = orders.length;
  const totalSpent = orders
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + parseFloat(o.total_amount), 0);
  const activeOrders = orders.filter(o => ['pending', 'rider_assigned', 'picked_up'].includes(o.status)).length;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!customer) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Customer not found</p>
          <Link href="/dashboard/clients" className="text-green-600 hover:underline mt-2 inline-block">
            Back to Clients
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Customer Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: '#ddf8c6' }}
              >
                <span className="text-xl font-bold" style={{ color: '#085e54' }}>
                  {getInitials(customer.name)}
                </span>
              </div>

              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
                <div className="flex items-center gap-4 mt-1">
                  <a
                    href={`tel:${customer.mobile}`}
                    className="flex items-center gap-1 text-gray-600 hover:text-green-600 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {customer.mobile}
                  </a>
                  <span className="text-gray-400">|</span>
                  <span className="text-sm text-gray-500">
                    Member since {formatDate(customer.created_at)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
              <p className="text-sm text-gray-500">Total Orders</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold" style={{ color: '#02c30a' }}>{formatCurrency(totalSpent)}</p>
              <p className="text-sm text-gray-500">Total Spent</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-orange-500">{activeOrders}</p>
              <p className="text-sm text-gray-500">Active Orders</p>
            </CardContent>
          </Card>
        </div>

        {/* Addresses */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Addresses</CardTitle>
              <span className="text-sm text-gray-500">{addresses.length} address(es)</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {addresses.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No addresses found</p>
            ) : (
              addresses.map(address => (
                <div
                  key={address.id}
                  className={`p-4 rounded-lg border ${address.is_default ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${address.is_default ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-600'}`}>
                        {getLocationIcon(address.location_type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 capitalize">{address.location_type}</span>
                          {address.is_default && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{address.formatted_address}</p>
                        <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500">
                          {address.block && address.block !== '0' && <span>Block {address.block}</span>}
                          {address.road_no && address.road_no !== '0' && <span>Road {address.road_no}</span>}
                          {address.flat_house_no && address.flat_house_no !== '0' && <span>Flat/House {address.flat_house_no}</span>}
                          {address.floor_no && address.floor_no !== '0' && <span>Floor {address.floor_no}</span>}
                        </div>
                        {address.city && (
                          <p className="text-xs text-gray-500 mt-1">{address.city}, {address.governorate}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {address.latitude && address.longitude && (
                        <a
                          href={`https://www.google.com/maps?q=${address.latitude},${address.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View on Map"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                          </svg>
                        </a>
                      )}
                      {!address.is_default && (
                        <button
                          onClick={() => handleSetDefault(address.id)}
                          disabled={settingDefaultId === address.id}
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Set as Default"
                        >
                          {settingDefaultId === address.id ? (
                            <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteAddress(address.id)}
                        disabled={deletingAddressId === address.id}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        {deletingAddressId === address.id ? (
                          <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Order History */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Order History</CardTitle>
              <span className="text-sm text-gray-500">{orders.length} order(s)</span>
            </div>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No orders found</p>
            ) : (
              <div className="space-y-3">
                {orders.map(order => (
                  <Link
                    key={order.id}
                    href={`/dashboard/orders/${order.id}`}
                    className="block"
                  >
                    <div className="p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:shadow-sm transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">#{order.order_number}</span>
                              <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${getStatusColor(order.status)}`}>
                                {formatStatus(order.status)}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                              <span>{order.items?.length || 0} items</span>
                              <span>•</span>
                              <span>{formatDate(order.created_at)}</span>
                              {order.rider_name && (
                                <>
                                  <span>•</span>
                                  <span className="text-blue-600">{order.rider_name}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-semibold" style={{ color: '#02c30a' }}>
                            {formatCurrency(order.total_amount)}
                          </span>
                          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

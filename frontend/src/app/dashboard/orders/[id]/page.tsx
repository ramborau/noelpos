'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
  customer_id: number;
  address_id: number;
  rider_id: number | null;
  status: string;
  total_amount: string;
  payment_method: string;
  items: OrderItem[];
  notes: string | null;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  city: string;
  governorate: string;
  block: string;
  road_no: string;
  flat_house_no: string;
  floor_no: string;
  latitude: number | null;
  longitude: number | null;
  location_type: string;
  rider_name: string | null;
  rider_mobile: string | null;
  created_at: string;
  updated_at: string;
}

interface Rider {
  id: number;
  name: string;
  mobile: string;
  status: string;
}

const statusOrder = ['pending', 'rider_assigned', 'picked_up', 'delivered', 'cancelled'];

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [assigningRider, setAssigningRider] = useState(false);
  const [selectedRider, setSelectedRider] = useState<string>('');

  useEffect(() => {
    fetchOrder();
    fetchRiders();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`${API_URL}/orders/get.php?id=${orderId}`);
      const data = await res.json();

      if (data.success) {
        setOrder(data.data);
        if (data.data.rider_id) {
          setSelectedRider(data.data.rider_id.toString());
        }
      } else {
        toast.error(data.message || 'Order not found');
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Failed to fetch order:', error);
      toast.error('Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  };

  const fetchRiders = async () => {
    try {
      const res = await fetch(`${API_URL}/riders/list.php`);
      const data = await res.json();
      if (data.success) {
        setRiders(data.data.filter((r: Rider) => r.status === 'active'));
      }
    } catch (error) {
      console.error('Failed to fetch riders:', error);
    }
  };

  const updateStatus = async (newStatus: string) => {
    if (!order) return;

    setUpdatingStatus(true);
    try {
      const res = await fetch(`${API_URL}/orders/update-status.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: order.id, status: newStatus })
      });
      const data = await res.json();

      if (data.success) {
        toast.success(`Status updated to ${formatStatus(newStatus)}`);
        setOrder(prev => prev ? { ...prev, status: newStatus } : null);
      } else {
        toast.error(data.message || 'Failed to update status');
      }
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const assignRider = async () => {
    if (!order || !selectedRider) return;

    setAssigningRider(true);
    try {
      const res = await fetch(`${API_URL}/orders/assign-rider.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: order.id, rider_id: parseInt(selectedRider) })
      });
      const data = await res.json();

      if (data.success) {
        toast.success('Rider assigned successfully');
        fetchOrder(); // Refresh to get updated rider info
      } else {
        toast.error(data.message || 'Failed to assign rider');
      }
    } catch (error) {
      toast.error('Failed to assign rider');
    } finally {
      setAssigningRider(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `BHD ${num.toFixed(3)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'rider_assigned': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'picked_up': return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'delivered': return 'bg-green-100 text-green-700 border-green-300';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getTimelineStatus = (status: string, currentStatus: string) => {
    const currentIndex = statusOrder.indexOf(currentStatus);
    const statusIndex = statusOrder.indexOf(status);

    if (currentStatus === 'cancelled') {
      return status === 'cancelled' ? 'current' : 'inactive';
    }

    if (statusIndex < currentIndex) return 'completed';
    if (statusIndex === currentIndex) return 'current';
    return 'pending';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!order) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Order not found</p>
          <Link href="/dashboard" className="text-green-600 hover:underline mt-2 inline-block">
            Back to Orders
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const itemsTotal = order.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;

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

        {/* Order Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">Order #{order.order_number}</h1>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
                    {formatStatus(order.status)}
                  </span>
                </div>
                <p className="text-gray-500 mt-1">Created on {formatDate(order.created_at)}</p>
              </div>

              <div className="flex items-center gap-2">
                {order.status !== 'delivered' && order.status !== 'cancelled' && (
                  <select
                    value={order.status}
                    onChange={(e) => updateStatus(e.target.value)}
                    disabled={updatingStatus}
                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:opacity-50"
                  >
                    {statusOrder.filter(s => s !== 'cancelled').map(status => (
                      <option key={status} value={status}>{formatStatus(status)}</option>
                    ))}
                  </select>
                )}
                {order.status !== 'cancelled' && order.status !== 'delivered' && (
                  <Button
                    variant="outline"
                    onClick={() => updateStatus('cancelled')}
                    disabled={updatingStatus}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    Cancel Order
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Timeline */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Order Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  {statusOrder.filter(s => s !== 'cancelled').map((status, index) => {
                    const state = getTimelineStatus(status, order.status);
                    return (
                      <div key={status} className="flex items-center">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              state === 'completed' ? 'bg-green-500 text-white' :
                              state === 'current' ? 'bg-green-500 text-white ring-4 ring-green-100' :
                              'bg-gray-200 text-gray-400'
                            }`}
                          >
                            {state === 'completed' ? (
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <span className="text-sm font-medium">{index + 1}</span>
                            )}
                          </div>
                          <span className={`text-xs mt-2 text-center max-w-[80px] ${
                            state === 'pending' ? 'text-gray-400' : 'text-gray-700 font-medium'
                          }`}>
                            {formatStatus(status)}
                          </span>
                        </div>
                        {index < statusOrder.filter(s => s !== 'cancelled').length - 1 && (
                          <div className={`flex-1 h-1 mx-2 rounded ${
                            getTimelineStatus(statusOrder[index + 1], order.status) !== 'pending'
                              ? 'bg-green-500'
                              : 'bg-gray-200'
                          }`} style={{ minWidth: '40px' }}></div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {order.status === 'cancelled' && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 font-medium">This order has been cancelled</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Items */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {order.items?.map((item, index) => (
                    <div key={index} className="flex items-center justify-between py-3 border-b last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                          {item.quantity}x
                        </span>
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            item.type === 'Offer' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {item.type}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{formatCurrency(item.price * item.quantity)}</p>
                        <p className="text-xs text-gray-500">{formatCurrency(item.price)} each</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>{formatCurrency(itemsTotal)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span style={{ color: '#02c30a' }}>{formatCurrency(order.total_amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Payment Method</span>
                    <span className="capitalize">{order.payment_method}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Customer Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Customer</CardTitle>
              </CardHeader>
              <CardContent>
                <Link href={`/dashboard/clients/${order.customer_id}`} className="block hover:bg-gray-50 -mx-4 -my-2 px-4 py-2 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#ddf8c6' }}>
                      <span className="font-bold text-sm" style={{ color: '#085e54' }}>
                        {order.customer_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{order.customer_name}</p>
                      <a
                        href={`tel:${order.customer_phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm text-gray-500 hover:text-green-600"
                      >
                        {order.customer_phone}
                      </a>
                    </div>
                  </div>
                </Link>
              </CardContent>
            </Card>

            {/* Delivery Address */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Delivery Address</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full capitalize">
                      {order.location_type}
                    </span>
                  </div>
                  <p className="text-gray-900">{order.customer_address}</p>
                  <div className="flex flex-wrap gap-2 text-sm text-gray-500">
                    {order.block && order.block !== '0' && <span>Block {order.block}</span>}
                    {order.road_no && order.road_no !== '0' && <span>• Road {order.road_no}</span>}
                    {order.flat_house_no && order.flat_house_no !== '0' && <span>• Flat/House {order.flat_house_no}</span>}
                    {order.floor_no && order.floor_no !== '0' && <span>• Floor {order.floor_no}</span>}
                  </div>
                  {order.city && (
                    <p className="text-sm text-gray-500">{order.city}, {order.governorate}</p>
                  )}
                  {order.latitude && order.longitude && (
                    <a
                      href={`https://www.google.com/maps?q=${order.latitude},${order.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mt-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      View on Map
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Rider Assignment */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Rider</CardTitle>
              </CardHeader>
              <CardContent>
                {order.rider_id ? (
                  <Link href={`/dashboard/riders/${order.rider_id}`} className="block">
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{order.rider_name}</p>
                        <a
                          href={`tel:${order.rider_mobile}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-sm text-gray-500 hover:text-green-600"
                        >
                          {order.rider_mobile}
                        </a>
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-500">No rider assigned yet</p>
                    <select
                      value={selectedRider}
                      onChange={(e) => setSelectedRider(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="">Select a rider</option>
                      {riders.map(rider => (
                        <option key={rider.id} value={rider.id}>{rider.name} - {rider.mobile}</option>
                      ))}
                    </select>
                    <Button
                      onClick={assignRider}
                      disabled={!selectedRider || assigningRider}
                      className="w-full"
                      style={{ backgroundColor: '#02c30a' }}
                    >
                      {assigningRider ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Assigning...
                        </>
                      ) : (
                        'Assign Rider'
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            {order.notes && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{order.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

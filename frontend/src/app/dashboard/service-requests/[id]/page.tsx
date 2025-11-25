'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';

interface ServiceRequest {
  id: number;
  request_number: string;
  customer_id: number;
  address_id: number;
  rider_id: number | null;
  status: string;
  schedule_date: string;
  schedule_time_slot: string;
  notes: string | null;
  rider_token: string | null;
  token_expires_at: string | null;
  customer_name: string;
  customer_phone: string;
  formatted_address: string;
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

interface Order {
  id: number;
  order_number: string;
  status: string;
  total_amount: string;
  items: { id: number; name: string; price: number; quantity: number }[];
  created_at: string;
}

interface Rider {
  id: number;
  name: string;
  mobile: string;
  status: string;
}

export default function ServiceRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params.id as string;

  const [serviceRequest, setServiceRequest] = useState<ServiceRequest | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRider, setSelectedRider] = useState<string>('');
  const [assigning, setAssigning] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchData();
    fetchRiders();
  }, [requestId]);

  const fetchData = async () => {
    try {
      const res = await fetch(`${API_URL}/service-requests/get.php?id=${requestId}`);
      const data = await res.json();

      if (data.success) {
        setServiceRequest(data.data);
        setOrder(data.order);
        if (data.data.rider_id) {
          setSelectedRider(data.data.rider_id.toString());
        }
      } else {
        toast.error(data.message || 'Service request not found');
        router.push('/dashboard/service-requests');
      }
    } catch (error) {
      console.error('Failed to fetch service request:', error);
      toast.error('Failed to fetch service request');
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

  const handleAssignRider = async () => {
    if (!serviceRequest || !selectedRider) return;

    setAssigning(true);
    try {
      const res = await fetch(`${API_URL}/service-requests/assign-rider.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: serviceRequest.id, rider_id: parseInt(selectedRider) })
      });
      const data = await res.json();

      if (data.success) {
        toast.success('Rider assigned successfully');
        fetchData();
      } else {
        toast.error(data.message || 'Failed to assign rider');
      }
    } catch (error) {
      toast.error('Failed to assign rider');
    } finally {
      setAssigning(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!serviceRequest) return;

    setUpdatingStatus(true);
    try {
      const res = await fetch(`${API_URL}/service-requests/update.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: serviceRequest.id, status: newStatus })
      });
      const data = await res.json();

      if (data.success) {
        toast.success('Status updated');
        setServiceRequest({ ...serviceRequest, status: newStatus });
      } else {
        toast.error(data.message || 'Failed to update status');
      }
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const copyRiderLink = () => {
    if (serviceRequest?.rider_token) {
      const link = `${FRONTEND_URL}/rider/${serviceRequest.rider_token}`;
      navigator.clipboard.writeText(link);
      toast.success('Rider link copied to clipboard');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateStr: string) => {
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
      case 'completed': return 'bg-green-100 text-green-700 border-green-300';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
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

  if (!serviceRequest) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Service request not found</p>
          <Link href="/dashboard/service-requests" className="text-green-600 hover:underline mt-2 inline-block">
            Back to Service Requests
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const isTokenValid = serviceRequest.rider_token && serviceRequest.token_expires_at &&
    new Date(serviceRequest.token_expires_at) > new Date();

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

        {/* Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">#{serviceRequest.request_number}</h1>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(serviceRequest.status)}`}>
                    {formatStatus(serviceRequest.status)}
                  </span>
                </div>
                <p className="text-gray-500 mt-1">Created on {formatDateTime(serviceRequest.created_at)}</p>
              </div>

              <div className="flex items-center gap-2">
                {serviceRequest.status !== 'completed' && serviceRequest.status !== 'cancelled' && (
                  <select
                    value={serviceRequest.status}
                    onChange={(e) => handleStatusUpdate(e.target.value)}
                    disabled={updatingStatus}
                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:opacity-50"
                  >
                    <option value="pending">Pending</option>
                    <option value="rider_assigned">Rider Assigned</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Schedule */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900">{formatDate(serviceRequest.schedule_date)}</p>
                    <p className="text-gray-500">{serviceRequest.schedule_time_slot}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rider Link */}
            {serviceRequest.rider_token && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Rider Pickup Link</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`p-4 rounded-lg ${isTokenValid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${isTokenValid ? 'text-green-700' : 'text-red-700'}`}>
                          {isTokenValid ? 'Link Active' : 'Link Expired'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          {FRONTEND_URL}/rider/{serviceRequest.rider_token}
                        </p>
                        {serviceRequest.token_expires_at && (
                          <p className="text-xs text-gray-400 mt-1">
                            Expires: {formatDateTime(serviceRequest.token_expires_at)}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyRiderLink}
                        className="flex-shrink-0"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {serviceRequest.notes && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{serviceRequest.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Associated Order */}
            {order && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Created Order</CardTitle>
                </CardHeader>
                <CardContent>
                  <Link href={`/dashboard/orders/${order.id}`}>
                    <div className="p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:shadow-sm transition-all">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">#{order.order_number}</span>
                            <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                              order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                              order.status === 'picked_up' ? 'bg-purple-100 text-purple-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {formatStatus(order.status)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                            <span>{order.items?.length || 0} items</span>
                            <span>•</span>
                            <span>{formatDate(order.created_at)}</span>
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
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Customer Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Customer</CardTitle>
              </CardHeader>
              <CardContent>
                <Link href={`/dashboard/clients/${serviceRequest.customer_id}`} className="block hover:bg-gray-50 -mx-4 -my-2 px-4 py-2 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#ddf8c6' }}>
                      <span className="font-bold text-sm" style={{ color: '#085e54' }}>
                        {serviceRequest.customer_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{serviceRequest.customer_name}</p>
                      <a
                        href={`tel:${serviceRequest.customer_phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm text-gray-500 hover:text-green-600"
                      >
                        {serviceRequest.customer_phone}
                      </a>
                    </div>
                  </div>
                </Link>
              </CardContent>
            </Card>

            {/* Address */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Pickup Address</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full capitalize">
                      {serviceRequest.location_type}
                    </span>
                  </div>
                  <p className="text-gray-900">{serviceRequest.formatted_address}</p>
                  <div className="flex flex-wrap gap-2 text-sm text-gray-500">
                    {serviceRequest.block && serviceRequest.block !== '0' && <span>Block {serviceRequest.block}</span>}
                    {serviceRequest.road_no && serviceRequest.road_no !== '0' && <span>• Road {serviceRequest.road_no}</span>}
                    {serviceRequest.flat_house_no && serviceRequest.flat_house_no !== '0' && <span>• Flat/House {serviceRequest.flat_house_no}</span>}
                    {serviceRequest.floor_no && serviceRequest.floor_no !== '0' && <span>• Floor {serviceRequest.floor_no}</span>}
                  </div>
                  {serviceRequest.city && (
                    <p className="text-sm text-gray-500">{serviceRequest.city}, {serviceRequest.governorate}</p>
                  )}
                  {serviceRequest.latitude && serviceRequest.longitude && (
                    <a
                      href={`https://www.google.com/maps?q=${serviceRequest.latitude},${serviceRequest.longitude}`}
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
                {serviceRequest.rider_id ? (
                  <Link href={`/dashboard/riders/${serviceRequest.rider_id}`} className="block">
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{serviceRequest.rider_name}</p>
                        <a
                          href={`tel:${serviceRequest.rider_mobile}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-sm text-gray-500 hover:text-green-600"
                        >
                          {serviceRequest.rider_mobile}
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
                      onClick={handleAssignRider}
                      disabled={!selectedRider || assigning}
                      className="w-full"
                      style={{ backgroundColor: '#02c30a' }}
                    >
                      {assigning ? 'Assigning...' : 'Assign Rider'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

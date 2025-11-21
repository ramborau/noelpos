'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api, Order, Rider } from '@/lib/api';
import { useNotifications } from '@/lib/notifications';
import { toast } from 'sonner';

const statusConfig: Record<string, { label: string; icon: string }> = {
  pending: { label: 'Pending', icon: '⏳' },
  assigned: { label: 'Assigned', icon: '👤' },
  picked_up: { label: 'Picked Up', icon: '📦' },
  delivered: { label: 'Delivered', icon: '✓' },
  cancelled: { label: 'Cancelled', icon: '✕' },
};

const POLL_INTERVAL = 10000;

interface ExtendedOrder extends Order {
  customer_id?: number;
  address_id?: number;
  city?: string;
  governorate?: string;
  block?: string;
  road_no?: string;
  flat_house_no?: string;
  floor_no?: string;
  latitude?: string;
  longitude?: string;
  location_type?: string;
  subtotal?: string;
  payment_method?: string;
  pickup_date?: string;
  pickup_time_slot?: string;
  order_timestamp?: string;
}

export default function DashboardPage() {
  const [orders, setOrders] = useState<ExtendedOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<ExtendedOrder[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<ExtendedOrder | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedRiderId, setSelectedRiderId] = useState<string>('');
  const { addNotification } = useNotifications();
  const knownOrderIds = useRef<Set<number>>(new Set());
  const isFirstLoad = useRef(true);

  const [filters, setFilters] = useState({
    locationType: 'all',
    city: 'all',
    governorate: 'all',
    minValue: '',
    maxValue: '',
    status: 'all',
  });

  const [filterOptions, setFilterOptions] = useState({
    locationTypes: [] as string[],
    cities: [] as string[],
    governorates: [] as string[],
  });

  const [showFilters, setShowFilters] = useState(false);

  const fetchOrders = useCallback(async (silent = false) => {
    try {
      const result = await api.getOrders();
      if (result.success) {
        const newOrders: ExtendedOrder[] = result.data;

        if (!isFirstLoad.current) {
          newOrders.forEach((order: ExtendedOrder) => {
            if (!knownOrderIds.current.has(order.id)) {
              addNotification(
                'New Order!',
                `Order ${order.order_number} from ${order.customer_name} - ${Number(order.total_amount).toFixed(3)} BHD`,
                order.id
              );
            }
          });
        }

        knownOrderIds.current = new Set(newOrders.map((o: ExtendedOrder) => o.id));
        isFirstLoad.current = false;

        setOrders(newOrders);

        const locationTypes = [...new Set(newOrders.map(o => o.location_type).filter(Boolean))] as string[];
        const cities = [...new Set(newOrders.map(o => o.city).filter(Boolean))] as string[];
        const governorates = [...new Set(newOrders.map(o => o.governorate).filter(Boolean))] as string[];
        setFilterOptions({ locationTypes, cities, governorates });
      }
    } catch {
      if (!silent) {
        toast.error('Failed to fetch orders');
      }
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  const fetchRiders = async () => {
    try {
      const result = await api.getRiders();
      if (result.success) {
        setRiders(result.data.filter((r: Rider) => r.status === 'active'));
      }
    } catch {
      toast.error('Failed to fetch riders');
    }
  };

  useEffect(() => {
    let filtered = [...orders];

    if (filters.status !== 'all') {
      filtered = filtered.filter(o => o.status === filters.status);
    }
    if (filters.locationType !== 'all') {
      filtered = filtered.filter(o => o.location_type === filters.locationType);
    }
    if (filters.city !== 'all') {
      filtered = filtered.filter(o => o.city === filters.city);
    }
    if (filters.governorate !== 'all') {
      filtered = filtered.filter(o => o.governorate === filters.governorate);
    }
    if (filters.minValue) {
      filtered = filtered.filter(o => Number(o.total_amount) >= Number(filters.minValue));
    }
    if (filters.maxValue) {
      filtered = filtered.filter(o => Number(o.total_amount) <= Number(filters.maxValue));
    }

    setFilteredOrders(filtered);
  }, [orders, filters]);

  useEffect(() => {
    fetchOrders();
    fetchRiders();

    const pollInterval = setInterval(() => {
      fetchOrders(true);
    }, POLL_INTERVAL);

    return () => clearInterval(pollInterval);
  }, [fetchOrders]);

  const handleAssignRider = async () => {
    if (!selectedOrder || !selectedRiderId) return;

    try {
      const result = await api.assignRider(selectedOrder.id, parseInt(selectedRiderId));
      if (result.success) {
        toast.success('Rider assigned successfully');
        setAssignDialogOpen(false);
        setSelectedRiderId('');
        fetchOrders();
      } else {
        toast.error(result.message || 'Failed to assign rider');
      }
    } catch {
      toast.error('Failed to assign rider');
    }
  };

  const handleStatusUpdate = async (orderId: number, status: string) => {
    try {
      const result = await api.updateOrderStatus(orderId, status);
      if (result.success) {
        toast.success('Status updated');
        fetchOrders();
      } else {
        toast.error(result.message || 'Failed to update status');
      }
    } catch {
      toast.error('Failed to update status');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatCurrency = (amount: number | string) => {
    return `${Number(amount).toFixed(3)} BHD`;
  };

  const formatShortAddress = (order: ExtendedOrder) => {
    const parts = [];
    if (order.block) parts.push(`Block ${order.block}`);
    if (order.city) parts.push(order.city);
    return parts.length > 0 ? parts.join(', ') : order.customer_address || 'N/A';
  };

  const clearFilters = () => {
    setFilters({
      locationType: 'all',
      city: 'all',
      governorate: 'all',
      minValue: '',
      maxValue: '',
      status: 'all',
    });
  };

  const getStatusCounts = () => {
    const counts: Record<string, number> = {
      all: orders.length,
      pending: 0,
      assigned: 0,
      picked_up: 0,
      delivered: 0,
      cancelled: 0,
    };
    orders.forEach(o => {
      if (counts[o.status] !== undefined) counts[o.status]++;
    });
    return counts;
  };

  const statusCounts = getStatusCounts();

  return (
    <DashboardLayout>
      <div className="space-y-8 p-4 font-[Inter]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-[#085e54]">
              Orders
            </h1>
            <p className="text-[#085e54]/60 mt-2 text-lg">Manage and track all customer orders</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-[#085e54] bg-[#ddf8c6] px-4 py-2 rounded-full font-medium">
              <span className="w-2 h-2 bg-[#02c30a] rounded-full animate-pulse"></span>
              Live
            </div>
            <Button
              onClick={() => fetchOrders()}
              className="bg-[#02c30a] hover:bg-[#02c30a]/90 text-white font-semibold px-6"
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { key: 'all', label: 'All Orders' },
            { key: 'pending', label: 'Pending' },
            { key: 'assigned', label: 'Assigned' },
            { key: 'picked_up', label: 'Picked Up' },
            { key: 'delivered', label: 'Delivered' },
            { key: 'cancelled', label: 'Cancelled' },
          ].map((stat) => (
            <button
              key={stat.key}
              onClick={() => setFilters(f => ({ ...f, status: stat.key }))}
              className={`p-5 rounded-2xl transition-all duration-200 border-2 ${
                filters.status === stat.key
                  ? 'bg-[#02c30a] text-white border-[#02c30a]'
                  : 'bg-white text-[#085e54] border-[#ddf8c6] hover:border-[#02c30a]'
              }`}
            >
              <div className={`text-4xl font-bold ${filters.status === stat.key ? 'text-white' : 'text-[#085e54]'}`}>
                {statusCounts[stat.key]}
              </div>
              <div className={`text-sm font-semibold mt-1 ${filters.status === stat.key ? 'text-white/90' : 'text-[#085e54]/70'}`}>
                {stat.label}
              </div>
            </button>
          ))}
        </div>

        {/* Filters Toggle */}
        <div className="flex flex-wrap items-center gap-4">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={`font-semibold border-2 ${showFilters ? 'bg-[#085e54] text-white border-[#085e54]' : 'border-[#085e54] text-[#085e54] hover:bg-[#085e54] hover:text-white'}`}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
          </Button>
          <span className="text-[#085e54]/70 font-medium">
            Showing {filteredOrders.length} of {orders.length} orders
          </span>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <Card className="border-2 border-[#ddf8c6] bg-[#ddf8c6]/20">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-[#085e54] uppercase tracking-wide">Location</Label>
                  <Select
                    value={filters.locationType}
                    onValueChange={(value) => setFilters(f => ({ ...f, locationType: value }))}
                  >
                    <SelectTrigger className="border-2 border-[#085e54]/20 focus:border-[#02c30a]">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      {filterOptions.locationTypes.map(type => (
                        <SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-[#085e54] uppercase tracking-wide">City</Label>
                  <Select
                    value={filters.city}
                    onValueChange={(value) => setFilters(f => ({ ...f, city: value }))}
                  >
                    <SelectTrigger className="border-2 border-[#085e54]/20 focus:border-[#02c30a]">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Cities</SelectItem>
                      {filterOptions.cities.map(city => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-[#085e54] uppercase tracking-wide">Governorate</Label>
                  <Select
                    value={filters.governorate}
                    onValueChange={(value) => setFilters(f => ({ ...f, governorate: value }))}
                  >
                    <SelectTrigger className="border-2 border-[#085e54]/20 focus:border-[#02c30a]">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Governorates</SelectItem>
                      {filterOptions.governorates.map(gov => (
                        <SelectItem key={gov} value={gov}>{gov}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-[#085e54] uppercase tracking-wide">Min (BHD)</Label>
                  <Input
                    type="number"
                    step="0.001"
                    placeholder="0.000"
                    value={filters.minValue}
                    onChange={(e) => setFilters(f => ({ ...f, minValue: e.target.value }))}
                    className="border-2 border-[#085e54]/20 focus:border-[#02c30a]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-[#085e54] uppercase tracking-wide">Max (BHD)</Label>
                  <Input
                    type="number"
                    step="0.001"
                    placeholder="999.999"
                    value={filters.maxValue}
                    onChange={(e) => setFilters(f => ({ ...f, maxValue: e.target.value }))}
                    className="border-2 border-[#085e54]/20 focus:border-[#02c30a]"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="w-full border-2 border-[#085e54] text-[#085e54] hover:bg-[#085e54] hover:text-white font-semibold"
                  >
                    Clear All
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Orders Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 border-4 border-[#ddf8c6] border-t-[#02c30a] rounded-full animate-spin"></div>
              <p className="text-[#085e54] font-medium text-lg">Loading orders...</p>
            </div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <Card className="py-24 border-2 border-[#ddf8c6]">
            <div className="flex flex-col items-center gap-4 text-[#085e54]">
              <div className="text-7xl">📭</div>
              <p className="text-2xl font-bold">No orders found</p>
              <p className="text-[#085e54]/60">Try adjusting your filters or check back later</p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredOrders.map((order) => {
              const status = statusConfig[order.status] || statusConfig.pending;
              return (
                <Card
                  key={order.id}
                  className="overflow-hidden transition-all duration-200 hover:shadow-xl border-2 border-[#ddf8c6] hover:border-[#02c30a]"
                >
                  <CardHeader className="pb-4 bg-[#ddf8c6]/30">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl font-bold text-[#085e54]">{order.order_number}</CardTitle>
                        <p className="text-sm text-[#085e54]/60 mt-1 font-medium">
                          {order.pickup_date} {order.pickup_time_slot && `• ${order.pickup_time_slot}`}
                        </p>
                      </div>
                      <Badge className="bg-[#085e54] text-white font-semibold px-3 py-1">
                        {status.icon} {status.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5 pt-5">
                    {/* Customer Info */}
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#02c30a] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        {order.customer_name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[#085e54] text-lg truncate">{order.customer_name}</p>
                        <p className="text-[#085e54]/60 font-medium">{order.customer_phone}</p>
                      </div>
                    </div>

                    {/* Address */}
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-[#02c30a] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div>
                        <p className="text-[#085e54] font-medium">{formatShortAddress(order)}</p>
                        {order.location_type && (
                          <Badge variant="outline" className="mt-1 text-xs capitalize border-[#085e54] text-[#085e54]">{order.location_type}</Badge>
                        )}
                      </div>
                    </div>

                    {/* Items Preview */}
                    <div className="bg-[#ddf8c6]/50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[#085e54]/70 font-medium">{order.items?.length || 0} item(s)</span>
                        <span className="font-bold text-2xl text-[#02c30a]">{formatCurrency(order.total_amount)}</span>
                      </div>
                      <div className="space-y-2">
                        {order.items?.slice(0, 2).map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm text-[#085e54]">
                            <span className="truncate flex-1 font-medium">{item.name}</span>
                            <span className="ml-2 text-[#085e54]/70">x{item.quantity || item.qty}</span>
                          </div>
                        ))}
                        {(order.items?.length || 0) > 2 && (
                          <p className="text-sm text-[#085e54]/50 font-medium">+{(order.items?.length || 0) - 2} more items</p>
                        )}
                      </div>
                    </div>

                    {/* Rider Info */}
                    {order.rider_name ? (
                      <div className="flex items-center gap-3 bg-[#085e54]/10 rounded-xl p-3">
                        <div className="w-8 h-8 rounded-full bg-[#085e54] flex items-center justify-center text-white text-sm font-bold">
                          {order.rider_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-[#085e54]">{order.rider_name}</p>
                          <p className="text-sm text-[#085e54]/60">{order.rider_mobile}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 bg-[#ddf8c6]/30 rounded-xl p-3 text-[#085e54]/50">
                        <span className="text-lg">🏍️</span>
                        <span className="font-medium">No rider assigned</span>
                      </div>
                    )}

                    {/* Payment Method */}
                    <div className="flex items-center justify-between text-sm pt-2 border-t border-[#ddf8c6]">
                      <div className="flex items-center gap-2 text-[#085e54]">
                        <span>💳</span>
                        <span className="capitalize font-medium">{order.payment_method || 'Cash'}</span>
                      </div>
                      <span className="text-[#085e54]/50 font-medium">
                        {new Date(order.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-3">
                      <Button
                        variant="outline"
                        className="flex-1 border-2 border-[#085e54] text-[#085e54] hover:bg-[#085e54] hover:text-white font-semibold"
                        onClick={() => setSelectedOrder(order)}
                      >
                        View Details
                      </Button>
                      {!order.rider_id && (
                        <Button
                          className="flex-1 bg-[#02c30a] hover:bg-[#02c30a]/90 text-white font-semibold"
                          onClick={() => {
                            setSelectedOrder(order);
                            setAssignDialogOpen(true);
                          }}
                        >
                          Assign Rider
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Order Details Dialog */}
        <Dialog open={!!selectedOrder && !assignDialogOpen} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#02c30a] flex items-center justify-center text-white text-2xl">
                  📦
                </div>
                <div>
                  <DialogTitle className="text-3xl font-bold text-[#085e54]">{selectedOrder?.order_number}</DialogTitle>
                  <p className="text-[#085e54]/60 font-medium">Order Details</p>
                </div>
              </div>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-6 mt-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-[#ddf8c6] rounded-2xl p-5">
                    <p className="text-xs text-[#085e54]/70 font-bold uppercase tracking-wide">Total Amount</p>
                    <p className="text-3xl font-bold text-[#02c30a] mt-1">{formatCurrency(selectedOrder.total_amount)}</p>
                  </div>
                  <div className="bg-[#ddf8c6] rounded-2xl p-5">
                    <p className="text-xs text-[#085e54]/70 font-bold uppercase tracking-wide">Payment</p>
                    <p className="text-2xl font-bold text-[#085e54] mt-1 capitalize">{selectedOrder.payment_method || 'Cash'}</p>
                  </div>
                  <div className="bg-[#085e54] rounded-2xl p-5">
                    <p className="text-xs text-white/70 font-bold uppercase tracking-wide">Status</p>
                    <p className="text-2xl font-bold text-white mt-1 capitalize">
                      {selectedOrder.status.replace('_', ' ')}
                    </p>
                  </div>
                  <div className="bg-[#ddf8c6] rounded-2xl p-5">
                    <p className="text-xs text-[#085e54]/70 font-bold uppercase tracking-wide">Pickup</p>
                    <p className="text-xl font-bold text-[#085e54] mt-1">{selectedOrder.pickup_date || 'TBD'}</p>
                    <p className="text-sm text-[#085e54]/60 font-medium">{selectedOrder.pickup_time_slot}</p>
                  </div>
                </div>

                {/* Customer & Address */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white border-2 border-[#ddf8c6] rounded-2xl p-6">
                    <h3 className="font-bold text-[#085e54] text-lg mb-4 flex items-center gap-3">
                      <span className="w-10 h-10 rounded-xl bg-[#ddf8c6] flex items-center justify-center text-[#085e54]">👤</span>
                      Customer
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-[#085e54]/50 uppercase font-bold tracking-wide">Name</p>
                        <p className="font-semibold text-[#085e54] text-lg">{selectedOrder.customer_name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#085e54]/50 uppercase font-bold tracking-wide">Phone</p>
                        <p className="font-semibold text-[#085e54] text-lg">{selectedOrder.customer_phone}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border-2 border-[#ddf8c6] rounded-2xl p-6">
                    <h3 className="font-bold text-[#085e54] text-lg mb-4 flex items-center gap-3">
                      <span className="w-10 h-10 rounded-xl bg-[#ddf8c6] flex items-center justify-center text-[#02c30a]">📍</span>
                      Delivery Address
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-[#085e54]/50 uppercase font-bold">Type</p>
                        <p className="capitalize font-medium text-[#085e54]">{selectedOrder.location_type || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#085e54]/50 uppercase font-bold">Flat/House</p>
                        <p className="font-medium text-[#085e54]">{selectedOrder.flat_house_no || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#085e54]/50 uppercase font-bold">Floor</p>
                        <p className="font-medium text-[#085e54]">{selectedOrder.floor_no || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#085e54]/50 uppercase font-bold">Block</p>
                        <p className="font-medium text-[#085e54]">{selectedOrder.block || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#085e54]/50 uppercase font-bold">Road</p>
                        <p className="font-medium text-[#085e54]">{selectedOrder.road_no || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#085e54]/50 uppercase font-bold">City</p>
                        <p className="font-medium text-[#085e54]">{selectedOrder.city || 'N/A'}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-[#085e54]/50 uppercase font-bold">Governorate</p>
                        <p className="font-medium text-[#085e54]">{selectedOrder.governorate || 'N/A'}</p>
                      </div>
                      {selectedOrder.latitude && selectedOrder.longitude && (
                        <div className="col-span-2">
                          <p className="text-xs text-[#085e54]/50 uppercase font-bold">Coordinates</p>
                          <p className="text-sm font-mono text-[#085e54]/70">{selectedOrder.latitude}, {selectedOrder.longitude}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="bg-white border-2 border-[#ddf8c6] rounded-2xl p-6">
                  <h3 className="font-bold text-[#085e54] text-lg mb-4 flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-[#ddf8c6] flex items-center justify-center">🛒</span>
                    Order Items
                  </h3>
                  <div className="space-y-3">
                    {selectedOrder.items?.map((item, index) => (
                      <div key={index} className="flex items-center justify-between py-4 border-b border-[#ddf8c6] last:border-0">
                        <div className="flex-1">
                          <p className="font-semibold text-[#085e54] text-lg">{item.name}</p>
                          {item.type && (
                            <span className="text-xs bg-[#ddf8c6] text-[#085e54] px-2 py-1 rounded font-medium">{item.type}</span>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-[#085e54]/60 font-medium">{formatCurrency(item.price)} × {item.quantity || item.qty}</p>
                          <p className="font-bold text-[#085e54] text-lg">{formatCurrency((item.price) * (item.quantity || item.qty || 1))}</p>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between pt-5 border-t-2 border-[#085e54]">
                      <span className="text-xl font-bold text-[#085e54]">Total</span>
                      <span className="text-3xl font-bold text-[#02c30a]">{formatCurrency(selectedOrder.total_amount)}</span>
                    </div>
                  </div>
                </div>

                {/* Rider */}
                <div className="bg-white border-2 border-[#ddf8c6] rounded-2xl p-6">
                  <h3 className="font-bold text-[#085e54] text-lg mb-4 flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-[#ddf8c6] flex items-center justify-center">🏍️</span>
                    Rider Assignment
                  </h3>
                  {selectedOrder.rider_name ? (
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-[#02c30a] flex items-center justify-center text-white font-bold text-xl">
                        {selectedOrder.rider_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-[#085e54] text-xl">{selectedOrder.rider_name}</p>
                        <p className="text-[#085e54]/60 font-medium">{selectedOrder.rider_mobile}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[#085e54]/50 font-medium">No rider assigned yet</p>
                  )}
                </div>

                {/* Timestamps */}
                <div className="bg-white border-2 border-[#ddf8c6] rounded-2xl p-6">
                  <h3 className="font-bold text-[#085e54] text-lg mb-4 flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-[#ddf8c6] flex items-center justify-center">🕐</span>
                    Timeline
                  </h3>
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <p className="text-xs text-[#085e54]/50 uppercase font-bold tracking-wide">Order Placed</p>
                      <p className="font-medium text-[#085e54]">{selectedOrder.order_timestamp ? formatDate(selectedOrder.order_timestamp) : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#085e54]/50 uppercase font-bold tracking-wide">Created</p>
                      <p className="font-medium text-[#085e54]">{formatDate(selectedOrder.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#085e54]/50 uppercase font-bold tracking-wide">Last Updated</p>
                      <p className="font-medium text-[#085e54]">{formatDate(selectedOrder.updated_at)}</p>
                    </div>
                  </div>
                </div>

                {/* Raw JSON */}
                <details className="bg-[#085e54] rounded-2xl overflow-hidden">
                  <summary className="px-6 py-4 cursor-pointer text-white/80 hover:text-white font-semibold">
                    View Raw JSON Data
                  </summary>
                  <pre className="px-6 pb-6 text-xs text-[#02c30a] overflow-x-auto max-h-96 font-mono">
                    {JSON.stringify(selectedOrder, null, 2)}
                  </pre>
                </details>

                {/* Update Status */}
                <div className="bg-white border-2 border-[#ddf8c6] rounded-2xl p-6">
                  <h3 className="font-bold text-[#085e54] text-lg mb-4">Update Status</h3>
                  <Select
                    value={selectedOrder.status}
                    onValueChange={(value) => handleStatusUpdate(selectedOrder.id, value)}
                  >
                    <SelectTrigger className="w-full md:w-72 border-2 border-[#085e54] text-[#085e54] font-semibold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">⏳ Pending</SelectItem>
                      <SelectItem value="assigned">👤 Assigned</SelectItem>
                      <SelectItem value="picked_up">📦 Picked Up</SelectItem>
                      <SelectItem value="delivered">✓ Delivered</SelectItem>
                      <SelectItem value="cancelled">✕ Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Assign Rider Dialog */}
        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <span className="w-12 h-12 rounded-2xl bg-[#02c30a] flex items-center justify-center text-white text-xl">
                  🏍️
                </span>
                <span className="text-2xl font-bold text-[#085e54]">Assign Rider</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 mt-4">
              <div className="bg-[#ddf8c6]/50 rounded-xl p-4">
                <p className="text-sm text-[#085e54]/60 font-medium">Order</p>
                <p className="font-bold text-[#085e54] text-xl">{selectedOrder?.order_number}</p>
                <p className="text-[#085e54]/70 font-medium">{selectedOrder?.customer_name}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-[#085e54] font-bold">Select Rider</Label>
                <Select value={selectedRiderId} onValueChange={setSelectedRiderId}>
                  <SelectTrigger className="border-2 border-[#085e54]/20 focus:border-[#02c30a]">
                    <SelectValue placeholder="Choose a rider..." />
                  </SelectTrigger>
                  <SelectContent>
                    {riders.map((rider) => (
                      <SelectItem key={rider.id} value={rider.id.toString()}>
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-full bg-[#02c30a] text-white flex items-center justify-center font-bold">
                            {rider.name.charAt(0)}
                          </span>
                          <span className="font-medium">{rider.name} • {rider.mobile}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setAssignDialogOpen(false)}
                  className="flex-1 border-2 border-[#085e54] text-[#085e54] hover:bg-[#085e54] hover:text-white font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAssignRider}
                  disabled={!selectedRiderId}
                  className="flex-1 bg-[#02c30a] hover:bg-[#02c30a]/90 text-white font-semibold"
                >
                  Assign Rider
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

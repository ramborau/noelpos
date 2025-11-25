'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { getQuickDistanceEstimate } from '@/lib/distance-service';
import { formatPhoneWithCountry } from '@/lib/phone-utils';
import { MapPin, Clock, Navigation, Phone, ExternalLink, Copy } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog as MapDialog,
  DialogContent as MapDialogContent,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';

// Shop location for distance calculation
const SHOP_LOCATION = {
  lat: 26.125805,
  lng: 50.562897,
  name: 'Euro Plaza Building, Riffa'
};

// WhatsApp Icon Component
const WhatsAppIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 32 32" className="w-[18px] h-[18px] text-[#02c30a]">
    <path d="M26.576 5.363c-2.69-2.69-6.406-4.354-10.511-4.354-8.209 0-14.865 6.655-14.865 14.865 0 2.732 0.737 5.291 2.022 7.491l-0.038-0.070-2.109 7.702 7.879-2.067c2.051 1.139 4.498 1.809 7.102 1.809h0.006c8.209-0.003 14.862-6.659 14.862-14.868 0-4.103-1.662-7.817-4.349-10.507l0 0zM16.062 28.228h-0.005c-0 0-0.001 0-0.001 0-2.319 0-4.489-0.64-6.342-1.753l0.056 0.031-0.451-0.267-4.675 1.227 1.247-4.559-0.294-0.467c-1.185-1.862-1.889-4.131-1.889-6.565 0-6.822 5.531-12.353 12.353-12.353s12.353 5.531 12.353 12.353c0 6.822-5.53 12.353-12.353 12.353h-0zM22.838 18.977c-0.371-0.186-2.197-1.083-2.537-1.208-0.341-0.124-0.589-0.185-0.837 0.187-0.246 0.371-0.958 1.207-1.175 1.455-0.216 0.249-0.434 0.279-0.805 0.094-1.15-0.466-2.138-1.087-2.997-1.852l0.010 0.009c-0.799-0.74-1.484-1.587-2.037-2.521l-0.028-0.052c-0.216-0.371-0.023-0.572 0.162-0.757 0.167-0.166 0.372-0.434 0.557-0.65 0.146-0.179 0.271-0.384 0.366-0.604l0.006-0.017c0.043-0.087 0.068-0.188 0.068-0.296 0-0.131-0.037-0.253-0.101-0.357l0.002 0.003c-0.094-0.186-0.836-2.014-1.145-2.758-0.302-0.724-0.609-0.625-0.836-0.637-0.216-0.010-0.464-0.012-0.712-0.012-0.395 0.010-0.746 0.188-0.988 0.463l-0.001 0.002c-0.802 0.761-1.3 1.834-1.3 3.023 0 0.026 0 0.053 0.001 0.079l-0-0.004c0.131 1.467 0.681 2.784 1.527 3.857l-0.012-0.015c1.604 2.379 3.742 4.282 6.251 5.564l0.094 0.043c0.548 0.248 1.25 0.513 1.968 0.74l0.149 0.041c0.442 0.14 0.951 0.221 1.479 0.221 0.303 0 0.601-0.027 0.889-0.078l-0.031 0.004c1.069-0.223 1.956-0.868 2.497-1.749l0.009-0.017c0.165-0.366 0.261-0.793 0.261-1.242 0-0.185-0.016-0.366-0.047-0.542l0.003 0.019c-0.092-0.155-0.34-0.247-0.712-0.434z"/>
  </svg>
);

// Status color configuration
const statusColorConfig: Record<string, { avatarBg: string; avatarText: string; filterBg: string; filterText: string }> = {
  pending: { avatarBg: '#FFF4D6', avatarText: '#F4A100', filterBg: '#FFF4D6', filterText: '#F4A100' },
  confirmed: { avatarBg: '#E8F5FF', avatarText: '#2D9CDB', filterBg: '#E8F5FF', filterText: '#2D9CDB' },
  in_progress: { avatarBg: '#ECEAFF', avatarText: '#6C63FF', filterBg: '#ECEAFF', filterText: '#6C63FF' },
  completed: { avatarBg: '#E7F8EF', avatarText: '#27AE60', filterBg: '#E7F8EF', filterText: '#27AE60' },
  cancelled: { avatarBg: '#FDEAEA', avatarText: '#EB5757', filterBg: '#FDEAEA', filterText: '#EB5757' },
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Rider {
  id: number;
  name: string;
  mobile: string;
}

interface ServiceRequest {
  id: number;
  request_number: string;
  customer_name: string;
  customer_mobile: string;
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
  service_date: string;
  service_time_slot: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  rider_id: number | null;
  rider_name: string | null;
  rider_mobile: string | null;
  rider_token: string | null;
  token_expires_at: string | null;
  notes: string;
  created_at: string;
}

// Send WhatsApp notification to rider for service request
async function sendWhatsAppNotification(rider: Rider, request: ServiceRequest) {
  const riderPhone = rider.mobile.replace(/[^0-9]/g, '');

  // Format service date
  const serviceDate = new Date(request.service_date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  let requestDetails = `🧺 *New Pickup Request*\n\n`;
  requestDetails += `Request: ${request.request_number}\n`;
  requestDetails += `Customer: ${request.customer_name}\n`;
  requestDetails += `Phone: ${request.customer_mobile}\n\n`;
  requestDetails += `📅 Pickup Date: ${serviceDate}`;
  if (request.service_time_slot) {
    requestDetails += `\n⏰ Time: ${request.service_time_slot}`;
  }
  if (request.notes) {
    requestDetails += `\n\n📝 Notes: ${request.notes}`;
  }

  // Build address
  const addressParts = [];
  if (request.flat_house_no) addressParts.push(`Flat ${request.flat_house_no}`);
  if (request.floor_no) addressParts.push(`Floor ${request.floor_no}`);
  if (request.block) addressParts.push(`Block ${request.block}`);
  if (request.road_no) addressParts.push(`Road ${request.road_no}`);
  if (request.city) addressParts.push(request.city);
  if (request.governorate) addressParts.push(request.governorate);
  const locationAddress = addressParts.length > 0 ? addressParts.join(', ') : request.formatted_address || 'Address not available';

  try {
    // Message 1: Request details with CTA to call customer
    const message1 = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: riderPhone,
      type: 'interactive',
      interactive: {
        type: 'cta_url',
        header: {
          type: 'text',
          text: request.request_number
        },
        body: {
          text: requestDetails
        },
        action: {
          name: 'cta_url',
          parameters: {
            display_text: `Call ${request.customer_name}`,
            url: `tel:${request.customer_mobile}`
          }
        },
        footer: {
          text: 'Tap to call customer'
        }
      }
    };

    const res1 = await fetch('/api/whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message1)
    });

    const data1 = await res1.json();
    console.log('WhatsApp Message 1 sent:', data1);

    // Message 2: Location (if coordinates available)
    if (request.latitude && request.longitude) {
      const message2 = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: riderPhone,
        type: 'location',
        location: {
          latitude: String(request.latitude),
          longitude: String(request.longitude),
          name: request.customer_name,
          address: locationAddress
        }
      };

      const res2 = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message2)
      });

      const data2 = await res2.json();
      console.log('WhatsApp Message 2 (location) sent:', data2);
    }

    return data1.success;
  } catch (error) {
    console.error('WhatsApp notification error:', error);
    return false;
  }
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default function ServiceRequestsPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedRider, setSelectedRider] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [mapDialogOpen, setMapDialogOpen] = useState(false);
  const [selectedRequestForMap, setSelectedRequestForMap] = useState<ServiceRequest | null>(null);

  // Filter options
  const [filterOptions, setFilterOptions] = useState({
    cities: [] as string[],
    governorates: [] as string[],
  });

  // Advanced filters for city/governorate
  const [advancedFilters, setAdvancedFilters] = useState({
    cities: [] as string[],
    governorates: [] as string[],
  });

  const fetchData = async () => {
    try {
      const [reqRes, riderRes] = await Promise.all([
        fetch(`${API_URL}/service-requests/list.php`),
        fetch(`${API_URL}/riders/list.php`),
      ]);

      const reqData = await reqRes.json();
      const riderData = await riderRes.json();

      if (reqData.success) {
        const reqs: ServiceRequest[] = reqData.data;
        setRequests(reqs);
        setStatusCounts(reqData.status_counts || {});

        // Extract filter options
        const cities = [...new Set(reqs.map(r => r.city).filter(Boolean))] as string[];
        const governorates = [...new Set(reqs.map(r => r.governorate).filter(Boolean))] as string[];
        setFilterOptions({ cities, governorates });
      }
      if (riderData.success) {
        setRiders(riderData.data.filter((r: Rider & { status: string }) => r.status === 'active'));
      }
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAssignDialog = (request: ServiceRequest) => {
    setSelectedRequest(request);
    setSelectedRider(request.rider_id?.toString() || '');
    setSelectedStatus(request.status);
    setAssignDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedRequest) return;

    const isAssigningRider = selectedRider && (!selectedRequest.rider_id || selectedRequest.rider_id.toString() !== selectedRider);

    try {
      // If assigning a rider, use the dedicated assign-rider endpoint
      if (isAssigningRider) {
        const result = await api.assignRiderToServiceRequest(selectedRequest.id, parseInt(selectedRider));

        if (result.success) {
          toast.success('Rider assigned successfully');

          // Send WhatsApp notification from frontend
          const rider = riders.find(r => r.id.toString() === selectedRider);
          if (rider) {
            toast.info('Sending WhatsApp notification to rider...');
            const whatsappSent = await sendWhatsAppNotification(rider, selectedRequest);
            if (whatsappSent) {
              toast.success('WhatsApp notification sent to rider');
            } else {
              toast.warning('Rider assigned but WhatsApp notification failed');
            }
          }

          // If status also needs to be updated (beyond 'confirmed' which assign-rider sets)
          if (selectedStatus && selectedStatus !== 'confirmed') {
            await fetch(`${API_URL}/service-requests/update.php`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: selectedRequest.id,
                status: selectedStatus,
              }),
            });
          }
        } else {
          toast.error(result.message || 'Failed to assign rider');
        }
      } else {
        // Just updating status or removing rider
        const res = await fetch(`${API_URL}/service-requests/update.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: selectedRequest.id,
            rider_id: selectedRider ? parseInt(selectedRider) : null,
            status: selectedStatus,
          }),
        });

        const data = await res.json();
        if (data.success) {
          toast.success('Service request updated');
        } else {
          toast.error(data.message);
          return;
        }
      }

      setAssignDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Update failed');
    }
  };

  const copyRiderLink = (token: string) => {
    const link = `${window.location.origin}/rider/${token}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(token);
    toast.success('Rider link copied to clipboard');
    setTimeout(() => setCopiedLink(null), 2000);
  };

  // Direct assign handler for inline rider select
  const handleDirectAssign = async (request: ServiceRequest, riderId: string) => {
    try {
      const result = await api.assignRiderToServiceRequest(request.id, parseInt(riderId));

      if (result.success) {
        toast.success('Rider assigned successfully');

        // Send WhatsApp notification
        const rider = riders.find(r => r.id.toString() === riderId);
        if (rider) {
          toast.info('Sending WhatsApp notification to rider...');
          const whatsappSent = await sendWhatsAppNotification(rider, request);
          if (whatsappSent) {
            toast.success('WhatsApp notification sent to rider');
          } else {
            toast.warning('Rider assigned but WhatsApp notification failed');
          }
        }

        fetchData();
      } else {
        toast.error(result.message || 'Failed to assign rider');
      }
    } catch (error) {
      console.error('Assign error:', error);
      toast.error('Failed to assign rider');
    }
  };

  const filteredRequests = requests.filter((r) => {
    // Status filter
    if (filterStatus && r.status !== filterStatus) return false;

    // City filter
    if (advancedFilters.cities.length > 0 && !advancedFilters.cities.includes(r.city)) return false;

    // Governorate filter
    if (advancedFilters.governorates.length > 0 && !advancedFilters.governorates.includes(r.governorate)) return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        r.request_number.toLowerCase().includes(query) ||
        r.customer_name.toLowerCase().includes(query) ||
        r.customer_mobile.includes(query) ||
        (r.rider_name && r.rider_name.toLowerCase().includes(query))
      );
    }

    return true;
  });

  // Toggle city selection
  const toggleCityFilter = (city: string) => {
    setAdvancedFilters(f => ({
      ...f,
      cities: f.cities.includes(city)
        ? f.cities.filter(c => c !== city)
        : [...f.cities, city]
    }));
  };

  // Toggle governorate selection
  const toggleGovernorateFilter = (gov: string) => {
    setAdvancedFilters(f => ({
      ...f,
      governorates: f.governorates.includes(gov)
        ? f.governorates.filter(g => g !== gov)
        : [...f.governorates, gov]
    }));
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const buildAddress = (req: ServiceRequest) => {
    const parts = [];
    if (req.flat_house_no) parts.push(`Flat ${req.flat_house_no}`);
    if (req.floor_no) parts.push(`Floor ${req.floor_no}`);
    if (req.block) parts.push(`Block ${req.block}`);
    if (req.road_no) parts.push(`Road ${req.road_no}`);
    if (req.city) parts.push(req.city);
    if (req.governorate) parts.push(req.governorate);
    return parts.length > 0 ? parts.join(', ') : req.formatted_address || 'No address';
  };

  // Open Google Maps popup
  const handleOpenDirections = (req: ServiceRequest, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedRequestForMap(req);
    setMapDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold" style={{ color: '#085e54' }}>Service Requests</h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-100 px-3 py-1.5 rounded-full font-medium">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Live
            </div>
            <Button
              onClick={() => fetchData()}
              size="sm"
              style={{ backgroundColor: '#02c30a' }}
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by request, customer, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>

        {/* Status Filter Pills + City/Governorate Filters */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Left: Status filters */}
          <div className="flex flex-wrap gap-2">
            <button
              className="px-3 py-1.5 rounded-full text-sm font-medium transition-all"
              style={{
                backgroundColor: !filterStatus ? '#374151' : '#E5E7EB',
                color: !filterStatus ? '#FFFFFF' : '#374151',
              }}
              onClick={() => setFilterStatus('')}
            >
              All ({requests.length})
            </button>
            {Object.entries(statusLabels).map(([status, label]) => {
              const colors = statusColorConfig[status] || statusColorConfig.pending;
              return (
                <button
                  key={status}
                  className="px-3 py-1.5 rounded-full text-sm font-medium transition-all"
                  style={{
                    backgroundColor: filterStatus === status ? colors.filterText : colors.filterBg,
                    color: filterStatus === status ? '#FFFFFF' : colors.filterText,
                  }}
                  onClick={() => setFilterStatus(status)}
                >
                  {label} ({statusCounts[status] || 0})
                </button>
              );
            })}
          </div>

          {/* Right: City & Governorate filters */}
          <div className="flex items-center gap-2">
            {/* City Multi-Select */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="h-9 px-3 text-sm font-medium"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  City
                  {advancedFilters.cities.length > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
                      {advancedFilters.cities.length}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="end">
                <div className="space-y-1">
                  <div className="flex justify-between items-center pb-2 border-b mb-2">
                    <span className="text-sm font-medium">Select Cities</span>
                    {advancedFilters.cities.length > 0 && (
                      <button
                        onClick={() => setAdvancedFilters(f => ({ ...f, cities: [] }))}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  {filterOptions.cities.length === 0 ? (
                    <p className="text-sm text-gray-500 py-2">No cities available</p>
                  ) : (
                    filterOptions.cities.map(city => (
                      <label
                        key={city}
                        className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-100 cursor-pointer"
                      >
                        <Checkbox
                          checked={advancedFilters.cities.includes(city)}
                          onCheckedChange={() => toggleCityFilter(city)}
                        />
                        <span className="text-sm">{city}</span>
                      </label>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* Governorate Multi-Select */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="h-9 px-3 text-sm font-medium"
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Governorate
                  {advancedFilters.governorates.length > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
                      {advancedFilters.governorates.length}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="end">
                <div className="space-y-1">
                  <div className="flex justify-between items-center pb-2 border-b mb-2">
                    <span className="text-sm font-medium">Select Governorates</span>
                    {advancedFilters.governorates.length > 0 && (
                      <button
                        onClick={() => setAdvancedFilters(f => ({ ...f, governorates: [] }))}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  {filterOptions.governorates.length === 0 ? (
                    <p className="text-sm text-gray-500 py-2">No governorates available</p>
                  ) : (
                    filterOptions.governorates.map(gov => (
                      <label
                        key={gov}
                        className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-100 cursor-pointer"
                      >
                        <Checkbox
                          checked={advancedFilters.governorates.includes(gov)}
                          onCheckedChange={() => toggleGovernorateFilter(gov)}
                        />
                        <span className="text-sm">{gov}</span>
                      </label>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Results Count */}
        <p className="text-sm text-gray-500">
          Showing {filteredRequests.length} of {requests.length} service requests
        </p>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">No service requests found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredRequests.map((req) => {
              const statusColors = statusColorConfig[req.status] || statusColorConfig.pending;
              const initials = req.customer_name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';
              const phoneDigits = req.customer_mobile?.replace(/[^0-9]/g, '') || '';
              const phoneData = formatPhoneWithCountry(req.customer_mobile || '');
              const riderLink = req.rider_token ? `${window.location.origin}/rider/${req.rider_token}` : '';

              // Calculate distance
              const distance = req.latitude && req.longitude
                ? getQuickDistanceEstimate(req.latitude, req.longitude)
                : null;
              const eta = distance ? Math.round(parseFloat(distance) * 3) : null;

              return (
                <Card key={req.id} className="hover:shadow-lg transition-shadow flex flex-col p-0 gap-0 overflow-hidden">
                  {/* Card Content */}
                  <CardContent className="p-4 flex-1" style={{ paddingBottom: 0 }}>
                    {/* Customer Row with Avatar, Name, Phone Icons */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex gap-2.5 min-w-[70%]">
                        {/* Avatar with status color */}
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0"
                          style={{ backgroundColor: statusColors.avatarBg, color: statusColors.avatarText }}
                        >
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 text-lg truncate">{req.customer_name}</p>
                          <span className="inline-flex items-center gap-2 text-sm text-gray-500">
                            <span className={`fi fi-${phoneData.countryCode.toLowerCase()} rounded-sm`} style={{ width: '20px', height: '15px' }}></span>
                            <span>{phoneData.formattedNumber}</span>
                          </span>
                        </div>
                      </div>
                      {/* WhatsApp & Phone Icons */}
                      <div className="flex gap-2">
                        <a
                          href={`https://wa.me/${phoneDigits}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2.5 rounded-full hover:opacity-80 transition-opacity"
                          style={{ backgroundColor: '#dcfce6' }}
                        >
                          <WhatsAppIcon />
                        </a>
                        <a
                          href={`tel:${phoneDigits}`}
                          className="p-2.5 rounded-full hover:opacity-80 transition-opacity"
                          style={{ backgroundColor: '#dcfce6' }}
                        >
                          <Phone className="w-[18px] h-[18px] text-[#02c30a]" />
                        </a>
                      </div>
                    </div>

                    {/* Request Number Row */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold text-gray-900">#{req.request_number}</span>
                      {req.rider_name && (
                        <span className="text-sm text-gray-500">Rider: <span className="font-medium text-gray-700">{req.rider_name}</span></span>
                      )}
                    </div>

                    {/* Distance / Time / City Row */}
                    <div
                      className="flex items-center text-sm text-gray-500"
                      style={{ margin: 0, borderTop: '1px solid #e3e3e3', borderBottom: '1px solid #e3e3e3' }}
                    >
                      <div className="flex items-center gap-1 py-2" style={{ width: '33%' }}>
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>{distance || 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-center gap-1 py-2" style={{ width: '33%' }}>
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>{eta ? `${eta} M` : 'N/A'}</span>
                      </div>
                      {/* City with Tooltip - Click to open directions */}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              className="flex items-center justify-center gap-1 cursor-pointer hover:bg-green-100 transition-colors"
                              style={{
                                width: '33%',
                                margin: '5px 0',
                                padding: '10px 0',
                                borderRadius: '7px',
                                backgroundColor: '#f0fdf4'
                              }}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (req.latitude && req.longitude) {
                                  handleOpenDirections(req, e);
                                }
                              }}
                            >
                              <Navigation className="w-4 h-4" style={{ color: '#085e54' }} />
                              <span style={{ color: '#085e54' }}>{req.city || 'N/A'}</span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="text-sm">{buildAddress(req)}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    {/* Date & Time Row */}
                    <div className="flex gap-4 text-sm py-2.5">
                      <div style={{ width: '50%' }}>
                        <p className="text-gray-500">Date</p>
                        <p className="font-medium">{formatDate(req.service_date)}</p>
                      </div>
                      <div style={{ width: '50%' }}>
                        <p className="text-gray-500">Time</p>
                        <p className="font-medium">{req.service_time_slot || 'Not set'}</p>
                      </div>
                    </div>
                  </CardContent>

                  {/* Card Footer - Rider Select + Link Buttons */}
                  <div className="px-4 py-3 border-t bg-gray-50 flex items-center gap-2" style={{ borderRadius: '0px 0px 15px 15px' }}>
                    <Select
                      value={req.rider_id?.toString() || 'unassigned'}
                      onValueChange={(value) => {
                        if (value && value !== 'unassigned') {
                          setSelectedRequest(req);
                          setSelectedRider(value);
                          // Directly assign rider
                          handleDirectAssign(req, value);
                        }
                      }}
                    >
                      <SelectTrigger className="h-9 text-sm bg-white" style={{ width: '70%' }}>
                        <SelectValue placeholder="Select Rider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Select Rider</SelectItem>
                        {riders.map((rider) => (
                          <SelectItem key={rider.id} value={rider.id.toString()}>
                            {rider.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {/* Open Link Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 px-0"
                      style={{ width: '15%' }}
                      disabled={!req.rider_token}
                      onClick={() => {
                        if (riderLink) {
                          window.open(riderLink, '_blank');
                        }
                      }}
                      title="Open rider link in new tab"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    {/* Copy Link Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 px-0"
                      style={{ width: '15%' }}
                      disabled={!req.rider_token}
                      onClick={() => {
                        if (riderLink) {
                          navigator.clipboard.writeText(riderLink);
                          setCopiedLink(req.rider_token);
                          toast.success('Rider link copied to clipboard');
                          setTimeout(() => setCopiedLink(null), 2000);
                        }
                      }}
                      title="Copy rider link"
                    >
                      <Copy className={`w-4 h-4 ${copiedLink === req.rider_token ? 'text-green-600' : ''}`} />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Assign/Update Dialog */}
        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <DialogContent className="w-[700px] max-w-[700px]">
            <DialogHeader>
              <DialogTitle style={{ color: '#085e54' }}>
                Update Service Request
              </DialogTitle>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-4 py-4">
                <div className="p-3 rounded" style={{ backgroundColor: '#ddf8c6' }}>
                  <p className="font-medium">{selectedRequest.request_number}</p>
                  <p className="text-sm">{selectedRequest.customer_name}</p>
                  <p className="text-sm text-gray-600">{formatDate(selectedRequest.service_date)}</p>
                </div>

                <div>
                  <label className="text-sm font-medium">Status</label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Assign Rider</label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={selectedRider}
                    onChange={(e) => setSelectedRider(e.target.value)}
                  >
                    <option value="">No Rider Assigned</option>
                    {riders.map((rider) => (
                      <option key={rider.id} value={rider.id}>
                        {rider.name} ({rider.mobile})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate} style={{ backgroundColor: '#02c30a' }}>
                Update
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Google Maps Directions Dialog */}
        <MapDialog open={mapDialogOpen} onOpenChange={setMapDialogOpen}>
          <MapDialogContent className="w-[800px] max-w-[800px] p-0 overflow-hidden" style={{ gap: 0 }}>
            {selectedRequestForMap && selectedRequestForMap.latitude && selectedRequestForMap.longitude && (() => {
              const distance = getQuickDistanceEstimate(selectedRequestForMap.latitude, selectedRequestForMap.longitude);
              const eta = distance ? Math.round(parseFloat(distance) * 3) : null;
              const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${SHOP_LOCATION.lat},${SHOP_LOCATION.lng}&destination=${selectedRequestForMap.latitude},${selectedRequestForMap.longitude}&travelmode=driving`;
              const embedUrl = `https://www.google.com/maps/embed/v1/directions?key=AIzaSyD4uqm7MrsLtKbTS0-jJrjXkvGuvyso3Tg&origin=${SHOP_LOCATION.lat},${SHOP_LOCATION.lng}&destination=${selectedRequestForMap.latitude},${selectedRequestForMap.longitude}&mode=driving`;

              return (
                <>
                  {/* Header Bar with Route Info */}
                  <div className="px-4 py-2 flex items-center gap-4 bg-[#f0fdf4] border-y border-[#00c307]/20">
                    <div className="flex items-center gap-2">
                      <div>
                        <h2 className="font-semibold">Route to {selectedRequestForMap.city || 'Customer'}</h2>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-[#00c307] flex items-center justify-center">
                        <Navigation className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{distance || 'N/A'}</p>
                        <p className="text-xs text-gray-500">{eta} mins</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="ml-auto cursor-pointer"
                      style={{ backgroundColor: '#00c307' }}
                      onClick={() => window.open(googleMapsUrl, '_blank')}
                    >
                      <Navigation className="w-4 h-4 mr-1" />
                      Open in Google Maps
                    </Button>
                  </div>

                  {/* Full-size Map */}
                  <div className="relative" style={{ height: '500px' }}>
                    <iframe
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      loading="lazy"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                      src={embedUrl}
                    />
                  </div>
                </>
              );
            })()}
          </MapDialogContent>
        </MapDialog>
      </div>
    </DashboardLayout>
  );
}

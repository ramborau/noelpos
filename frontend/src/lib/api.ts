const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  });
  return response.json();
}

export const api = {
  // Auth
  login: (username: string, password: string) =>
    fetchAPI('/auth/login.php', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  // Orders
  getOrders: () => fetchAPI('/orders/list.php'),
  getOrder: (id: number) => fetchAPI(`/orders/get.php?id=${id}`),
  createOrder: (data: OrderInput) =>
    fetchAPI('/orders/create.php', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  assignRider: (orderId: number, riderId: number) =>
    fetchAPI('/orders/assign-rider.php', {
      method: 'POST',
      body: JSON.stringify({ order_id: orderId, rider_id: riderId }),
    }),
  updateOrderStatus: (orderId: number, status: string) =>
    fetchAPI('/orders/update-status.php', {
      method: 'POST',
      body: JSON.stringify({ order_id: orderId, status }),
    }),

  // Riders
  getRiders: () => fetchAPI('/riders/list.php'),
  createRider: (name: string, mobile: string) =>
    fetchAPI('/riders/create.php', {
      method: 'POST',
      body: JSON.stringify({ name, mobile }),
    }),
  deleteRider: (id: number) =>
    fetchAPI('/riders/delete.php', {
      method: 'POST',
      body: JSON.stringify({ id }),
    }),

  // Service Requests
  getServiceRequests: () => fetchAPI('/service-requests/list.php'),
  getServiceRequest: (id: number) => fetchAPI(`/service-requests/get.php?id=${id}`),
  createServiceRequest: (data: ServiceRequestInput) =>
    fetchAPI('/service-requests/create.php', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateServiceRequest: (id: number, data: Partial<ServiceRequestInput>) =>
    fetchAPI('/service-requests/update.php', {
      method: 'POST',
      body: JSON.stringify({ id, ...data }),
    }),
  deleteServiceRequest: (id: number) =>
    fetchAPI('/service-requests/delete.php', {
      method: 'POST',
      body: JSON.stringify({ id }),
    }),
  assignRiderToServiceRequest: (serviceRequestId: number, riderId: number) =>
    fetchAPI('/service-requests/assign-rider.php', {
      method: 'POST',
      body: JSON.stringify({ service_request_id: serviceRequestId, rider_id: riderId }),
    }),

  // Customers
  getCustomers: () => fetchAPI('/customers/list.php'),
  createCustomer: (data: CustomerInput) =>
    fetchAPI('/customers/create.php', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCustomer: (id: number, data: Partial<CustomerInput>) =>
    fetchAPI('/customers/update.php', {
      method: 'POST',
      body: JSON.stringify({ id, ...data }),
    }),

  // Services
  getServices: () => fetchAPI('/services/list.php'),

  // Categories
  getCategories: () => fetchAPI('/categories/list.php'),

  // Subcategories
  getSubcategories: () => fetchAPI('/subcategories/list.php'),

  // Settings
  getSettings: () => fetchAPI('/settings/get.php'),
  updateSettings: (data: Record<string, string>) =>
    fetchAPI('/settings/update.php', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export interface OrderItem {
  id?: string;
  name: string;
  type?: string;
  qty?: number;
  quantity?: number;
  price: number;
}

export interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  items: OrderItem[];
  total_amount: number;
  status: string;
  rider_id: number | null;
  rider_name: string | null;
  rider_mobile: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface OrderInput {
  customer_name: string;
  customer_phone?: string;
  customer_address?: string;
  items?: OrderItem[];
  total_amount: number;
  notes?: string;
}

export interface Rider {
  id: number;
  name: string;
  mobile: string;
  status: string;
  created_at: string;
}

export interface ServiceRequestInput {
  customer_id?: number;
  customer_name?: string;
  customer_phone?: string;
  address_id?: number;
  pickup_date?: string;
  pickup_time?: string;
  notes?: string;
  status?: string;
}

export interface CustomerInput {
  name: string;
  phone: string;
  email?: string;
}

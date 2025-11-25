'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface CartItem {
  id: number;
  name: string;
  type: string;
  price: number;
  quantity: number;
}

interface ServiceRequest {
  id: number;
  request_number: string;
  status: string;
  service_date: string;
  service_time_slot: string;
  notes: string;
  customer: {
    name: string;
    mobile: string;
  };
  address: {
    formatted_address: string;
    location_type: string;
    block: string;
    city: string;
    governorate: string;
    road_no: string;
    flat_house_no: string;
    floor_no: string;
    latitude: string;
    longitude: string;
  };
  rider: {
    name: string;
    mobile: string;
  };
  token_expires_at: string;
}

interface RiderContextType {
  serviceRequest: ServiceRequest | null;
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartItemCount: () => number;
  isLoading: boolean;
  error: string | null;
  token: string;
}

const RiderContext = createContext<RiderContextType | null>(null);

export function useRider() {
  const context = useContext(RiderContext);
  if (!context) {
    throw new Error('useRider must be used within RiderLayout');
  }
  return context;
}

export default function RiderLayout({ children }: { children: ReactNode }) {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [serviceRequest, setServiceRequest] = useState<ServiceRequest | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const validateToken = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}/rider-pickup/validate-token.php?token=${token}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          setError(data.message || 'Invalid or expired link');
          setIsLoading(false);
          return;
        }

        setServiceRequest(data.data);
        setIsLoading(false);
      } catch {
        setError('Unable to validate pickup link');
        setIsLoading(false);
      }
    };

    if (token) {
      validateToken();
    }
  }, [token]);

  const addToCart = (item: Omit<CartItem, 'quantity'>) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCart(prev => prev.map(i => i.id === id ? { ...i, quantity } : i));
  };

  const clearCart = () => setCart([]);

  const getCartTotal = () => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const getCartItemCount = () => cart.reduce((sum, item) => sum + item.quantity, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pickup details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Link Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <RiderContext.Provider value={{
      serviceRequest,
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartTotal,
      getCartItemCount,
      isLoading,
      error,
      token
    }}>
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    </RiderContext.Provider>
  );
}

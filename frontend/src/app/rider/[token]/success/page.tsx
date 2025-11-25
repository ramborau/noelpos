'use client';

import { useEffect, useState } from 'react';

interface OrderData {
  order_id: number;
  order_number: string;
  items_count: number;
  subtotal: number;
  total_amount: number;
  payment_method: string;
  status: string;
}

export default function RiderSuccessPage() {
  const [orderData, setOrderData] = useState<OrderData | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('lastOrder');
    if (stored) {
      setOrderData(JSON.parse(stored));
      sessionStorage.removeItem('lastOrder');
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-md w-full">
        {/* Success Animation */}
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-once">
          <svg className="w-12 h-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Created!</h1>
        <p className="text-gray-600 mb-6">The pickup has been completed successfully.</p>

        {orderData && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6 text-left">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Order Number</span>
                <span className="font-semibold text-gray-900">{orderData.order_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Items</span>
                <span className="font-medium">{orderData.items_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Payment</span>
                <span className="font-medium capitalize">{orderData.payment_method}</span>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="font-semibold text-gray-900">Total Amount</span>
                <span className="font-bold text-green-600">BHD {parseFloat(String(orderData.total_amount)).toFixed(3)}</span>
              </div>
            </div>
          </div>
        )}

        <div className="bg-green-50 rounded-xl p-4 mb-6">
          <p className="text-green-700 text-sm">
            <span className="font-semibold">Status:</span> Items Picked Up
          </p>
        </div>

        <button
          onClick={() => window.close()}
          className="w-full py-4 bg-gray-900 text-white rounded-xl font-semibold text-lg hover:bg-gray-800 transition-colors"
        >
          Done
        </button>
      </div>

      <style jsx>{`
        @keyframes bounce-once {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        .animate-bounce-once {
          animation: bounce-once 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRider } from '../layout';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function RiderConfirmPage() {
  const { cart, updateQuantity, getCartTotal, getCartItemCount, clearCart, token } = useRider();
  const router = useRouter();
  const params = useParams();
  const tokenParam = params.token as string;

  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cartTotal = getCartTotal();
  const cartItemCount = getCartItemCount();

  const handleConfirm = async () => {
    if (cart.length === 0) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/rider-pickup/create-order.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: tokenParam,
          items: cart.map(item => ({
            id: item.id,
            name: item.name,
            type: item.type,
            price: item.price,
            quantity: item.quantity
          })),
          payment_method: paymentMethod
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to create order');
      }

      // Store order data for success page
      sessionStorage.setItem('lastOrder', JSON.stringify(data.data));
      clearCart();
      router.push(`/rider/${tokenParam}/success`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Cart is Empty</h2>
          <p className="text-gray-500 mb-4">Add some items to continue</p>
          <Link
            href={`/rider/${tokenParam}/services`}
            className="inline-block px-6 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors"
          >
            Browse Services
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-32">
      {/* Header */}
      <div className="bg-white border-b p-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href={`/rider/${tokenParam}/services`} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold">Confirm Order</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Order Summary */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-gray-900">Order Summary</h2>
            <p className="text-sm text-gray-500">{cartItemCount} {cartItemCount === 1 ? 'item' : 'items'}</p>
          </div>
          <div className="divide-y">
            {cart.map(item => (
              <div key={item.id} className="p-4 flex items-center justify-between">
                <div className="flex-1 min-w-0 pr-4">
                  <h3 className="font-medium text-gray-900 truncate">{item.name}</h3>
                  <p className="text-sm text-gray-500">
                    BHD {item.price.toFixed(3)} x {item.quantity}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 bg-gray-100 rounded-lg">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-200 rounded-l-lg"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    <span className="w-6 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-200 rounded-r-lg"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                  <span className="font-semibold text-gray-900 w-20 text-right">
                    BHD {(item.price * item.quantity).toFixed(3)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex justify-between items-center text-lg">
            <span className="font-semibold text-gray-900">Total</span>
            <span className="font-bold text-green-600">BHD {cartTotal.toFixed(3)}</span>
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Payment Method</h2>
          <div className="space-y-2">
            <label className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${
              paymentMethod === 'cash' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
            }`}>
              <input
                type="radio"
                name="payment"
                value="cash"
                checked={paymentMethod === 'cash'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-4 h-4 text-green-500 focus:ring-green-500"
              />
              <span className="ml-3 font-medium">Pay on Pickup</span>
            </label>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl">
            {error}
          </div>
        )}
      </div>

      {/* Fixed Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg">
        <button
          onClick={handleConfirm}
          disabled={isSubmitting}
          className="w-full py-4 bg-green-500 text-white rounded-xl font-semibold text-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Creating Order...
            </>
          ) : (
            <>
              Confirm Order - BHD {cartTotal.toFixed(3)}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

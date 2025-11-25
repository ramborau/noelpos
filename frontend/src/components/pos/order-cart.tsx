'use client';

import { useRef, useEffect } from 'react';

interface CartItem {
  id: number;
  name: string;
  type: string;
  price: number;
  quantity: number;
}

interface OrderCartProps {
  items: CartItem[];
  onUpdateQuantity: (id: number, quantity: number) => void;
}

// Sound file path
const SERVICE_ADDED_SOUND = '/sounds/service-added.mp3';

export function OrderCart({ items, onUpdateQuantity }: OrderCartProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio(SERVICE_ADDED_SOUND);
    audioRef.current.volume = 0.5;
  }, []);

  const playSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  };

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <svg
          className="w-12 h-12 mx-auto text-gray-300 mb-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        <p className="text-gray-400 text-sm">No items selected</p>
        <p className="text-gray-300 text-xs mt-1">Add services from the left</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Items List */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
          >
            <div className="flex-1 min-w-0 pr-2">
              <p className="font-medium text-sm truncate">{item.name}</p>
              <p className="text-xs text-[#075e54] font-medium">
                BHD {item.price.toFixed(3)}
              </p>
            </div>

            {/* Quantity Spinner */}
            <div className="flex items-center gap-1 bg-white rounded-lg border">
              <button
                onClick={() => {
                  playSound();
                  onUpdateQuantity(item.id, item.quantity - 1);
                }}
                className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-l-lg transition-colors"
              >
                {item.quantity === 1 ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                )}
              </button>
              <span className="w-8 text-center font-semibold text-sm text-[#075e54]">
                {item.quantity}
              </span>
              <button
                onClick={() => {
                  playSound();
                  onUpdateQuantity(item.id, item.quantity + 1);
                }}
                className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-[#00c307] hover:bg-[#f0fdf4] rounded-r-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="pt-3 border-t">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Total</span>
          <span className="text-xl font-bold text-[#075e54]">
            BHD {total.toFixed(3)}
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          {items.length} {items.length === 1 ? 'item' : 'items'} • {items.reduce((sum, i) => sum + i.quantity, 0)} units
        </p>
      </div>
    </div>
  );
}

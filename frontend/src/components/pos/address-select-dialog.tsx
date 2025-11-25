'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getQuickDistanceEstimate } from '@/lib/distance-service';
import { getShortGovernorateName } from '@/lib/bahrain-data';
import { Home, Building2, MapPin, Check } from 'lucide-react';

interface Address {
  id: number;
  formatted_address: string;
  location_type: string;
  flat_house_no?: string;
  floor_no?: string;
  road_no?: string;
  block?: string;
  city?: string;
  governorate?: string;
  is_default?: boolean;
  latitude?: number;
  longitude?: number;
}

interface AddressSelectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  addresses: Address[];
  selectedAddress: Address | null;
  onSelect: (address: Address) => void;
}

export function AddressSelectDialog({
  open,
  onOpenChange,
  addresses,
  selectedAddress,
  onSelect,
}: AddressSelectDialogProps) {
  const [addressDistances, setAddressDistances] = useState<Record<number, string>>({});

  // Calculate distances when dialog opens
  useEffect(() => {
    if (open && addresses.length > 0) {
      const distances: Record<number, string> = {};
      addresses.forEach((addr) => {
        if (addr.latitude && addr.longitude) {
          distances[addr.id] = getQuickDistanceEstimate(addr.latitude, addr.longitude);
        }
      });
      setAddressDistances(distances);
    }
  }, [open, addresses]);

  const getAddressIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'home':
        return <Home className="w-5 h-5" />;
      case 'office':
        return <Building2 className="w-5 h-5" />;
      default:
        return <MapPin className="w-5 h-5" />;
    }
  };

  const handleSelect = (address: Address) => {
    onSelect(address);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[700px] max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Select Address</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 max-h-[400px] overflow-y-auto py-2">
          {addresses.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No addresses found</p>
          ) : (
            addresses.map((address) => {
              const distance = addressDistances[address.id];
              const isSelected = selectedAddress?.id === address.id;

              return (
                <button
                  key={address.id}
                  onClick={() => handleSelect(address)}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-[#00c307] bg-[#f0fdf4]'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: Address Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={isSelected ? 'text-[#00c307]' : 'text-gray-500'}>
                          {getAddressIcon(address.location_type)}
                        </span>
                        <span className="font-medium capitalize text-gray-700">
                          {address.location_type}
                        </span>
                        {address.is_default && (
                          <span className="text-xs px-2 py-0.5 rounded bg-[#00c307]/10 text-[#00c307]">
                            Default
                          </span>
                        )}
                      </div>

                      {/* Compact Address Display: City + Governorate */}
                      <p className="text-sm text-gray-600">
                        {address.city && (
                          <span className="font-medium">{address.city}</span>
                        )}
                        {address.city && address.governorate && ', '}
                        {address.governorate && (
                          <span>{getShortGovernorateName(address.governorate)}</span>
                        )}
                      </p>

                      {/* Additional details */}
                      {((address.block && address.block !== '0') || (address.road_no && address.road_no !== '0')) && (
                        <p className="text-xs text-gray-400 mt-1">
                          {address.block && address.block !== '0' && `Block ${address.block}`}
                          {address.block && address.block !== '0' && address.road_no && address.road_no !== '0' && ', '}
                          {address.road_no && address.road_no !== '0' && `Road ${address.road_no}`}
                          {address.flat_house_no && address.flat_house_no !== '0' && `, #${address.flat_house_no}`}
                        </p>
                      )}
                    </div>

                    {/* Right: Distance */}
                    {distance && (
                      <div className="flex items-center gap-1 text-sm text-gray-500 shrink-0">
                        <MapPin className="w-4 h-4" />
                        <span className="font-medium">{distance}</span>
                      </div>
                    )}
                  </div>

                  {/* Selection indicator */}
                  {isSelected && (
                    <div className="absolute right-4 top-4">
                      <Check className="w-5 h-5 text-[#00c307]" />
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

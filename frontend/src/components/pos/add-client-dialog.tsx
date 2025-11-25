'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PhoneInput } from '@/components/ui/phone-input';
import { AddressAutocomplete } from './address-autocomplete';
import { bahrainData, getShortGovernorateName, findGovernorateByCity, getCitiesByGovernorate } from '@/lib/bahrain-data';
import { toast } from 'sonner';
import { User, MapPin, Home, Building2 } from 'lucide-react';

interface AddClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClientCreated: (client: {
    id: number;
    name: string;
    mobile: string;
    address?: {
      id: number;
      formatted_address: string;
      location_type: string;
      flat_house_no: string;
      floor_no: string;
      road_no: string;
      block: string;
      city: string;
      governorate: string;
      latitude?: number;
      longitude?: number;
      place_id?: string;
    };
  }) => void;
}

type AddressType = 'home' | 'office' | 'other';

export function AddClientDialog({ open, onOpenChange, onClientCreated }: AddClientDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  // Personal Info
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');

  // Address
  const [addressType, setAddressType] = useState<AddressType>('home');
  const [formattedAddress, setFormattedAddress] = useState('');
  const [flatHouseNo, setFlatHouseNo] = useState('');
  const [floorNo, setFloorNo] = useState('');
  const [roadNo, setRoadNo] = useState('');
  const [block, setBlock] = useState('');
  const [city, setCity] = useState('');
  const [governorate, setGovernorate] = useState('Capital Governorate');
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [placeId, setPlaceId] = useState('');

  const resetForm = () => {
    setName('');
    setMobile('');
    setAddressType('home');
    setFormattedAddress('');
    setFlatHouseNo('');
    setFloorNo('');
    setRoadNo('');
    setBlock('');
    setCity('');
    setGovernorate('Capital Governorate');
    setLatitude(undefined);
    setLongitude(undefined);
    setPlaceId('');
    setPhoneError('');
  };

  const checkDuplicatePhone = async (phone: string) => {
    if (!phone || phone.length < 8) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${apiUrl}/customers/list.php?search=${encodeURIComponent(phone)}`);
      const data = await res.json();

      if (data.success && data.data.length > 0) {
        const exactMatch = data.data.find((c: { mobile: string }) => c.mobile === phone);
        if (exactMatch) {
          setPhoneError('This phone number is already registered');
          return true;
        }
      }
      setPhoneError('');
      return false;
    } catch {
      return false;
    }
  };

  const handlePlaceSelect = (place: {
    formatted_address: string;
    latitude: number;
    longitude: number;
    place_id: string;
    address_components?: any[];
    adr_address?: string;
  }) => {
    setFormattedAddress(place.formatted_address);
    setLatitude(place.latitude);
    setLongitude(place.longitude);
    setPlaceId(place.place_id);

    // Try to parse adr_address for Building, Block, Road
    if (place.adr_address) {
      // Example: "Building 119, Block 329 King Abdul Aziz Avenue, Salmaniya..."
      const adr = place.adr_address;

      // Extract Building number
      const buildingMatch = adr.match(/Building\s+(\d+)/i);
      if (buildingMatch) {
        setFlatHouseNo(buildingMatch[1]);
      }

      // Extract Block number
      const blockMatch = adr.match(/Block\s+(\d+)/i);
      if (blockMatch) {
        setBlock(blockMatch[1]);
      }

      // Extract Road number
      const roadMatch = adr.match(/Road\s+(\d+)/i);
      if (roadMatch) {
        setRoadNo(roadMatch[1]);
      }
    }

    // Try to extract address components - City first, then find governorate
    if (place.address_components) {
      let foundCity = '';

      // First pass: find city
      place.address_components.forEach(component => {
        const types = component.types;
        if (types.includes('locality') || types.includes('administrative_area_level_2') || types.includes('sublocality_level_1')) {
          foundCity = component.long_name;
        }
      });

      // If we found a city, try to find its governorate from our bh.json list
      if (foundCity) {
        const govName = findGovernorateByCity(foundCity);
        if (govName) {
          // City is in our list - set both city and governorate
          setCity(foundCity);
          setGovernorate(govName);
        } else {
          // City not in our list - clear city field and let user select manually
          setCity('');
        }
      } else {
        // No city found - fallback: try to extract governorate from administrative_area_level_1
        place.address_components.forEach(component => {
          const types = component.types;
          if (types.includes('administrative_area_level_1')) {
            const govName = bahrainData.governorates.find(g =>
              g.name.toLowerCase().includes(component.long_name.toLowerCase()) ||
              component.long_name.toLowerCase().includes(g.name.toLowerCase().split(' ')[0])
            )?.name;
            if (govName) setGovernorate(govName);
          }
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !mobile) {
      toast.error('Name and phone number are required');
      return;
    }

    if (phoneError) {
      toast.error('Please use a different phone number');
      return;
    }

    // Check for duplicate phone before submission
    const isDuplicate = await checkDuplicatePhone(mobile);
    if (isDuplicate) {
      toast.error('This phone number is already registered');
      return;
    }

    if (!roadNo.trim() || !block.trim() || !city || !governorate) {
      toast.error('Road No, Block No, City and Governorate are required');
      return;
    }

    setIsSubmitting(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      // Create customer
      const customerRes = await fetch(`${apiUrl}/customers/create.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), mobile })
      });

      const customerData = await customerRes.json();

      if (!customerData.success) {
        throw new Error(customerData.message || 'Failed to create customer');
      }

      const customerId = customerData.customer_id;

      // Create address
      const addressRes = await fetch(`${apiUrl}/addresses/create.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId,
          formatted_address: formattedAddress,
          location_type: addressType,
          flat_house_no: flatHouseNo,
          floor_no: floorNo,
          road_no: roadNo,
          block: block,
          city: city,
          governorate: governorate,
          latitude: latitude,
          longitude: longitude,
          place_id: placeId,
          is_default: true
        })
      });

      const addressData = await addressRes.json();

      if (!addressData.success) {
        throw new Error(addressData.message || 'Failed to create address');
      }

      toast.success('Client created successfully');

      onClientCreated({
        id: customerId,
        name: name.trim(),
        mobile,
        address: {
          id: addressData.address_id,
          formatted_address: formattedAddress,
          location_type: addressType,
          flat_house_no: flatHouseNo,
          floor_no: floorNo,
          road_no: roadNo,
          block: block,
          city: city,
          governorate: governorate,
          latitude,
          longitude,
          place_id: placeId
        }
      });

      resetForm();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create client');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get cities filtered by selected governorate
  const filteredCities = getCitiesByGovernorate(governorate);

  const handleGovernorateChange = (selectedGov: string) => {
    setGovernorate(selectedGov);
    // Clear city when governorate changes (it may not be valid for new governorate)
    setCity('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[700px] max-w-[700px] max-h-[90vh] overflow-y-auto p-0 gap-0" showCloseButton={false}>
        <DialogHeader className="p-4 pb-3 border-b">
          <DialogTitle>Add New Client</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          {/* Personal Information */}
          <div className="p-4 space-y-4 border-b">
            <div className="flex items-center gap-2 text-[#075e54]">
              <User className="w-5 h-5" />
              <h3 className="font-semibold">Personal Information</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-[46px]"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <PhoneInput
                defaultCountry="BH"
                value={mobile}
                onChange={(value) => {
                  setMobile(value || '');
                  setPhoneError('');
                }}
                onBlur={() => checkDuplicatePhone(mobile)}
                placeholder="Enter phone number"
              />
              {phoneError && (
                <p className="text-sm text-red-500">{phoneError}</p>
              )}
            </div>
          </div>

          {/* Service Address */}
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2 text-[#075e54]">
              <MapPin className="w-5 h-5" />
              <h3 className="font-semibold">Service Address</h3>
            </div>

            {/* Address Type */}
            <div className="space-y-2">
              <Label>Address Type</Label>
              <div className="flex gap-2">
                {(['home', 'office', 'other'] as AddressType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setAddressType(type)}
                    className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-lg border transition-colors ${
                      addressType === type
                        ? 'border-[#00c307] bg-[#f0fdf4] text-[#075e54]'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {type === 'home' && <Home className="w-5 h-5" />}
                    {type === 'office' && <Building2 className="w-5 h-5" />}
                    {type === 'other' && <MapPin className="w-5 h-5" />}
                    <span className="text-sm font-medium capitalize">{type}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Address Autocomplete */}
            <div className="space-y-2">
              <Label>Address *</Label>
              <AddressAutocomplete
                value={formattedAddress}
                onChange={setFormattedAddress}
                onPlaceSelect={handlePlaceSelect}
              />
            </div>

            {/* Flat/Floor Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="flatHouseNo">Flat / House No</Label>
                <Input
                  id="flatHouseNo"
                  placeholder="302"
                  value={flatHouseNo}
                  onChange={(e) => setFlatHouseNo(e.target.value)}
                  className="h-[46px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="floorNo">Floor No</Label>
                <Input
                  id="floorNo"
                  placeholder="3"
                  value={floorNo}
                  onChange={(e) => setFloorNo(e.target.value)}
                  className="h-[46px]"
                />
              </div>
            </div>

            {/* Road/Block Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="roadNo">Road No *</Label>
                <Input
                  id="roadNo"
                  placeholder="1523"
                  value={roadNo}
                  onChange={(e) => setRoadNo(e.target.value)}
                  className="h-[46px]"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="block">Block No *</Label>
                <Input
                  id="block"
                  placeholder="1062"
                  value={block}
                  onChange={(e) => setBlock(e.target.value)}
                  className="h-[46px]"
                  required
                />
              </div>
            </div>

            {/* Governorate first, then City (filtered by governorate) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Governorate *</Label>
                <Select value={governorate} onValueChange={handleGovernorateChange}>
                  <SelectTrigger className="w-full h-[46px]">
                    <SelectValue placeholder="Select Governorate" />
                  </SelectTrigger>
                  <SelectContent>
                    {bahrainData.governorates.map((gov) => (
                      <SelectItem key={gov.name} value={gov.name}>
                        {getShortGovernorateName(gov.name)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>City *</Label>
                <Select value={city} onValueChange={setCity}>
                  <SelectTrigger className="w-full h-[46px]">
                    <SelectValue placeholder="Select City" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCities.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Full-width Save Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 bg-[#00c307] hover:bg-[#00a506] text-white font-medium text-base rounded-b-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isSubmitting ? 'Saving...' : 'Save Client'}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

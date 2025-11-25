'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
declare const google: any;

import { useEffect, useRef, useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';

declare global {
  interface Window {
    google: any;
  }
}

interface Prediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect: (place: {
    formatted_address: string;
    latitude: number;
    longitude: number;
    place_id: string;
    address_components?: any[];
    adr_address?: string;
  }) => void;
  placeholder?: string;
  className?: string;
}

export function AddressAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  placeholder = "Start typing building name in Bahrain...",
  className
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteServiceRef = useRef<any>(null);
  const placesServiceRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkGoogle = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        setIsLoaded(true);
        return true;
      }
      return false;
    };

    if (checkGoogle()) return;

    const interval = setInterval(() => {
      if (checkGoogle()) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();

    // Create a dummy div for PlacesService
    const dummyDiv = document.createElement('div');
    placesServiceRef.current = new window.google.maps.places.PlacesService(dummyDiv);
  }, [isLoaded]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchPlaces = useCallback((query: string) => {
    if (!autocompleteServiceRef.current || query.length < 2) {
      setPredictions([]);
      return;
    }

    setIsSearching(true);
    autocompleteServiceRef.current.getPlacePredictions(
      {
        input: query,
        componentRestrictions: { country: 'bh' },
        types: ['establishment', 'geocode']
      },
      (results: any, status: any) => {
        setIsSearching(false);
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          setPredictions(results.map((r: any) => ({
            place_id: r.place_id,
            description: r.description,
            structured_formatting: {
              main_text: r.structured_formatting?.main_text || r.description,
              secondary_text: r.structured_formatting?.secondary_text || ''
            }
          })));
          setShowDropdown(true);
        } else {
          setPredictions([]);
        }
      }
    );
  }, []);

  const handleSelectPlace = (prediction: Prediction) => {
    if (!placesServiceRef.current) return;

    placesServiceRef.current.getDetails(
      {
        placeId: prediction.place_id,
        fields: ['formatted_address', 'geometry', 'place_id', 'address_components', 'adr_address']
      },
      (place: any, status: any) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place && place.geometry?.location) {
          const placeData = {
            formatted_address: place.formatted_address || prediction.description,
            latitude: place.geometry.location.lat(),
            longitude: place.geometry.location.lng(),
            place_id: place.place_id || prediction.place_id,
            address_components: place.address_components,
            adr_address: place.adr_address
          };

          onChange(placeData.formatted_address);
          onPlaceSelect(placeData);
        }
      }
    );

    setShowDropdown(false);
    setPredictions([]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    searchPlaces(newValue);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={() => predictions.length > 0 && setShowDropdown(true)}
        placeholder={placeholder}
        className={`pl-10 ${className || ''}`}
        autoComplete="off"
      />

      {/* Custom Dropdown */}
      {showDropdown && (predictions.length > 0 || isSearching) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-50 max-h-[250px] overflow-y-auto">
          {isSearching ? (
            <div className="p-3 text-center text-gray-500">
              <div className="w-5 h-5 border-2 border-[#00c307] border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : (
            predictions.map((prediction) => (
              <button
                key={prediction.place_id}
                type="button"
                onClick={() => handleSelectPlace(prediction)}
                className="w-full px-3 py-2.5 text-left hover:bg-[#f0fdf4] transition-colors border-b last:border-b-0 flex items-start gap-2"
              >
                <svg className="w-4 h-4 text-[#075e54] mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <div className="min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">
                    {prediction.structured_formatting.main_text}
                  </p>
                  {prediction.structured_formatting.secondary_text && (
                    <p className="text-xs text-gray-500 truncate">
                      {prediction.structured_formatting.secondary_text}
                    </p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

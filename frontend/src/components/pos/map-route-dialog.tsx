'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
declare const google: any;

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Navigation } from 'lucide-react';
import { getLaundryLocation } from '@/lib/distance-service';

interface MapRouteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  destinationLat: number;
  destinationLng: number;
  destinationName?: string;
}

// Custom map styles - clean theme with no POIs
const MAP_STYLES: any[] = [
  {
    featureType: 'all',
    elementType: 'labels.text',
    stylers: [{ color: '#878787' }],
  },
  {
    featureType: 'all',
    elementType: 'labels.text.stroke',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'landscape',
    elementType: 'all',
    stylers: [{ color: '#f9f5ed' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'all',
    stylers: [{ color: '#f5f5f5' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#c9c9c9' }],
  },
  {
    featureType: 'water',
    elementType: 'all',
    stylers: [{ color: '#aee0f4' }],
  },
  // Hide all POIs
  {
    featureType: 'poi',
    elementType: 'all',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'poi.business',
    elementType: 'all',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'poi.attraction',
    elementType: 'all',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'poi.government',
    elementType: 'all',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'poi.medical',
    elementType: 'all',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'all',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'poi.place_of_worship',
    elementType: 'all',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'poi.school',
    elementType: 'all',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'poi.sports_complex',
    elementType: 'all',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'transit',
    elementType: 'all',
    stylers: [{ visibility: 'off' }],
  },
];

export function MapRouteDialog({
  open,
  onOpenChange,
  destinationLat,
  destinationLng,
  destinationName = 'Destination',
}: MapRouteDialogProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const directionsRendererRef = useRef<any>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initMap = useCallback(async () => {
    if (!mapRef.current) return;

    // Check if Google Maps is available
    if (typeof google === 'undefined' || !google.maps) {
      setError('Google Maps not loaded');
      setIsLoading(false);
      return;
    }

    // Validate coordinates
    const destLat = typeof destinationLat === 'string' ? parseFloat(destinationLat) : destinationLat;
    const destLng = typeof destinationLng === 'string' ? parseFloat(destinationLng) : destinationLng;

    if (isNaN(destLat) || isNaN(destLng)) {
      setError('Invalid destination coordinates');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const laundryLocation = getLaundryLocation();
    const originLat = typeof laundryLocation.lat === 'string' ? parseFloat(laundryLocation.lat) : laundryLocation.lat;
    const originLng = typeof laundryLocation.lng === 'string' ? parseFloat(laundryLocation.lng) : laundryLocation.lng;

    const origin = { lat: originLat, lng: originLng };
    const destination = { lat: destLat, lng: destLng };

    // Create map
    const map = new google.maps.Map(mapRef.current, {
      center: origin,
      zoom: 12,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: true,
      styles: MAP_STYLES,
    });

    mapInstanceRef.current = map;

    // Add custom markers for origin and destination
    // Laundry marker (green)
    new google.maps.Marker({
      position: origin,
      map,
      title: 'LNDR Laundry',
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#00c307',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 3,
      },
      label: {
        text: 'L',
        color: '#ffffff',
        fontSize: '12px',
        fontWeight: 'bold',
      },
    });

    // Destination marker (red/orange)
    new google.maps.Marker({
      position: destination,
      map,
      title: destinationName,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#ef4444',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 3,
      },
      label: {
        text: 'D',
        color: '#ffffff',
        fontSize: '12px',
        fontWeight: 'bold',
      },
    });

    // Create directions service and renderer
    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer({
      map,
      suppressMarkers: true, // We use custom markers
      polylineOptions: {
        strokeColor: '#00c307',
        strokeWeight: 5,
        strokeOpacity: 0.8,
      },
    });

    directionsRendererRef.current = directionsRenderer;

    // Get route
    try {
      const result = await directionsService.route({
        origin,
        destination,
        travelMode: google.maps.TravelMode.DRIVING,
      });

      directionsRenderer.setDirections(result);

      // Extract route info
      const route = result.routes[0];
      if (route && route.legs[0]) {
        const leg = route.legs[0];
        setRouteInfo({
          distance: leg.distance?.text || '',
          duration: leg.duration?.text || '',
        });

        // Fit bounds to show entire route with padding
        const bounds = new google.maps.LatLngBounds();
        bounds.extend(origin);
        bounds.extend(destination);

        // Add all route points to bounds
        if (route.overview_path) {
          route.overview_path.forEach((point) => {
            bounds.extend(point);
          });
        }

        map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
      }
    } catch (err) {
      console.error('Error getting directions:', err);
      setError('Could not get directions');

      // Still show the two points even if directions fail
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(origin);
      bounds.extend(destination);
      map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
    } finally {
      setIsLoading(false);
    }
  }, [destinationLat, destinationLng, destinationName]);

  useEffect(() => {
    if (open) {
      // Small delay to ensure dialog is rendered
      const timer = setTimeout(() => {
        initMap();
      }, 100);
      return () => clearTimeout(timer);
    } else {
      // Cleanup when closing
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
        directionsRendererRef.current = null;
      }
      mapInstanceRef.current = null;
      setRouteInfo(null);
      setIsLoading(true);
      setError(null);
    }
  }, [open, initMap]);

  const openInGoogleMaps = () => {
    const laundryLocation = getLaundryLocation();
    const url = `https://www.google.com/maps/dir/?api=1&origin=${laundryLocation.lat},${laundryLocation.lng}&destination=${destinationLat},${destinationLng}&travelmode=driving`;
    window.open(url, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[800px] max-w-[800px] p-0 overflow-hidden" style={{ gap: 0 }} showCloseButton={false}>
        {/* Header Bar with Route Info */}
        <div className="px-4 py-2 flex items-center gap-4 bg-[#f0fdf4] border-y border-[#00c307]/20">
          <div className="flex items-center gap-2">
            <div>
              <h2 className="font-semibold">Route to {destinationName}</h2>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#00c307] flex items-center justify-center">
              <Navigation className="w-4 h-4 text-white" />
            </div>
            {routeInfo && (
              <div>
                <p className="text-sm font-semibold text-gray-800">{routeInfo.distance}</p>
                <p className="text-xs text-gray-500">{routeInfo.duration}</p>
              </div>
            )}
          </div>
          <Button
            onClick={openInGoogleMaps}
            size="sm"
            className="ml-auto bg-[#00c307] hover:bg-[#00a506] cursor-pointer"
          >
            <Navigation className="w-4 h-4 mr-1" />
            Open in Google Maps
          </Button>
        </div>

        {/* Error message */}
        {error && !isLoading && (
          <div className="px-4 py-2 bg-red-50 text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Map */}
        <div className="relative h-[500px]">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-4 border-[#00c307] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-gray-500">Loading map...</p>
              </div>
            </div>
          )}
          <div ref={mapRef} className="w-full h-full" />
        </div>
      </DialogContent>
    </Dialog>
  );
}

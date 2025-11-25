'use client';

import { useRider } from './layout';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function RiderDetailsPage() {
  const { serviceRequest } = useRider();
  const params = useParams();
  const token = params.token as string;

  if (!serviceRequest) return null;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const buildAddress = () => {
    const parts = [];
    if (serviceRequest.address.flat_house_no) parts.push(`Flat ${serviceRequest.address.flat_house_no}`);
    if (serviceRequest.address.floor_no) parts.push(`Floor ${serviceRequest.address.floor_no}`);
    if (serviceRequest.address.block) parts.push(`Block ${serviceRequest.address.block}`);
    if (serviceRequest.address.road_no) parts.push(`Road ${serviceRequest.address.road_no}`);
    if (serviceRequest.address.city) parts.push(serviceRequest.address.city);
    if (serviceRequest.address.governorate) parts.push(serviceRequest.address.governorate);
    return parts.length > 0 ? parts.join(', ') : serviceRequest.address.formatted_address || 'Address not available';
  };

  const openMaps = () => {
    const { latitude, longitude } = serviceRequest.address;
    if (latitude && longitude) {
      window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, '_blank');
    }
  };

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-500 text-white p-6">
        <div className="text-sm opacity-90 mb-1">Pickup Request</div>
        <h1 className="text-2xl font-bold">{serviceRequest.request_number}</h1>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Customer Card */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 font-bold text-lg">
                {serviceRequest.customer.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">{serviceRequest.customer.name}</h2>
              <p className="text-sm text-gray-500">Customer</p>
            </div>
          </div>
          <a
            href={`tel:${serviceRequest.customer.mobile}`}
            className="flex items-center justify-center gap-2 w-full py-3 bg-green-50 text-green-600 rounded-lg font-medium hover:bg-green-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Call {serviceRequest.customer.mobile}
          </a>
        </div>

        {/* Schedule Card */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Pickup Schedule
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Date</span>
              <span className="font-medium">{formatDate(serviceRequest.service_date)}</span>
            </div>
            {serviceRequest.service_time_slot && (
              <div className="flex justify-between">
                <span className="text-gray-500">Time</span>
                <span className="font-medium">{serviceRequest.service_time_slot}</span>
              </div>
            )}
          </div>
        </div>

        {/* Address Card */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Pickup Location
          </h3>
          <p className="text-gray-700 mb-3">{buildAddress()}</p>
          {serviceRequest.address.location_type && (
            <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full capitalize mb-3">
              {serviceRequest.address.location_type}
            </span>
          )}
          {serviceRequest.address.latitude && serviceRequest.address.longitude && (
            <button
              onClick={openMaps}
              className="flex items-center justify-center gap-2 w-full py-3 bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Open in Maps
            </button>
          )}
        </div>

        {/* Notes Card */}
        {serviceRequest.notes && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Notes
            </h3>
            <p className="text-gray-700">{serviceRequest.notes}</p>
          </div>
        )}
      </div>

      {/* Fixed Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg">
        <Link
          href={`/rider/${token}/services`}
          className="block w-full py-4 bg-green-500 text-white text-center rounded-xl font-semibold text-lg hover:bg-green-600 transition-colors"
        >
          Continue to Add Items
        </Link>
      </div>
    </div>
  );
}

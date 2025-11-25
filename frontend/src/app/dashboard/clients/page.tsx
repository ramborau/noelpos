'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { toast } from 'sonner';
import { PhoneDisplay } from '@/components/ui/phone-display';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Customer {
  id: number;
  name: string;
  mobile: string;
  address_count: number;
  order_count: number;
  active_orders: number;
  total_spent: string | null;
  created_at: string;
}

export default function ClientsPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [searchQuery]);

  const fetchCustomers = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);

      const res = await fetch(`${API_URL}/customers/list.php?${params}`);
      const data = await res.json();

      if (data.success) {
        setCustomers(data.data);
      } else {
        toast.error('Failed to fetch customers');
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      toast.error('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = filterActive
    ? customers.filter(c => c.active_orders > 0)
    : customers;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatCurrency = (amount: string | null) => {
    if (!amount) return 'BHD 0.000';
    return `BHD ${parseFloat(amount).toFixed(3)}`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold" style={{ color: '#085e54' }}>Clients</h1>
          {/* Search */}
          <div className="relative w-full sm:w-72">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2">
          <button
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              !filterActive
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            onClick={() => setFilterActive(false)}
          >
            All ({customers.length})
          </button>
          <button
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              filterActive
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            onClick={() => setFilterActive(true)}
          >
            Active Orders ({customers.filter(c => c.active_orders > 0).length})
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">No clients found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredCustomers.map((customer) => (
              <Link key={customer.id} href={`/dashboard/clients/${customer.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: '#ddf8c6' }}
                      >
                        <span className="font-bold" style={{ color: '#085e54' }}>
                          {getInitials(customer.name)}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 truncate">{customer.name}</h3>
                          {customer.active_orders > 0 && (
                            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
                              {customer.active_orders} Active
                            </span>
                          )}
                        </div>
                        <PhoneDisplay phone={customer.mobile} className="text-sm text-gray-500" />
                      </div>

                      {/* Stats */}
                      <div className="hidden sm:flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <p className="font-semibold text-gray-900">{customer.order_count}</p>
                          <p className="text-xs text-gray-500">Orders</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-gray-900">{customer.address_count}</p>
                          <p className="text-xs text-gray-500">Addresses</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold" style={{ color: '#02c30a' }}>
                            {formatCurrency(customer.total_spent)}
                          </p>
                          <p className="text-xs text-gray-500">Total Spent</p>
                        </div>
                      </div>

                      {/* Arrow */}
                      <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

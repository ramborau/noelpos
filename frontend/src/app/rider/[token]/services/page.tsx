'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRider } from '../layout';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

interface Service {
  id: number;
  item_name: string;
  type: string;
  price: string;
  currency: string;
  category_id: number;
  category_name: string;
  subcategory_id: number;
  subcategory_name: string;
}

interface Category {
  id: number;
  name: string;
}

interface Subcategory {
  id: number;
  name: string;
  category_id: number;
}

export default function RiderServicesPage() {
  const { cart, addToCart, updateQuantity, getCartTotal, getCartItemCount } = useRider();
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [search, setSearch] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingItemId, setLoadingItemId] = useState<number | null>(null);

  // Active pill states for scroll sync
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [activeSubcategory, setActiveSubcategory] = useState<string>('');

  // Refs for scroll sync
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const subcategoryRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const categoryPillsRef = useRef<HTMLDivElement>(null);
  const subcategoryPillsRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const fetchServices = async (searchQuery?: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const urlParams = new URLSearchParams();
      if (searchQuery) urlParams.append('search', searchQuery);

      const response = await fetch(`${apiUrl}/rider-pickup/get-services.php?${urlParams}`);
      const data = await response.json();

      if (data.success) {
        setServices(data.data);
        if (categories.length === 0) {
          setCategories(data.categories || []);
        }

        // Extract unique subcategories
        const subcatMap = new Map<number, Subcategory>();
        data.data.forEach((s: Service) => {
          if (!subcatMap.has(s.subcategory_id)) {
            subcatMap.set(s.subcategory_id, {
              id: s.subcategory_id,
              name: s.subcategory_name,
              category_id: s.category_id
            });
          }
        });
        setSubcategories(Array.from(subcatMap.values()));

        // Set initial active category
        if (data.categories?.length > 0 && !activeCategory) {
          setActiveCategory(data.categories[0].name);
        }
      }
    } catch (error) {
      console.error('Failed to fetch services:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Intersection Observer for scroll sync
  useEffect(() => {
    if (isLoading || services.length === 0) return;

    const observerOptions = {
      root: null,
      rootMargin: '-100px 0px -60% 0px',
      threshold: 0
    };

    const categoryObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const categoryName = entry.target.getAttribute('data-category');
          if (categoryName) {
            setActiveCategory(categoryName);
            scrollPillIntoView(categoryName, 'category');
          }
        }
      });
    }, observerOptions);

    const subcategoryObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const subcategoryName = entry.target.getAttribute('data-subcategory');
          if (subcategoryName) {
            setActiveSubcategory(subcategoryName);
            scrollPillIntoView(subcategoryName, 'subcategory');
          }
        }
      });
    }, { ...observerOptions, rootMargin: '-140px 0px -60% 0px' });

    // Observe category sections
    Object.values(categoryRefs.current).forEach(ref => {
      if (ref) categoryObserver.observe(ref);
    });

    // Observe subcategory sections
    Object.values(subcategoryRefs.current).forEach(ref => {
      if (ref) subcategoryObserver.observe(ref);
    });

    return () => {
      categoryObserver.disconnect();
      subcategoryObserver.disconnect();
    };
  }, [isLoading, services]);

  const scrollPillIntoView = (name: string, type: 'category' | 'subcategory') => {
    const container = type === 'category' ? categoryPillsRef.current : subcategoryPillsRef.current;
    const pill = container?.querySelector(`[data-pill="${name}"]`) as HTMLElement;
    if (pill && container) {
      const containerRect = container.getBoundingClientRect();
      const pillRect = pill.getBoundingClientRect();
      const scrollLeft = pill.offsetLeft - (containerRect.width / 2) + (pillRect.width / 2);
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  };

  const scrollToSection = (name: string, type: 'category' | 'subcategory') => {
    const refs = type === 'category' ? categoryRefs.current : subcategoryRefs.current;
    const element = refs[name];
    if (element) {
      const offset = type === 'category' ? 130 : 170;
      const top = element.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });

      if (type === 'category') {
        setActiveCategory(name);
      } else {
        setActiveSubcategory(name);
      }
    }
  };

  const handleAddItem = async (service: Service) => {
    setLoadingItemId(service.id);
    await new Promise(resolve => setTimeout(resolve, 300));
    addToCart({
      id: service.id,
      name: service.item_name,
      type: service.type,
      price: parseFloat(service.price)
    });
    setLoadingItemId(null);
  };

  const getItemQuantity = (id: number) => {
    const item = cart.find(i => i.id === id);
    return item?.quantity || 0;
  };

  const handleSearch = (query: string) => {
    setSearch(query);
    if (query.length > 0) {
      fetchServices(query);
    } else {
      fetchServices();
    }
  };

  // Group services by category and subcategory
  const groupedServices: Record<string, Record<string, Service[]>> = {};
  services.forEach(service => {
    if (!groupedServices[service.category_name]) {
      groupedServices[service.category_name] = {};
    }
    if (!groupedServices[service.category_name][service.subcategory_name]) {
      groupedServices[service.category_name][service.subcategory_name] = [];
    }
    groupedServices[service.category_name][service.subcategory_name].push(service);
  });

  // Get subcategories for active category
  const activeSubcategories = subcategories.filter(sub => {
    const category = categories.find(c => c.name === activeCategory);
    return category && sub.category_id === category.id;
  });

  const cartItemCount = getCartItemCount();
  const cartTotal = getCartTotal();

  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-white shadow-sm">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <h1 className="text-lg font-semibold text-gray-900">Add Items</h1>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            <Link
              href={`/rider/${token}/confirm`}
              className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemCount > 9 ? '9+' : cartItemCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Category Pills */}
        <div
          ref={categoryPillsRef}
          className="flex gap-2 px-4 py-2 overflow-x-auto scrollbar-hide border-b"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {categories.map(category => (
            <button
              key={category.id}
              data-pill={category.name}
              onClick={() => scrollToSection(category.name, 'category')}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeCategory === category.name
                  ? 'bg-green-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Subcategory Pills */}
        {activeSubcategories.length > 0 && (
          <div
            ref={subcategoryPillsRef}
            className="flex gap-2 px-4 py-2 overflow-x-auto scrollbar-hide bg-gray-50"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {activeSubcategories.map(subcategory => (
              <button
                key={subcategory.id}
                data-pill={subcategory.name}
                onClick={() => scrollToSection(subcategory.name, 'subcategory')}
                className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  activeSubcategory === subcategory.name
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
                }`}
              >
                {subcategory.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Full Screen Search Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-white">
          <div className="flex flex-col h-full">
            {/* Search Header */}
            <div className="flex items-center gap-3 p-4 border-b">
              <button
                onClick={() => {
                  setIsSearchOpen(false);
                  if (!search) fetchServices();
                }}
                className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div className="flex-1 relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search services..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-xl border-0 focus:ring-2 focus:ring-green-500 focus:bg-white transition-all"
                />
                {search && (
                  <button
                    onClick={() => handleSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-200"
                  >
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Search Results */}
            <div className="flex-1 overflow-y-auto p-4">
              {search ? (
                services.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p className="text-gray-500">No services found for &quot;{search}&quot;</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {services.map(service => {
                      const quantity = getItemQuantity(service.id);
                      const isItemLoading = loadingItemId === service.id;

                      return (
                        <div key={service.id} className="bg-white rounded-xl p-3 shadow-sm flex items-center justify-between">
                          <div className="flex-1 min-w-0 pr-3">
                            <h4 className="font-medium text-gray-900 truncate">{service.item_name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-400">{service.category_name}</span>
                              <span className="text-xs text-gray-300">•</span>
                              <span className="text-xs text-gray-400">{service.subcategory_name}</span>
                            </div>
                            <span className="text-sm font-semibold text-green-600 mt-1 block">
                              {service.currency} {parseFloat(service.price).toFixed(3)}
                            </span>
                          </div>

                          {quantity === 0 ? (
                            <button
                              onClick={() => handleAddItem(service)}
                              disabled={isItemLoading}
                              className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50 min-w-[72px] flex items-center justify-center"
                            >
                              {isItemLoading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                'Add'
                              )}
                            </button>
                          ) : (
                            <div className="flex items-center gap-1 bg-green-50 rounded-lg">
                              <button
                                onClick={() => updateQuantity(service.id, quantity - 1)}
                                className="w-9 h-9 flex items-center justify-center text-green-600 hover:bg-green-100 rounded-l-lg transition-colors"
                              >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                </svg>
                              </button>
                              <span className="w-8 text-center font-semibold text-green-700">{quantity}</span>
                              <button
                                onClick={() => updateQuantity(service.id, quantity + 1)}
                                className="w-9 h-9 flex items-center justify-center text-green-600 hover:bg-green-100 rounded-r-lg transition-colors"
                              >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p className="text-gray-500">Start typing to search services</p>
                </div>
              )}
            </div>

            {/* Search Footer Cart */}
            {cartItemCount > 0 && (
              <div className="p-4 border-t bg-white">
                <Link
                  href={`/rider/${token}/confirm`}
                  className="flex items-center justify-between w-full py-4 px-6 rounded-xl font-semibold text-lg bg-green-500 text-white hover:bg-green-600 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'}
                  </span>
                  <span>BHD {cartTotal.toFixed(3)}</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Services List */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No services found</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedServices).map(([categoryName, subcategoriesMap]) => (
              <div
                key={categoryName}
                ref={(el) => { categoryRefs.current[categoryName] = el; }}
                data-category={categoryName}
              >
                {Object.entries(subcategoriesMap).map(([subcategoryName, items]) => (
                  <div
                    key={subcategoryName}
                    className="mb-4"
                    ref={(el) => { subcategoryRefs.current[subcategoryName] = el; }}
                    data-subcategory={subcategoryName}
                  >
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      {subcategoryName}
                    </h3>
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden divide-y">
                      {items.map(service => {
                        const quantity = getItemQuantity(service.id);
                        const isItemLoading = loadingItemId === service.id;

                        return (
                          <div key={service.id} className="p-3 flex items-center justify-between">
                            <div className="flex-1 min-w-0 pr-3">
                              <h4 className="font-medium text-gray-900 truncate">{service.item_name}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  service.type === 'Offer' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {service.type}
                                </span>
                                <span className="text-sm font-semibold text-green-600">
                                  {service.currency} {parseFloat(service.price).toFixed(3)}
                                </span>
                              </div>
                            </div>

                            {/* Add Button / Quantity Spinner */}
                            {quantity === 0 ? (
                              <button
                                onClick={() => handleAddItem(service)}
                                disabled={isItemLoading}
                                className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50 min-w-[72px] flex items-center justify-center"
                              >
                                {isItemLoading ? (
                                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  'Add'
                                )}
                              </button>
                            ) : (
                              <div className="flex items-center gap-1 bg-green-50 rounded-lg">
                                <button
                                  onClick={() => updateQuantity(service.id, quantity - 1)}
                                  className="w-9 h-9 flex items-center justify-center text-green-600 hover:bg-green-100 rounded-l-lg transition-colors"
                                >
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                  </svg>
                                </button>
                                <span className="w-8 text-center font-semibold text-green-700">{quantity}</span>
                                <button
                                  onClick={() => updateQuantity(service.id, quantity + 1)}
                                  className="w-9 h-9 flex items-center justify-center text-green-600 hover:bg-green-100 rounded-r-lg transition-colors"
                                >
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                  </svg>
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fixed Footer - Cart */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg z-10">
        <Link
          href={cartItemCount > 0 ? `/rider/${token}/confirm` : '#'}
          className={`flex items-center justify-between w-full py-4 px-6 rounded-xl font-semibold text-lg transition-colors ${
            cartItemCount > 0
              ? 'bg-green-500 text-white hover:bg-green-600'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
          onClick={(e) => cartItemCount === 0 && e.preventDefault()}
        >
          <span className="flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'}
          </span>
          <span>BHD {cartTotal.toFixed(3)}</span>
        </Link>
      </div>
    </div>
  );
}

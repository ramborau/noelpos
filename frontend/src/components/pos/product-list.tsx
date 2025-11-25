'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Gift, Check, Search } from 'lucide-react';

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

interface CartItem {
	id: number;
	name: string;
	type: string;
	price: number;
	quantity: number;
}

interface ProductListProps {
	cart: CartItem[];
	onAddToCart: (item: { id: number; name: string; type: string; price: number }) => void;
	onUpdateQuantity: (id: number, quantity: number) => void;
	disabled?: boolean;
	search?: string;
	onSearchChange?: (value: string) => void;
}

// Sound file path
const SERVICE_ADDED_SOUND = '/sounds/service-added.mp3';

export function ProductList({
	cart,
	onAddToCart,
	onUpdateQuantity,
	disabled = false,
	search: externalSearch,
	onSearchChange: externalOnSearchChange,
}: ProductListProps) {
	const [services, setServices] = useState<Service[]>([]);
	const [categories, setCategories] = useState<Category[]>([]);
	const [internalSearch, setInternalSearch] = useState('');
	const [activeCategory, setActiveCategory] = useState<string>('all');
	const [isLoading, setIsLoading] = useState(true);
	const [loadingItemId, setLoadingItemId] = useState<number | null>(null);
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const scrollContainerRef = useRef<HTMLDivElement | null>(null);
	const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());

	// Use external search if provided, otherwise internal
	const search = externalSearch !== undefined ? externalSearch : internalSearch;
	const handleSearchChange = externalOnSearchChange || setInternalSearch;

	useEffect(() => {
		// Initialize audio
		audioRef.current = new Audio(SERVICE_ADDED_SOUND);
		audioRef.current.volume = 0.5;
		fetchServices();
	}, []);

	const playAddSound = () => {
		if (audioRef.current) {
			audioRef.current.currentTime = 0;
			audioRef.current.play().catch(() => {});
		}
	};

	const fetchServices = async (searchQuery?: string) => {
		try {
			const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
			const urlParams = new URLSearchParams();
			if (searchQuery) urlParams.append('search', searchQuery);

			const response = await fetch(`${apiUrl}/rider-pickup/get-services.php?${urlParams}`);
			const data = await response.json();

			if (data.success) {
				setServices(data.data);
				if (categories.length === 0 && data.categories) {
					setCategories(data.categories);
					if (data.categories.length > 0 && !activeCategory) {
						setActiveCategory(data.categories[0].name);
					}
				}
			}
		} catch (error) {
			console.error('Failed to fetch services:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleSearch = (query: string) => {
		handleSearchChange(query);
		if (query.length > 0) {
			fetchServices(query);
		} else {
			fetchServices();
		}
	};

	// Fetch services when external search changes
	useEffect(() => {
		if (externalSearch !== undefined) {
			if (externalSearch.length > 0) {
				fetchServices(externalSearch);
			} else {
				fetchServices();
			}
		}
	}, [externalSearch]);

	// Scroll to category section when clicking a category button
	const scrollToCategory = useCallback((categoryName: string) => {
		setActiveCategory(categoryName);
		if (categoryName === 'all') {
			scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
			return;
		}
		const sectionEl = sectionRefs.current.get(categoryName);
		if (sectionEl && scrollContainerRef.current) {
			const containerTop = scrollContainerRef.current.getBoundingClientRect().top;
			const sectionTop = sectionEl.getBoundingClientRect().top;
			const scrollOffset = sectionTop - containerTop + scrollContainerRef.current.scrollTop - 10;
			scrollContainerRef.current.scrollTo({ top: scrollOffset, behavior: 'smooth' });
		}
	}, []);

	// Auto-highlight category on scroll
	useEffect(() => {
		const container = scrollContainerRef.current;
		if (!container) return;

		const handleScroll = () => {
			const containerTop = container.getBoundingClientRect().top;
			let closestCategory = 'all';
			let closestDistance = Infinity;

			sectionRefs.current.forEach((sectionEl, categoryName) => {
				const sectionTop = sectionEl.getBoundingClientRect().top - containerTop;
				// Consider a section "active" if its top is within 100px of the container top
				if (sectionTop <= 100 && sectionTop > -sectionEl.offsetHeight) {
					const distance = Math.abs(sectionTop);
					if (distance < closestDistance) {
						closestDistance = distance;
						closestCategory = categoryName;
					}
				}
			});

			// If we're at the very top, show "all" as active
			if (container.scrollTop < 50) {
				closestCategory = 'all';
			}

			setActiveCategory(closestCategory);
		};

		container.addEventListener('scroll', handleScroll);
		return () => container.removeEventListener('scroll', handleScroll);
	}, [categories]);

	const handleToggleItem = async (service: Service) => {
		const existingItem = cart.find((i) => i.id === service.id);
		setLoadingItemId(service.id);
		await new Promise((resolve) => setTimeout(resolve, 100));

		if (existingItem) {
			// Remove from cart if already exists
			onUpdateQuantity(service.id, 0);
		} else {
			// Add to cart
			playAddSound();
			onAddToCart({
				id: service.id,
				name: service.item_name,
				type: service.type,
				price: parseFloat(service.price),
			});
		}
		setLoadingItemId(null);
	};

	const getItemQuantity = (id: number) => {
		const item = cart.find((i) => i.id === id);
		return item?.quantity || 0;
	};

	// Group services by category and subcategory - show all services for scrolling
	const groupedServices: Record<string, Record<string, Service[]>> = {};

	services.forEach((service) => {
		if (!groupedServices[service.category_name]) {
			groupedServices[service.category_name] = {};
		}
		if (!groupedServices[service.category_name][service.subcategory_name]) {
			groupedServices[service.category_name][service.subcategory_name] = [];
		}
		groupedServices[service.category_name][service.subcategory_name].push(service);
	});

	return (
		<div className="flex flex-col h-full">
			{/* Search - only show if no external search provided */}
			{externalSearch === undefined && (
				<div className="relative px-4">
					<Search className="absolute left-7 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
					<Input
						placeholder="Search products..."
						value={search}
						onChange={(e) => handleSearch(e.target.value)}
						className="pl-10"
					/>
				</div>
			)}

			{/* Category Pills */}
			<div className=" border-t  border-b px-4 py-2">
				<div className="flex gap-2 overflow-x-auto scrollbar-hide">
					{/* All button */}
					<button
						onClick={() => scrollToCategory('all')}
						className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
							activeCategory === 'all'
								? 'bg-[#00c307] text-white'
								: 'bg-[#f0fdf4] text-[#075e54] hover:bg-[#00c307]/10'
						}`}
					>
						All
					</button>
					{/* Category buttons */}
					{categories.map((category) => {
						const isActive = activeCategory === category.name;
						return (
							<button
								key={category.id}
								onClick={() => scrollToCategory(category.name)}
								className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
									isActive
										? 'bg-[#00c307] text-white'
										: 'bg-[#f0fdf4] text-[#075e54] hover:bg-[#00c307]/10'
								}`}
							>
								{category.name}
							</button>
						);
					})}
				</div>
			</div>

			{/* Products List */}
			{isLoading ? (
				<div className="flex justify-center py-8 flex-1">
					<div className="w-8 h-8 border-4 border-[#00c307] border-t-transparent rounded-full animate-spin"></div>
				</div>
			) : Object.keys(groupedServices).length === 0 ? (
				<div className="text-center py-8 text-gray-500 flex-1">No products found</div>
			) : (
				<div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4">
					{Object.entries(groupedServices).map(([categoryName, subcategoriesMap]) => (
						<div
							key={categoryName}
							ref={(el) => {
								if (el) sectionRefs.current.set(categoryName, el);
							}}
							className="mb-6"
						>
							{/* Category Header */}
							<h2 className="text-lg font-bold text-[#075e54] mb-3 border-b border-gray-200 pb-2">
								{categoryName}
							</h2>
							{Object.entries(subcategoriesMap).map(([subcategoryName, items]) => (
								<div key={subcategoryName} className="mb-4">
									<h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
										{subcategoryName}
									</h3>
									<div className="grid grid-cols-2 gap-3">
										{items.map((service) => {
											const quantity = getItemQuantity(service.id);
											const isInCart = quantity > 0;
											const isItemLoading = loadingItemId === service.id;

											return (
												<button
													key={service.id}
													onClick={() => !disabled && handleToggleItem(service)}
													disabled={disabled || isItemLoading}
													className={`w-full rounded-lg p-3 text-left transition-all cursor-pointer ${
														disabled
															? 'border border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
															: isInCart
															? 'border border-[#00c307] bg-[#f0fdf4]'
															: 'border border-gray-200 bg-white hover:border-[#00c307]/50'
													}`}
												>
													<div className="flex items-center justify-between gap-2">
														<div className="flex items-center gap-1.5 flex-1 min-w-0">
															<h4
																className={`font-medium text-sm leading-tight truncate ${
																	disabled
																		? 'text-gray-400'
																		: isInCart
																		? 'text-[#075e54]'
																		: 'text-gray-900'
																}`}
															>
																{service.item_name}
															</h4>
															{service.type === 'Offer' && (
																<Gift
																	className={`w-4 h-4 shrink-0 ${
																		disabled
																			? 'text-gray-300'
																			: isInCart
																			? 'text-[#00c307]'
																			: 'text-orange-500'
																	}`}
																/>
															)}
														</div>
														<div className="flex items-center gap-2 shrink-0">
															<p
																className={`text-sm font-semibold ${
																	disabled ? 'text-gray-400' : 'text-[#075e54]'
																}`}
															>
																{service.currency}{' '}
																{parseFloat(service.price).toFixed(3)}
															</p>
															{isInCart && <Check className="w-4 h-4 text-[#00c307]" />}
														</div>
													</div>
												</button>
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
	);
}

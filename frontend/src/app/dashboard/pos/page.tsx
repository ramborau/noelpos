'use client';

import { useState, useEffect, useRef } from 'react';
import Script from 'next/script';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { AddClientDialog } from '@/components/pos/add-client-dialog';
import { AddressSelectDialog } from '@/components/pos/address-select-dialog';
import { ScheduleDialog } from '@/components/pos/schedule-dialog';
import { MapRouteDialog } from '@/components/pos/map-route-dialog';
import { ProductList } from '@/components/pos/product-list';
import { OrderCart } from '@/components/pos/order-cart';
import { getQuickDistanceEstimate } from '@/lib/distance-service';
import { toast } from 'sonner';
import { Home, Building2, MapPin, Search, Plus, Navigation } from 'lucide-react';
import { PhoneDisplay } from '@/components/ui/phone-display';

// Sound files for different events
const NEW_ORDER_SOUND = '/sounds/new-order-pos.mp3';
const NEW_SERVICE_REQUEST_SOUND = '/sounds/new-service.mp3';

interface Customer {
	id: number;
	name: string;
	mobile: string;
}

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

interface Rider {
	id: number;
	name: string;
	mobile: string;
	status: string;
}

interface CartItem {
	id: number;
	name: string;
	type: string;
	price: number;
	quantity: number;
}

type DialogType = 'service-request' | 'create-order' | null;

export default function POSPage() {
	// State
	const [customers, setCustomers] = useState<Customer[]>([]);
	const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
	const [customerAddresses, setCustomerAddresses] = useState<Address[]>([]);
	const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

	const [cart, setCart] = useState<CartItem[]>([]);

	const [customerSearch, setCustomerSearch] = useState('');
	const [serviceSearch, setServiceSearch] = useState('');
	const [isSearching, setIsSearching] = useState(false);
	const [showAddClient, setShowAddClient] = useState(false);
	const [showAddressDialog, setShowAddressDialog] = useState(false);
	const [showMapDialog, setShowMapDialog] = useState(false);
	const [comboboxOpen, setComboboxOpen] = useState(false);
	const [scheduleDialogType, setScheduleDialogType] = useState<DialogType>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const customerTriggerRef = useRef<HTMLButtonElement>(null);
	const orderSoundRef = useRef<HTMLAudioElement | null>(null);
	const serviceRequestSoundRef = useRef<HTMLAudioElement | null>(null);

	// Initialize sounds
	useEffect(() => {
		orderSoundRef.current = new Audio(NEW_ORDER_SOUND);
		orderSoundRef.current.volume = 0.6;
		serviceRequestSoundRef.current = new Audio(NEW_SERVICE_REQUEST_SOUND);
		serviceRequestSoundRef.current.volume = 0.6;
	}, []);

	const playOrderSound = () => {
		if (orderSoundRef.current) {
			orderSoundRef.current.currentTime = 0;
			orderSoundRef.current.play().catch(() => {});
		}
	};

	const playServiceRequestSound = () => {
		if (serviceRequestSoundRef.current) {
			serviceRequestSoundRef.current.currentTime = 0;
			serviceRequestSoundRef.current.play().catch(() => {});
		}
	};

	// Auto-focus customer selector on page load
	useEffect(() => {
		if (!selectedCustomer && customerTriggerRef.current) {
			setTimeout(() => {
				customerTriggerRef.current?.click();
			}, 500);
		}
	}, []);

	// Fetch customer addresses when selected
	useEffect(() => {
		if (selectedCustomer) {
			fetchCustomerAddresses(selectedCustomer.id);
		} else {
			setCustomerAddresses([]);
			setSelectedAddress(null);
		}
	}, [selectedCustomer]);

	const searchCustomers = async (query: string) => {
		setIsSearching(true);
		try {
			const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
			const res = await fetch(`${apiUrl}/customers/list.php?search=${encodeURIComponent(query)}`);
			const data = await res.json();
			if (data.success) {
				setCustomers(data.data);
			}
		} catch {
			console.error('Failed to search customers');
		} finally {
			setIsSearching(false);
		}
	};

	const fetchCustomerAddresses = async (customerId: number) => {
		try {
			const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
			const res = await fetch(`${apiUrl}/customers/get.php?id=${customerId}`);
			const data = await res.json();
			if (data.success && data.addresses) {
				setCustomerAddresses(data.addresses);

				if (data.addresses.length === 1) {
					// Auto-select if only one address
					setSelectedAddress(data.addresses[0]);
				} else if (data.addresses.length > 1) {
					// Show address selection dialog if multiple addresses
					const defaultAddr = data.addresses.find((a: Address) => a.is_default);
					if (defaultAddr) {
						setSelectedAddress(defaultAddr);
					}
					setShowAddressDialog(true);
				}
			}
		} catch {
			console.error('Failed to fetch addresses');
		}
	};

	const handleClientCreated = (client: { id: number; name: string; mobile: string; address?: Address }) => {
		setSelectedCustomer({ id: client.id, name: client.name, mobile: client.mobile });
		if (client.address) {
			setCustomerAddresses([client.address]);
			setSelectedAddress(client.address);
		}
		setCustomerSearch('');
		setCustomers([]);
	};

	const addToCart = (item: { id: number; name: string; type: string; price: number }) => {
		setCart((prev) => {
			const existing = prev.find((i) => i.id === item.id);
			if (existing) {
				return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
			}
			return [...prev, { ...item, quantity: 1 }];
		});
	};

	const updateCartQuantity = (id: number, quantity: number) => {
		if (quantity <= 0) {
			setCart((prev) => prev.filter((i) => i.id !== id));
		} else {
			setCart((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)));
		}
	};

	const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

	// Service Request: only when customer + address selected AND no items in cart
	const canCreateServiceRequest = selectedCustomer && selectedAddress && cart.length === 0;
	// Create Order: only when customer + address selected AND items in cart
	const canCreateOrder = selectedCustomer && selectedAddress && cart.length > 0;

	const handleScheduleConfirm = async (data: { date: Date; timeSlot: string; rider?: Rider }) => {
		if (!selectedCustomer || !selectedAddress) {
			toast.error('Please select a customer and address');
			return;
		}

		setIsSubmitting(true);

		try {
			const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

			if (scheduleDialogType === 'service-request') {
				// Create Service Request (without products)
				const res = await fetch(`${apiUrl}/service-requests/create.php`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						customer_id: selectedCustomer.id,
						address_id: selectedAddress.id,
						service_date: data.date.toISOString().split('T')[0],
						service_time_slot: data.timeSlot,
						status: data.rider ? 'confirmed' : 'pending',
					}),
				});

				const result = await res.json();

				if (!result.success) {
					throw new Error(result.message || 'Failed to create service request');
				}

				// Assign rider if selected
				if (data.rider) {
					await fetch(`${apiUrl}/service-requests/assign-rider.php`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							service_request_id: result.id,
							rider_id: data.rider.id,
						}),
					});
				}

				playServiceRequestSound();
				toast.success(`Service Request ${result.request_number} created successfully!`);
			} else {
				// Create Order (with products)
				if (cart.length === 0) {
					toast.error('Please add items to the cart');
					setIsSubmitting(false);
					return;
				}

				const res = await fetch(`${apiUrl}/orders/create.php`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						customer_id: selectedCustomer.id,
						address_id: selectedAddress.id,
						items: cart.map((item) => ({
							id: item.id,
							name: item.name,
							type: item.type,
							price: item.price,
							quantity: item.quantity,
							total: item.price * item.quantity,
						})),
						subtotal: cartTotal,
						total_amount: cartTotal,
						payment_method: 'cash',
						pickup_date: data.date.toISOString().split('T')[0],
						pickup_time_slot: data.timeSlot,
						rider_id: data.rider?.id,
						status: data.rider ? 'assigned' : 'pending',
					}),
				});

				const result = await res.json();

				if (!result.success) {
					throw new Error(result.message || 'Failed to create order');
				}

				playOrderSound();
				toast.success(`Order ${result.order_number} created successfully!`);
			}

			// Reset form
			resetForm();
			setScheduleDialogType(null);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to submit');
		} finally {
			setIsSubmitting(false);
		}
	};

	const resetForm = () => {
		setSelectedCustomer(null);
		setSelectedAddress(null);
		setCart([]);
		setCustomerSearch('');
		setCustomers([]);
		setCustomerAddresses([]);
	};

	const getAddressIcon = (type: string) => {
		switch (type.toLowerCase()) {
			case 'home':
				return <Home className="w-4 h-4" />;
			case 'office':
				return <Building2 className="w-4 h-4" />;
			default:
				return <MapPin className="w-4 h-4" />;
		}
	};

	return (
		<>
			<Script
				src={`https://maps.googleapis.com/maps/api/js?key=AIzaSyD4uqm7MrsLtKbTS0-jJrjXkvGuvyso3Tg&libraries=places`}
				strategy="lazyOnload"
			/>

			<DashboardLayout>
				<div className="h-[calc(100vh-120px)]">
					{/* Main Grid - 63/37 split */}
					<div className="flex gap-4 h-full">
						{/* Left Side - 63% - Products */}
						<div className="w-[63%] bg-white rounded-xl border p-0 flex flex-col mb-4">
							{/* Sticky Header - Search + Service Request */}
							<div className="p-4">
								{/* Search + Service Request - 75% / 25% */}
								<div className="flex items-center gap-3">
									<div className="w-[75%] relative">
										<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00c307]" />
										<input
											type="text"
											placeholder="Search services..."
											value={serviceSearch}
											onChange={(e) => setServiceSearch(e.target.value)}
											className="w-full pl-10 pr-4 h-[46px] border border-gray-200 rounded-lg text-sm"
										/>
									</div>
									<button
										className="w-[25%] h-[46px] flex items-center justify-center gap-2 rounded-lg bg-[#075e54] text-white hover:bg-[#064940] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
										disabled={!canCreateServiceRequest}
										onClick={() => setScheduleDialogType('service-request')}
									>
										<Plus className="w-4 h-4" />
										<span className="text-sm font-medium">Service Request</span>
									</button>
								</div>
							</div>
							{/* Scrollable Products */}
							<div className="flex-1 overflow-hidden">
								<ProductList
									cart={cart}
									onAddToCart={addToCart}
									onUpdateQuantity={updateCartQuantity}
									disabled={!selectedCustomer}
									search={serviceSearch}
									onSearchChange={setServiceSearch}
								/>
							</div>
						</div>

						{/* Right Side - 37% */}
						<div className="w-[37%] flex flex-col gap-4">
							{/* Customer + Address Combined Section */}
							<div className="bg-white rounded-xl border p-0">
								{selectedCustomer ? (
									<>
										{/* Customer Info - Top Section */}
										<div className="p-3 bg-[#f0fdf4] rounded-t-xl border border-[#02c30a]">
											<div className="flex items-center gap-3">
												<div className="w-10 h-10 rounded-full bg-[#02c30a] flex items-center justify-center text-white font-medium">
													{selectedCustomer.name.charAt(0).toUpperCase()}
												</div>
												<div className="flex-1 min-w-0">
													<p className="font-medium truncate">{selectedCustomer.name}</p>
													<PhoneDisplay phone={selectedCustomer.mobile} className="text-sm text-gray-500" />
												</div>
												<button
													onClick={() => {
														setSelectedCustomer(null);
														setCustomerAddresses([]);
														setSelectedAddress(null);
													}}
													className="text-xs text-gray-500 hover:text-gray-700 cursor-pointer"
												>
													Change
												</button>
											</div>
										</div>

										{/* Address Info - Bottom Section */}
										{customerAddresses.length === 0 ? (
											<div className="p-3 border border-t-0 border-[#02c30a] rounded-b-xl">
												<p className="text-sm text-gray-400">No addresses found</p>
											</div>
										) : selectedAddress ? (
											<div className="flex items-center justify-between border border-t-0 border-[#02c30a] rounded-b-xl">
												{/* Left: Icon + City */}
												<div className="flex items-center gap-2 px-3 py-2 min-w-[33%]">
													<span className="text-[#00c307]">
														{getAddressIcon(selectedAddress.location_type)}
													</span>
													<p className="font-medium text-gray-800 truncate">
														{selectedAddress.city || 'Address'}
													</p>
												</div>

												{/* Center: Distance + Time */}
												{selectedAddress.latitude && selectedAddress.longitude && (
													<p className="text-sm text-gray-500 px-2">
														{getQuickDistanceEstimate(
															selectedAddress.latitude,
															selectedAddress.longitude
														)}{' '}
														• ~
														{Math.round(
															parseFloat(
																getQuickDistanceEstimate(
																	selectedAddress.latitude,
																	selectedAddress.longitude
																)
															) * 3
														)}{' '}
														min
													</p>
												)}

												{/* Right: Directions Button */}
												{selectedAddress.latitude && selectedAddress.longitude && (
													<button
														onClick={() => setShowMapDialog(true)}
														className="flex items-center gap-1.5 px-3 py-2 text-[#02c30a] text-sm font-medium border-l border-[#02c30a] hover:bg-[#f0fdf4] transition-colors cursor-pointer"
													>
														<Navigation className="w-4 h-4" />
														Directions
													</button>
												)}

												{/* Change button if multiple addresses */}
												{customerAddresses.length > 1 && (
													<button
														onClick={() => setShowAddressDialog(true)}
														className="text-xs text-[#075e54] hover:underline cursor-pointer px-2"
													>
														Change
													</button>
												)}
											</div>
										) : (
											<button
												onClick={() => setShowAddressDialog(true)}
												className="w-full p-3 text-left border border-t-0 border-[#02c30a] rounded-b-xl text-gray-500 hover:bg-gray-50 cursor-pointer"
											>
												Select an address
											</button>
										)}
									</>
								) : (
									<div className="flex gap-2 p-4">
										{/* Search Input - 75% */}
										<div className="w-[75%] relative">
											<div className="relative">
												<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
												<input
													ref={customerTriggerRef as React.RefObject<HTMLInputElement>}
													type="text"
													placeholder="Search by name or mobile..."
													value={customerSearch}
													onChange={(e) => {
														setCustomerSearch(e.target.value);
														if (e.target.value.length >= 2) {
															searchCustomers(e.target.value);
															setComboboxOpen(true);
														} else {
															setCustomers([]);
															setComboboxOpen(false);
														}
													}}
													onFocus={() => {
														if (customerSearch.length >= 2) {
															setComboboxOpen(true);
														}
													}}
													className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm"
												/>
											</div>

											{/* Autocomplete Dropdown */}
											{comboboxOpen && (
												<div className="autocomplete-dropdown w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-[300px] overflow-y-auto">
													{isSearching ? (
														<div className="py-6 text-center">
															<div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto"></div>
														</div>
													) : customers.length === 0 ? (
														<div className="py-4 text-center text-sm text-gray-500">
															{customerSearch.length >= 2
																? 'No customers found'
																: 'Type to search...'}
														</div>
													) : (
														customers.map((customer) => (
															<button
																key={customer.id}
																onClick={() => {
																	setSelectedCustomer(customer);
																	setComboboxOpen(false);
																	setCustomerSearch('');
																	setCustomers([]);
																}}
																className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 cursor-pointer"
															>
																<div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-medium text-sm">
																	{customer.name.charAt(0).toUpperCase()}
																</div>
																<div>
																	<p className="font-medium text-sm">
																		{customer.name}
																	</p>
																	<p className="text-xs text-gray-500">
																		{customer.mobile}
																	</p>
																</div>
															</button>
														))
													)}
												</div>
											)}
										</div>

										{/* Add Button - 25% */}
										<button
											onClick={() => setShowAddClient(true)}
											className="w-[25%] flex items-center justify-center gap-1.5 rounded-lg bg-[#00c307] text-white hover:bg-[#00a506] transition-colors cursor-pointer"
										>
											<Plus className="w-4 h-4" />
											<span className="text-sm font-medium">Add</span>
										</button>
									</div>
								)}
							</div>

							{/* Order Details */}
							<div className="bg-white rounded-xl border p-4 flex-1">
								<h3 className="font-semibold text-gray-700 mb-3">Order Details</h3>
								<OrderCart items={cart} onUpdateQuantity={updateCartQuantity} />
							</div>

							{/* Action Buttons - Sticky Footer */}
							<div className="bg-white rounded-xl border p-4 sticky bottom-0">
								<Button
									className="w-full h-12 text-base bg-[#00c307] hover:bg-[#00a506] text-white"
									disabled={!canCreateOrder}
									onClick={() => setScheduleDialogType('create-order')}
								>
									Create Order {cart.length > 0 && `- BHD ${cartTotal.toFixed(3)}`}
								</Button>
								{!selectedCustomer && (
									<p className="text-xs text-gray-400 text-center mt-3">
										Select a customer to continue
									</p>
								)}
								{selectedCustomer && !selectedAddress && (
									<p className="text-xs text-gray-400 text-center mt-3">
										Select an address to continue
									</p>
								)}
								{selectedCustomer && selectedAddress && cart.length === 0 && (
									<p className="text-xs text-[#00c307] text-center mt-3">
										Add services to create an order
									</p>
								)}
							</div>
						</div>
					</div>
				</div>

				{/* Dialogs */}
				<AddClientDialog
					open={showAddClient}
					onOpenChange={setShowAddClient}
					onClientCreated={handleClientCreated}
				/>

				<AddressSelectDialog
					open={showAddressDialog}
					onOpenChange={setShowAddressDialog}
					addresses={customerAddresses}
					selectedAddress={selectedAddress}
					onSelect={setSelectedAddress}
				/>

				<ScheduleDialog
					open={scheduleDialogType !== null}
					onOpenChange={(open) => !open && setScheduleDialogType(null)}
					title={
						scheduleDialogType === 'service-request' ? 'Schedule Service Request' : 'Schedule Order Pickup'
					}
					onConfirm={handleScheduleConfirm}
					isSubmitting={isSubmitting}
				/>

				{selectedAddress?.latitude && selectedAddress?.longitude && (
					<MapRouteDialog
						open={showMapDialog}
						onOpenChange={setShowMapDialog}
						destinationLat={selectedAddress.latitude}
						destinationLng={selectedAddress.longitude}
						destinationName={selectedAddress.city || 'Destination'}
					/>
				)}
			</DashboardLayout>
		</>
	);
}

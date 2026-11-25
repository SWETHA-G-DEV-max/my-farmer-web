export type UserRole = 'farmer' | 'buyer' | 'admin';
export type Language = 'en' | 'ta';

export type QualityGrade = 'Grade A' | 'Grade B' | 'Mixed';
export type UrgencyLevel = 'Normal' | 'Urgent' | 'Very Urgent';
export type RescueStatus =
  | 'Available'
  | 'Offer Received'
  | 'Negotiating'
  | 'Order Confirmed'
  | 'Sold';

export type VerificationStatus =
  | 'Not Verified'
  | 'Verification Pending'
  | 'Verified';

export type TransportMode =
  | 'Local Pickup'
  | 'Farmer Delivery'
  | 'Group Transport';

export type OrderStatus =
  | 'Confirmed'
  | 'In Transit'
  | 'Delivered'
  | 'Completed'
  | 'Cancelled';

export type CropKey =
  | 'tomato'
  | 'turmeric'
  | 'onion'
  | 'banana'
  | 'tapioca'
  | 'drumstick';

export interface CropCatalogItem {
  key: CropKey;
  en: string;
  ta: string;
  defaultPhotoUrl: string;
  unit: 'kg';
}

export interface CropListing {
  id: string;
  farmerId: string;
  farmerName: string;
  cropKey: CropKey;
  cropName: string;
  totalQuantityKg: number;
  availableQuantityKg: number;
  allocatedQuantityKg: number;
  soldQuantityKg: number;
  village: string;
  harvestDate: string;
  sellingDeadline: string;
  qualityGrade: QualityGrade;
  qualityReviewedByAdmin: boolean;
  expectedMinPricePerKg: number;
  urgency: UrgencyLevel;
  rescueStatus: RescueStatus;
  description: string;
  photoUrl: string;
  createdAt: string;
}

export interface MarketRate {
  id: string;
  cropKey: CropKey;
  cropName: string;
  marketName: string;
  marketType: 'Local' | 'Nearby';
  pricePerKg: number;
  commissionPct: number;
  transportEstimateBase: number;
  loadingPerKg: number;
  otherExpensePerKg: number;
  source: string;
  lastUpdated: string;
  isSample: boolean;
}

export interface BuyerProfile {
  id: string;
  businessName: string;
  contactPerson: string;
  location: string;
  phone: string;
  verificationStatus: VerificationStatus;
  completedOrdersCount: number;
  memberSince: string;
  notes: string;
}

export interface BuyerRequirement {
  id: string;
  buyerId: string;
  buyerBusinessName: string;
  cropKey: CropKey;
  cropName: string;
  requiredQtyKg: number;
  fulfilledQtyKg: number;
  maxOfferPricePerKg: number;
  deliveryLocation: string;
  transportMode: TransportMode;
  neededByDate: string;
  status: 'Open' | 'Partially Matched' | 'Fulfilled' | 'Closed';
  createdAt: string;
}

export interface Offer {
  id: string;
  listingId: string;
  requirementId?: string;
  buyerId: string;
  buyerBusinessName: string;
  offeredPricePerKg: number;
  requestedQtyKg: number;
  transportMode: TransportMode;
  estimatedTransportCost: number;
  message: string;
  status: 'Pending' | 'Accepted' | 'Rejected';
  isRescueOffer: boolean;
  createdAt: string;
}

export interface GroupContribution {
  id: string;
  campaignId: string;
  listingId: string;
  farmerId: string;
  farmerName: string;
  village: string;
  contributedQtyKg: number;
  qualityGrade: QualityGrade;
  joinedAt: string;
}

export interface AllocationRecord {
  id: string;
  campaignId: string;
  listingId: string;
  farmerId: string;
  farmerName: string;
  allocatedQtyKg: number;
  unitPricePerKg: number;
  grossAmount: number;
  sharedTransportCost: number;
  netReturnAmount: number;
  buyerRequirementId?: string;
  allocatedAt: string;
}

export interface GroupCampaign {
  id: string;
  title: string;
  cropKey: CropKey;
  cropName: string;
  targetQtyKg: number;
  minPricePerKg: number;
  pickupHub: string;
  dispatchDate: string;
  createdByRole: 'farmer' | 'admin';
  status: 'Collecting' | 'Matched' | 'Dispatched' | 'Completed';
  buyerId?: string;
  buyerBusinessName?: string;
  buyerRequirementId?: string;
  buyerPricePerKg?: number;
  sharedTransportTotal: number;
  contributions: GroupContribution[];
  allocations: AllocationRecord[];
  createdAt: string;
}

export interface Order {
  id: string;
  orderType: 'Direct' | 'Rescue' | 'Group';
  listingId: string;
  campaignId?: string;
  farmerId: string;
  farmerName: string;
  buyerId: string;
  buyerBusinessName: string;
  cropKey: CropKey;
  cropName: string;
  quantityKg: number;
  pricePerKg: number;
  grossValue: number;
  transportCost: number;
  loadingAndPackaging: number;
  commission: number;
  otherExpenses: number;
  netReturn: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PriceAlert {
  id: string;
  farmerId: string;
  cropKey: CropKey;
  cropName: string;
  quantityKg: number;
  targetPricePerKg: number;
  active: boolean;
  createdAt: string;
}

export interface BuyerReport {
  id: string;
  buyerId: string;
  buyerBusinessName: string;
  reportedBy: string;
  reason: string;
  details: string;
  status: 'Open' | 'Reviewed' | 'Dismissed';
  createdAt: string;
}

export interface FarmerMember {
  id: string;
  name: string;
  village: string;
  phone: string;
  primaryCrops: string;
  acreage: number;
  fpoMemberCode: string;
  joinedAt: string;
}

export interface StrategyEvaluation {
  strategyKey: 'local' | 'nearby' | 'direct' | 'group' | 'rescue';
  titleEn: string;
  titleTa: string;
  channelName: string;
  pricePerKg: number;
  quantityKg: number;
  grossValue: number;
  transportCost: number;
  loadingAndPackaging: number;
  commission: number;
  otherExpenses: number;
  totalExpenses: number;
  netReturn: number;
  netReturnPerKg: number;
  estimatedProfit?: number;
  available: boolean;
  availabilityNote: string;
  tradeOffEn: string;
  tradeOffTa: string;
}

export interface TransportComparisonRow {
  mode: TransportMode;
  vehicleLabel: string;
  totalTransportCost: number;
  costPerKg: number;
  netReturnAfterTransport: number;
  note: string;
}

export interface TriggeredAlertInfo {
  alert: PriceAlert;
  matchedSource: string;
  matchedPricePerKg: number;
  sourceLabel: string;
  timestamp: string;
  isBuyerOffer: boolean;
}

export interface AppState {
  activeRole: UserRole;
  activeFarmerId: string;
  activeBuyerId: string;
  language: Language;
  listings: CropListing[];
  marketRates: MarketRate[];
  buyers: BuyerProfile[];
  buyerRequirements: BuyerRequirement[];
  offers: Offer[];
  campaigns: GroupCampaign[];
  orders: Order[];
  priceAlerts: PriceAlert[];
  buyerReports: BuyerReport[];
  farmerMembers: FarmerMember[];
  demoStep: number;
  demoModeOpen: boolean;
}

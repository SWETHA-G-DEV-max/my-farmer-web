export type Language = 'en' | 'ta';

export type QualityGrade = 'Grade A' | 'Grade B' | 'Grade C';

export type DealStatus =
  | 'Offer Sent'
  | 'Counter Offer Received'
  | 'Offer Accepted'
  | 'Pickup Scheduled'
  | 'In Transit'
  | 'Delivered'
  | 'Payment Completed';

export type ComplaintCategory =
  | 'Payment delay'
  | 'Quantity mismatch'
  | 'Quality dispute'
  | 'Buyer cancellation'
  | 'Transport delay'
  | 'Produce damage';

export type ComplaintStatus = 'Submitted' | 'Under Review' | 'Resolved';

export interface FarmerProfile {
  name: string;
  village: string;
  district: string;
  phone: string;
  cropsGrown: string;
  farmSizeAcres: number;
  preferredMarkets: string;
}

export interface HarvestListing {
  id: string;
  cropName: string;
  farmLocation: string;
  district: string;
  estimatedQuantityKg: number;
  availableQuantityKg: number;
  expectedHarvestDate: string;
  qualityGrade: QualityGrade;
  minExpectedPricePerKg: number;
  notes: string;
  photoUrl: string;
  prepStatus: 'Planning' | 'Buyer Matched' | 'In Crop Pool' | 'Deal Confirmed';
  createdAt: string;
}

export interface BuyerProfile {
  id: string;
  buyerName: string;
  companyName: string;
  location: string;
  district: string;
  verificationLabel: 'Demo Verified' | 'Verification Pending (Demo)';
  rating: number;
  completedTransactions: number;
  cancellations: number;
  avgResponseTime: string;
  feedbackSummary: string;
}

export interface BuyerDemand {
  id: string;
  buyerId: string;
  companyName: string;
  verificationLabel: 'Demo Verified' | 'Verification Pending (Demo)';
  cropName: string;
  requiredQtyKg: number;
  qualityGrade: QualityGrade;
  offeredPricePerKg: number;
  requiredDeliveryDate: string;
  buyerLocation: string;
  district: string;
  deliveryRequirement: string;
  status: 'Open' | 'Interest Sent' | 'Counter Offered' | 'Accepted' | 'Rejected';
  counterOfferPricePerKg?: number;
}

export interface CompetingBid {
  id: string;
  listingId: string;
  buyerId: string;
  buyerName: string;
  companyName: string;
  offeredPricePerKg: number;
  requestedQtyKg: number;
  estimatedTransportCost: number;
  buyerRating: number;
  completedDeals: number;
  deliveryTerms: string;
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Counter Sent';
  counterPricePerKg?: number;
  createdAt: string;
}

export interface PoolParticipant {
  id: string;
  farmerName: string;
  village: string;
  quantityKg: number;
  isCurrentUser: boolean;
  confirmed: boolean;
}

export interface VillageCropPool {
  id: string;
  poolName: string;
  cropName: string;
  village: string;
  buyerCompany: string;
  targetQtyKg: number;
  expectedPricePerKg: number;
  dispatchDate: string;
  status: 'Collecting' | 'Ready for Deal' | 'Deal Confirmed';
  participants: PoolParticipant[];
}

export interface TransportParticipant {
  id: string;
  farmerName: string;
  village: string;
  cropName: string;
  quantityKg: number;
  isCurrentUser: boolean;
}

export interface SharedTransportGroup {
  id: string;
  vehicleType: string;
  driverContact: string;
  pickupArea: string;
  destinationMarket: string;
  pickupDate: string;
  totalCapacityKg: number;
  totalVehicleCost: number;
  routeDescription: string;
  participants: TransportParticipant[];
}

export interface DealRecord {
  id: string;
  buyerId: string;
  buyerName: string;
  companyName: string;
  cropName: string;
  quantityKg: number;
  agreedPricePerKg: number;
  totalAmount: number;
  deliveryDate: string;
  transportStatus: string;
  paymentStatus: 'Pending' | 'Processing' | 'Completed';
  status: DealStatus;
  updatedAt: string;
}

export interface ComplaintRecord {
  id: string;
  buyerId: string;
  companyName: string;
  category: ComplaintCategory;
  description: string;
  status: ComplaintStatus;
  createdAt: string;
}

export interface MarketPulsePoint {
  day: string;
  pricePerKg: number;
}

export interface MarketPulseEntry {
  id: string;
  cropName: string;
  district: 'Salem' | 'Namakkal' | 'Erode' | 'Coimbatore';
  marketName: string;
  locationLabel: string;
  pricePerKg: number;
  previousPricePerKg: number;
  arrivalTonnes: number;
  demandLevel: 'High' | 'Moderate' | 'Steady';
  estimatedTransportPerTrip: number;
  trend30d: MarketPulsePoint[];
}

export interface AgriLinkState {
  language: Language;
  farmerProfile: FarmerProfile;
  harvests: HarvestListing[];
  buyers: BuyerProfile[];
  savedBuyerIds: string[];
  buyerDemands: BuyerDemand[];
  bids: CompetingBid[];
  pools: VillageCropPool[];
  transportGroups: SharedTransportGroup[];
  deals: DealRecord[];
  complaints: ComplaintRecord[];
  marketPulse: MarketPulseEntry[];
}

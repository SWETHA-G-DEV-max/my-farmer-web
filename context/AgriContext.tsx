import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { CROP_CATALOG, createInitialSeedState } from '../data/seedData';
import {
  allocateGroupCampaign,
  evaluatePriceAlerts,
  getRemainingListingCapacity,
  roundInr,
} from '../logic/calculations';
import {
  AppState,
  BuyerReport,
  BuyerRequirement,
  CropKey,
  CropListing,
  FarmerMember,
  GroupCampaign,
  Language,
  MarketRate,
  Offer,
  Order,
  OrderStatus,
  PriceAlert,
  QualityGrade,
  RescueStatus,
  TransportMode,
  TriggeredAlertInfo,
  UrgencyLevel,
  UserRole,
  VerificationStatus,
} from '../types';

const STORAGE_KEY = 'agriprofit_salem_platform_v1';

export type NavTab =
  | 'dashboard'
  | 'engine'
  | 'marketAdvice'
  | 'listings'
  | 'group'
  | 'rescue'
  | 'alerts'
  | 'buyerPortal'
  | 'adminCenter';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

export interface ActionResult {
  ok: boolean;
  message: string;
}

interface AgriContextValue {
  state: AppState;
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  toasts: ToastMessage[];
  dismissToast: (id: string) => void;
  notify: (type: ToastMessage['type'], text: string) => void;
  triggeredAlerts: TriggeredAlertInfo[];

  // Role & Language
  setRole: (role: UserRole) => void;
  setLanguage: (lang: Language) => void;
  setActiveFarmer: (farmerId: string) => void;
  setActiveBuyer: (buyerId: string) => void;

  // Listings
  addListing: (input: {
    cropKey: CropKey;
    totalQuantityKg: number;
    village: string;
    harvestDate: string;
    sellingDeadline: string;
    qualityGrade: QualityGrade;
    expectedMinPricePerKg: number;
    urgency: UrgencyLevel;
    description: string;
    photoUrl?: string;
    farmerId?: string;
  }) => ActionResult & { listingId?: string };
  updateListing: (
    listingId: string,
    patch: Partial<
      Pick<
        CropListing,
        | 'totalQuantityKg'
        | 'village'
        | 'harvestDate'
        | 'sellingDeadline'
        | 'qualityGrade'
        | 'expectedMinPricePerKg'
        | 'urgency'
        | 'rescueStatus'
        | 'description'
        | 'photoUrl'
      >
    >
  ) => ActionResult;
  deleteListing: (listingId: string) => ActionResult;
  toggleListingQualityReviewed: (listingId: string) => void;

  // Buyer Requirements
  addBuyerRequirement: (input: {
    buyerId: string;
    cropKey: CropKey;
    requiredQtyKg: number;
    maxOfferPricePerKg: number;
    deliveryLocation: string;
    transportMode: TransportMode;
    neededByDate: string;
  }) => ActionResult & { requirementId?: string };
  updateBuyerRequirement: (
    reqId: string,
    patch: Partial<
      Pick<
        BuyerRequirement,
        | 'requiredQtyKg'
        | 'maxOfferPricePerKg'
        | 'deliveryLocation'
        | 'transportMode'
        | 'neededByDate'
        | 'status'
      >
    >
  ) => ActionResult;

  // Offers (Direct & Crop Rescue)
  submitOffer: (input: {
    listingId: string;
    requirementId?: string;
    buyerId: string;
    offeredPricePerKg: number;
    requestedQtyKg: number;
    transportMode: TransportMode;
    estimatedTransportCost: number;
    message: string;
    isRescueOffer: boolean;
  }) => ActionResult;
  acceptOffer: (offerId: string) => ActionResult;
  rejectOffer: (offerId: string) => ActionResult;

  // Group Selling Campaigns
  createCampaign: (input: {
    title: string;
    cropKey: CropKey;
    targetQtyKg: number;
    minPricePerKg: number;
    pickupHub: string;
    dispatchDate: string;
    sharedTransportTotal: number;
    createdByRole: 'farmer' | 'admin';
  }) => ActionResult & { campaignId?: string };
  joinCampaign: (input: {
    campaignId: string;
    listingId: string;
    contributeQtyKg: number;
  }) => ActionResult;
  matchAndAllocateCampaign: (input: {
    campaignId: string;
    buyerId: string;
    buyerRequirementId?: string;
    buyerDemandKg: number;
    unitPricePerKg: number;
  }) => ActionResult;
  createOrdersFromCampaignAllocations: (campaignId: string) => ActionResult;

  // Orders
  updateOrderStatus: (orderId: string, status: OrderStatus) => ActionResult;

  // Price Alerts
  addPriceAlert: (input: {
    cropKey: CropKey;
    quantityKg: number;
    targetPricePerKg: number;
  }) => ActionResult;
  updatePriceAlert: (
    alertId: string,
    patch: Partial<Pick<PriceAlert, 'quantityKg' | 'targetPricePerKg' | 'active'>>
  ) => void;
  deletePriceAlert: (alertId: string) => void;

  // Buyer Verification & Reports
  setBuyerVerification: (buyerId: string, status: VerificationStatus) => void;
  submitBuyerReport: (input: {
    buyerId: string;
    reason: string;
    details: string;
  }) => ActionResult;
  updateReportStatus: (reportId: string, status: BuyerReport['status']) => void;

  // Market Rates (Admin)
  updateMarketRate: (
    rateId: string,
    patch: Partial<
      Pick<
        MarketRate,
        | 'pricePerKg'
        | 'commissionPct'
        | 'transportEstimateBase'
        | 'loadingPerKg'
        | 'otherExpensePerKg'
        | 'source'
      >
    >
  ) => void;

  // FPO Farmer Members (Admin)
  addFarmerMember: (input: Omit<FarmerMember, 'id' | 'joinedAt'>) => ActionResult;

  // Demo Mode & Reset
  setDemoModeOpen: (open: boolean) => void;
  runDemoStep: (stepNumber: number) => void;
  resetDemoData: () => void;
}

const AgriContext = createContext<AgriContextValue | null>(null);

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialSeedState();
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed || !Array.isArray(parsed.listings) || !Array.isArray(parsed.marketRates)) {
      return createInitialSeedState();
    }
    return parsed;
  } catch {
    return createInitialSeedState();
  }
}

export const AgriProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(() => loadState());
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors in sandboxed iframes
    }
  }, [state]);

  const notify = (type: ToastMessage['type'], text: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-3), { id, type, text }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const triggeredAlerts = useMemo(
    () =>
      evaluatePriceAlerts({
        alerts: state.priceAlerts.filter((a) => a.farmerId === state.activeFarmerId),
        marketRates: state.marketRates,
        buyerRequirements: state.buyerRequirements,
        offers: state.offers,
        listings: state.listings,
      }),
    [
      state.priceAlerts,
      state.activeFarmerId,
      state.marketRates,
      state.buyerRequirements,
      state.offers,
      state.listings,
    ]
  );

  const setRole = (role: UserRole) => {
    setState((prev) => ({ ...prev, activeRole: role }));
    if (role === 'buyer') setActiveTab('buyerPortal');
    else if (role === 'admin') setActiveTab('adminCenter');
    else setActiveTab('dashboard');
  };

  const setLanguage = (language: Language) => {
    setState((prev) => ({ ...prev, language }));
  };

  const setActiveFarmer = (activeFarmerId: string) => {
    setState((prev) => ({ ...prev, activeFarmerId }));
  };

  const setActiveBuyer = (activeBuyerId: string) => {
    setState((prev) => ({ ...prev, activeBuyerId }));
  };

  const addListing: AgriContextValue['addListing'] = (input) => {
    if (input.totalQuantityKg <= 0 || input.expectedMinPricePerKg <= 0) {
      const msg = 'Quantity and minimum price must be greater than zero.';
      notify('error', msg);
      return { ok: false, message: msg };
    }
    const farmerId = input.farmerId || state.activeFarmerId;
    const farmer =
      state.farmerMembers.find((f) => f.id === farmerId) || state.farmerMembers[0];
    const catalog = CROP_CATALOG.find((c) => c.key === input.cropKey) || CROP_CATALOG[0];
    const id = `LST-${Math.floor(1000 + Math.random() * 9000)}`;

    const newListing: CropListing = {
      id,
      farmerId: farmer.id,
      farmerName: farmer.name,
      cropKey: catalog.key,
      cropName: catalog.en,
      totalQuantityKg: Math.round(input.totalQuantityKg),
      availableQuantityKg: Math.round(input.totalQuantityKg),
      allocatedQuantityKg: 0,
      soldQuantityKg: 0,
      village: input.village || farmer.village,
      harvestDate: input.harvestDate,
      sellingDeadline: input.sellingDeadline,
      qualityGrade: input.qualityGrade,
      qualityReviewedByAdmin: false,
      expectedMinPricePerKg: Number(input.expectedMinPricePerKg),
      urgency: input.urgency,
      rescueStatus: 'Available',
      description: input.description.trim() || `${catalog.en} harvested at ${input.village}.`,
      photoUrl: input.photoUrl?.trim() || catalog.defaultPhotoUrl,
      createdAt: new Date().toISOString(),
    };

    setState((prev) => ({
      ...prev,
      listings: [newListing, ...prev.listings],
    }));

    const msg = `Listing ${id} created for ${newListing.totalQuantityKg} kg ${catalog.en}.`;
    notify('success', msg);
    return { ok: true, message: msg, listingId: id };
  };

  const updateListing: AgriContextValue['updateListing'] = (listingId, patch) => {
    const existing = state.listings.find((l) => l.id === listingId);
    if (!existing) return { ok: false, message: 'Listing not found.' };

    const nextTotal =
      patch.totalQuantityKg !== undefined
        ? Math.round(patch.totalQuantityKg)
        : existing.totalQuantityKg;
    const locked = existing.allocatedQuantityKg + existing.soldQuantityKg;
    if (nextTotal < locked) {
      const msg = `Cannot reduce quantity below ${locked} kg already allocated or sold.`;
      notify('error', msg);
      return { ok: false, message: msg };
    }

    const nextAvailable = Math.max(0, nextTotal - locked);

    setState((prev) => ({
      ...prev,
      listings: prev.listings.map((l) =>
        l.id === listingId
          ? {
              ...l,
              ...patch,
              totalQuantityKg: nextTotal,
              availableQuantityKg: nextAvailable,
            }
          : l
      ),
    }));
    notify('success', `Listing ${listingId} updated.`);
    return { ok: true, message: 'Listing updated.' };
  };

  const deleteListing: AgriContextValue['deleteListing'] = (listingId) => {
    const existing = state.listings.find((l) => l.id === listingId);
    if (!existing) return { ok: false, message: 'Listing not found.' };
    if (existing.allocatedQuantityKg > 0) {
      const msg = 'Cannot delete a listing with quantities locked in an active group campaign.';
      notify('error', msg);
      return { ok: false, message: msg };
    }
    setState((prev) => ({
      ...prev,
      listings: prev.listings.filter((l) => l.id !== listingId),
      offers: prev.offers.filter((o) => o.listingId !== listingId),
    }));
    notify('info', `Listing ${listingId} removed.`);
    return { ok: true, message: 'Listing deleted.' };
  };

  const toggleListingQualityReviewed = (listingId: string) => {
    setState((prev) => ({
      ...prev,
      listings: prev.listings.map((l) =>
        l.id === listingId
          ? { ...l, qualityReviewedByAdmin: !l.qualityReviewedByAdmin }
          : l
      ),
    }));
    notify('info', `Admin quality review flag toggled for ${listingId}.`);
  };

  const addBuyerRequirement: AgriContextValue['addBuyerRequirement'] = (input) => {
    if (input.requiredQtyKg <= 0 || input.maxOfferPricePerKg <= 0) {
      const msg = 'Required quantity and offer price must be positive.';
      notify('error', msg);
      return { ok: false, message: msg };
    }
    const buyer = state.buyers.find((b) => b.id === input.buyerId) || state.buyers[0];
    const catalog = CROP_CATALOG.find((c) => c.key === input.cropKey) || CROP_CATALOG[0];
    const id = `REQ-${Math.floor(200 + Math.random() * 800)}`;

    const newReq: BuyerRequirement = {
      id,
      buyerId: buyer.id,
      buyerBusinessName: buyer.businessName,
      cropKey: catalog.key,
      cropName: catalog.en,
      requiredQtyKg: Math.round(input.requiredQtyKg),
      fulfilledQtyKg: 0,
      maxOfferPricePerKg: Number(input.maxOfferPricePerKg),
      deliveryLocation: input.deliveryLocation.trim() || buyer.location,
      transportMode: input.transportMode,
      neededByDate: input.neededByDate,
      status: 'Open',
      createdAt: new Date().toISOString(),
    };

    setState((prev) => ({
      ...prev,
      buyerRequirements: [newReq, ...prev.buyerRequirements],
    }));
    const msg = `Buyer requirement ${id} posted for ${newReq.requiredQtyKg} kg ${catalog.en}.`;
    notify('success', msg);
    return { ok: true, message: msg, requirementId: id };
  };

  const updateBuyerRequirement: AgriContextValue['updateBuyerRequirement'] = (reqId, patch) => {
    setState((prev) => ({
      ...prev,
      buyerRequirements: prev.buyerRequirements.map((r) =>
        r.id === reqId ? { ...r, ...patch } : r
      ),
    }));
    notify('success', `Requirement ${reqId} updated.`);
    return { ok: true, message: 'Requirement updated.' };
  };

  const submitOffer: AgriContextValue['submitOffer'] = (input) => {
    const listing = state.listings.find((l) => l.id === input.listingId);
    if (!listing) return { ok: false, message: 'Listing not found.' };
    const remaining = getRemainingListingCapacity(listing);
    if (input.requestedQtyKg <= 0 || input.requestedQtyKg > remaining) {
      const msg = `Requested quantity (${input.requestedQtyKg} kg) exceeds available unallocated stock (${remaining} kg).`;
      notify('error', msg);
      return { ok: false, message: msg };
    }
    if (input.offeredPricePerKg <= 0) {
      const msg = 'Offered price must be greater than zero.';
      notify('error', msg);
      return { ok: false, message: msg };
    }

    const buyer = state.buyers.find((b) => b.id === input.buyerId) || state.buyers[0];
    const id = `OFR-${Math.floor(300 + Math.random() * 700)}`;
    const newOffer: Offer = {
      id,
      listingId: listing.id,
      requirementId: input.requirementId,
      buyerId: buyer.id,
      buyerBusinessName: buyer.businessName,
      offeredPricePerKg: Number(input.offeredPricePerKg),
      requestedQtyKg: Math.round(input.requestedQtyKg),
      transportMode: input.transportMode,
      estimatedTransportCost: Math.max(0, Math.round(input.estimatedTransportCost)),
      message: input.message.trim() || 'Offer submitted via AgriProfit AI.',
      status: 'Pending',
      isRescueOffer: input.isRescueOffer,
      createdAt: new Date().toISOString(),
    };

    setState((prev) => ({
      ...prev,
      offers: [newOffer, ...prev.offers],
      listings: prev.listings.map((l) =>
        l.id === listing.id && l.rescueStatus === 'Available'
          ? { ...l, rescueStatus: 'Offer Received' }
          : l
      ),
    }));
    const msg = `Offer ${id} sent to ${listing.farmerName} at ₹${newOffer.offeredPricePerKg}/kg.`;
    notify('success', msg);
    return { ok: true, message: msg };
  };

  const acceptOffer: AgriContextValue['acceptOffer'] = (offerId) => {
    const offer = state.offers.find((o) => o.id === offerId);
    if (!offer || offer.status !== 'Pending') {
      return { ok: false, message: 'Offer is no longer pending.' };
    }
    const listing = state.listings.find((l) => l.id === offer.listingId);
    if (!listing) return { ok: false, message: 'Associated listing not found.' };

    const remaining = getRemainingListingCapacity(listing);
    if (offer.requestedQtyKg > remaining) {
      const msg = `Double-allocation blocked: only ${remaining} kg remains unallocated on ${listing.id}, cannot accept ${offer.requestedQtyKg} kg.`;
      notify('error', msg);
      return { ok: false, message: msg };
    }

    const grossValue = roundInr(offer.requestedQtyKg * offer.offeredPricePerKg);
    const loadingAndPackaging = roundInr(offer.requestedQtyKg * 0.4);
    const otherExpenses = roundInr(offer.requestedQtyKg * 0.1);
    const transportCost = offer.transportMode === 'Local Pickup' ? 0 : offer.estimatedTransportCost;
    const netReturn = roundInr(grossValue - transportCost - loadingAndPackaging - otherExpenses);
    const nowIso = new Date().toISOString();
    const orderId = `ORD-${Math.floor(500 + Math.random() * 500)}`;

    const newOrder: Order = {
      id: orderId,
      orderType: offer.isRescueOffer ? 'Rescue' : 'Direct',
      listingId: listing.id,
      farmerId: listing.farmerId,
      farmerName: listing.farmerName,
      buyerId: offer.buyerId,
      buyerBusinessName: offer.buyerBusinessName,
      cropKey: listing.cropKey,
      cropName: listing.cropName,
      quantityKg: offer.requestedQtyKg,
      pricePerKg: offer.offeredPricePerKg,
      grossValue,
      transportCost,
      loadingAndPackaging,
      commission: 0,
      otherExpenses,
      netReturn,
      status: 'Confirmed',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const nextAvailable = remaining - offer.requestedQtyKg;
    const nextSold = listing.soldQuantityKg + offer.requestedQtyKg;
    const nextRescueStatus: RescueStatus =
      nextAvailable === 0 ? 'Order Confirmed' : 'Negotiating';

    setState((prev) => ({
      ...prev,
      orders: [newOrder, ...prev.orders],
      offers: prev.offers.map((o) =>
        o.id === offerId ? { ...o, status: 'Accepted' } : o
      ),
      listings: prev.listings.map((l) =>
        l.id === listing.id
          ? {
              ...l,
              availableQuantityKg: nextAvailable,
              soldQuantityKg: nextSold,
              rescueStatus: nextRescueStatus,
            }
          : l
      ),
      buyerRequirements: offer.requirementId
        ? prev.buyerRequirements.map((r) => {
            if (r.id !== offer.requirementId) return r;
            const nextFulfilled = Math.min(
              r.requiredQtyKg,
              r.fulfilledQtyKg + offer.requestedQtyKg
            );
            return {
              ...r,
              fulfilledQtyKg: nextFulfilled,
              status: nextFulfilled >= r.requiredQtyKg ? 'Fulfilled' : 'Partially Matched',
            };
          })
        : prev.buyerRequirements,
    }));

    const msg = `Offer accepted. Order ${orderId} confirmed for ${offer.requestedQtyKg} kg.`;
    notify('success', msg);
    return { ok: true, message: msg };
  };

  const rejectOffer: AgriContextValue['rejectOffer'] = (offerId) => {
    setState((prev) => ({
      ...prev,
      offers: prev.offers.map((o) =>
        o.id === offerId ? { ...o, status: 'Rejected' } : o
      ),
    }));
    notify('info', `Offer ${offerId} declined.`);
    return { ok: true, message: 'Offer declined.' };
  };

  const createCampaign: AgriContextValue['createCampaign'] = (input) => {
    if (input.targetQtyKg <= 0 || input.minPricePerKg <= 0) {
      const msg = 'Target quantity and minimum price must be positive.';
      notify('error', msg);
      return { ok: false, message: msg };
    }
    const catalog = CROP_CATALOG.find((c) => c.key === input.cropKey) || CROP_CATALOG[0];
    const id = `CMP-${Math.floor(400 + Math.random() * 600)}`;
    const newCampaign: GroupCampaign = {
      id,
      title: input.title.trim() || `${input.pickupHub} ${catalog.en} Pool`,
      cropKey: catalog.key,
      cropName: catalog.en,
      targetQtyKg: Math.round(input.targetQtyKg),
      minPricePerKg: Number(input.minPricePerKg),
      pickupHub: input.pickupHub.trim(),
      dispatchDate: input.dispatchDate,
      createdByRole: input.createdByRole,
      status: 'Collecting',
      sharedTransportTotal: Math.max(0, Math.round(input.sharedTransportTotal)),
      contributions: [],
      allocations: [],
      createdAt: new Date().toISOString(),
    };

    setState((prev) => ({
      ...prev,
      campaigns: [newCampaign, ...prev.campaigns],
    }));

    const msg = `Group campaign "${newCampaign.title}" created.`;
    notify('success', msg);
    return { ok: true, message: msg, campaignId: id };
  };

  const joinCampaign: AgriContextValue['joinCampaign'] = ({
    campaignId,
    listingId,
    contributeQtyKg,
  }) => {
    const campaign = state.campaigns.find((c) => c.id === campaignId);
    const listing = state.listings.find((l) => l.id === listingId);
    if (!campaign || !listing) {
      return { ok: false, message: 'Campaign or listing not found.' };
    }
    if (campaign.cropKey !== listing.cropKey) {
      const msg = `Crop mismatch: Campaign is for ${campaign.cropName}, listing is ${listing.cropName}.`;
      notify('error', msg);
      return { ok: false, message: msg };
    }
    if (campaign.status !== 'Collecting') {
      const msg = 'Campaign is no longer collecting produce.';
      notify('error', msg);
      return { ok: false, message: msg };
    }

    const qty = Math.round(contributeQtyKg);
    const remaining = getRemainingListingCapacity(listing);
    if (qty <= 0 || qty > remaining) {
      const msg = `Double-allocation protection: Listing ${listing.id} only has ${remaining} kg unallocated capacity.`;
      notify('error', msg);
      return { ok: false, message: msg };
    }

    const contribution = {
      id: `CNT-${Date.now()}`,
      campaignId,
      listingId: listing.id,
      farmerId: listing.farmerId,
      farmerName: listing.farmerName,
      village: listing.village,
      contributedQtyKg: qty,
      qualityGrade: listing.qualityGrade,
      joinedAt: new Date().toISOString(),
    };

    setState((prev) => ({
      ...prev,
      listings: prev.listings.map((l) =>
        l.id === listing.id
          ? {
              ...l,
              availableQuantityKg: l.availableQuantityKg - qty,
              allocatedQuantityKg: l.allocatedQuantityKg + qty,
            }
          : l
      ),
      campaigns: prev.campaigns.map((c) =>
        c.id === campaignId
          ? { ...c, contributions: [...c.contributions, contribution] }
          : c
      ),
    }));

    const msg = `Locked ${qty} kg from ${listing.farmerName} (${listing.id}) into ${campaign.title}.`;
    notify('success', msg);
    return { ok: true, message: msg };
  };

  const matchAndAllocateCampaign: AgriContextValue['matchAndAllocateCampaign'] = ({
    campaignId,
    buyerId,
    buyerRequirementId,
    buyerDemandKg,
    unitPricePerKg,
  }) => {
    const campaign = state.campaigns.find((c) => c.id === campaignId);
    const buyer = state.buyers.find((b) => b.id === buyerId) || state.buyers[0];
    if (!campaign) return { ok: false, message: 'Campaign not found.' };
    if (campaign.contributions.length === 0) {
      const msg = 'No farmer contributions in this campaign yet.';
      notify('error', msg);
      return { ok: false, message: msg };
    }

    const { allocations, totalAllocatedKg } = allocateGroupCampaign({
      campaign,
      buyerDemandKg,
      unitPricePerKg,
      buyerRequirementId,
    });

    if (allocations.length === 0) {
      return { ok: false, message: 'Unable to allocate zero quantity.' };
    }

    setState((prev) => ({
      ...prev,
      campaigns: prev.campaigns.map((c) =>
        c.id === campaignId
          ? {
              ...c,
              status: 'Matched',
              buyerId: buyer.id,
              buyerBusinessName: buyer.businessName,
              buyerRequirementId,
              buyerPricePerKg: unitPricePerKg,
              allocations,
            }
          : c
      ),
    }));

    const msg = `Fairly allocated ${totalAllocatedKg} kg across ${allocations.length} farmer(s) for ${buyer.businessName}.`;
    notify('success', msg);
    return { ok: true, message: msg };
  };

  const createOrdersFromCampaignAllocations: AgriContextValue['createOrdersFromCampaignAllocations'] =
    (campaignId) => {
      const campaign = state.campaigns.find((c) => c.id === campaignId);
      if (!campaign || campaign.allocations.length === 0) {
        return { ok: false, message: 'Allocate quantities to a buyer first.' };
      }
      if (campaign.status === 'Dispatched' || campaign.status === 'Completed') {
        return { ok: false, message: 'Orders have already been generated for this campaign.' };
      }

      const nowIso = new Date().toISOString();
      const newOrders: Order[] = campaign.allocations.map((alc, index) => {
        const loading = roundInr(alc.allocatedQtyKg * 0.4);
        const other = roundInr(alc.allocatedQtyKg * 0.1);
        const net = roundInr(alc.grossAmount - alc.sharedTransportCost - loading - other);
        return {
          id: `ORD-GRP-${Date.now().toString().slice(-4)}-${index + 1}`,
          orderType: 'Group',
          listingId: alc.listingId,
          campaignId: campaign.id,
          farmerId: alc.farmerId,
          farmerName: alc.farmerName,
          buyerId: campaign.buyerId || 'buyer-1',
          buyerBusinessName: campaign.buyerBusinessName || 'Bulk Buyer',
          cropKey: campaign.cropKey,
          cropName: campaign.cropName,
          quantityKg: alc.allocatedQtyKg,
          pricePerKg: alc.unitPricePerKg,
          grossValue: alc.grossAmount,
          transportCost: alc.sharedTransportCost,
          loadingAndPackaging: loading,
          commission: 0,
          otherExpenses: other,
          netReturn: net,
          status: 'Confirmed',
          createdAt: nowIso,
          updatedAt: nowIso,
        };
      });

      const totalAllocated = campaign.allocations.reduce((s, a) => s + a.allocatedQtyKg, 0);

      // Update listings: move allocated quantities to soldQuantityKg and release any unallocated remainder back to availableQuantityKg
      const contributedByListing = new Map<string, number>();
      for (const c of campaign.contributions) {
        contributedByListing.set(
          c.listingId,
          (contributedByListing.get(c.listingId) || 0) + c.contributedQtyKg
        );
      }
      const allocatedByListing = new Map<string, number>();
      for (const a of campaign.allocations) {
        allocatedByListing.set(
          a.listingId,
          (allocatedByListing.get(a.listingId) || 0) + a.allocatedQtyKg
        );
      }

      setState((prev) => ({
        ...prev,
        orders: [...newOrders, ...prev.orders],
        campaigns: prev.campaigns.map((c) =>
          c.id === campaignId ? { ...c, status: 'Dispatched' } : c
        ),
        listings: prev.listings.map((l) => {
          const contributed = contributedByListing.get(l.id) || 0;
          if (contributed === 0) return l;
          const allocated = allocatedByListing.get(l.id) || 0;
          const unusedReturn = Math.max(0, contributed - allocated);
          return {
            ...l,
            allocatedQuantityKg: Math.max(0, l.allocatedQuantityKg - contributed),
            soldQuantityKg: l.soldQuantityKg + allocated,
            availableQuantityKg: l.availableQuantityKg + unusedReturn,
            rescueStatus: l.availableQuantityKg + unusedReturn === 0 ? 'Order Confirmed' : l.rescueStatus,
          };
        }),
        buyerRequirements: campaign.buyerRequirementId
          ? prev.buyerRequirements.map((r) => {
              if (r.id !== campaign.buyerRequirementId) return r;
              const nextFulfilled = Math.min(r.requiredQtyKg, r.fulfilledQtyKg + totalAllocated);
              return {
                ...r,
                fulfilledQtyKg: nextFulfilled,
                status: nextFulfilled >= r.requiredQtyKg ? 'Fulfilled' : 'Partially Matched',
              };
            })
          : prev.buyerRequirements,
      }));

      const msg = `Created ${newOrders.length} confirmed group order(s) totaling ${totalAllocated} kg.`;
      notify('success', msg);
      return { ok: true, message: msg };
    };

  const updateOrderStatus: AgriContextValue['updateOrderStatus'] = (orderId, status) => {
    const existing = state.orders.find((o) => o.id === orderId);
    if (!existing) return { ok: false, message: 'Order not found.' };
    const wasCompleted = existing.status === 'Completed';
    const becomingCompleted = status === 'Completed' && !wasCompleted;

    setState((prev) => ({
      ...prev,
      orders: prev.orders.map((o) =>
        o.id === orderId
          ? { ...o, status, updatedAt: new Date().toISOString() }
          : o
      ),
      buyers: becomingCompleted
        ? prev.buyers.map((b) =>
            b.id === existing.buyerId
              ? { ...b, completedOrdersCount: b.completedOrdersCount + 1 }
              : b
          )
        : prev.buyers,
      listings:
        status === 'Completed'
          ? prev.listings.map((l) =>
              l.id === existing.listingId && getRemainingListingCapacity(l) === 0
                ? { ...l, rescueStatus: 'Sold' }
                : l
            )
          : prev.listings,
    }));

    notify('success', `Order ${orderId} updated to ${status}.`);
    return { ok: true, message: `Order updated to ${status}.` };
  };

  const addPriceAlert: AgriContextValue['addPriceAlert'] = (input) => {
    if (input.quantityKg <= 0 || input.targetPricePerKg <= 0) {
      const msg = 'Quantity and target price must be greater than zero.';
      notify('error', msg);
      return { ok: false, message: msg };
    }
    const catalog = CROP_CATALOG.find((c) => c.key === input.cropKey) || CROP_CATALOG[0];
    const newAlert: PriceAlert = {
      id: `ALT-${Math.floor(600 + Math.random() * 400)}`,
      farmerId: state.activeFarmerId,
      cropKey: catalog.key,
      cropName: catalog.en,
      quantityKg: Math.round(input.quantityKg),
      targetPricePerKg: Number(input.targetPricePerKg),
      active: true,
      createdAt: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      priceAlerts: [newAlert, ...prev.priceAlerts],
    }));
    notify('success', `Price alert created for ${catalog.en} at ₹${newAlert.targetPricePerKg}/kg.`);
    return { ok: true, message: 'Price alert created.' };
  };

  const updatePriceAlert: AgriContextValue['updatePriceAlert'] = (alertId, patch) => {
    setState((prev) => ({
      ...prev,
      priceAlerts: prev.priceAlerts.map((a) =>
        a.id === alertId ? { ...a, ...patch } : a
      ),
    }));
    notify('info', 'Price alert updated.');
  };

  const deletePriceAlert = (alertId: string) => {
    setState((prev) => ({
      ...prev,
      priceAlerts: prev.priceAlerts.filter((a) => a.id !== alertId),
    }));
    notify('info', 'Price alert deleted.');
  };

  const setBuyerVerification = (buyerId: string, verificationStatus: VerificationStatus) => {
    setState((prev) => ({
      ...prev,
      buyers: prev.buyers.map((b) =>
        b.id === buyerId ? { ...b, verificationStatus } : b
      ),
    }));
    notify('success', `Buyer verification status updated to ${verificationStatus}.`);
  };

  const submitBuyerReport: AgriContextValue['submitBuyerReport'] = (input) => {
    const buyer = state.buyers.find((b) => b.id === input.buyerId);
    if (!buyer) return { ok: false, message: 'Buyer not found.' };
    if (!input.reason.trim()) {
      return { ok: false, message: 'Please enter a reason for the report.' };
    }
    const farmer = state.farmerMembers.find((f) => f.id === state.activeFarmerId);
    const report: BuyerReport = {
      id: `RPT-${Date.now().toString().slice(-4)}`,
      buyerId: buyer.id,
      buyerBusinessName: buyer.businessName,
      reportedBy: farmer ? `${farmer.name} (${farmer.village})` : state.activeRole,
      reason: input.reason.trim(),
      details: input.details.trim(),
      status: 'Open',
      createdAt: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      buyerReports: [report, ...prev.buyerReports],
    }));
    notify('info', `Concern report ${report.id} logged for Admin review.`);
    return { ok: true, message: 'Concern report submitted.' };
  };

  const updateReportStatus = (reportId: string, status: BuyerReport['status']) => {
    setState((prev) => ({
      ...prev,
      buyerReports: prev.buyerReports.map((r) =>
        r.id === reportId ? { ...r, status } : r
      ),
    }));
    notify('info', `Report ${reportId} marked ${status}.`);
  };

  const updateMarketRate: AgriContextValue['updateMarketRate'] = (rateId, patch) => {
    setState((prev) => ({
      ...prev,
      marketRates: prev.marketRates.map((m) =>
        m.id === rateId
          ? { ...m, ...patch, lastUpdated: new Date().toISOString() }
          : m
      ),
    }));
    notify('success', 'Sample market rate and timestamp updated.');
  };

  const addFarmerMember: AgriContextValue['addFarmerMember'] = (input) => {
    if (!input.name.trim() || !input.village.trim()) {
      const msg = 'Farmer name and village are required.';
      notify('error', msg);
      return { ok: false, message: msg };
    }
    const newMember: FarmerMember = {
      ...input,
      id: `farmer-${Date.now().toString().slice(-4)}`,
      joinedAt: new Date().toISOString().slice(0, 10),
    };
    setState((prev) => ({
      ...prev,
      farmerMembers: [newMember, ...prev.farmerMembers],
    }));
    notify('success', `Farmer ${newMember.name} registered to FPO.`);
    return { ok: true, message: 'Farmer member added.' };
  };

  const setDemoModeOpen = (demoModeOpen: boolean) => {
    setState((prev) => ({ ...prev, demoModeOpen }));
  };

  const runDemoStep = (stepNumber: number) => {
    setState((prev) => ({ ...prev, demoStep: stepNumber }));
    if (stepNumber === 1) {
      setRole('farmer');
      setActiveTab('listings');
    } else if (stepNumber === 2) {
      setRole('farmer');
      setActiveTab('engine');
    } else if (stepNumber === 3) {
      setRole('buyer');
      setActiveTab('buyerPortal');
    } else if (stepNumber === 4) {
      setRole('farmer');
      setActiveTab('alerts');
    } else if (stepNumber === 5 || stepNumber === 6 || stepNumber === 7) {
      setRole('farmer');
      setActiveTab('group');
    } else if (stepNumber === 8) {
      setRole('admin');
      setActiveTab('adminCenter');
    }
  };

  const resetDemoData = () => {
    const fresh = createInitialSeedState();
    setState(fresh);
    setActiveTab('dashboard');
    notify('info', 'All demo data reset to Salem baseline.');
  };

  return (
    <AgriContext.Provider
      value={{
        state,
        activeTab,
        setActiveTab,
        toasts,
        dismissToast,
        notify,
        triggeredAlerts,
        setRole,
        setLanguage,
        setActiveFarmer,
        setActiveBuyer,
        addListing,
        updateListing,
        deleteListing,
        toggleListingQualityReviewed,
        addBuyerRequirement,
        updateBuyerRequirement,
        submitOffer,
        acceptOffer,
        rejectOffer,
        createCampaign,
        joinCampaign,
        matchAndAllocateCampaign,
        createOrdersFromCampaignAllocations,
        updateOrderStatus,
        addPriceAlert,
        updatePriceAlert,
        deletePriceAlert,
        setBuyerVerification,
        submitBuyerReport,
        updateReportStatus,
        updateMarketRate,
        addFarmerMember,
        setDemoModeOpen,
        runDemoStep,
        resetDemoData,
      }}
    >
      {children}
    </AgriContext.Provider>
  );
};

export function useAgri() {
  const ctx = useContext(AgriContext);
  if (!ctx) throw new Error('useAgri must be used within AgriProvider');
  return ctx;
}

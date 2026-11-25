import React, { createContext, useContext, useEffect, useState } from 'react';
import { CROP_PHOTO_MAP, createInitialAgriLinkState } from '../data/agrilinkSeed';
import {
  AgriLinkState,
  ComplaintCategory,
  DealStatus,
  FarmerProfile,
  HarvestListing,
  Language,
  QualityGrade,
} from '../types/agrilink';

const STORAGE_KEY = 'agrilink_mh26_24_v1';

export type AgriLinkPage =
  | 'home'
  | 'dashboard'
  | 'marketPulse'
  | 'harvestPlanner'
  | 'buyerDemand'
  | 'bidding'
  | 'cropPool'
  | 'sharedTransport'
  | 'calculator'
  | 'myDeals'
  | 'trust'
  | 'profile';

export interface ToastNotice {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

interface AgriLinkContextValue {
  state: AgriLinkState;
  page: AgriLinkPage;
  setPage: (p: AgriLinkPage) => void;
  toasts: ToastNotice[];
  dismissToast: (id: string) => void;
  notify: (type: ToastNotice['type'], text: string) => void;

  setLanguage: (lang: Language) => void;
  updateFarmerProfile: (profile: FarmerProfile) => void;
  resetDemoData: () => void;

  // Harvest Planner
  addHarvest: (input: {
    cropName: string;
    farmLocation: string;
    district: string;
    estimatedQuantityKg: number;
    availableQuantityKg: number;
    expectedHarvestDate: string;
    qualityGrade: QualityGrade;
    minExpectedPricePerKg: number;
    notes: string;
  }) => { ok: boolean; id?: string };
  updateHarvest: (id: string, patch: Partial<HarvestListing>) => void;
  sendSellingInterest: (harvestId: string, demandId: string) => void;

  // Buyer Demand Marketplace
  toggleSaveBuyer: (buyerId: string) => void;
  sendDemandOffer: (demandId: string, quantityKg: number) => void;
  counterOfferDemand: (demandId: string, counterPricePerKg: number) => void;
  acceptDemandOffer: (demandId: string) => void;
  rejectDemandOffer: (demandId: string) => void;

  // Multi-Buyer Bidding
  addDemoBid: (input: {
    listingId: string;
    buyerId: string;
    offeredPricePerKg: number;
    requestedQtyKg: number;
    estimatedTransportCost: number;
  }) => void;
  acceptBid: (bidId: string) => void;
  rejectBid: (bidId: string) => void;
  counterBid: (bidId: string, counterPricePerKg: number) => void;

  // Village Crop Pool
  createCropPool: (input: {
    poolName: string;
    cropName: string;
    village: string;
    buyerCompany: string;
    targetQtyKg: number;
    expectedPricePerKg: number;
    dispatchDate: string;
    initialQtyKg: number;
  }) => { ok: boolean };
  joinCropPool: (poolId: string, quantityKg: number) => { ok: boolean };
  leaveCropPool: (poolId: string) => void;
  confirmPoolDeal: (poolId: string) => void;

  // Shared Transport
  createTransportRequest: (input: {
    cropName: string;
    quantityKg: number;
    pickupArea: string;
    destinationMarket: string;
    pickupDate: string;
    vehicleType: string;
    totalVehicleCost: number;
    totalCapacityKg: number;
  }) => { ok: boolean };
  joinTransportGroup: (groupId: string, cropName: string, quantityKg: number) => { ok: boolean };
  leaveTransportGroup: (groupId: string) => void;

  // Deals
  advanceDealStatus: (dealId: string, nextStatus: DealStatus) => void;

  // Complaints
  submitComplaint: (input: {
    buyerId: string;
    category: ComplaintCategory;
    description: string;
  }) => { ok: boolean };
}

const AgriLinkContext = createContext<AgriLinkContextValue | null>(null);

function loadAgriLinkState(): AgriLinkState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialAgriLinkState();
    const parsed = JSON.parse(raw) as AgriLinkState;
    if (!parsed || !Array.isArray(parsed.harvests) || !Array.isArray(parsed.pools)) {
      return createInitialAgriLinkState();
    }
    return parsed;
  } catch {
    return createInitialAgriLinkState();
  }
}

export const AgriLinkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AgriLinkState>(() => loadAgriLinkState());
  const [page, setPage] = useState<AgriLinkPage>('home');
  const [toasts, setToasts] = useState<ToastNotice[]>([]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors
    }
  }, [state]);

  const notify = (type: ToastNotice['type'], text: string) => {
    const id = `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-3), { id, type, text }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  };

  const setLanguage = (language: Language) => {
    setState((prev) => ({ ...prev, language }));
  };

  const updateFarmerProfile = (farmerProfile: FarmerProfile) => {
    setState((prev) => ({ ...prev, farmerProfile }));
    notify('success', 'Farmer profile updated and saved locally.');
  };

  const resetDemoData = () => {
    setState(createInitialAgriLinkState());
    notify('info', 'All AgriLink demo data reset to initial baseline.');
  };

  const addHarvest: AgriLinkContextValue['addHarvest'] = (input) => {
    if (input.estimatedQuantityKg <= 0 || input.minExpectedPricePerKg <= 0) {
      notify('error', 'Quantity and expected price must be greater than zero.');
      return { ok: false };
    }
    if (!input.expectedHarvestDate) {
      notify('error', 'Please choose an expected harvest date.');
      return { ok: false };
    }

    const id = `HRV-${Math.floor(200 + Math.random() * 800)}`;
    const newHarvest: HarvestListing = {
      id,
      cropName: input.cropName,
      farmLocation: input.farmLocation.trim() || state.farmerProfile.village,
      district: input.district,
      estimatedQuantityKg: Math.round(input.estimatedQuantityKg),
      availableQuantityKg: Math.round(
        Math.min(input.availableQuantityKg || input.estimatedQuantityKg, input.estimatedQuantityKg)
      ),
      expectedHarvestDate: input.expectedHarvestDate,
      qualityGrade: input.qualityGrade,
      minExpectedPricePerKg: Number(input.minExpectedPricePerKg),
      notes: input.notes.trim() || 'Pre-harvest planned lot.',
      photoUrl: CROP_PHOTO_MAP[input.cropName] || CROP_PHOTO_MAP.Tomato,
      prepStatus: 'Planning',
      createdAt: new Date().toISOString().slice(0, 10),
    };

    setState((prev) => ({
      ...prev,
      harvests: [newHarvest, ...prev.harvests],
    }));
    notify('success', `Upcoming harvest ${id} (${newHarvest.cropName}, ${newHarvest.estimatedQuantityKg} kg) added.`);
    return { ok: true, id };
  };

  const updateHarvest: AgriLinkContextValue['updateHarvest'] = (id, patch) => {
    setState((prev) => ({
      ...prev,
      harvests: prev.harvests.map((h) => (h.id === id ? { ...h, ...patch } : h)),
    }));
    notify('success', `Harvest ${id} updated.`);
  };

  const sendSellingInterest: AgriLinkContextValue['sendSellingInterest'] = (
    harvestId,
    demandId
  ) => {
    const harvest = state.harvests.find((h) => h.id === harvestId);
    const demand = state.buyerDemands.find((d) => d.id === demandId);
    if (!harvest || !demand) return;

    const buyer = state.buyers.find((b) => b.id === demand.buyerId);
    const dealQty = Math.min(harvest.availableQuantityKg, demand.requiredQtyKg);
    const newDealId = `DL-${Math.floor(700 + Math.random() * 299)}`;

    setState((prev) => ({
      ...prev,
      harvests: prev.harvests.map((h) =>
        h.id === harvestId ? { ...h, prepStatus: 'Buyer Matched' } : h
      ),
      buyerDemands: prev.buyerDemands.map((d) =>
        d.id === demandId ? { ...d, status: 'Interest Sent' } : d
      ),
      deals: [
        {
          id: newDealId,
          buyerId: demand.buyerId,
          buyerName: buyer?.buyerName || demand.companyName,
          companyName: demand.companyName,
          cropName: harvest.cropName,
          quantityKg: dealQty,
          agreedPricePerKg: demand.offeredPricePerKg,
          totalAmount: Math.round(dealQty * demand.offeredPricePerKg),
          deliveryDate: demand.requiredDeliveryDate,
          transportStatus: 'Pre-harvest interest sent',
          paymentStatus: 'Pending',
          status: 'Offer Sent',
          updatedAt: new Date().toISOString().slice(0, 10),
        },
        ...prev.deals,
      ],
    }));
    notify('success', `Selling interest sent to ${demand.companyName} (${newDealId}).`);
  };

  const toggleSaveBuyer = (buyerId: string) => {
    const exists = state.savedBuyerIds.includes(buyerId);
    setState((prev) => ({
      ...prev,
      savedBuyerIds: exists
        ? prev.savedBuyerIds.filter((id) => id !== buyerId)
        : [...prev.savedBuyerIds, buyerId],
    }));
    notify('info', exists ? 'Removed buyer from saved list.' : 'Buyer saved to trusted list.');
  };

  const sendDemandOffer: AgriLinkContextValue['sendDemandOffer'] = (demandId, quantityKg) => {
    const demand = state.buyerDemands.find((d) => d.id === demandId);
    if (!demand) return;
    const buyer = state.buyers.find((b) => b.id === demand.buyerId);
    const qty = Math.max(1, Math.round(quantityKg));
    const dealId = `DL-${Math.floor(700 + Math.random() * 299)}`;

    setState((prev) => ({
      ...prev,
      buyerDemands: prev.buyerDemands.map((d) =>
        d.id === demandId ? { ...d, status: 'Interest Sent' } : d
      ),
      deals: [
        {
          id: dealId,
          buyerId: demand.buyerId,
          buyerName: buyer?.buyerName || demand.companyName,
          companyName: demand.companyName,
          cropName: demand.cropName,
          quantityKg: qty,
          agreedPricePerKg: demand.offeredPricePerKg,
          totalAmount: Math.round(qty * demand.offeredPricePerKg),
          deliveryDate: demand.requiredDeliveryDate,
          transportStatus: 'Awaiting buyer confirmation',
          paymentStatus: 'Pending',
          status: 'Offer Sent',
          updatedAt: new Date().toISOString().slice(0, 10),
        },
        ...prev.deals,
      ],
    }));
    notify('success', `Offer for ${qty} kg ${demand.cropName} sent to ${demand.companyName}.`);
  };

  const counterOfferDemand: AgriLinkContextValue['counterOfferDemand'] = (
    demandId,
    counterPricePerKg
  ) => {
    if (counterPricePerKg <= 0) {
      notify('error', 'Counter price must be greater than zero.');
      return;
    }
    const demand = state.buyerDemands.find((d) => d.id === demandId);
    if (!demand) return;
    const buyer = state.buyers.find((b) => b.id === demand.buyerId);

    setState((prev) => ({
      ...prev,
      buyerDemands: prev.buyerDemands.map((d) =>
        d.id === demandId
          ? { ...d, status: 'Counter Offered', counterOfferPricePerKg: counterPricePerKg }
          : d
      ),
      deals: [
        {
          id: `DL-${Math.floor(700 + Math.random() * 299)}`,
          buyerId: demand.buyerId,
          buyerName: buyer?.buyerName || demand.companyName,
          companyName: demand.companyName,
          cropName: demand.cropName,
          quantityKg: demand.requiredQtyKg,
          agreedPricePerKg: counterPricePerKg,
          totalAmount: Math.round(demand.requiredQtyKg * counterPricePerKg),
          deliveryDate: demand.requiredDeliveryDate,
          transportStatus: 'Counter-offer pending buyer reply',
          paymentStatus: 'Pending',
          status: 'Counter Offer Received',
          updatedAt: new Date().toISOString().slice(0, 10),
        },
        ...prev.deals,
      ],
    }));
    notify('info', `Counter-offer of ₹${counterPricePerKg}/kg sent to ${demand.companyName}.`);
  };

  const acceptDemandOffer: AgriLinkContextValue['acceptDemandOffer'] = (demandId) => {
    const demand = state.buyerDemands.find((d) => d.id === demandId);
    if (!demand) return;
    const buyer = state.buyers.find((b) => b.id === demand.buyerId);
    const dealId = `DL-${Math.floor(700 + Math.random() * 299)}`;

    setState((prev) => ({
      ...prev,
      buyerDemands: prev.buyerDemands.map((d) =>
        d.id === demandId ? { ...d, status: 'Accepted' } : d
      ),
      deals: [
        {
          id: dealId,
          buyerId: demand.buyerId,
          buyerName: buyer?.buyerName || demand.companyName,
          companyName: demand.companyName,
          cropName: demand.cropName,
          quantityKg: demand.requiredQtyKg,
          agreedPricePerKg: demand.offeredPricePerKg,
          totalAmount: Math.round(demand.requiredQtyKg * demand.offeredPricePerKg),
          deliveryDate: demand.requiredDeliveryDate,
          transportStatus: 'Ready to schedule pickup',
          paymentStatus: 'Pending',
          status: 'Offer Accepted',
          updatedAt: new Date().toISOString().slice(0, 10),
        },
        ...prev.deals,
      ],
    }));
    notify('success', `Buyer offer accepted! Deal ${dealId} added to My Deals.`);
  };

  const rejectDemandOffer: AgriLinkContextValue['rejectDemandOffer'] = (demandId) => {
    setState((prev) => ({
      ...prev,
      buyerDemands: prev.buyerDemands.map((d) =>
        d.id === demandId ? { ...d, status: 'Rejected' } : d
      ),
    }));
    notify('info', 'Buyer demand offer declined.');
  };

  const addDemoBid: AgriLinkContextValue['addDemoBid'] = (input) => {
    const buyer = state.buyers.find((b) => b.id === input.buyerId) || state.buyers[0];
    setState((prev) => ({
      ...prev,
      bids: [
        {
          id: `BID-${Math.floor(310 + Math.random() * 680)}`,
          listingId: input.listingId,
          buyerId: buyer.id,
          buyerName: buyer.buyerName,
          companyName: buyer.companyName,
          offeredPricePerKg: Number(input.offeredPricePerKg),
          requestedQtyKg: Math.round(input.requestedQtyKg),
          estimatedTransportCost: Math.round(input.estimatedTransportCost),
          buyerRating: buyer.rating,
          completedDeals: buyer.completedTransactions,
          deliveryTerms: `${buyer.location} · Demo competitive bid`,
          status: 'Pending',
          createdAt: new Date().toISOString().slice(0, 10),
        },
        ...prev.bids,
      ],
    }));
    notify('success', `New demo bid added from ${buyer.companyName} at ₹${input.offeredPricePerKg}/kg.`);
  };

  const acceptBid: AgriLinkContextValue['acceptBid'] = (bidId) => {
    const bid = state.bids.find((b) => b.id === bidId);
    const listing = state.harvests.find((h) => h.id === bid?.listingId);
    if (!bid || !listing) return;
    const dealId = `DL-${Math.floor(700 + Math.random() * 299)}`;

    setState((prev) => ({
      ...prev,
      bids: prev.bids.map((b) =>
        b.id === bidId
          ? { ...b, status: 'Accepted' }
          : b.listingId === bid.listingId && b.status === 'Pending'
            ? { ...b, status: 'Rejected' }
            : b
      ),
      harvests: prev.harvests.map((h) =>
        h.id === listing.id ? { ...h, prepStatus: 'Deal Confirmed' } : h
      ),
      deals: [
        {
          id: dealId,
          buyerId: bid.buyerId,
          buyerName: bid.buyerName,
          companyName: bid.companyName,
          cropName: listing.cropName,
          quantityKg: bid.requestedQtyKg,
          agreedPricePerKg: bid.offeredPricePerKg,
          totalAmount: Math.round(bid.requestedQtyKg * bid.offeredPricePerKg),
          deliveryDate: listing.expectedHarvestDate,
          transportStatus: 'Offer Accepted · Arrange Pickup',
          paymentStatus: 'Pending',
          status: 'Offer Accepted',
          updatedAt: new Date().toISOString().slice(0, 10),
        },
        ...prev.deals,
      ],
    }));
    notify('success', `Accepted ${bid.companyName}'s offer at ₹${bid.offeredPricePerKg}/kg. Deal ${dealId} created!`);
  };

  const rejectBid: AgriLinkContextValue['rejectBid'] = (bidId) => {
    setState((prev) => ({
      ...prev,
      bids: prev.bids.map((b) => (b.id === bidId ? { ...b, status: 'Rejected' } : b)),
    }));
    notify('info', 'Bid rejected.');
  };

  const counterBid: AgriLinkContextValue['counterBid'] = (bidId, counterPricePerKg) => {
    if (counterPricePerKg <= 0) {
      notify('error', 'Counter price must be greater than zero.');
      return;
    }
    setState((prev) => ({
      ...prev,
      bids: prev.bids.map((b) =>
        b.id === bidId
          ? { ...b, status: 'Counter Sent', counterPricePerKg }
          : b
      ),
    }));
    notify('info', `Counter-offer of ₹${counterPricePerKg}/kg sent to buyer.`);
  };

  const createCropPool: AgriLinkContextValue['createCropPool'] = (input) => {
    if (input.targetQtyKg <= 0 || input.expectedPricePerKg <= 0) {
      notify('error', 'Target quantity and price must be positive.');
      return { ok: false };
    }
    const initQty = Math.max(0, Math.round(input.initialQtyKg));
    const status = initQty >= input.targetQtyKg ? 'Ready for Deal' : 'Collecting';

    setState((prev) => ({
      ...prev,
      pools: [
        {
          id: `POOL-${Math.floor(410 + Math.random() * 580)}`,
          poolName: input.poolName.trim() || `${input.village} ${input.cropName} Pool`,
          cropName: input.cropName,
          village: input.village.trim() || state.farmerProfile.village,
          buyerCompany: input.buyerCompany.trim() || 'Regional Bulk Buyer',
          targetQtyKg: Math.round(input.targetQtyKg),
          expectedPricePerKg: Number(input.expectedPricePerKg),
          dispatchDate: input.dispatchDate,
          status,
          participants:
            initQty > 0
              ? [
                  {
                    id: `PP-${Date.now()}`,
                    farmerName: `${state.farmerProfile.name} (You)`,
                    village: state.farmerProfile.village,
                    quantityKg: initQty,
                    isCurrentUser: true,
                    confirmed: true,
                  },
                ]
              : [],
        },
        ...prev.pools,
      ],
    }));
    notify('success', 'New Village Crop Pool created.');
    return { ok: true };
  };

  const joinCropPool: AgriLinkContextValue['joinCropPool'] = (poolId, quantityKg) => {
    const qty = Math.round(quantityKg);
    if (qty <= 0) {
      notify('error', 'Enter a valid quantity in kg to join the pool.');
      return { ok: false };
    }
    const pool = state.pools.find((p) => p.id === poolId);
    if (!pool || pool.status === 'Deal Confirmed') return { ok: false };

    const existingUser = pool.participants.find((p) => p.isCurrentUser);
    const updatedParticipants = existingUser
      ? pool.participants.map((p) =>
          p.isCurrentUser ? { ...p, quantityKg: p.quantityKg + qty, confirmed: true } : p
        )
      : [
          ...pool.participants,
          {
            id: `PP-${Date.now()}`,
            farmerName: `${state.farmerProfile.name} (You)`,
            village: state.farmerProfile.village,
            quantityKg: qty,
            isCurrentUser: true,
            confirmed: true,
          },
        ];

    const newTotal = updatedParticipants.reduce((s, p) => s + p.quantityKg, 0);
    const nextStatus = newTotal >= pool.targetQtyKg ? 'Ready for Deal' : 'Collecting';

    setState((prev) => ({
      ...prev,
      pools: prev.pools.map((p) =>
        p.id === poolId
          ? { ...p, participants: updatedParticipants, status: nextStatus }
          : p
      ),
    }));

    if (nextStatus === 'Ready for Deal') {
      notify('success', `Joined pool with ${qty} kg! Buyer Requirement Fulfilled – Ready for Deal.`);
    } else {
      notify('success', `Added ${qty} kg to ${pool.poolName}.`);
    }
    return { ok: true };
  };

  const leaveCropPool: AgriLinkContextValue['leaveCropPool'] = (poolId) => {
    const pool = state.pools.find((p) => p.id === poolId);
    if (!pool || pool.status === 'Deal Confirmed') {
      notify('error', 'Cannot leave a pool after deal is confirmed.');
      return;
    }
    const updatedParticipants = pool.participants.filter((p) => !p.isCurrentUser);
    const newTotal = updatedParticipants.reduce((s, p) => s + p.quantityKg, 0);
    setState((prev) => ({
      ...prev,
      pools: prev.pools.map((p) =>
        p.id === poolId
          ? {
              ...p,
              participants: updatedParticipants,
              status: newTotal >= p.targetQtyKg ? 'Ready for Deal' : 'Collecting',
            }
          : p
      ),
    }));
    notify('info', `Left ${pool.poolName}.`);
  };

  const confirmPoolDeal: AgriLinkContextValue['confirmPoolDeal'] = (poolId) => {
    const pool = state.pools.find((p) => p.id === poolId);
    if (!pool) return;
    const userShare = pool.participants.find((p) => p.isCurrentUser);
    const totalPooled = pool.participants.reduce((s, p) => s + p.quantityKg, 0);
    const dealQty = userShare ? userShare.quantityKg : totalPooled;

    setState((prev) => ({
      ...prev,
      pools: prev.pools.map((p) =>
        p.id === poolId ? { ...p, status: 'Deal Confirmed' } : p
      ),
      deals: [
        {
          id: `DL-${Math.floor(700 + Math.random() * 299)}`,
          buyerId: 'BYR-B',
          buyerName: pool.buyerCompany,
          companyName: `${pool.buyerCompany} (Crop Pool)`,
          cropName: pool.cropName,
          quantityKg: dealQty,
          agreedPricePerKg: pool.expectedPricePerKg,
          totalAmount: Math.round(dealQty * pool.expectedPricePerKg),
          deliveryDate: pool.dispatchDate,
          transportStatus: 'Pool Dispatch Scheduled',
          paymentStatus: 'Pending',
          status: 'Offer Accepted',
          updatedAt: new Date().toISOString().slice(0, 10),
        },
        ...prev.deals,
      ],
    }));
    notify('success', `Pool deal confirmed for ${pool.poolName}! Added to My Deals.`);
  };

  const createTransportRequest: AgriLinkContextValue['createTransportRequest'] = (input) => {
    if (input.quantityKg <= 0 || input.totalVehicleCost <= 0) {
      notify('error', 'Quantity and vehicle cost must be positive.');
      return { ok: false };
    }
    setState((prev) => ({
      ...prev,
      transportGroups: [
        {
          id: `TRN-${Math.floor(510 + Math.random() * 480)}`,
          vehicleType: input.vehicleType,
          driverContact: 'Local Cooperative Carrier (Demo)',
          pickupArea: input.pickupArea.trim() || state.farmerProfile.village,
          destinationMarket: input.destinationMarket,
          pickupDate: input.pickupDate,
          totalCapacityKg: Math.max(input.quantityKg, input.totalCapacityKg),
          totalVehicleCost: Math.round(input.totalVehicleCost),
          routeDescription: `${input.pickupArea} -> ${input.destinationMarket}`,
          participants: [
            {
              id: `TP-${Date.now()}`,
              farmerName: `${state.farmerProfile.name} (You)`,
              village: state.farmerProfile.village,
              cropName: input.cropName,
              quantityKg: Math.round(input.quantityKg),
              isCurrentUser: true,
            },
          ],
        },
        ...prev.transportGroups,
      ],
    }));
    notify('success', 'Shared transport request posted. Nearby farmers can now join to split cost.');
    return { ok: true };
  };

  const joinTransportGroup: AgriLinkContextValue['joinTransportGroup'] = (
    groupId,
    cropName,
    quantityKg
  ) => {
    const group = state.transportGroups.find((g) => g.id === groupId);
    if (!group) return { ok: false };
    const usedKg = group.participants.reduce((s, p) => s + p.quantityKg, 0);
    const remainingCap = Math.max(0, group.totalCapacityKg - usedKg);
    const qty = Math.round(quantityKg);

    if (qty <= 0 || qty > remainingCap) {
      notify('error', `Entered load (${qty} kg) exceeds remaining vehicle capacity (${remainingCap} kg).`);
      return { ok: false };
    }

    const updated = [
      ...group.participants.filter((p) => !p.isCurrentUser),
      {
        id: `TP-${Date.now()}`,
        farmerName: `${state.farmerProfile.name} (You)`,
        village: state.farmerProfile.village,
        cropName,
        quantityKg: qty,
        isCurrentUser: true,
      },
    ];

    setState((prev) => ({
      ...prev,
      transportGroups: prev.transportGroups.map((g) =>
        g.id === groupId ? { ...g, participants: updated } : g
      ),
    }));
    const perFarmer = Math.round(group.totalVehicleCost / updated.length);
    notify('success', `Joined shared vehicle! Split cost is now ₹${perFarmer.toLocaleString('en-IN')} per farmer.`);
    return { ok: true };
  };

  const leaveTransportGroup = (groupId: string) => {
    setState((prev) => ({
      ...prev,
      transportGroups: prev.transportGroups.map((g) =>
        g.id === groupId
          ? { ...g, participants: g.participants.filter((p) => !p.isCurrentUser) }
          : g
      ),
    }));
    notify('info', 'Left shared transport group.');
  };

  const advanceDealStatus: AgriLinkContextValue['advanceDealStatus'] = (
    dealId,
    nextStatus
  ) => {
    setState((prev) => ({
      ...prev,
      deals: prev.deals.map((d) => {
        if (d.id !== dealId) return d;
        const paymentStatus =
          nextStatus === 'Payment Completed'
            ? 'Completed'
            : nextStatus === 'Delivered'
              ? 'Processing'
              : 'Pending';
        const transportStatus =
          nextStatus === 'Pickup Scheduled'
            ? 'Vehicle Assigned'
            : nextStatus === 'In Transit'
              ? 'On the way to buyer'
              : nextStatus === 'Delivered' || nextStatus === 'Payment Completed'
                ? 'Delivered safely'
                : d.transportStatus;
        return {
          ...d,
          status: nextStatus,
          paymentStatus,
          transportStatus,
          updatedAt: new Date().toISOString().slice(0, 10),
        };
      }),
    }));
    notify('success', `Deal ${dealId} updated to "${nextStatus}".`);
  };

  const submitComplaint: AgriLinkContextValue['submitComplaint'] = (input) => {
    if (!input.description.trim()) {
      notify('error', 'Please describe the issue before submitting.');
      return { ok: false };
    }
    const buyer = state.buyers.find((b) => b.id === input.buyerId) || state.buyers[0];
    setState((prev) => ({
      ...prev,
      complaints: [
        {
          id: `CMP-${Math.floor(710 + Math.random() * 280)}`,
          buyerId: buyer.id,
          companyName: buyer.companyName,
          category: input.category,
          description: input.description.trim(),
          status: 'Submitted',
          createdAt: new Date().toISOString().slice(0, 10),
        },
        ...prev.complaints,
      ],
    }));
    notify('success', 'Complaint submitted and logged for tracking.');
    return { ok: true };
  };

  return (
    <AgriLinkContext.Provider
      value={{
        state,
        page,
        setPage,
        toasts,
        dismissToast,
        notify,
        setLanguage,
        updateFarmerProfile,
        resetDemoData,
        addHarvest,
        updateHarvest,
        sendSellingInterest,
        toggleSaveBuyer,
        sendDemandOffer,
        counterOfferDemand,
        acceptDemandOffer,
        rejectDemandOffer,
        addDemoBid,
        acceptBid,
        rejectBid,
        counterBid,
        createCropPool,
        joinCropPool,
        leaveCropPool,
        confirmPoolDeal,
        createTransportRequest,
        joinTransportGroup,
        leaveTransportGroup,
        advanceDealStatus,
        submitComplaint,
      }}
    >
      {children}
    </AgriLinkContext.Provider>
  );
};

export function useAgriLink() {
  const ctx = useContext(AgriLinkContext);
  if (!ctx) throw new Error('useAgriLink must be used inside AgriLinkProvider');
  return ctx;
}

import React, { useState } from 'react';
import { ChevronRight, Play, RotateCcw, X } from 'lucide-react';
import { useAgri } from '../context/AgriContext';

interface DemoStepDef {
  step: number;
  titleEn: string;
  titleTa: string;
  descEn: string;
  actionLabelEn: string;
}

const DEMO_STEPS: DemoStepDef[] = [
  {
    step: 1,
    titleEn: '1. Farmer lists 500 kg of tomatoes',
    titleTa: '1. விவசாயி 500 கிலோ தக்காளி பதிவு செய்கிறார்',
    descEn: 'Creates a fresh 500 kg Country Tomato listing in Attur with Digital Quality Passport.',
    actionLabelEn: 'Create 500 kg Tomato Listing',
  },
  {
    step: 2,
    titleEn: '2. System compares selling options',
    titleTa: '2. விற்பனை வழிகளை ஒப்பிடுகிறது',
    descEn: 'Evaluates Local Sandhai, Nearby Wholesale, Direct Buyer & Group Selling Net Return.',
    actionLabelEn: 'Open Selling Engine Comparison',
  },
  {
    step: 3,
    titleEn: '3. Buyer posts requirement for 400 kg',
    titleTa: '3. கொள்முதலாளர் 400 கிலோ தேவை பதிவு',
    descEn: 'Kaveri Fresh Agro Traders posts a 400 kg Country Tomato requirement at ₹23/kg.',
    actionLabelEn: 'Post 400 kg Buyer Requirement',
  },
  {
    step: 4,
    titleEn: '4. Platform finds a suitable match & alert',
    titleTa: '4. தகுந்த பொருத்தம் & விலை எச்சரிக்கை',
    descEn: 'Price Watch matches the target ₹20/kg alert against the ₹23/kg requirement.',
    actionLabelEn: 'View Triggered Match Alert',
  },
  {
    step: 5,
    titleEn: '5. Farmer joins Group Selling campaign',
    titleTa: '5. கூட்டு விற்பனை முகாமில் சேர்தல்',
    descEn: 'Farmer locks 250 kg from the new listing into the Attur–Vazhapadi Tomato Bulk Pool.',
    actionLabelEn: 'Join Group Campaign (250 kg)',
  },
  {
    step: 6,
    titleEn: '6. Fair allocation without double allocation',
    titleTa: '6. இரட்டை ஒதுக்கீடு இன்றி நியாயமான பகிர்வு',
    descEn: 'Allocates pooled tomato supply to the 400 kg buyer requirement proportionally.',
    actionLabelEn: 'Run Fair Allocation',
  },
  {
    step: 7,
    titleEn: '7. Confirmed Group Order created',
    titleTa: '7. உறுதி செய்யப்பட்ட ஆர்டர் உருவாக்கம்',
    descEn: 'Converts allocated farmer shares into confirmed orders with transparent net return.',
    actionLabelEn: 'Generate Group Orders',
  },
  {
    step: 8,
    titleEn: '8. Admin & FPO dashboard updates',
    titleTa: '8. நிர்வாகி & FPO டாஷ்போர்டு புதுப்பிப்பு',
    descEn: 'Inspect live orders, buyer verification controls, and printable FPO reports.',
    actionLabelEn: 'Open Admin Control Center',
  },
];

export const HackathonDemoBar: React.FC = () => {
  const {
    state,
    setDemoModeOpen,
    runDemoStep,
    addListing,
    addBuyerRequirement,
    joinCampaign,
    matchAndAllocateCampaign,
    createOrdersFromCampaignAllocations,
    resetDemoData,
    notify,
  } = useAgri();

  const [demoListingId, setDemoListingId] = useState<string | null>(null);
  const [demoReqId, setDemoReqId] = useState<string | null>(null);

  if (!state.demoModeOpen) return null;

  const isTa = state.language === 'ta';
  const currentStep = state.demoStep || 1;
  const activeDef = DEMO_STEPS.find((s) => s.step === currentStep) || DEMO_STEPS[0];

  const executeCurrentStep = () => {
    if (currentStep === 1) {
      const res = addListing({
        cropKey: 'tomato',
        totalQuantityKg: 500,
        village: 'Attur',
        harvestDate: '2026-11-16',
        sellingDeadline: '2026-11-19',
        qualityGrade: 'Grade A',
        expectedMinPricePerKg: 20,
        urgency: 'Normal',
        description: 'Hackathon Demo Lot: 500 kg Grade A Attur Country Tomatoes in crates.',
      });
      if (res.listingId) setDemoListingId(res.listingId);
      runDemoStep(1);
    } else if (currentStep === 2) {
      runDemoStep(2);
      notify('info', 'Comparing Local, Nearby, Direct Buyer & Group Selling returns.');
    } else if (currentStep === 3) {
      const res = addBuyerRequirement({
        buyerId: 'buyer-1',
        cropKey: 'tomato',
        requiredQtyKg: 400,
        maxOfferPricePerKg: 23,
        deliveryLocation: 'Salem Market Hub',
        transportMode: 'Group Transport',
        neededByDate: '2026-11-19',
      });
      if (res.requirementId) setDemoReqId(res.requirementId);
      runDemoStep(3);
    } else if (currentStep === 4) {
      runDemoStep(4);
      notify('success', 'Price Watch matched open ₹23/kg demand against ₹20/kg target.');
    } else if (currentStep === 5) {
      const targetListing =
        state.listings.find((l) => l.id === demoListingId) ||
        state.listings.find((l) => l.cropKey === 'tomato' && l.availableQuantityKg >= 250);
      const campaign = state.campaigns.find(
        (c) => c.cropKey === 'tomato' && c.status === 'Collecting'
      );
      if (targetListing && campaign) {
        joinCampaign({
          campaignId: campaign.id,
          listingId: targetListing.id,
          contributeQtyKg: Math.min(250, targetListing.availableQuantityKg),
        });
      } else {
        notify('info', 'Tomato campaign already funded or no matching unallocated listing.');
      }
      runDemoStep(5);
    } else if (currentStep === 6) {
      const campaign = state.campaigns.find(
        (c) => c.cropKey === 'tomato' && (c.status === 'Collecting' || c.status === 'Matched')
      );
      if (campaign) {
        matchAndAllocateCampaign({
          campaignId: campaign.id,
          buyerId: 'buyer-1',
          buyerRequirementId: demoReqId || 'REQ-201',
          buyerDemandKg: 400,
          unitPricePerKg: 23,
        });
      }
      runDemoStep(6);
    } else if (currentStep === 7) {
      const campaign = state.campaigns.find(
        (c) => c.cropKey === 'tomato' && c.status === 'Matched'
      );
      if (campaign) {
        createOrdersFromCampaignAllocations(campaign.id);
      } else {
        notify('info', 'Campaign orders already generated or awaiting allocation.');
      }
      runDemoStep(7);
    } else if (currentStep === 8) {
      runDemoStep(8);
    }
  };

  return (
    <section
      className="mb-6 bg-white border border-emerald-200 rounded-lg p-4 no-print"
      aria-label="Hackathon Guided Demonstration Mode"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            {isTa
              ? 'ஹேக்கத்தான் வழிகாட்டி செயல்முறை (8 படிகள்)'
              : 'Guided Hackathon Demonstration Mode (8-Step Workflow)'}
          </h2>
          <p className="text-xs text-slate-500">
            Step {currentStep} of 8 · Actions update shared Farmer, Buyer & Admin state live
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setDemoListingId(null);
              setDemoReqId(null);
              resetDemoData();
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>
          <button
            onClick={() => setDemoModeOpen(false)}
            className="p-1.5 text-slate-500 hover:text-slate-800 rounded-md hover:bg-slate-100"
            aria-label="Close demo guide"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Step selector strip */}
      <div className="grid grid-cols-4 md:grid-cols-8 gap-1.5 my-3">
        {DEMO_STEPS.map((s) => (
          <button
            key={s.step}
            onClick={() => runDemoStep(s.step)}
            className={`px-2 py-1.5 text-xs font-medium rounded-md border text-left transition-colors ${
              s.step === currentStep
                ? 'bg-emerald-700 text-white border-emerald-700'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span className="tabular-nums font-mono">0{s.step}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
        <div>
          <div className="text-sm font-semibold text-slate-900">
            {isTa ? activeDef.titleTa : activeDef.titleEn}
          </div>
          <p className="text-xs text-slate-600 mt-0.5">{activeDef.descEn}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={executeCurrentStep}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-md whitespace-nowrap"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{activeDef.actionLabelEn}</span>
          </button>
          {currentStep < 8 && (
            <button
              onClick={() => runDemoStep(currentStep + 1)}
              className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md whitespace-nowrap"
            >
              <span>Next Step</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

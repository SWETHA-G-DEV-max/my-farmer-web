import React from 'react';
import { AlertTriangle, CheckCircle2, Clock, ShieldAlert, ShieldCheck, ShieldQuestion } from 'lucide-react';
import { OrderStatus, RescueStatus, UrgencyLevel, VerificationStatus } from '../types';

export const VerificationLabel: React.FC<{ status: VerificationStatus }> = ({ status }) => {
  if (status === 'Verified') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
        <span>Verified</span>
      </span>
    );
  }
  if (status === 'Verification Pending') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700">
        <ShieldQuestion className="w-3.5 h-3.5 shrink-0" />
        <span>Verification Pending</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600">
      <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
      <span>Not Verified</span>
    </span>
  );
};

export const UrgencyLabel: React.FC<{ level: UrgencyLevel }> = ({ level }) => {
  if (level === 'Very Urgent') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
        <span>Very Urgent</span>
      </span>
    );
  }
  if (level === 'Urgent') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
        <Clock className="w-3.5 h-3.5 shrink-0" />
        <span>Urgent</span>
      </span>
    );
  }
  return <span className="text-xs font-medium text-slate-600">Normal</span>;
};

export const RescueStatusLabel: React.FC<{ status: RescueStatus }> = ({ status }) => {
  const tone =
    status === 'Sold' || status === 'Order Confirmed'
      ? 'text-emerald-700'
      : status === 'Offer Received' || status === 'Negotiating'
        ? 'text-amber-700'
        : 'text-slate-700';

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${tone}`}>
      {(status === 'Sold' || status === 'Order Confirmed') && (
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
      )}
      <span>{status}</span>
    </span>
  );
};

export const OrderStatusLabel: React.FC<{ status: OrderStatus }> = ({ status }) => {
  const tone =
    status === 'Completed' || status === 'Delivered'
      ? 'text-emerald-700'
      : status === 'Cancelled'
        ? 'text-red-700'
        : 'text-amber-700';
  return <span className={`text-xs font-semibold ${tone}`}>{status}</span>;
};

import React from 'react';

interface BillingToggleProps {
  isAnnual: boolean;
  onChange: (isAnnual: boolean) => void;
}

const BillingToggle: React.FC<BillingToggleProps> = ({ isAnnual, onChange }) => (
  <div className="flex items-center justify-center mb-8" role="group" aria-label="Billing period">
    <div className="inline-flex items-center bg-gray-100 rounded-full p-1 gap-1">
      <button
        type="button"
        onClick={() => onChange(false)}
        aria-pressed={!isAnnual}
        className={`text-sm font-semibold px-5 py-2 rounded-full transition-all ${
          !isAnnual
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        Monthly
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        aria-pressed={isAnnual}
        className={`flex items-center gap-2 text-sm font-semibold px-5 py-2 rounded-full transition-all ${
          isAnnual
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        Annual
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full transition-colors ${
          isAnnual
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-emerald-100 text-emerald-700'
        }`}>
          Save 20%
        </span>
      </button>
    </div>
  </div>
);

export default BillingToggle;

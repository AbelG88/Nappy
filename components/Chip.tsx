import React from 'react';

type Tone = 'blue' | 'green' | 'rose' | 'amber';

const TONES: Record<Tone, string> = {
  blue: 'border-blue-500 bg-blue-50 text-blue-700',
  green: 'border-green-500 bg-green-50 text-green-700',
  rose: 'border-rose-500 bg-rose-50 text-rose-700',
  amber: 'border-amber-500 bg-amber-50 text-amber-700',
};

interface ChipProps {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  tone?: Tone;
  /** Chip grande y centrado (para pasos del wizard). */
  large?: boolean;
}

const Chip: React.FC<ChipProps> = ({ selected, onClick, children, tone = 'blue', large = false }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={selected}
    className={`inline-flex items-center justify-center gap-2 rounded-2xl border-2 font-bold transition-all active:scale-95 ${
      large ? 'px-5 py-4 text-base' : 'px-4 py-2.5 text-sm'
    } ${selected ? TONES[tone] : 'border-slate-100 bg-slate-50 text-slate-500'}`}
  >
    {children}
  </button>
);

export default Chip;

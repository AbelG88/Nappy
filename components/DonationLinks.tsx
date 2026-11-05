import React from 'react';
import { Coffee, CreditCard } from 'lucide-react';
import { DONATION_LINKS, DonationLink } from '../services/donation';

const STYLE: Record<DonationLink['id'], string> = {
  mercadopago: 'bg-[#009ee3] hover:bg-[#008cc9] text-white shadow-sky-100',
  cafecito: 'bg-teal-700 hover:bg-teal-800 text-white shadow-teal-100',
  paypal: 'bg-[#0070ba] hover:bg-[#005ea6] text-white shadow-blue-100',
  buymeacoffee: 'bg-[#FFDD00] hover:bg-[#f2d000] text-slate-900 shadow-yellow-100',
};

const GROUPS: { id: DonationLink['group']; title: string }[] = [
  { id: 'ar', title: 'Desde Argentina' },
  { id: 'intl', title: 'Desde el exterior' },
];

const DonationLinks: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => size === 'sm' ? (
  <div className="space-y-2">
    {GROUPS.map(g => (
      <div key={g.id} className="space-y-1">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-left">{g.title}</p>
        <div className="flex gap-2">
          {DONATION_LINKS.filter(l => l.group === g.id).map(l => (
            <a
              key={l.id}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex-1 min-w-0 font-bold text-xs py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 ${STYLE[l.id]}`}
            >
              {l.id === 'cafecito' || l.id === 'buymeacoffee' ? <Coffee size={14} className="shrink-0" /> : <CreditCard size={14} className="shrink-0" />}
              <span className="truncate">{l.label}</span>
            </a>
          ))}
        </div>
      </div>
    ))}
  </div>
) : (
  <div className="space-y-4">
    {GROUPS.map(g => (
      <div key={g.id} className="space-y-2">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">{g.title}</p>
        {DONATION_LINKS.filter(l => l.group === g.id).map(l => (
          <a
            key={l.id}
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`w-full font-bold rounded-2xl flex items-center justify-center gap-2.5 shadow-lg transition-all active:scale-95 ${
              size === 'lg' ? 'py-3.5' : 'py-3'
            } ${STYLE[l.id]}`}
          >
            {l.id === 'cafecito' || l.id === 'buymeacoffee' ? <Coffee size={18} /> : <CreditCard size={18} />}
            {l.label}
          </a>
        ))}
      </div>
    ))}
  </div>
);

export default DonationLinks;

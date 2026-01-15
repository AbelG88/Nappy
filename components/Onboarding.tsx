import React, { useState } from 'react';
import { Baby, User, Check, ArrowRight, Heart } from 'lucide-react';

interface OnboardingProps {
  onComplete: (childName: string, caregiverName: string, caregiverRole: string) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [childName, setChildName] = useState('');
  const [caregiverName, setCaregiverName] = useState('');
  const [caregiverRole, setCaregiverRole] = useState('Papá/Mamá');

  const totalSteps = 4;

  const nextStep = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const handleFinish = () => {
    onComplete(childName || 'Mi Peque', caregiverName || 'Cuidador', caregiverRole || 'Principal');
  };

  return (
    <div className="fixed inset-0 z-[200] bg-white flex flex-col p-6 animate-in fade-in duration-500">
      {/* Progress Bar */}
      <div className="flex gap-1 mb-12">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div 
            key={i} 
            className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
              i + 1 <= step ? 'bg-blue-500' : 'bg-slate-100'
            }`} 
          />
        ))}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-xs mx-auto space-y-8">
        
        {step === 1 && (
          <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-500">
            <div className="w-24 h-24 bg-blue-500 text-white rounded-[32px] flex items-center justify-center mx-auto shadow-2xl shadow-blue-200">
              <span className="text-4xl">🚽</span>
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">¡Hola! Soy Nappy</h1>
              <p className="text-slate-500 leading-relaxed">
                Te ayudaré a seguir el proceso de dejar el pañal de forma fácil y divertida.
              </p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="w-full space-y-8 animate-in slide-in-from-bottom-8 duration-500">
            <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-3xl flex items-center justify-center mx-auto">
              <Baby size={40} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-800">¿A quién vamos a acompañar?</h2>
              <p className="text-slate-400 text-sm">Dinos el nombre de tu peque</p>
            </div>
            <input
              autoFocus
              type="text"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              placeholder="Ej: Mateo, Sofía..."
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-center text-lg font-bold text-slate-700 focus:border-blue-500 outline-none transition-all"
            />
          </div>
        )}

        {step === 3 && (
          <div className="w-full space-y-6 animate-in slide-in-from-bottom-8 duration-500">
            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto">
              <User size={40} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-800">¿Y tú eres...?</h2>
              <p className="text-slate-400 text-sm">Configura el perfil del cuidador principal</p>
            </div>
            <div className="space-y-3">
              <input
                autoFocus
                type="text"
                value={caregiverName}
                onChange={(e) => setCaregiverName(e.target.value)}
                placeholder="Tu nombre"
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-center font-bold text-slate-700 focus:border-blue-500 outline-none transition-all"
              />
              <input
                type="text"
                value={caregiverRole}
                onChange={(e) => setCaregiverRole(e.target.value)}
                placeholder="Tu rol (Ej: Mamá, Tío, Niñera)"
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-center text-sm font-medium text-slate-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-green-500 text-white rounded-[32px] flex items-center justify-center mx-auto shadow-2xl shadow-green-200">
              <Check size={48} />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">¡Todo listo!</h2>
              <p className="text-slate-500 leading-relaxed px-4">
                Ya podemos empezar a registrar los hitos de <b>{childName || 'tu peque'}</b>.
              </p>
            </div>
            <div className="flex justify-center gap-2 py-4">
              <span className="text-2xl">✨</span>
              <span className="text-2xl">🎉</span>
              <span className="text-2xl">🚽</span>
            </div>
          </div>
        )}

      </div>

      <div className="mt-auto pt-8">
        {step < totalSteps ? (
          <button
            onClick={nextStep}
            disabled={step === 2 && !childName}
            className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
              step === 2 && !childName 
                ? 'bg-slate-100 text-slate-400' 
                : 'bg-blue-600 text-white shadow-xl shadow-blue-200 active:scale-95'
            }`}
          >
            Siguiente <ArrowRight size={20} />
          </button>
        ) : (
          <button
            onClick={handleFinish}
            className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-green-200 active:scale-95 animate-in slide-in-from-bottom-4 duration-500"
          >
            ¡Empezar ahora!
          </button>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
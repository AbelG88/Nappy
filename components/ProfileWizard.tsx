import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Upload, X } from 'lucide-react';
import { Caregiver, Goal, Sex, TellsNeed } from '../types';
import {
  AGE_OPTIONS,
  CAREGIVER_PRESETS,
  GOAL_OPTIONS,
  SEX_OPTIONS,
  TELLS_OPTIONS,
  formatAge,
} from '../constants';
import Chip from './Chip';
import Avatar from './Avatar';

export interface WizardResult {
  name: string;
  sex: Sex;
  ageMonths: number;
  goal: Goal;
  nightDiaper: boolean;
  tellsNeed: TellsNeed;
  /** Roles elegidos (Papá, Mamá, ...). Los que ya existan no se duplican. */
  caregiverRoles: string[];
}

interface ProfileWizardProps {
  existingCaregivers: Caregiver[];
  /** Primer perfil: muestra bienvenida y no se puede cancelar. */
  isFirst: boolean;
  onComplete: (result: WizardResult) => void;
  onCancel?: () => void;
  /** Si se pasa, la bienvenida ofrece traer el historial de otro cuidador desde un respaldo. */
  onImport?: (file: File) => void;
}

type StepId = 'welcome' | 'name' | 'sex' | 'age' | 'goal' | 'habits' | 'caregivers' | 'done';

const ProfileWizard: React.FC<ProfileWizardProps> = ({ existingCaregivers, isFirst, onComplete, onCancel, onImport }) => {
  const importInputRef = useRef<HTMLInputElement>(null);
  const steps: StepId[] = [
    ...(isFirst ? (['welcome'] as StepId[]) : []),
    'name', 'sex', 'age', 'goal', 'habits', 'caregivers', 'done',
  ];

  const [stepIndex, setStepIndex] = useState(0);
  const [name, setName] = useState('');
  const [sex, setSex] = useState<Sex | null>(null);
  const [ageMonths, setAgeMonths] = useState<number | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [nightDiaper, setNightDiaper] = useState<boolean | null>(null);
  const [tellsNeed, setTellsNeed] = useState<TellsNeed | null>(null);
  const [roles, setRoles] = useState<string[]>(() =>
    CAREGIVER_PRESETS
      .filter(p => existingCaregivers.some(c => c.role === p.role || c.name === p.role))
      .map(p => p.role)
  );

  const advanceTimer = useRef<number | null>(null);
  useEffect(() => () => { if (advanceTimer.current) window.clearTimeout(advanceTimer.current); }, []);

  const step = steps[stepIndex];
  const next = () => setStepIndex(i => Math.min(i + 1, steps.length - 1));
  const back = () => setStepIndex(i => Math.max(i - 1, 0));

  // En pasos de una sola opción, avanza solo al tocar el chip.
  const pickAndAdvance = (apply: () => void) => {
    apply();
    if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
    advanceTimer.current = window.setTimeout(next, 220);
  };

  const toggleRole = (role: string) =>
    setRoles(prev => (prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]));

  const needsCaregiver = existingCaregivers.length === 0;
  const canContinue =
    step === 'name' ? name.trim().length > 0
    : step === 'habits' ? nightDiaper !== null && tellsNeed !== null
    : step === 'caregivers' ? !(needsCaregiver && roles.length === 0)
    : true;

  const handleFinish = () => {
    onComplete({
      name: name.trim() || 'Mi Peque',
      sex: sex ?? 'unknown',
      ageMonths: ageMonths ?? 30,
      goal: goal ?? 'both',
      nightDiaper: nightDiaper ?? true,
      tellsNeed: tellsNeed ?? 'sometimes',
      caregiverRoles: roles,
    });
  };

  const showNext = step === 'welcome' || step === 'name' || step === 'habits' || step === 'caregivers';
  const title = name.trim() || 'tu peque';

  return (
    <div className="fixed inset-0 z-[200] bg-white flex flex-col p-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-3 mb-8">
        {stepIndex > 0 && step !== 'done' ? (
          <button onClick={back} className="p-2 -ml-2 text-slate-400 active:text-slate-600" aria-label="Atrás">
            <ArrowLeft size={22} />
          </button>
        ) : (
          <div className="w-[30px]" />
        )}
        <div className="flex gap-1 flex-1">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                i <= stepIndex ? 'bg-blue-500' : 'bg-slate-100'
              }`}
            />
          ))}
        </div>
        {!isFirst && onCancel ? (
          <button onClick={onCancel} className="p-2 -mr-2 text-slate-400 active:text-slate-600" aria-label="Cancelar">
            <X size={22} />
          </button>
        ) : (
          <div className="w-[30px]" />
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-xs w-full mx-auto space-y-8 overflow-y-auto no-scrollbar">
        {step === 'welcome' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-500">
            <div className="w-24 h-24 bg-blue-500 text-white rounded-[32px] flex items-center justify-center mx-auto shadow-2xl shadow-blue-200">
              <span className="text-4xl">🚽</span>
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">¡Hola! Soy Nappy</h1>
              <p className="text-slate-500 leading-relaxed">
                Te ayudo a seguir el proceso de dejar el pañal. Son 6 preguntas rápidas, casi todo con un toque.
              </p>
            </div>
            {onImport && (
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={() => importInputRef.current?.click()}
                  className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-3 active:scale-95 transition-transform"
                >
                  <Upload size={16} /> Ya tengo un respaldo
                </button>
                <p className="text-[11px] text-slate-400 leading-snug">
                  ¿Otro cuidador ya usa Nappy? Pedile su respaldo e importalo acá para ver el mismo historial.
                </p>
                <input
                  ref={importInputRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onImport(file);
                    e.target.value = '';
                  }}
                />
              </div>
            )}
          </div>
        )}

        {step === 'name' && (
          <div className="w-full space-y-6 animate-in slide-in-from-bottom-8 duration-500">
            <h2 className="text-2xl font-black text-slate-800">¿Cómo se llama el peque?</h2>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && canContinue) next(); }}
              placeholder="Ej: Mateo, Sofía..."
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-center text-lg font-bold text-slate-700 focus:border-blue-500 outline-none transition-all"
            />
          </div>
        )}

        {step === 'sex' && (
          <div className="w-full space-y-6 animate-in slide-in-from-bottom-8 duration-500">
            <h2 className="text-2xl font-black text-slate-800">¿{title} es nena o nene?</h2>
            <p className="text-slate-400 text-sm">Es solo para elegir el ícono.</p>
            <div className="flex gap-3 justify-center">
              {SEX_OPTIONS.map(o => (
                <Chip key={o.value} large selected={sex === o.value} onClick={() => pickAndAdvance(() => setSex(o.value))}>
                  <span className="text-2xl">{o.emoji}</span> {o.label}
                </Chip>
              ))}
            </div>
          </div>
        )}

        {step === 'age' && (
          <div className="w-full space-y-6 animate-in slide-in-from-bottom-8 duration-500">
            <h2 className="text-2xl font-black text-slate-800">¿Qué edad tiene {title}?</h2>
            <div className="grid grid-cols-2 gap-3">
              {AGE_OPTIONS.map(o => (
                <Chip key={o.months} large selected={ageMonths === o.months} onClick={() => pickAndAdvance(() => setAgeMonths(o.months))}>
                  {o.label}
                </Chip>
              ))}
            </div>
          </div>
        )}

        {step === 'goal' && (
          <div className="w-full space-y-6 animate-in slide-in-from-bottom-8 duration-500">
            <h2 className="text-2xl font-black text-slate-800">¿Qué vamos a entrenar?</h2>
            <div className="flex flex-col gap-3">
              {GOAL_OPTIONS.map(o => (
                <Chip key={o.value} large selected={goal === o.value} onClick={() => pickAndAdvance(() => setGoal(o.value))}>
                  <span className="text-2xl">{o.emoji}</span> {o.label}
                </Chip>
              ))}
            </div>
          </div>
        )}

        {step === 'habits' && (
          <div className="w-full space-y-8 animate-in slide-in-from-bottom-8 duration-500">
            <div className="space-y-4">
              <h2 className="text-xl font-black text-slate-800">¿Usa pañal para dormir?</h2>
              <div className="flex gap-3 justify-center">
                <Chip large selected={nightDiaper === true} onClick={() => setNightDiaper(true)}>Sí</Chip>
                <Chip large selected={nightDiaper === false} onClick={() => setNightDiaper(false)}>No</Chip>
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-xl font-black text-slate-800">¿Avisa cuando tiene ganas?</h2>
              <div className="flex flex-wrap gap-3 justify-center">
                {TELLS_OPTIONS.map(o => (
                  <Chip key={o.value} large selected={tellsNeed === o.value} onClick={() => setTellsNeed(o.value)}>
                    {o.label}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 'caregivers' && (
          <div className="w-full space-y-6 animate-in slide-in-from-bottom-8 duration-500">
            <h2 className="text-2xl font-black text-slate-800">¿Quiénes lo acompañan?</h2>
            <p className="text-slate-400 text-sm">Elegí todos los que quieras. Después los elegís con un toque al registrar.</p>
            <div className="flex flex-wrap gap-3 justify-center">
              {CAREGIVER_PRESETS.map(p => (
                <Chip key={p.role} large selected={roles.includes(p.role)} onClick={() => toggleRole(p.role)}>
                  <span className="text-xl">{p.emoji}</span> {p.role}
                </Chip>
              ))}
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="space-y-6 animate-in zoom-in-95 duration-500">
            <div className="mx-auto w-fit">
              <Avatar sex={sex ?? 'unknown'} size="lg" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">¡Todo listo!</h2>
              <p className="text-slate-500 leading-relaxed px-4">
                Ya podemos empezar con <b>{title}</b>
                {ageMonths ? <> ({formatAge(ageMonths)})</> : null}.
              </p>
            </div>
            <div className="flex justify-center gap-2 py-2">
              <span className="text-2xl">✨</span>
              <span className="text-2xl">🎉</span>
              <span className="text-2xl">🚽</span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-auto pt-8">
        {step === 'done' ? (
          <button
            onClick={handleFinish}
            className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-green-200 active:scale-95 transition-all"
          >
            <Check size={20} /> ¡Empezar ahora!
          </button>
        ) : showNext ? (
          <button
            onClick={next}
            disabled={!canContinue}
            className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
              canContinue
                ? 'bg-blue-600 text-white shadow-xl shadow-blue-200 active:scale-95'
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            Siguiente <ArrowRight size={20} />
          </button>
        ) : (
          <div className="h-[56px]" />
        )}
      </div>
    </div>
  );
};

export default ProfileWizard;

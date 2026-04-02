import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Trash2 } from 'lucide-react';
import { DayOfWeek, MuscleCategory, ExercisePlan } from '../types';
import { updatePlan } from '../utils/storage';
import { useLanguage } from '../contexts/LanguageContext';

interface EditExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: ExercisePlan | null;
}

const DAYS: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const CATEGORIES: MuscleCategory[] = ['arme', 'beine', 'brust', 'rücken', 'schultern', 'bauch', 'ganzkörper', 'cardio', 'andere'];

export default function EditExerciseModal({ isOpen, onClose, plan }: EditExerciseModalProps) {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>('monday');
  const [muscleGroup, setMuscleGroup] = useState<MuscleCategory>('brust');
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(12);
  const [instructions, setInstructions] = useState('');

  useEffect(() => {
    if (plan) {
      setName(plan.name);
      
      // Normalize dayOfWeek
      const dayMapping: Record<string, DayOfWeek> = {
        'montag': 'monday', 'dienstag': 'tuesday', 'mittwoch': 'wednesday',
        'donnerstag': 'thursday', 'freitag': 'friday', 'samstag': 'saturday', 'sonntag': 'sunday'
      };
      const normalizedDay = dayMapping[plan.dayOfWeek.toLowerCase()] || plan.dayOfWeek.toLowerCase() as DayOfWeek;
      setDayOfWeek(normalizedDay);
      
      // Normalize muscleGroup
      const muscleMapping: Record<string, MuscleCategory> = {
        'arme': 'arme', 'beine': 'beine', 'brust': 'brust', 'rücken': 'rücken',
        'schultern': 'schultern', 'bauch': 'bauch', 'ganzkörper': 'ganzkörper',
        'cardio': 'cardio', 'andere': 'andere'
      };
      const normalizedMuscle = muscleMapping[plan.muscleGroup.toLowerCase()] || plan.muscleGroup.toLowerCase() as MuscleCategory;
      setMuscleGroup(normalizedMuscle);
      
      setSets(plan.sets || 3);
      setReps(plan.reps || 12);
      setInstructions(plan.instructions || '');
    }
  }, [plan]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !plan) return;

    await updatePlan(plan.id, {
      name,
      dayOfWeek,
      muscleGroup,
      sets,
      reps,
      instructions
    });

    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && plan && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-[#1e293b] border border-[#1d7a82]/50 shadow-[0_0_30px_rgba(29,122,130,0.2)] rounded-2xl z-50 overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="flex justify-between items-center p-5 border-b border-white/10 shrink-0">
              <h2 className="text-xl font-semibold text-white text-glow-teal">{t('editExercise')}</h2>
              <button onClick={onClose} className="text-slate-400 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">{t('exerciseName')}</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('exercisePlaceholder')}
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-glow-teal transition-all"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">{t('muscleGroup')}</label>
                    <select
                      value={muscleGroup}
                      onChange={(e) => setMuscleGroup(e.target.value as MuscleCategory)}
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-glow-teal transition-all appearance-none"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat} className="bg-[#1e293b]">{t(cat.toLowerCase() as any)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">{t('dayOfWeek')}</label>
                    <select
                      value={dayOfWeek}
                      onChange={(e) => setDayOfWeek(e.target.value as DayOfWeek)}
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-glow-teal transition-all appearance-none"
                    >
                      {DAYS.map(day => (
                        <option key={day} value={day} className="bg-[#1e293b]">{t(day.toLowerCase() as any)}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">{t('sets' as any) || 'Sets'}</label>
                    <input
                      type="number"
                      value={sets}
                      onChange={(e) => setSets(Number(e.target.value))}
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-glow-teal transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">{t('reps' as any) || 'Reps'}</label>
                    <input
                      type="number"
                      value={reps}
                      onChange={(e) => setReps(Number(e.target.value))}
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-glow-teal transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">{t('instructions' as any) || 'Instructions'}</label>
                  <textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-glow-teal transition-all h-24 resize-none"
                  />
                </div>
              </div>

              <div className="pt-4 sticky bottom-0 bg-[#1e293b] pb-2">
                <button
                  type="submit"
                  className="w-full bg-[#1d7a82] hover:bg-[#155e63] text-white py-3 rounded-xl font-medium transition-all glow-teal active:scale-95 border border-[#1d7a82]"
                >
                  {t('saveChanges')}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Trash2 } from 'lucide-react';
import { DayOfWeek, MuscleCategory, ExercisePlan, Exercise } from '../types';
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
  const [exercises, setExercises] = useState<Exercise[]>([]);

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
      setExercises(plan.exercises || []);
    }
  }, [plan]);

  const handleAddExercise = () => {
    setExercises([...exercises, { name: '', sets: 3, reps: 12, instructions: '' }]);
  };

  const handleRemoveExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const handleExerciseChange = (index: number, field: keyof Exercise, value: string | number) => {
    const newExercises = [...exercises];
    newExercises[index] = { ...newExercises[index], [field]: value };
    setExercises(newExercises);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !plan) return;

    await updatePlan(plan.id, {
      name,
      dayOfWeek,
      muscleGroup,
      exercises
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
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">{t('exercises' as any)}</h3>
                  <button
                    type="button"
                    onClick={handleAddExercise}
                    className="flex items-center gap-1 text-xs text-[#1d7a82] hover:text-[#155e63] transition-colors"
                  >
                    <Plus className="w-3 h-3" /> {t('addExercise' as any)}
                  </button>
                </div>

                <div className="space-y-3">
                  {exercises.map((ex, idx) => (
                    <div key={idx} className="bg-black/20 border border-white/5 rounded-xl p-3 space-y-3 relative group/ex">
                      <button
                        type="button"
                        onClick={() => handleRemoveExercise(idx)}
                        className="absolute top-2 right-2 text-slate-500 hover:text-red-400 opacity-0 group-hover/ex:opacity-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      
                      <div className="grid grid-cols-1 gap-3">
                        <input
                          type="text"
                          value={ex.name}
                          onChange={(e) => handleExerciseChange(idx, 'name', e.target.value)}
                          placeholder={t('exerciseName')}
                          className="bg-transparent border-b border-white/10 text-sm text-white focus:border-[#1d7a82] outline-none py-1"
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-500 uppercase">{t('sets' as any)}</span>
                            <input
                              type="number"
                              value={ex.sets}
                              onChange={(e) => handleExerciseChange(idx, 'sets', Number(e.target.value))}
                              className="w-12 bg-white/5 border border-white/10 rounded px-1 py-0.5 text-xs text-white text-center"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-500 uppercase">{t('reps' as any)}</span>
                            <input
                              type="number"
                              value={ex.reps}
                              onChange={(e) => handleExerciseChange(idx, 'reps', Number(e.target.value))}
                              className="w-12 bg-white/5 border border-white/10 rounded px-1 py-0.5 text-xs text-white text-center"
                            />
                          </div>
                        </div>
                        <textarea
                          value={ex.instructions}
                          onChange={(e) => handleExerciseChange(idx, 'instructions', e.target.value)}
                          placeholder={t('instructions' as any)}
                          className="bg-white/5 border border-white/10 rounded-lg p-2 text-[10px] text-slate-300 outline-none focus:border-[#1d7a82] h-12 resize-none"
                        />
                      </div>
                    </div>
                  ))}
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

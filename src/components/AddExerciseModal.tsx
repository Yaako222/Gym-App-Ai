import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Dumbbell, Bookmark, Trash2 } from 'lucide-react';
import { DayOfWeek, MuscleCategory, ExercisePlan, Exercise } from '../types';
import { addPlan } from '../utils/storage';
import { useLanguage } from '../contexts/LanguageContext';

interface AddExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  plans: ExercisePlan[];
}

const DAYS: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const CATEGORIES: MuscleCategory[] = ['arme', 'beine', 'brust', 'rücken', 'schultern', 'bauch', 'ganzkörper', 'cardio', 'andere'];

export default function AddExerciseModal({ isOpen, onClose, plans }: AddExerciseModalProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'saved' | 'new'>('saved');
  const [name, setName] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>('monday');
  const [muscleGroup, setMuscleGroup] = useState<MuscleCategory>('brust');
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(12);
  const [instructions, setInstructions] = useState('');

  // Get unique exercises grouped by muscle category
  const groupedSavedExercises = useMemo(() => {
    const unique = new Map<string, { name: string, muscleGroup: MuscleCategory, sets: number, reps: number, instructions: string }>();
    const sortedPlans = [...plans].sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());
    
    for (const plan of sortedPlans) {
      if (!unique.has(plan.name.toLowerCase())) {
        unique.set(plan.name.toLowerCase(), { 
          name: plan.name, 
          muscleGroup: plan.muscleGroup,
          sets: plan.sets || 3,
          reps: plan.reps || 12,
          instructions: plan.instructions || ''
        });
      }
    }

    const grouped: Record<string, { name: string, muscleGroup: MuscleCategory, sets: number, reps: number, instructions: string }[]> = {};
    Array.from(unique.values()).forEach(ex => {
      if (!grouped[ex.muscleGroup]) grouped[ex.muscleGroup] = [];
      grouped[ex.muscleGroup].push(ex);
    });

    return grouped;
  }, [plans]);

  const handleSelectSaved = (exercise: { name: string, muscleGroup: MuscleCategory, sets: number, reps: number, instructions: string }) => {
    setName(exercise.name);
    setMuscleGroup(exercise.muscleGroup);
    setSets(exercise.sets);
    setReps(exercise.reps);
    setInstructions(exercise.instructions);
    setActiveTab('new');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    await addPlan({
      name,
      dayOfWeek,
      muscleGroup,
      sets,
      reps,
      instructions
    });

    setName('');
    setDayOfWeek('monday');
    setMuscleGroup('brust');
    setSets(3);
    setReps(12);
    setInstructions('');
    setActiveTab('saved');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
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
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#1e293b] border border-[#1d7a82]/50 shadow-[0_0_30px_rgba(29,122,130,0.2)] rounded-2xl z-50 overflow-hidden flex flex-col max-h-[85vh]"
          >
            <div className="flex justify-between items-center p-5 border-b border-white/10 shrink-0">
              <h2 className="text-xl font-semibold text-white text-glow-teal">{t('addExercise')}</h2>
              <button onClick={onClose} className="text-slate-400 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex border-b border-white/10 shrink-0">
              <button 
                onClick={() => setActiveTab('saved')} 
                className={`flex-1 py-3 text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'saved' ? 'text-[#1d7a82] border-b-2 border-[#1d7a82] bg-[#1d7a82]/10' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
              >
                <Bookmark className="w-4 h-4" />
                {t('saved')}
              </button>
              <button 
                onClick={() => setActiveTab('new')} 
                className={`flex-1 py-3 text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'new' ? 'text-[#1d7a82] border-b-2 border-[#1d7a82] bg-[#1d7a82]/10' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
              >
                <Dumbbell className="w-4 h-4" />
                {t('createNew')}
              </button>
            </div>
            
            <div className="overflow-y-auto p-5 custom-scrollbar">
              {activeTab === 'saved' ? (
                <div className="space-y-6">
                  {Object.keys(groupedSavedExercises).length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-slate-400 mb-4">{t('noExercisesSaved')}</p>
                      <button 
                        onClick={() => setActiveTab('new')}
                        className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm transition-all"
                      >
                        {t('createFirstExercise')}
                      </button>
                    </div>
                  ) : (
                    Object.entries(groupedSavedExercises).map(([muscleGroup, exercises]) => (
                      <div key={muscleGroup} className="space-y-3">
                        <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-white/10 pb-1">
                          <span className="w-2 h-4 bg-[#FF0050] rounded-full glow-pink"></span>
                          {t(muscleGroup.toLowerCase() as any)}
                        </h3>
                        <div className="grid grid-cols-1 gap-2">
                          {exercises.map((ex, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSelectSaved(ex)}
                              className="text-left bg-white/5 border border-white/10 hover:border-[#1d7a82]/50 hover:bg-[#1d7a82]/10 text-slate-200 p-3 rounded-xl transition-all flex justify-between items-center group"
                            >
                              <span>{ex.name}</span>
                              <Plus className="w-4 h-4 text-slate-500 group-hover:text-[#1d7a82]" />
                            </button>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
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

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">{t('sets' as any)}</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={sets}
                        onChange={(e) => setSets(Number(e.target.value))}
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-glow-teal transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">{t('reps' as any)}</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={reps}
                        onChange={(e) => setReps(Number(e.target.value))}
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-glow-teal transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">{t('instructions' as any)}</label>
                    <textarea
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      placeholder={t('instructions' as any)}
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-glow-teal transition-all h-24 resize-none"
                    />
                  </div>

                  <div className="pt-4 sticky bottom-0 bg-[#1e293b] pb-2">
                    <button
                      type="submit"
                      className="w-full bg-[#FF0050] hover:bg-[#e60048] text-white py-3 rounded-xl font-medium transition-all glow-pink active:scale-95 border border-[#FF0050]"
                    >
                      {t('addToPlan')}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

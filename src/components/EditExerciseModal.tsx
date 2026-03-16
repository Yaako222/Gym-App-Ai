import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { DayOfWeek, MuscleCategory, ExercisePlan } from '../types';
import { updatePlan } from '../utils/storage';

interface EditExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: ExercisePlan | null;
}

const DAYS: DayOfWeek[] = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
const CATEGORIES: MuscleCategory[] = ['Arme', 'Beine', 'Brust', 'Rücken', 'Schultern', 'Bauch', 'Ganzkörper', 'Cardio', 'Andere'];

export default function EditExerciseModal({ isOpen, onClose, plan }: EditExerciseModalProps) {
  const [name, setName] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>('Montag');
  const [muscleGroup, setMuscleGroup] = useState<MuscleCategory>('Brust');

  useEffect(() => {
    if (plan) {
      setName(plan.name);
      setDayOfWeek(plan.dayOfWeek);
      setMuscleGroup(plan.muscleGroup);
    }
  }, [plan]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !plan) return;

    await updatePlan(plan.id, {
      name,
      dayOfWeek,
      muscleGroup
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
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#1e293b] border border-[#1d7a82]/50 shadow-[0_0_30px_rgba(29,122,130,0.2)] rounded-2xl z-50 overflow-hidden"
          >
            <div className="flex justify-between items-center p-5 border-b border-white/10">
              <h2 className="text-xl font-semibold text-white text-glow-teal">Übung bearbeiten</h2>
              <button onClick={onClose} className="text-slate-400 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Übungsname</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="z.B. Bankdrücken"
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-glow-teal transition-all"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Muskelgruppe</label>
                  <select
                    value={muscleGroup}
                    onChange={(e) => setMuscleGroup(e.target.value as MuscleCategory)}
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-glow-teal transition-all appearance-none"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat} className="bg-[#1e293b]">{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Wochentag</label>
                  <select
                    value={dayOfWeek}
                    onChange={(e) => setDayOfWeek(e.target.value as DayOfWeek)}
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-glow-teal transition-all appearance-none"
                  >
                    {DAYS.map(day => (
                      <option key={day} value={day} className="bg-[#1e293b]">{day}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-[#1d7a82] hover:bg-[#155e63] text-white py-3 rounded-xl font-medium transition-all glow-teal active:scale-95 border border-[#1d7a82]"
                >
                  Änderungen speichern
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

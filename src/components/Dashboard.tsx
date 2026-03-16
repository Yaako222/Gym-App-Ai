import { useState, useEffect } from 'react';
import { ExercisePlan, DayOfWeek } from '../types';
import { fuzzyMatch } from '../utils/search';
import { deletePlan } from '../utils/storage';
import { Trash2, Target, Edit2, Coffee } from 'lucide-react';
import { motion } from 'motion/react';
import EditExerciseModal from './EditExerciseModal';

interface DashboardProps {
  plans: ExercisePlan[];
  searchQuery: string;
}

const DAYS: DayOfWeek[] = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

export default function Dashboard({ plans, searchQuery }: DashboardProps) {
  const [editingPlan, setEditingPlan] = useState<ExercisePlan | null>(null);
  const [weeklyRestDays, setWeeklyRestDays] = useState<DayOfWeek[]>([]);

  useEffect(() => {
    const savedRestDays = localStorage.getItem('gym_weekly_restdays');
    if (savedRestDays) {
      setWeeklyRestDays(JSON.parse(savedRestDays));
    }
  }, []);

  const toggleRestDay = (day: DayOfWeek) => {
    const newRestDays = weeklyRestDays.includes(day)
      ? weeklyRestDays.filter(d => d !== day)
      : [...weeklyRestDays, day];
    
    setWeeklyRestDays(newRestDays);
    localStorage.setItem('gym_weekly_restdays', JSON.stringify(newRestDays));
  };

  const filteredPlans = plans.filter(p => fuzzyMatch(searchQuery, p.name));

  const handleDelete = async (id: string) => {
    await deletePlan(id);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {DAYS.map(day => {
        const dayPlans = filteredPlans.filter(p => p.dayOfWeek === day);
        
        if (searchQuery && dayPlans.length === 0) return null;

        const isRestDay = weeklyRestDays.includes(day);

        return (
          <div key={day} className={`bg-white/5 border ${isRestDay ? 'border-[#1d7a82]/50 shadow-[0_0_15px_rgba(29,122,130,0.1)]' : 'border-white/10 hover:border-[#1d7a82]/30 hover:shadow-[0_0_20px_rgba(29,122,130,0.15)]'} rounded-2xl p-5 backdrop-blur-sm flex flex-col min-h-[200px] transition-all group relative`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2 group-hover:text-glow-teal transition-all">
                <div className={`w-2 h-2 rounded-full ${isRestDay ? 'bg-[#1d7a82] shadow-[0_0_8px_rgba(29,122,130,0.8)]' : 'bg-slate-600'}`}></div>
                {day}
              </h2>
              <button
                onClick={() => toggleRestDay(day)}
                className={`p-2 rounded-lg transition-all ${isRestDay ? 'text-[#1d7a82] bg-[#1d7a82]/10' : 'text-slate-500 hover:text-[#1d7a82] hover:bg-white/5'}`}
                title={isRestDay ? "Restday entfernen" : "Als Restday markieren"}
              >
                <Coffee className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex-1 flex flex-col gap-3">
              {isRestDay ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-8 opacity-70">
                  <Coffee className="w-8 h-8 text-[#1d7a82] mb-2 drop-shadow-[0_0_8px_rgba(29,122,130,0.5)]" />
                  <p className="text-sm text-[#1d7a82] font-medium">Restday</p>
                  <p className="text-xs text-slate-400 mt-1">Zeit zur Erholung</p>
                </div>
              ) : dayPlans.length === 0 ? (
                <p className="text-sm text-slate-500 italic my-auto text-center py-8">Keine Übungen</p>
              ) : (
                dayPlans.map(plan => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    key={plan.id} 
                    className="group/item relative bg-white/5 hover:bg-[#1d7a82]/10 border border-white/5 hover:border-[#1d7a82]/50 hover:shadow-[0_0_10px_rgba(29,122,130,0.2)] rounded-xl p-3 transition-all"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-slate-200 pr-12 group-hover/item:text-white">{plan.name}</h3>
                      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover/item:opacity-100 transition-all">
                        <button 
                          onClick={() => setEditingPlan(plan)}
                          className="text-slate-500 hover:text-[#1d7a82] hover:drop-shadow-[0_0_8px_rgba(29,122,130,0.8)] p-1"
                          title="Bearbeiten"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(plan.id)}
                          className="text-slate-500 hover:text-[#FF0050] hover:drop-shadow-[0_0_8px_rgba(255,0,80,0.8)] p-1"
                          title="Löschen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                      <span className="flex items-center gap-1 bg-black/20 px-2 py-1 rounded-md text-[#FF0050] drop-shadow-[0_0_5px_rgba(255,0,80,0.5)]">
                        <Target className="w-3 h-3" />
                        {plan.muscleGroup}
                      </span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        );
      })}

      <EditExerciseModal 
        isOpen={!!editingPlan} 
        onClose={() => setEditingPlan(null)} 
        plan={editingPlan} 
      />
    </div>
  );
}

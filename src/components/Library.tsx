import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { ExercisePlan, MuscleCategory } from '../types';
import { deletePlan } from '../utils/storage';
import { Trash2, Edit2, Database, Search } from 'lucide-react';
import EditExerciseModal from './EditExerciseModal';
import { useLanguage } from '../contexts/LanguageContext';
import { TranslationKey } from '../utils/translations';

interface LibraryProps {
  plans: ExercisePlan[];
}

export default function Library({ plans }: LibraryProps) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingPlan, setEditingPlan] = useState<ExercisePlan | null>(null);
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);

  const filteredPlans = useMemo(() => {
    return plans.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [plans, searchQuery]);

  const groupedPlans = useMemo(() => {
    const groups: Partial<Record<MuscleCategory, ExercisePlan[]>> = {};
    filteredPlans.forEach(plan => {
      if (!groups[plan.muscleGroup]) groups[plan.muscleGroup] = [];
      groups[plan.muscleGroup]!.push(plan);
    });
    return groups;
  }, [filteredPlans]);

  const confirmDelete = async () => {
    if (planToDelete) {
      await deletePlan(planToDelete);
      setPlanToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1d7a82]/20 flex items-center justify-center border border-[#1d7a82]/30 glow-teal">
            <Database className="w-5 h-5 text-[#1d7a82]" />
          </div>
          <h2 className="text-2xl font-bold text-white text-glow-teal">{t('libraryTitle')}</h2>
        </div>
        
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-[#1d7a82]/50 focus:shadow-[0_0_15px_rgba(29,122,130,0.2)] transition-all"
          />
        </div>
      </div>

      {Object.keys(groupedPlans).length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center backdrop-blur-sm">
          <Database className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">{t('noExercisesFound')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(groupedPlans).map(([category, categoryPlans]) => (
            <div key={category} className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#1d7a82] shadow-[0_0_8px_rgba(29,122,130,0.8)]"></div>
                {t(category.toLowerCase() as TranslationKey)}
              </h3>
              
              <div className="space-y-3">
                {categoryPlans.map(plan => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    key={plan.id} 
                    className="group relative bg-black/20 hover:bg-[#1d7a82]/10 border border-white/5 hover:border-[#1d7a82]/50 hover:shadow-[0_0_15px_rgba(29,122,130,0.2)] rounded-xl p-3 transition-all flex justify-between items-center"
                  >
                    <div>
                      <h4 className="font-medium text-slate-200 group-hover:text-white">{plan.name}</h4>
                      <p className="text-xs text-slate-500">{t(plan.dayOfWeek.toLowerCase() as TranslationKey)}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button 
                        onClick={() => setEditingPlan(plan)} 
                        className="text-slate-500 hover:text-[#1d7a82] p-2 rounded-lg hover:bg-white/5"
                        title={t('edit')}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setPlanToDelete(plan.id)} 
                        className="text-slate-500 hover:text-[#FF0050] p-2 rounded-lg hover:bg-white/5"
                        title={t('delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <EditExerciseModal
        isOpen={!!editingPlan}
        onClose={() => setEditingPlan(null)}
        plan={editingPlan}
      />

      {planToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1e293b] rounded-2xl p-6 max-w-sm w-full border border-[#FF0050]/30 shadow-[0_0_30px_rgba(255,0,80,0.15)]">
            <h3 className="text-xl font-bold text-white mb-2">{t('deleteExerciseTitle')}</h3>
            <p className="text-slate-400 mb-6">{t('deleteExerciseConfirm')}</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setPlanToDelete(null)}
                className="flex-1 px-4 py-2 rounded-xl font-medium bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                {t('cancel')}
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 rounded-xl font-medium bg-[#FF0050] text-white hover:bg-[#cc0040] transition-colors glow-pink"
              >
                {t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

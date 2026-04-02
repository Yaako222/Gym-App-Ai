import { useState, useEffect } from 'react';
import { ExercisePlan, ExerciseLog, DayOfWeek, WeightUnit, MuscleCategory } from '../types';
import { addLog, deleteLog } from '../utils/storage';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Activity, Hash, Footprints, Trash2, Coffee, RefreshCw, X, Plus } from 'lucide-react';
import { getCurrentDate, formatDate } from '../utils/time';

import { useLanguage } from '../contexts/LanguageContext';
import { TranslationKey } from '../utils/translations';

interface TodayProps {
  plans: ExercisePlan[];
  logs: ExerciseLog[];
}

export default function Today({ plans, logs }: TodayProps) {
  const { t } = useLanguage();
  const DAYS: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDate = getCurrentDate();
  const todayNameKey = DAYS[currentDate.getDay()];
  const todayName = t(todayNameKey);
  const todayDateString = formatDate(currentDate);
  
  // Local state for daily overrides
  const [isRestDay, setIsRestDay] = useState(false);
  const [isTodayDifferent, setIsTodayDifferent] = useState(false);
  const [swappedPlans, setSwappedPlans] = useState<Record<string, string>>({}); // originalId -> newId
  const [addedPlans, setAddedPlans] = useState<string[]>([]);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState<string | null>(null); // originalId
  const [isAddFromPlanModalOpen, setIsAddFromPlanModalOpen] = useState(false);

  useEffect(() => {
    const savedState = localStorage.getItem(`gym_daily_state_${todayDateString}`);
    if (savedState) {
      const parsed = JSON.parse(savedState);
      setIsRestDay(parsed.isRestDay || false);
      setIsTodayDifferent(parsed.isTodayDifferent || false);
      setSwappedPlans(parsed.swappedPlans || {});
      setAddedPlans(parsed.addedPlans || []);
    } else {
      // Automatic Restday Logic
      // If it's late in the day (e.g., after 23:00) and no logs exist for today,
      // but there were plans, automatically mark it as a rest day.
      const currentHour = currentDate.getHours();
      const todaysLogsCount = logs.filter(l => formatDate(l.date) === todayDateString).length;
      
      const baseTodaysPlansCount = plans.filter(p => {
        const day = p.dayOfWeek.toLowerCase();
        const todayKey = todayNameKey.toLowerCase();
        const mapping: Record<string, string> = {
          'montag': 'monday', 'dienstag': 'tuesday', 'mittwoch': 'wednesday',
          'donnerstag': 'thursday', 'freitag': 'friday', 'samstag': 'saturday', 'sonntag': 'sunday'
        };
        return (mapping[day] || day) === todayKey;
      }).length;

      if (currentHour >= 23 && todaysLogsCount === 0 && baseTodaysPlansCount > 0) {
        setIsRestDay(true);
        saveDailyState(true, false, {}, []);
      }
    }
  }, [todayDateString, logs, plans, todayNameKey, currentDate]);

  const saveDailyState = (restDay: boolean, todayDiff: boolean, swapped: Record<string, string>, added: string[]) => {
    localStorage.setItem(`gym_daily_state_${todayDateString}`, JSON.stringify({
      isRestDay: restDay,
      isTodayDifferent: todayDiff,
      swappedPlans: swapped,
      addedPlans: added
    }));
  };

  const toggleRestDay = () => {
    const newVal = !isRestDay;
    setIsRestDay(newVal);
    saveDailyState(newVal, isTodayDifferent, swappedPlans, addedPlans);
  };

  const toggleTodayDifferent = () => {
    const newVal = !isTodayDifferent;
    setIsTodayDifferent(newVal);
    saveDailyState(isRestDay, newVal, swappedPlans, addedPlans);
  };

  const handleSwap = (originalId: string, newId: string) => {
    const newSwapped = { ...swappedPlans, [originalId]: newId };
    setSwappedPlans(newSwapped);
    saveDailyState(isRestDay, isTodayDifferent, newSwapped, addedPlans);
  };

  const handleResetSwap = (originalId: string) => {
    const newSwapped = { ...swappedPlans };
    delete newSwapped[originalId];
    setSwappedPlans(newSwapped);
    saveDailyState(isRestDay, isTodayDifferent, newSwapped, addedPlans);
  };

  const handleAddPlan = (planId: string) => {
    if (!addedPlans.includes(planId)) {
      const newAdded = [...addedPlans, planId];
      setAddedPlans(newAdded);
      saveDailyState(isRestDay, isTodayDifferent, swappedPlans, newAdded);
    }
    setIsAddFromPlanModalOpen(false);
  };

  const handleRemoveAddedPlan = (planId: string) => {
    const newAdded = addedPlans.filter(id => id !== planId);
    setAddedPlans(newAdded);
    saveDailyState(isRestDay, isTodayDifferent, swappedPlans, newAdded);
  };

  const baseTodaysPlans = plans.filter(p => {
    const day = p.dayOfWeek.toLowerCase();
    const todayKey = todayNameKey.toLowerCase();
    
    // Mapping old German strings to keys
    const mapping: Record<string, string> = {
      'montag': 'monday',
      'dienstag': 'tuesday',
      'mittwoch': 'wednesday',
      'donnerstag': 'thursday',
      'freitag': 'friday',
      'samstag': 'saturday',
      'sonntag': 'sunday'
    };
    
    const normalizedDay = mapping[day] || day;
    return normalizedDay === todayKey;
  });
  const extraPlans = plans.filter(p => addedPlans.includes(p.id));
  
  // Apply swaps
  const swappedBasePlans = baseTodaysPlans.map(p => {
    if (swappedPlans[p.id]) {
      const replacement = plans.find(plan => plan.id === swappedPlans[p.id]);
      return replacement ? { ...replacement, originalId: p.id } : p;
    }
    return p;
  });

  const todaysPlans = isTodayDifferent 
    ? extraPlans.map(p => ({ ...p, isExtra: true }))
    : [...swappedBasePlans, ...extraPlans.map(p => ({ ...p, isExtra: true }))];

  // Group by muscle category
  const groupedPlans = todaysPlans.reduce((acc, plan) => {
    const group = plan.muscleGroup;
    if (!acc[group]) acc[group] = [];
    acc[group].push(plan);
    return acc;
  }, {} as Record<string, (ExercisePlan & { originalId?: string; isExtra?: boolean })[]>);

  const allPlansGrouped = plans.reduce((acc, plan) => {
    const group = plan.muscleGroup;
    if (!acc[group]) acc[group] = [];
    acc[group].push(plan);
    return acc;
  }, {} as Record<string, ExercisePlan[]>);

  const todaysLogs = logs.filter(l => formatDate(l.date) === todayDateString);

  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [weight, setWeight] = useState('');
  const [unit, setUnit] = useState<WeightUnit>('kg');
  const [reps, setReps] = useState('');
  const [duration, setDuration] = useState('');
  const [steps, setSteps] = useState('');
  const [laserActive, setLaserActive] = useState<string | null>(null);

  const handleSaveLog = (plan: ExercisePlan) => {
    if (plan.muscleGroup !== 'cardio' && !weight) return;
    if (plan.muscleGroup === 'cardio' && !duration) return;

    setLaserActive(plan.id);

    setTimeout(async () => {
      await addLog({
        planId: plan.id,
        name: plan.name,
        muscleGroup: plan.muscleGroup,
        weight: plan.muscleGroup !== 'cardio' && weight ? Number(weight) : undefined,
        unit: plan.muscleGroup !== 'cardio' ? unit : undefined,
        reps: plan.muscleGroup !== 'cardio' && reps ? Number(reps) : undefined,
        duration: plan.muscleGroup === 'cardio' && duration ? Number(duration) : undefined,
        steps: steps ? Number(steps) : undefined,
      });

      setWeight('');
      setReps('');
      setDuration('');
      setSteps('');
      setActivePlanId(null);
      setLaserActive(null);
    }, 600);
  };

  return (
    <div className="space-y-8 relative">
      <div className="flex justify-between items-start sm:items-center flex-col sm:flex-row gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2 text-glow-teal">{t('todayIs')} {todayName}</h2>
          <p className="text-slate-400">{t('todaySubtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={toggleTodayDifferent}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${isTodayDifferent ? 'bg-[#FF0050] text-white glow-pink border border-[#FF0050]' : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'}`}
          >
            <RefreshCw className="w-4 h-4" />
            {isTodayDifferent ? t('trainDifferentActive') : t('trainDifferent')}
          </button>
          <button
            onClick={toggleRestDay}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${isRestDay ? 'bg-[#1d7a82] text-white glow-teal border border-[#1d7a82]' : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'}`}
          >
            <Coffee className="w-4 h-4" />
            {isRestDay ? t('restDayActive') : t('markRestDay')}
          </button>
        </div>
      </div>

      {isRestDay ? (
        <div className="bg-white/5 border border-[#1d7a82]/30 rounded-3xl p-12 text-center backdrop-blur-sm shadow-[0_0_30px_rgba(29,122,130,0.1)]">
          <div className="flex justify-center mb-6">
            <div className="bg-[#1d7a82]/20 p-5 rounded-full glow-teal">
              <Coffee className="w-12 h-12 text-[#1d7a82]" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">{t('restDayTitle')}</h3>
          <p className="text-slate-400 max-w-md mx-auto">{t('restDaySubtitle')}</p>
        </div>
      ) : (
        <>
          {isTodayDifferent && (
            <div className="flex justify-center mb-6">
              <button
                onClick={() => setIsAddFromPlanModalOpen(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all bg-[#1d7a82] text-white glow-teal hover:bg-[#155e63]"
              >
                <Plus className="w-5 h-5" />
                {t('addExerciseToday')}
              </button>
            </div>
          )}
          
          {todaysPlans.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center text-slate-400">
              {isTodayDifferent 
                ? t('noExercisesTodayDifferent')
                : t('noExercisesToday')}
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedPlans).map(([muscleGroup, groupPlans]) => (
                <div key={muscleGroup} className="space-y-4">
                  <h3 className="text-xl font-bold text-white border-b border-white/10 pb-2 flex items-center gap-2">
                    <span className="w-2 h-6 bg-[#FF0050] rounded-full glow-pink"></span>
                    {t(muscleGroup.toLowerCase() as any)}
                  </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groupPlans.map(plan => (
                  <div 
                    key={plan.isExtra ? `extra-${plan.id}` : (plan.originalId ? `swapped-${plan.originalId}-${plan.id}` : plan.id)} 
                    className={`relative overflow-hidden bg-white/5 border ${laserActive === plan.id ? 'border-glow-teal' : 'border-white/10 hover:border-[#1d7a82]/50 hover:shadow-[0_0_15px_rgba(29,122,130,0.2)]'} rounded-2xl p-5 backdrop-blur-sm transition-all duration-300 group`}
                  >
                    <AnimatePresence>
                      {laserActive === plan.id && (
                        <motion.div
                          initial={{ top: '-10%' }}
                          animate={{ top: '110%' }}
                          transition={{ duration: 0.5, ease: "linear" }}
                          className="absolute left-0 right-0 h-1 bg-[#1d7a82] shadow-[0_0_20px_5px_rgba(29,122,130,0.8)] z-50 pointer-events-none"
                        />
                      )}
                    </AnimatePresence>
                    
                    <div className="flex justify-between items-start mb-2 relative z-10">
                      <h3 className="text-lg font-semibold text-white">
                        {plan.name}
                        {plan.originalId && <span className="text-xs text-[#1d7a82] ml-2 font-normal">({t('swapped')})</span>}
                        {plan.isExtra && <span className="text-xs text-[#FF0050] ml-2 font-normal">({t('extra')})</span>}
                      </h3>
                      <div className="flex gap-1">
                        {!plan.isExtra && (
                          <button 
                            onClick={() => setIsSwapModalOpen(plan.originalId || plan.id)}
                            className="text-slate-400 hover:text-[#FF0050] p-1 rounded-lg hover:bg-white/5 transition-colors"
                            title={t('swapExercise')}
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        )}
                        {plan.isExtra && (
                          <button 
                            onClick={() => handleRemoveAddedPlan(plan.id)}
                            className="text-slate-400 hover:text-red-400 p-1 rounded-lg hover:bg-white/5 transition-colors"
                            title={t('removeExtra')}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mb-4 relative z-10">
                      <span className="inline-block bg-[#1d7a82]/20 text-[#1d7a82] text-xs font-bold px-2 py-1 rounded-lg mb-2">
                        {plan.sets || 3} Sets × {plan.reps || 12} Reps
                      </span>
                      {plan.instructions && (
                        <p className="text-xs text-slate-400 leading-relaxed italic border-l-2 border-white/10 pl-3">
                          {plan.instructions}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-4 relative z-10">
                      {plan.muscleGroup === 'cardio' ? (
                        <div>
                          <label className="block text-xs text-slate-400 mb-1 group-hover:text-[#1d7a82] transition-colors">{t('duration')} ({t('minutes')})</label>
                          <input type="number" value={activePlanId === plan.id ? duration : ''} onChange={e => {setActivePlanId(plan.id); setDuration(e.target.value)}} className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-glow-teal transition-all" placeholder={t('durationPlaceholder')} />
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-slate-400 mb-1 group-hover:text-[#1d7a82] transition-colors">{t('weight')}</label>
                            <div className="flex bg-black/20 border border-white/10 rounded-xl overflow-hidden focus-within:border-glow-teal transition-all">
                              <input type="number" value={activePlanId === plan.id ? weight : ''} onChange={e => {setActivePlanId(plan.id); setWeight(e.target.value)}} className="w-full bg-transparent px-3 py-2 text-white text-sm outline-none" placeholder="0" />
                              <button onClick={() => {setActivePlanId(plan.id); setUnit(unit === 'kg' ? 'lbs' : 'kg')}} className="px-3 bg-white/5 text-xs text-slate-300 hover:text-white transition-colors border-l border-white/10 hover:bg-[#1d7a82]/20">
                                {activePlanId === plan.id ? unit : 'kg'}
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-slate-400 mb-1 group-hover:text-[#1d7a82] transition-colors">{t('reps')}</label>
                            <input type="number" value={activePlanId === plan.id ? reps : ''} onChange={e => {setActivePlanId(plan.id); setReps(e.target.value)}} className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-glow-teal transition-all" placeholder="0" />
                          </div>
                        </div>
                      )}
                      <div>
                        <label className="block text-xs text-slate-400 mb-1 group-hover:text-[#1d7a82] transition-colors">{t('steps')} ({t('optional')})</label>
                        <input type="number" value={activePlanId === plan.id ? steps : ''} onChange={e => {setActivePlanId(plan.id); setSteps(e.target.value)}} className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-glow-teal transition-all" placeholder="0" />
                      </div>
                      
                      <button 
                        onClick={() => handleSaveLog(plan)}
                        disabled={activePlanId !== plan.id || (plan.muscleGroup !== 'cardio' && !weight) || (plan.muscleGroup === 'cardio' && !duration)}
                        className="w-full flex items-center justify-center gap-2 bg-[#1d7a82] hover:bg-[#155e63] disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 rounded-xl text-sm font-medium transition-all hover:glow-teal border border-transparent hover:border-[#1d7a82]"
                      >
                        <Check className="w-4 h-4" /> {t('save')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
          )}
        </>
      )}

      {todaysLogs.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-white mb-4 text-glow-pink">{t('completedToday')}</h3>
          <div className="space-y-3">
            {todaysLogs.map(log => (
              <div key={log.id} className="flex items-center justify-between bg-black/20 border border-white/5 hover:border-[#FF0050]/50 hover:shadow-[0_0_15px_rgba(255,0,80,0.15)] rounded-xl p-4 transition-all">
                <div>
                  <p className="text-white font-medium">{log.name}</p>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-400 mt-1">
                    {log.weight !== undefined && (
                      <span className="flex items-center gap-1"><Activity className="w-3 h-3 text-[#1d7a82]" /> {log.weight} {log.unit}</span>
                    )}
                    {log.reps && <span className="flex items-center gap-1"><Hash className="w-3 h-3 text-[#1d7a82]" /> {log.reps} {t('reps')}</span>}
                    {log.duration && <span className="flex items-center gap-1"><Activity className="w-3 h-3 text-[#1d7a82]" /> {log.duration} {t('minutes')}</span>}
                    {log.steps && <span className="flex items-center gap-1"><Footprints className="w-3 h-3 text-[#1d7a82]" /> {log.steps} {t('steps')}</span>}
                  </div>
                </div>
                <button onClick={() => deleteLog(log.id)} className="text-slate-500 hover:text-red-400 p-2">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Swap Modal */}
      <AnimatePresence>
        {isSwapModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSwapModalOpen(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#1e293b] border border-[#1d7a82]/50 shadow-[0_0_30px_rgba(29,122,130,0.2)] rounded-2xl z-50 overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="flex justify-between items-center p-5 border-b border-white/10 shrink-0">
                <h2 className="text-xl font-semibold text-white text-glow-teal">{t('swapExercise')}</h2>
                <button onClick={() => setIsSwapModalOpen(null)} className="text-slate-400 hover:text-white transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-5 overflow-y-auto flex-1 space-y-2">
                <p className="text-sm text-slate-400 mb-4">{t('chooseOtherExercise')}</p>
                
                {swappedPlans[isSwapModalOpen] && (
                  <button
                    onClick={() => handleResetSwap(isSwapModalOpen)}
                    className="w-full text-left p-3 rounded-xl bg-[#FF0050]/10 border border-[#FF0050]/30 text-[#FF0050] hover:bg-[#FF0050]/20 transition-all mb-4"
                  >
                    {t('undoSwap')}
                  </button>
                )}

                {plans.filter(p => p.id !== isSwapModalOpen && p.id !== swappedPlans[isSwapModalOpen]).map(plan => (
                  <button
                    key={plan.id}
                    onClick={() => handleSwap(isSwapModalOpen, plan.id)}
                    className="w-full text-left p-3 rounded-xl bg-white/5 border border-white/10 hover:border-[#1d7a82]/50 hover:bg-white/10 transition-all flex justify-between items-center group"
                  >
                    <div>
                      <div className="text-white font-medium">{plan.name}</div>
                      <div className="text-xs text-slate-400">{t(plan.muscleGroup.toLowerCase() as any)} • {t(plan.dayOfWeek.toLowerCase() as any)}</div>
                    </div>
                    <RefreshCw className="w-4 h-4 text-slate-500 group-hover:text-[#1d7a82]" />
                  </button>
                ))}
                {plans.length <= 1 && (
                  <div className="text-center text-slate-500 py-4">{t('noOtherExercises')}</div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add From Plan Modal */}
      <AnimatePresence>
        {isAddFromPlanModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddFromPlanModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-[#1e293b] border border-[#1d7a82]/50 shadow-[0_0_30px_rgba(29,122,130,0.2)] rounded-2xl z-50 overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="flex justify-between items-center p-5 border-b border-white/10 shrink-0">
                <h2 className="text-xl font-semibold text-white text-glow-teal">{t('trainDifferentTitle')}</h2>
                <button onClick={() => setIsAddFromPlanModalOpen(false)} className="text-slate-400 hover:text-white transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-5 overflow-y-auto flex-1 space-y-6">
                <p className="text-sm text-slate-400">{t('trainDifferentSubtitle')}</p>
                
                {Object.entries(allPlansGrouped).map(([muscleGroup, groupPlans]) => (
                  <div key={muscleGroup} className="space-y-3">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <span className="w-2 h-5 bg-[#FF0050] rounded-full glow-pink"></span>
                      {t(muscleGroup.toLowerCase() as any)}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {groupPlans.map(plan => {
                        const isAlreadyInToday = todaysPlans.some(p => p.id === plan.id);
                        return (
                          <button
                            key={plan.id}
                            onClick={() => !isAlreadyInToday && handleAddPlan(plan.id)}
                            disabled={isAlreadyInToday}
                            className={`text-left p-3 rounded-xl border transition-all flex justify-between items-center ${isAlreadyInToday ? 'bg-white/5 border-white/5 opacity-50 cursor-not-allowed' : 'bg-white/5 border-white/10 hover:border-[#1d7a82]/50 hover:bg-white/10 group'}`}
                          >
                            <div>
                              <div className="text-white font-medium">{plan.name}</div>
                              <div className="text-xs text-slate-400">{t(plan.dayOfWeek.toLowerCase() as any)}</div>
                            </div>
                            {!isAlreadyInToday && <Plus className="w-4 h-4 text-slate-500 group-hover:text-[#1d7a82]" />}
                            {isAlreadyInToday && <Check className="w-4 h-4 text-[#1d7a82]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {plans.length === 0 && (
                  <div className="text-center text-slate-500 py-4">{t('noExercisesInPlan')}</div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

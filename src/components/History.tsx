import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { ExerciseLog, ExercisePlan } from '../types';
import { deleteLog, updateLog } from '../utils/storage';
import { Trash2, Edit2, Target, Calendar } from 'lucide-react';
import { getCurrentDate } from '../utils/time';
import { useLanguage } from '../contexts/LanguageContext';
import { TranslationKey } from '../utils/translations';

interface HistoryProps {
  logs: ExerciseLog[];
  plans: ExercisePlan[];
}

export default function History({ logs, plans }: HistoryProps) {
  const { t } = useLanguage();
  const [editingLog, setEditingLog] = useState<ExerciseLog | null>(null);
  const [editWeight, setEditWeight] = useState('');
  const [editReps, setEditReps] = useState('');
  const [editDuration, setEditDuration] = useState('');
  const [logToDelete, setLogToDelete] = useState<string | null>(null);

  // Get last 7 days
  const last7Days = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = getCurrentDate();
      d.setDate(d.getDate() - i);
      days.push(d.toLocaleDateString());
    }
    return days;
  }, []);

  const recentLogs = useMemo(() => {
    return logs
      .filter(log => last7Days.includes(new Date(log.date).toLocaleDateString()))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [logs, last7Days]);

  const groupedLogs = useMemo(() => {
    const groups: Record<string, ExerciseLog[]> = {};
    recentLogs.forEach(log => {
      const dateStr = new Date(log.date).toLocaleDateString();
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(log);
    });
    return groups;
  }, [recentLogs]);

  const confirmDelete = async () => {
    if (logToDelete) {
      await deleteLog(logToDelete);
      setLogToDelete(null);
    }
  };

  const startEditing = (log: ExerciseLog) => {
    setEditingLog(log);
    setEditWeight(log.weight?.toString() || '');
    setEditReps(log.reps?.toString() || '');
    setEditDuration(log.duration?.toString() || '');
  };

  const saveEdit = async () => {
    if (!editingLog) return;
    
    await updateLog(editingLog.id, {
      weight: editWeight ? Number(editWeight) : undefined,
      reps: editReps ? Number(editReps) : undefined,
      duration: editDuration ? Number(editDuration) : undefined,
    });
    
    setEditingLog(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#1d7a82]/20 flex items-center justify-center border border-[#1d7a82]/30 glow-teal">
          <Calendar className="w-5 h-5 text-[#1d7a82]" />
        </div>
        <h2 className="text-2xl font-bold text-white text-glow-teal">{t('historyTitle')}</h2>
      </div>

      {last7Days.map(dateStr => {
        const dayLogs = groupedLogs[dateStr] || [];
        
        return (
          <div key={dateStr} className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#1d7a82] shadow-[0_0_8px_rgba(29,122,130,0.8)]"></div>
              {dateStr === getCurrentDate().toLocaleDateString() ? t('today') : dateStr}
            </h3>
            
            {dayLogs.length === 0 ? (
              <p className="text-sm text-slate-500 italic">{t('noLogsDay')}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dayLogs.map(log => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    key={log.id} 
                    className="group relative bg-black/20 hover:bg-[#1d7a82]/10 border border-white/5 hover:border-[#1d7a82]/50 hover:shadow-[0_0_15px_rgba(29,122,130,0.2)] rounded-xl p-4 transition-all"
                  >
                    {editingLog?.id === log.id ? (
                      <div className="space-y-3">
                        <h4 className="font-medium text-white">{log.name}</h4>
                        {log.muscleGroup !== 'cardio' ? (
                          <div className="flex gap-2">
                            <input 
                              type="number" 
                              value={editWeight} 
                              onChange={e => setEditWeight(e.target.value)} 
                              placeholder={t('weight')}
                              className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-white text-sm"
                            />
                            <input 
                              type="number" 
                              value={editReps} 
                              onChange={e => setEditReps(e.target.value)} 
                              placeholder={t('reps')}
                              className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-white text-sm"
                            />
                          </div>
                        ) : (
                          <input 
                            type="number" 
                            value={editDuration} 
                            onChange={e => setEditDuration(e.target.value)} 
                            placeholder={t('minutes')}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-white text-sm"
                          />
                        )}
                        <div className="flex gap-2 pt-2">
                          <button onClick={saveEdit} className="flex-1 bg-[#1d7a82] text-white text-xs py-1.5 rounded-lg font-medium glow-teal">{t('save')}</button>
                          <button onClick={() => setEditingLog(null)} className="flex-1 bg-white/10 text-white text-xs py-1.5 rounded-lg font-medium hover:bg-white/20">{t('cancel')}</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-slate-200 group-hover:text-white">{log.name}</h4>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={() => startEditing(log)} className="text-slate-500 hover:text-[#1d7a82] p-1" title={t('edit')}><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => setLogToDelete(log.id)} className="text-slate-500 hover:text-[#FF0050] p-1" title={t('delete')}><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 text-sm text-slate-300">
                          {log.muscleGroup !== 'cardio' ? (
                            <>
                              {log.weight && <span className="bg-white/5 px-2 py-1 rounded-md border border-white/10">{log.weight} {log.unit || 'kg'}</span>}
                              {log.reps && <span className="bg-white/5 px-2 py-1 rounded-md border border-white/10">{log.reps} {t('reps')}</span>}
                            </>
                          ) : (
                            <>
                              {log.duration && <span className="bg-white/5 px-2 py-1 rounded-md border border-white/10">{log.duration} {t('minutes')}</span>}
                            </>
                          )}
                        </div>
                        <div className="mt-3 text-xs text-slate-500 flex items-center gap-1">
                          <Target className="w-3 h-3 text-[#FF0050]" />
                          {t(log.muscleGroup.toLowerCase() as TranslationKey)}
                        </div>
                      </>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {logToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1e293b] rounded-2xl p-6 max-w-sm w-full border border-[#FF0050]/30 shadow-[0_0_30px_rgba(255,0,80,0.15)]">
            <h3 className="text-xl font-bold text-white mb-2">{t('deleteLogTitle')}</h3>
            <p className="text-slate-400 mb-6">{t('deleteLogConfirm')}</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setLogToDelete(null)}
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

import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { ExerciseLog, ExercisePlan } from '../types';
import { deleteLog, updateLog } from '../utils/storage';
import { Trash2, Edit2, Target, Calendar } from 'lucide-react';
import { getCurrentDate } from '../utils/time';

interface HistoryProps {
  logs: ExerciseLog[];
  plans: ExercisePlan[];
}

export default function History({ logs, plans }: HistoryProps) {
  const [editingLog, setEditingLog] = useState<ExerciseLog | null>(null);
  const [editWeight, setEditWeight] = useState('');
  const [editReps, setEditReps] = useState('');
  const [editDuration, setEditDuration] = useState('');

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

  const handleDelete = async (id: string) => {
    if (confirm('Möchtest du diesen Eintrag wirklich löschen?')) {
      await deleteLog(id);
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
        <h2 className="text-2xl font-bold text-white text-glow-teal">Verlauf (Letzte 7 Tage)</h2>
      </div>

      {last7Days.map(dateStr => {
        const dayLogs = groupedLogs[dateStr] || [];
        
        return (
          <div key={dateStr} className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#1d7a82] shadow-[0_0_8px_rgba(29,122,130,0.8)]"></div>
              {dateStr === getCurrentDate().toLocaleDateString() ? 'Heute' : dateStr}
            </h3>
            
            {dayLogs.length === 0 ? (
              <p className="text-sm text-slate-500 italic">Keine Einträge an diesem Tag.</p>
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
                        {log.muscleGroup !== 'Cardio' ? (
                          <div className="flex gap-2">
                            <input 
                              type="number" 
                              value={editWeight} 
                              onChange={e => setEditWeight(e.target.value)} 
                              placeholder="Gewicht"
                              className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-white text-sm"
                            />
                            <input 
                              type="number" 
                              value={editReps} 
                              onChange={e => setEditReps(e.target.value)} 
                              placeholder="Wdh."
                              className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-white text-sm"
                            />
                          </div>
                        ) : (
                          <input 
                            type="number" 
                            value={editDuration} 
                            onChange={e => setEditDuration(e.target.value)} 
                            placeholder="Minuten"
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-white text-sm"
                          />
                        )}
                        <div className="flex gap-2 pt-2">
                          <button onClick={saveEdit} className="flex-1 bg-[#1d7a82] text-white text-xs py-1.5 rounded-lg font-medium glow-teal">Speichern</button>
                          <button onClick={() => setEditingLog(null)} className="flex-1 bg-white/10 text-white text-xs py-1.5 rounded-lg font-medium hover:bg-white/20">Abbrechen</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-slate-200 group-hover:text-white">{log.name}</h4>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={() => startEditing(log)} className="text-slate-500 hover:text-[#1d7a82] p-1"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => handleDelete(log.id)} className="text-slate-500 hover:text-[#FF0050] p-1"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 text-sm text-slate-300">
                          {log.muscleGroup !== 'Cardio' ? (
                            <>
                              {log.weight && <span className="bg-white/5 px-2 py-1 rounded-md border border-white/10">{log.weight} {log.unit || 'kg'}</span>}
                              {log.reps && <span className="bg-white/5 px-2 py-1 rounded-md border border-white/10">{log.reps} Wdh.</span>}
                            </>
                          ) : (
                            <>
                              {log.duration && <span className="bg-white/5 px-2 py-1 rounded-md border border-white/10">{log.duration} Min.</span>}
                            </>
                          )}
                        </div>
                        <div className="mt-3 text-xs text-slate-500 flex items-center gap-1">
                          <Target className="w-3 h-3 text-[#FF0050]" />
                          {log.muscleGroup}
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
    </div>
  );
}

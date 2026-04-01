import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Ruler, Weight, Calendar, Target, ChevronRight, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export interface UserData {
  weight: number;
  height: number;
  age: number;
  gender: 'male' | 'female' | 'other';
  goal: 'muscle_build' | 'weight_loss' | 'endurance';
}

interface DataCollectionModalProps {
  onComplete: (data: UserData | null) => void;
}

export const DataCollectionModal: React.FC<DataCollectionModalProps> = ({ onComplete }) => {
  const { t } = useLanguage();
  const [data, setData] = useState<UserData>({
    weight: 75,
    height: 180,
    age: 25,
    gender: 'male',
    goal: 'muscle_build',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(data);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0f172a]/90 backdrop-blur-xl p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-[#1e293b] border border-white/10 rounded-[2.5rem] p-8 max-w-lg w-full shadow-[0_0_50px_rgba(29,122,130,0.2)] relative"
      >
        <button
          onClick={() => onComplete(null)}
          className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-8">
          <div className="inline-block bg-gradient-to-br from-[#1d7a82] to-[#FF0050] p-4 rounded-3xl mb-4 shadow-[0_0_20px_rgba(29,122,130,0.4)]">
            <User className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic text-glow-teal">
            {t('onboardingDataTitle')}
          </h2>
          <p className="text-slate-400 mt-2">
            {t('onboardingDataSubtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Weight className="w-3 h-3" /> {t('weight')} (kg)
              </label>
              <input
                type="number"
                value={data.weight}
                onChange={(e) => setData({ ...data, weight: Number(e.target.value) })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-[#1d7a82] transition-all"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Ruler className="w-3 h-3" /> {t('height')} (cm)
              </label>
              <input
                type="number"
                value={data.height}
                onChange={(e) => setData({ ...data, height: Number(e.target.value) })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-[#1d7a82] transition-all"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Calendar className="w-3 h-3" /> {t('age')}
              </label>
              <input
                type="number"
                value={data.age}
                onChange={(e) => setData({ ...data, age: Number(e.target.value) })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-[#1d7a82] transition-all"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <User className="w-3 h-3" /> {t('gender')}
              </label>
              <select
                value={data.gender}
                onChange={(e) => setData({ ...data, gender: e.target.value as any })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-[#1d7a82] transition-all appearance-none"
              >
                <option value="male">{t('male')}</option>
                <option value="female">{t('female')}</option>
                <option value="other">{t('andere')}</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Target className="w-3 h-3" /> {t('fitnessGoal')}
            </label>
            <div className="grid grid-cols-1 gap-2">
              {(['muscle_build', 'weight_loss', 'endurance'] as const).map((goalId) => (
                <button
                  key={goalId}
                  type="button"
                  onClick={() => setData({ ...data, goal: goalId })}
                  className={`flex items-center justify-between px-6 py-4 rounded-2xl border transition-all ${
                    data.goal === goalId
                      ? 'bg-[#1d7a82]/20 border-[#1d7a82] text-white glow-teal'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  <span className="font-bold">{t(goalId)}</span>
                  <span className="text-2xl">
                    {goalId === 'muscle_build' ? '💪' : goalId === 'weight_loss' ? '🔥' : '🏃'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <button
              type="submit"
              className="w-full bg-[#1d7a82] hover:bg-[#155e63] text-white font-black py-4 rounded-2xl transition-all glow-teal flex items-center justify-center gap-2 uppercase tracking-widest"
            >
              {t('createPlan')}
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => onComplete(null)}
              className="w-full text-slate-500 hover:text-white font-bold py-2 transition-colors uppercase tracking-widest text-sm"
            >
              {t('skip')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

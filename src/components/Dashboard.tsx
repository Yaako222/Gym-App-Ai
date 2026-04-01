import React from 'react';
import { motion } from 'motion/react';
import { Activity, Utensils, Droplets, Dumbbell, Clock, Hash, Footprints } from 'lucide-react';
import { ExerciseLog, NutritionLog } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { getCurrentDate, formatDate } from '../utils/time';

interface DashboardProps {
  exerciseLogs: ExerciseLog[];
  nutritionLogs: NutritionLog[];
}

export default function Dashboard({ exerciseLogs, nutritionLogs }: DashboardProps) {
  const { t } = useLanguage();
  const today = getCurrentDate();
  const todayStr = today.toISOString().split('T')[0];

  const todayExercises = exerciseLogs.filter(log => log.date.startsWith(todayStr));
  const todayNutrition = nutritionLogs.filter(log => log.date.startsWith(todayStr));

  const totalCalories = todayNutrition.reduce((sum, log) => sum + log.totalCalories, 0);
  const totalProtein = todayNutrition.reduce((sum, log) => sum + log.totalProtein, 0);
  const totalCarbs = todayNutrition.reduce((sum, log) => sum + log.totalCarbs, 0);
  const totalFat = todayNutrition.reduce((sum, log) => sum + log.totalFat, 0);
  const totalWater = todayNutrition.reduce((sum, log) => sum + log.waterIntakeMl, 0);

  const hasActivity = todayExercises.length > 0 || todayNutrition.length > 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white text-glow-teal">{t('dashboard')}</h1>
          <p className="text-slate-400 mt-1">{t('todaySummary')}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2 backdrop-blur-sm">
          <span className="text-[#1d7a82] font-medium">{formatDate(today.toISOString(), { weekday: 'long', day: '2-digit', month: 'long' })}</span>
        </div>
      </div>

      {!hasActivity ? (
        <div className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center backdrop-blur-sm">
          <Activity className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">{t('noActivityToday')}</h3>
          <p className="text-slate-400 max-w-md mx-auto">
            {t('todaySubtitle')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Nutrition Summary */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm group hover:border-[#FF0050]/50 transition-all">
                <div className="text-slate-400 text-xs mb-1 group-hover:text-white transition-colors">{t('calories')}</div>
                <div className="text-2xl font-bold text-white text-glow-pink">{Math.round(totalCalories)}</div>
                <div className="text-[10px] text-slate-500 mt-1">kcal</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm group hover:border-[#1d7a82]/50 transition-all">
                <div className="text-slate-400 text-xs mb-1 group-hover:text-white transition-colors">{t('protein')}</div>
                <div className="text-2xl font-bold text-white text-glow-teal">{Math.round(totalProtein)}g</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm group hover:border-amber-500/50 transition-all">
                <div className="text-slate-400 text-xs mb-1 group-hover:text-white transition-colors">{t('carbs')}</div>
                <div className="text-2xl font-bold text-white group-hover:text-amber-400 transition-colors">{Math.round(totalCarbs)}g</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm group hover:border-emerald-500/50 transition-all">
                <div className="text-slate-400 text-xs mb-1 group-hover:text-white transition-colors">{t('fat')}</div>
                <div className="text-2xl font-bold text-white group-hover:text-emerald-400 transition-colors">{Math.round(totalFat)}g</div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-6">
                <Utensils className="w-5 h-5 text-[#FF0050]" />
                <h2 className="text-lg font-semibold text-white">{t('recentMeals')}</h2>
              </div>
              <div className="space-y-3">
                {todayNutrition.length === 0 ? (
                  <p className="text-slate-500 text-sm italic">{t('noLogs')}</p>
                ) : (
                  todayNutrition.map(log => (
                    <div key={log.id} className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#FF0050]/10 flex items-center justify-center text-[#FF0050]">
                          <Utensils className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="text-white font-medium capitalize">{t(log.mealType as any)}</div>
                          <div className="text-xs text-slate-400">{log.foodItems.map(f => f.name).join(', ')}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-bold">{Math.round(log.totalCalories)} kcal</div>
                        <div className="text-[10px] text-slate-500">{Math.round(log.totalProtein)}P · {Math.round(log.totalCarbs)}C · {Math.round(log.totalFat)}F</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Side Column: Water & Exercises */}
          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#1d7a82]/10 blur-3xl -mr-16 -mt-16 group-hover:bg-[#1d7a82]/20 transition-all"></div>
              <div className="flex items-center gap-2 mb-4">
                <Droplets className="w-5 h-5 text-[#1d7a82]" />
                <h2 className="text-lg font-semibold text-white">{t('water')}</h2>
              </div>
              <div className="text-4xl font-bold text-white mb-2 text-glow-teal">{totalWater} <span className="text-lg font-normal text-slate-400">ml</span></div>
              <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-[#1d7a82] h-full shadow-[0_0_10px_rgba(29,122,130,0.8)] transition-all duration-1000" 
                  style={{ width: `${Math.min((totalWater / 3000) * 100, 100)}%` }}
                ></div>
              </div>
              <p className="text-[10px] text-slate-500 mt-2">Ziel: 3000ml</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-6">
                <Dumbbell className="w-5 h-5 text-[#1d7a82]" />
                <h2 className="text-lg font-semibold text-white">{t('exercises')}</h2>
              </div>
              <div className="space-y-3">
                {todayExercises.length === 0 ? (
                  <p className="text-slate-500 text-sm italic">{t('noExercisesToday')}</p>
                ) : (
                  todayExercises.map(log => (
                    <div key={log.id} className="p-3 bg-black/20 rounded-xl border border-white/5">
                      <div className="text-white text-sm font-medium mb-1">{log.name}</div>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400">
                        {log.weight && <span className="flex items-center gap-0.5"><Activity className="w-3 h-3 text-[#1d7a82]" /> {log.weight}{log.unit}</span>}
                        {log.reps && <span className="flex items-center gap-0.5"><Hash className="w-3 h-3 text-[#1d7a82]" /> {log.reps}</span>}
                        {log.duration && <span className="flex items-center gap-0.5"><Clock className="w-3 h-3 text-[#1d7a82]" /> {log.duration}m</span>}
                        {log.steps && <span className="flex items-center gap-0.5"><Footprints className="w-3 h-3 text-[#1d7a82]" /> {log.steps}</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

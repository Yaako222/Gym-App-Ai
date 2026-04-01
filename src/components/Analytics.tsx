import { useMemo, useState } from 'react';
import { ExerciseLog, NutritionLog } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Activity, Dumbbell, Clock, Utensils, Droplets } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface AnalyticsProps {
  logs: ExerciseLog[];
  nutritionLogs?: NutritionLog[];
}

const COLORS = ['#FF0050', '#1d7a82', '#f59e0b', '#10b981', '#6366f1', '#ec4899', '#8b5cf6', '#14b8a6', '#f43f5e'];

export default function Analytics({ logs, nutritionLogs = [] }: AnalyticsProps) {
  const { t, language } = useLanguage();
  const [displayUnit, setDisplayUnit] = useState<'kg' | 'lbs'>('kg');

  const stats = useMemo(() => {
    const totalVolume = Math.round(logs.reduce((sum, log) => {
      if (log.weight === undefined) return sum;
      const weightInKg = log.unit === 'lbs' ? log.weight * 0.453592 : log.weight;
      const finalWeight = displayUnit === 'lbs' ? weightInKg * 2.20462 : weightInKg;
      return sum + (finalWeight * (log.reps || 1));
    }, 0));

    const totalCardio = logs.reduce((sum, log) => sum + (log.duration || 0), 0);
    const totalWorkouts = logs.length;

    // Muscle Group Distribution
    const muscleGroups = logs.reduce((acc, log) => {
      acc[log.muscleGroup] = (acc[log.muscleGroup] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const pieData = Object.entries(muscleGroups).map(([name, value]) => ({ 
      name: t(name.toLowerCase() as any), 
      value 
    }));

    // Volume over time
    const volumeByDate = logs.reduce((acc, log) => {
      if (log.weight === undefined) return acc;
      const date = new Date(log.date).toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US', { day: '2-digit', month: '2-digit' });
      const weightInKg = log.unit === 'lbs' ? log.weight * 0.453592 : log.weight;
      const finalWeight = displayUnit === 'lbs' ? weightInKg * 2.20462 : weightInKg;
      const vol = finalWeight * (log.reps || 1);
      acc[date] = (acc[date] || 0) + vol;
      return acc;
    }, {} as Record<string, number>);

    const volumeData = Object.entries(volumeByDate)
      .map(([date, volume]) => ({ date, volume: Math.round(volume) }))
      .slice(-14); // Last 14 entries

    // Nutrition Stats
    const nutritionByDate = nutritionLogs.reduce((acc, log) => {
      const date = log.date.split('T')[0];
      if (!acc[date]) acc[date] = { calories: 0, protein: 0, carbs: 0, fat: 0, water: 0 };
      acc[date].calories += log.totalCalories;
      acc[date].protein += log.totalProtein;
      acc[date].carbs += log.totalCarbs;
      acc[date].fat += log.totalFat;
      acc[date].water += log.waterIntakeMl;
      return acc;
    }, {} as Record<string, { calories: number, protein: number, carbs: number, fat: number, water: number }>);

    const nutritionDays = Object.keys(nutritionByDate).length || 1;
    const yearlyAverages = {
      calories: Math.round(Object.values(nutritionByDate).reduce((sum, d) => sum + d.calories, 0) / nutritionDays),
      protein: Math.round(Object.values(nutritionByDate).reduce((sum, d) => sum + d.protein, 0) / nutritionDays),
      carbs: Math.round(Object.values(nutritionByDate).reduce((sum, d) => sum + d.carbs, 0) / nutritionDays),
      fat: Math.round(Object.values(nutritionByDate).reduce((sum, d) => sum + d.fat, 0) / nutritionDays),
      water: Math.round(Object.values(nutritionByDate).reduce((sum, d) => sum + d.water, 0) / nutritionDays),
    };

    const nutritionData = Object.entries(nutritionByDate)
      .map(([date, data]) => ({ 
        date: new Date(date).toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US', { day: '2-digit', month: '2-digit' }), 
        ...data 
      }))
      .slice(-14);

    return { totalVolume, totalCardio, totalWorkouts, pieData, volumeData, yearlyAverages, nutritionData };
  }, [logs, nutritionLogs, displayUnit, t, language]);

  if (logs.length === 0 && nutritionLogs.length === 0) {
    return (
      <div className="text-center py-20 text-slate-400">
        {t('noDataAnalytics')}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white text-glow-teal">{t('analytics')}</h1>
        <button
          onClick={() => setDisplayUnit(prev => prev === 'kg' ? 'lbs' : 'kg')}
          className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]"
        >
          {t('showIn').replace('{unit}', displayUnit === 'kg' ? 'lbs' : 'kg')}
        </button>
      </div>

      {/* Yearly Averages */}
      {nutritionLogs.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#FF0050]" />
            {t('yearlyAverage')}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm group hover:border-[#FF0050]/50 transition-all">
              <div className="text-slate-400 text-xs mb-1 group-hover:text-white transition-colors">{t('calories')}</div>
              <div className="text-xl font-bold text-white text-glow-pink">{stats.yearlyAverages.calories}</div>
              <div className="text-[10px] text-slate-500 mt-1">kcal / Tag</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm group hover:border-[#1d7a82]/50 transition-all">
              <div className="text-slate-400 text-xs mb-1 group-hover:text-white transition-colors">{t('protein')}</div>
              <div className="text-xl font-bold text-white text-glow-teal">{stats.yearlyAverages.protein}g</div>
              <div className="text-[10px] text-slate-500 mt-1">/ Tag</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm group hover:border-amber-500/50 transition-all">
              <div className="text-slate-400 text-xs mb-1 group-hover:text-white transition-colors">{t('carbs')}</div>
              <div className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors">{stats.yearlyAverages.carbs}g</div>
              <div className="text-[10px] text-slate-500 mt-1">/ Tag</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm group hover:border-emerald-500/50 transition-all">
              <div className="text-slate-400 text-xs mb-1 group-hover:text-white transition-colors">{t('fat')}</div>
              <div className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">{stats.yearlyAverages.fat}g</div>
              <div className="text-[10px] text-slate-500 mt-1">/ Tag</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm group hover:border-blue-500/50 transition-all">
              <div className="text-slate-400 text-xs mb-1 group-hover:text-white transition-colors">{t('water')}</div>
              <div className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">{stats.yearlyAverages.water}ml</div>
              <div className="text-[10px] text-slate-500 mt-1">/ Tag</div>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 hover:border-[#FF0050]/50 hover:shadow-[0_0_20px_rgba(255,0,80,0.15)] rounded-2xl p-5 backdrop-blur-sm flex items-center gap-4 transition-all group">
          <div className="bg-[#FF0050]/20 p-3 rounded-xl group-hover:bg-[#FF0050]/30 transition-colors">
            <Dumbbell className="w-6 h-6 text-[#FF0050] drop-shadow-[0_0_8px_rgba(255,0,80,0.8)]" />
          </div>
          <div>
            <p className="text-sm text-slate-400 group-hover:text-white transition-colors">{t('totalVolume')}</p>
            <p className="text-2xl font-bold text-white text-glow-pink">{stats.totalVolume.toLocaleString()} {displayUnit}</p>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 hover:border-[#1d7a82]/50 hover:shadow-[0_0_20px_rgba(29,122,130,0.15)] rounded-2xl p-5 backdrop-blur-sm flex items-center gap-4 transition-all group">
          <div className="bg-[#1d7a82]/20 p-3 rounded-xl group-hover:bg-[#1d7a82]/30 transition-colors">
            <Clock className="w-6 h-6 text-[#1d7a82] drop-shadow-[0_0_8px_rgba(29,122,130,0.8)]" />
          </div>
          <div>
            <p className="text-sm text-slate-400 group-hover:text-white transition-colors">{t('cardioTime')}</p>
            <p className="text-2xl font-bold text-white text-glow-teal">{stats.totalCardio} {t('min')}</p>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 hover:border-white/30 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] rounded-2xl p-5 backdrop-blur-sm flex items-center gap-4 transition-all group">
          <div className="bg-white/10 p-3 rounded-xl group-hover:bg-white/20 transition-colors">
            <Activity className="w-6 h-6 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
          </div>
          <div>
            <p className="text-sm text-slate-400 group-hover:text-white transition-colors">{t('totalExercises')}</p>
            <p className="text-2xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">{stats.totalWorkouts}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Volume Chart */}
        <div className="bg-white/5 border border-white/10 hover:border-[#FF0050]/30 hover:shadow-[0_0_20px_rgba(255,0,80,0.1)] rounded-2xl p-5 backdrop-blur-sm transition-all">
          <h3 className="text-lg font-semibold text-white mb-6 text-glow-pink">{t('volumeProgress').replace('{unit}', displayUnit)}</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.volumeData}>
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
                <Bar dataKey="volume" fill="#FF0050" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Nutrition Chart */}
        {nutritionLogs.length > 0 && (
          <div className="bg-white/5 border border-white/10 hover:border-[#1d7a82]/30 hover:shadow-[0_0_20px_rgba(29,122,130,0.1)] rounded-2xl p-5 backdrop-blur-sm transition-all">
            <h3 className="text-lg font-semibold text-white mb-6 text-glow-teal">{t('calories')} (kcal)</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.nutritionData}>
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  />
                  <Line type="monotone" dataKey="calories" stroke="#1d7a82" strokeWidth={3} dot={{ fill: '#1d7a82', r: 4 }} activeDot={{ r: 6, stroke: '#1d7a82', strokeWidth: 2, fill: '#fff' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Muscle Group Pie Chart */}
        <div className="bg-white/5 border border-white/10 hover:border-[#1d7a82]/30 hover:shadow-[0_0_20px_rgba(29,122,130,0.1)] rounded-2xl p-5 backdrop-blur-sm transition-all">
          <h3 className="text-lg font-semibold text-white mb-6 text-glow-teal">{t('muscleGroupDistribution')}</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 mt-4 justify-center">
            {stats.pieData.map((entry, index) => (
              <div key={`${entry.name}-${index}`} className="flex items-center gap-1 text-xs text-slate-300">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                {entry.name}
              </div>
            ))}
          </div>
        </div>

        {/* Water Chart */}
        {nutritionLogs.length > 0 && (
          <div className="bg-white/5 border border-white/10 hover:border-blue-500/30 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)] rounded-2xl p-5 backdrop-blur-sm transition-all">
            <h3 className="text-lg font-semibold text-white mb-6 text-blue-400">{t('water')} (ml)</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.nutritionData}>
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  />
                  <Bar dataKey="water" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

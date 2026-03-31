import { useState, useEffect } from 'react';
import { ExerciseLog } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Gift, TrendingUp, Target, Calendar, Activity } from 'lucide-react';
import { getCurrentDate } from '../utils/time';
import { useLanguage } from '../contexts/LanguageContext';
import { TranslationKey } from '../utils/translations';

interface GymWrappedProps {
  logs: ExerciseLog[];
}

export default function GymWrapped({ logs }: GymWrappedProps) {
  const { t } = useLanguage();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [displayUnit, setDisplayUnit] = useState<'kg' | 'lbs'>('kg');

  // Check if it's Dec 25th or later
  useEffect(() => {
    const today = getCurrentDate();
    if (today.getMonth() === 11 && today.getDate() >= 25) {
      setIsUnlocked(true);
    }
  }, []);

  const totalVolume = Math.round(logs.reduce((sum, log) => {
    if (log.weight === undefined) return sum;
    const weightInKg = log.unit === 'lbs' ? log.weight * 0.453592 : log.weight;
    const finalWeight = displayUnit === 'lbs' ? weightInKg * 2.20462 : weightInKg;
    return sum + (finalWeight * (log.reps || 1));
  }, 0));

  const totalCardioMinutes = logs.reduce((sum, log) => sum + (log.duration || 0), 0);
  const totalWorkouts = logs.length;
  
  const muscleGroups = logs.reduce((acc, log) => {
    acc[log.muscleGroup] = (acc[log.muscleGroup] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topMuscleGroupRaw = Object.entries(muscleGroups).sort((a, b) => b[1] - a[1])[0]?.[0];
  const topMuscleGroup = topMuscleGroupRaw ? t(topMuscleGroupRaw.toLowerCase() as TranslationKey) : t('noData');

  const slides = [
    {
      title: t('wrappedSlide1Title'),
      value: `${totalVolume.toLocaleString()} ${displayUnit}`,
      subtitle: t('wrappedSlide1Subtitle'),
      icon: <TrendingUp className="w-16 h-16 text-[#FF0050] mb-6" />
    },
    {
      title: t('wrappedSlide2Title'),
      value: topMuscleGroup,
      subtitle: t('wrappedSlide2Subtitle'),
      icon: <Target className="w-16 h-16 text-[#1d7a82] mb-6" />
    },
    {
      title: t('wrappedSlide3Title'),
      value: `${totalCardioMinutes} ${t('minutesShort')}`,
      subtitle: t('wrappedSlide3Subtitle'),
      icon: <Activity className="w-16 h-16 text-[#FF0050] mb-6" />
    },
    {
      title: t('wrappedSlide4Title'),
      value: `${totalWorkouts} ${t('exercises')}`,
      subtitle: t('wrappedSlide4Subtitle'),
      icon: <Calendar className="w-16 h-16 text-[#1d7a82] mb-6" />
    }
  ];

  if (!isUnlocked) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
          <Gift className="w-10 h-10 text-slate-500 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3 text-glow-teal">{t('wrappedNotReadyTitle')}</h2>
        <p className="text-slate-400 max-w-md mb-8">
          {t('wrappedNotReadySubtitle')}
        </p>
        <button
          onClick={() => setIsUnlocked(true)}
          className="text-sm text-[#1d7a82] hover:text-white hover:text-glow-teal underline transition-all"
        >
          {t('wrappedUnlockDemo')}
        </button>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400">{t('wrappedNoData')}</p>
      </div>
    );
  }

  return (
    <div className="relative h-[600px] max-h-[70vh] bg-gradient-to-br from-[#0f172a] to-[#1e293b] border border-white/10 hover:border-[#FF0050]/30 hover:shadow-[0_0_30px_rgba(255,0,80,0.15)] rounded-3xl overflow-hidden flex flex-col transition-all">
      {/* Unit Toggle */}
      <div className="absolute top-4 right-4 z-30">
        <button
          onClick={() => setDisplayUnit(prev => prev === 'kg' ? 'lbs' : 'kg')}
          className="bg-black/40 hover:bg-black/60 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] border border-white/10"
        >
          {t('showIn')} {displayUnit === 'kg' ? 'lbs' : 'kg'}
        </button>
      </div>

      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 flex gap-1 p-4 z-20">
        {slides.map((_, idx) => (
          <div key={idx} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-white"
              initial={{ width: idx < currentSlide ? '100%' : '0%' }}
              animate={{ width: idx <= currentSlide ? '100%' : '0%' }}
              transition={{ duration: idx === currentSlide ? 5 : 0.3, ease: "linear" }}
              onAnimationComplete={() => {
                if (idx === currentSlide && currentSlide < slides.length - 1) {
                  setCurrentSlide(c => c + 1);
                }
              }}
            />
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 relative flex items-center justify-center p-8 text-center z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.1, y: -20 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center"
          >
            <div className="drop-shadow-[0_0_15px_rgba(255,0,80,0.5)]">
              {slides[currentSlide].icon}
            </div>
            <h3 className="text-xl font-medium text-slate-300 mb-2 tracking-wide uppercase">{slides[currentSlide].title}</h3>
            <div className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
              {slides[currentSlide].value}
            </div>
            <p className="text-lg text-slate-400 max-w-md">
              {slides[currentSlide].subtitle}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Areas */}
      <div 
        className="absolute inset-y-0 left-0 w-1/2 z-20 cursor-pointer"
        onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
      />
      <div 
        className="absolute inset-y-0 right-0 w-1/2 z-20 cursor-pointer"
        onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))}
      />

      {/* Decorative background elements */}
      <div className="absolute top-1/4 -left-20 w-64 h-64 bg-[#FF0050]/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-64 h-64 bg-[#1d7a82]/20 rounded-full blur-[100px] pointer-events-none" />
    </div>
  );
}

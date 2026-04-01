import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Droplets, Utensils, Plus, Check, Loader2, TrendingUp, Info } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { analyzeMealPhoto } from '../services/nutritionService';
import { db, auth } from '../firebase';
import { collection, addDoc, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/storage';
import { NutritionLog, FoodItem } from '../types';
import { compressImage } from '../utils/imageUtils';

export const NutritionTracker: React.FC = () => {
  const { t, language } = useLanguage();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [logs, setLogs] = useState<NutritionLog[]>([]);
  const [waterIntake, setWaterIntake] = useState(0);
  const [showCamera, setShowCamera] = useState(false);
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, `users/${auth.currentUser.uid}/nutrition`),
      orderBy('date', 'desc'),
      limit(10)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newLogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NutritionLog));
      setLogs(newLogs);
      
      // Calculate today's water
      const today = new Date().toISOString().split('T')[0];
      const todayWater = newLogs
        .filter(log => log.date.startsWith(today))
        .reduce((sum, log) => sum + log.waterIntakeMl, 0);
      setWaterIntake(todayWater);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${auth.currentUser?.uid}/nutrition`);
    });
    return () => unsubscribe();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;

    setIsAnalyzing(true);
    try {
      const base64 = await compressImage(file, 800, 800, 0.7);
      
      // Get user data for AI context (simplified for now)
      const userData = { weight: 75, goal: 'muscle_build' }; 
      
      try {
        const analysis = await analyzeMealPhoto(base64, userData, mealType, language);
        
        const newLog: Omit<NutritionLog, 'id'> = {
          userId: auth.currentUser!.uid,
          date: new Date().toISOString(),
          mealType,
          foodItems: analysis.foodItems || [],
          totalCalories: analysis.totalCalories || 0,
          totalProtein: analysis.totalProtein || 0,
          totalCarbs: analysis.totalCarbs || 0,
          totalFat: analysis.totalFat || 0,
          waterIntakeMl: 0,
          feedback: analysis.feedback || '',
          imageUrl: `data:image/jpeg;base64,${base64}`, // Use compressed image
        };

        await addDoc(collection(db, `users/${auth.currentUser!.uid}/nutrition`), newLog);
        setIsAnalyzing(false);
        setShowCamera(false);
      } catch (aiError: any) {
        console.error("AI Error in NutritionTracker:", aiError);
        setIsAnalyzing(false);
        if (aiError.message === "AI_NOT_WORKING") {
          alert(language === 'de' ? "KI funktioniert heute nicht mehr" : "AI is not working today");
        } else {
          alert(t('analysisError'));
        }
      }
    } catch (error) {
      console.error(error);
      setIsAnalyzing(false);
      alert(t('analysisError'));
    }
  };

  const addWater = async (amount: number) => {
    if (!auth.currentUser) return;
    const newLog: Omit<NutritionLog, 'id'> = {
      userId: auth.currentUser.uid,
      date: new Date().toISOString(),
      mealType: 'snack',
      foodItems: [],
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      waterIntakeMl: amount,
      feedback: t('waterHint'),
    };
    await addDoc(collection(db, `users/${auth.currentUser.uid}/nutrition`), newLog);
  };

  return (
    <div className="p-6 space-y-8 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic text-glow-teal">
            {t('aiNutritionist')}
          </h1>
          <p className="text-slate-400 font-medium">{t('aiNutritionistSubtitle')}</p>
        </div>
        <div className="bg-[#1d7a82]/20 p-3 rounded-2xl border border-[#1d7a82]/30">
          <TrendingUp className="w-6 h-6 text-[#1d7a82]" />
        </div>
      </div>

      {/* Water Tracker */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#1e293b] border border-white/10 rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
          <Droplets className="w-24 h-24 text-[#1d7a82]" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-[#1d7a82]/20 p-2 rounded-xl">
              <Droplets className="w-5 h-5 text-[#1d7a82]" />
            </div>
            <h2 className="text-xl font-bold text-white uppercase tracking-widest italic">{t('waterTracker')}</h2>
          </div>

          <div className="flex items-end gap-4 mb-8">
            <span className="text-6xl font-black text-white tracking-tighter">{(waterIntake / 1000).toFixed(1)}</span>
            <span className="text-2xl font-bold text-slate-500 mb-2 tracking-widest uppercase italic">Liter</span>
            <div className="ml-auto text-right">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{t('dailyGoal')}</p>
              <p className="text-lg font-black text-[#1d7a82]">3.0L</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[250, 500, 750].map((amount) => (
              <button
                key={amount}
                onClick={() => addWater(amount)}
                className="bg-white/5 hover:bg-[#1d7a82]/20 border border-white/10 hover:border-[#1d7a82]/50 rounded-2xl py-4 transition-all group/btn"
              >
                <div className="flex flex-col items-center gap-1">
                  <Plus className="w-4 h-4 text-slate-500 group-hover/btn:text-[#1d7a82]" />
                  <span className="font-bold text-white tracking-widest uppercase text-xs">{amount}ml</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Analysis Button */}
      <div className="grid grid-cols-1 gap-4">
        <button
          onClick={() => setShowCamera(true)}
          className="bg-gradient-to-br from-[#1d7a82] to-[#155e63] p-8 rounded-[2.5rem] border border-white/10 shadow-[0_0_30px_rgba(29,122,130,0.3)] group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-110 transition-transform">
            <Camera className="w-20 h-20 text-white" />
          </div>
          <div className="relative z-10 text-left">
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic mb-2">{t('analyzeMeal')}</h2>
            <p className="text-white/70 font-medium text-sm max-w-[200px]">{t('analyzeMealSubtitle')}</p>
          </div>
        </button>
      </div>

      {/* Recent Logs */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-[0.3em] pl-2">{t('recentMeals')}</h2>
        <div className="space-y-4">
          {logs.filter(log => log.totalCalories > 0).map((log, idx) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-[#1e293b] border border-white/10 rounded-3xl p-6 flex gap-6 items-start"
            >
              {log.imageUrl ? (
                <img src={log.imageUrl} className="w-24 h-24 rounded-2xl object-cover border border-white/10" alt="Meal" />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                  <Utensils className="w-8 h-8 text-slate-600" />
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#1d7a82] uppercase tracking-widest">{log.mealType}</span>
                  <span className="text-xs text-slate-500">{new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-1">
                  {log.foodItems.map(i => i.name).join(', ') || 'Mahlzeit'}
                </h3>
                <div className="flex gap-4">
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Kcal</p>
                    <p className="text-sm font-black text-white">{log.totalCalories}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Prot</p>
                    <p className="text-sm font-black text-[#FF0050]">{log.totalProtein}g</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Carb</p>
                    <p className="text-sm font-black text-blue-400">{log.totalCarbs}g</p>
                  </div>
                </div>
                {log.feedback && (
                  <div className="mt-4 p-3 bg-white/5 rounded-xl border border-white/5 flex gap-2 items-start">
                    <Info className="w-4 h-4 text-[#1d7a82] shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-400 italic leading-relaxed">{log.feedback}</p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showCamera && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0f172a]/90 backdrop-blur-xl p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#1e293b] border border-white/10 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl"
            >
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic mb-6 text-center">{t('uploadPhoto')}</h2>
              
              <div className="grid grid-cols-2 gap-3 mb-8">
                {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setMealType(type)}
                    className={`py-3 rounded-2xl border font-bold uppercase tracking-widest text-xs transition-all ${
                      mealType === type 
                        ? 'bg-[#1d7a82] border-[#1d7a82] text-white' 
                        : 'bg-white/5 border-white/10 text-slate-400'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <label className="block">
                  <div className="w-full bg-white/5 border-2 border-dashed border-white/10 rounded-3xl p-12 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-white/10 transition-all group">
                    {isAnalyzing ? (
                      <Loader2 className="w-12 h-12 text-[#1d7a82] animate-spin" />
                    ) : (
                      <Camera className="w-12 h-12 text-slate-600 group-hover:text-[#1d7a82] transition-colors" />
                    )}
                    <span className="text-slate-500 font-bold uppercase tracking-widest text-sm">
                      {isAnalyzing ? t('analyzing') : t('selectPhoto')}
                    </span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={isAnalyzing} />
                  </div>
                </label>

                <button
                  onClick={() => setShowCamera(false)}
                  className="w-full py-4 text-slate-500 font-bold uppercase tracking-widest text-sm hover:text-white transition-colors"
                >
                  {t('cancel')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

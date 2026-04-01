import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Zap, Shield, Cpu, Activity } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const PlanGenerationLoader: React.FC = () => {
  const { t } = useLanguage();
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>('');

  const statuses = [
    t('analyzingBody' as any),
    t('optimizingExercises' as any),
    t('finalizingPlan' as any),
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        return prev + 1;
      });
    }, 50);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const statusIndex = Math.floor((progress / 100) * statuses.length);
    setStatus(statuses[Math.min(statusIndex, statuses.length - 1)]);
  }, [progress]);

  return (
    <div className="fixed inset-0 z-[110] flex flex-col items-center justify-center bg-[#0f172a] overflow-hidden">
      {/* Background Energy Grid */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1d7a82_1px,transparent_1px),linear-gradient(to_bottom,#1d7a82_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      {/* Scanning Avatar */}
      <div className="relative mb-12">
        <motion.div
          animate={{ 
            scale: [1, 1.05, 1],
            filter: ["drop-shadow(0 0 20px rgba(29,122,130,0.3))", "drop-shadow(0 0 40px rgba(29,122,130,0.6))", "drop-shadow(0 0 20px rgba(29,122,130,0.3))"]
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="relative"
        >
          <svg width="200" height="300" viewBox="0 0 200 300" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M100 20C110 20 120 30 120 45C120 60 110 70 100 70C90 70 80 60 80 45C80 30 90 20 100 20Z" stroke="#1d7a82" strokeWidth="2" />
            <path d="M100 70V150M100 150L60 250M100 150L140 250M60 100H140" stroke="#1d7a82" strokeWidth="2" strokeLinecap="round" />
            <circle cx="100" cy="45" r="15" fill="#1d7a82" fillOpacity="0.2" />
          </svg>
          
          {/* Scan Line */}
          <motion.div
            animate={{ top: ['0%', '100%', '0%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#FF0050] to-transparent shadow-[0_0_15px_#FF0050] z-10"
          />
        </motion.div>

        {/* Floating Icons */}
        <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 2.5, repeat: Infinity }} className="absolute -top-10 -left-10 bg-[#1d7a82]/20 p-3 rounded-2xl border border-[#1d7a82]/50">
          <Cpu className="w-6 h-6 text-[#1d7a82]" />
        </motion.div>
        <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 3, repeat: Infinity }} className="absolute -bottom-10 -right-10 bg-[#FF0050]/20 p-3 rounded-2xl border border-[#FF0050]/50">
          <Activity className="w-6 h-6 text-[#FF0050]" />
        </motion.div>
      </div>

      <div className="max-w-xs w-full text-center">
        <h2 className="text-2xl font-black text-white mb-2 tracking-tighter uppercase italic text-glow-teal">
          {t('generatingPlan' as any)}
        </h2>
        <p className="text-slate-400 text-sm mb-8 font-bold tracking-widest uppercase h-5">
          {status}
        </p>

        {/* Progress Bar */}
        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/10 relative">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#1d7a82] to-[#FF0050] shadow-[0_0_15px_rgba(29,122,130,0.5)]"
          />
        </div>
        <div className="mt-2 text-right">
          <span className="text-[10px] font-black text-[#1d7a82]">{progress}%</span>
        </div>
      </div>

      {/* Tech Details */}
      <div className="absolute bottom-12 left-0 right-0 flex justify-center gap-12 opacity-50">
        <div className="flex flex-col items-center gap-1">
          <Shield className="w-4 h-4 text-slate-400" />
          <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500">Secure AI</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Zap className="w-4 h-4 text-slate-400" />
          <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500">Fast Compute</span>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'motion/react';
import { Dumbbell, Target, Book, BarChart2, Zap, ChevronRight, Users, PlusCircle, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface OnboardingAnimationProps {
  onComplete: () => void;
}

export const OnboardingAnimation: React.FC<OnboardingAnimationProps> = ({ onComplete }) => {
  const { t } = useLanguage();
  const [step, setStep] = useState(0);
  const [isExploded, setIsExploded] = useState(false);

  // Apex Mascot Animation Variants
  const mascotVariants: Variants = {
    idle: {
      y: [0, -10, 0],
      rotate: [0, 5, -5, 0],
      transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
    },
    jump: {
      scale: [1, 1.5, 1],
      y: [0, -50, 0],
      rotate: [0, 360],
      transition: { duration: 0.5 }
    }
  };

  useEffect(() => {
    if (isExploded && step === 0) {
      const timer = setTimeout(() => setStep(1), 800);
      return () => clearTimeout(timer);
    }
  }, [isExploded, step]);

  const nextStep = () => {
    if (step < 6) {
      setStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const skipTutorial = () => {
    onComplete();
  };

  if (!isExploded) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0f172a]">
        <motion.div 
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          className="text-center"
        >
          <motion.div
            variants={mascotVariants}
            animate="idle"
            className="mb-6 inline-block"
          >
            <div className="bg-gradient-to-br from-[#1d7a82] to-[#FF0050] p-6 rounded-full shadow-[0_0_40px_rgba(29,122,130,0.5)]">
              <Zap className="w-12 h-12 text-white fill-current" />
            </div>
          </motion.div>
          <br />
          <motion.button
            whileHover={{ scale: 1.1, boxShadow: "0 0 30px rgba(29,122,130,0.6)" }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsExploded(true)}
            className="relative group bg-[#1d7a82] text-white px-10 py-5 rounded-2xl font-black text-2xl shadow-[0_0_20px_rgba(29,122,130,0.4)] transition-all overflow-hidden uppercase italic tracking-tighter"
          >
            <span className="relative z-10 flex items-center gap-3">
              {t('startTutorial' as any)}
              <ChevronRight className="w-6 h-6" />
            </span>
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0f172a]/90 backdrop-blur-xl overflow-hidden">
      {/* Skip Button */}
      {step > 0 && (
        <motion.button
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={skipTutorial}
          className="absolute top-6 right-6 z-[110] flex items-center gap-2 text-slate-400 hover:text-white transition-colors px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md"
        >
          <span className="text-sm font-medium">{t('onboardingSkip' as any)}</span>
          <X className="w-4 h-4" />
        </motion.button>
      )}

      {/* Background Energy Lines */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={`line-${i}`}
            initial={{ x: '-100%', y: `${i * 10}%` }}
            animate={{ x: '200%' }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.2, ease: "linear" }}
            className="absolute h-px w-full bg-gradient-to-r from-transparent via-[#1d7a82] to-transparent"
          />
        ))}
      </div>

      {/* Background Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(40)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: '50%', 
              y: '50%', 
              scale: 0,
              opacity: 1 
            }}
            animate={{ 
              x: `${Math.random() * 120 - 10}%`, 
              y: `${Math.random() * 120 - 10}%`,
              scale: Math.random() * 3,
              opacity: 0
            }}
            transition={{ 
              duration: 0.8 + Math.random(), 
              ease: "easeOut",
              delay: i * 0.01
            }}
            className={`absolute w-2 h-2 rounded-full ${i % 2 === 0 ? 'bg-[#1d7a82]' : 'bg-[#FF0050]'} blur-[1px]`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, scale: 0.5, x: 500, rotate: 45 }}
            animate={{ opacity: 1, scale: 1, x: 0, rotate: 0 }}
            exit={{ opacity: 0, scale: 1.5, x: -500, rotate: -45 }}
            transition={{ type: "spring", damping: 15 }}
            className="max-w-md w-full p-8 text-center relative"
          >
            <motion.div variants={mascotVariants} animate="idle" className="mb-6">
              <div className="bg-[#1d7a82]/20 p-6 rounded-3xl border border-[#1d7a82]/50 glow-teal inline-block relative">
                <Target className="w-16 h-16 text-[#1d7a82]" />
                <motion.div 
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 border-2 border-[#1d7a82] rounded-3xl"
                />
              </div>
            </motion.div>
            <h2 className="text-4xl font-black text-white mb-4 tracking-tighter uppercase italic text-glow-teal">
              {t('onboardingStep1Title' as any)}
            </h2>
            <p className="text-slate-300 text-lg mb-8 leading-relaxed font-medium">
              {t('onboardingStep1Text' as any)}
            </p>
            <button
              onClick={nextStep}
              className="group relative flex items-center gap-2 mx-auto bg-[#1d7a82] text-white px-8 py-4 rounded-2xl font-bold hover:scale-105 transition-all shadow-[0_0_20px_rgba(29,122,130,0.4)]"
            >
              {t('confirm')} <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, scale: 0.5, y: 500 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.2, rotate: 180 }}
            transition={{ type: "spring", damping: 15 }}
            className="max-w-md w-full p-8 text-center"
          >
            <motion.div variants={mascotVariants} animate="idle" className="mb-6">
              <div className="bg-[#FF0050]/20 p-6 rounded-3xl border border-[#FF0050]/50 glow-pink inline-block relative">
                <Book className="w-16 h-16 text-[#FF0050]" />
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="absolute -inset-2 border border-dashed border-[#FF0050]/50 rounded-full"
                />
              </div>
            </motion.div>
            <h2 className="text-4xl font-black text-white mb-4 tracking-tighter uppercase italic text-glow-pink">
              {t('onboardingStep2Title' as any)}
            </h2>
            <p className="text-slate-300 text-lg mb-8 leading-relaxed font-medium">
              {t('onboardingStep2Text' as any)}
            </p>
            <button
              onClick={nextStep}
              className="group flex items-center gap-2 mx-auto bg-[#FF0050] text-white px-8 py-4 rounded-2xl font-bold hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,0,80,0.4)]"
            >
              {t('confirm')} <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: -500, rotate: -90 }}
            animate={{ opacity: 1, x: 0, rotate: 0 }}
            exit={{ opacity: 0, scale: 2, filter: 'blur(20px)' }}
            transition={{ type: "spring", damping: 15 }}
            className="max-w-md w-full p-8 text-center"
          >
            <motion.div variants={mascotVariants} animate="idle" className="mb-6">
              <div className="bg-white/10 p-6 rounded-3xl border border-white/20 backdrop-blur-xl inline-block relative overflow-hidden">
                <BarChart2 className="w-16 h-16 text-white" />
                <motion.div 
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                />
              </div>
            </motion.div>
            <h2 className="text-4xl font-black text-white mb-4 tracking-tighter uppercase italic">
              {t('onboardingStep3Title' as any)}
            </h2>
            <p className="text-slate-300 text-lg mb-8 leading-relaxed font-medium">
              {t('onboardingStep3Text' as any)}
            </p>
            <button
              onClick={nextStep}
              className="group flex items-center gap-2 mx-auto bg-white text-[#0f172a] px-8 py-4 rounded-2xl font-bold hover:scale-105 transition-all shadow-xl"
            >
              {t('confirm')} <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, scale: 0.8, rotateY: 90 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            exit={{ opacity: 0, scale: 1.2, rotateY: -90 }}
            transition={{ type: "spring", damping: 15 }}
            className="max-w-md w-full p-8 text-center"
          >
            <motion.div variants={mascotVariants} animate="idle" className="mb-6">
              <div className="bg-[#1d7a82]/20 p-6 rounded-3xl border border-[#1d7a82]/50 glow-teal inline-block relative">
                <Users className="w-16 h-16 text-[#1d7a82]" />
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -top-2 -right-2 bg-[#FF0050] p-2 rounded-full shadow-[0_0_10px_#FF0050]"
                >
                  <PlusCircle className="w-4 h-4 text-white" />
                </motion.div>
              </div>
            </motion.div>
            <h2 className="text-4xl font-black text-white mb-4 tracking-tighter uppercase italic text-glow-teal">
              {t('onboardingStep4Title' as any)}
            </h2>
            <p className="text-slate-300 text-lg mb-8 leading-relaxed font-medium">
              {t('onboardingStep4Text' as any)}
            </p>
            <button
              onClick={nextStep}
              className="group flex items-center gap-2 mx-auto bg-[#1d7a82] text-white px-8 py-4 rounded-2xl font-bold hover:scale-105 transition-all shadow-[0_0_20px_rgba(29,122,130,0.4)]"
            >
              {t('confirm')} <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        )}

        {step === 5 && (
          <motion.div
            key="step5"
            initial={{ opacity: 0, y: 100, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -100, filter: 'blur(10px)' }}
            transition={{ type: "spring", damping: 15 }}
            className="max-w-md w-full p-8 text-center"
          >
            <motion.div variants={mascotVariants} animate="idle" className="mb-6">
              <div className="bg-[#FF0050]/20 p-6 rounded-3xl border border-[#FF0050]/50 glow-pink inline-block relative">
                <PlusCircle className="w-16 h-16 text-[#FF0050]" />
                <motion.div 
                  animate={{ rotate: [0, 90, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute inset-0 border-2 border-dashed border-[#FF0050]/30 rounded-3xl"
                />
              </div>
            </motion.div>
            <h2 className="text-4xl font-black text-white mb-4 tracking-tighter uppercase italic text-glow-pink">
              {t('onboardingStep5Title' as any)}
            </h2>
            <p className="text-slate-300 text-lg mb-8 leading-relaxed font-medium">
              {t('onboardingStep5Text' as any)}
            </p>
            <button
              onClick={nextStep}
              className="group flex items-center gap-2 mx-auto bg-[#FF0050] text-white px-8 py-4 rounded-2xl font-bold hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,0,80,0.4)]"
            >
              {t('confirm')} <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        )}

        {step === 6 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, scale: 0, rotate: 720 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 12 }}
            className="max-w-md w-full p-8 text-center"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                filter: ["drop-shadow(0 0 0px #1d7a82)", "drop-shadow(0 0 20px #1d7a82)", "drop-shadow(0 0 0px #1d7a82)"]
              }}
              transition={{ duration: 1, repeat: Infinity }}
              className="mb-8 inline-block bg-gradient-to-br from-[#1d7a82] to-[#FF0050] p-10 rounded-full shadow-[0_0_60px_rgba(29,122,130,0.6)]"
            >
              <Dumbbell className="w-24 h-24 text-white" />
            </motion.div>
            <h2 className="text-6xl font-black text-white mb-2 tracking-tighter uppercase italic text-glow-teal">
              {t('onboardingReady' as any)}
            </h2>
            <p className="text-white/90 text-2xl font-bold mb-12 tracking-tight">
              {t('onboardingStartTraining' as any)}
            </p>
            <motion.button
              whileHover={{ scale: 1.1, letterSpacing: "0.2em" }}
              whileTap={{ scale: 0.9 }}
              onClick={onComplete}
              className="w-full bg-white text-[#0f172a] py-6 rounded-2xl font-black text-3xl uppercase tracking-widest shadow-[0_10px_40px_rgba(0,0,0,0.4)] hover:shadow-[0_20px_60px_rgba(29,122,130,0.5)] transition-all"
            >
              GO!
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

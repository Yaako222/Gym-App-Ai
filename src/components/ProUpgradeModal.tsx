import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Star, Shield, Zap, Users } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { usePro } from '../contexts/ProContext';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

export const ProUpgradeModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { t } = useLanguage();
  const { upgradeToPro, isPro } = usePro();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [planType, setPlanType] = useState<'individual' | 'family'>('individual');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState<{type: 'error'|'success', text: string} | null>(null);

  useEffect(() => {
    if (isOpen) {
      const script = document.createElement('script');
      script.src = 'https://assets.lemonsqueezy.com/lemon.js';
      script.defer = true;
      document.body.appendChild(script);

      script.onload = () => {
        if ((window as any).createLemonSqueezy) {
          (window as any).createLemonSqueezy();
        }
      };

      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    }
  }, [isOpen]);

  const getCheckoutLink = () => {
    if (billingCycle === 'monthly' && planType === 'individual') return 'https://gymllc.lemonsqueezy.com/checkout/buy/89b9f08b-5ed7-4b51-8188-656ab12137d1?embed=1';
    if (billingCycle === 'monthly' && planType === 'family') return 'https://gymllc.lemonsqueezy.com/checkout/buy/1491df13-d11d-4531-89c9-f3e69d011a33?embed=1';
    if (billingCycle === 'yearly' && planType === 'individual') return 'https://gymllc.lemonsqueezy.com/checkout/buy/0b47081d-7764-4058-8b58-525c07c6c226?embed=1';
    if (billingCycle === 'yearly' && planType === 'family') return 'https://gymllc.lemonsqueezy.com/checkout/buy/febbbd28-1a08-41fe-ad64-84d71293a512?embed=1';
    return '#';
  };

  const getPriceDisplay = () => {
    if (billingCycle === 'monthly' && planType === 'individual') return '€2.67/month';
    if (billingCycle === 'monthly' && planType === 'family') return '€10.67/month';
    if (billingCycle === 'yearly' && planType === 'individual') return '€35.67/year';
    if (billingCycle === 'yearly' && planType === 'family') return '€100.00/year';
    return '';
  };

  const handleVerify = async () => {
    if (!auth.currentUser) return;
    setIsVerifying(true);
    setVerifyMessage(null);
    try {
      // Check if admin has manually granted access
      const proDocUid = await getDoc(doc(db, 'pro_users', auth.currentUser.uid));
      const proDocEmail = await getDoc(doc(db, 'pro_users', auth.currentUser.email || ''));
      
      if ((proDocUid.exists() && proDocUid.data().active) || (proDocEmail.exists() && proDocEmail.data().active)) {
        await upgradeToPro(planType);
        setVerifyMessage({ type: 'success', text: 'Payment verified! Welcome to PRO.' });
        setTimeout(() => onClose(), 2000);
      } else {
        setVerifyMessage({ type: 'error', text: 'No active subscription found. If you just paid, please wait a moment or contact support.' });
      }
    } catch (error) {
      console.error('Verification failed:', error);
      setVerifyMessage({ type: 'error', text: 'An error occurred during verification.' });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#1e293b] border border-[#FF0050]/30 rounded-3xl p-6 shadow-[0_0_50px_rgba(255,0,80,0.2)] z-[101] max-h-[90vh] overflow-y-auto custom-scrollbar"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="inline-block bg-gradient-to-br from-[#FF0050] to-[#ff4d85] p-3 rounded-2xl mb-3 shadow-[0_0_20px_rgba(255,0,80,0.4)]">
                <Star className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter text-glow-pink">
                GymTracker PRO
              </h2>
              <p className="text-slate-400 text-sm mt-1">Unlock the full power of AI</p>
            </div>

            {/* Billing Cycle Toggle */}
            <div className="bg-black/20 p-1 rounded-2xl border border-white/5 flex mb-3">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                  billingCycle === 'monthly' ? 'bg-[#FF0050] text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all relative ${
                  billingCycle === 'yearly' ? 'bg-[#FF0050] text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Yearly
                <span className="absolute -top-2 -right-2 bg-[#1d7a82] text-[8px] px-1.5 py-0.5 rounded-full text-white animate-pulse">
                  1 MONTH FREE
                </span>
              </button>
            </div>

            {/* Plan Type Toggle */}
            <div className="bg-black/20 p-1 rounded-2xl border border-white/5 flex mb-6">
              <button
                onClick={() => setPlanType('individual')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                  planType === 'individual' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Individual
              </button>
              <button
                onClick={() => setPlanType('family')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                  planType === 'family' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Users className="w-3 h-3" />
                Family
              </button>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <div className="bg-[#1d7a82]/20 p-2 rounded-lg mt-1">
                  <Zap className="w-4 h-4 text-[#1d7a82]" />
                </div>
                <div>
                  <h4 className="text-white font-bold">AI Workout Generation</h4>
                  <p className="text-slate-400 text-xs">Get personalized plans created by our advanced AI.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-[#1d7a82]/20 p-2 rounded-lg mt-1">
                  <Shield className="w-4 h-4 text-[#1d7a82]" />
                </div>
                <div>
                  <h4 className="text-white font-bold">AI Nutrition Analysis</h4>
                  <p className="text-slate-400 text-xs">Analyze your meals instantly with AI vision.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-[#1d7a82]/20 p-2 rounded-lg mt-1">
                  <Star className="w-4 h-4 text-[#1d7a82]" />
                </div>
                <div>
                  <h4 className="text-white font-bold">AI Chat Coach</h4>
                  <p className="text-slate-400 text-xs">24/7 access to your personal AI fitness coach.</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <a
                href={getCheckoutLink()}
                className="lemonsqueezy-button w-full flex flex-col items-center justify-center gap-1 bg-[#FF0050] hover:bg-[#e60048] text-white py-3 rounded-xl font-medium transition-all glow-pink"
              >
                <span>Buy GymTracker PRO</span>
                <span className="text-xs font-bold opacity-90">{getPriceDisplay()}</span>
              </a>

              <button
                onClick={handleVerify}
                disabled={isVerifying}
                className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl font-medium transition-all border border-white/10"
              >
                {isVerifying ? 'Verifying...' : 'I already paid (Verify)'}
              </button>

              {verifyMessage && (
                <p className={`text-xs text-center mt-2 p-2 rounded-lg border ${
                  verifyMessage.type === 'success' ? 'text-green-400 bg-green-400/10 border-green-400/20' : 'text-red-400 bg-red-400/10 border-red-400/20'
                }`}>
                  {verifyMessage.text}
                </p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Star, Shield, Zap } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { usePro } from '../contexts/ProContext';

const stripePromise = loadStripe('pk_test_51THVGkAmEkKGLsAUYIhL8dqgiNhdDcEFRBN53Zy9xvxENvuj93tukr2ZESlesctgNuWm4Bbg3RGfGdI8R1WzGKnC00WPupVTKc');

const CheckoutForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const { t } = useLanguage();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin,
      },
      redirect: 'if_required',
    });

    if (submitError) {
      setError(submitError.message || 'An error occurred');
      setProcessing(false);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && <div className="text-red-400 text-sm mt-2">{error}</div>}
      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full bg-[#FF0050] hover:bg-[#e60048] text-white py-3 rounded-xl font-medium transition-all glow-pink disabled:opacity-50 mt-4"
      >
        {processing ? t('processing' as any) : t('payNow' as any)}
      </button>
    </form>
  );
};

export const ProUpgradeModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { t } = useLanguage();
  const { upgradeToPro, isPro } = usePro();
  const [clientSecret, setClientSecret] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isDirectLinkOpen, setIsDirectLinkOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const STRIPE_LINKS = {
    monthly: 'https://buy.stripe.com/test_6oU5kC0vF5Vk5uJfpmdjO01',
    yearly: 'https://buy.stripe.com/test_fZudR8dir97w3mBcdadjO00'
  };

  useEffect(() => {
    if (isOpen && !isPro && !isDirectLinkOpen && auth.currentUser) {
      fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cycle: billingCycle,
          email: auth.currentUser.email,
          userId: auth.currentUser.uid
        })
      })
        .then((res) => {
          if (!res.ok) throw new Error('Failed to fetch payment intent');
          return res.json();
        })
        .then((data) => setClientSecret(data.clientSecret))
        .catch((err) => console.error('Error fetching client secret:', err));
    }
  }, [isOpen, isPro, isDirectLinkOpen, billingCycle]);

  const handleSuccess = async () => {
    await upgradeToPro();
    onClose();
  };

  const handleVerify = async () => {
    if (!auth.currentUser) return;
    setIsVerifying(true);
    setVerifyError(null);
    try {
      const response = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: auth.currentUser.email,
          userId: auth.currentUser.uid
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        await upgradeToPro();
        onClose();
      } else {
        setVerifyError(data.message || 'No payment found. Please try again after completing the checkout.');
      }
    } catch (error) {
      console.error('Verification failed:', error);
      setVerifyError('An error occurred during verification. Please try again.');
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

            {/* Plan Toggle */}
            <div className="bg-black/20 p-1 rounded-2xl border border-white/5 flex mb-6">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                  billingCycle === 'monthly' ? 'bg-[#FF0050] text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Monthly
                <div className="text-[10px] opacity-70">3.99€</div>
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all relative ${
                  billingCycle === 'yearly' ? 'bg-[#FF0050] text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Yearly
                <div className="text-[10px] opacity-70">40.00€</div>
                <span className="absolute -top-2 -right-2 bg-[#1d7a82] text-[8px] px-1.5 py-0.5 rounded-full text-white animate-pulse">
                  SAVE
                </span>
              </button>
            </div>

            {billingCycle === 'yearly' && (
              <div className="bg-[#1d7a82]/10 border border-[#1d7a82]/30 rounded-2xl p-3 mb-6 flex items-center gap-3">
                <Zap className="w-5 h-5 text-[#1d7a82]" />
                <p className="text-xs text-[#1d7a82] font-bold uppercase tracking-wider">
                  30 Days Free Trial Included!
                </p>
              </div>
            )}

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
              {!isDirectLinkOpen ? (
                <>
                  {clientSecret ? (
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                      <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'night' } }}>
                        <CheckoutForm onSuccess={handleSuccess} />
                      </Elements>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-400">Loading payment options...</div>
                  )}

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-[#1e293b] px-2 text-slate-500">Or</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsDirectLinkOpen(true)}
                    className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl font-medium transition-all border border-white/10"
                  >
                    Pay via Direct Link
                  </button>
                </>
              ) : (
                <div className="space-y-4">
                  <a
                    href={STRIPE_LINKS[billingCycle]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-[#FF0050] hover:bg-[#e60048] text-white py-3 rounded-xl font-medium transition-all glow-pink"
                  >
                    Open Stripe Checkout ({billingCycle})
                  </a>

                  <button
                    onClick={handleVerify}
                    disabled={isVerifying}
                    className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl font-medium transition-all border border-white/10"
                  >
                    {isVerifying ? 'Verifying...' : 'I already paid (Verify)'}
                  </button>

                  {verifyError && (
                    <p className="text-red-400 text-xs text-center mt-2 bg-red-400/10 p-2 rounded-lg border border-red-400/20">
                      {verifyError}
                    </p>
                  )}

                  <button
                    onClick={() => setIsDirectLinkOpen(false)}
                    className="w-full text-xs text-slate-500 hover:text-white transition-colors"
                  >
                    Back to Card Payment
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

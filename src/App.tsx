/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Dumbbell, Plus, Search, Sun, Calendar, BarChart2, MessageSquare, Gift, LogOut, Users, Settings as SettingsIcon, Database, Menu, X, Utensils, History as HistoryIcon, Activity } from 'lucide-react';
import { NutritionTracker } from './components/NutritionTracker';
import Dashboard from './components/Dashboard';
import WeeklyPlan from './components/WeeklyPlan';
import Today from './components/Today';
import AIChat from './components/AIChat';
import GymWrapped from './components/GymWrapped';
import AddExerciseModal from './components/AddExerciseModal';
import Analytics from './components/Analytics';
import History from './components/History';
import Library from './components/Library';
import { Friends } from './components/Friends';
import Settings from './components/Settings';
import { UsernameModal } from './components/UsernameModal';
import { OnboardingAnimation } from './components/OnboardingAnimation';
import { DataCollectionModal, UserData } from './components/DataCollectionModal';
import { PlanGenerationLoader } from './components/PlanGenerationLoader';
import GymLoader from './components/GymLoader';
import { ExercisePlan, ExerciseLog, NutritionLog } from './types';
import { generateTrainingPlan } from './services/geminiService';
import { auth, db, loginWithGoogle, logout } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, onSnapshot, getDoc, doc, updateDoc, addDoc, setDoc } from 'firebase/firestore';
import { syncTimeWithInternet } from './utils/time';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

import { useLanguage } from './contexts/LanguageContext';

function App() {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'today' | 'dashboard' | 'weeklyPlan' | 'analytics' | 'history' | 'library' | 'friends' | 'chat' | 'wrapped' | 'settings' | 'nutrition'>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [plans, setPlans] = useState<ExercisePlan[]>([]);
  const [logs, setLogs] = useState<ExerciseLog[]>([]);
  const [nutritionLogs, setNutritionLogs] = useState<NutritionLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showDataCollection, setShowDataCollection] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  useEffect(() => {
    async function initApp() {
      await syncTimeWithInternet();
      try {
        await getDoc(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. ");
        }
      }
    }
    initApp();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setPlans([]);
        setLogs([]);
        setTimeout(() => setIsAppLoading(false), 1000);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const plansRef = collection(db, `users/${user.uid}/plans`);
    const logsRef = collection(db, `users/${user.uid}/logs`);
    const nutritionRef = collection(db, `users/${user.uid}/nutrition`);
    const userRef = doc(db, `users`, user.uid);

    const unsubUser = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().username) {
        setHasProfile(true);
        const data = docSnap.data();
        if (data.hasCompletedOnboarding === false && !data.hasStartedDataCollection) {
          setShowDataCollection(true);
        } else if (data.hasCompletedOnboarding === false && data.hasStartedDataCollection) {
          setShowOnboarding(true);
        }
        if (data.theme === 'light') {
          document.documentElement.classList.add('light-theme');
        } else {
          document.documentElement.classList.remove('light-theme');
        }
        if (data.timezone) {
          localStorage.setItem('gym_timezone', data.timezone);
        }
      } else {
        setHasProfile(false);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
    });

    const unsubPlans = onSnapshot(plansRef, (snapshot) => {
      const newPlans: ExercisePlan[] = [];
      snapshot.forEach(doc => newPlans.push({ id: doc.id, ...doc.data() } as ExercisePlan));
      setPlans(newPlans);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}/plans`);
    });

    const unsubLogs = onSnapshot(logsRef, (snapshot) => {
      const newLogs: ExerciseLog[] = [];
      snapshot.forEach(doc => newLogs.push({ id: doc.id, ...doc.data() } as ExerciseLog));
      setLogs(newLogs);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}/logs`);
    });

    const unsubNutrition = onSnapshot(nutritionRef, (snapshot) => {
      const newNutrition: NutritionLog[] = [];
      snapshot.forEach(doc => newNutrition.push({ id: doc.id, ...doc.data() } as NutritionLog));
      setNutritionLogs(newNutrition);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}/nutrition`);
    });

    const timer = setTimeout(() => {
      setIsAppLoading(false);
    }, 2500);

    return () => {
      unsubUser();
      unsubPlans();
      unsubLogs();
      unsubNutrition();
      clearTimeout(timer);
    };
  }, [user]);

  const handleDataCollectionComplete = async (userData: UserData | null) => {
    setShowDataCollection(false);
    
    if (userData && user) {
      setIsGeneratingPlan(true);
      try {
        const generatedPlans = await generateTrainingPlan(userData);
        
        // Save plans to Firestore
        for (const plan of generatedPlans) {
          const planRef = doc(db, `users/${user.uid}/plans`, plan.id);
          await setDoc(planRef, { ...plan, userId: user.uid });
        }

        // Update user profile to indicate data collection is done
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { 
          hasStartedDataCollection: true,
          fitnessData: userData 
        });
        
        setIsGeneratingPlan(false);
        setShowOnboarding(true);
      } catch (error: any) {
        console.error("Error generating plan:", error);
        setIsGeneratingPlan(false);
        if (error.message === "AI_NOT_WORKING") {
          alert(language === 'de' ? "KI funktioniert heute nicht mehr" : "AI is not working today");
        }
        setShowOnboarding(true); // Still show tutorial even if AI fails
      }
    } else if (user) {
      // User skipped
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { hasStartedDataCollection: true });
      setShowOnboarding(true);
    }
  };

  if (!user && !isAppLoading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 max-w-md w-full text-center backdrop-blur-md shadow-[0_0_30px_rgba(29,122,130,0.15)]">
          <div className="flex justify-center mb-6">
            <div className="bg-[#FF0050]/20 p-4 rounded-full glow-pink">
              <Dumbbell className="w-12 h-12 text-[#FF0050]" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 text-glow-pink">GymTracker<span className="text-[#FF0050]">.AI</span></h1>
          <p className="text-slate-400 mb-8">{t('loginSubtitle')}</p>
          <button
            onClick={loginWithGoogle}
            className="w-full bg-[#1d7a82] hover:bg-[#155e63] text-white font-medium py-3 rounded-xl transition-all glow-teal active:scale-95"
          >
            {t('loginButton')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {isAppLoading && <GymLoader />}
        {user && hasProfile === false && <UsernameModal onComplete={() => {
          setHasProfile(true);
          setShowDataCollection(true);
        }} />}
        {showDataCollection && <DataCollectionModal onComplete={handleDataCollectionComplete} />}
        {isGeneratingPlan && <PlanGenerationLoader />}
        {showOnboarding && (
          <OnboardingAnimation onComplete={() => {
            setShowOnboarding(false);
            if (user) {
              const userRef = doc(db, 'users', user.uid);
              updateDoc(userRef, { hasCompletedOnboarding: true }).catch(console.error);
            }
          }} />
        )}
      </AnimatePresence>
      <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans selection:bg-[#FF0050] selection:text-white">
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col fixed left-0 top-0 bottom-0 z-50 bg-[#0f172a]/95 backdrop-blur-xl border-r border-white/10 transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-[#FF0050] rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(255,0,80,0.5)]">
            <Dumbbell className="w-5 h-5 text-white" />
          </div>
          {!isSidebarCollapsed && <span className="text-xl font-bold text-white tracking-tight">GymTracker<span className="text-[#FF0050]">.AI</span></span>}
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto custom-scrollbar">
          <SidebarItem 
            icon={<Activity className="w-5 h-5" />} 
            label={t('dashboard')} 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
            collapsed={isSidebarCollapsed}
          />
          <SidebarItem 
            icon={<Sun className="w-5 h-5" />} 
            label={t('today')} 
            active={activeTab === 'today'} 
            onClick={() => setActiveTab('today')} 
            collapsed={isSidebarCollapsed}
          />
          <SidebarItem 
            icon={<Calendar className="w-5 h-5" />} 
            label={t('weeklyPlan')} 
            active={activeTab === 'weeklyPlan'} 
            onClick={() => setActiveTab('weeklyPlan')} 
            collapsed={isSidebarCollapsed}
          />
          <SidebarItem 
            icon={<Utensils className="w-5 h-5" />} 
            label={t('nutrition')} 
            active={activeTab === 'nutrition'} 
            onClick={() => setActiveTab('nutrition')} 
            collapsed={isSidebarCollapsed}
          />
          <SidebarItem 
            icon={<BarChart2 className="w-5 h-5" />} 
            label={t('analytics')} 
            active={activeTab === 'analytics'} 
            onClick={() => setActiveTab('analytics')} 
            collapsed={isSidebarCollapsed}
          />
          <SidebarItem 
            icon={<HistoryIcon className="w-5 h-5" />} 
            label={t('history')} 
            active={activeTab === 'history'} 
            onClick={() => setActiveTab('history')} 
            collapsed={isSidebarCollapsed}
          />
          <SidebarItem 
            icon={<Database className="w-5 h-5" />} 
            label={t('library')} 
            active={activeTab === 'library'} 
            onClick={() => setActiveTab('library')} 
            collapsed={isSidebarCollapsed}
          />
          <SidebarItem 
            icon={<Users className="w-5 h-5" />} 
            label={t('friends')} 
            active={activeTab === 'friends'} 
            onClick={() => setActiveTab('friends')} 
            collapsed={isSidebarCollapsed}
          />
          <SidebarItem 
            icon={<MessageSquare className="w-5 h-5" />} 
            label={t('aiCoach')} 
            active={activeTab === 'chat'} 
            onClick={() => setActiveTab('chat')} 
            collapsed={isSidebarCollapsed}
          />
          <SidebarItem 
            icon={<Gift className="w-5 h-5" />} 
            label={t('wrapped')} 
            active={activeTab === 'wrapped'} 
            onClick={() => setActiveTab('wrapped')} 
            collapsed={isSidebarCollapsed}
          />
        </nav>

        <div className="p-4 border-t border-white/5 space-y-2">
          <SidebarItem 
            icon={<SettingsIcon className="w-5 h-5" />} 
            label={t('settings')} 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
            collapsed={isSidebarCollapsed}
          />
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
          >
            <Menu className="w-5 h-5" />
            {!isSidebarCollapsed && <span className="text-sm font-medium">Menü einklappen</span>}
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-[#FF0050] hover:bg-[#FF0050]/10 rounded-xl transition-all"
          >
            <LogOut className="w-5 h-5" />
            {!isSidebarCollapsed && <span className="text-sm font-medium">{t('logout')}</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-30 bg-[#0f172a]/80 backdrop-blur-md border-b border-[#FF0050]/30 shadow-[0_0_20px_rgba(255,0,80,0.15)]">
        <div className="px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#FF0050] drop-shadow-[0_0_8px_rgba(255,0,80,0.8)]">
            <Dumbbell className="w-6 h-6" />
            <h1 className="text-xl font-bold tracking-tight text-white text-glow-pink">GymTracker<span className="text-[#FF0050]">.AI</span></h1>
          </div>
          <button onClick={logout} className="p-2 text-slate-400 hover:text-[#FF0050] transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'} p-4 md:p-8 pb-24 md:pb-8`}>
        <AnimatePresence mode="wait">
          {activeTab === 'today' && (
            <motion.div
              key="today"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Today plans={plans} logs={logs} />
            </motion.div>
          )}
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Dashboard exerciseLogs={logs} nutritionLogs={nutritionLogs} />
            </motion.div>
          )}
          {activeTab === 'weeklyPlan' && (
            <motion.div
              key="weeklyPlan"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div className="relative w-full sm:w-96">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder={t('searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-glow-teal transition-all placeholder:text-slate-500 text-white"
                  />
                </div>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex items-center gap-2 bg-[#FF0050] hover:bg-[#e60048] text-white px-5 py-2 rounded-xl font-medium transition-all glow-pink active:scale-95 w-full sm:w-auto justify-center border border-[#FF0050]"
                >
                  <Plus className="w-4 h-4" />
                  {t('addExercise')}
                </button>
              </div>
              <WeeklyPlan plans={plans} searchQuery={searchQuery} />
            </motion.div>
          )}
          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Analytics logs={logs} nutritionLogs={nutritionLogs} />
            </motion.div>
          )}
          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <History logs={logs} plans={plans} />
            </motion.div>
          )}
          {activeTab === 'library' && (
            <motion.div
              key="library"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Library plans={plans} />
            </motion.div>
          )}
          {activeTab === 'friends' && (
            <motion.div
              key="friends"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Friends />
            </motion.div>
          )}
          {activeTab === 'nutrition' && (
            <motion.div
              key="nutrition"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <NutritionTracker />
            </motion.div>
          )}
          {activeTab === 'chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <AIChat logs={logs} />
            </motion.div>
          )}
          {activeTab === 'wrapped' && (
            <motion.div
              key="wrapped"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <GymWrapped logs={logs} />
            </motion.div>
          )}
          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Settings setShowOnboarding={setShowOnboarding} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AddExerciseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        plans={plans}
      />

      {/* Bottom Navigation (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0f172a]/95 backdrop-blur-xl border-t border-[#FF0050]/30 pb-safe">
        <div className="flex justify-around items-center px-2 py-2">
          <button
            onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
            className={`flex flex-col items-center justify-center w-16 gap-1 ${activeTab === 'dashboard' && !isMobileMenuOpen ? 'text-[#1d7a82] text-glow-teal' : 'text-slate-400 hover:text-white'}`}
          >
            <Activity className="w-6 h-6" />
            <span className="text-[10px] font-medium">{t('dashboard')}</span>
          </button>
          <button
            onClick={() => { setActiveTab('today'); setIsMobileMenuOpen(false); }}
            className={`flex flex-col items-center justify-center w-16 gap-1 ${activeTab === 'today' && !isMobileMenuOpen ? 'text-[#1d7a82] text-glow-teal' : 'text-slate-400 hover:text-white'}`}
          >
            <Sun className="w-6 h-6" />
            <span className="text-[10px] font-medium">{t('today')}</span>
          </button>
          <button
            onClick={() => { setActiveTab('chat'); setIsMobileMenuOpen(false); }}
            className={`flex flex-col items-center justify-center w-16 gap-1 ${activeTab === 'chat' && !isMobileMenuOpen ? 'text-[#1d7a82] text-glow-teal' : 'text-slate-400 hover:text-white'}`}
          >
            <MessageSquare className="w-6 h-6" />
            <span className="text-[10px] font-medium">{t('aiCoach')}</span>
          </button>
          <button
            onClick={() => { setActiveTab('nutrition'); setIsMobileMenuOpen(false); }}
            className={`flex flex-col items-center justify-center w-16 gap-1 ${activeTab === 'nutrition' && !isMobileMenuOpen ? 'text-[#1d7a82] text-glow-teal' : 'text-slate-400 hover:text-white'}`}
          >
            <Utensils className="w-6 h-6" />
            <span className="text-[10px] font-medium">{t('nutrition')}</span>
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`flex flex-col items-center justify-center w-16 gap-1 ${isMobileMenuOpen ? 'text-[#FF0050] text-glow-pink' : 'text-slate-400 hover:text-white'}`}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            <span className="text-[10px] font-medium">{t('more')}</span>
          </button>
        </div>
      </nav>

      {/* Mobile More Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="md:hidden fixed bottom-[72px] left-0 right-0 z-30 bg-[#1e293b] border-t border-[#1d7a82]/30 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] overflow-hidden pb-safe"
            >
              <div className="p-6">
                <h3 className="text-lg font-bold text-white mb-4 text-glow-teal">{t('moreFunctions')}</h3>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={() => { setActiveTab('weeklyPlan'); setIsMobileMenuOpen(false); }}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl gap-2 transition-all ${activeTab === 'weeklyPlan' ? 'bg-[#1d7a82]/20 text-[#1d7a82] border border-[#1d7a82]/50 shadow-[0_0_15px_rgba(29,122,130,0.2)]' : 'bg-black/20 text-slate-300 border border-white/5 hover:bg-white/5'}`}
                  >
                    <Calendar className="w-6 h-6" />
                    <span className="text-xs font-medium">{t('weeklyPlan')}</span>
                  </button>
                  <button
                    onClick={() => { setActiveTab('history'); setIsMobileMenuOpen(false); }}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl gap-2 transition-all ${activeTab === 'history' ? 'bg-[#1d7a82]/20 text-[#1d7a82] border border-[#1d7a82]/50 shadow-[0_0_15px_rgba(29,122,130,0.2)]' : 'bg-black/20 text-slate-300 border border-white/5 hover:bg-white/5'}`}
                  >
                    <HistoryIcon className="w-6 h-6" />
                    <span className="text-xs font-medium">{t('history')}</span>
                  </button>
                  <button
                    onClick={() => { setActiveTab('analytics'); setIsMobileMenuOpen(false); }}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl gap-2 transition-all ${activeTab === 'analytics' ? 'bg-[#1d7a82]/20 text-[#1d7a82] border border-[#1d7a82]/50 shadow-[0_0_15px_rgba(29,122,130,0.2)]' : 'bg-black/20 text-slate-300 border border-white/5 hover:bg-white/5'}`}
                  >
                    <BarChart2 className="w-6 h-6" />
                    <span className="text-xs font-medium">{t('analytics')}</span>
                  </button>
                  <button
                    onClick={() => { setActiveTab('library'); setIsMobileMenuOpen(false); }}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl gap-2 transition-all ${activeTab === 'library' ? 'bg-[#1d7a82]/20 text-[#1d7a82] border border-[#1d7a82]/50 shadow-[0_0_15px_rgba(29,122,130,0.2)]' : 'bg-black/20 text-slate-300 border border-white/5 hover:bg-white/5'}`}
                  >
                    <Database className="w-6 h-6" />
                    <span className="text-xs font-medium">{t('library')}</span>
                  </button>
                  <button
                    onClick={() => { setActiveTab('friends'); setIsMobileMenuOpen(false); }}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl gap-2 transition-all ${activeTab === 'friends' ? 'bg-[#1d7a82]/20 text-[#1d7a82] border border-[#1d7a82]/50 shadow-[0_0_15px_rgba(29,122,130,0.2)]' : 'bg-black/20 text-slate-300 border border-white/5 hover:bg-white/5'}`}
                  >
                    <Users className="w-6 h-6" />
                    <span className="text-xs font-medium">{t('friends')}</span>
                  </button>
                  <button
                    onClick={() => { setActiveTab('wrapped'); setIsMobileMenuOpen(false); }}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl gap-2 transition-all ${activeTab === 'wrapped' ? 'bg-[#FF0050]/20 text-[#FF0050] border border-[#FF0050]/50 shadow-[0_0_15px_rgba(255,0,80,0.2)]' : 'bg-black/20 text-slate-300 border border-white/5 hover:bg-white/5'}`}
                  >
                    <Gift className="w-6 h-6" />
                    <span className="text-xs font-medium">{t('wrapped')}</span>
                  </button>
                  <button
                    onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl gap-2 transition-all ${activeTab === 'settings' ? 'bg-[#1d7a82]/20 text-[#1d7a82] border border-[#1d7a82]/50 shadow-[0_0_15px_rgba(29,122,130,0.2)]' : 'bg-black/20 text-slate-300 border border-white/5 hover:bg-white/5'}`}
                  >
                    <SettingsIcon className="w-6 h-6" />
                    <span className="text-xs font-medium">{t('settings')}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
    </>
  );
}

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  collapsed: boolean;
}

function SidebarItem({ icon, label, active, onClick, collapsed }: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
        active 
          ? 'bg-[#1d7a82]/20 text-[#1d7a82] border border-[#1d7a82]/30 shadow-[0_0_15px_rgba(29,122,130,0.1)]' 
          : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
      }`}
    >
      <div className={`transition-all duration-200 ${active ? 'text-glow-teal' : 'group-hover:scale-110'}`}>
        {icon}
      </div>
      {!collapsed && (
        <span className={`text-sm font-medium transition-all duration-200 ${active ? 'text-white' : ''}`}>
          {label}
        </span>
      )}
      {active && !collapsed && (
        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#1d7a82] shadow-[0_0_8px_rgba(29,122,130,0.8)]" />
      )}
    </button>
  );
}

export default App;

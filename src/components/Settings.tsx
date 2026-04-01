import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings as SettingsIcon, Moon, Sun, Globe, User, LogOut, Check, X, Languages, Trash2, Zap } from 'lucide-react';
import { auth } from '../firebase';
import { logout } from '../firebase';
import { UserProfile } from '../types';
import { updateUserProfile, checkUsernameAvailability, getUserProfile, deleteAccount } from '../utils/storage';
import { useLanguage } from '../contexts/LanguageContext';

interface SettingsProps {
  setShowOnboarding?: (show: boolean) => void;
}

export default function Settings({ setShowOnboarding }: SettingsProps) {
  const { t, language, setLanguage } = useLanguage();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<'username' | 'account' | null>(null);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [timezone, setTimezone] = useState<string>(Intl.DateTimeFormat().resolvedOptions().timeZone);
  
  const timezones = Intl.supportedValuesOf ? Intl.supportedValuesOf('timeZone') : [timezone];

  useEffect(() => {
    const loadProfile = async () => {
      if (auth.currentUser) {
        try {
          const userProfile = await getUserProfile(auth.currentUser.uid);
          if (userProfile) {
            setProfile(userProfile);
            setNewUsername(userProfile.username || '');
            if (userProfile.theme) setTheme(userProfile.theme);
            if (userProfile.timezone) setTimezone(userProfile.timezone);
          }
        } catch (error) {
          console.error("Error loading profile", error);
        }
      }
    };
    loadProfile();
  }, []);

  // Apply theme to document
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }
  }, [theme]);

  const handleSaveUsername = async () => {
    if (newUsername === profile?.username) {
      setIsEditingUsername(false);
      return;
    }

    if (newUsername.length < 3 || newUsername.length > 30) {
      setUsernameError(t('usernameErrorLength'));
      return;
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(newUsername)) {
      setUsernameError(t('usernameErrorChars'));
      return;
    }

    setIsSavingUsername(true);
    setUsernameError('');

    try {
      const isAvailable = await checkUsernameAvailability(newUsername);
      if (!isAvailable) {
        setUsernameError(t('usernameErrorTaken'));
        setIsSavingUsername(false);
        return;
      }

      await updateUserProfile({ username: newUsername });
      setProfile(prev => prev ? { ...prev, username: newUsername } : null);
      setIsEditingUsername(false);
    } catch (err) {
      setUsernameError(t('saveError'));
    } finally {
      setIsSavingUsername(false);
    }
  };

  const handleDeleteUsername = async () => {
    setIsSavingUsername(true);
    try {
      await updateUserProfile({ username: '', searchableUsername: '' });
      setProfile(prev => prev ? { ...prev, username: '' } : null);
      setNewUsername('');
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting username:', error);
    } finally {
      setIsSavingUsername(false);
    }
  };

  const handleDeleteAccount = async () => {
    setShowDeleteConfirm(null);
    setIsDeletingAccount(true);
    
    try {
      await deleteAccount();
      // Auth state listener will handle redirection
    } catch (error: any) {
      setIsDeletingAccount(false);
      if (error.message === 'REAUTH_CANCELLED') {
        // User cancelled re-auth, just stop
        return;
      }
      
      console.error('Error deleting account:', error);
      if (error.message === 'REAUTH_REQUIRED') {
        alert(t('reauthRequired'));
      } else {
        alert(t('saveError'));
      }
    }
  };

  const handleThemeChange = async (newTheme: 'dark' | 'light') => {
    setTheme(newTheme);
    await updateUserProfile({ theme: newTheme });
  };

  const handleTimezoneChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTz = e.target.value;
    setTimezone(newTz);
    localStorage.setItem('gym_timezone', newTz);
    await updateUserProfile({ timezone: newTz });
  };

  const handleRepeatTutorial = async () => {
    if (setShowOnboarding) {
      await updateUserProfile({ hasCompletedOnboarding: false });
      setShowOnboarding(true);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-[#1d7a82]/20 flex items-center justify-center border border-[#1d7a82]/30 glow-teal">
          <SettingsIcon className="w-5 h-5 text-[#1d7a82]" />
        </div>
        <h2 className="text-2xl font-bold text-white text-glow-teal">{t('settings')}</h2>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm space-y-8">
        
        {/* Profile Section */}
        <section>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 border-b border-white/10 pb-2">
            <User className="w-5 h-5 text-[#FF0050]" />
            {t('profile')}
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">{t('username')}</label>
              {isEditingUsername ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#1d7a82] transition-all"
                      placeholder={t('username')}
                    />
                    <button
                      onClick={handleSaveUsername}
                      disabled={isSavingUsername}
                      className="bg-[#1d7a82] hover:bg-[#155e63] text-white p-2 rounded-xl transition-all disabled:opacity-50"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingUsername(false);
                        setNewUsername(profile?.username || '');
                        setUsernameError('');
                      }}
                      className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-xl transition-all"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  {usernameError && <p className="text-[#FF0050] text-sm">{usernameError}</p>}
                  <p className="text-xs text-slate-500">{t('usernameTakenInfo')}</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between bg-black/20 border border-white/5 rounded-xl p-3">
                    <span className="text-white font-medium">
                      {profile?.username ? `@${profile.username}` : t('loading')}
                    </span>
                    <button
                      onClick={() => setIsEditingUsername(true)}
                      className="text-sm text-[#1d7a82] hover:text-white transition-colors"
                    >
                      {t('edit')}
                    </button>
                  </div>
                  {profile?.username && (
                    <button
                      onClick={() => setShowDeleteConfirm('username')}
                      className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors self-start px-1"
                    >
                      <Trash2 className="w-3 h-3" /> {t('deleteUsername')}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Preferences Section */}
        <section>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 border-b border-white/10 pb-2">
            <Globe className="w-5 h-5 text-[#1d7a82]" />
            {t('preferences')}
          </h3>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">{t('language')}</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setLanguage('de')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${language === 'de' ? 'bg-[#1d7a82]/20 border-[#1d7a82] text-white glow-teal' : 'bg-black/20 border-white/5 text-slate-400 hover:bg-white/5'}`}
                >
                  <Languages className="w-4 h-4" /> Deutsch
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${language === 'en' ? 'bg-[#1d7a82]/20 border-[#1d7a82] text-white glow-teal' : 'bg-black/20 border-white/5 text-slate-400 hover:bg-white/5'}`}
                >
                  <Languages className="w-4 h-4" /> English
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">{t('theme')}</label>
              <div className="flex gap-2">
                <button
                  onClick={() => handleThemeChange('dark')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${theme === 'dark' ? 'bg-[#1d7a82]/20 border-[#1d7a82] text-white glow-teal' : 'bg-black/20 border-white/5 text-slate-400 hover:bg-white/5'}`}
                >
                  <Moon className="w-4 h-4" /> {t('dark')}
                </button>
                <button
                  onClick={() => handleThemeChange('light')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${theme === 'light' ? 'bg-white text-slate-900 border-white shadow-[0_0_15px_rgba(255,255,255,0.5)]' : 'bg-black/20 border-white/5 text-slate-400 hover:bg-white/5'}`}
                >
                  <Sun className="w-4 h-4" /> {t('light')}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">{t('timezone')}</label>
              <select
                value={timezone}
                onChange={handleTimezoneChange}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#1d7a82] transition-all appearance-none"
              >
                {timezones.map(tz => (
                  <option key={tz} value={tz} className="bg-[#1e293b]">{tz}</option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-2">{t('timezoneInfo')}</p>
            </div>

            <div className="pt-4 border-t border-white/10">
              <button
                onClick={handleRepeatTutorial}
                className="w-full flex items-center justify-center gap-2 bg-[#1d7a82]/10 hover:bg-[#1d7a82]/20 text-[#1d7a82] border border-[#1d7a82]/30 py-3 rounded-xl font-medium transition-all"
              >
                <Zap className="w-4 h-4 fill-current" />
                {t('repeatTutorial' as any)}
              </button>
            </div>
          </div>
        </section>

        {/* Account Section */}
        <section>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 border-b border-white/10 pb-2">
            <LogOut className="w-5 h-5 text-slate-400" />
            {t('account')}
          </h3>
          
          <div className="space-y-3">
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 py-3 rounded-xl font-medium transition-all"
            >
              <LogOut className="w-5 h-5" />
              {t('logout')}
            </button>
            <button
              onClick={() => setShowDeleteConfirm('account')}
              className="w-full flex items-center justify-center gap-2 bg-[#FF0050]/10 hover:bg-[#FF0050]/20 text-[#FF0050] border border-[#FF0050]/30 py-3 rounded-xl font-medium transition-all"
            >
              <Trash2 className="w-5 h-5" />
              {t('deleteAccount')}
            </button>
          </div>
        </section>

      </div>

      {/* Confirmation Modals */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-[#1e293b] border border-red-500/30 shadow-[0_0_30px_rgba(255,0,0,0.15)] rounded-2xl z-[70] p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-red-500" />
                  {showDeleteConfirm === 'username' ? t('deleteUsername') : t('deleteAccount')}
                </h3>
                <button onClick={() => setShowDeleteConfirm(null)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-slate-400 mb-6">
                {showDeleteConfirm === 'username' ? t('deleteUsernameConfirm') : t('deleteAccountConfirm')}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl font-medium bg-white/10 text-white hover:bg-white/20 transition-all"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={showDeleteConfirm === 'username' ? handleDeleteUsername : handleDeleteAccount}
                  className="flex-1 px-4 py-2.5 rounded-xl font-medium bg-red-500 text-white hover:bg-red-600 transition-all glow-red"
                >
                  {t('delete')}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* Deleting Overlay */}
      <AnimatePresence>
        {isDeletingAccount && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden"
          >
            {/* Glitchy background elements */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: Math.random() * window.innerWidth, 
                  y: Math.random() * window.innerHeight,
                  width: Math.random() * 100 + 50,
                  height: 2,
                  opacity: 0,
                  backgroundColor: i % 2 === 0 ? '#1d7a82' : '#FF0050'
                }}
                animate={{ 
                  opacity: [0, 0.8, 0],
                  x: (Math.random() - 0.5) * 200 + (Math.random() * window.innerWidth),
                  scaleX: [1, 2, 1]
                }}
                transition={{ 
                  duration: 0.2, 
                  repeat: Infinity, 
                  delay: Math.random() * 2,
                  ease: "linear"
                }}
                className="absolute"
              />
            ))}

            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: [0.8, 1.1, 0],
                opacity: [0, 1, 0],
                filter: ["blur(0px)", "blur(10px)", "blur(40px)"]
              }}
              transition={{ duration: 2, times: [0, 0.5, 1] }}
              className="relative z-10 text-center"
            >
              <h2 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase italic">
                System <span className="text-[#FF0050]">Purge</span>
              </h2>
              <p className="text-[#1d7a82] font-mono text-sm tracking-widest animate-pulse">
                DELETING_ALL_DATA...
              </p>
            </motion.div>

            {/* Exploding particles */}
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={`p-${i}`}
                initial={{ x: 0, y: 0, width: 4, height: 4, opacity: 1 }}
                animate={{ 
                  x: (Math.random() - 0.5) * 1000, 
                  y: (Math.random() - 0.5) * 1000,
                  opacity: 0,
                  rotate: Math.random() * 360
                }}
                transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                className="absolute bg-white rounded-sm"
              />
            ))}

            {/* Laser Scan Line */}
            <motion.div
              initial={{ top: '-10%' }}
              animate={{ top: '110%' }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="absolute left-0 right-0 h-2 bg-[#FF0050] shadow-[0_0_30px_10px_rgba(255,0,80,0.8)] z-50 pointer-events-none"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

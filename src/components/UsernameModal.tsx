import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Check } from 'lucide-react';
import { updateUserProfile, checkUsernameAvailability } from '../utils/storage';
import { auth } from '../firebase';

interface UsernameModalProps {
  onComplete: () => void;
}

export const UsernameModal: React.FC<UsernameModalProps> = ({ onComplete }) => {
  const [username, setUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.length < 3 || username.length > 30) {
      setError('Benutzername muss zwischen 3 und 30 Zeichen lang sein.');
      return;
    }
    
    // Basic validation for alphanumeric
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Nur Buchstaben, Zahlen und Unterstriche erlaubt.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const isAvailable = await checkUsernameAvailability(username);
      if (!isAvailable) {
        setError('Dieser Benutzername ist bereits vergeben.');
        setIsSubmitting(false);
        return;
      }

      await updateUserProfile({
        username,
        displayName: auth.currentUser?.displayName || undefined,
        photoURL: auth.currentUser?.photoURL || undefined,
      });
      onComplete();
    } catch (err) {
      setError('Fehler beim Speichern. Bitte versuche es erneut.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#1e293b] border border-[#1d7a82]/50 shadow-[0_0_30px_rgba(29,122,130,0.2)] rounded-2xl z-50 overflow-hidden"
      >
        <div className="p-6">
          <div className="flex justify-center mb-6">
            <div className="bg-[#1d7a82]/20 p-4 rounded-full glow-teal">
              <User className="w-10 h-10 text-[#1d7a82]" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-white text-center mb-2 text-glow-teal">Willkommen!</h2>
          <p className="text-slate-400 text-center mb-6">
            Bitte wähle einen Benutzernamen, damit deine Freunde dich finden können.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Benutzername</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="z.B. max_mustermann"
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 outline-none focus:border-glow-teal transition-all"
                required
                minLength={3}
                maxLength={30}
              />
              {error && <p className="text-[#FF0050] text-sm mt-2">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || username.length < 3}
              className="w-full flex items-center justify-center gap-2 bg-[#1d7a82] hover:bg-[#155e63] disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-medium transition-all hover:glow-teal"
            >
              {isSubmitting ? 'Speichern...' : <><Check className="w-5 h-5" /> Bestätigen</>}
            </button>
          </form>
        </div>
      </motion.div>
    </>
  );
};

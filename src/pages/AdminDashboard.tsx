import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { VIP_EMAILS, PRO_EMAILS } from '../constants/userPermissions';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Crown, CreditCard, ShieldCheck, Search, Mail, Calendar, Trash2, AlertTriangle, UserPlus } from 'lucide-react';

interface UserEntry {
  email: string;
  source: 'Hardcoded' | 'Firestore';
  createdAt?: string;
  uid?: string;
  collection: 'vip' | 'pro_users';
  planType?: 'individual' | 'family' | 'family_member';
}

export const AdminDashboard: React.FC = () => {
  const [vips, setVips] = useState<UserEntry[]>([]);
  const [pros, setPros] = useState<UserEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRevoking, setIsRevoking] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newType, setNewType] = useState<'vip' | 'pro_users'>('pro_users');
  const [proPlanType, setProPlanType] = useState<'individual' | 'family'>('individual');
  const [userToRevoke, setUserToRevoke] = useState<UserEntry | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // 1. Fetch VIPs from Firestore
      const vipSnap = await getDocs(collection(db, 'vip'));
      const firestoreVips: UserEntry[] = vipSnap.docs.map(doc => ({
        email: doc.data().email || doc.id,
        source: 'Firestore',
        createdAt: doc.data().createdAt,
        collection: 'vip'
      }));

      // Combine with hardcoded VIPs
      const allVips = [
        ...VIP_EMAILS.map(email => ({ email, source: 'Hardcoded' as const, collection: 'vip' as const })),
        ...firestoreVips.filter(fv => !VIP_EMAILS.includes(fv.email))
      ];
      setVips(allVips);

      // 2. Fetch PROs from Firestore
      const proSnap = await getDocs(query(collection(db, 'pro_users'), orderBy('createdAt', 'desc')));
      const firestorePros: UserEntry[] = proSnap.docs.map(doc => ({
        email: doc.data().email || 'Unknown',
        source: 'Firestore',
        createdAt: doc.data().createdAt,
        uid: doc.id,
        collection: 'pro_users',
        planType: doc.data().planType
      }));

      // Combine with hardcoded PROs
      const allPros = [
        ...PRO_EMAILS.map(email => ({ email, source: 'Hardcoded' as const, collection: 'pro_users' as const, planType: 'individual' as const })),
        ...firestorePros.filter(fp => !PRO_EMAILS.includes(fp.email))
      ];
      setPros(allPros);

    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;
    setIsAdding(true);
    try {
      if (newType === 'vip') {
        await setDoc(doc(db, 'vip', newEmail), {
          email: newEmail,
          active: true,
          createdAt: new Date().toISOString()
        }, { merge: true });
      } else {
        // For PRO, we store by email if we don't have UID
        await setDoc(doc(db, 'pro_users', newEmail), {
          email: newEmail,
          active: true,
          createdAt: new Date().toISOString(),
          manualGrant: true,
          planType: proPlanType
        }, { merge: true });
      }
      setNewEmail('');
      await fetchUsers();
    } catch (error: any) {
      console.error('Error granting status:', error);
      setAlertMessage(`Failed to grant status: ${error.message}`);
    } finally {
      setIsAdding(false);
    }
  };

  const handleRevoke = (user: UserEntry) => {
    if (user.source === 'Hardcoded') {
      setAlertMessage('This user is hardcoded in the source code. To remove them, you must edit the "userPermissions.ts" file.');
      return;
    }
    setUserToRevoke(user);
  };

  const confirmRevoke = async () => {
    if (!userToRevoke) return;
    const user = userToRevoke;
    
    setIsRevoking(user.email);
    setUserToRevoke(null);
    try {
      // For VIP, the ID is the email. For PRO, the ID is the UID or email.
      const docId = user.collection === 'vip' ? user.email : (user.uid || user.email);
      if (docId) {
        await deleteDoc(doc(db, user.collection, docId));
      }

      // Robust cleanup: also try to delete by email from both collections to catch manual grants
      if (user.email) {
        try { await deleteDoc(doc(db, 'pro_users', user.email)); } catch (e) {}
        try { await deleteDoc(doc(db, 'vip', user.email)); } catch (e) {}
      }

      await fetchUsers(); // Refresh the list
    } catch (error: any) {
      console.error('Error revoking status:', error);
      setAlertMessage(`Failed to revoke status: ${error.message}`);
    } finally {
      setIsRevoking(null);
    }
  };

  const filteredVips = vips.filter(u => u.email.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredPros = pros.filter(u => u.email.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF0050]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white p-6 md:p-12 pb-32">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tighter mb-2 flex items-center gap-3">
              <ShieldCheck className="text-[#FF0050] w-10 h-10" />
              ADMIN PANEL
            </h1>
            <p className="text-slate-400 font-medium">Manage your VIP and PRO community</p>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-[#FF0050] transition-colors" />
              <input
                type="text"
                placeholder="Search by email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-6 w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-[#FF0050]/50 transition-all"
              />
            </div>
          </div>
        </header>

        {/* GRANT STATUS FORM */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 rounded-[32px] border border-white/10 p-8 mb-12"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#1d7a82]/20 flex items-center justify-center">
              <UserPlus className="text-[#1d7a82] w-6 h-6" />
            </div>
            <h2 className="font-bold text-xl">Grant Status</h2>
          </div>

          <form onSubmit={handleGrant} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="email"
                placeholder="Enter user email..."
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
                className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-[#1d7a82] transition-all"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setNewType('pro_users')}
                className={`px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
                  newType === 'pro_users' ? 'bg-[#FF0050] text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                PRO
              </button>
              <button
                type="button"
                onClick={() => setNewType('vip')}
                className={`px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
                  newType === 'vip' ? 'bg-amber-500 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                VIP
              </button>
            </div>
            {newType === 'pro_users' && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setProPlanType('individual')}
                  className={`px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
                    proPlanType === 'individual' ? 'bg-white/20 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  Individual
                </button>
                <button
                  type="button"
                  onClick={() => setProPlanType('family')}
                  className={`px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
                    proPlanType === 'family' ? 'bg-white/20 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  Family
                </button>
              </div>
            )}
            <button
              type="submit"
              disabled={isAdding}
              className="bg-[#1d7a82] hover:bg-[#155e63] text-white px-8 py-3 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isAdding ? 'Granting...' : 'Grant Status'}
            </button>
          </form>
        </motion.section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* VIP LIST */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 rounded-[32px] border border-white/10 overflow-hidden"
          >
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-amber-500/10 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Crown className="text-amber-500 w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-bold text-xl">VIP Users</h2>
                  <p className="text-xs text-slate-400">{vips.length} total members</p>
                </div>
              </div>
            </div>

            <div className="max-h-[600px] overflow-y-auto">
              {filteredVips.length > 0 ? (
                <table className="w-full text-left">
                  <thead className="text-xs text-slate-500 uppercase tracking-widest bg-black/20">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Email</th>
                      <th className="px-6 py-4 font-semibold">Source</th>
                      <th className="px-6 py-4 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredVips.map((user, idx) => (
                      <tr key={idx} className="hover:bg-white/5 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Mail className="w-4 h-4 text-slate-500" />
                            <span className="font-medium">{user.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider ${
                            user.source === 'Hardcoded' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                          }`}>
                            {user.source}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {user.source !== 'Hardcoded' && (
                            <button
                              onClick={() => handleRevoke(user)}
                              disabled={isRevoking === user.email}
                              className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-50"
                              title="Revoke VIP Status"
                            >
                              {isRevoking === user.email ? (
                                <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-12 text-center text-slate-500">No VIPs found</div>
              )}
            </div>
          </motion.section>

          {/* PRO LIST */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 rounded-[32px] border border-white/10 overflow-hidden"
          >
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-[#FF0050]/10 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FF0050]/20 flex items-center justify-center">
                  <CreditCard className="text-[#FF0050] w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-bold text-xl">PRO Users</h2>
                  <p className="text-xs text-slate-400">{pros.length} total members</p>
                </div>
              </div>
            </div>

            <div className="max-h-[600px] overflow-y-auto">
              {filteredPros.length > 0 ? (
                <table className="w-full text-left">
                  <thead className="text-xs text-slate-500 uppercase tracking-widest bg-black/20">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Email</th>
                      <th className="px-6 py-4 font-semibold">Plan</th>
                      <th className="px-6 py-4 font-semibold">Date</th>
                      <th className="px-6 py-4 font-semibold">Source</th>
                      <th className="px-6 py-4 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredPros.map((user, idx) => (
                      <tr key={idx} className="hover:bg-white/5 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Mail className="w-4 h-4 text-slate-500" />
                            <span className="font-medium">{user.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider ${
                            user.planType === 'family' ? 'bg-blue-500/20 text-blue-400' : 
                            user.planType === 'family_member' ? 'bg-indigo-500/20 text-indigo-400' : 
                            'bg-slate-500/20 text-slate-400'
                          }`}>
                            {user.planType || 'individual'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-slate-400 text-xs">
                            <Calendar className="w-3 h-3" />
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider ${
                            user.source === 'Hardcoded' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'
                          }`}>
                            {user.source === 'Hardcoded' ? 'Hardcoded' : 'Purchase'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {user.source !== 'Hardcoded' && (
                            <button
                              onClick={() => handleRevoke(user)}
                              disabled={isRevoking === user.email}
                              className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-50"
                              title="Revoke PRO Status"
                            >
                              {isRevoking === user.email ? (
                                <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-12 text-center text-slate-500">No PROs found</div>
              )}
            </div>
          </motion.section>
        </div>
      </div>

      {/* Revoke Confirmation Modal */}
      <AnimatePresence>
        {userToRevoke && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#1e293b] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center gap-4 mb-6 text-red-500">
                <div className="p-3 bg-red-500/10 rounded-full">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white">Revoke Access</h3>
              </div>
              <p className="text-slate-300 mb-6">
                Are you sure you want to revoke <span className="font-bold text-white">{userToRevoke.collection === 'vip' ? 'VIP' : 'PRO'}</span> status for <span className="font-bold text-white">{userToRevoke.email}</span>? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setUserToRevoke(null)}
                  className="px-4 py-2 rounded-lg font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRevoke}
                  className="px-4 py-2 rounded-lg font-bold bg-red-500 hover:bg-red-600 text-white transition-colors"
                >
                  Yes, Revoke Access
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Alert Modal */}
      <AnimatePresence>
        {alertMessage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#1e293b] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center gap-4 mb-6 text-blue-500">
                <div className="p-3 bg-blue-500/10 rounded-full">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white">Notice</h3>
              </div>
              <p className="text-slate-300 mb-6">{alertMessage}</p>
              <div className="flex justify-end">
                <button
                  onClick={() => setAlertMessage(null)}
                  className="px-4 py-2 rounded-lg font-bold bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                >
                  OK
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

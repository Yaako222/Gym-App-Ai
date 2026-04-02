import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { VIP_EMAILS, PRO_EMAILS } from '../constants/userPermissions';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Crown, CreditCard, ShieldCheck, Search, Mail, Calendar, Trash2, AlertTriangle } from 'lucide-react';

interface UserEntry {
  email: string;
  source: 'Hardcoded' | 'Firestore';
  createdAt?: string;
  uid?: string;
  collection: 'vip' | 'pro_users';
}

export const AdminDashboard: React.FC = () => {
  const [vips, setVips] = useState<UserEntry[]>([]);
  const [pros, setPros] = useState<UserEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRevoking, setIsRevoking] = useState<string | null>(null);

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
        collection: 'pro_users'
      }));

      // Combine with hardcoded PROs
      const allPros = [
        ...PRO_EMAILS.map(email => ({ email, source: 'Hardcoded' as const, collection: 'pro_users' as const })),
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

  const handleRevoke = async (user: UserEntry) => {
    if (user.source === 'Hardcoded') {
      alert('This user is hardcoded in the source code. To remove them, you must edit the "userPermissions.ts" file.');
      return;
    }

    if (!window.confirm(`Are you sure you want to revoke status for ${user.email}?`)) return;

    setIsRevoking(user.email);
    try {
      // For VIP, the ID is the email. For PRO, the ID is the UID.
      const docId = user.collection === 'vip' ? user.email : user.uid;
      if (docId) {
        await deleteDoc(doc(db, user.collection, docId));
        await fetchUsers(); // Refresh the list
      }
    } catch (error) {
      console.error('Error revoking status:', error);
      alert('Failed to revoke status. Check console for details.');
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
    <div className="min-h-screen bg-[#0A0A0B] text-white p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tighter mb-2 flex items-center gap-3">
              <ShieldCheck className="text-[#FF0050] w-10 h-10" />
              ADMIN PANEL
            </h1>
            <p className="text-slate-400 font-medium">Manage your VIP and PRO community</p>
          </div>

          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-[#FF0050] transition-colors" />
            <input
              type="text"
              placeholder="Search by email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-6 w-full md:w-80 focus:outline-none focus:ring-2 focus:ring-[#FF0050]/50 transition-all"
            />
          </div>
        </header>

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
    </div>
  );
};

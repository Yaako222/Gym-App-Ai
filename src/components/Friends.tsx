import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, UserPlus, UserCheck, Clock, Activity, Hash, Footprints, Trash2, BarChart2, Calendar } from 'lucide-react';
import { auth, db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { UserProfile, Friendship, ExerciseLog } from '../types';
import { searchUsersByUsername, sendFriendRequest, acceptFriendRequest, getUserProfile, removeFriend } from '../utils/storage';
import { getCurrentDate, formatDate } from '../utils/time';
import Analytics from './Analytics';

export const Friends: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [friendsProfiles, setFriendsProfiles] = useState<Record<string, UserProfile>>({});
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [friendLogs, setFriendLogs] = useState<ExerciseLog[]>([]);
  const [friendTab, setFriendTab] = useState<'7days' | 'analytics'>('7days');
  const [friendToRemove, setFriendToRemove] = useState<{id: string, isSelected: boolean} | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;
    const userId = auth.currentUser.uid;

    const q1 = query(collection(db, 'friendships'), where('user1', '==', userId));
    const q2 = query(collection(db, 'friendships'), where('user2', '==', userId));

    const unsubscribe1 = onSnapshot(q1, (snapshot) => {
      const f1 = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Friendship));
      setFriendships(prev => {
        const others = prev.filter(f => f.user1 !== userId);
        return [...others, ...f1];
      });
    });

    const unsubscribe2 = onSnapshot(q2, (snapshot) => {
      const f2 = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Friendship));
      setFriendships(prev => {
        const others = prev.filter(f => f.user2 !== userId);
        return [...others, ...f2];
      });
    });

    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }, []);

  useEffect(() => {
    const fetchProfiles = async () => {
      if (!auth.currentUser) return;
      const userId = auth.currentUser.uid;
      const profiles: Record<string, UserProfile> = {};
      
      for (const f of friendships) {
        const friendId = f.user1 === userId ? f.user2 : f.user1;
        if (!friendsProfiles[friendId]) {
          const profile = await getUserProfile(friendId);
          if (profile) {
            profiles[friendId] = profile;
          }
        }
      }
      
      if (Object.keys(profiles).length > 0) {
        setFriendsProfiles(prev => ({ ...prev, ...profiles }));
      }
    };
    
    fetchProfiles();
  }, [friendships]);

  useEffect(() => {
    if (!selectedFriend) {
      setFriendLogs([]);
      return;
    }

    const q = query(
      collection(db, `users/${selectedFriend}/logs`)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExerciseLog));
      setFriendLogs(logsData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    });

    return () => unsubscribe();
  }, [selectedFriend]);

  const handleSearch = async () => {
    if (searchQuery.length < 3) return;
    const results = await searchUsersByUsername(searchQuery);
    setSearchResults(results.filter(u => u.uid !== auth.currentUser?.uid));
  };

  const currentUserId = auth.currentUser?.uid;

  const pendingRequests = friendships.filter(f => f.status === 'pending' && f.user2 === currentUserId);
  const acceptedFriends = friendships.filter(f => f.status === 'accepted');

  const sevenDaysAgo = getCurrentDate();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentLogs = friendLogs.filter(log => new Date(log.date) >= sevenDaysAgo);

  const groupedFriendLogs = recentLogs.reduce((acc, log) => {
    const date = formatDate(log.date, { weekday: 'short', day: '2-digit', month: '2-digit' });
    if (!acc[date]) acc[date] = {};
    if (!acc[date][log.muscleGroup]) acc[date][log.muscleGroup] = [];
    acc[date][log.muscleGroup].push(log);
    return acc;
  }, {} as Record<string, Record<string, ExerciseLog[]>>);

  return (
    <div className="space-y-8 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white text-glow-teal">Freunde</h1>
      </div>

      <div className="bg-[#1e293b] rounded-2xl p-6 border border-[#1d7a82]/30 shadow-[0_0_20px_rgba(29,122,130,0.1)]">
        <h2 className="text-lg font-semibold text-white mb-4">Freunde finden</h2>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Benutzername suchen..."
              className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-slate-500 outline-none focus:border-glow-teal transition-all"
            />
          </div>
          <button
            onClick={handleSearch}
            className="bg-[#1d7a82] hover:bg-[#155e63] text-white px-6 rounded-xl font-medium transition-all hover:glow-teal"
          >
            Suchen
          </button>
        </div>

        {searchResults.length > 0 && (
          <div className="mt-6 space-y-3">
            {searchResults.map(user => {
              const existingFriendship = friendships.find(f => f.user1 === user.uid || f.user2 === user.uid);
              
              return (
                <div key={user.uid} className="flex items-center justify-between bg-black/20 p-4 rounded-xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#1d7a82]/20 flex items-center justify-center text-[#1d7a82] font-bold">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-white font-medium">{user.displayName || user.username}</div>
                      <div className="text-sm text-slate-400">@{user.username}</div>
                    </div>
                  </div>
                  
                  {!existingFriendship ? (
                    <button
                      onClick={() => sendFriendRequest(user.uid)}
                      className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm transition-all"
                    >
                      <UserPlus className="w-4 h-4" /> Hinzufügen
                    </button>
                  ) : existingFriendship.status === 'pending' ? (
                    <span className="text-sm text-slate-400 bg-white/5 px-3 py-1 rounded-lg">Ausstehend</span>
                  ) : (
                    <span className="text-sm text-[#1d7a82] bg-[#1d7a82]/10 px-3 py-1 rounded-lg flex items-center gap-1">
                      <UserCheck className="w-4 h-4" /> Befreundet
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {pendingRequests.length > 0 && (
        <div className="bg-[#1e293b] rounded-2xl p-6 border border-[#FF0050]/30 shadow-[0_0_20px_rgba(255,0,80,0.1)]">
          <h2 className="text-lg font-semibold text-white mb-4 text-glow-pink">Freundschaftsanfragen</h2>
          <div className="space-y-3">
            {pendingRequests.map(req => {
              const profile = friendsProfiles[req.user1];
              if (!profile) return null;
              
              return (
                <div key={req.id} className="flex items-center justify-between bg-black/20 p-4 rounded-xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#FF0050]/20 flex items-center justify-center text-[#FF0050] font-bold">
                      {profile.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-white font-medium">{profile.displayName || profile.username}</div>
                      <div className="text-sm text-slate-400">@{profile.username}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => acceptFriendRequest(req.id)}
                    className="bg-[#FF0050] hover:bg-[#cc0040] text-white px-4 py-2 rounded-lg text-sm transition-all hover:glow-pink"
                  >
                    Annehmen
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-[#1e293b] rounded-2xl p-6 border border-white/10">
          <h2 className="text-lg font-semibold text-white mb-4">Meine Freunde</h2>
          {acceptedFriends.length === 0 ? (
            <p className="text-slate-500 text-sm">Du hast noch keine Freunde hinzugefügt.</p>
          ) : (
            <div className="space-y-2">
              {acceptedFriends.map(f => {
                const friendId = f.user1 === currentUserId ? f.user2 : f.user1;
                const profile = friendsProfiles[friendId];
                if (!profile) return null;
                
                const isSelected = selectedFriend === friendId;
                
                return (
                  <div key={f.id} className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${isSelected ? 'bg-[#1d7a82]/20 border border-[#1d7a82]/50' : 'bg-black/20 border border-white/5 hover:bg-white/5'}`}>
                    <button
                      onClick={() => setSelectedFriend(friendId)}
                      className="flex-1 flex items-center gap-3 text-left"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${isSelected ? 'bg-[#1d7a82] text-white' : 'bg-white/10 text-slate-300'}`}>
                        {profile.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-white font-medium">{profile.displayName || profile.username}</div>
                        <div className="text-xs text-slate-400">@{profile.username}</div>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        setFriendToRemove({ id: f.id, isSelected });
                      }}
                      className="p-2 text-slate-400 hover:text-[#FF0050] hover:bg-white/5 rounded-lg transition-colors"
                      title="Freund entfernen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          {selectedFriend ? (
            <div className="bg-[#1e293b] rounded-2xl p-6 border border-white/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  Aktivität von <span className="text-[#1d7a82] text-glow-teal">{friendsProfiles[selectedFriend]?.username}</span>
                </h2>
                <div className="flex bg-black/20 rounded-lg p-1 border border-white/5">
                  <button
                    onClick={() => setFriendTab('7days')}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${friendTab === '7days' ? 'bg-[#1d7a82] text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                  >
                    <Calendar className="w-4 h-4" /> 7 Tage
                  </button>
                  <button
                    onClick={() => setFriendTab('analytics')}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${friendTab === 'analytics' ? 'bg-[#1d7a82] text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                  >
                    <BarChart2 className="w-4 h-4" /> Analysen
                  </button>
                </div>
              </div>
              
              {friendTab === 'analytics' ? (
                <div className="mt-4">
                  <Analytics logs={friendLogs} />
                </div>
              ) : (
                <>
                  {recentLogs.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                      <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                        <div className="text-slate-400 text-xs mb-1">Workouts</div>
                        <div className="text-2xl font-bold text-white">{recentLogs.length}</div>
                      </div>
                      <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                        <div className="text-slate-400 text-xs mb-1">Volumen (kg)</div>
                        <div className="text-2xl font-bold text-[#1d7a82] text-glow-teal">
                          {Math.round(recentLogs.reduce((sum, log) => sum + ((log.weight || 0) * (log.reps || 1)), 0))}
                        </div>
                      </div>
                      <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                        <div className="text-slate-400 text-xs mb-1">Cardio (Min)</div>
                        <div className="text-2xl font-bold text-[#FF0050] text-glow-pink">
                          {recentLogs.reduce((sum, log) => sum + (log.duration || 0), 0)}
                        </div>
                      </div>
                      <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                        <div className="text-slate-400 text-xs mb-1">Top Muskel</div>
                        <div className="text-xl font-bold text-white truncate">
                          {Object.entries(recentLogs.reduce((acc, log) => {
                            acc[log.muscleGroup] = (acc[log.muscleGroup] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)).sort((a, b) => b[1] - a[1])[0]?.[0] || '-'}
                        </div>
                      </div>
                    </div>
                  )}

                  {recentLogs.length === 0 ? (
                    <div className="text-center py-12">
                      <Activity className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400">Keine Aktivitäten in den letzten 7 Tagen.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {Object.entries(groupedFriendLogs).map(([date, muscleGroups]) => (
                        <div key={date} className="space-y-4">
                          <h3 className="text-sm font-medium text-slate-400 sticky top-0 bg-[#1e293b] py-2 z-10">{date}</h3>
                          {Object.entries(muscleGroups).map(([muscleGroup, logs]) => (
                            <div key={muscleGroup} className="bg-black/20 rounded-xl p-4 border border-white/5">
                              <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                                <span className="w-2 h-4 bg-[#1d7a82] rounded-full glow-teal"></span>
                                {muscleGroup}
                              </h4>
                              <div className="space-y-2">
                                {logs.map(log => (
                                  <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-white/5">
                                    <span className="text-slate-200 font-medium">{log.name}</span>
                                    <div className="flex flex-wrap gap-3 text-sm text-slate-400">
                                      {log.weight !== undefined && (
                                        <span className="flex items-center gap-1"><Activity className="w-4 h-4 text-[#1d7a82]" /> {log.weight} {log.unit}</span>
                                      )}
                                      {log.reps && <span className="flex items-center gap-1"><Hash className="w-4 h-4 text-[#1d7a82]" /> {log.reps} Reps</span>}
                                      {log.duration && <span className="flex items-center gap-1"><Clock className="w-4 h-4 text-[#1d7a82]" /> {log.duration} Min</span>}
                                      {log.steps && <span className="flex items-center gap-1"><Footprints className="w-4 h-4 text-[#1d7a82]" /> {log.steps} Steps</span>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="bg-[#1e293b] rounded-2xl p-6 border border-white/10 h-full flex flex-col items-center justify-center text-center min-h-[300px]">
              <UserCheck className="w-16 h-16 text-slate-600 mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">Wähle einen Freund</h3>
              <p className="text-slate-400 max-w-sm">
                Wähle einen Freund aus der Liste auf der linken Seite, um seine Aktivitäten der letzten 7 Tage zu sehen.
              </p>
            </div>
          )}
        </div>
      </div>

      {friendToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1e293b] rounded-2xl p-6 max-w-sm w-full border border-[#FF0050]/30 shadow-[0_0_30px_rgba(255,0,80,0.15)]">
            <h3 className="text-xl font-bold text-white mb-2">Freund entfernen</h3>
            <p className="text-slate-400 mb-6">Möchtest du diesen Freund wirklich entfernen? Diese Aktion kann nicht rückgängig gemacht werden.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setFriendToRemove(null)}
                className="flex-1 px-4 py-2 rounded-xl font-medium bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                Abbrechen
              </button>
              <button 
                onClick={() => {
                  removeFriend(friendToRemove.id);
                  if (friendToRemove.isSelected) setSelectedFriend(null);
                  setFriendToRemove(null);
                }}
                className="flex-1 px-4 py-2 rounded-xl font-medium bg-[#FF0050] text-white hover:bg-[#cc0040] transition-colors glow-pink"
              >
                Entfernen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { VIP_UIDS, VIP_EMAILS, PRO_EMAILS } from '../constants/userPermissions';

interface ProContextType {
  isPro: boolean;
  isVip: boolean;
  loading: boolean;
  upgradeToPro: () => Promise<void>;
  isProModalOpen: boolean;
  openProModal: () => void;
  closeProModal: () => void;
}

const ProContext = createContext<ProContextType>({
  isPro: false,
  isVip: false,
  loading: true,
  upgradeToPro: async () => {},
  isProModalOpen: false,
  openProModal: () => {},
  closeProModal: () => {},
});

export const usePro = () => useContext(ProContext);

export const ProProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPro, setIsPro] = useState(false);
  const [isVip, setIsVip] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isProModalOpen, setIsProModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setLoading(true);
      if (user) {
        try {
          let isVipUser = false;
          let isProUser = false;

          // 1. Check hardcoded VIP UIDs
          if (VIP_UIDS.includes(user.uid)) {
            isVipUser = true;
            isProUser = true;
          }

          // 2. Check hardcoded VIP Emails & Bootstrap
          if (user.email && VIP_EMAILS.includes(user.email)) {
            isVipUser = true;
            isProUser = true;
            // Bootstrap Firestore record
            await setDoc(doc(db, 'vip', user.email), { active: true, email: user.email }, { merge: true });
          }

          // 2.5 Check hardcoded PRO Emails
          if (user.email && !isProUser && PRO_EMAILS.includes(user.email)) {
            isProUser = true;
            // Bootstrap Firestore record
            await setDoc(doc(db, 'pro_users', user.uid), { 
              active: true, 
              createdAt: new Date().toISOString(),
              email: user.email 
            }, { merge: true });
          }

          // 3. Check VIP status from Firestore (by email)
          if (user.email && !isVipUser) {
            const vipDoc = await getDoc(doc(db, 'vip', user.email));
            if (vipDoc.exists() && vipDoc.data().active) {
              isVipUser = true;
              isProUser = true;
            }
          }

          // 4. Check Pro status from Firestore (by UID or Email)
          if (!isProUser) {
            // Check by UID
            const proDocByUid = await getDoc(doc(db, 'pro_users', user.uid));
            if (proDocByUid.exists()) {
              const data = proDocByUid.data();
              // TEMPORARY CLEANUP: Deactivate status for specific email if it was "cheated"
              const cheatedEmails = ['maximhh.brduer@gmail.com', 'maximhh.bruder@gmail.com'];
              if (user.email && cheatedEmails.includes(user.email) && data.active) {
                await setDoc(doc(db, 'pro_users', user.uid), { active: false }, { merge: true });
                isProUser = false;
              } else if (data.active) {
                isProUser = true;
              }
            }

            // Check by Email (for manual grants)
            if (!isProUser && user.email) {
              const proDocByEmail = await getDoc(doc(db, 'pro_users', user.email));
              if (proDocByEmail.exists() && proDocByEmail.data().active) {
                isProUser = true;
              }
            }
          }

          // 5. Auto-upgrade VIP UIDs to Pro in Firestore if not already there
          if (isVipUser && !isProUser) {
             // This case is handled by setting isProUser = true above, 
             // but we can also ensure the record exists
             await setDoc(doc(db, 'pro_users', user.uid), { 
               active: true, 
               createdAt: new Date().toISOString(),
               email: user.email || 'vip'
             }, { merge: true });
          }

          setIsVip(isVipUser);
          setIsPro(isProUser);
        } catch (error: any) {
          console.error("Error checking pro status:", error.message || error);
        }
      } else {
        setIsPro(false);
        setIsVip(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const upgradeToPro = async () => {
    if (!auth.currentUser) return;
    try {
      await setDoc(doc(db, 'pro_users', auth.currentUser.uid), {
        active: true,
        createdAt: new Date().toISOString(),
        email: auth.currentUser.email
      }, { merge: true });
      setIsPro(true);
    } catch (error) {
      console.error('Error upgrading to pro:', error);
      throw error;
    }
  };

  const openProModal = () => setIsProModalOpen(true);
  const closeProModal = () => setIsProModalOpen(false);

  return (
    <ProContext.Provider value={{ isPro, isVip, loading, upgradeToPro, isProModalOpen, openProModal, closeProModal }}>
      {children}
    </ProContext.Provider>
  );
};

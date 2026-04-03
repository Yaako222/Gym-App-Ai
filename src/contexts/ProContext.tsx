import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { VIP_UIDS, VIP_EMAILS, PRO_EMAILS } from '../constants/userPermissions';

interface ProContextType {
  isPro: boolean;
  isVip: boolean;
  loading: boolean;
  planType: 'individual' | 'family' | 'family_member' | null;
  familyMembers: string[];
  updateFamilyMembers: (newMembers: string[]) => void;
  upgradeToPro: (planType?: 'individual' | 'family') => Promise<void>;
  isProModalOpen: boolean;
  openProModal: () => void;
  closeProModal: () => void;
}

const ProContext = createContext<ProContextType>({
  isPro: false,
  isVip: false,
  loading: true,
  planType: null,
  familyMembers: [],
  updateFamilyMembers: () => {},
  upgradeToPro: async () => {},
  isProModalOpen: false,
  openProModal: () => {},
  closeProModal: () => {},
});

export const usePro = () => useContext(ProContext);

export const ProProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPro, setIsPro] = useState(false);
  const [isVip, setIsVip] = useState(false);
  const [planType, setPlanType] = useState<'individual' | 'family' | 'family_member' | null>(null);
  const [familyMembers, setFamilyMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProModalOpen, setIsProModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setLoading(true);
      if (user) {
        try {
          let isVipUser = false;
          let isProUser = false;
          let currentPlanType: 'individual' | 'family' | 'family_member' | null = null;
          let currentFamilyMembers: string[] = [];

          // 1. Check hardcoded VIP UIDs
          if (VIP_UIDS.includes(user.uid)) {
            isVipUser = true;
            isProUser = true;
            currentPlanType = 'individual';
          }

          // 2. Check hardcoded VIP Emails & Bootstrap
          if (user.email && VIP_EMAILS.includes(user.email)) {
            isVipUser = true;
            isProUser = true;
            currentPlanType = 'individual';
            await setDoc(doc(db, 'vip', user.email), { active: true, email: user.email }, { merge: true });
          }

          // 2.5 Check hardcoded PRO Emails
          if (user.email && !isProUser && PRO_EMAILS.includes(user.email)) {
            isProUser = true;
            currentPlanType = 'individual';
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
              currentPlanType = 'individual';
            }
          }

          // 4. Check Pro status from Firestore (by UID or Email)
          // Always check pro_users to get familyMembers and planType, even if already VIP
          const proDocByUid = await getDoc(doc(db, 'pro_users', user.uid));
          if (proDocByUid.exists()) {
            const data = proDocByUid.data();
            const cheatedEmails = ['maximhh.brduer@gmail.com', 'maximhh.bruder@gmail.com'];
            if (user.email && cheatedEmails.includes(user.email) && data.active) {
              await setDoc(doc(db, 'pro_users', user.uid), { active: false }, { merge: true });
              isProUser = false;
            } else if (data.active || isVipUser) {
              isProUser = true;
              currentPlanType = data.planType || currentPlanType || 'individual';
              currentFamilyMembers = data.familyMembers || [];
            }
          }

          // Check by Email (for manual grants)
          if (user.email) {
            const proDocByEmail = await getDoc(doc(db, 'pro_users', user.email));
            if (proDocByEmail.exists() && proDocByEmail.data().active) {
              isProUser = true;
              currentPlanType = proDocByEmail.data().planType || currentPlanType || 'individual';
              
              const emailFamilyMembers = proDocByEmail.data().familyMembers || [];
              currentFamilyMembers = Array.from(new Set([...currentFamilyMembers, ...emailFamilyMembers]));
              
              // Auto-migrate email document data to UID document for firestore rules
              try {
                await setDoc(doc(db, 'pro_users', user.uid), {
                  active: true,
                  email: user.email,
                  planType: currentPlanType,
                  familyMembers: currentFamilyMembers,
                  createdAt: proDocByEmail.data().createdAt || new Date().toISOString()
                }, { merge: true });
                
                // Delete the email document so it doesn't overwrite the UID document on next login
                await deleteDoc(doc(db, 'pro_users', user.email));
              } catch (e) {
                console.error("Failed to migrate email pro doc to uid:", e);
              }
            }
          }

          // 5. Check if user is a family member of someone else's plan
          if (!isProUser && user.email) {
            const familyQuery = query(
              collection(db, 'pro_users'), 
              where('familyMembers', 'array-contains', user.email)
            );
            const familySnap = await getDocs(familyQuery);
            const isActiveFamilyMember = familySnap.docs.some(doc => doc.data().active === true);
            if (isActiveFamilyMember) {
              isProUser = true;
              currentPlanType = 'family_member';
            }
          }

          // 6. Auto-upgrade VIP UIDs to Pro in Firestore
          if (isVipUser) {
             try {
               const updateData: any = {
                 active: true,
                 email: user.email || 'vip',
                 planType: currentPlanType
               };
               if (!proDocByUid.exists()) {
                 updateData.createdAt = new Date().toISOString();
               }
               await setDoc(doc(db, 'pro_users', user.uid), updateData, { merge: true });
             } catch (e) {
               console.error("Failed to auto-upgrade VIP to PRO:", e);
             }
          }

          setIsVip(isVipUser);
          setIsPro(isProUser);
          setPlanType(currentPlanType);
          setFamilyMembers(currentFamilyMembers);
        } catch (error: any) {
          console.error("Error checking pro status:", error.message || error);
        }
      } else {
        setIsPro(false);
        setIsVip(false);
        setPlanType(null);
        setFamilyMembers([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const upgradeToPro = async (newPlanType: 'individual' | 'family' = 'individual') => {
    if (!auth.currentUser) return;
    try {
      await setDoc(doc(db, 'pro_users', auth.currentUser.uid), {
        active: true,
        createdAt: new Date().toISOString(),
        email: auth.currentUser.email,
        planType: newPlanType,
        familyMembers: []
      }, { merge: true });
      setIsPro(true);
      setPlanType(newPlanType);
    } catch (error) {
      console.error('Error upgrading to pro:', error);
      throw error;
    }
  };

  const openProModal = () => setIsProModalOpen(true);
  const closeProModal = () => setIsProModalOpen(false);

  const updateFamilyMembers = (newMembers: string[]) => {
    setFamilyMembers(newMembers);
  };

  return (
    <ProContext.Provider value={{ isPro, isVip, loading, planType, familyMembers, updateFamilyMembers, upgradeToPro, isProModalOpen, openProModal, closeProModal }}>
      {children}
    </ProContext.Provider>
  );
};

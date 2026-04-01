import { collection, doc, setDoc, deleteDoc, getDocs, getDoc, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth, googleProvider } from '../firebase';
import { reauthenticateWithPopup } from 'firebase/auth';
import { ExercisePlan, ExerciseLog, UserProfile, Friendship } from '../types';
import { getCurrentISODate } from './time';

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

export const addPlan = async (plan: Omit<ExercisePlan, 'id' | 'dateAdded'>) => {
  if (!auth.currentUser) throw new Error('Not authenticated');
  const userId = auth.currentUser.uid;
  
  const newPlan: ExercisePlan = {
    ...plan,
    id: crypto.randomUUID(),
    dateAdded: getCurrentISODate(),
  };
  
  const firestoreData = { ...newPlan, userId };
  Object.keys(firestoreData).forEach(key => {
    if (firestoreData[key as keyof typeof firestoreData] === undefined) {
      delete firestoreData[key as keyof typeof firestoreData];
    }
  });

  const path = `users/${userId}/plans`;
  try {
    await setDoc(doc(db, path, newPlan.id), firestoreData);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
  
  return newPlan;
};

export const updatePlan = async (id: string, planUpdates: Partial<ExercisePlan>) => {
  if (!auth.currentUser) throw new Error('Not authenticated');
  const userId = auth.currentUser.uid;
  const path = `users/${userId}/plans`;
  
  const firestoreData = { ...planUpdates, userId };
  Object.keys(firestoreData).forEach(key => {
    if (firestoreData[key as keyof typeof firestoreData] === undefined) {
      delete firestoreData[key as keyof typeof firestoreData];
    }
  });

  try {
    await setDoc(doc(db, path, id), firestoreData, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const deletePlan = async (id: string) => {
  if (!auth.currentUser) throw new Error('Not authenticated');
  const userId = auth.currentUser.uid;
  const path = `users/${userId}/plans`;
  try {
    await deleteDoc(doc(db, path, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const addLog = async (log: Omit<ExerciseLog, 'id' | 'date'>) => {
  if (!auth.currentUser) throw new Error('Not authenticated');
  const userId = auth.currentUser.uid;
  
  const newLog: ExerciseLog = {
    ...log,
    id: crypto.randomUUID(),
    date: getCurrentISODate(),
  };
  
  // Remove undefined fields for Firestore
  const firestoreData = { ...newLog, userId };
  Object.keys(firestoreData).forEach(key => {
    if (firestoreData[key as keyof typeof firestoreData] === undefined) {
      delete firestoreData[key as keyof typeof firestoreData];
    }
  });
  
  const path = `users/${userId}/logs`;
  try {
    await setDoc(doc(db, path, newLog.id), firestoreData);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
  
  return newLog;
};

export const updateLog = async (logId: string, updates: Partial<ExerciseLog>) => {
  if (!auth.currentUser) throw new Error('Not authenticated');
  const userId = auth.currentUser.uid;
  const path = `users/${userId}/logs`;
  
  // Remove undefined fields
  const firestoreData = { ...updates };
  Object.keys(firestoreData).forEach(key => {
    if (firestoreData[key as keyof typeof firestoreData] === undefined) {
      delete firestoreData[key as keyof typeof firestoreData];
    }
  });

  try {
    await setDoc(doc(db, path, logId), firestoreData, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const deleteLog = async (id: string) => {
  if (!auth.currentUser) throw new Error('Not authenticated');
  const userId = auth.currentUser.uid;
  const path = `users/${userId}/logs`;
  try {
    await deleteDoc(doc(db, path, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const checkUsernameAvailability = async (username: string): Promise<boolean> => {
  if (!auth.currentUser) throw new Error('Not authenticated');
  const path = `users`;
  try {
    const q = query(collection(db, path), where('searchableUsername', '==', username.toLowerCase()));
    const snapshot = await getDocs(q);
    
    // If empty, it's available. If it exists but it's the current user, it's also available.
    if (snapshot.empty) return true;
    
    let isAvailable = true;
    snapshot.forEach(doc => {
      if (doc.id !== auth.currentUser!.uid) {
        isAvailable = false;
      }
    });
    return isAvailable;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return false;
  }
};

export const updateUserProfile = async (profile: Partial<UserProfile>) => {
  if (!auth.currentUser) throw new Error('Not authenticated');
  const userId = auth.currentUser.uid;
  const path = `users`;
  try {
    const userRef = doc(db, path, userId);
    
    const dataToUpdate: any = {
      ...profile,
      uid: userId,
    };
    
    if (profile.username) {
      dataToUpdate.searchableUsername = profile.username.toLowerCase();
    }
    
    Object.keys(dataToUpdate).forEach(key => {
      if (dataToUpdate[key] === undefined) {
        delete dataToUpdate[key];
      }
    });
    
    await setDoc(userRef, dataToUpdate, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const searchUsersByUsername = async (username: string) => {
  if (!auth.currentUser) throw new Error('Not authenticated');
  const path = `users`;
  try {
    const q = query(
      collection(db, path),
      where('searchableUsername', '>=', username.toLowerCase()),
      where('searchableUsername', '<=', username.toLowerCase() + '\uf8ff')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as UserProfile);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return [];
  }
};

export const sendFriendRequest = async (friendId: string) => {
  if (!auth.currentUser) throw new Error('Not authenticated');
  const userId = auth.currentUser.uid;
  const friendshipId = [userId, friendId].sort().join('_');
  const path = `friendships`;
  try {
    await setDoc(doc(db, path, friendshipId), {
      user1: userId,
      user2: friendId,
      status: 'pending',
      createdAt: getCurrentISODate()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const acceptFriendRequest = async (friendshipId: string) => {
  if (!auth.currentUser) throw new Error('Not authenticated');
  const path = `friendships`;
  try {
    await setDoc(doc(db, path, friendshipId), {
      status: 'accepted'
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const removeFriend = async (friendshipId: string) => {
  if (!auth.currentUser) throw new Error('Not authenticated');
  const path = `friendships`;
  try {
    await deleteDoc(doc(db, path, friendshipId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const getUserProfile = async (userId: string) => {
  if (!auth.currentUser) throw new Error('Not authenticated');
  const path = `users`;
  try {
    const docSnap = await getDoc(doc(db, path, userId));
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
};

export const deleteAccount = async () => {
  if (!auth.currentUser) throw new Error('Not authenticated');
  const user = auth.currentUser;
  const userId = user.uid;
  
  const performDeletion = async () => {
    // 1. Delete user profile
    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);
    
    // 2. Delete plans
    const plansSnapshot = await getDocs(collection(db, `users/${userId}/plans`));
    for (const doc of plansSnapshot.docs) {
      await deleteDoc(doc.ref);
    }
    
    // 3. Delete logs
    const logsSnapshot = await getDocs(collection(db, `users/${userId}/logs`));
    for (const doc of logsSnapshot.docs) {
      await deleteDoc(doc.ref);
    }
    
    // 4. Delete friendships
    const q1 = query(collection(db, 'friendships'), where('user1', '==', userId));
    const q2 = query(collection(db, 'friendships'), where('user2', '==', userId));
    const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
    for (const doc of [...snap1.docs, ...snap2.docs]) {
      await deleteDoc(doc.ref);
    }
    
    // 5. Delete auth account
    await user.delete();
  };

  try {
    await performDeletion();
  } catch (error: any) {
    if (error.code === 'auth/requires-recent-login') {
      try {
        await reauthenticateWithPopup(user, googleProvider);
        await performDeletion();
      } catch (reauthError: any) {
        if (reauthError.code === 'auth/popup-closed-by-user') {
          throw new Error('REAUTH_CANCELLED');
        }
        throw new Error('REAUTH_REQUIRED');
      }
    } else {
      throw error;
    }
  }
};

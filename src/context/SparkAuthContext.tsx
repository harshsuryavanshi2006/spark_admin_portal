import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { auth, db, googleProvider, PRIMARY_ADMIN_EMAIL } from '../firebase';
import type { AdminRole, AdminUser } from '../types/spark';

interface SparkAuthContextValue {
  user: User | null;
  authReady: boolean;
  verifyingAdmin: boolean;
  isAuthorized: boolean;
  accessDenied: boolean;
  adminRecord: AdminUser | null;
  adminRole: AdminRole | null;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  recheckAdminStatus: () => Promise<void>;
}

const SparkAuthContext = createContext<SparkAuthContextValue | null>(null);

export function SparkAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [verifyingAdmin, setVerifyingAdmin] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [adminRecord, setAdminRecord] = useState<AdminUser | null>(null);
  const [adminRole, setAdminRole] = useState<AdminRole | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const verifyAdminAccess = useCallback(async (firebaseUser: User | null) => {
    if (!firebaseUser) {
      setIsAuthorized(false);
      setAccessDenied(false);
      setAdminRecord(null);
      setAdminRole(null);
      setVerifyingAdmin(false);
      return;
    }

    const userEmail = (firebaseUser.email || '').trim().toLowerCase();
    const isEmailVerified = firebaseUser.emailVerified;

    if (!userEmail || !isEmailVerified) {
      setIsAuthorized(false);
      setAccessDenied(true);
      setAdminRecord(null);
      setAdminRole(null);
      setVerifyingAdmin(false);
      return;
    }

    setVerifyingAdmin(true);
    setAuthError(null);

    try {
      const isPrimary = userEmail === PRIMARY_ADMIN_EMAIL.toLowerCase();

      let matchedAdmin: AdminUser | null = null;

      // 1. Try querying /admins by normalized lowercase email
      try {
        const q = query(collection(db, 'admins'), where('email', '==', userEmail));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const docSnap = snap.docs[0];
          matchedAdmin = { id: docSnap.id, ...(docSnap.data() as Omit<AdminUser, 'id'>) };
        }
      } catch {
        // Fallback to direct document lookups if list query is restricted
      }

      // 2. Fallback: direct doc lookup by email or uid
      if (!matchedAdmin) {
        for (const candidateId of [userEmail, firebaseUser.uid]) {
          try {
            const directSnap = await getDoc(doc(db, 'admins', candidateId));
            if (directSnap.exists()) {
              matchedAdmin = {
                id: directSnap.id,
                ...(directSnap.data() as Omit<AdminUser, 'id'>),
              };
              break;
            }
          } catch {
            // Continue checking other lookup paths
          }
        }
      }

      // 3. Fallback: scan /admins for case-insensitive email match if readable
      if (!matchedAdmin) {
        try {
          const allAdmins = await getDocs(collection(db, 'admins'));
          for (const d of allAdmins.docs) {
            const data = d.data() as Omit<AdminUser, 'id'>;
            if ((data.email || '').trim().toLowerCase() === userEmail) {
              matchedAdmin = { id: d.id, ...data };
              break;
            }
          }
        } catch {
          // Non-admins may not have list permission on /admins
        }
      }

      if (isPrimary) {
        setIsAuthorized(true);
        setAccessDenied(false);
        setAdminRecord(
          matchedAdmin || {
            id: 'primary-admin',
            email: PRIMARY_ADMIN_EMAIL,
            name: firebaseUser.displayName || 'Primary Admin',
            role: 'super_admin',
          }
        );
        setAdminRole(matchedAdmin?.role || 'super_admin');
      } else if (matchedAdmin) {
        setIsAuthorized(true);
        setAccessDenied(false);
        setAdminRecord(matchedAdmin);
        setAdminRole(matchedAdmin.role || 'admin');
      } else {
        setIsAuthorized(false);
        setAccessDenied(true);
        setAdminRecord(null);
        setAdminRole(null);
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Unable to verify administrator privileges.');
      setIsAuthorized(false);
      setAccessDenied(true);
    } finally {
      setVerifyingAdmin(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
      void verifyAdminAccess(firebaseUser);
    });
    return () => unsubscribe();
  }, [verifyAdminAccess]);

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Google Sign-In failed.';
      if (!msg.includes('popup-closed-by-user')) {
        setAuthError(msg);
      }
    }
  }, []);

  const signOut = useCallback(async () => {
    setAuthError(null);
    await firebaseSignOut(auth);
  }, []);

  const recheckAdminStatus = useCallback(async () => {
    await verifyAdminAccess(auth.currentUser);
  }, [verifyAdminAccess]);

  return (
    <SparkAuthContext.Provider
      value={{
        user,
        authReady,
        verifyingAdmin,
        isAuthorized,
        accessDenied,
        adminRecord,
        adminRole,
        authError,
        signInWithGoogle,
        signOut,
        recheckAdminStatus,
      }}
    >
      {children}
    </SparkAuthContext.Provider>
  );
}

export function useSparkAuth() {
  const ctx = useContext(SparkAuthContext);
  if (!ctx) {
    throw new Error('useSparkAuth must be used inside SparkAuthProvider');
  }
  return ctx;
}

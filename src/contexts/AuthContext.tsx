import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

function authRedirectTo(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  return `${window.location.origin}${import.meta.env.BASE_URL}`.replace(/\/?$/, '/');
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  /** True after user opens a password-reset email link until they set a new password. */
  passwordRecoveryPending: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (
    email: string,
    password: string
  ) => Promise<{ error: any; session: Session | null; user: User | null }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (password: string) => Promise<{ error: any }>;
  /** Re-authenticates with the current password, then sets a new one. */
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ error: any }>;
  clearPasswordRecovery: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [passwordRecoveryPending, setPasswordRecoveryPending] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (event === 'PASSWORD_RECOVERY') {
        setPasswordRecoveryPending(true);
      }
      if (event === 'SIGNED_OUT') {
        setPasswordRecoveryPending(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const redirectTo = authRedirectTo();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: redirectTo ? { emailRedirectTo: redirectTo } : undefined,
    });
    return { error, session: data.session ?? null, user: data.user ?? null };
  };

  const resetPassword = async (email: string) => {
    const redirectTo = authRedirectTo();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      ...(redirectTo ? { redirectTo } : {}),
    });
    return { error };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (!error) setPasswordRecoveryPending(false);
    return { error };
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    const email = user?.email;
    if (!email) {
      return { error: { message: 'You must be signed in to change your password.' } };
    }
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });
    if (verifyError) {
      return { error: { message: 'Current password is incorrect.' } };
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error };
  };

  const clearPasswordRecovery = () => {
    setPasswordRecoveryPending(false);
  };

  const signOut = async () => {
    setPasswordRecoveryPending(false);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        passwordRecoveryPending,
        signIn,
        signUp,
        resetPassword,
        updatePassword,
        changePassword,
        clearPasswordRecovery,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

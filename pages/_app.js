import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../utils/supabaseClient';

const publicPages = ['/login'];

function NavBar({ user }) {
  const router = useRouter();
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };
  return (
    <nav style={{ display: 'flex', gap: '1rem', padding: '1rem', background: '#f5f5f5', marginBottom: '2rem' }}>
      <a href="/sales">Sales</a>
      <a href="/customers">Customers</a>
      <a href="/products">Products</a>
      <a href="/ledger">Ledger</a>
      <a href="/change-password">Change Password</a>
      <span style={{ flex: 1 }} />
      {user && <button onClick={handleLogout}>Sign Out</button>}
    </nav>
  );
}

function MyApp({ Component, pageProps }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      setLoading(false);
      if (!session?.user && !publicPages.includes(router.pathname)) {
        router.push('/login');
      }
      if (session?.user && router.pathname === '/login') {
        router.push('/sales');
      }
    });
    // Initial check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      setLoading(false);
      if (!session?.user && !publicPages.includes(router.pathname)) {
        router.push('/login');
      }
      if (session?.user && router.pathname === '/login') {
        router.push('/sales');
      }
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, [router.pathname]);

  if (loading) return <div style={{ padding: '2rem' }}>Loading...</div>;

  // Only show NavBar if user is logged in
  return (
    <>
      {user && <NavBar user={user} />}
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;

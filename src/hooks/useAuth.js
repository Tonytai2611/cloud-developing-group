import { useState, useEffect } from 'react';
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to read user info from BFF cookie via /api/me
    const fetchMe = async () => {
      try {
        const res = await fetch('/api/me');
        if (!res.ok) {
          setUser(null);
        } else {
          const data = await res.json();
          setUser(data.userInfo || null);
        }
      } catch (e) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, []);

  const signUp = async (username, password, email) => {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, email })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Register failed');
    return data;
  };

  const signIn = async (username, password) => {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    // After login the server sets a `userInfo` cookie; fetch it
    try {
      const me = await (await fetch('/api/me')).json();
      setUser(me.userInfo || { username });
    } catch (e) {
      setUser({ username });
    }
    return data;
  };

  const signOut = () => {
    // call backend to clear cookies
    fetch('/api/logout', { method: 'POST' }).catch(() => {});
    localStorage.removeItem('idToken');
    setUser(null);
  };

  return { user, loading, signUp, signIn, signOut };
}

export default useAuth;

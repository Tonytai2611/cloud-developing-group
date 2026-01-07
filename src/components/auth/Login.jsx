import React, { useState } from 'react';
export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      // persist tokens locally (in-memory or secure cookie in production)
      if (data.tokens && data.tokens.IdToken) {
        localStorage.setItem('idToken', data.tokens.IdToken);
      }
      window.location.reload();
    } catch (err) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <form onSubmit={onSubmit} className="max-w-md mx-auto">
      <h3 className="text-xl font-semibold mb-4">Login</h3>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <label className="block mb-2">
        Email
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border p-2" />
      </label>
      <label className="block mb-4">
        Password
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border p-2" />
      </label>
      <button type="submit" className="bg-blue-600 text-white px-4 py-2">Sign In</button>
    </form>
  );
}

import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function VerifyEmail() {
  const query = useQuery();
  const username = query.get('username') || localStorage.getItem('username') || '';
  const storedEmail = localStorage.getItem('email') || '';
  const storedName = localStorage.getItem('name') || '';
  const storedRole = localStorage.getItem('role') || 'customer'; // Get role from localStorage
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, code, email: storedEmail, name: storedName, role: storedRole }) // Include role
      });

      let data;
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        // non-json (HTML error page) — read as text for debugging
        const text = await res.text();
        throw new Error(`Server returned non-JSON response: ${text.substring(0, 200)}`);
      }

      if (!res.ok) throw new Error(data.error || 'Confirm failed');
      alert('Email verified and account saved. You can now login.');
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Confirmation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-8">Verify Email</h1>
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
          <p className="text-center mb-4">Enter the verification code sent to your email for <strong>{username}</strong>.</p>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label htmlFor="code" className="block text-sm font-medium mb-2">Verification Code</label>
              <input
                type="text"
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="Enter code"
              />
            </div>
            {error && <div className="text-red-600">{error}</div>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-500 text-white font-bold py-3 rounded-lg hover:bg-teal-600 transition-all shadow-md"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

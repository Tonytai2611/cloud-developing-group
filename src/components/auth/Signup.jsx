import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState(0); // 0=signup,1=confirm
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const onSignup = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password, email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Register failed');
      // If Cognito sends a confirmation code, you may prompt user to confirm
      toast.success("Registration successful!", {
        description: "Please check your email for verification code"
      });
      navigate(`/verify-email?username=${encodeURIComponent(email)}`);
      setStep(1);
    } catch (err) {
      setError(err.message || 'Signup failed');
    }
  };

  const onConfirm = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      // Call Cognito confirm via AWS SDK on server if implemented; fallback instruct user
      toast.info("Please verify via email code", {
        description: "Check your email for the verification code"
      });
      window.location.reload();
    } catch (err) {
      setError(err.message || 'Confirmation failed');
    }
  };

  return (
    <div className="max-w-md mx-auto">
      {step === 0 && (
        <form onSubmit={onSignup}>
          <h3 className="text-xl font-semibold mb-4">Sign Up</h3>
          {error && <div className="text-red-600 mb-2">{error}</div>}
          <label className="block mb-2">Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border p-2" />
          </label>
          <label className="block mb-4">Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border p-2" />
          </label>
          <button type="submit" className="bg-green-600 text-white px-4 py-2">Create account</button>
        </form>
      )}

      {step === 1 && (
        <form onSubmit={onConfirm}>
          <h3 className="text-xl font-semibold mb-4">Confirm Sign Up</h3>
          {error && <div className="text-red-600 mb-2">{error}</div>}
          <label className="block mb-4">Confirmation Code
            <input value={code} onChange={(e) => setCode(e.target.value)} className="w-full border p-2" />
          </label>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2">Confirm</button>
        </form>
      )}
    </div>
  );
}

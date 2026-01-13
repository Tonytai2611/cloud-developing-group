
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function UserProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Not authenticated. Please login again.');
      }

      const API_URL = process.env.VITE_API_GATEWAY_URL || 'https://4jawv6e5e1.execute-api.us-east-1.amazonaws.com';

      const res = await fetch(`${API_URL}/api/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.status === 401) throw new Error('Session expired. Please login again.');
      if (!res.ok) throw new Error(`Server Error: ${res.statusText}`);

      const data = await res.json();
      // API returns { userInfo: ... } not { item: ... }
      setProfile(data.userInfo);
    } catch (e) {
      if (e.message.includes('Not authenticated')) {
        navigate('/login');
      }
      setError(e.message || 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  const onSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const token = localStorage.getItem('accessToken');
      const API_URL = process.env.VITE_API_GATEWAY_URL || 'https://4jawv6e5e1.execute-api.us-east-1.amazonaws.com';

      // Note: Currently pointing to /api/me for update, assuming handler supports PUT or similar
      // If not, this might need to be adjusted to a specific update endpoint
      const res = await fetch(`${API_URL}/api/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: profile.name, email: profile.email })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');

      // Update local state with returned data
      setProfile(data.userInfo || profile);
      toast.success("Profile saved successfully");
    } catch (e) {
      setError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!window.confirm('Delete local user record? This will NOT delete the Cognito account. Continue?')) return;
    try {
      const res = await fetch('/api/user', { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      toast.success(data.message || 'Account deleted successfully');
      // clear local auth and go home
      await fetch('/api/logout', { method: 'POST' }).catch(() => { });
      navigate('/');
      window.location.reload();
    } catch (e) {
      setError(e.message || 'Delete failed');
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  if (error) return (
    <div className="p-8">
      <div className="text-red-600">{error}</div>
      <button className="mt-4" onClick={fetchProfile}>Retry</button>
    </div>
  );

  if (!profile) return <div className="p-8">No profile</div>;

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-8">User Profile</h1>
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={onSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Username</label>
              <div className="p-2 bg-gray-100 rounded">{profile.username}</div>
            </div>
            <div>
              <label className="block text-sm font-medium">Name</label>
              <input className="w-full border p-2" value={profile.name || ''} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium">Email</label>
              <input className="w-full border p-2" value={profile.email || ''} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium">Role</label>
              <div className="p-2 bg-gray-100 rounded">{profile.role || 'customer'}</div>
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="bg-teal-500 text-white px-4 py-2 rounded">
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button type="button" onClick={onDelete} className="bg-red-500 text-white px-4 py-2 rounded">Delete Record</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

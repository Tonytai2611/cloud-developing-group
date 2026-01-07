import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminHeader from '../../components/application_component/AdminHeader';
import { Button } from '../../components/ui/button';

export default function Admin() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch("/api/me");
        if (response.ok) {
          const userInfo = await response.json();
          setData(userInfo.userInfo);

          if (!userInfo.userInfo?.isAdmin) {
            navigate('/'); // Redirect non-admins immediately
          }
        } else {
          setData(null);
          navigate('/'); // Redirect if user data cannot be fetched
        }
      } catch (error) {
        console.error("Error fetching user info:", error);
        navigate('/'); // Redirect on fetch failure
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [navigate]);

  const handleSubscribe = async () => {
    if (!email) {
      setMessage('Please enter an email address');
      return;
    }

    try {
      const payload = {
        body: JSON.stringify({ email }),
      };

      console.log('Payload:', payload);

      // Replace with your actual API endpoint
      const response = await fetch('YOUR_API_ENDPOINT_HERE', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        setMessage(result.message || 'Subscription successful!');
        setEmail('');
      } else {
        const error = await response.json();
        setMessage(error.error || 'Failed to subscribe. Please try again.');
      }
    } catch (error) {
      console.error('Error subscribing email:', error);
      setMessage('An error occurred. Please try again later.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl font-semibold text-teal-600">Loading...</div>
      </div>
    );
  }

  if (!data || !data.isAdmin) {
    return null; // Block rendering for non-admins
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <div className="container mx-auto px-4 py-8">
        {/* Email Subscription Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Email Subscription Management</h2>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <input
              type="email"
              placeholder="Enter email to subscribe"
              className="flex-1 border-2 border-gray-300 rounded-lg p-3 text-gray-800 focus:border-teal-500 focus:outline-none transition-colors"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button
              className="bg-teal-500 text-white font-bold rounded-lg px-6 py-3 hover:bg-teal-600 transition-all shadow-md"
              onClick={handleSubscribe}
            >
              Subscribe
            </Button>
          </div>
          {message && (
            <div className={`mt-4 p-3 rounded-lg ${message.includes('successful') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {message}
            </div>
          )}
        </div>

        {/* Admin Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Manage Table Card */}
          <div
            onClick={() => navigate('/admin/manage-table')}
            className="group bg-white rounded-lg shadow-lg p-8 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl border-2 border-transparent hover:border-teal-500"
          >
            <div className="text-center">
              <div className="text-5xl mb-4">🪑</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2 group-hover:text-teal-600 transition-colors">
                Manage Tables
              </h3>
              <p className="text-gray-600">
                Add, edit, or delete restaurant tables
              </p>
            </div>
          </div>

          {/* Manage Menu Card */}
          <div
            onClick={() => navigate('/admin/manage-menu')}
            className="group bg-white rounded-lg shadow-lg p-8 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl border-2 border-transparent hover:border-teal-500"
          >
            <div className="text-center">
              <div className="text-5xl mb-4">🍽️</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2 group-hover:text-teal-600 transition-colors">
                Manage Menu
              </h3>
              <p className="text-gray-600">
                Update menu items and pricing
              </p>
            </div>
          </div>

          {/* Manage Orders Card */}
          <div
            onClick={() => navigate('/admin/manage-ordering-food')}
            className="group bg-white rounded-lg shadow-lg p-8 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl border-2 border-transparent hover:border-teal-500"
          >
            <div className="text-center">
              <div className="text-5xl mb-4">📦</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2 group-hover:text-teal-600 transition-colors">
                Manage Orders
              </h3>
              <p className="text-gray-600">
                View and manage customer orders
              </p>
            </div>
          </div>

          {/* Chat with Users Card */}
          <div
            onClick={() => navigate('/admin/chat-with-users')}
            className="group bg-white rounded-lg shadow-lg p-8 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl border-2 border-transparent hover:border-teal-500"
          >
            <div className="text-center">
              <div className="text-5xl mb-4">💬</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2 group-hover:text-teal-600 transition-colors">
                Chat with Users
              </h3>
              <p className="text-gray-600">
                Communicate with customers
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminHeader from '../../components/application_component/AdminHeader';
import { Button } from '../../components/ui/button';
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingBag,
  MessageSquare,
  Users,
  TrendingUp,
  Calendar,
  DollarSign,
  ChevronRight,
  Mail,
  CheckCircle2,
  XCircle
} from 'lucide-react';

export default function Admin() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  // Mock statistics data - replace with real API calls
  const [stats] = useState({
    totalOrders: 83457,
    pendingOrders: 21457,
    completedOrders: 31457,
    revenue: 234190,
    activeUsers: 1247,
    newUsers: 89
  });

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch("/api/me");
        if (response.ok) {
          const userInfo = await response.json();
          setData(userInfo.userInfo);

          if (!userInfo.userInfo?.isAdmin) {
            navigate('/');
          }
        } else {
          setData(null);
          navigate('/');
        }
      } catch (error) {
        console.error("Error fetching user info:", error);
        navigate('/');
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-xl font-semibold text-teal-600">Loading Dashboard...</div>
        </div>
      </div>
    );
  }

  if (!data || !data.isAdmin) {
    return null;
  }

  const statCards = [
    {
      title: 'Total Orders',
      value: stats.totalOrders.toLocaleString(),
      icon: ShoppingBag,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Pending Orders',
      value: stats.pendingOrders.toLocaleString(),
      icon: Calendar,
      bgColor: 'bg-amber-50',
      iconColor: 'text-amber-600'
    },
    {
      title: 'Completed Orders',
      value: stats.completedOrders.toLocaleString(),
      icon: CheckCircle2,
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600'
    },
    {
      title: 'Total Revenue',
      value: `${stats.revenue.toLocaleString()}₫`,
      icon: DollarSign,
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600'
    },
  ];

  const quickActions = [
    {
      title: 'Manage Tables',
      description: 'Add, edit, or delete restaurant tables',
      icon: LayoutDashboard,
      route: '/admin/manage-table',
      iconBg: 'bg-teal-50',
      iconColor: 'text-teal-600'
    },
    {
      title: 'Manage Menu',
      description: 'Update menu items and pricing',
      icon: UtensilsCrossed,
      route: '/admin/manage-menu',
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-600'
    },
    {
      title: 'Manage Orders',
      description: 'View and manage customer orders',
      icon: ShoppingBag,
      route: '/admin/manage-ordering-food',
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Chat with Users',
      description: 'Communicate with customers',
      icon: MessageSquare,
      route: '/admin/chat-with-users',
      iconBg: 'bg-pink-50',
      iconColor: 'text-pink-600'
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Welcome back, Admin 👋
          </h1>
          <p className="text-gray-600 text-lg">
            Here's what's happening with your restaurant today
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-teal-300 hover:shadow-lg transition-all duration-300 hover:transform hover:scale-105"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`${stat.bgColor} p-3 rounded-xl`}>
                    <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                  </div>
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                </div>
                <h3 className="text-gray-600 text-sm font-medium mb-1">{stat.title}</h3>
                <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
              </div>
            );
          })}
        </div>

        {/* Email Subscription Section */}
        <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-2xl p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-teal-100 p-3 rounded-xl">
              <Mail className="w-6 h-6 text-teal-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Email Subscription Management</h2>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <input
              type="email"
              placeholder="Enter email to subscribe"
              className="flex-1 bg-white border border-gray-300 rounded-xl p-4 text-gray-800 placeholder:text-gray-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button
              className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold rounded-xl px-8 py-4 hover:from-teal-600 hover:to-cyan-600 transition-all shadow-md hover:shadow-lg"
              onClick={handleSubscribe}
            >
              Subscribe
            </Button>
          </div>

          {message && (
            <div className={`mt-4 p-4 rounded-xl flex items-center gap-3 ${message.includes('successful')
                ? 'bg-emerald-50 border border-emerald-200'
                : 'bg-red-50 border border-red-200'
              }`}>
              {message.includes('successful') ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <span className={message.includes('successful') ? 'text-emerald-700' : 'text-red-700'}>
                {message}
              </span>
            </div>
          )}
        </div>

        {/* Quick Actions Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Quick Actions</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <div
                key={index}
                onClick={() => navigate(action.route)}
                className="group bg-white border border-gray-200 rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:border-teal-300 hover:transform hover:scale-105 hover:shadow-xl"
              >
                <div className={`${action.iconBg} w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-7 h-7 ${action.iconColor}`} />
                </div>

                <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-teal-600 transition-colors">
                  {action.title}
                </h3>

                <p className="text-gray-600 text-sm mb-4">
                  {action.description}
                </p>

                <div className="flex items-center text-teal-600 text-sm font-medium group-hover:gap-2 transition-all">
                  <span>Open</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

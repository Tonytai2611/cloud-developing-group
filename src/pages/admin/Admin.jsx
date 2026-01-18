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
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';

export default function Admin() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
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

  // Get user info from AuthProvider
  useEffect(() => {
    if (!authLoading) {
      if (user) {
        setData(user);
        if (!user.isAdmin && user.role !== 'admin') {
          navigate('/');
        }
      } else {
        navigate('/');
      }
      setLoading(false);
    }
  }, [user, authLoading, navigate]);

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-teal-50/30 to-purple-50/20">
      <AdminHeader />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Welcome Section with Gradient */}
        <div className="mb-10 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-purple-500/10 rounded-3xl blur-3xl"></div>
          <div className="relative">
            <h1 className="text-5xl font-extrabold bg-gradient-to-r from-teal-600 to-purple-600 bg-clip-text text-transparent mb-3">
              Welcome back, Admin 👋
            </h1>
            <p className="text-gray-600 text-lg font-medium">
              Here's what's happening with your restaurant today
            </p>
          </div>
        </div>

        {/* Statistics Cards with Gradients */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            const gradients = [
              'from-blue-500 to-cyan-500',
              'from-amber-500 to-orange-500',
              'from-emerald-500 to-teal-500',
              'from-purple-500 to-pink-500'
            ];
            return (
              <div
                key={index}
                className="group relative bg-white rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden"
              >
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${gradients[index]} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>

                {/* Content */}
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`bg-gradient-to-br ${gradients[index]} p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex flex-col items-end">
                      <TrendingUp className={`w-5 h-5 text-emerald-500 animate-bounce`} />
                      <span className="text-xs text-emerald-600 font-semibold mt-1">+12%</span>
                    </div>
                  </div>
                  <h3 className="text-gray-500 text-sm font-semibold mb-2 uppercase tracking-wide">{stat.title}</h3>
                  <p className="text-4xl font-black bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    {stat.value}
                  </p>
                </div>

                {/* Decorative Elements */}
                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-gradient-to-br from-white/50 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Quick Actions</h2>
          <p className="text-gray-600">Manage your restaurant efficiently</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            const gradients = [
              { bg: 'from-teal-500 to-cyan-500', hover: 'group-hover:from-teal-600 group-hover:to-cyan-600' },
              { bg: 'from-orange-500 to-red-500', hover: 'group-hover:from-orange-600 group-hover:to-red-600' },
              { bg: 'from-blue-500 to-indigo-500', hover: 'group-hover:from-blue-600 group-hover:to-indigo-600' },
              { bg: 'from-pink-500 to-purple-500', hover: 'group-hover:from-pink-600 group-hover:to-purple-600' }
            ];
            return (
              <div
                key={index}
                onClick={() => navigate(action.route)}
                className="group relative bg-white rounded-3xl p-8 cursor-pointer transition-all duration-500 hover:shadow-2xl hover:-translate-y-3 overflow-hidden"
              >
                {/* Gradient Border Effect */}
                <div className={`absolute inset-0 bg-gradient-to-br ${gradients[index].bg} ${gradients[index].hover} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl`}></div>
                <div className="absolute inset-[2px] bg-white rounded-3xl"></div>

                {/* Content */}
                <div className="relative z-10">
                  <div className={`bg-gradient-to-br ${gradients[index].bg} w-16 h-16 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>

                  <h3 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-teal-600 group-hover:to-purple-600 group-hover:bg-clip-text transition-all">
                    {action.title}
                  </h3>

                  <p className="text-gray-600 text-sm mb-5 leading-relaxed">
                    {action.description}
                  </p>

                  <div className={`flex items-center text-transparent bg-gradient-to-r ${gradients[index].bg} bg-clip-text font-bold text-sm group-hover:gap-2 transition-all`}>
                    <span>Open</span>
                    <ChevronRight className={`w-5 h-5 text-teal-600 group-hover:translate-x-2 transition-transform duration-300`} />
                  </div>
                </div>

                {/* Decorative Circles */}
                <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${gradients[index].bg} rounded-full opacity-10 group-hover:scale-150 group-hover:opacity-20 transition-all duration-700`}></div>
                <div className={`absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-br ${gradients[index].bg} rounded-full opacity-10 group-hover:scale-150 group-hover:opacity-20 transition-all duration-700`}></div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

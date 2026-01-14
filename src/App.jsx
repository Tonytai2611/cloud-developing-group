import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/application_component/Header';
import Footer from './components/application_component/Footer';
import UserChatPage from './pages/UserChatPage';
import Signup from './components/auth/Signup';
import Home from './pages/Home';
import Menu from './pages/Menu';
import ContactUs from './pages/ContactUs';
import Booking from './pages/Booking';
import Table from './pages/Table';
import UserProfile from './pages/UserProfile';
import VerifyEmail from './pages/VerifyEmail';
import Admin from './pages/admin/Admin';
import AdminManageMenu from './pages/admin/AdminManageMenuCategory';
import AdminManageTable from './pages/admin/AdminManageTable';
import AdminManageOrderingFood from './pages/admin/AdminManageOrderingFood';
import AdminChatWithUsers from './pages/admin/AdminChatWithUsers';
import AdminMenuCategoryForm from './pages/admin/AdminMenuCategoryForm';
import { Toaster } from 'sonner';
import './App.css';

// Layout component để xử lý conditional header/footer
function Layout({ children }) {
  const location = useLocation();

  const noHeaderPages = [
    "/admin",
    "/admin/manage-menu/form",
    "/admin/manage-table/form",
    "/admin/manage-users",
    "/admin/manage-menu",
    "/admin/manage-ordering-food",
    "/admin/manage-table",
    "/admin/chat-with-users"
  ];

  const excludedChatboxPages = ["/user-profile", "/register"];

  const showHeader = !noHeaderPages.includes(location.pathname);
  const showChatbox = !excludedChatboxPages.includes(location.pathname);
  const paddingTopClass = showHeader ? "pt-[70px]" : "";

  return (
    <div className="min-h-screen bg-slate-100 text-black">
      <Toaster position="top-right" richColors closeButton />
      {showHeader && <Header />}
      <div className={paddingTopClass}>
        {children}
      </div>
      {showHeader && <Footer />}
      {/* UserChat removed - now using /chat page */}
    </div>
  );
}

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/contact-us" element={<ContactUs />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/table" element={<Table />} />
          <Route path="/user-profile" element={<UserProfile />} />
          <Route path="/register" element={<Signup />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/chat" element={<UserChatPage />} />

          {/* Admin routes */}
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/manage-menu" element={<AdminManageMenu />} />
          <Route path="/admin/manage-menu/form" element={<AdminMenuCategoryForm />} />
          <Route path="/admin/manage-table" element={<AdminManageTable />} />
          <Route path="/admin/manage-ordering-food" element={<AdminManageOrderingFood />} />
          <Route path="/admin/chat-with-users" element={<AdminChatWithUsers />} />

          {/* Redirect unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;

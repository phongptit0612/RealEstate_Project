import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Favorites from './pages/Dashboard/Favorites';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import VerifyOTP from './pages/Auth/VerifyOTP';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import DashboardLayout from './components/DashboardLayout';
import ManageListings from './pages/Dashboard/ManageListings';
import CreateListing from './pages/Dashboard/CreateListing';
import EditListing from './pages/Dashboard/EditListing';
import Inbox from './pages/Dashboard/Inbox';
import Profile from './pages/Dashboard/Profile';
import Properties from './pages/Properties';
import PropertyDetail from './pages/PropertyDetail';
import AdminLayout from './pages/Admin/AdminLayout';
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminListings from './pages/Admin/AdminListings';
import AdminUsers from './pages/Admin/AdminUsers';
import AdminReports from './pages/Admin/AdminReports';
import AdminCategories from './pages/Admin/AdminCategories';
import useUserStore from './store/userStore';
import useFavoriteStore from './store/favoriteStore';
import useCurrencyStore from './store/currencyStore';
import useLanguageStore from './store/languageStore';
import Pricing from './pages/Subscription/Pricing';
import SubscriptionSuccess from './pages/Subscription/SubscriptionSuccess';
import SubscriptionCancel from './pages/Subscription/SubscriptionCancel';
import MySubscriptions from './pages/Dashboard/MySubscriptions';
import ActivityHistory from './pages/Dashboard/ActivityHistory';
import Agencies from './pages/Agencies';

// Guard: requires login
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useUserStore();
  if (loading) return null;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Guard: requires admin role
const AdminRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useUserStore();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/dashboard/properties" replace />;
  return children;
};

function App() {
  const checkAuth = useUserStore(state => state.checkAuth);
  const { isAuthenticated } = useUserStore();
  const loadFavorites = useFavoriteStore(s => s.loadFavorites);
  const fetchRates = useCurrencyStore(s => s.fetchRates);
  const preferredCurrency = useCurrencyStore(s => s.preferredCurrency);
  const setLanguageFromCurrency = useLanguageStore(s => s.setLanguageFromCurrency);

  // Bootstrap: auth + exchange rates on mount
  useEffect(() => {
    checkAuth();
    fetchRates();
  }, [checkAuth, fetchRates]);

  // Auto-switch language whenever currency changes (VND → vi, others → en)
  useEffect(() => {
    setLanguageFromCurrency(preferredCurrency);
  }, [preferredCurrency, setLanguageFromCurrency]);

  // Load favorite IDs whenever auth state changes
  useEffect(() => {
    if (isAuthenticated) loadFavorites();
  }, [isAuthenticated, loadFavorites]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/properties" element={<Properties />} />
        <Route path="/properties/:id" element={<PropertyDetail />} />
        <Route path="/agencies" element={<Agencies />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/subscription/success" element={<SubscriptionSuccess />} />
        <Route path="/subscription/cancel" element={<SubscriptionCancel />} />

        {/* User Dashboard */}
        <Route path="/dashboard" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
          <Route path="properties" element={<ManageListings />} />
          <Route path="create" element={<CreateListing />} />
          <Route path="edit/:id" element={<EditListing />} />
          <Route path="favorites" element={<Favorites />} />
          <Route path="inbox" element={<Inbox />} />
          <Route path="subscriptions" element={<MySubscriptions />} />
          <Route path="activity" element={<ActivityHistory />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* Admin Panel */}
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="listings" element={<AdminListings />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="categories" element={<AdminCategories />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

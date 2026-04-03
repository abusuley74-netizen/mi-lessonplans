import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminProfileManager from '../components/AdminProfileManager';
import UserManagement from '../components/UserManagement';
import PesaPalTransactionManager from '../components/PesaPalTransactionManager';
import ReferralRegistry from '../components/ReferralRegistry';
import AdminReferAndEarn from '../components/AdminReferAndEarn';

const AdminRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<div>Dashboard Home</div>} />
      <Route path="/dashboard" element={<div>Dashboard Home</div>} />
      <Route path="/profiles" element={<AdminProfileManager />} />
      <Route path="/users" element={<UserManagement />} />
      <Route path="/referral-registry" element={<ReferralRegistry />} />
      <Route path="/refer-and-earn" element={<AdminReferAndEarn />} />
      <Route path="/content" element={<div>Content Management</div>} />
      <Route path="/analytics" element={<div>Analytics</div>} />
      <Route path="/reports" element={<div>Advanced Reports</div>} />
      <Route path="/subscriptions" element={<PesaPalTransactionManager />} />
      <Route path="/templates" element={<div>Template Management</div>} />
      <Route path="/communication" element={<div>Communication</div>} />
      <Route path="/promo" element={<div>Promo Banner</div>} />
    </Routes>
  );
};

export default AdminRoutes;
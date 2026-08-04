import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PublicSite from './pages/PublicSite';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
// import AdminRoute from './pages/admin/AdminRoute';

// TEMPORARY: the /admin route below skips the AdminRoute login gate, so
// anyone with the URL can view/edit events and applicant personal info.
// Re-wrap <AdminDashboard /> with <AdminRoute>...</AdminRoute> (and
// re-enable the import above) before this goes live.

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<PublicSite />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

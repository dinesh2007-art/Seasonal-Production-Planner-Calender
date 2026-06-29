
import { useState, useEffect, useCallback } from 'react';
import { supabase } from './lib/supabase';
import { calculateCapacityMetrics } from './lib/capacityEngine';
import Layout from './components/Layout';
import Toast from './components/Toast';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import EntryForm from './pages/EntryForm';
import DetailView from './pages/DetailView';
import Reports from './pages/Reports';
import Orders from './pages/Orders';
import Inventory from './pages/Inventory';
import Requirements from './pages/Requirements';
import AdminConfig from './pages/AdminConfig';
import Login from './pages/Login';



export default function App() {
  const [page, setPage] = useState('home');
  const [editPlan, setEditPlan] = useState(null);
  const [detailPlan, setDetailPlan] = useState(null);
  const [toast, setToast] = useState(null);
  const [alertCount, setAlertCount] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem('sharadha_admin_logged_in') === 'true'
  );

  const loadAlertCount = useCallback(async () => {
    const { data } = await supabase.from('production_plans').select('*').in('status', ['planned', 'active']);
    const count = (data || []).filter(p => calculateCapacityMetrics(p).alertLevel !== 'none').length;
    setAlertCount(count);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadAlertCount();
    }
  }, [isAuthenticated, loadAlertCount]);

  const handleLoginSuccess = () => {
    localStorage.setItem('sharadha_admin_logged_in', 'true');
    setIsAuthenticated(true);
    setPage('home');
  };

  const handleLogout = () => {
    localStorage.removeItem('sharadha_admin_logged_in');
    setIsAuthenticated(false);
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    loadAlertCount();
  };

  const navigate = pg => {
    setPage(pg);
    setEditPlan(null);
    setDetailPlan(null);
  };

  const handleEdit = plan => {
    setEditPlan(plan);
    setDetailPlan(null);
    setPage('entry');
  };

  const handleDetail = plan => {
    setDetailPlan(plan);
    setPage('detail');
  };

  const handleFormSuccess = msg => {
    showToast(msg, 'success');
    setEditPlan(null);
    setPage('dashboard');
  };

  const renderPage = () => {
    if (page === 'detail' && detailPlan) {
      return <DetailView plan={detailPlan} onBack={() => navigate('dashboard')} onEdit={handleEdit} />;
    }
    if (page === 'entry') {
      return <EntryForm editData={editPlan} onSuccess={handleFormSuccess} onCancel={() => navigate(editPlan ? 'dashboard' : 'dashboard')} />;
    }
    switch (page) {
      case 'dashboard': return <Dashboard onEdit={handleEdit} onDetail={handleDetail} onNew={() => { setEditPlan(null); setPage('entry'); }} onToast={showToast} />;
      case 'reports': return <Reports />;
      case 'orders': return <Orders onToast={showToast} />;
      case 'inventory': return <Inventory onToast={showToast} />;
      case 'requirements': return <Requirements onToast={showToast} />;
      case 'admin': return <AdminConfig onToast={showToast} />;
      default: return <Home onNavigate={navigate} onDetail={handleDetail} />;
    }
  };

  const navPage = page === 'entry' || page === 'detail' ? 'dashboard' : page;

  if (!isAuthenticated) {
    return (
      <>
        <Login onLoginSuccess={handleLoginSuccess} />
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </>
    );
  }

  return (
    <>
      <Layout currentPage={navPage} onNavigate={navigate} alerts={alertCount} onLogout={handleLogout}>
        {renderPage()}
      </Layout>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}

import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, PlusCircle, BarChart3, Settings, 
  ChevronRight, ClipboardList, Database, Sparkles 
} from "lucide-react";

import PlanningDashboard from "./components/PlanningDashboard";
import PlanningEntryForm from "./components/PlanningEntryForm";
import DetailHistoryView from "./components/DetailHistoryView";
import ReportsAnalytics from "./components/ReportsAnalytics";
import AdminConfiguration from "./components/AdminConfiguration";

const API_BASE = "http://localhost:3000";

export default function App() {
  const [view, setView] = useState("dashboard"); // dashboard, form, detail, reports, admin
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [editPlan, setEditPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiStatus, setApiStatus] = useState({ label: "Checking API", class: "" });

  const fetchPlans = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/seasonal_production_planning`);
      if (!response.ok) throw new Error("Failed to load plans from backend.");
      const result = await response.json();
      setPlans(result.data || []);
      setApiStatus({ label: "API Online", class: "ok" });
    } catch (err) {
      setPlans([]);
      setApiStatus({ label: "API Offline", class: "" });
      setError("Start the backend server to load and save plans.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleSelectPlan = (id) => {
    setSelectedPlanId(id);
    setView("detail");
  };

  const handleEditPlan = (plan) => {
    setEditPlan(plan);
    setView("form");
  };

  const handleCreateNewClick = () => {
    setEditPlan(null);
    setView("form");
  };

  const handleSaveSuccess = () => {
    fetchPlans();
    setView("dashboard");
  };

  // Dynamic Page Title & Breadcrumbs based on active view
  const getPageMeta = () => {
    switch (view) {
      case "dashboard":
        return {
          title: "Plans Dashboard",
          breadcrumbs: [{ label: "Sharadha Stores", active: false }, { label: "Dashboard", active: true }]
        };
      case "form":
        return {
          title: editPlan ? "Edit Festival Plan" : "Create Festival Plan",
          breadcrumbs: [
            { label: "Dashboard", active: false, action: () => setView("dashboard") },
            { label: editPlan ? "Edit Plan" : "Create Plan", active: true }
          ]
        };
      case "detail":
        return {
          title: "Plan Detail & History",
          breadcrumbs: [
            { label: "Dashboard", active: false, action: () => setView("dashboard") },
            { label: "Plan Detail", active: true }
          ]
        };
      case "reports":
        return {
          title: "Reports & Analytics",
          breadcrumbs: [{ label: "Dashboard", active: false, action: () => setView("dashboard") }, { label: "Reports", active: true }]
        };
      case "admin":
        return {
          title: "Admin Settings",
          breadcrumbs: [{ label: "Dashboard", active: false, action: () => setView("dashboard") }, { label: "Configuration", active: true }]
        };
      default:
        return { title: "Production Calendar", breadcrumbs: [] };
    }
  };

  const pageMeta = getPageMeta();

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="brand-section">
          <div className="brand-logo">
            <Sparkles size={20} />
          </div>
          <div>
            <h1 className="brand-name">Sharadha Stores</h1>
            <p className="brand-sub">Production Calendar</p>
          </div>
        </div>

        <nav className="nav-links">
          <li className={`nav-item ${view === "dashboard" ? "active" : ""}`}>
            <button onClick={() => setView("dashboard")}>
              <LayoutDashboard size={18} /> Dashboard
            </button>
          </li>
          <li className={`nav-item ${view === "form" && !editPlan ? "active" : ""}`}>
            <button onClick={handleCreateNewClick}>
              <PlusCircle size={18} /> Add New Plan
            </button>
          </li>
          <li className={`nav-item ${view === "reports" ? "active" : ""}`}>
            <button onClick={() => setView("reports")}>
              <BarChart3 size={18} /> Reports & Analytics
            </button>
          </li>
          <li className={`nav-item ${view === "admin" ? "active" : ""}`}>
            <button onClick={() => setView("admin")}>
              <Settings size={18} /> Admin Settings
            </button>
          </li>
        </nav>

        <div className="sidebar-footer">
          <span className={`status-chip ${apiStatus.class}`}>
            <span className="dot"></span>
            {apiStatus.label}
          </span>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="main-content">
        <header className="topbar">
          <div className="page-title-group">
            <nav className="breadcrumbs">
              {pageMeta.breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <span className="breadcrumb-separator"><ChevronRight size={12} /></span>}
                  {crumb.action ? (
                    <span 
                      onClick={crumb.action} 
                      style={{ cursor: "pointer", textDecoration: "underline" }}
                      title="Navigate"
                    >
                      {crumb.label}
                    </span>
                  ) : (
                    <span className={crumb.active ? "breadcrumb-active" : ""}>
                      {crumb.label}
                    </span>
                  )}
                </React.Fragment>
              ))}
            </nav>
            <h1>{pageMeta.title}</h1>
          </div>
        </header>

        <section className="page-container">
          {view === "dashboard" && (
            <PlanningDashboard 
              plans={plans} 
              onSelectPlan={handleSelectPlan} 
              onEditPlan={handleEditPlan} 
              isLoading={isLoading} 
              error={error}
              onRefresh={fetchPlans}
            />
          )}

          {view === "form" && (
            <PlanningEntryForm 
              editPlan={editPlan} 
              onSaveSuccess={handleSaveSuccess} 
              onCancel={() => setView("dashboard")} 
              API_BASE={API_BASE}
            />
          )}

          {view === "detail" && (
            <DetailHistoryView 
              planId={selectedPlanId} 
              onBack={() => setView("dashboard")} 
              onEdit={handleEditPlan}
              API_BASE={API_BASE}
            />
          )}

          {view === "reports" && (
            <ReportsAnalytics plans={plans} />
          )}

          {view === "admin" && (
            <AdminConfiguration />
          )}
        </section>
      </main>
    </div>
  );
}

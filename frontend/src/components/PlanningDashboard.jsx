import React, { useState } from "react";
import { Search, Eye, Edit, ClipboardList, Activity, CheckCircle, AlertTriangle } from "lucide-react";

export default function PlanningDashboard({ plans, onSelectPlan, onEditPlan, isLoading, error, onRefresh }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const getConfig = () => {
    const saved = localStorage.getItem("sharadha_stores_config");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return { highRiskThreshold: 100, mediumRiskThreshold: 85 };
  };
  const config = getConfig();

  // 1. Calculate Utilisation and Risk for each plan
  const plansWithCalculations = plans.map((plan) => {
    const expected = Number(plan.expectedOrderVolume || 0);
    const capacity = Number(plan.productionCapacityPerDay || 0);
    const batches = Number(plan.batches || 0);
    
    let utilisation = 0;
    if (expected > 0 && capacity > 0 && batches > 0) {
      utilisation = Math.round((expected / (batches * capacity)) * 100);
    }

    let riskLevel = "low";
    if (utilisation > config.highRiskThreshold) {
      riskLevel = "high";
    } else if (utilisation >= config.mediumRiskThreshold) {
      riskLevel = "medium";
    }

    return {
      ...plan,
      utilisation,
      riskLevel
    };
  });

  // 2. Metrics calculation
  const totalPlans = plans.length;
  const activePlans = plans.filter((p) => p.status === "active").length;
  
  const highRiskPlans = plansWithCalculations.filter(
    (p) => p.riskLevel === "high" && p.status !== "completed" && p.status !== "archived"
  ).length;

  const validUtilisations = plansWithCalculations
    .filter((p) => p.status !== "archived")
    .map((p) => p.utilisation);
  
  const avgUtilisation = validUtilisations.length
    ? Math.round(validUtilisations.reduce((a, b) => a + b, 0) / validUtilisations.length)
    : 0;

  // 3. Filter and search plans
  const filteredPlans = plansWithCalculations.filter((plan) => {
    const matchesSearch = plan.admin.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          plan.planName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          plan.productionItem.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    return plan.status === activeTab && matchesSearch;
  });

  return (
    <div>
      {/* Metrics Summary cards */}
      <div className="dashboard-grid">
        <div className="metric-card">
          <div className="metric-icon blue">
            <ClipboardList size={22} />
          </div>
          <div className="metric-details">
            <p>Total Plans</p>
            <h3>{totalPlans}</h3>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon orange">
            <Activity size={22} />
          </div>
          <div className="metric-details">
            <p>Active Plans</p>
            <h3>{activePlans}</h3>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon rose">
            <AlertTriangle size={22} />
          </div>
          <div className="metric-details">
            <p>High Risk Plans</p>
            <h3>{highRiskPlans}</h3>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon emerald">
            <CheckCircle size={22} />
          </div>
          <div className="metric-details">
            <p>Avg Utilisation</p>
            <h3>{avgUtilisation}%</h3>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <h2>Seasonal Production Planning Dashboard</h2>
            <p>Monitor festival plans, capacity stress, and track execution status.</p>
          </div>
          <button onClick={onRefresh} className="secondary small" type="button">
            Refresh
          </button>
        </div>

        {/* Filters and search toolbar */}
        <div className="dashboard-toolbar">
          <div className="filter-tabs">
            {["all", "planned", "active", "completed", "archived"].map((tab) => (
              <button
                key={tab}
                className={`filter-tab ${activeTab === tab ? "active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="search-box">
            <Search className="search-icon" size={16} />
            <input
              type="text"
              placeholder="Search by admin or plan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="form-message error" style={{ marginBottom: "1.5rem" }}>
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Loading state */}
        {isLoading ? (
          <div className="spinner-container">
            <div className="spinner"></div>
            <span>Loading production plans...</span>
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="empty-state">
            <ClipboardList className="empty-state-icon" size={40} />
            <p>No production plans found.</p>
            {plans.length > 0 && <small>Try adjusting your search or filter criteria.</small>}
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Admin</th>
                  <th>Plan Name</th>
                  <th>Production Item</th>
                  <th>Batches</th>
                  <th>Utilisation</th>
                  <th>Risk Status</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlans.map((plan) => (
                  <tr key={plan.id}>
                    <td><strong>{plan.admin}</strong></td>
                    <td>{plan.planName}</td>
                    <td>{plan.productionItem}</td>
                    <td>{plan.batches} batches</td>
                    <td>{plan.utilisation}%</td>
                    <td>
                      <span className={`badge risk-${plan.riskLevel}`}>
                        {plan.riskLevel} Risk
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${plan.status}`}>
                        {plan.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                          onClick={() => onSelectPlan(plan.id)}
                          className="secondary small"
                          title="View Detail & History"
                        >
                          <Eye size={14} /> Detail
                        </button>
                        <button
                          onClick={() => onEditPlan(plan)}
                          className="secondary small"
                          title="Edit Plan"
                        >
                          <Edit size={14} /> Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

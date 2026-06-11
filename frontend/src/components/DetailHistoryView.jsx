import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, Printer, TrendingUp, AlertTriangle, Play, CheckCircle, 
  Archive, FileText, ShoppingBag, Box, Plus, Calendar, User
} from "lucide-react";

export default function DetailHistoryView({ planId, onBack, onEdit, API_BASE, apiFetch }) {
  const [plan, setPlan] = useState(null);
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Forms for adding links
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [newOrder, setNewOrder] = useState({ order_volume: "", status: "pending" });
  const [orderMessage, setOrderMessage] = useState(null);

  const [showInventoryForm, setShowInventoryForm] = useState(false);
  const [newInventory, setNewInventory] = useState({ 
    ingredient_name: "", available_quantity: 0, required_quantity: "", unit: "kg", status: "pending" 
  });
  const [inventoryMessage, setInventoryMessage] = useState(null);

  // Load everything
  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch Plan Details
      const planRes = await apiFetch(`/api/seasonal_production_planning/${planId}`);
      if (!planRes.ok) throw new Error("Failed to fetch plan details.");
      const planJson = await planRes.json();
      setPlan(planJson.data);

      // 2. Fetch Orders linked to this plan
      const ordersRes = await apiFetch(`/api/orders?seasonal_production_planning_id=${planId}`);
      const ordersJson = await ordersRes.json();
      setOrders(ordersJson.data || []);

      // 3. Fetch Inventory linked to this plan
      const invRes = await apiFetch(`/api/inventory?seasonal_production_planning_id=${planId}`);
      const invJson = await invRes.json();
      setInventory(invJson.data || []);
    } catch (err) {
      setError(err.message || "Failed to load details.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [planId]);

  const handleStatusChange = async (newStatus) => {
    if (!window.confirm(`Are you sure you want to change status to "${newStatus}"?`)) return;

    try {
      const response = await apiFetch(`/api/seasonal_production_planning/${planId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Failed to update status.");
      
      setPlan(result.data);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddOrder = async (e) => {
    e.preventDefault();
    if (!newOrder.order_volume || Number(newOrder.order_volume) <= 0) {
      setOrderMessage({ type: "error", text: "Order volume must be greater than zero." });
      return;
    }
    
    try {
      const response = await apiFetch(`/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seasonal_production_planning_id: planId,
          admin: plan.admin,
          planName: plan.planName,
          productionItem: plan.productionItem,
          order_volume: Number(newOrder.order_volume),
          status: newOrder.status
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Failed to add order.");

      setOrders((prev) => [...prev, result.data]);
      setNewOrder({ order_volume: "", status: "pending" });
      setShowOrderForm(false);
      setOrderMessage(null);
    } catch (err) {
      setOrderMessage({ type: "error", text: err.message });
    }
  };

  const handleAddInventory = async (e) => {
    e.preventDefault();
    if (!newInventory.ingredient_name.trim() || !newInventory.required_quantity || Number(newInventory.required_quantity) <= 0) {
      setInventoryMessage({ type: "error", text: "Ingredient name and required quantity are required." });
      return;
    }
    
    try {
      const response = await apiFetch(`/api/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seasonal_production_planning_id: planId,
          admin: plan.admin,
          ingredient_name: newInventory.ingredient_name,
          available_quantity: Number(newInventory.available_quantity || 0),
          required_quantity: Number(newInventory.required_quantity),
          unit: newInventory.unit,
          status: Number(newInventory.available_quantity) >= Number(newInventory.required_quantity) ? "available" : "pending"
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Failed to add inventory.");

      setInventory((prev) => [...prev, result.data]);
      setNewInventory({ ingredient_name: "", available_quantity: 0, required_quantity: "", unit: "kg", status: "pending" });
      setShowInventoryForm(false);
      setInventoryMessage(null);
    } catch (err) {
      setInventoryMessage({ type: "error", text: err.message });
    }
  };

  if (isLoading) {
    return (
      <div className="panel spinner-container">
        <div className="spinner"></div>
        <span>Fetching details...</span>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="panel empty-state">
        <AlertTriangle size={32} className="error-color" />
        <p>{error || "Seasonal plan not found."}</p>
        <button onClick={onBack} className="primary small"><ArrowLeft size={14} /> Back to Dashboard</button>
      </div>
    );
  }

  // 1. Local Capacity & Utilisation Calculations
  const expected = Number(plan.expectedOrderVolume || 0);
  const capacity = Number(plan.productionCapacityPerDay || 0);
  const batches = Number(plan.batches || 0);
  
  const daysRequired = Math.ceil(expected / capacity);
  const batchUtilisation = Math.round((expected / (batches * capacity)) * 100);

  // Load custom thresholds
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

  let riskLevel = "low";
  let recommendation = "Current capacity can support the expected order volume.";
  if (batchUtilisation > config.highRiskThreshold) {
    riskLevel = "high";
    recommendation = "Increase batches or daily capacity before confirming this festival plan.";
  } else if (batchUtilisation >= config.mediumRiskThreshold) {
    riskLevel = "medium";
    recommendation = "Utilisation is approaching limit. Monitor capacity or consider preparing ingredients early.";
  }

  return (
    <div>
      {/* Top Header Navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <button onClick={onBack} className="secondary small">
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={() => window.print()} className="secondary small">
            <Printer size={16} /> Print Sheet
          </button>
          <button onClick={() => onEdit(plan)} className="primary small">
            Edit details
          </button>
        </div>
      </div>

      <div className="detail-grid">
        {/* Left Side - Details */}
        <div className="panel">
          <div className="panel-heading" style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <h2>{plan.planName}</h2>
                <span className={`badge ${plan.status}`}>{plan.status}</span>
              </div>
              <p style={{ marginTop: "0.25rem" }}>Created on: {new Date(plan.created_at).toLocaleDateString()}</p>
            </div>
            
            {/* Status transitions actions */}
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {plan.status === "planned" && (
                <button onClick={() => handleStatusChange("active")} className="primary small" style={{ backgroundColor: "var(--warning-color)" }}>
                  <Play size={12} /> Start Plan
                </button>
              )}
              {plan.status === "active" && (
                <button onClick={() => handleStatusChange("completed")} className="primary small" style={{ backgroundColor: "var(--success-color)" }}>
                  <CheckCircle size={12} /> Complete Plan
                </button>
              )}
              {plan.status !== "archived" && (
                <button onClick={() => handleStatusChange("archived")} className="secondary small danger">
                  <Archive size={12} /> Archive
                </button>
              )}
            </div>
          </div>

          <div className="detail-info-list">
            <div className="detail-info-item">
              <p className="label"><User size={12} style={{ verticalAlign: "middle", marginRight: "3px" }} /> Admin Coordinator</p>
              <p className="val">{plan.admin}</p>
            </div>
            <div className="detail-info-item">
              <p className="label"><Box size={12} style={{ verticalAlign: "middle", marginRight: "3px" }} /> Production Item</p>
              <p className="val">{plan.productionItem}</p>
            </div>
            <div className="detail-info-item">
              <p className="label"><Calendar size={12} style={{ verticalAlign: "middle", marginRight: "3px" }} /> Upcoming Festival</p>
              <p className="val">{plan.upcomingFestival}</p>
            </div>
            <div className="detail-info-item">
              <p className="label">Planned Batches</p>
              <p className="val">{plan.batches} batches</p>
            </div>
            <div className="detail-info-item">
              <p className="label">Expected Order Volume</p>
              <p className="val">{plan.expectedOrderVolume} units/kg</p>
            </div>
            <div className="detail-info-item">
              <p className="label">Daily Production Capacity</p>
              <p className="val">{plan.productionCapacityPerDay} units/day</p>
            </div>
            <div className="detail-info-item">
              <p className="label">Procurement Start Date</p>
              <p className="val">{new Date(plan.ingredientProcurementStartDate).toLocaleDateString()}</p>
            </div>
            <div className="detail-info-item">
              <p className="label">Production Start Date</p>
              <p className="val">{new Date(plan.productionStartDate).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Linked Orders Section */}
          <div className="sub-panel">
            <div className="sub-panel-title">
              <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <ShoppingBag size={18} /> Linked Orders
              </span>
              <button onClick={() => setShowOrderForm(!showOrderForm)} className="secondary small">
                <Plus size={14} /> Add Order
              </button>
            </div>

            {showOrderForm && (
              <form onSubmit={handleAddOrder} className="inline-form">
                <label style={{ gridColumn: "span 1" }}>
                  Order Volume (units/kg)
                  <input 
                    type="number" 
                    value={newOrder.order_volume} 
                    onChange={e => setNewOrder(prev => ({ ...prev, order_volume: e.target.value }))}
                    placeholder="120"
                    required
                  />
                </label>
                <label style={{ gridColumn: "span 1" }}>
                  Status
                  <select 
                    value={newOrder.status} 
                    onChange={e => setNewOrder(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </label>
                <button type="submit" className="primary small">Save</button>
                {orderMessage && <p className="error-msg" style={{ gridColumn: "span 3" }}>{orderMessage.text}</p>}
              </form>
            )}

            {orders.length === 0 ? (
              <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", padding: "1rem 0" }}>No orders linked to this plan.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Order Volume</th>
                      <th>Status</th>
                      <th>Created At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id}>
                        <td>#{o.id}</td>
                        <td>{o.orderVolume} units/kg</td>
                        <td><span className={`badge ${o.status}`}>{o.status}</span></td>
                        <td>{new Date(o.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Linked Inventory Section */}
          <div className="sub-panel">
            <div className="sub-panel-title">
              <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Box size={18} /> Required Ingredients Inventory
              </span>
              <button onClick={() => setShowInventoryForm(!showInventoryForm)} className="secondary small">
                <Plus size={14} /> Add Ingredient
              </button>
            </div>

            {showInventoryForm && (
              <form onSubmit={handleAddInventory} className="inline-form">
                <label>
                  Ingredient Name
                  <input 
                    type="text" 
                    value={newInventory.ingredient_name} 
                    onChange={e => setNewInventory(prev => ({ ...prev, ingredient_name: e.target.value }))}
                    placeholder="Ghee / Besan"
                    required
                  />
                </label>
                <label>
                  Required Qty
                  <input 
                    type="number" 
                    value={newInventory.required_quantity} 
                    onChange={e => setNewInventory(prev => ({ ...prev, required_quantity: e.target.value }))}
                    placeholder="80"
                    required
                  />
                </label>
                <label>
                  Available Qty
                  <input 
                    type="number" 
                    value={newInventory.available_quantity} 
                    onChange={e => setNewInventory(prev => ({ ...prev, available_quantity: e.target.value }))}
                    placeholder="50"
                  />
                </label>
                <label>
                  Unit
                  <input 
                    type="text" 
                    value={newInventory.unit} 
                    onChange={e => setNewInventory(prev => ({ ...prev, unit: e.target.value }))}
                    placeholder="kg / litres"
                    style={{ minWidth: "60px" }}
                  />
                </label>
                <button type="submit" className="primary small">Save</button>
                {inventoryMessage && <p className="error-msg" style={{ gridColumn: "span 5" }}>{inventoryMessage.text}</p>}
              </form>
            )}

            {inventory.length === 0 ? (
              <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", padding: "1rem 0" }}>No ingredients listed for this plan.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Ingredient</th>
                      <th>Required</th>
                      <th>Available</th>
                      <th>Shortage</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map((i) => {
                      const shortage = Math.max(0, i.requiredQuantity - i.availableQuantity);
                      const statusClass = shortage > 0 ? "planned" : "completed";
                      return (
                        <tr key={i.id}>
                          <td><strong>{i.ingredientName}</strong></td>
                          <td>{i.requiredQuantity} {i.unit}</td>
                          <td>{i.availableQuantity} {i.unit}</td>
                          <td>{shortage > 0 ? `${shortage} ${i.unit}` : "None"}</td>
                          <td>
                            <span className={`badge ${statusClass}`}>
                              {shortage > 0 ? "Pending" : "Available"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Capacity Engine Outputs */}
        <div>
          <div className="capacity-results-panel">
            <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
              <TrendingUp size={20} color="var(--accent-color)" /> Capacity Evaluation
            </h3>

            <div className="capacity-metric">
              <p className="capacity-metric-title">Production Days Required</p>
              <div className="capacity-metric-value">
                {daysRequired} <span className="unit">days</span>
              </div>
              <small style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                Time needed to fulfill expected order volume of {expected} units at {capacity} units/day.
              </small>
            </div>

            <div className="capacity-metric" style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1.5rem" }}>
              <p className="capacity-metric-title">Capacity Stress Utilisation</p>
              <div className="capacity-metric-value" style={{ color: `var(--${riskLevel}-color)` }}>
                {batchUtilisation}%
              </div>
              <div style={{ marginTop: "0.25rem" }}>
                <span className={`badge risk-${riskLevel}`}>{riskLevel} Risk</span>
              </div>
              <small style={{ color: "var(--text-secondary)", fontSize: "0.8rem", display: "block", marginTop: "0.5rem" }}>
                Utilisation stress against planned batches: {batches} batches × {capacity} capacity/day.
              </small>
            </div>

            <div className={`recommendation-box risk-${riskLevel}`}>
              <strong>Recommendation:</strong>
              <p style={{ marginTop: "0.25rem", color: "var(--text-primary)" }}>{recommendation}</p>
            </div>
          </div>

          {/* Audit History Log */}
          <div className="panel" style={{ marginTop: "2rem" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <FileText size={18} /> Action History
            </h3>
            <ul style={{ listStyle: "none", fontSize: "0.85rem", color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <li style={{ borderLeft: "2px solid var(--success-color)", paddingLeft: "0.75rem" }}>
                <span style={{ color: "var(--text-primary)", fontWeight: "600" }}>Plan Created</span>
                <p>Festival plan set up on {new Date(plan.created_at).toLocaleString()}</p>
              </li>
              {new Date(plan.updated_at) > new Date(plan.created_at) && (
                <li style={{ borderLeft: "2px solid var(--accent-color)", paddingLeft: "0.75rem" }}>
                  <span style={{ color: "var(--text-primary)", fontWeight: "600" }}>Details Modified</span>
                  <p>Configuration or status updated on {new Date(plan.updated_at).toLocaleString()}</p>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { Settings, Save, RefreshCw, AlertTriangle } from "lucide-react";

export default function AdminConfiguration() {
  const [config, setConfig] = useState({
    highRiskThreshold: 100,
    mediumRiskThreshold: 85,
    defaultCapacity: 150,
    defaultBatches: 12,
    enableAlerts: true
  });
  
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("sharadha_stores_config");
    if (saved) {
      try {
        setConfig(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse config", e);
      }
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setConfig((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : Number(value)
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (config.mediumRiskThreshold >= config.highRiskThreshold) {
      setMessage({
        type: "error",
        text: "Medium risk threshold must be lower than high risk threshold."
      });
      return;
    }
    if (config.highRiskThreshold <= 0 || config.mediumRiskThreshold <= 0 || config.defaultCapacity <= 0 || config.defaultBatches <= 0) {
      setMessage({
        type: "error",
        text: "All thresholds and values must be greater than zero."
      });
      return;
    }
    
    localStorage.setItem("sharadha_stores_config", JSON.stringify(config));
    setMessage({
      type: "success",
      text: "Configuration saved successfully. Calculations across all plans will update immediately."
    });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleReset = () => {
    const defaults = {
      highRiskThreshold: 100,
      mediumRiskThreshold: 85,
      defaultCapacity: 150,
      defaultBatches: 12,
      enableAlerts: true
    };
    setConfig(defaults);
    localStorage.setItem("sharadha_stores_config", JSON.stringify(defaults));
    setMessage({
      type: "info",
      text: "Configuration reset to default settings."
    });
    setTimeout(() => setMessage(null), 4000);
  };

  return (
    <div className="panel">
      <div className="panel-heading">
        <div>
          <h2>Admin Configuration Panel</h2>
          <p>Adjust the threshold rules and capacity variables used by the calculation engine.</p>
        </div>
        <button onClick={handleReset} className="secondary small" type="button">
          <RefreshCw size={14} /> Reset Defaults
        </button>
      </div>

      <form onSubmit={handleSave} className="form-grid">
        <label>
          High Risk Utilisation Limit (%)
          <input
            type="number"
            name="highRiskThreshold"
            value={config.highRiskThreshold}
            onChange={handleChange}
            min="1"
            required
          />
          <small className="error-msg">Flag plans as high risk if capacity utilisation exceeds this.</small>
        </label>

        <label>
          Medium Risk Utilisation Limit (%)
          <input
            type="number"
            name="mediumRiskThreshold"
            value={config.mediumRiskThreshold}
            onChange={handleChange}
            min="1"
            required
          />
          <small className="error-msg">Flag plans as medium risk if capacity utilisation reaches this.</small>
        </label>

        <label>
          Default Production Capacity Per Day
          <input
            type="number"
            name="defaultCapacity"
            value={config.defaultCapacity}
            onChange={handleChange}
            min="1"
            required
          />
          <small className="error-msg">Pre-filled capacity value for new entry forms.</small>
        </label>

        <label>
          Default Planned Batches
          <input
            type="number"
            name="defaultBatches"
            value={config.defaultBatches}
            onChange={handleChange}
            min="1"
            required
          />
          <small className="error-msg">Pre-filled batches count for new entry forms.</small>
        </label>

        <div className="form-group-full" style={{ marginTop: "1rem" }}>
          <label style={{ flexDirection: "row", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}>
            <input
              type="checkbox"
              name="enableAlerts"
              checked={config.enableAlerts}
              onChange={handleChange}
              style={{ width: "auto" }}
            />
            <span>Enable automated notifications for high risk capacity plans</span>
          </label>
        </div>

        {message && (
          <div className={`form-group-full form-message ${message.type}`}>
            <AlertTriangle size={16} />
            <span>{message.text}</span>
          </div>
        )}

        <div className="form-group-full form-actions">
          <button type="submit" className="primary">
            <Save size={16} /> Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
}

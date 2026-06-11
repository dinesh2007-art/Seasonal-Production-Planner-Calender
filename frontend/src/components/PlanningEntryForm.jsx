import React, { useState, useEffect } from "react";
import { PlusCircle, Save, XCircle, AlertCircle } from "lucide-react";

export default function PlanningEntryForm({ editPlan, onSaveSuccess, onCancel, API_BASE, apiFetch }) {
  // Load defaults from config if available
  const getDefaults = () => {
    const saved = localStorage.getItem("sharadha_stores_config");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          defaultCapacity: parsed.defaultCapacity || 150,
          defaultBatches: parsed.defaultBatches || 12
        };
      } catch (e) {}
    }
    return { defaultCapacity: 150, defaultBatches: 12 };
  };

  const defaults = getDefaults();

  const [formData, setFormData] = useState({
    admin: "",
    planName: "",
    productionItem: "",
    batches: defaults.defaultBatches,
    upcomingFestival: "",
    expectedOrderVolume: "",
    ingredientProcurementStartDate: "",
    productionStartDate: "",
    productionCapacityPerDay: defaults.defaultCapacity,
    status: "planned"
  });

  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [formMessage, setFormMessage] = useState(null);

  // Pre-fill if editing
  useEffect(() => {
    if (editPlan) {
      setFormData({
        admin: editPlan.admin || "",
        planName: editPlan.planName || "",
        productionItem: editPlan.productionItem || "",
        batches: editPlan.batches || "",
        upcomingFestival: editPlan.upcomingFestival || "",
        expectedOrderVolume: editPlan.expectedOrderVolume || "",
        ingredientProcurementStartDate: editPlan.ingredientProcurementStartDate || "",
        productionStartDate: editPlan.productionStartDate || "",
        productionCapacityPerDay: editPlan.productionCapacityPerDay || "",
        status: editPlan.status || "planned"
      });
      setErrors({});
    } else {
      // Set default admin if there was a previous plan
      const savedAdmin = localStorage.getItem("last_used_admin");
      setFormData({
        admin: savedAdmin || "",
        planName: "",
        productionItem: "",
        batches: defaults.defaultBatches,
        upcomingFestival: "",
        expectedOrderVolume: "",
        ingredientProcurementStartDate: "",
        productionStartDate: "",
        productionCapacityPerDay: defaults.defaultCapacity,
        status: "planned"
      });
    }
  }, [editPlan]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};
    const requiredFields = [
      "admin",
      "planName",
      "productionItem",
      "batches",
      "upcomingFestival",
      "expectedOrderVolume",
      "ingredientProcurementStartDate",
      "productionStartDate",
      "productionCapacityPerDay"
    ];

    requiredFields.forEach((field) => {
      if (!String(formData[field] || "").trim()) {
        newErrors[field] = "This field is required.";
      }
    });

    ["batches", "expectedOrderVolume", "productionCapacityPerDay"].forEach((field) => {
      if (formData[field] && Number(formData[field]) <= 0) {
        newErrors[field] = "Enter a value greater than zero.";
      }
    });

    if (
      formData.ingredientProcurementStartDate &&
      formData.productionStartDate &&
      new Date(formData.ingredientProcurementStartDate) > new Date(formData.productionStartDate)
    ) {
      newErrors.ingredientProcurementStartDate = "Procurement must start before or on production start date.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      setFormMessage({
        type: "error",
        text: "Please fix the highlighted fields."
      });
      return;
    }

    setIsSaving(true);
    setFormMessage({ type: "info", text: "Saving plan..." });

    try {
      const path = editPlan
        ? `/api/seasonal_production_planning/${editPlan.id}`
        : `/api/seasonal_production_planning`;

      const method = editPlan ? "PUT" : "POST";

      const response = await apiFetch(path, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to save plan.");
      }

      // Save admin to localStorage for convenience
      localStorage.setItem("last_used_admin", formData.admin);

      setFormMessage({
        type: "success",
        text: editPlan ? "Plan updated successfully!" : "Plan created successfully!"
      });
      
      // Reset form if creating new
      if (!editPlan) {
        setFormData({
          admin: formData.admin, // keep admin name
          planName: "",
          productionItem: "",
          batches: defaults.defaultBatches,
          upcomingFestival: "",
          expectedOrderVolume: "",
          ingredientProcurementStartDate: "",
          productionStartDate: "",
          productionCapacityPerDay: defaults.defaultCapacity,
          status: "planned"
        });
      }

      if (onSaveSuccess) {
        setTimeout(() => {
          onSaveSuccess(result.data);
        }, 1000);
      }
    } catch (error) {
      setFormMessage({
        type: "error",
        text: error.message || "Backend is not reachable. Please start the server."
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="panel">
      <div className="panel-heading">
        <div>
          <h2>{editPlan ? "Edit Production Plan" : "Create Production Plan"}</h2>
          <p>
            {editPlan
              ? `Modifying plan ID: ${editPlan.id}`
              : "Enter details for upcoming festival production with validated capacities."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="form-grid" novalidate>
        <label>
          Admin Name
          <input
            name="admin"
            value={formData.admin}
            onChange={handleChange}
            placeholder="Sharadha Admin"
            required
          />
          <small className="error-msg">{errors.admin}</small>
        </label>

        <label>
          Plan Name
          <input
            name="planName"
            value={formData.planName}
            onChange={handleChange}
            placeholder="Diwali sweets production"
            required
          />
          <small className="error-msg">{errors.planName}</small>
        </label>

        <label>
          Production Item
          <input
            name="productionItem"
            value={formData.productionItem}
            onChange={handleChange}
            placeholder="Mysore Pak, Murukku, Pickle, etc."
            required
          />
          <small className="error-msg">{errors.productionItem}</small>
        </label>

        <label>
          Planned Batches
          <input
            name="batches"
            type="number"
            value={formData.batches}
            onChange={handleChange}
            placeholder="12"
            min="1"
            required
          />
          <small className="error-msg">{errors.batches}</small>
        </label>

        <label>
          Upcoming Festival
          <input
            name="upcomingFestival"
            value={formData.upcomingFestival}
            onChange={handleChange}
            placeholder="Diwali, Pongal, Onam, Navratri"
            required
          />
          <small className="error-msg">{errors.upcomingFestival}</small>
        </label>

        <label>
          Expected Order Volume (units/kg)
          <input
            name="expectedOrderVolume"
            type="number"
            value={formData.expectedOrderVolume}
            onChange={handleChange}
            placeholder="600"
            min="1"
            required
          />
          <small className="error-msg">{errors.expectedOrderVolume}</small>
        </label>

        <label>
          Ingredient Procurement Start Date
          <input
            name="ingredientProcurementStartDate"
            type="date"
            value={formData.ingredientProcurementStartDate}
            onChange={handleChange}
            required
          />
          <small className="error-msg">{errors.ingredientProcurementStartDate}</small>
        </label>

        <label>
          Production Start Date
          <input
            name="productionStartDate"
            type="date"
            value={formData.productionStartDate}
            onChange={handleChange}
            required
          />
          <small className="error-msg">{errors.productionStartDate}</small>
        </label>

        <label>
          Production Capacity Per Day
          <input
            name="productionCapacityPerDay"
            type="number"
            value={formData.productionCapacityPerDay}
            onChange={handleChange}
            placeholder="150"
            min="1"
            required
          />
          <small className="error-msg">{errors.productionCapacityPerDay}</small>
        </label>

        <label>
          Initial Status
          <select name="status" value={formData.status} onChange={handleChange}>
            <option value="planned">Planned</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
          <small className="error-msg"></small>
        </label>

        {formMessage && (
          <div className={`form-group-full form-message ${formMessage.type}`}>
            <AlertCircle size={16} />
            <span>{formMessage.text}</span>
          </div>
        )}

        <div className="form-group-full form-actions">
          {onCancel && (
            <button type="button" onClick={onCancel} className="secondary">
              <XCircle size={16} /> Cancel
            </button>
          )}
          <button type="submit" className="primary" disabled={isSaving}>
            <Save size={16} /> {editPlan ? "Update Plan" : "Save Plan"}
          </button>
        </div>
      </form>
    </div>
  );
}

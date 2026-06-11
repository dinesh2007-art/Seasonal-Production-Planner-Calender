import React, { useState } from "react";
import { 
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, 
  ArcElement, Title, Tooltip, Legend 
} from "chart.js";
import { Bar, Pie } from "react-chartjs-2";
import { Download, Calendar, BarChart3, PieChart as PieIcon, AlertCircle } from "lucide-react";

// Register ChartJS modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function ReportsAnalytics({ plans }) {
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

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

  // 1. Calculate stats for each plan
  const plansCalculated = plans.map(p => {
    const expected = Number(p.expectedOrderVolume || 0);
    const capacity = Number(p.productionCapacityPerDay || 0);
    const batches = Number(p.batches || 0);
    const utilisation = expected > 0 && capacity > 0 && batches > 0 
      ? Math.round((expected / (batches * capacity)) * 100)
      : 0;
    
    let riskLevel = "low";
    if (utilisation > config.highRiskThreshold) {
      riskLevel = "high";
    } else if (utilisation >= config.mediumRiskThreshold) {
      riskLevel = "medium";
    }

    return {
      ...p,
      utilisation,
      riskLevel
    };
  });

  // 2. Filter plans by date range
  const filteredPlans = plansCalculated.filter(plan => {
    if (!plan.productionStartDate) return false;
    const planDate = new Date(plan.productionStartDate);
    
    if (dateRange.start && planDate < new Date(dateRange.start)) {
      return false;
    }
    if (dateRange.end && planDate > new Date(dateRange.end)) {
      return false;
    }
    return true;
  });

  // 3. Status distribution counting
  const statusCounts = { planned: 0, active: 0, completed: 0, archived: 0 };
  filteredPlans.forEach(p => {
    if (statusCounts[p.status] !== undefined) {
      statusCounts[p.status]++;
    }
  });

  // 4. Chart 1 Data: Utilisation stress per plan
  const barChartData = {
    labels: filteredPlans.map(p => p.planName.slice(0, 15) + (p.planName.length > 15 ? "..." : "")),
    datasets: [
      {
        label: "Capacity Utilisation (%)",
        data: filteredPlans.map(p => p.utilisation),
        backgroundColor: filteredPlans.map(p => {
          if (p.riskLevel === "high") return "#ef4444"; // Chili Red
          if (p.riskLevel === "medium") return "#f59e0b"; // Honey Amber
          return "#10b981"; // Emerald
        }),
        borderRadius: 6
      }
    ]
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `Utilisation: ${context.parsed.y}%`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: Math.max(...filteredPlans.map(p => p.utilisation), 120),
        grid: { color: "#26354a" },
        ticks: { color: "#94a3b8" }
      },
      x: {
        grid: { display: false },
        ticks: { color: "#94a3b8" }
      }
    }
  };

  // Chart 2 Data: Status distribution
  const pieChartData = {
    labels: ["Planned", "Active", "Completed", "Archived"],
    datasets: [
      {
        data: [statusCounts.planned, statusCounts.active, statusCounts.completed, statusCounts.archived],
        backgroundColor: ["#3b82f6", "#f59e0b", "#10b981", "#64748b"],
        borderWidth: 1,
        borderColor: "#161f30"
      }
    ]
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: { color: "#94a3b8" }
      }
    }
  };

  // CSV Exporter
  const handleExportCSV = () => {
    if (filteredPlans.length === 0) return;

    const headers = [
      "ID", "Admin Coordinator", "Plan Name", "Production Item", "Batches", 
      "Festival", "Expected Volume", "Daily Capacity", "Utilisation (%)", 
      "Risk Level", "Status", "Procurement Start", "Production Start", "Created At"
    ];

    const rows = filteredPlans.map(p => [
      p.id,
      `"${p.admin.replace(/"/g, '""')}"`,
      `"${p.planName.replace(/"/g, '""')}"`,
      `"${p.productionItem.replace(/"/g, '""')}"`,
      p.batches,
      `"${p.upcomingFestival.replace(/"/g, '""')}"`,
      p.expectedOrderVolume,
      p.productionCapacityPerDay,
      p.utilisation,
      p.riskLevel.toUpperCase(),
      p.status.toUpperCase(),
      p.ingredientProcurementStartDate,
      p.productionStartDate,
      p.created_at
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Sharadha_Stores_Production_Report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      {/* Date Filters and Export Panel */}
      <div className="panel">
        <div className="panel-heading">
          <div>
            <h2>Reports & Analytics Dashboard</h2>
            <p>Filter by production dates and export planning reports to CSV.</p>
          </div>
          <button 
            onClick={handleExportCSV} 
            className="primary small" 
            disabled={filteredPlans.length === 0}
            type="button"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>

        <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Calendar size={16} className="text-secondary" />
            <span style={{ fontSize: "0.9rem", fontWeight: 500 }}>Filter by Production Start:</span>
          </div>
          
          <label style={{ flexDirection: "row", alignItems: "center", gap: "0.5rem", width: "auto" }}>
            From
            <input 
              type="date" 
              value={dateRange.start} 
              onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              style={{ width: "160px", padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}
            />
          </label>

          <label style={{ flexDirection: "row", alignItems: "center", gap: "0.5rem", width: "auto" }}>
            To
            <input 
              type="date" 
              value={dateRange.end} 
              onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              style={{ width: "160px", padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}
            />
          </label>

          {(dateRange.start || dateRange.end) && (
            <button 
              onClick={() => setDateRange({ start: "", end: "" })} 
              className="secondary small"
              type="button"
            >
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {filteredPlans.length === 0 ? (
        <div className="panel empty-state">
          <AlertCircle size={32} className="text-muted" />
          <p>No plans found matching the selected date filters.</p>
        </div>
      ) : (
        <div className="reports-layout">
          {/* Chart 1: Utilisation stress per plan */}
          <div className="chart-card">
            <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.1rem", marginBottom: "1.5rem" }}>
              <BarChart3 size={18} color="var(--accent-color)" /> Capacity Stress by Plan
            </h3>
            <div style={{ position: "relative", height: "280px" }}>
              <Bar data={barChartData} options={barChartOptions} />
            </div>
          </div>

          {/* Chart 2: Status distribution */}
          <div className="chart-card">
            <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.1rem", marginBottom: "1.5rem" }}>
              <PieIcon size={18} color="var(--accent-color)" /> Status Distribution
            </h3>
            <div style={{ position: "relative", height: "280px" }}>
              <Pie data={pieChartData} options={pieChartOptions} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

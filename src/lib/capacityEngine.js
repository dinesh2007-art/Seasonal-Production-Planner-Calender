/**
 * Capacity & Utilisation Tracking Engine
 * Core business logic for Sharadha Stores production planning.
 */

export function calculateCapacityMetrics(plan) {
  const {
    batch_size,
    expected_orders,
    production_capacity,
    production_start_date,
    production_end_date,
    procurement_deadline,
  } = plan;

  const startDate = new Date(production_start_date);
  const endDate = new Date(production_end_date);
  const procDate = new Date(procurement_deadline);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const productionDays = Math.max(
    1,
    Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1
  );

  const totalProductionCapacity = production_capacity * productionDays;
  const utilisationRate =
    totalProductionCapacity > 0
      ? Math.min(100, (expected_orders / totalProductionCapacity) * 100)
      : 0;

  const batchesRequired =
    batch_size > 0 ? Math.ceil(expected_orders / batch_size) : 0;

  const stockCoverage =
    expected_orders > 0
      ? (totalProductionCapacity / expected_orders) * 100
      : 100;

  const daysUntilProcurement = Math.round(
    (procDate - today) / (1000 * 60 * 60 * 24)
  );
  const daysUntilProduction = Math.round(
    (startDate - today) / (1000 * 60 * 60 * 24)
  );

  const shortfall = Math.max(0, expected_orders - totalProductionCapacity);
  const surplus = Math.max(0, totalProductionCapacity - expected_orders);

  let alert = null;
  let alertLevel = 'none';

  if (utilisationRate > 95) {
    alert = 'Production capacity nearly exhausted — consider increasing capacity or batches.';
    alertLevel = 'critical';
  } else if (utilisationRate > 80) {
    alert = 'High utilisation — monitor closely to avoid stock shortfall.';
    alertLevel = 'warning';
  } else if (daysUntilProcurement <= 3 && daysUntilProcurement >= 0) {
    alert = `Procurement deadline in ${daysUntilProcurement} day(s) — confirm ingredient orders immediately.`;
    alertLevel = 'warning';
  } else if (daysUntilProcurement < 0) {
    alert = 'Procurement deadline has passed.';
    alertLevel = 'critical';
  } else if (shortfall > 0) {
    alert = `Stock shortfall of ${shortfall} units projected — increase production capacity.`;
    alertLevel = 'critical';
  }

  return {
    totalProductionCapacity,
    utilisationRate: Math.round(utilisationRate * 10) / 10,
    batchesRequired,
    stockCoverage: Math.round(stockCoverage * 10) / 10,
    daysUntilProcurement,
    daysUntilProduction,
    shortfall,
    surplus,
    productionDays,
    alert,
    alertLevel,
  };
}

export function getStatusColor(status) {
  const map = {
    planned: '#3b82f6',
    active: '#10b981',
    completed: '#6b7280',
    archived: '#9ca3af',
  };
  return map[status] || '#6b7280';
}

export function getAlertLevelColor(level) {
  const map = {
    critical: '#ef4444',
    warning: '#f59e0b',
    none: '#10b981',
  };
  return map[level] || '#6b7280';
}

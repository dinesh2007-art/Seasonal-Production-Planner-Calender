// API Client wrapper with LocalStorage fallback when backend is offline
const DEFAULT_API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";

// Seed data to initialize LocalStorage if offline
const seedPlans = [
  {
    id: 1,
    admin: "Sharadha Admin",
    planName: "Diwali sweets production",
    productionItem: "Mysore Pak",
    batches: 12,
    upcomingFestival: "Diwali",
    expectedOrderVolume: 600,
    ingredientProcurementStartDate: "2026-10-20",
    productionStartDate: "2026-10-27",
    productionCapacityPerDay: 150,
    status: "planned",
    created_at: "2026-06-11T00:00:00.000Z",
    updated_at: "2026-06-11T00:00:00.000Z"
  }
];

const seedOrders = [
  {
    id: 1,
    seasonal_production_planning_id: 1,
    admin: "Sharadha Admin",
    planName: "Diwali sweets production",
    productionItem: "Mysore Pak",
    orderVolume: 150,
    status: "pending",
    created_at: "2026-06-11T00:00:00.000Z",
    updated_at: "2026-06-11T00:00:00.000Z"
  },
  {
    id: 2,
    seasonal_production_planning_id: 1,
    admin: "Sharadha Admin",
    planName: "Diwali sweets production",
    productionItem: "Mysore Pak",
    orderVolume: 100,
    status: "confirmed",
    created_at: "2026-06-11T00:00:00.000Z",
    updated_at: "2026-06-11T00:00:00.000Z"
  }
];

const seedInventory = [
  {
    id: 1,
    seasonal_production_planning_id: 1,
    admin: "Sharadha Admin",
    ingredientName: "Besan (Gram Flour)",
    availableQuantity: 50,
    requiredQuantity: 80,
    unit: "kg",
    status: "pending",
    created_at: "2026-06-11T00:00:00.000Z",
    updated_at: "2026-06-11T00:00:00.000Z"
  },
  {
    id: 2,
    seasonal_production_planning_id: 1,
    admin: "Sharadha Admin",
    ingredientName: "Ghee",
    availableQuantity: 100,
    requiredQuantity: 90,
    unit: "kg",
    status: "available",
    created_at: "2026-06-11T00:00:00.000Z",
    updated_at: "2026-06-11T00:00:00.000Z"
  }
];

// Helper to initialize LocalStorage db if not present
function initLocalStorageDb() {
  if (!localStorage.getItem("db_plans")) {
    localStorage.setItem("db_plans", JSON.stringify(seedPlans));
  }
  if (!localStorage.getItem("db_orders")) {
    localStorage.setItem("db_orders", JSON.stringify(seedOrders));
  }
  if (!localStorage.getItem("db_inventory")) {
    localStorage.setItem("db_inventory", JSON.stringify(seedInventory));
  }
}

// Track offline mode state globally in the client session
let isBackendOffline = false;

export function getOfflineStatus() {
  return isBackendOffline;
}

export function setOfflineStatus(status) {
  isBackendOffline = status;
}

// Mock Response creator
function makeMockResponse(data, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data
  };
}

// Handle local requests using localStorage
function handleLocalRequest(path, options = {}) {
  initLocalStorageDb();
  const method = options.method || "GET";
  const body = options.body ? JSON.parse(options.body) : null;
  const now = new Date().toISOString();

  // Parse query parameters
  const urlObj = new URL(path, "http://localhost");
  const pathname = urlObj.pathname;
  const searchParams = urlObj.searchParams;

  // 1. GET /api/seasonal_production_planning
  if (method === "GET" && pathname === "/api/seasonal_production_planning") {
    const plans = JSON.parse(localStorage.getItem("db_plans") || "[]");
    plans.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return makeMockResponse({ success: true, data: plans });
  }

  // 2. POST /api/seasonal_production_planning
  if (method === "POST" && pathname === "/api/seasonal_production_planning") {
    const plans = JSON.parse(localStorage.getItem("db_plans") || "[]");
    const nextId = plans.length ? Math.max(...plans.map((p) => p.id)) + 1 : 1;
    const newPlan = {
      ...body,
      id: nextId,
      batches: Number(body.batches),
      expectedOrderVolume: Number(body.expectedOrderVolume),
      productionCapacityPerDay: Number(body.productionCapacityPerDay),
      created_at: now,
      updated_at: now
    };
    plans.push(newPlan);
    localStorage.setItem("db_plans", JSON.stringify(plans));
    return makeMockResponse({ success: true, data: newPlan }, 201);
  }

  // 3. GET /api/seasonal_production_planning/:id
  const detailMatch = pathname.match(/^\/api\/seasonal_production_planning\/(\d+)$/);
  if (detailMatch) {
    const planId = Number(detailMatch[1]);
    const plans = JSON.parse(localStorage.getItem("db_plans") || "[]");
    const plan = plans.find((p) => p.id === planId);

    if (method === "GET") {
      if (!plan) {
        return makeMockResponse({ success: false, message: "Plan not found" }, 404);
      }
      return makeMockResponse({ success: true, data: plan });
    }

    if (method === "PUT") {
      if (!plan) {
        return makeMockResponse({ success: false, message: "Plan not found" }, 404);
      }
      const updatedPlan = {
        ...plan,
        ...body,
        id: planId,
        batches: Number(body.batches),
        expectedOrderVolume: Number(body.expectedOrderVolume),
        productionCapacityPerDay: Number(body.productionCapacityPerDay),
        updated_at: now
      };
      const index = plans.findIndex((p) => p.id === planId);
      plans[index] = updatedPlan;
      localStorage.setItem("db_plans", JSON.stringify(plans));
      return makeMockResponse({ success: true, data: updatedPlan });
    }
  }

  // 4. PATCH /api/seasonal_production_planning/:id/status
  const statusMatch = pathname.match(/^\/api\/seasonal_production_planning\/(\d+)\/status$/);
  if (method === "PATCH" && statusMatch) {
    const planId = Number(statusMatch[1]);
    const plans = JSON.parse(localStorage.getItem("db_plans") || "[]");
    const index = plans.findIndex((p) => p.id === planId);
    if (index === -1) {
      return makeMockResponse({ success: false, message: "Plan not found" }, 404);
    }
    plans[index].status = body.status;
    plans[index].updated_at = now;
    localStorage.setItem("db_plans", JSON.stringify(plans));
    return makeMockResponse({ success: true, data: plans[index] });
  }

  // 5. GET /api/orders
  if (method === "GET" && pathname === "/api/orders") {
    const planId = searchParams.get("seasonal_production_planning_id");
    let orders = JSON.parse(localStorage.getItem("db_orders") || "[]");
    if (planId) {
      orders = orders.filter((o) => o.seasonal_production_planning_id === Number(planId));
    }
    return makeMockResponse({ success: true, data: orders });
  }

  // 6. POST /api/orders
  if (method === "POST" && pathname === "/api/orders") {
    const orders = JSON.parse(localStorage.getItem("db_orders") || "[]");
    const nextId = orders.length ? Math.max(...orders.map((o) => o.id)) + 1 : 1;
    const newOrder = {
      id: nextId,
      seasonal_production_planning_id: Number(body.seasonal_production_planning_id),
      admin: body.admin,
      planName: body.planName || "",
      productionItem: body.productionItem || "",
      orderVolume: Number(body.order_volume),
      status: body.status || "pending",
      created_at: now,
      updated_at: now
    };
    orders.push(newOrder);
    localStorage.setItem("db_orders", JSON.stringify(orders));
    return makeMockResponse({ success: true, data: newOrder }, 201);
  }

  // 7. GET /api/inventory
  if (method === "GET" && pathname === "/api/inventory") {
    const planId = searchParams.get("seasonal_production_planning_id");
    let inventory = JSON.parse(localStorage.getItem("db_inventory") || "[]");
    if (planId) {
      inventory = inventory.filter((i) => i.seasonal_production_planning_id === Number(planId));
    }
    return makeMockResponse({ success: true, data: inventory });
  }

  // 8. POST /api/inventory
  if (method === "POST" && pathname === "/api/inventory") {
    const inventory = JSON.parse(localStorage.getItem("db_inventory") || "[]");
    const nextId = inventory.length ? Math.max(...inventory.map((i) => i.id)) + 1 : 1;
    const newItem = {
      id: nextId,
      seasonal_production_planning_id: Number(body.seasonal_production_planning_id),
      admin: body.admin,
      ingredientName: body.ingredient_name,
      availableQuantity: Number(body.available_quantity || 0),
      requiredQuantity: Number(body.required_quantity),
      unit: body.unit || "kg",
      status: Number(body.available_quantity) >= Number(body.required_quantity) ? "available" : "pending",
      created_at: now,
      updated_at: now
    };
    inventory.push(newItem);
    localStorage.setItem("db_inventory", JSON.stringify(inventory));
    return makeMockResponse({ success: true, data: newItem }, 201);
  }

  return makeMockResponse({ success: false, message: "Route not matched in offline mode" }, 404);
}

// Wrapper for fetch that switches to local mock database on failure
export async function apiFetch(path, options = {}) {
  // If we already detected the backend is offline, immediately serve from localStorage
  if (isBackendOffline) {
    return handleLocalRequest(path, options);
  }

  try {
    const url = `${DEFAULT_API_BASE}${path}`;
    const response = await fetch(url, options);
    return response;
  } catch (error) {
    // If fetch fails (network error / backend offline), activate offline mode
    console.warn("Backend offline, switching to Local Storage Mode:", error);
    isBackendOffline = true;
    return handleLocalRequest(path, options);
  }
}

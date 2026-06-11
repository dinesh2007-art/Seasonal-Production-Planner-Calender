const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const DEFAULT_PORT = Number(process.env.PORT || 3000);
const PROJECT_ID = "seasonal-production-planning-c";
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "seasonal_production_planning.json");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");
const INVENTORY_FILE = path.join(DATA_DIR, "inventory.json");

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

const samplePlans = [
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
    status: "planned"
  }
];

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    const seeded = samplePlans.map((plan) => ({
      ...plan,
      created_at: "2026-06-11T00:00:00.000Z",
      updated_at: "2026-06-11T00:00:00.000Z"
    }));
    fs.writeFileSync(DATA_FILE, JSON.stringify(seeded, null, 2));
  }

  if (!fs.existsSync(ORDERS_FILE)) {
    const sampleOrders = [
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
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(sampleOrders, null, 2));
  }

  if (!fs.existsSync(INVENTORY_FILE)) {
    const sampleInventory = [
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
    fs.writeFileSync(INVENTORY_FILE, JSON.stringify(sampleInventory, null, 2));
  }
}

function readPlans() {
  ensureDataFile();
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function writePlans(plans) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(plans, null, 2));
}

function readOrders() {
  ensureDataFile();
  return JSON.parse(fs.readFileSync(ORDERS_FILE, "utf8"));
}

function writeOrders(orders) {
  ensureDataFile();
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
}

function readInventory() {
  ensureDataFile();
  return JSON.parse(fs.readFileSync(INVENTORY_FILE, "utf8"));
}

function writeInventory(inv) {
  ensureDataFile();
  fs.writeFileSync(INVENTORY_FILE, JSON.stringify(inv, null, 2));
}

function sanitizeText(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, "")
    .replace(/[{}$]/g, "")
    .trim();
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Request body is too large"));
        req.destroy();
      }
    });

    req.on("end", () => {
      if (!body.trim()) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new Error("Malformed JSON request body"));
      }
    });
  });
}

function validatePlan(input) {
  for (const field of requiredFields) {
    if (input[field] === undefined || input[field] === null || String(input[field]).trim() === "") {
      return `${field} is required.`;
    }
  }

  const positiveNumberFields = ["batches", "expectedOrderVolume", "productionCapacityPerDay"];
  for (const field of positiveNumberFields) {
    if (Number(input[field]) <= 0) {
      return `${field} must be greater than zero.`;
    }
  }

  if (new Date(input.ingredientProcurementStartDate) > new Date(input.productionStartDate)) {
    return "ingredientProcurementStartDate must be on or before productionStartDate.";
  }

  return null;
}

function normalisePlan(input, id) {
  const now = new Date().toISOString();
  return {
    id,
    admin: sanitizeText(input.admin),
    planName: sanitizeText(input.planName),
    productionItem: sanitizeText(input.productionItem),
    batches: Number(input.batches),
    upcomingFestival: sanitizeText(input.upcomingFestival),
    expectedOrderVolume: Number(input.expectedOrderVolume),
    ingredientProcurementStartDate: sanitizeText(input.ingredientProcurementStartDate),
    productionStartDate: sanitizeText(input.productionStartDate),
    productionCapacityPerDay: Number(input.productionCapacityPerDay),
    status: sanitizeText(input.status || "planned") || "planned",
    created_at: now,
    updated_at: now
  };
}

function sendJson(res, statusCode, body) {
  const payload = JSON.stringify(body);
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Length": Buffer.byteLength(payload)
  });
  res.end(payload);
}

function notFound(res) {
  sendJson(res, 404, {
    success: false,
    message: "Route not found",
    code: 404
  });
}

function badRequest(res, message) {
  sendJson(res, 400, {
    success: false,
    message,
    code: 400
  });
}

function calculateCapacity(input) {
  const expectedOrderVolume = Number(input.expectedOrderVolume || 0);
  const productionCapacityPerDay = Number(input.productionCapacityPerDay || 0);
  const plannedBatches = Number(input.batches || 0);

  if (expectedOrderVolume <= 0 || productionCapacityPerDay <= 0 || plannedBatches <= 0) {
    return {
      valid: false,
      message: "Expected order volume, production capacity, and batches must be greater than zero."
    };
  }

  const daysRequired = Math.ceil(expectedOrderVolume / productionCapacityPerDay);
  const batchUtilisation = Math.round((expectedOrderVolume / (plannedBatches * productionCapacityPerDay)) * 100);

  return {
    valid: true,
    daysRequired,
    batchUtilisation,
    riskLevel: batchUtilisation > 100 ? "high" : batchUtilisation >= 85 ? "medium" : "low",
    recommendation:
      batchUtilisation > 100
        ? "Increase batches or daily capacity before confirming this festival plan."
        : "Current capacity can support the expected order volume."
  };
}

async function handleRoute(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "OPTIONS") {
    sendJson(res, 200, { success: true });
    return;
  }

  if (req.method === "GET" && url.pathname === "/health") {
    sendJson(res, 200, {
      status: "ok",
      project: PROJECT_ID
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/") {
    sendJson(res, 200, {
      success: true,
      project: PROJECT_ID,
      message: "Seasonal Production Planning Calendar backend is running.",
      routes: [
        "GET /health",
        "POST /api/seasonal_production_planning",
        "GET /api/seasonal_production_planning",
        "GET /api/seasonal_production_planning/:id",
        "GET /api/capacity-utilisation/sample"
      ]
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/seasonal_production_planning") {
    const plans = readPlans().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    sendJson(res, 200, {
      success: true,
      data: plans
    });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/seasonal_production_planning") {
    try {
      const input = await parseBody(req);
      const validationError = validatePlan(input);
      if (validationError) {
        badRequest(res, validationError);
        return;
      }

      const plans = readPlans();
      const nextId = plans.length ? Math.max(...plans.map((plan) => plan.id)) + 1 : 1;
      const created = normalisePlan(input, nextId);
      plans.push(created);
      writePlans(plans);

      sendJson(res, 201, {
        success: true,
        data: created
      });
    } catch (error) {
      badRequest(res, error.message);
    }
    return;
  }

  const detailMatch = url.pathname.match(/^\/api\/seasonal_production_planning\/(\d+)$/);
  if (detailMatch) {
    const planId = Number(detailMatch[1]);
    
    if (req.method === "GET") {
      const plan = readPlans().find((item) => item.id === planId);
      if (!plan) {
        sendJson(res, 404, {
          success: false,
          message: "Seasonal production plan not found",
          code: 404
        });
        return;
      }
      sendJson(res, 200, {
        success: true,
        data: plan
      });
      return;
    }

    if (req.method === "PUT") {
      try {
        const input = await parseBody(req);
        const validationError = validatePlan(input);
        if (validationError) {
          badRequest(res, validationError);
          return;
        }
        const plans = readPlans();
        const index = plans.findIndex((item) => item.id === planId);
        if (index === -1) {
          sendJson(res, 404, {
            success: false,
            message: "Seasonal production plan not found",
            code: 404
          });
          return;
        }
        const existing = plans[index];
        const updated = {
          ...normalisePlan(input, planId),
          created_at: existing.created_at,
          updated_at: new Date().toISOString()
        };
        plans[index] = updated;
        writePlans(plans);
        sendJson(res, 200, {
          success: true,
          data: updated
        });
      } catch (error) {
        badRequest(res, error.message);
      }
      return;
    }
  }

  const statusMatch = url.pathname.match(/^\/api\/seasonal_production_planning\/(\d+)\/status$/);
  if (req.method === "PATCH" && statusMatch) {
    try {
      const input = await parseBody(req);
      if (!input.status) {
        badRequest(res, "status is required");
        return;
      }
      const plans = readPlans();
      const planId = Number(statusMatch[1]);
      const index = plans.findIndex((item) => item.id === planId);
      if (index === -1) {
        sendJson(res, 404, {
          success: false,
          message: "Seasonal production plan not found",
          code: 404
        });
        return;
      }
      const validStatuses = ["planned", "active", "completed", "archived"];
      const newStatus = sanitizeText(input.status).toLowerCase();
      if (!validStatuses.includes(newStatus)) {
        badRequest(res, `Invalid status. Must be one of: ${validStatuses.join(", ")}`);
        return;
      }
      const plan = plans[index];
      plan.status = newStatus;
      plan.updated_at = new Date().toISOString();
      plans[index] = plan;
      writePlans(plans);
      sendJson(res, 200, {
        success: true,
        data: plan
      });
    } catch (error) {
      badRequest(res, error.message);
    }
    return;
  }

  const capacityMatch = url.pathname.match(/^\/api\/capacity-utilisation\/(\d+)$/);
  if (req.method === "GET" && capacityMatch) {
    const plan = readPlans().find((item) => item.id === Number(capacityMatch[1]));
    if (!plan) {
      sendJson(res, 404, {
        success: false,
        message: "Seasonal production plan not found",
        code: 404
      });
      return;
    }
    sendJson(res, 200, {
      success: true,
      data: calculateCapacity(plan)
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/capacity-utilisation/sample") {
    const plans = readPlans();
    sendJson(res, 200, {
      success: true,
      data: calculateCapacity(plans[0] || samplePlans[0])
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/orders") {
    const planId = url.searchParams.get("seasonal_production_planning_id");
    let orders = readOrders();
    if (planId) {
      orders = orders.filter(o => o.seasonal_production_planning_id === Number(planId));
    }
    sendJson(res, 200, {
      success: true,
      data: orders
    });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/orders") {
    try {
      const input = await parseBody(req);
      if (!input.seasonal_production_planning_id || !input.admin || !input.order_volume) {
        badRequest(res, "seasonal_production_planning_id, admin, and order_volume are required.");
        return;
      }
      if (Number(input.order_volume) <= 0) {
        badRequest(res, "order_volume must be greater than zero.");
        return;
      }
      const orders = readOrders();
      const nextId = orders.length ? Math.max(...orders.map(o => o.id)) + 1 : 1;
      const now = new Date().toISOString();
      const newOrder = {
        id: nextId,
        seasonal_production_planning_id: Number(input.seasonal_production_planning_id),
        admin: sanitizeText(input.admin),
        planName: sanitizeText(input.planName || ""),
        productionItem: sanitizeText(input.productionItem || ""),
        orderVolume: Number(input.order_volume),
        status: sanitizeText(input.status || "pending") || "pending",
        created_at: now,
        updated_at: now
      };
      orders.push(newOrder);
      writeOrders(orders);
      sendJson(res, 201, {
        success: true,
        data: newOrder
      });
    } catch (error) {
      badRequest(res, error.message);
    }
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/inventory") {
    const planId = url.searchParams.get("seasonal_production_planning_id");
    let inventory = readInventory();
    if (planId) {
      inventory = inventory.filter(i => i.seasonal_production_planning_id === Number(planId));
    }
    sendJson(res, 200, {
      success: true,
      data: inventory
    });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/inventory") {
    try {
      const input = await parseBody(req);
      if (!input.seasonal_production_planning_id || !input.admin || !input.ingredient_name || !input.required_quantity) {
        badRequest(res, "seasonal_production_planning_id, admin, ingredient_name, and required_quantity are required.");
        return;
      }
      const inventory = readInventory();
      const nextId = inventory.length ? Math.max(...inventory.map(i => i.id)) + 1 : 1;
      const now = new Date().toISOString();
      const newItem = {
        id: nextId,
        seasonal_production_planning_id: Number(input.seasonal_production_planning_id),
        admin: sanitizeText(input.admin),
        ingredientName: sanitizeText(input.ingredient_name),
        availableQuantity: Number(input.available_quantity || 0),
        requiredQuantity: Number(input.required_quantity),
        unit: sanitizeText(input.unit || "kg") || "kg",
        status: sanitizeText(input.status || "pending") || "pending",
        created_at: now,
        updated_at: now
      };
      inventory.push(newItem);
      writeInventory(inventory);
      sendJson(res, 201, {
        success: true,
        data: newItem
      });
    } catch (error) {
      badRequest(res, error.message);
    }
    return;
  }

  notFound(res);
}

function createServer() {
  return http.createServer((req, res) => {
    handleRoute(req, res).catch((error) => {
      sendJson(res, 500, {
        success: false,
        message: error.message || "Internal server error",
        code: 500
      });
    });
  });
}

if (require.main === module) {
  const server = createServer();
  server.listen(DEFAULT_PORT, () => {
    console.log(`Seasonal Production Planning backend running on http://localhost:${DEFAULT_PORT}`);
  });
}

module.exports = {
  createServer,
  calculateCapacity,
  validatePlan
};

const http = require("http");
const fs = require("fs");
const path = require("path");
const { createServer } = require("../server");

const DATA_FILE = path.join(__dirname, "..", "data", "seasonal_production_planning.json");

function request(port, method, path, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : "";
    const req = http.request(
      {
        hostname: "localhost",
        port,
        path,
        method,
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload)
        }
      },
      (res) => {
        let responseBody = "";
        res.on("data", (chunk) => {
          responseBody += chunk;
        });
        res.on("end", () => {
          resolve({
            statusCode: res.statusCode,
            body: JSON.parse(responseBody)
          });
        });
      }
    );

    req.on("error", reject);
    req.end(payload);
  });
}

const validRecord = {
  admin: "Sharadha Admin",
  planName: "Pongal festival production",
  productionItem: "Sakkarai Pongal Mix",
  batches: 8,
  upcomingFestival: "Pongal",
  expectedOrderVolume: 400,
  ingredientProcurementStartDate: "2026-01-05",
  productionStartDate: "2026-01-10",
  productionCapacityPerDay: 100,
  status: "planned"
};

const server = createServer();

server.listen(0, async () => {
  const { port } = server.address();

  try {
    const created = await request(port, "POST", "/api/seasonal_production_planning", validRecord);
    if (created.statusCode !== 201 || !created.body.success || !created.body.data.id) {
      throw new Error("POST should create a seasonal production planning record.");
    }

    const missingAdmin = await request(port, "POST", "/api/seasonal_production_planning", {
      ...validRecord,
      admin: ""
    });
    if (missingAdmin.statusCode !== 400 || missingAdmin.body.message !== "admin is required.") {
      throw new Error("POST should reject records with missing admin.");
    }

    const list = await request(port, "GET", "/api/seasonal_production_planning");
    if (list.statusCode !== 200 || !Array.isArray(list.body.data) || list.body.data.length < 1) {
      throw new Error("GET should return created records.");
    }

    const detail = await request(port, "GET", `/api/seasonal_production_planning/${created.body.data.id}`);
    if (detail.statusCode !== 200 || detail.body.data.planName !== validRecord.planName) {
      throw new Error("GET by id should return the created record.");
    }

    const records = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify(records.filter((record) => record.id !== created.body.data.id), null, 2)
    );

    console.log("API routes passed");
    server.close();
  } catch (error) {
    console.error(error.message);
    server.close();
    process.exit(1);
  }
});

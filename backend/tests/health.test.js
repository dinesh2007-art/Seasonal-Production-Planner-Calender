const http = require("http");
const { createServer } = require("../server");

const server = createServer();

server.listen(0, () => {
  const { port } = server.address();
  const options = {
    hostname: "localhost",
    port,
    path: "/health",
    method: "GET"
  };

  const req = http.request(options, (res) => {
    let body = "";
    res.on("data", (chunk) => {
      body += chunk;
    });
    res.on("end", () => {
      const parsed = JSON.parse(body);
      const passed =
        res.statusCode === 200 &&
        parsed.status === "ok" &&
        parsed.project === "seasonal-production-planning-c";

      if (!passed) {
        console.error("Health route failed", { statusCode: res.statusCode, body: parsed });
        server.close();
        process.exit(1);
      }

      console.log("Health route passed");
      console.log(JSON.stringify(parsed));
      server.close();
    });
  });

  req.on("error", (error) => {
    console.error("Health route request failed:", error.message);
    server.close();
    process.exit(1);
  });

  req.end();
});

server.on("error", (error) => {
  console.error("Server failed to start:", error.message);
      process.exit(1);
});

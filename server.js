import "dotenv/config";
import { createApp } from "./src/app.js";
import db from "./src/db.js";

const PORT = process.env.PORT || 3000;
const app = createApp(db);

const server = app.listen(PORT, () => {
  console.log(`Server běží na http://localhost:${PORT}`);
  console.log(`API poznámek: http://localhost:${PORT}/api/notes`);
});

async function shutdown(signal) {
  console.log(`\nPřijat signál ${signal}. Ukončuji server...`);

  server.close(async () => {
    await db.end();
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

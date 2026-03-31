import app from "./app.js";
import { prisma } from "./db.js";
import { config } from "./config.js";

const server = app.listen(config.port, () => {
  console.log(`API berjalan di http://localhost:${config.port}`);
});

const shutdown = async () => {
  await prisma.$disconnect();
  server.close(() => process.exit(0));
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

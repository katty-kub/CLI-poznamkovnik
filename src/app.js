import express from "express";
import { createNotesRouter } from "./routes/notes.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";

export function createApp(database) {
  const app = express();

  app.use(express.json());

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/notes", createNotesRouter(database));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

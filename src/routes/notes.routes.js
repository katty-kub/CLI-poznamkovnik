import { Router } from "express";
import { createNotesController } from "../controllers/notes.controller.js";

export function createNotesRouter(database) {
  const router = Router();
  const controller = createNotesController(database);

  router.get("/", controller.getAllNotes);
  router.get("/:id", controller.getNoteById);
  router.post("/", controller.createNote);
  router.patch("/:id", controller.updateNote);
  router.delete("/:id", controller.deleteNote);

  return router;
}

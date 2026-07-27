function parseId(value) {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    const error = new Error("ID musí být kladné celé číslo");
    error.status = 400;
    throw error;
  }

  return id;
}

function normalizeRequiredText(value) {
  if (typeof value !== "string" || value.trim() === "") {
    const error = new Error("Text poznámky je povinný");
    error.status = 400;
    throw error;
  }

  return value.trim();
}

function normalizeCategory(value, defaultValue) {
  if (value === undefined) {
    return defaultValue;
  }

  if (typeof value !== "string" || value.trim() === "") {
    const error = new Error("Kategorie musí být neprázdný text");
    error.status = 400;
    throw error;
  }

  return value.trim();
}

function createNotFoundError() {
  const error = new Error("Poznámka nenalezena");
  error.status = 404;
  return error;
}

function normalizeBody(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    const error = new Error("Tělo požadavku musí být JSON objekt");
    error.status = 400;
    throw error;
  }

  return body;
}

export function createNotesController(database) {
  async function getAllNotes(req, res, next) {
    try {
      const { search, category } = req.query;
      const conditions = [];
      const values = [];

      if (category !== undefined) {
        const normalizedCategory = normalizeCategory(category);
        values.push(normalizedCategory);
        conditions.push(`LOWER(category) = LOWER($${values.length})`);
      }

      if (search !== undefined) {
        const normalizedSearch = normalizeRequiredText(search);
        values.push(`%${normalizedSearch}%`);
        conditions.push(`text ILIKE $${values.length}`);
      }

      const where =
        conditions.length > 0 ? ` WHERE ${conditions.join(" AND ")}` : "";
      const sql = `SELECT * FROM notes${where} ORDER BY created_at DESC`;
      const result = await database.query(sql, values);

      res.json(result.rows);
    } catch (error) {
      next(error);
    }
  }

  async function getNoteById(req, res, next) {
    try {
      const id = parseId(req.params.id);
      const result = await database.query(
        "SELECT * FROM notes WHERE id = $1",
        [id],
      );

      if (result.rows.length === 0) {
        throw createNotFoundError();
      }

      res.json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  }

  async function createNote(req, res, next) {
    try {
      const body = normalizeBody(req.body);
      const text = normalizeRequiredText(body.text);
      const category = normalizeCategory(body.category, "ostatni");
      const result = await database.query(
        "INSERT INTO notes (text, category) VALUES ($1, $2) RETURNING *",
        [text, category],
      );

      res.status(201).json({
        message: "Poznámka přidána",
        note: result.rows[0],
      });
    } catch (error) {
      next(error);
    }
  }

  async function updateNote(req, res, next) {
    try {
      const id = parseId(req.params.id);
      const body = normalizeBody(req.body);
      const updates = [];
      const values = [];

      if (Object.hasOwn(body, "text")) {
        values.push(normalizeRequiredText(body.text));
        updates.push(`text = $${values.length}`);
      }

      if (Object.hasOwn(body, "category")) {
        values.push(normalizeCategory(body.category));
        updates.push(`category = $${values.length}`);
      }

      if (updates.length === 0) {
        const error = new Error(
          "Pošli alespoň jedno pole k úpravě: text nebo category",
        );
        error.status = 400;
        throw error;
      }

      values.push(id);
      const sql = `
        UPDATE notes
        SET ${updates.join(", ")}
        WHERE id = $${values.length}
        RETURNING *
      `;
      const result = await database.query(sql, values);

      if (result.rows.length === 0) {
        throw createNotFoundError();
      }

      res.json({
        message: "Poznámka upravena",
        note: result.rows[0],
      });
    } catch (error) {
      next(error);
    }
  }

  async function deleteNote(req, res, next) {
    try {
      const id = parseId(req.params.id);
      const result = await database.query(
        "DELETE FROM notes WHERE id = $1 RETURNING *",
        [id],
      );

      if (result.rows.length === 0) {
        throw createNotFoundError();
      }

      res.json({
        message: "Poznámka smazána",
        note: result.rows[0],
      });
    } catch (error) {
      next(error);
    }
  }

  return {
    getAllNotes,
    getNoteById,
    createNote,
    updateNote,
    deleteNote,
  };
}

import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createApp } from "../src/app.js";

function createFakeDatabase(initialNotes = []) {
  const notes = initialNotes.map((note) => ({ ...note }));
  let nextId = Math.max(0, ...notes.map((note) => note.id)) + 1;

  return {
    notes,

    async query(sql, values = []) {
      const normalizedSql = sql.replace(/\s+/g, " ").trim();

      if (normalizedSql.startsWith("SELECT * FROM notes WHERE id = $1")) {
        return { rows: notes.filter((note) => note.id === values[0]) };
      }

      if (normalizedSql.startsWith("SELECT * FROM notes")) {
        let result = [...notes];
        let valueIndex = 0;

        if (normalizedSql.includes("LOWER(category)")) {
          const category = values[valueIndex].toLowerCase();
          valueIndex += 1;
          result = result.filter(
            (note) => note.category.toLowerCase() === category,
          );
        }

        if (normalizedSql.includes("text ILIKE")) {
          const search = values[valueIndex].replaceAll("%", "").toLowerCase();
          result = result.filter((note) =>
            note.text.toLowerCase().includes(search),
          );
        }

        result.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at),
        );
        return { rows: result };
      }

      if (normalizedSql.startsWith("INSERT INTO notes")) {
        const note = {
          id: nextId,
          text: values[0],
          category: values[1],
          created_at: new Date().toISOString(),
        };
        nextId += 1;
        notes.push(note);
        return { rows: [note] };
      }

      if (normalizedSql.startsWith("UPDATE notes")) {
        const id = values.at(-1);
        const note = notes.find((item) => item.id === id);

        if (!note) return { rows: [] };

        const textMatch = normalizedSql.match(/text = \$(\d+)/);
        const categoryMatch = normalizedSql.match(/category = \$(\d+)/);

        if (textMatch) note.text = values[Number(textMatch[1]) - 1];
        if (categoryMatch) {
          note.category = values[Number(categoryMatch[1]) - 1];
        }

        return { rows: [note] };
      }

      if (normalizedSql.startsWith("DELETE FROM notes")) {
        const index = notes.findIndex((note) => note.id === values[0]);

        if (index === -1) return { rows: [] };

        return { rows: notes.splice(index, 1) };
      }

      throw new Error(`Testovací databáze nezná SQL: ${normalizedSql}`);
    },
  };
}

test("kompletní CRUD poznámky", async () => {
  const database = createFakeDatabase();
  const app = createApp(database);

  const createResponse = await request(app).post("/api/notes").send({
    text: "Naučit se PATCH",
    category: "express",
  });

  assert.equal(createResponse.status, 201);
  assert.equal(createResponse.body.note.text, "Naučit se PATCH");
  const id = createResponse.body.note.id;

  const listResponse = await request(app).get("/api/notes");
  assert.equal(listResponse.status, 200);
  assert.equal(listResponse.body.length, 1);

  const detailResponse = await request(app).get(`/api/notes/${id}`);
  assert.equal(detailResponse.status, 200);
  assert.equal(detailResponse.body.category, "express");

  const updateResponse = await request(app).patch(`/api/notes/${id}`).send({
    text: "PATCH už umím",
    category: "node",
  });
  assert.equal(updateResponse.status, 200);
  assert.equal(updateResponse.body.note.text, "PATCH už umím");
  assert.equal(updateResponse.body.note.category, "node");

  const deleteResponse = await request(app).delete(`/api/notes/${id}`);
  assert.equal(deleteResponse.status, 200);
  assert.equal(deleteResponse.body.note.id, id);

  const missingResponse = await request(app).get(`/api/notes/${id}`);
  assert.equal(missingResponse.status, 404);
});

test("vyhledávání a filtrování lze kombinovat", async () => {
  const database = createFakeDatabase([
    {
      id: 1,
      text: "Express Router",
      category: "node",
      created_at: "2026-07-27T10:00:00.000Z",
    },
    {
      id: 2,
      text: "React Router",
      category: "react",
      created_at: "2026-07-27T11:00:00.000Z",
    },
    {
      id: 3,
      text: "Express middleware",
      category: "node",
      created_at: "2026-07-27T12:00:00.000Z",
    },
  ]);
  const app = createApp(database);

  const response = await request(app)
    .get("/api/notes")
    .query({ search: "router", category: "NODE" });

  assert.equal(response.status, 200);
  assert.deepEqual(
    response.body.map((note) => note.id),
    [1],
  );
});

test("POST odmítne prázdný text", async () => {
  const app = createApp(createFakeDatabase());
  const response = await request(app)
    .post("/api/notes")
    .send({ text: "   " });

  assert.equal(response.status, 400);
  assert.equal(response.body.error.message, "Text poznámky je povinný");
});

test("POST bez JSON těla vrátí chybu 400", async () => {
  const app = createApp(createFakeDatabase());
  const response = await request(app).post("/api/notes");

  assert.equal(response.status, 400);
  assert.equal(response.body.error.message, "Text poznámky je povinný");
});

test("PATCH odmítne prázdné tělo", async () => {
  const app = createApp(
    createFakeDatabase([
      {
        id: 1,
        text: "Původní text",
        category: "ostatni",
        created_at: "2026-07-27T10:00:00.000Z",
      },
    ]),
  );
  const response = await request(app).patch("/api/notes/1").send({});

  assert.equal(response.status, 400);
  assert.match(response.body.error.message, /alespoň jedno pole/);
});

test("neplatné ID vrátí chybu 400", async () => {
  const app = createApp(createFakeDatabase());
  const response = await request(app).get("/api/notes/abc");

  assert.equal(response.status, 400);
  assert.equal(response.body.error.message, "ID musí být kladné celé číslo");
});

test("neexistující cesta vrátí chybu 404", async () => {
  const app = createApp(createFakeDatabase());
  const response = await request(app).get("/api/neexistuje");

  assert.equal(response.status, 404);
  assert.equal(response.body.error.status, 404);
});

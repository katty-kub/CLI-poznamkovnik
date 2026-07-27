CREATE TABLE IF NOT EXISTS notes (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  text TEXT NOT NULL CHECK (char_length(trim(text)) > 0),
  category VARCHAR(100) NOT NULL DEFAULT 'ostatni',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS notes_category_lower_idx
  ON notes (LOWER(category));

CREATE INDEX IF NOT EXISTS notes_created_at_idx
  ON notes (created_at DESC);

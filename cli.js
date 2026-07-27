import "dotenv/config";
import { pathToFileURL } from "node:url";

const DEFAULT_API_URL = `http://localhost:${process.env.PORT || 3000}/api/notes`;

function printHelp(output) {
  output.log(`
CLI poznámkovník

Použití:
  npm run cli -- list
  npm run cli -- list --category node
  npm run cli -- show 1
  npm run cli -- add "Procvičit Express" node
  npm run cli -- edit 1 --text "Procvičit Express Router"
  npm run cli -- edit 1 --category express
  npm run cli -- delete 1
  npm run cli -- search "Express"
  npm run cli -- help
`);
}

function readOption(args, optionName) {
  const index = args.indexOf(optionName);
  return index === -1 ? undefined : args[index + 1];
}

function requireId(value) {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Zadej platné kladné ID poznámky.");
  }

  return id;
}

async function fetchJson(fetchImpl, url, options = {}) {
  let response;

  try {
    response = await fetchImpl(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });
  } catch {
    throw new Error(
      "API není dostupné. Nejdřív v jiném terminálu spusť: npm run dev",
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.error?.message || data.message || `HTTP chyba ${response.status}`,
    );
  }

  return data;
}

function printNotes(notes, output) {
  if (notes.length === 0) {
    output.log("Nebyly nalezeny žádné poznámky.");
    return;
  }

  output.table(
    notes.map(({ id, text, category, created_at }) => ({
      id,
      text,
      category,
      created_at,
    })),
  );
}

export async function runCli(
  args = process.argv.slice(2),
  fetchImpl = fetch,
  output = console,
) {
  const [command = "help", ...commandArgs] = args;
  const apiUrl = process.env.API_URL || DEFAULT_API_URL;

  switch (command) {
    case "help":
    case "--help":
    case "-h":
      printHelp(output);
      return;

    case "list": {
      const params = new URLSearchParams();
      const category = readOption(commandArgs, "--category");
      const search = readOption(commandArgs, "--search");

      if (category) params.set("category", category);
      if (search) params.set("search", search);

      const query = params.toString();
      const notes = await fetchJson(
        fetchImpl,
        `${apiUrl}${query ? `?${query}` : ""}`,
      );
      printNotes(notes, output);
      return notes;
    }

    case "show": {
      const id = requireId(commandArgs[0]);
      const note = await fetchJson(fetchImpl, `${apiUrl}/${id}`);
      output.table([note]);
      return note;
    }

    case "add": {
      const [text, category = "ostatni"] = commandArgs;

      if (!text) {
        throw new Error('Použití: npm run cli -- add "text" [kategorie]');
      }

      const result = await fetchJson(fetchImpl, apiUrl, {
        method: "POST",
        body: JSON.stringify({ text, category }),
      });
      output.log(`${result.message} (ID: ${result.note.id})`);
      return result;
    }

    case "edit": {
      const id = requireId(commandArgs[0]);
      const text = readOption(commandArgs, "--text") || commandArgs[1];
      const category = readOption(commandArgs, "--category");
      const body = {};

      if (text && !text.startsWith("--")) body.text = text;
      if (category) body.category = category;

      if (Object.keys(body).length === 0) {
        throw new Error(
          'Použití: npm run cli -- edit ID --text "nový text" [--category kategorie]',
        );
      }

      const result = await fetchJson(fetchImpl, `${apiUrl}/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      output.log(result.message);
      return result;
    }

    case "delete": {
      const id = requireId(commandArgs[0]);
      const result = await fetchJson(fetchImpl, `${apiUrl}/${id}`, {
        method: "DELETE",
      });
      output.log(result.message);
      return result;
    }

    case "search": {
      const term = commandArgs.join(" ").trim();

      if (!term) {
        throw new Error('Použití: npm run cli -- search "hledaný text"');
      }

      const notes = await fetchJson(
        fetchImpl,
        `${apiUrl}?search=${encodeURIComponent(term)}`,
      );
      printNotes(notes, output);
      return notes;
    }

    default:
      throw new Error(`Neznámý příkaz "${command}". Spusť: npm run cli -- help`);
  }
}

const isDirectRun =
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  runCli().catch((error) => {
    console.error(`Chyba: ${error.message}`);
    process.exitCode = 1;
  });
}

import test from "node:test";
import assert from "node:assert/strict";
import { runCli } from "../cli.js";

function createOutput() {
  return {
    logs: [],
    tables: [],
    log(value) {
      this.logs.push(value);
    },
    table(value) {
      this.tables.push(value);
    },
  };
}

test("CLI add pošle POST s poznámkou", async () => {
  let capturedRequest;
  const fakeFetch = async (url, options) => {
    capturedRequest = { url, options };
    return new Response(
      JSON.stringify({
        message: "Poznámka přidána",
        note: { id: 7, text: "CLI test", category: "node" },
      }),
      { status: 201, headers: { "Content-Type": "application/json" } },
    );
  };
  const output = createOutput();

  await runCli(["add", "CLI test", "node"], fakeFetch, output);

  assert.equal(capturedRequest.options.method, "POST");
  assert.deepEqual(JSON.parse(capturedRequest.options.body), {
    text: "CLI test",
    category: "node",
  });
  assert.match(output.logs[0], /ID: 7/);
});

test("CLI search správně zakóduje hledaný text", async () => {
  let capturedUrl;
  const fakeFetch = async (url) => {
    capturedUrl = url;
    return new Response("[]", {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  await runCli(["search", "Express Router"], fakeFetch, createOutput());

  assert.match(capturedUrl, /search=Express%20Router/);
});

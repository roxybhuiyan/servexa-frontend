import fs from "node:fs";
import assert from "node:assert/strict";
const read = (path) =>
  JSON.parse(fs.readFileSync(new URL("../" + path, import.meta.url), "utf8"));
const endpoints = read("docs/endpoint-coverage.json"),
  postman = read("docs/postman-coverage.json"),
  pages = read("docs/page-coverage.json");
assert.equal(endpoints.length, 66);
assert.equal(new Set(endpoints.map((e) => e.id)).size, 66);
assert.equal(postman.length, 73);
assert.equal(pages.length, 31);
const adapter = fs.readFileSync(
  new URL("../src/api/services.ts", import.meta.url),
  "utf8",
);
const source = fs
  .readdirSync(new URL("../src/features/", import.meta.url))
  .map((f) =>
    fs.readFileSync(new URL("../src/features/" + f, import.meta.url), "utf8"),
  )
  .join("\n");
const router = fs.readFileSync(
  new URL("../src/app/router.tsx", import.meta.url),
  "utf8",
);
for (const e of endpoints) {
  if (e.status === "implemented") {
    assert(adapter.includes(e.id + ":"), `Missing adapter ${e.id}`);
    assert(
      fs.existsSync(new URL("../" + e.implementation, import.meta.url)),
      `Missing implementation ${e.id}`,
    );
  } else assert(["E35", "E64", "E65", "E66"].includes(e.id));
}
for (const p of postman) assert(endpoints.some((e) => e.id === p.e));
for (const p of pages)
  assert(
    router.includes('"' + p.path.split("?")[0] + '"'),
    `Missing route ${p.id}`,
  );
assert(!source.includes("dangerouslySetInnerHTML"));
assert(!adapter.includes("stripe/webhook"));
assert(!source.includes("sk_test_"));
assert(!source.includes("sk_live_"));
console.log(
  "Coverage verified: 66 routes (62 browser, 4 exceptions), 73 Postman examples, 31 screens.",
);

// Optional direct comparison when the sibling backend is present. Never reads
// environment values or copies request bodies / credentials into this project.
const collectionUrl = new URL(
  "../../servexa-backend/postman/Servexa.postman_collection.json",
  import.meta.url,
);
if (fs.existsSync(collectionUrl)) {
  const collection = JSON.parse(fs.readFileSync(collectionUrl, "utf8"));
  const requests = [];
  const walk = (items) => {
    for (const item of items) {
      if (item.request) requests.push(item);
      if (item.item) walk(item.item);
    }
  };
  walk(collection.item);
  assert.equal(requests.length, 73);
  const canonical = (path) =>
    path.replace(/\{\{[^}]+\}\}/g, ":id").replace(/:[A-Za-z]+/g, ":id");
  for (let i = 0; i < requests.length; i++) {
    const item = requests[i],
      entry = postman[i],
      endpoint = endpoints.find((e) => e.id === entry.e);
    assert.equal(item.name, entry.name);
    assert.equal(item.request.method, endpoint.method);
    const raw =
      typeof item.request.url === "string"
        ? item.request.url
        : item.request.url.raw;
    const path = raw
      .replace(/^\{\{baseUrl\}\}/, "")
      .split("?")[0]
      .replace(/^\/api\/v1/, "");
    assert.equal(
      canonical(path),
      canonical(endpoint.path),
      `Postman route mismatch ${entry.id}`,
    );
  }
  console.log("Direct Postman method/path comparison: all 73 examples match.");
}

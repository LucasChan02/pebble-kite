#!/usr/bin/env node

// Writes package.json -> pebble.messageKeys from scripts/message-keys.js and
// refuses to run if the declared key bands could ever collide.

import { readFileSync, writeFileSync } from "fs";
import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const {
  CONFIG_KEYS,
  PROTOCOL_KEY_BASE,
  PROTOCOL_KEYS,
} = require("./message-keys.js");

const TAG = "[generate-message-keys]";

const fail = (message) => {
  console.error(`${TAG} ERROR: ${message}`);
  process.exit(1);
};

// --- validate the declared layout before touching anything -------------------

for (const [label, names] of [
  ["CONFIG_KEYS", CONFIG_KEYS.map((key) => key.name)],
  ["PROTOCOL_KEYS", PROTOCOL_KEYS],
]) {
  const seen = new Set();
  for (const name of names) {
    if (seen.has(name)) fail(`duplicate key "${name}" in ${label}`);
    seen.add(name);
  }
}

const shared = CONFIG_KEYS.map((key) => key.name).filter((name) =>
  PROTOCOL_KEYS.includes(name),
);
if (shared.length)
  fail(`key(s) declared as both config and protocol: ${shared}`);

const bands = CONFIG_KEYS.map(({ name, id, capacity }) => ({
  name,
  start: id,
  end: id + capacity - 1,
})).sort((a, b) => a.start - b.start);

for (let i = 1; i < bands.length; i++) {
  const previous = bands[i - 1];
  const current = bands[i];
  if (current.start <= previous.end) {
    fail(
      `config bands overlap: "${previous.name}" claims ${previous.start}-${previous.end} ` +
        `but "${current.name}" starts at ${current.start}`,
    );
  }
}

const highestConfigId = bands.at(-1).end;
if (highestConfigId >= PROTOCOL_KEY_BASE) {
  fail(
    `config keys reach ${highestConfigId}, which collides with the protocol ` +
      `key band starting at ${PROTOCOL_KEY_BASE}`,
  );
}

// --- assign IDs --------------------------------------------------------------

const pkgPath = path.join(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."),
  "package.json",
);
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
const existing = pkg.pebble.messageKeys ?? {};
const configIds = new Set(CONFIG_KEYS.map((key) => key.id));

const messageKeys = {};
const usedIds = new Set();

for (const { name, id } of CONFIG_KEYS) {
  if (existing[name] !== undefined && existing[name] !== id) {
    console.warn(`${TAG} WARNING: "${name}" moved ${existing[name]} -> ${id}`);
  }
  messageKeys[name] = id;
  usedIds.add(id);
}

let nextId = PROTOCOL_KEY_BASE;
for (const name of PROTOCOL_KEYS) {
  const current = existing[name];
  const reusable =
    current !== undefined && !configIds.has(current) && !usedIds.has(current);

  if (!reusable) {
    while (usedIds.has(nextId)) nextId++;
    messageKeys[name] = nextId;
    usedIds.add(nextId);
    if (current === undefined) {
      console.log(`${TAG} Assigned new key "${name}" to ${nextId}`);
    }
  } else {
    messageKeys[name] = current;
    usedIds.add(current);
  }
}

for (const name of Object.keys(existing)) {
  if (!(name in messageKeys)) {
    console.warn(
      `${TAG} WARNING: "${name}" (id ${existing[name]}) is in package.json but ` +
        `not in scripts/message-keys.js, removing it`,
    );
  }
}

// --- write -------------------------------------------------------------------

const ordered = {};
for (const { name } of CONFIG_KEYS) ordered[name] = messageKeys[name];
for (const name of PROTOCOL_KEYS) ordered[name] = messageKeys[name];
pkg.pebble.messageKeys = ordered;

writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
console.log(
  `${TAG} ${CONFIG_KEYS.length} config keys (${bands[0].start}-${highestConfigId}), ` +
    `${PROTOCOL_KEYS.length} protocol keys`,
);

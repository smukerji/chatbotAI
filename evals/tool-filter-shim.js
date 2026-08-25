/**
 * Lets the eval runner exercise the tool-filtering logic from plain Node.
 *
 * buildAssistantTools() lives in TypeScript and imports app-only module aliases,
 * so it cannot be required directly. Rather than restate the tool lists here
 * (which would drift), this shim parses them out of the two source files, so a
 * change in either is picked up by the evals automatically.
 *
 *   assistant-creation-contants.ts -> which tools each assistant type declares
 *   assistant-tools.ts             -> IMPLEMENTED / SHOPIFY / BOOKING sets
 *
 * If assistant-tools.ts is absent (e.g. checked out before the tool-filtering
 * change) the shim reports it, and the capability suite is expected to fail —
 * that is the golden set doing its job.
 */
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "..", "src", "app", "_helpers");
const CONSTANTS = path.join(SRC, "assistant-creation-contants.ts");
const FILTER = path.join(SRC, "server", "assistant-tools.ts");

const TYPE_TO_SLUG = {}; // ECOMMERCE_AGENT_SHOPIFY -> "ecommerce-agent-shopify"

function parseEnum(src) {
  const block = src.slice(src.indexOf("export enum AssistantType"));
  const end = block.indexOf("}");
  for (const m of block.slice(0, end).matchAll(/([A-Z_]+)\s*=\s*"([a-z0-9-]+)"/g)) {
    TYPE_TO_SLUG[m[1]] = m[2];
  }
}

/** slug -> [toolName, ...] as declared by getAssistantTools */
function parseDeclaredTools(src) {
  const start = src.indexOf("export function getAssistantTools");
  if (start === -1) throw new Error("getAssistantTools not found");
  const body = src.slice(start);
  const re = /case AssistantType\.([A-Z_]+):/g;
  const blocks = {};
  let m, prev = null, prevIdx = 0;
  while ((m = re.exec(body))) {
    if (prev) blocks[prev] = body.slice(prevIdx, m.index);
    prev = m[1];
    prevIdx = m.index;
  }
  if (prev) blocks[prev] = body.slice(prevIdx);

  const out = {};
  for (const [key, text] of Object.entries(blocks)) {
    const names = [...new Set([...text.matchAll(/name:\s*"([a-z_]+)"/g)].map((x) => x[1]))];
    out[TYPE_TO_SLUG[key] || key] = names;
  }
  return out;
}

function parseSet(src, constName) {
  const i = src.indexOf(`const ${constName}`);
  if (i === -1) return null;
  const chunk = src.slice(i, src.indexOf("]);", i));
  return new Set([...chunk.matchAll(/"([a-z_]+)"/g)].map((x) => x[1]));
}

const constantsSrc = fs.readFileSync(CONSTANTS, "utf8");
parseEnum(constantsSrc);
const DECLARED = parseDeclaredTools(constantsSrc);

if (!fs.existsSync(FILTER)) {
  throw new Error(
    "assistant-tools.ts not found — tool filtering is not present on this checkout"
  );
}
const filterSrc = fs.readFileSync(FILTER, "utf8");
const IMPLEMENTED = parseSet(filterSrc, "IMPLEMENTED_TOOLS");
const SHOPIFY = parseSet(filterSrc, "SHOPIFY_TOOLS");
const BOOKING = parseSet(filterSrc, "BOOKING_TOOLS");

if (!IMPLEMENTED || !SHOPIFY || !BOOKING) {
  throw new Error("could not parse tool sets from assistant-tools.ts");
}

function buildAssistantTools({ assistantType, chatbotRecord, hasCalendar }) {
  const hasShopify = !!chatbotRecord?.integrations?.shopify?.token;
  const dropped = {};
  const names = (DECLARED[assistantType] || []).filter((name) => {
    if (!IMPLEMENTED.has(name)) { dropped[name] = "no handler"; return false; }
    if (SHOPIFY.has(name) && !hasShopify) { dropped[name] = "no shopify integration"; return false; }
    if (BOOKING.has(name) && !hasCalendar) { dropped[name] = "no google calendar connected"; return false; }
    return true;
  });
  return { tools: names.map((name) => ({ name })), dropped };
}

module.exports = { buildAssistantTools, DECLARED, IMPLEMENTED, SHOPIFY, BOOKING };

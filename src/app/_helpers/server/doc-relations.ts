/**
 * Domain-agnostic typed relation extraction for ANY document.
 *
 * Phase 1: hierarchy/escalation (reports_to / escalates_to).
 * Phase 2 (MMGraphRAG / Docling-Graph / MegaRAG pattern):
 * 1) Open relation labels (flows_to, depends_on, part_of, …) as relation_edge facts
 * 2) Cheap vision triage before full diagram extract (skip photos/logos)
 * 3) Evidence + confidence gates — prefer omit over invent
 *
 * No industry/hotel/paper-specific role maps.
 */

import { OpenAI } from "openai";
import { createHash } from "crypto";

export type RelationKind =
  | "reports_to"
  | "escalates_to"
  | "flows_to"
  | "depends_on"
  | "part_of"
  | "other";

export type TypedRelation = {
  from: string;
  to: string;
  relation: RelationKind;
  /** Open snake_case label from LLM / regex (Phase 2). */
  relationLabel: string;
  evidence: string;
  confidence: number;
};

export type RelationFact = {
  type: "org_report" | "org_escalation" | "relation_edge" | "other";
  label: string;
  value: string;
  normalized: string;
  filename: string;
};

export type DiagramType =
  | "org_chart"
  | "flowchart"
  | "network"
  | "table_like"
  | "photo"
  | "logo"
  | "other";

export type DiagramTriage = {
  isRelationalDiagram: boolean;
  diagramType: DiagramType;
  confidence: number;
};

/** Hierarchy / authority section cues (any industry, English). */
export const RELATION_SECTION_RE =
  /\b(organizational\s+hierarchy|reporting\s+structure|org(?:anizational)?\s+chart|chain\s+of\s+command|escalation\s+(?:rule|path|matrix|flow)|governance\s+structure|management\s+structure|reporting\s+lines?|who\s+reports\s+to)\b/i;

/** Broader diagram / process / dependency section cues (Phase 2). */
export const DIAGRAM_SECTION_RE =
  /\b(flow\s*chart|process\s+flow|lifecycle|decision\s+tree|architecture|dependency|dependencies|supply\s+chain|distribution\s+network|data\s+flow|pipeline|state\s+machine|sequence\s+diagram|uml|network\s+diagram|call\s+graph|workflow|swimlane)\b/i;

function defaultLabelForKind(kind: RelationKind): string {
  switch (kind) {
    case "reports_to":
      return "reports_to";
    case "escalates_to":
      return "escalates_to";
    case "flows_to":
      return "flows_to";
    case "depends_on":
      return "depends_on";
    case "part_of":
      return "part_of";
    default:
      return "related_to";
  }
}

export function normalizeRelationLabel(raw: string): string {
  const s = String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);
  return s || "related_to";
}

export function mapToRelationKind(raw: string): RelationKind {
  const s = normalizeRelationLabel(raw);
  if (
    /^(reports?_to|supervised_by|solid_line|dotted_line|accountable_to|manager_of)$/.test(
      s
    ) ||
    s.includes("report")
  ) {
    return "reports_to";
  }
  if (s.includes("escalat")) return "escalates_to";
  if (
    /^(flows?_to|next_step|then|leads_to|goes_to|proceeds_to|transitions_to)$/.test(
      s
    ) ||
    s.includes("flow") ||
    s.includes("next")
  ) {
    return "flows_to";
  }
  if (
    /^(depends_on|requires|calls|invokes|uses|upstream_of)$/.test(s) ||
    s.includes("depend")
  ) {
    return "depends_on";
  }
  if (/^(part_of|contains|includes|member_of)$/.test(s) || s.includes("part")) {
    return "part_of";
  }
  return "other";
}

/** Text/caption gate: hierarchy OR generic relational-diagram cues. */
export function isRelationDiagramCandidate(params: {
  headingPath?: string;
  caption?: string;
  content?: string;
}): boolean {
  const blob = [params.headingPath, params.caption, params.content]
    .map((s) => String(s || ""))
    .join("\n");
  if (!blob.trim()) return false;
  if (RELATION_SECTION_RE.test(blob) || DIAGRAM_SECTION_RE.test(blob)) {
    return true;
  }
  const roleHits = (
    blob.match(
      /\b(?:manager|director|supervisor|agent|officer|lead|head|executive|coordinator|chief|vp|president|step|stage|service|module|component|supplier|warehouse)\b/gi
    ) || []
  ).length;
  return (
    roleHits >= 4 &&
    /\b(report|hierarch|org|escalat|structure|chart|flow|process|depend|network|pipeline|architect)\b/i.test(
      blob
    )
  );
}

export type PictureForRelations = {
  content?: string;
  caption?: string;
  image_path?: string;
  source_url?: string;
  heading_path?: string;
  headings?: string[] | string;
};

/**
 * Resolve Docling picture refs to something OpenAI vision can fetch.
 * Prefer real image URLs (image_path PNG/JPEG) over PDF source_url.
 */
export async function resolvePictureImage(picture: PictureForRelations): Promise<{
  imageUrl?: string;
  imageBase64?: string;
  mimeType?: string;
} | null> {
  const isImageHttp = (raw: string) =>
    /^https?:\/\//i.test(raw) &&
    (/\.(png|jpe?g|gif|webp|bmp|svg)(\?|#|$)/i.test(raw) ||
      /\/image[_-]/i.test(raw) ||
      /\/pictures?\//i.test(raw));

  const isPdfOrDoc = (raw: string) =>
    /\.(pdf|docx?|pptx?|xlsx?)(\?|#|$)/i.test(raw);

  const candidates = [picture.image_path, picture.source_url]
    .map((s) => String(s || "").trim())
    .filter(Boolean);

  /// 1) Prefer explicit image http(s) / data URLs
  for (const raw of candidates) {
    if (/^data:image\//i.test(raw)) {
      const dataMatch = raw.match(/^data:([^;]+);base64,(.+)$/i);
      if (dataMatch) {
        return { imageBase64: dataMatch[2], mimeType: dataMatch[1] };
      }
      return { imageUrl: raw };
    }
    if (isImageHttp(raw)) {
      return { imageUrl: raw };
    }
  }

  /// 2) Any http(s) that is not clearly a document file
  for (const raw of candidates) {
    if (/^https?:\/\//i.test(raw) && !isPdfOrDoc(raw)) {
      return { imageUrl: raw };
    }
  }

  /// Local / relative path → read bytes if present on disk
  try {
    const fs = await import("fs/promises");
    const pathMod = await import("path");
    for (const raw of candidates) {
      if (/^https?:\/\//i.test(raw) || raw.startsWith("data:")) continue;
      const abs = pathMod.isAbsolute(raw)
        ? raw
        : pathMod.resolve(process.cwd(), raw);
      try {
        const buf = await fs.readFile(abs);
        const ext = pathMod.extname(abs).toLowerCase();
        const mimeType =
          ext === ".jpg" || ext === ".jpeg"
            ? "image/jpeg"
            : ext === ".webp"
              ? "image/webp"
              : ext === ".gif"
                ? "image/gif"
                : "image/png";
        return { imageBase64: buf.toString("base64"), mimeType };
      } catch {
        /// try next candidate
      }
    }
  } catch {
    /// ignore
  }

  console.warn(
    "[doc-relations] could not resolve picture image for vision:",
    candidates[0] || "(empty)"
  );
  return null;
}

export function mergeTypedRelations(
  ...lists: TypedRelation[][]
): TypedRelation[] {
  const best = new Map<string, TypedRelation>();
  for (const list of lists) {
    for (const r of list) {
      if (!r?.from || !r?.to) continue;
      const label = r.relationLabel || defaultLabelForKind(r.relation);
      const key = `${r.relation}|${label}|${normKey(r.from)}|${normKey(r.to)}`;
      const prev = best.get(key);
      if (!prev || (r.confidence || 0) > (prev.confidence || 0)) {
        best.set(key, { ...r, relationLabel: label });
      }
    }
  }
  return Array.from(best.values());
}

/** Explicit relation verbs that appear in almost any org/ops/academic/corporate doc. */
const REPORTS_PATTERNS: RegExp[] = [
  /\b([A-Z][^.\n,]{2,60}?)\s+reports?\s+(?:directly\s+)?to\s+(?:the\s+)?([A-Z][^.\n,]{2,60}?)(?:\.|,|;|\n|$)/gi,
  /\b([A-Z][^.\n,]{2,60}?)\s+(?:is\s+)?(?:directly\s+)?supervised\s+by\s+(?:the\s+)?([A-Z][^.\n,]{2,60}?)(?:\.|,|;|\n|$)/gi,
  /\b([A-Z][^.\n,]{2,60}?)\s+(?:solid[-\s]?line|dotted[-\s]?line)\s+(?:reports?\s+)?to\s+(?:the\s+)?([A-Z][^.\n,]{2,60}?)(?:\.|,|;|\n|$)/gi,
];

const ESCALATE_PATTERNS: RegExp[] = [
  /\b([A-Z][^.\n,]{2,80}?)\s+must\s+escalate[^\n.]{0,100}?to\s+(?:the\s+)?([A-Z][^.\n,]{2,60}?)(?:\.|,|;|\n|$)/gi,
  /\b([A-Z][^.\n,]{2,60}?)\s+escalates?\s+to\s+(?:the\s+)?([A-Z][^.\n,]{2,60}?)(?:\.|,|;|\n|$)/gi,
  /\bescalate\s+(?:any\s+)?(?:unresolved\s+)?[^\n.]{0,60}?to\s+(?:the\s+)?([A-Z][^.\n,]{2,60}?)(?:\.|,|;|\n|$)/gi,
];

/** Process / dependency verbs (Phase 2 — any domain). Keep conservative. */
const FLOW_PATTERNS: RegExp[] = [
  /\b([A-Z][^.\n,]{2,60}?)\s+(?:then\s+)?(?:flows?|proceeds?|leads|transitions?)\s+to\s+(?:the\s+)?([A-Z][^.\n,]{2,60}?)(?:\.|,|;|\n|$)/gi,
];

const DEPENDS_PATTERNS: RegExp[] = [
  /\b([A-Z][^.\n,]{2,60}?)\s+depends\s+on\s+(?:the\s+)?([A-Z][^.\n,]{2,60}?)(?:\.|,|;|\n|$)/gi,
];

function normKey(value: string): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function cleanEntity(raw: string): string {
  return String(raw || "")
    .replace(/\s+/g, " ")
    .replace(/^(the|a|an)\s+/i, "")
    .replace(/\s+(and|,).*$/i, (m, _g, offset, s) => {
      /// Keep "X and Y" compounds only if short; else truncate at and/comma for single entity
      if (String(s).length < 50 && /\band\b/i.test(m)) return m;
      return "";
    })
    .replace(/\s+within\s+\d+.*$/i, "")
    .replace(/\s+if\s+resolution\b.*$/i, "")
    .replace(/\s+in\s+\d+\s*(?:minutes?|hours?|days?).*$/i, "")
    .replace(/[.,;:]+$/g, "")
    .trim();
}

function normalizeForMatch(value: string): string {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function evidenceSupportsRelation(
  from: string,
  to: string,
  evidence: string,
  corpus: string
): boolean {
  const c = normalizeForMatch(corpus);
  const ev = normalizeForMatch(evidence);
  const f = normalizeForMatch(from);
  const t = normalizeForMatch(to);
  if (!c || !f || !t) return false;
  if (!c.includes(f) || !c.includes(t)) return false;
  if (ev.length >= 8 && !c.includes(ev) && !ev.includes(f)) return false;
  /// Evidence should mention both ends when long enough
  if (ev.length >= 12 && (!ev.includes(f) || !ev.includes(t.split(" ")[0]))) {
    /// allow if corpus has both and evidence is a relation cue near them
    if (!/\breport|supervis|escalat|manager of|accountable to|flows? to|depends on|requires|calls|next step|proceeds to\b/i.test(evidence)) {
      return false;
    }
  }
  return true;
}

/** Find a relation-dense window; fall back to head of doc. */
export function relationSourceWindow(fullText: string, maxChars = 5000): string {
  const text = String(fullText || "");
  const start = text.search(
    new RegExp(
      `${RELATION_SECTION_RE.source}|${DIAGRAM_SECTION_RE.source}`,
      "i"
    )
  );
  if (start >= 0) {
    return text.slice(start, start + maxChars).trim();
  }
  /// If explicit relation verbs exist elsewhere, take a window around first hit
  const verbAt = text.search(
    /\breports?\s+to\b|\bsupervised\s+by\b|\bescalates?\s+to\b|\bmust\s+escalate\b|\bdepends\s+on\b|\bflows?\s+to\b|\bproceeds?\s+to\b|\bnext\s+step\b/i
  );
  if (verbAt >= 0) {
    const from = Math.max(0, verbAt - 400);
    return text.slice(from, from + maxChars).trim();
  }
  return "";
}

function pushRelation(
  out: TypedRelation[],
  from: string,
  to: string,
  relation: RelationKind,
  evidence: string,
  confidence: number,
  relationLabel?: string
): void {
  const a = cleanEntity(from);
  const b = cleanEntity(to);
  if (!a || !b || a.length < 2 || b.length < 2) return;
  if (normKey(a) === normKey(b)) return;
  if (a.length > 90 || b.length > 90) return;
  out.push({
    from: a,
    to: b,
    relation,
    relationLabel: normalizeRelationLabel(
      relationLabel || defaultLabelForKind(relation)
    ),
    evidence: String(evidence || "").replace(/\s+/g, " ").trim().slice(0, 240),
    confidence,
  });
}

/** Regex pass: only explicit relation sentences (any domain). */
export function extractExplicitRelationsFromText(text: string): TypedRelation[] {
  const window = relationSourceWindow(text) || text.slice(0, 5000);
  const out: TypedRelation[] = [];

  for (const re of REPORTS_PATTERNS) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(window))) {
      pushRelation(out, m[1], m[2], "reports_to", m[0], 0.9);
    }
  }

  for (const re of ESCALATE_PATTERNS) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(window))) {
      if (m[2]) {
        pushRelation(out, m[1], m[2], "escalates_to", m[0], 0.9);
      } else if (m[1] && /escalate/i.test(m[0])) {
        /// pattern with only target — skip ambiguous subject
        continue;
      }
    }
  }

  for (const re of FLOW_PATTERNS) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(window))) {
      pushRelation(out, m[1], m[2], "flows_to", m[0], 0.85, "flows_to");
    }
  }

  for (const re of DEPENDS_PATTERNS) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(window))) {
      pushRelation(out, m[1], m[2], "depends_on", m[0], 0.85, "depends_on");
    }
  }

  /// Compound subjects: "A and B must escalate ... to C"
  const compound = Array.from(
    window.matchAll(
      /\b([A-Z][^.\n]{2,50}?)\s+and\s+([A-Z][^.\n]{2,50}?)\s+must\s+escalate[^\n.]{0,100}?to\s+(?:the\s+)?([A-Z][^.\n,]{2,60}?)(?:\.|,|;|\n|$)/gi
    )
  );
  for (const m of compound) {
    pushRelation(out, m[1], m[3], "escalates_to", m[0], 0.9);
    pushRelation(out, m[2], m[3], "escalates_to", m[0], 0.9);
  }

  return out.filter((r) =>
    evidenceSupportsRelation(r.from, r.to, r.evidence, window)
  );
}

type LlmRelationPayload = {
  relations?: Array<{
    from?: string;
    to?: string;
    relation?: string;
    relation_label?: string;
    evidence?: string;
    confidence?: number;
  }>;
};

function parseRelationRows(
  rows: LlmRelationPayload["relations"],
  corpus: string,
  opts?: { requireCorpusEvidence?: boolean }
): TypedRelation[] {
  const requireCorpus = opts?.requireCorpusEvidence !== false;
  const out: TypedRelation[] = [];
  for (const row of rows || []) {
    const rawKind = String(row.relation || row.relation_label || "other");
    const kind = mapToRelationKind(rawKind);
    const label = normalizeRelationLabel(
      String(row.relation_label || row.relation || defaultLabelForKind(kind))
    );
    const from = cleanEntity(String(row.from || ""));
    const to = cleanEntity(String(row.to || ""));
    const evidence = String(row.evidence || "").trim();
    const confidence = Number(row.confidence);
    if (!from || !to) continue;
    if (requireCorpus) {
      if (evidence.length < 8) continue;
      if (!evidenceSupportsRelation(from, to, evidence, corpus)) continue;
      if (
        kind !== "other" &&
        !/\breport|supervis|escalat|accountable|manager of|solid[-\s]?line|dotted[-\s]?line|flows?|depends|requires|calls|next|proceeds|→|->\b/i.test(
          evidence
        )
      ) {
        continue;
      }
    } else if (!Number.isFinite(confidence) || confidence < 0.6) {
      continue;
    }
    out.push({
      from,
      to,
      relation: kind,
      relationLabel: label,
      evidence: (evidence || "visual diagram").slice(0, 240),
      confidence: Number.isFinite(confidence) ? confidence : 0.7,
    });
  }
  return out.filter((r) => r.confidence >= 0.6);
}

/**
 * LLM fill only for explicitly evidenced relations.
 * Instructed NOT to invent edges from unordered title lists / diagrams-without-links.
 */
export async function extractRelationsWithLlm(
  fullText: string
): Promise<TypedRelation[]> {
  if (!process.env.NEXT_PUBLIC_OPENAI_KEY) return [];
  const window = relationSourceWindow(fullText);
  if (!window || window.length < 40) return [];

  try {
    const openai = new OpenAI({ apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY });
    const resp = await openai.chat.completions.create({
      model: process.env.CONTEXT_MODEL || "gpt-4o-mini",
      temperature: 0,
      max_tokens: 900,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You extract typed entity relationships from ANY document (manuals, policies, papers, handbooks, architecture docs, SOPs).

Return JSON:
{"relations":[{"from":string,"to":string,"relation":"reports_to"|"escalates_to"|"flows_to"|"depends_on"|"part_of"|"other","relation_label":string,"evidence":string,"confidence":0-1}]}

Hard rules (global, domain-agnostic):
- Emit a relation ONLY when the evidence quote explicitly states it (e.g. "reports to", "escalates to", "flows to", "depends on", "then", "calls").
- Do NOT infer edges from a flat list of titles, an unlabeled diagram dump, or nearby unrelated sections.
- reports_to ≠ escalates_to ≠ flows_to. Never copy escalation into reporting.
- Both "from" and "to" must appear verbatim in the source. Never invent entities.
- relation_label: short snake_case open label (e.g. reports_to, next_step, calls).
- If unsure, return {"relations":[]}. Prefer empty over guesses.
- Max 25 relations.`,
        },
        {
          role: "user",
          content: `Source:\n${window.slice(0, 4500)}`,
        },
      ],
    });
    const parsed = JSON.parse(
      resp.choices[0]?.message?.content || "{}"
    ) as LlmRelationPayload;
    return parseRelationRows(parsed.relations, window, {
      requireCorpusEvidence: true,
    });
  } catch (err) {
    console.warn(
      "[doc-relations] LLM relation extract failed:",
      (err as Error)?.message || err
    );
    return [];
  }
}

/**
 * Cheap vision triage (gpt-4o-mini): is this a relational diagram worth a full extract?
 * Pattern: Neural Base / LatentRouter-style routing before expensive GPT-4o parse.
 */
export async function triageDiagramImage(params: {
  imageUrl?: string;
  imageBase64?: string;
  mimeType?: string;
}): Promise<DiagramTriage> {
  const fallback: DiagramTriage = {
    isRelationalDiagram: false,
    diagramType: "other",
    confidence: 0,
  };
  if (!process.env.NEXT_PUBLIC_OPENAI_KEY) return fallback;
  const { imageUrl, imageBase64, mimeType = "image/png" } = params;
  if (!imageUrl && !imageBase64) return fallback;

  try {
    const openai = new OpenAI({ apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY });
    const imageContent = imageBase64
      ? {
          type: "image_url" as const,
          image_url: {
            url: `data:${mimeType};base64,${imageBase64}`,
            detail: "low" as const,
          },
        }
      : {
          type: "image_url" as const,
          image_url: { url: String(imageUrl), detail: "low" as const },
        };

    const resp = await openai.chat.completions.create({
      model: process.env.CONTEXT_MODEL || "gpt-4o-mini",
      temperature: 0,
      max_tokens: 120,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Classify whether an image is a relational diagram (boxes/nodes + connectors/arrows) vs photo/logo/decoration.

Return JSON:
{"is_relational_diagram":boolean,"diagram_type":"org_chart"|"flowchart"|"network"|"table_like"|"photo"|"logo"|"other","confidence":0-1}

is_relational_diagram=true only for org charts, flowcharts, architecture/dependency/network graphs, escalation trees, process swimlanes.
false for photos, logos, icons, decorative banners, plain text screenshots without connectors.`,
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Classify this figure." },
            imageContent,
          ],
        },
      ],
    });
    const parsed = JSON.parse(resp.choices[0]?.message?.content || "{}") as {
      is_relational_diagram?: boolean;
      diagram_type?: string;
      confidence?: number;
    };
    const diagramType = String(parsed.diagram_type || "other") as DiagramType;
    const allowed: DiagramType[] = [
      "org_chart",
      "flowchart",
      "network",
      "table_like",
      "photo",
      "logo",
      "other",
    ];
    return {
      isRelationalDiagram: Boolean(parsed.is_relational_diagram),
      diagramType: allowed.includes(diagramType) ? diagramType : "other",
      confidence: Number.isFinite(Number(parsed.confidence))
        ? Number(parsed.confidence)
        : 0.5,
    };
  } catch (err) {
    console.warn(
      "[doc-relations] diagram triage failed:",
      (err as Error)?.message || err
    );
    return fallback;
  }
}

/**
 * Caption for indexing (LangChain Option 3): searchable text handle for empty Docling picture.content.
 */
export async function describePictureForIndex(params: {
  imageUrl?: string;
  imageBase64?: string;
  mimeType?: string;
  filename?: string;
}): Promise<string> {
  if (!process.env.NEXT_PUBLIC_OPENAI_KEY) return "";
  const { imageUrl, imageBase64, mimeType = "image/png", filename } = params;
  if (!imageUrl && !imageBase64) return "";

  try {
    const openai = new OpenAI({ apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY });
    const imageContent = imageBase64
      ? {
          type: "image_url" as const,
          image_url: {
            url: `data:${mimeType};base64,${imageBase64}`,
            detail: "low" as const,
          },
        }
      : {
          type: "image_url" as const,
          image_url: { url: String(imageUrl), detail: "low" as const },
        };

    const resp = await openai.chat.completions.create({
      model: process.env.CONTEXT_MODEL || "gpt-4o-mini",
      temperature: 0,
      max_tokens: 220,
      messages: [
        {
          role: "system",
          content: `Describe this document figure for retrieval search. Mention diagram type (org chart, flowchart, table, photo, etc.), visible labels/titles, and key relationships if any. 2-4 sentences. No speculation beyond what is visible.`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Filename: ${filename || "document"}\nDescribe the figure.`,
            },
            imageContent,
          ],
        },
      ],
    });
    return String(resp.choices[0]?.message?.content || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 800);
  } catch (err) {
    console.warn(
      "[doc-relations] picture caption failed:",
      (err as Error)?.message || err
    );
    return "";
  }
}

/**
 * Vision path: any relational diagram → open-label edges (Phase 2).
 * Hierarchy kinds still map to org_report / org_escalation facts.
 */
export async function extractRelationsFromImage(params: {
  imageUrl?: string;
  imageBase64?: string;
  mimeType?: string;
  filename: string;
  diagramTypeHint?: DiagramType;
}): Promise<TypedRelation[]> {
  if (!process.env.NEXT_PUBLIC_OPENAI_KEY) return [];
  const {
    imageUrl,
    imageBase64,
    mimeType = "image/png",
    filename,
    diagramTypeHint,
  } = params;
  if (!imageUrl && !imageBase64) return [];

  try {
    const openai = new OpenAI({ apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY });
    const imageContent = imageBase64
      ? {
          type: "image_url" as const,
          image_url: {
            url: `data:${mimeType};base64,${imageBase64}`,
          },
        }
      : {
          type: "image_url" as const,
          image_url: { url: String(imageUrl) },
        };

    const resp = await openai.chat.completions.create({
      model: process.env.VISION_MODEL || "gpt-4o",
      temperature: 0,
      max_tokens: 1400,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You read diagrams from ANY domain (org charts, flowcharts, escalation trees, architecture/dependency graphs, supply chains).

Return JSON:
{"relations":[{"from":string,"to":string,"relation":"reports_to"|"escalates_to"|"flows_to"|"depends_on"|"part_of"|"other","relation_label":string,"evidence":string,"confidence":0-1}]}

Rules:
- Use visual connectors / nesting / arrows to decide edges.
- ORG CHARTS (critical): "from" = subordinate / lower box / child node; "to" = manager / higher box / parent node.
  Example: if Front Desk Agent sits under Front Office Manager, emit from="Front Desk Agent" to="Front Office Manager" relation="reports_to".
  NEVER reverse hierarchy (do not say the Director reports to a Manager).
- reports_to = solid org hierarchy (subordinate → manager). escalates_to = escalation/incident path if labeled as such.
- flows_to = process/sequence next step (along arrow direction). depends_on = dependency/call edge. part_of = containment.
- relation_label: short open snake_case (e.g. reports_to, next_step, calls, supplies).
- If connectors are unclear, omit the edge (confidence < 0.6 → omit).
- Never invent labels/entities not visible in the image.
- evidence: short visual cue (e.g. "Agent box under Front Office Manager").
- Max 40 relations.`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Filename: ${filename}\nHint diagram_type: ${diagramTypeHint || "unknown"}\nExtract relational edges from this figure.`,
            },
            imageContent,
          ],
        },
      ],
    });

    const parsed = JSON.parse(
      resp.choices[0]?.message?.content || "{}"
    ) as LlmRelationPayload;
    return parseRelationRows(parsed.relations, "", {
      requireCorpusEvidence: false,
    });
  } catch (err) {
    console.warn(
      "[doc-relations] vision relation extract failed:",
      (err as Error)?.message || err
    );
    return [];
  }
}

function humanRelationPhrase(label: string, kind: RelationKind): string {
  const map: Record<string, string> = {
    reports_to: "reports to",
    escalates_to: "escalates to",
    flows_to: "flows to",
    depends_on: "depends on",
    part_of: "is part of",
    next_step: "next step is",
    calls: "calls",
    related_to: "related to",
  };
  if (map[label]) return map[label];
  if (kind === "reports_to") return "reports to";
  if (kind === "escalates_to") return "escalates to";
  if (kind === "flows_to") return "flows to";
  if (kind === "depends_on") return "depends on";
  if (kind === "part_of") return "is part of";
  return label.replace(/_/g, " ");
}

export function relationsToFacts(
  relations: TypedRelation[],
  filename: string
): RelationFact[] {
  const seen = new Set<string>();
  const facts: RelationFact[] = [];
  for (const r of relations) {
    const label = r.relationLabel || defaultLabelForKind(r.relation);
    let type: RelationFact["type"];
    let factLabel: string;
    let value: string;

    if (r.relation === "reports_to") {
      type = "org_report";
      factLabel = "Reports to";
      value = `${r.from} reports to ${r.to}`;
    } else if (r.relation === "escalates_to") {
      type = "org_escalation";
      factLabel = "Escalates to";
      value = `${r.from} escalates to ${r.to}`;
    } else {
      /// Phase 2 open edges — keep even when kind is "other" if label is meaningful
      if (r.relation === "other" && label === "related_to") continue;
      type = "relation_edge";
      factLabel = "Relation";
      value = `${r.from} ${humanRelationPhrase(label, r.relation)} ${r.to}`;
    }

    const normalized = normKey(value);
    const key = `${type}::${normalized}`;
    if (seen.has(key)) continue;
    seen.add(key);
    facts.push({ type, label: factLabel, value, normalized, filename });
  }
  return facts;
}

export function relationFactId(
  chatbotId: string,
  fact: RelationFact
): string {
  const digest = createHash("sha256")
    .update(`${chatbotId}|${fact.filename}|${fact.type}|${fact.normalized}`)
    .digest("hex")
    .slice(0, 32);
  return `docfact-${digest}`;
}

/** Explicit regex + conservative LLM text extraction (typed edges). */
export async function collectTypedRelationsFromText(
  fullText: string
): Promise<TypedRelation[]> {
  const explicit = extractExplicitRelationsFromText(fullText);
  const llm = await extractRelationsWithLlm(fullText);
  return mergeTypedRelations(explicit, llm);
}

/** Merge explicit regex + conservative LLM text extraction → facts. */
export async function extractTypedRelationsFromText(
  fullText: string,
  filename: string
): Promise<RelationFact[]> {
  const merged = await collectTypedRelationsFromText(fullText);
  return relationsToFacts(merged, filename);
}

/**
 * Vision pass: text/caption gate OR cheap triage → full open-label extract.
 * Skips photos/logos; requires resolvable URL or local bytes.
 */
export async function collectTypedRelationsFromPictures(
  pictures: PictureForRelations[] | undefined,
  filename: string,
  opts?: { maxImages?: number }
): Promise<TypedRelation[]> {
  const maxImages = opts?.maxImages ?? 5;
  if (!pictures?.length) return [];

  const out: TypedRelation[] = [];
  let used = 0;

  for (const picture of pictures) {
    if (used >= maxImages) break;
    const heading =
      picture.heading_path ||
      (Array.isArray(picture.headings)
        ? picture.headings.join(" > ")
        : picture.headings) ||
      "";
    const textGate = isRelationDiagramCandidate({
      headingPath: heading,
      caption: picture.caption,
      content: picture.content,
    });

    const resolved = await resolvePictureImage(picture);
    if (!resolved) continue;

    let diagramType: DiagramType | undefined;
    if (!textGate) {
      /// Phase 2: cheap triage when heading/caption are weak
      const triage = await triageDiagramImage(resolved);
      if (!triage.isRelationalDiagram || triage.confidence < 0.55) continue;
      if (triage.diagramType === "photo" || triage.diagramType === "logo") {
        continue;
      }
      diagramType = triage.diagramType;
    }

    used += 1;
    const rels = await extractRelationsFromImage({
      ...resolved,
      filename,
      diagramTypeHint: diagramType,
    });
    out.push(...rels);
  }
  return out;
}

/**
 * Full Phase-1+2 extraction: text + gated/triaged vision, one dedupe pass.
 */
export async function extractDocumentRelationFacts(
  fullText: string,
  filename: string,
  pictures?: PictureForRelations[]
): Promise<RelationFact[]> {
  const fromText = await collectTypedRelationsFromText(fullText);
  const fromImages = await collectTypedRelationsFromPictures(
    pictures,
    filename
  );
  return relationsToFacts(mergeTypedRelations(fromText, fromImages), filename);
}

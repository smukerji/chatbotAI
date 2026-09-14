/**
 * General document-identity extraction for file/PDF RAG.
 *
 * Production pattern (RAGWire / AutoMetaRAG / GROBID+Crossref style):
 * 1) Pull universal identifiers (DOI, ISSN, arXiv) with regex
 * 2) LLM fills a generic schema with per-field evidence quotes
 * 3) Keep a field only if evidence (or the id itself) appears in source text
 * 4) If DOI present, enrich via Crossref (canonical journal/volume/issue/year)
 * 5) Index validated fields as doc_fact vectors + stamp every chunk
 *
 * Hierarchy/escalation edges live in doc-relations.ts (domain-agnostic Phase 1).
 * No hotel-specific role maps.
 */

import { createHash } from "crypto";
import { OpenAI } from "openai";
import { roleFromHeadingPath } from "./doc-structure";
import { relationSourceWindow } from "./doc-relations";

export type DocFactType =
  | "paper_id"
  | "title"
  | "authors"
  | "journal"
  | "publication"
  | "issn"
  | "doi"
  | "acknowledgement"
  | "org_report"
  | "org_escalation"
  | "relation_edge"
  | "other";

export type DocumentMeta = {
  title: string;
  authors: string;
  paperId: string;
  journal: string;
  volume: string;
  issue: string;
  year: string;
  issn: string;
  doi: string;
};

export type DocFact = {
  type: DocFactType;
  value: string;
  label: string;
  normalized: string;
  filename: string;
};

export type SectionRole =
  | "abstract"
  | "references"
  | "acknowledgement"
  | "conclusion"
  | "body"
  | "chrome";

type FieldEvidence = {
  value?: string;
  evidence?: string;
};

type LlmMetaPayload = {
  title?: FieldEvidence | string;
  authors?: FieldEvidence | string;
  paperId?: FieldEvidence | string;
  journal?: FieldEvidence | string;
  volume?: FieldEvidence | string;
  issue?: FieldEvidence | string;
  year?: FieldEvidence | string;
  issn?: FieldEvidence | string;
  doi?: FieldEvidence | string;
  docType?: FieldEvidence | string;
};

const BIBLIOGRAPHIC_QUERY_RE =
  /\b(paper\s*id|article\s*id|document\s*id|doi|issn|arxiv|which journal|published in|publication|volume|issue|year|who (are|wrote|is)|authors?|co-?authors?|title of (this|the) (paper|article|document)|name of (this|the) (paper|article|document)|who (wrote|authored))\b/i;

/// Academic thanks only — do NOT match workplace "supervisor" / org-chart questions.
const ACKNOWLEDGEMENT_QUERY_RE =
  /\b(acknowledg\w*|project\s+guide|thesis\s+guide|(?:project|thesis)\s+supervisor|who\s+is\s+thanked|thanked\s+as|grateful\s+to|sincere\s+gratitude)\b/i;

const ORG_REPORTS_QUERY_RE =
  /\b(report(?:s|ing)?\s+to|who\s+does\s+.+\s+report|direct\s+supervisor|chain\s+of\s+command|org(?:anizational)?\s+(?:chart|hierarchy|structure)|reporting\s+structure|department\s+structure|who\s+is\s+my\s+(?:boss|manager|supervisor))\b/i;

const ORG_ESCALATION_QUERY_RE =
  /\b(escalat(?:e|es|ion)|escalate\s+to|who\s+handles\s+.+\s+escalat)\b/i;

/** Phase 2: process / dependency / architecture relation questions (any domain). */
const RELATION_EDGE_QUERY_RE =
  /\b(upstream|downstream|next\s+step|previous\s+step|what\s+comes\s+(?:before|after)|depends?\s+on|dependenc(?:y|ies)|flows?\s+to|leads?\s+to|process\s+flow|flow\s*chart|call(?:s|ing)?\s+(?:graph|chain)|architecture\s+diagram|who\s+calls|connected\s+to|supply\s+chain)\b/i;

const SECTION_HEADING_RE =
  /\b(?:\d+\.\s*)?(?:[IVX]+\.\s*)?(ABSTRACT|INTRODUCTION|LITERATURE SURVEY|RELATED WORK|METHODOLOGY|PROPOSED|RESULTS|DISCUSSION|CONCLUSION|FUTURE (?:WORK|SCOPE)|REFERENCES|BIBLIOGRAPHY|ACKNOWLEDG\w*|WORKS CITED|ORGANIZATIONAL\s+HIERARCHY)\b/i;

const DOI_RE = /\b(10\.\d{4,9}\/[^\s"'<>\]\)\}]+)/i;
const ISSN_RE = /\bISSN[:\s]*([0-9]{4}[-\s]?[0-9]{3}[0-9Xx])\b/i;
const ARXIV_RE = /\barXiv[:\s]*([0-9]{4}\.[0-9]{4,5}(?:v\d+)?)\b/i;
const VOLUME_ISSUE_RE =
  /\bVolume\s*(\d+)\s*,?\s*Issue\s*(\d+)\b(?:\s*[,|]?\s*(?:[A-Za-z]+\s+)?)?((?:19|20)\d{2})?/i;
const COPYRIGHT_YEAR_RE = /©\s*((?:19|20)\d{2})\b/;

/** Filename / header codes like ABC1234567 — not brand-specific. */
const GENERIC_DOC_CODE_RE = /\b([A-Z]{2,12}\d{4,14})\b/;

const CROSSREF_TIMEOUT_MS = 6000;

function emptyMeta(): DocumentMeta {
  return {
    title: "",
    authors: "",
    paperId: "",
    journal: "",
    volume: "",
    issue: "",
    year: "",
    issn: "",
    doi: "",
  };
}

function normKey(value: string): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function normalizeForMatch(value: string): string {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function pushFact(
  out: DocFact[],
  filename: string,
  type: DocFactType,
  label: string,
  value: string
): void {
  const cleaned = String(value || "").replace(/\s+/g, " ").trim();
  if (!cleaned || cleaned.length < 2 || /\?/.test(cleaned)) return;
  out.push({
    type,
    label,
    value: cleaned,
    normalized: normKey(cleaned),
    filename,
  });
}

export function isBibliographicQuery(query: string): boolean {
  return BIBLIOGRAPHIC_QUERY_RE.test(String(query || ""));
}

export function isAcknowledgementQuery(query: string): boolean {
  return ACKNOWLEDGEMENT_QUERY_RE.test(String(query || ""));
}

export function isOrgReportsQuery(query: string): boolean {
  return ORG_REPORTS_QUERY_RE.test(String(query || ""));
}

export function isOrgEscalationQuery(query: string): boolean {
  return ORG_ESCALATION_QUERY_RE.test(String(query || ""));
}

export function isRelationEdgeQuery(query: string): boolean {
  return RELATION_EDGE_QUERY_RE.test(String(query || ""));
}

export function inferSectionRole(text: string): SectionRole {
  const head = String(text || "")
    .slice(0, 500)
    .replace(/\s+/g, " ")
    .trim();
  if (/\bREFERENCES\b|\bBIBLIOGRAPHY\b|\bWORKS CITED\b/i.test(head)) {
    return "references";
  }
  if (
    head.length < 550 &&
    /\(\d{4}\)/.test(head) &&
    /\b(International Journal|IEEE|ACM|Volume\s+\d+|pp\.\s*\d|doi\.org)\b/i.test(
      head
    ) &&
    !/\bAbstract\b|\bIntroduction\b|\bMethodology\b/i.test(head)
  ) {
    return "references";
  }
  if (/\bACKNOWLEDG\w*\b/i.test(head)) return "acknowledgement";
  if (/\bABSTRACT\b/i.test(head)) return "abstract";
  if (/\bCONCLUSION\b|\bFUTURE WORK\b|\bFUTURE SCOPE\b/i.test(head)) {
    return "conclusion";
  }
  return "body";
}

/**
 * Stamp section roles with heading carry-forward so body paragraphs after
 * "ACKNOWLEDGMENT" keep that role when the heading was split into its own chunk.
 */
export function assignSectionRoles(
  chunks: string[],
  headingPaths?: string[]
): SectionRole[] {
  let carry: SectionRole | null = null;
  return (chunks || []).map((chunk, i) => {
    const fromPath = roleFromHeadingPath(headingPaths?.[i] || "");
    if (fromPath === "acknowledgement" || fromPath === "references" || fromPath === "abstract" || fromPath === "conclusion") {
      carry = fromPath as SectionRole;
      return carry;
    }

    const role = inferSectionRole(chunk);
    const heading = String(chunk || "").match(SECTION_HEADING_RE)?.[1] || "";
    if (heading) {
      const h = heading.toUpperCase();
      if (/ACKNOWLEDG/.test(h)) carry = "acknowledgement";
      else if (/REFERENCE|BIBLIOGRAPHY|WORKS CITED/.test(h))
        carry = "references";
      else if (/ABSTRACT/.test(h)) carry = "abstract";
      else if (/CONCLUSION|FUTURE/.test(h)) carry = "conclusion";
      else carry = "body";
    }
    if (role !== "body") {
      if (
        role === "acknowledgement" ||
        role === "references" ||
        role === "abstract" ||
        role === "conclusion"
      ) {
        carry = role;
      }
      return role;
    }
    return carry || "body";
  });
}

/** Pull acknowledgement / thanks block for guide extraction. */
export function acknowledgementWindow(fullText: string, maxChars = 3500): string {
  const text = String(fullText || "");
  const start = text.search(
    /\bACKNOWLEDG\w*\b|\bThanks\s+and\s+Acknowledg|\bPreface\b[\s\S]{0,80}\bthank/i
  );
  if (start < 0) return "";
  const tail = text.slice(start, start + maxChars);
  const end = tail.search(
    /\n\s*(?:\d+\.\s*)?(?:[IVX]+\.\s*)?(?:CONCLUSION|REFERENCES|BIBLIOGRAPHY|FUTURE (?:WORK|SCOPE)|APPENDIX)\b/i
  );
  return (end > 80 ? tail.slice(0, end) : tail).trim();
}

const ACK_ROLE_LABELS: Record<string, string> = {
  guide: "Project guide",
  supervisor: "Supervisor",
  advisor: "Advisor",
  hod: "Head of Department",
  dean: "Dean",
  funder: "Funder",
  family: "Family acknowledgement",
  colleague: "Acknowledged colleague",
  other: "Acknowledged person",
};

type AckRolePayload = {
  roles?: Array<{
    name?: string;
    role?: string;
    evidence?: string;
  }>;
};

/**
 * Evidence-grounded acknowledgement people via LLM schema over the
 * acknowledgement window. Falls back to empty when window/LLM missing.
 */
export async function extractAcknowledgementFacts(
  fullText: string,
  filename: string
): Promise<DocFact[]> {
  const window = acknowledgementWindow(fullText);
  if (!window || window.length < 40) return [];

  if (!process.env.NEXT_PUBLIC_OPENAI_KEY) {
    return extractAcknowledgementFactsHeuristic(window, filename);
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY });
    const resp = await openai.chat.completions.create({
      model: process.env.CONTEXT_MODEL || "gpt-4o-mini",
      temperature: 0,
      max_tokens: 500,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You extract people/orgs thanked in an Acknowledgement / Preface / Thanks section of ANY document (thesis, paper, report).

Return JSON: {"roles":[{"name":string,"role":"guide|supervisor|advisor|hod|dean|funder|family|colleague|other","evidence":string}]}

Rules:
- Only use names that appear in the source window.
- "evidence" must be a short verbatim quote from the source that supports the name+role.
- Prefer academic guide/supervisor/advisor when the text says guidance, guide, supervised, or mentored.
- If multiple people, return up to 6. If none, return {"roles":[]}.
- Do not invent titles or names.`,
        },
        {
          role: "user",
          content: `Filename: ${filename}\n\nAcknowledgement text:\n${window.slice(0, 3500)}`,
        },
      ],
    });
    const raw = resp.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(raw) as AckRolePayload;
    const facts: DocFact[] = [];
    for (const row of parsed.roles || []) {
      const name = String(row?.name || "").replace(/\s+/g, " ").trim();
      const roleKey = String(row?.role || "other")
        .trim()
        .toLowerCase();
      const evidence = String(row?.evidence || "").trim();
      if (!name || name.length < 3 || name.length > 120) continue;
      if (!evidenceSupports(name, window, evidence, 0.45)) continue;
      const label =
        ACK_ROLE_LABELS[roleKey] || ACK_ROLE_LABELS.other;
      pushFact(facts, filename, "acknowledgement", label, name);
    }
    if (facts.length) return dedupeDocFacts(facts);
  } catch (err) {
    console.warn(
      "[doc-facts] acknowledgement LLM extract failed:",
      (err as Error)?.message || err
    );
  }

  return extractAcknowledgementFactsHeuristic(window, filename);
}

/**
 * Domain-agnostic hierarchy/escalation relations — see doc-relations.ts.
 * Hotel/org-chart role maps removed; text path is explicit-evidence only.
 * Vision/diagram edges are merged in generateChunksNEmbeddViaDocling.
 */
export async function extractOrgStructureFacts(
  fullText: string,
  filename: string
): Promise<DocFact[]> {
  const { extractTypedRelationsFromText } = await import("./doc-relations");
  const relFacts = await extractTypedRelationsFromText(fullText, filename);
  return relFacts.map((f) => ({
    type: f.type as DocFactType,
    label: f.label,
    value: f.value,
    normalized: f.normalized,
    filename: f.filename,
  }));
}

export function orgHierarchyWindow(
  fullText: string,
  maxChars = 4500
): string {
  return relationSourceWindow(fullText, maxChars);
}

/** Conservative regex fallback when LLM is unavailable. */
function extractAcknowledgementFactsHeuristic(
  window: string,
  filename: string
): DocFact[] {
  const facts: DocFact[] = [];
  const patterns = [
    /(?:sincere\s+)?(?:gratitude|thanks|thankful)\s+to\s+((?:Mrs\.?|Mr\.?|Ms\.?|Dr\.?|Prof\.?)\s+[A-Z][A-Za-z. ]{2,60}?)(?:,|\s+for\b|\s+Assistant|\s+Professor|\s+Head)/i,
    /(?:under the (?:valuable )?guidance of|guided by|supervised by)\s+((?:Mrs\.?|Mr\.?|Ms\.?|Dr\.?|Prof\.?)\s+[A-Z][A-Za-z. ]{2,60}?)(?:,|\s+for\b)/i,
    /(?:project\s+guide|supervisor|advisor)[:\s]+((?:Mrs\.?|Mr\.?|Ms\.?|Dr\.?|Prof\.?)\s+[A-Z][A-Za-z. ]{2,60}?)(?:,|\.|$)/i,
  ];
  for (const re of patterns) {
    const m = window.match(re);
    if (!m?.[1]) continue;
    const name = m[1].replace(/\s+/g, " ").trim();
    if (name.length < 5 || name.length > 90) continue;
    if (!evidenceSupports(name, window, m[0], 0.5)) continue;
    pushFact(facts, filename, "acknowledgement", "Project guide", name);
    break;
  }
  return facts;
}

/** Repeating masthead / page chrome — drop from body index after metadata extract. */
export function isLikelyDocChromeChunk(
  text: string,
  meta?: Partial<DocumentMeta>
): boolean {
  const t = String(text || "").replace(/\s+/g, " ").trim();
  if (!t) return true;
  if (t.length > 420) return false;
  const lower = t.toLowerCase();
  const hasWww = /www\.[a-z0-9.-]+\.(org|com|net)/i.test(t);
  const hasId =
    (meta?.paperId && t.includes(meta.paperId)) ||
    (meta?.doi && t.includes(meta.doi)) ||
    DOI_RE.test(t) ||
    GENERIC_DOC_CODE_RE.test(t);
  const hasIssn = /\bISSN\b/i.test(t);
  const hasVolume = /\bVolume\s+\d+/i.test(t);
  const chromeHits = [hasWww, !!hasId, hasIssn, hasVolume].filter(Boolean)
    .length;
  if (chromeHits >= 2 && !/\bAbstract\b/i.test(t) && t.length < 350) {
    return true;
  }
  if (
    chromeHits >= 1 &&
    t.length < 160 &&
    !/\b(Abstract|Introduction|Methodology|Conclusion)\b/i.test(t)
  ) {
    return true;
  }
  if (
    meta?.journal &&
    lower.includes(meta.journal.toLowerCase()) &&
    t.length < 120
  ) {
    return true;
  }
  return false;
}

/** Prefer metadata window before References so citations cannot pollute identity. */
export function metadataSourceWindow(fullText: string, maxChars = 14000): string {
  const text = String(fullText || "");
  const refAt = text.search(
    /\n\s*(?:\d+\.\s*)?(?:VII\.?\s*)?REFERENCES\b|\n\s*BIBLIOGRAPHY\b|\n\s*WORKS CITED\b/i
  );
  const head = refAt > 400 ? text.slice(0, refAt) : text;
  return head.slice(0, maxChars);
}

/**
 * Accept a candidate value only if it (or most of its tokens) appear in corpus,
 * or an explicit evidence quote appears in corpus.
 */
export function evidenceSupports(
  value: string,
  corpus: string,
  evidence?: string,
  minTokenOverlap = 0.65
): boolean {
  const vRaw = String(value || "").trim();
  if (!vRaw || /\?/.test(vRaw)) return false;
  const c = normalizeForMatch(corpus);
  if (!c) return false;

  const ev = String(evidence || "").trim();
  if (ev.length >= 8) {
    const evNorm = normalizeForMatch(ev);
    if (evNorm && c.includes(evNorm)) {
      /// evidence quote is in-doc; still require some overlap with the value
      const vNorm = normalizeForMatch(vRaw);
      if (c.includes(vNorm) || evNorm.includes(vNorm)) return true;
      const tokens = vNorm.split(" ").filter((t) => t.length > 2);
      if (!tokens.length) return true;
      const hits = tokens.filter((t) => c.includes(t) || evNorm.includes(t)).length;
      return hits / tokens.length >= Math.min(minTokenOverlap, 0.5);
    }
  }

  const v = normalizeForMatch(vRaw);
  if (!v) return false;
  if (c.includes(v)) return true;

  /// Short ids / years: require exact token presence
  if (v.length <= 24 || /^(19|20)\d{2}$/.test(v) || /^\d+$/.test(v)) {
    return new RegExp(
      `(^|[^a-z0-9])${v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`
    ).test(c);
  }

  const tokens = v.split(" ").filter((t) => t.length > 2);
  if (tokens.length < 2) return c.includes(v);
  const hits = tokens.filter((t) => c.includes(t)).length;
  return hits / tokens.length >= minTokenOverlap;
}

function unwrapField(field: FieldEvidence | string | undefined): {
  value: string;
  evidence: string;
} {
  if (field == null) return { value: "", evidence: "" };
  if (typeof field === "string") {
    return { value: field.trim(), evidence: "" };
  }
  return {
    value: String(field.value || "").trim(),
    evidence: String(field.evidence || "").trim(),
  };
}

function extractUniversalIds(
  text: string,
  filename: string
): Pick<DocumentMeta, "doi" | "issn" | "paperId" | "volume" | "issue" | "year"> {
  const out = {
    doi: "",
    issn: "",
    paperId: "",
    volume: "",
    issue: "",
    year: "",
  };

  const doi = text.match(DOI_RE)?.[1];
  if (doi) {
    out.doi = doi.replace(/[.,;:]+$/, "");
    out.paperId = out.doi;
  }

  const issn = text.match(ISSN_RE)?.[1];
  if (issn) out.issn = issn.replace(/\s+/g, "-").toUpperCase();

  const arxiv = text.match(ARXIV_RE)?.[1];
  if (arxiv && !out.paperId) out.paperId = `arXiv:${arxiv}`;

  const vol = text.match(VOLUME_ISSUE_RE);
  if (vol) {
    out.volume = vol[1];
    out.issue = vol[2];
    if (vol[3]) out.year = vol[3];
  }

  if (!out.year) {
    const y = text.match(COPYRIGHT_YEAR_RE)?.[1];
    if (y) out.year = y;
  }

  if (!out.paperId) {
    const fromName = filename.match(GENERIC_DOC_CODE_RE)?.[1];
    const fromText = text.match(GENERIC_DOC_CODE_RE)?.[1];
    /// Prefer filename code when present (upload name often carries publisher id)
    out.paperId = (fromName || fromText || "").trim();
  }

  return out;
}

async function extractMetaWithLlm(
  sourceWindow: string,
  filename: string,
  seed: Partial<DocumentMeta>
): Promise<LlmMetaPayload | null> {
  if (!process.env.NEXT_PUBLIC_OPENAI_KEY || !sourceWindow.trim()) return null;

  try {
    const openai = new OpenAI({ apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY });
    const resp = await openai.chat.completions.create({
      model: process.env.CONTEXT_MODEL || "gpt-4o-mini",
      temperature: 0,
      max_tokens: 700,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You extract document-level identity metadata for ANY uploaded file (papers, reports, manuals, policies).

Rules:
- Describe THIS document only. Ignore bibliography / References / cited works.
- For every field you fill, include a short "evidence" quote copied from the source text.
- If unsure, use empty value and empty evidence. NEVER invent volume, issue, year, journal, or authors.
- Prefer cover/title page, masthead, abstract header over later body text.
- Return JSON object with keys: title, authors, paperId, journal, volume, issue, year, issn, doi, docType.
- Each key must be {"value": string, "evidence": string}.`,
        },
        {
          role: "user",
          content: `Filename: ${filename}
Known identifiers (may be empty): ${JSON.stringify(seed)}

Source text:
${sourceWindow.slice(0, 9000)}`,
        },
      ],
    });
    const raw = resp.choices[0]?.message?.content || "{}";
    return JSON.parse(raw) as LlmMetaPayload;
  } catch (err) {
    console.warn(
      "[doc-facts] LLM extract failed:",
      (err as Error)?.message || err
    );
    return null;
  }
}

async function enrichFromCrossref(
  doi: string
): Promise<Partial<DocumentMeta>> {
  const clean = String(doi || "")
    .trim()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, "");
  if (!clean) return {};

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CROSSREF_TIMEOUT_MS);
  try {
    const res = await fetch(
      `https://api.crossref.org/works/${encodeURIComponent(clean)}`,
      {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "User-Agent": "TorriAI-DocFacts/1.0 (mailto:support@torri.ai)",
        },
      }
    );
    if (!res.ok) return {};
    const json = (await res.json()) as any;
    const msg = json?.message;
    if (!msg) return {};

    const authors = Array.isArray(msg.author)
      ? msg.author
          .map((a: any) =>
            [a.given, a.family].filter(Boolean).join(" ").trim()
          )
          .filter(Boolean)
          .join(", ")
      : "";

    const year =
      String(
        msg.published?.["date-parts"]?.[0]?.[0] ||
          msg["published-print"]?.["date-parts"]?.[0]?.[0] ||
          msg["published-online"]?.["date-parts"]?.[0]?.[0] ||
          ""
      ) || "";

    return {
      title: Array.isArray(msg.title) ? String(msg.title[0] || "") : "",
      authors,
      journal: Array.isArray(msg["container-title"])
        ? String(msg["container-title"][0] || "")
        : String(msg.publisher || ""),
      volume: msg.volume ? String(msg.volume) : "",
      issue: msg.issue ? String(msg.issue) : "",
      year,
      issn: Array.isArray(msg.ISSN) ? String(msg.ISSN[0] || "") : "",
      doi: clean,
      paperId: clean,
    };
  } catch (err) {
    console.warn(
      "[doc-facts] Crossref lookup failed:",
      (err as Error)?.message || err
    );
    return {};
  } finally {
    clearTimeout(timer);
  }
}

function applyGroundedField(
  meta: DocumentMeta,
  key: keyof DocumentMeta,
  candidate: string,
  corpus: string,
  evidence: string,
  opts?: { requireEvidence?: boolean; minOverlap?: number }
): void {
  if (meta[key] || !candidate) return;
  const requireEvidence = opts?.requireEvidence !== false;
  if (
    requireEvidence &&
    !evidenceSupports(candidate, corpus, evidence, opts?.minOverlap ?? 0.65)
  ) {
    return;
  }
  meta[key] = candidate.replace(/\s+/g, " ").trim();
}

function formatPublicationValue(meta: DocumentMeta): string {
  const parts: string[] = [];
  if (meta.journal) parts.push(meta.journal);
  if (meta.volume && meta.issue) {
    parts.push(`Volume ${meta.volume}, Issue ${meta.issue}`);
  } else if (meta.volume) {
    parts.push(`Volume ${meta.volume}`);
  }
  if (meta.year) parts.push(meta.year);
  if (meta.issn) parts.push(`ISSN ${meta.issn}`);
  return parts.join(" | ");
}

function isCompletePublicationFact(value: string): boolean {
  const v = String(value || "");
  if (!v.trim() || /\?/.test(v)) return false;
  return /\bVolume\s+\d+/i.test(v) && /\bIssue\s+\d+/i.test(v);
}

/** Drop incomplete / placeholder publication facts (legacy bad upserts). */
export function isUsableDocFactContent(content: string): boolean {
  const c = String(content || "");
  if (!c.trim()) return false;
  if (/\bVolume\s*\?|\bIssue\s*\?/i.test(c)) return false;
  if (/Publication:\s*[^.]*\?/i.test(c)) return false;
  const pubMatch = c.match(/Publication:\s*(.+?)(?:\.\s*Document:|$)/i);
  if (pubMatch && !isCompletePublicationFact(pubMatch[1])) return false;
  return true;
}

export function dedupeDocFacts(facts: DocFact[]): DocFact[] {
  const seen = new Set<string>();
  const out: DocFact[] = [];
  for (const f of facts) {
    if (!f?.normalized) continue;
    const key = `${f.type}::${f.normalized}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(f);
  }
  return out;
}

export function formatDocFactEmbedText(fact: DocFact): string {
  return `${fact.label}: ${fact.value}. Document: ${fact.filename}`;
}

export function docFactVectorId(chatbotId: string, fact: DocFact): string {
  const digest = createHash("sha256")
    .update(`${chatbotId}|${fact.filename}|${fact.type}|${fact.normalized}`)
    .digest("hex")
    .slice(0, 32);
  return `docfact-${digest}`;
}

export function metaToStampFields(meta: DocumentMeta): Record<string, string> {
  return {
    doc_title: meta.title || "",
    doc_authors: meta.authors || "",
    paper_id: meta.paperId || "",
    journal: meta.journal || "",
    doc_volume: meta.volume || "",
    doc_issue: meta.issue || "",
    doc_year: meta.year || "",
    doc_issn: meta.issn || "",
    doc_doi: meta.doi || "",
  };
}

function buildFactsFromMeta(meta: DocumentMeta, filename: string): DocFact[] {
  const facts: DocFact[] = [];
  if (meta.doi) pushFact(facts, filename, "doi", "DOI", meta.doi);
  if (meta.paperId) {
    pushFact(
      facts,
      filename,
      "paper_id",
      meta.doi && meta.paperId === meta.doi ? "DOI" : "Paper ID",
      meta.paperId
    );
  }
  if (meta.issn) pushFact(facts, filename, "issn", "ISSN", meta.issn);
  if (meta.title) pushFact(facts, filename, "title", "Title", meta.title);
  if (meta.authors) pushFact(facts, filename, "authors", "Authors", meta.authors);
  if (meta.journal) pushFact(facts, filename, "journal", "Journal", meta.journal);
  if (meta.volume && meta.issue) {
    const pub = formatPublicationValue(meta);
    if (isCompletePublicationFact(pub)) {
      pushFact(facts, filename, "publication", "Publication", pub);
    }
  } else if (meta.journal && meta.year) {
    pushFact(
      facts,
      filename,
      "publication",
      "Publication",
      [meta.journal, meta.year, meta.issn ? `ISSN ${meta.issn}` : ""]
        .filter(Boolean)
        .join(" | ")
    );
  }
  return dedupeDocFacts(facts);
}

/** Generic cover-page heuristics when LLM leaves title/authors empty. */
function seedTitleAuthorsFromLayout(
  sourceWindow: string
): Pick<DocumentMeta, "title" | "authors" | "journal"> {
  const out = { title: "", authors: "", journal: "" };
  const beforeAbstract = sourceWindow.split(/\bAbstract\s*:/i)[0] || sourceWindow;
  const lines = beforeAbstract
    .split(/\n+/)
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .slice(0, 60);

  const isDocCodeLine = (line: string) =>
    GENERIC_DOC_CODE_RE.test(line) &&
    line.replace(GENERIC_DOC_CODE_RE, "").replace(/\W+/g, "").length < 3;

  const skip = (line: string) =>
    /www\.|https?:\/\//i.test(line) ||
    /\bISSN\b|\bVolume\s+\d+|\bDOI\b|©\s*20/i.test(line) ||
    /\bDepartment of\b|\bUniversity\b|\bCollege of\b/i.test(line) ||
    /\bIndex Terms\b|\bKeywords\b|\bAssistant Professor\b|\bPG Student\b/i.test(
      line
    ) ||
    isDocCodeLine(line) ||
    /^[a-z]?\d{2,5}$/i.test(line) ||
    line.length < 8 ||
    line.length > 160;

  for (const line of lines) {
    if (out.journal) break;
    if (
      /\b(Journal|Proceedings|Transactions|Conference|Review)\b/i.test(line) &&
      line.length < 120 &&
      !skip(line)
    ) {
      out.journal = line;
    }
  }

  /// Prefer a multi-word line that is not chrome / id / affiliation.
  for (const line of lines) {
    if (out.title) break;
    if (skip(line)) continue;
    if (/^(Mrs\.|Mr\.|Ms\.|Dr\.|Prof\.)/i.test(line)) continue;
    if ((line.match(/,/g) || []).length >= 2) continue;
    if (out.journal && line === out.journal) continue;
    if (!/\s/.test(line)) continue;
    if (line.split(/\s+/).length < 2) continue;
    out.title = line;
  }

  for (const line of lines) {
    if (out.authors) break;
    if (
      /^(Mrs\.|Mr\.|Ms\.|Dr\.|Prof\.)/i.test(line) &&
      line.length < 180 &&
      !/\bDepartment of\b/i.test(line)
    ) {
      out.authors = line;
      break;
    }
    if (
      /\b(and|,)\b/i.test(line) &&
      /\b[A-Z][a-z]+\s+[A-Z]/i.test(line) &&
      line.length < 160 &&
      !skip(line) &&
      line !== out.title
    ) {
      out.authors = line;
      break;
    }
  }

  return out;
}

/**
 * Build document metadata + doc_fact list from flattened Docling/text chunks.
 * General for any document type; scholarly fields filled when evidence exists.
 */
export async function extractDocumentFactsFromChunks(
  chunks: string[],
  filename: string
): Promise<{ meta: DocumentMeta; facts: DocFact[] }> {
  const joined = (chunks || []).filter(Boolean).join("\n");
  if (!joined.trim()) {
    return { meta: emptyMeta(), facts: [] };
  }

  const sourceWindow = metadataSourceWindow(joined);
  const ids = extractUniversalIds(`${sourceWindow}\n${filename}`, filename);
  const meta = emptyMeta();

  /// Universal ids are regex-grounded in the text/filename itself
  if (ids.doi && evidenceSupports(ids.doi, joined)) meta.doi = ids.doi;
  if (ids.issn && evidenceSupports(ids.issn, joined)) meta.issn = ids.issn;
  if (ids.volume && evidenceSupports(ids.volume, sourceWindow)) {
    meta.volume = ids.volume;
  }
  if (ids.issue && evidenceSupports(ids.issue, sourceWindow)) {
    meta.issue = ids.issue;
  }
  if (ids.year && evidenceSupports(ids.year, sourceWindow)) {
    meta.year = ids.year;
  }
  if (ids.paperId) {
    /// Filename codes are allowed even if not repeated in body
    const inDoc =
      evidenceSupports(ids.paperId, joined) ||
      filename.toUpperCase().includes(ids.paperId.toUpperCase());
    if (inDoc) meta.paperId = ids.paperId;
  }
  if (meta.doi && !meta.paperId) meta.paperId = meta.doi;

  const llm = await extractMetaWithLlm(sourceWindow, filename, {
    doi: meta.doi,
    issn: meta.issn,
    paperId: meta.paperId,
    volume: meta.volume,
    issue: meta.issue,
    year: meta.year,
  });

  if (llm) {
    const title = unwrapField(llm.title);
    applyGroundedField(meta, "title", title.value, sourceWindow, title.evidence, {
      minOverlap: 0.55,
    });

    const authors = unwrapField(llm.authors);
    applyGroundedField(
      meta,
      "authors",
      authors.value,
      sourceWindow,
      authors.evidence,
      { minOverlap: 0.5 }
    );

    const journal = unwrapField(llm.journal);
    applyGroundedField(
      meta,
      "journal",
      journal.value,
      sourceWindow,
      journal.evidence,
      { minOverlap: 0.55 }
    );

    const paperId = unwrapField(llm.paperId);
    applyGroundedField(
      meta,
      "paperId",
      paperId.value,
      joined,
      paperId.evidence,
      { minOverlap: 0.9 }
    );

    const issn = unwrapField(llm.issn);
    applyGroundedField(meta, "issn", issn.value, joined, issn.evidence, {
      minOverlap: 0.9,
    });

    const doi = unwrapField(llm.doi);
    applyGroundedField(meta, "doi", doi.value, joined, doi.evidence, {
      minOverlap: 0.9,
    });

    const volume = unwrapField(llm.volume);
    const issue = unwrapField(llm.issue);
    const year = unwrapField(llm.year);
    const volNum = volume.value.replace(/\D/g, "");
    const issueNum = issue.value.replace(/\D/g, "");
    if (
      !meta.volume &&
      /^\d+$/.test(volNum) &&
      evidenceSupports(volNum, sourceWindow, volume.evidence, 1)
    ) {
      meta.volume = volNum;
    }
    if (
      !meta.issue &&
      /^\d+$/.test(issueNum) &&
      evidenceSupports(issueNum, sourceWindow, issue.evidence, 1)
    ) {
      meta.issue = issueNum;
    }
    if (
      !meta.year &&
      /^(19|20)\d{2}$/.test(year.value) &&
      evidenceSupports(year.value, sourceWindow, year.evidence, 1)
    ) {
      /// Extra guard: year must not only appear inside a citation-like line
      /// unless volume/issue also grounded (masthead years usually co-occur)
      const yearOk =
        (meta.volume && meta.issue) ||
        COPYRIGHT_YEAR_RE.test(sourceWindow) ||
        new RegExp(
          `Volume\\s*\\d+[^\\n]{0,40}${year.value}|${year.value}[^\\n]{0,40}Volume\\s*\\d+|ISSN[^\\n]{0,40}${year.value}`,
          "i"
        ).test(sourceWindow);
      if (yearOk) meta.year = year.value;
    }
  }

  /// Layout fallback for cover fields when LLM/evidence left them empty
  const layout = seedTitleAuthorsFromLayout(sourceWindow);
  if (
    !meta.title &&
    layout.title &&
    normalizeForMatch(layout.title) !== normalizeForMatch(meta.paperId) &&
    evidenceSupports(layout.title, sourceWindow)
  ) {
    meta.title = layout.title;
  }
  if (
    meta.title &&
    meta.paperId &&
    normalizeForMatch(meta.title) === normalizeForMatch(meta.paperId)
  ) {
    meta.title = "";
  }
  if (
    !meta.authors &&
    layout.authors &&
    evidenceSupports(layout.authors, sourceWindow, "", 0.45)
  ) {
    meta.authors = layout.authors;
  }
  if (
    !meta.journal &&
    layout.journal &&
    evidenceSupports(layout.journal, sourceWindow, "", 0.5)
  ) {
    meta.journal = layout.journal;
  }

  /// Crossref consolidation when DOI is known (canonical venue metadata)
  if (meta.doi) {
    const xref = await enrichFromCrossref(meta.doi);
    if (xref.title && !meta.title) meta.title = xref.title;
    if (xref.authors && !meta.authors) meta.authors = xref.authors;
    if (xref.journal && !meta.journal) meta.journal = xref.journal;
    if (xref.volume && !meta.volume) meta.volume = xref.volume;
    if (xref.issue && !meta.issue) meta.issue = xref.issue;
    if (xref.year && !meta.year) meta.year = xref.year;
    if (xref.issn && !meta.issn) meta.issn = xref.issn;
    if (!meta.paperId) meta.paperId = meta.doi;
  }

  const facts = dedupeDocFacts([
    ...buildFactsFromMeta(meta, filename),
    ...(await extractAcknowledgementFacts(joined, filename)),
    ...(await extractOrgStructureFacts(joined, filename)),
  ]);
  console.log(
    `[doc-facts] file=${filename} fields=${Object.entries(meta)
      .filter(([, v]) => v)
      .map(([k]) => k)
      .join(",") || "none"} facts=${facts.length}`
  );
  return { meta, facts };
}

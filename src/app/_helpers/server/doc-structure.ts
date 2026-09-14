/**
 * Document structure helpers for Docling / process-doc payloads.
 * Builds heading paths even when the extractor only returns flat texts[],
 * and preserves explicit section_header / headings fields when present.
 */

export type DoclingTextItem = {
  id?: number;
  source?: string;
  content?: string;
  dimensions?: unknown;
  source_url?: string;
  /** Docling / backend may send any of these */
  type?: string;
  label?: string;
  level?: number;
  headings?: string[] | string;
  heading?: string;
  section_header?: string | boolean;
};

export type StructuredChunkMeta = {
  source_url: string;
  dimensions: string | null;
  type: string;
  element_type: string;
  heading_path: string;
  is_section_header: boolean;
};

const SECTION_HEADING_RE =
  /^(?:\d+\.\s*)?(?:[IVX]+\.?\s*)?(ABSTRACT|INTRODUCTION|LITERATURE SURVEY|RELATED WORK|METHODOLOGY|RESEARCH METHODOLOGY|PROPOSED(?:\s+SYSTEM)?|SYSTEM DESIGN|RESULTS(?:\s+AND\s+DISCUSSION)?|DISCUSSION|CONCLUSION(?:\s+AND\s+FUTURE\s+SCOPE)?|FUTURE (?:WORK|SCOPE)|REFERENCES|BIBLIOGRAPHY|ACKNOWLEDG\w*|WORKS CITED|PREFACE|APPENDIX)\s*$/i;

/** True when item is (or looks like) a section header. */
export function isSectionHeaderItem(
  content: string,
  item?: Partial<DoclingTextItem>
): boolean {
  const explicit =
    String(item?.type || item?.label || "").toLowerCase() ||
    (item?.section_header === true ? "section_header" : "");
  if (
    /section_header|section-header|title|heading|header/.test(explicit) &&
    !/page_header|page-header|footer/.test(explicit)
  ) {
    /// Backend-labeled headers can be longer titles; still cap noise
    const labeled = String(content || "").replace(/\s+/g, " ").trim();
    return labeled.length > 0 && labeled.length <= 200;
  }
  if (item?.section_header === true) return true;

  const t = String(content || "").replace(/\s+/g, " ").trim();
  if (!t || t.length < 3 || t.length > 100) return false;
  /// Body / citation noise
  if (t.includes(": ") && t.length > 40) return false;
  if ((t.match(/[,;]/g) || []).length >= 2) return false;
  if (/\(\d{4}\)/.test(t)) return false;
  if (/[.!?]$/.test(t) && t.split(" ").length > 8) return false;
  if (t.split(" ").length > 14) return false;

  if (SECTION_HEADING_RE.test(t)) return true;
  /// Reject sentence-like body openers
  if (
    /^(the|this|these|those|a|an|we|our|it|in|on|for|with|by|to|from|as|and|or)\b/i.test(
      t
    )
  ) {
    return false;
  }
  /// "I. INTRODUCTION" / "3.2 Methods" / "A. System Design" style
  if (
    /^(?:[IVX]{1,6}|[A-Z]|[0-9]{1,2}(?:\.[0-9]+){0,3})\.?\s+[A-Z][A-Za-z0-9 .:&()/-]{2,80}$/.test(
      t
    )
  ) {
    return t.split(" ").length <= 12;
  }
  return false;
}

function headerLevel(content: string, item?: Partial<DoclingTextItem>): number {
  if (typeof item?.level === "number" && item.level >= 1 && item.level <= 6) {
    return item.level;
  }
  const t = String(content || "").trim();
  const numbered = t.match(/^(\d+(?:\.\d+)*)/);
  if (numbered) {
    return Math.min(6, numbered[1].split(".").length);
  }
  if (/^[IVX]+\./i.test(t)) return 1;
  return 1;
}

function normalizeHeading(content: string): string {
  return String(content || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
}

function pathFromItem(item?: Partial<DoclingTextItem>): string[] | null {
  if (Array.isArray(item?.headings) && item!.headings!.length) {
    return item!.headings!.map((h) => normalizeHeading(String(h))).filter(Boolean);
  }
  if (typeof item?.headings === "string" && item.headings.trim()) {
    return item.headings
      .split(/\s*[>|/]\s*/)
      .map(normalizeHeading)
      .filter(Boolean);
  }
  if (item?.heading) {
    return [normalizeHeading(item.heading)];
  }
  return null;
}

/**
 * Walk Docling text items in order and attach a hierarchical heading_path.
 * Uses explicit backend headings when present; otherwise infers headers.
 */
export function buildStructuredTextChunks(
  texts: DoclingTextItem[] | undefined
): Array<{ content: string; meta: StructuredChunkMeta }> {
  const out: Array<{ content: string; meta: StructuredChunkMeta }> = [];
  if (!Array.isArray(texts)) return out;

  const stack: Array<{ level: number; title: string }> = [];

  for (const item of texts) {
    const content = String(item?.content || "").trim();
    if (!content) continue;

    const explicitPath = pathFromItem(item);
    const header = isSectionHeaderItem(content, item);
    const elementType = String(
      item?.type || item?.label || (header ? "section_header" : "text")
    )
      .trim()
      .toLowerCase() || "text";

    if (explicitPath?.length) {
      stack.length = 0;
      explicitPath.forEach((title, i) => {
        stack.push({ level: i + 1, title });
      });
    } else if (header) {
      const level = headerLevel(content, item);
      while (stack.length && stack[stack.length - 1].level >= level) {
        stack.pop();
      }
      stack.push({ level, title: normalizeHeading(content) });
    }

    const headingPath = stack.map((s) => s.title).join(" > ");

    out.push({
      content,
      meta: {
        source_url: item.source_url || "",
        dimensions: item.dimensions ? JSON.stringify(item.dimensions) : null,
        type: elementType === "section_header" ? "section_header" : elementType,
        element_type: elementType,
        heading_path: headingPath,
        is_section_header: header,
      },
    });
  }

  return out;
}

/** Map a heading path / heading text to a coarse section role. */
export function roleFromHeadingPath(headingPath: string): string | null {
  const h = String(headingPath || "");
  if (!h.trim()) return null;
  if (/\bACKNOWLEDG\w*\b/i.test(h)) return "acknowledgement";
  if (/\bREFERENCES\b|\bBIBLIOGRAPHY\b|\bWORKS CITED\b/i.test(h)) {
    return "references";
  }
  if (/\bABSTRACT\b/i.test(h)) return "abstract";
  if (/\bCONCLUSION\b|\bFUTURE (?:WORK|SCOPE)\b/i.test(h)) return "conclusion";
  return null;
}

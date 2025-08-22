"use client";
import { Document, Page, pdfjs } from "react-pdf";
import { useState, useCallback, useEffect, useMemo, useRef, memo } from "react";
import { Typography, Space, Empty, Spin, Tooltip } from "antd";
import Image from "next/image";
import RightArrowIcon from "../../../../../../../public/source-reference/arrow-right.png";
import DocIcon from "../../../../../../../public/source-reference/document.png";
import WebIcon from "../../../../../../../public/source-reference/global.png";
import QAIcon from "../../../../../../../public/source-reference/message-question.png";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import "./highlighted-info.scss";

// Fix worker setup
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.3.31/build/pdf.worker.mjs`;

// Temporary full text for 'text' sources; replace with API response later
const DUMMY_FULL_TEXT = `The integration of artificial intelligence in higher education is reshaping the way universities operate, teach, and ensure security on their campuses. UNESCO emphasizes that the adoption of AI tools, such as ChatGPT, should always be guided by ethical principles, inclusivity, and accessibility. ChatGPT, as an advanced language model, has been successfully applied in teaching, research, and administrative processes, offering personalized learning support, streamlining workflows, and providing multilingual assistance to international students. Alongside these academic applications, campus security systems like Suprema, when integrated with Honeywell ProWatch, are enhancing how institutions manage identification, enrollment, and access control.

In a university setting, ProWatch Badging Manager enables the creation of badge holders, assigning them virtual cards that link directly to biometric credentials. Students and staff can complete face, fingerprint, or card enrollment through the Suprema Enrollment Client, which displays all registered credentials in a central dashboard. Device enrollment allows biometric data, such as facial images, to be captured using networked cameras, while external camera enrollment provides flexibility for capturing from web-connected devices. Institutions can also allow users to upload their own photographs, provided they meet the required resolution standards, with built-in cropping tools ensuring the correct framing for identification purposes.

Finger enrollment is a critical part of the system, where the interface highlights the selected finger in orange until a successful scan turns it green. Local finger enrollment enables individual finger processing, particularly useful when updating or replacing partial biometric data. Card enrollment allows external cards to be scanned and added directly to a user’s profile. AI tools can complement these security processes by scheduling enrollment sessions, sending reminders, and guiding users step-by-step through the process.

UNESCO’s AI ethics framework stresses the importance of safeguarding privacy in any system that collects personal or biometric data. This includes encryption, secure storage, and restricted access protocols. Privacy concerns are coupled with the need to address bias in AI recognition systems, ensuring that the technology does not unfairly disadvantage any group. UNESCO recommends that universities incorporate AI literacy into their curriculum, enabling students to understand not only how to use AI tools but also the social, legal, and ethical issues surrounding them.

In practical use, AI-powered assistants like ChatGPT can serve as personal tutors, generating study prompts, creating quizzes, and helping students prepare for assessments. They can also assist faculty in updating course content, simulating debates to foster critical thinking, and providing translation services for non-native speakers. These features are particularly beneficial in diverse, international campuses where accessibility and inclusion are key priorities.

From an administrative standpoint, AI can help monitor enrollment trends, optimize scheduling, and produce real-time reports linking campus security logs with academic and operational analytics. ProWatch integration ensures that security credentials and biometric records are managed within a single unified platform, reducing redundancy and improving efficiency. This centralized approach also enables rapid synchronization of authentication modes across devices, ensuring consistent access policies across all campus entry points.

UNESCO encourages institutions to conduct AI audits, which involve assessing the types of AI used, the data collected, and the effectiveness of these systems in achieving their intended goals. Such audits should also examine equity in access to AI technologies, ensuring that no student or staff member is excluded due to cost, connectivity, or technical limitations. Transparency in AI deployment is critical, with clear policies on data ownership, consent, and the purposes for which information is used.

The combined use of AI and biometric systems offers a powerful framework for modern higher education. While AI provides the intelligence to personalize learning and streamline processes, biometric integration ensures that physical access to campus facilities remains secure and efficient. This fusion creates opportunities for universities to enhance both academic excellence and operational safety, but it must be balanced with rigorous ethical oversight, stakeholder consultation, and an unwavering commitment to human dignity. When implemented thoughtfully, AI-driven tools and secure enrollment systems can work together to create a campus environment that is innovative, inclusive, and resilient to the challenges of the digital era.`;

// Utilities to highlight snippets within full text (whitespace-tolerant)
const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
type Range = { start: number; end: number; score?: number };

const normalizeWhitespace = (s: string) => s.replace(/\s+/g, " ").trim();
const buildFlexiblePattern = (s: string) =>
  escapeRegExp(normalizeWhitespace(s)).replace(/\s+/g, "\\s+");

const getSnippetCandidates = (snip: string): string[] => {
  const base = normalizeWhitespace(snip);
  if (!base) return [];
  const parts = base
    .split(/[.;,]+\s*/)
    .map((p) => p.trim())
    .filter(Boolean);
  const longParts = parts.filter((p) => p.length >= 12);
  const candidates = [base, ...longParts];
  return Array.from(new Set(candidates));
};

// Text snippet with optional score
type TextSnippet = { text: string; score?: number };

// Collect ranges for snippets and attach optional score metadata to each range
const collectRangesForSnippets = (
  text: string,
  snippets: Array<string | TextSnippet>
): Range[] => {
  const ranges: Range[] = [];
  const addMatches = (pattern: string, score?: number) => {
    try {
      const re = new RegExp(pattern, "gi");
      let m: RegExpExecArray | null;
      while ((m = re.exec(text)) !== null) {
        const start = m.index;
        const end = start + m[0].length;
        if (end > start) ranges.push({ start, end, score });
        if (re.lastIndex === m.index) re.lastIndex++;
      }
    } catch {
      // ignore invalid regex
    }
  };

  const seen = new Set<string>();
  (snippets || []).forEach((s) => {
    const snippetText = typeof s === "string" ? s : s?.text || "";
    if (!snippetText) return;
    if (seen.has(snippetText)) return;
    seen.add(snippetText);
    const score = typeof s === "object" ? (s as TextSnippet).score : undefined;
    getSnippetCandidates(snippetText).forEach((cand) =>
      addMatches(buildFlexiblePattern(cand), score)
    );
  });
  return ranges;
};

const mergeRanges = (ranges: Range[]): Range[] => {
  if (!ranges.length) return [];
  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  const merged: Range[] = [];
  for (const r of sorted) {
    const last = merged[merged.length - 1];
    if (!last || r.start > last.end) merged.push({ ...r });
    else {
      // extend end and conservatively keep the highest score present
      last.end = Math.max(last.end, r.end);
      last.score = Math.max(last.score ?? 0, r.score ?? 0);
    }
  }
  return merged;
};

// Convert #RRGGBB or #RGB to rgba string with given alpha
const hexToRgba = (hex: string, alpha = 1) => {
  const h = hex.replace("#", "");
  const to255 = (s: string) => parseInt(s, 16);
  let r = 0,
    g = 0,
    b = 0;
  if (h.length === 3) {
    r = to255(h[0] + h[0]);
    g = to255(h[1] + h[1]);
    b = to255(h[2] + h[2]);
  } else if (h.length === 6) {
    r = to255(h.slice(0, 2));
    g = to255(h.slice(2, 4));
    b = to255(h.slice(4, 6));
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Given a score, return label/background/border based on thresholds
function getRelevancePalette(score?: number) {
  let label: "Most relevant" | "Relevant" | "Good" | "Low" | "Very low" =
    "Very low";
  if (typeof score === "number") {
    if (score >= 0.85) label = "Most relevant";
    else if (score >= 0.8) label = "Relevant";
    else if (score >= 0.7) label = "Good";
    else if (score >= 0.6) label = "Low";
    else label = "Very low";
  }
  const palettes: Record<typeof label, { bg: string; border: string }> = {
    "Most relevant": { bg: "#E0EDFF", border: "#8CB3FF" },
    Relevant: { bg: "#D3F8DE", border: "#7BD89C" },
    Good: { bg: "#FFF3B2", border: "#E5C85C" },
    Low: { bg: "#FFD0B2", border: "#FF9C66" },
    "Very low": { bg: "#FDD", border: "#F99" },
  } as const;
  const { bg, border } = palettes[label];
  return { label, bg: hexToRgba(bg, 0.45), border };
}

const renderNodesFromRanges = (
  text: string,
  merged: Range[]
): React.ReactNode[] => {
  if (!merged.length) return [text];
  const out: React.ReactNode[] = [];
  let cursor = 0;
  merged.forEach((r) => {
    if (cursor < r.start)
      out.push(
        <span key={`t-${cursor}-${r.start}`}>
          {text.slice(cursor, r.start)}
        </span>
      );

    const palette = getRelevancePalette(r.score);
    const title = `${palette.label}${
      typeof r.score === "number" ? ` (${r.score.toFixed(3)})` : ""
    }`;
    out.push(
      <Tooltip
        key={`h-${r.start}-${r.end}`}
        title={title}
        mouseEnterDelay={0.12}
        placement="top"
      >
        <span
          className="highlighted-snippet"
          style={{
            backgroundColor: palette.bg,
            borderBottom: `2px solid ${palette.border}`,
            fontSize: "14px",
          }}
        >
          {text.slice(r.start, r.end)}
        </span>
      </Tooltip>
    );
    cursor = r.end;
  });
  if (cursor < text.length)
    out.push(
      <span key={`t-${cursor}-${text.length}`}>{text.slice(cursor)}</span>
    );
  return out;
};

function renderHighlightedText(
  fullText: string,
  snippets: Array<string | TextSnippet>
): React.ReactNode[] {
  const text = String(fullText ?? "");
  const ranges = collectRangesForSnippets(text, snippets);
  const merged = mergeRanges(ranges);
  return renderNodesFromRanges(text, merged);
}

type BoundingBox = {
  l: number;
  t: number;
  r: number;
  b: number;
};

type Viewport = {
  width: number;
  height: number;
  scale: number;
  rotation: number;
  // pdf.js page viewport transform matrix [a,b,c,d,e,f] at scale=1
  transform?: number[];
};

type Highlight = {
  source: string;
  content: string;
  metadata: string;
  source_url: string;
  // Optional similarity score on each vector (0..1)
  score?: number;
};

type PDFViewerProps = Readonly<{
  pdfUrl: string;
  highlights: Highlight[];
  selectedPage?: number | null;
}>;

function PDFViewer(props: PDFViewerProps) {
  const { pdfUrl, highlights, selectedPage } = props;
  const [numPages, setNumPages] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewports, setViewports] = useState<Map<number, Viewport>>(new Map());
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);

  // Responsive container width tracking
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(400); // reasonable default for 30% width

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // initialize width immediately
    const initial = Math.floor(el.clientWidth);
    if (initial > 0) setContainerWidth(initial);

    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (!cr) return;
      const w = Math.floor(cr.width);
      if (w > 0) setContainerWidth(w);
    });
    ro.observe(el);

    return () => ro.disconnect();
  }, []);

  // Calculate page render width based on container, with some padding
  const pageRenderWidth = Math.max(200, containerWidth - 32); // 16px padding on each side

  // Get unique page numbers that have highlights
  const getAvailablePages = useCallback(() => {
    const pageNumbers = new Set<number>();

    highlights.forEach((highlight) => {
      try {
        let metadata;
        let parsed = JSON.parse(highlight.metadata);

        if (parsed.constructor.name === "String") {
          metadata = JSON.parse(String(parsed));
        } else {
          metadata = parsed;
        }

        const highlightPageNumbers = metadata.page_numbers || [];
        highlightPageNumbers.forEach((pageNum: number) => {
          pageNumbers.add(pageNum);
        });
      } catch (error) {
        console.error("Error parsing highlight metadata:", error);
      }
    });

    return Array.from(pageNumbers).sort((a, b) => a - b);
  }, [highlights]);

  const availablePages = getAvailablePages();
  const currentPageNumber = availablePages[currentPageIndex];
  const totalAvailablePages = availablePages.length;

  // Reset pagination when pdfUrl or highlights change
  useEffect(() => {
    setCurrentPageIndex(0);
  }, [pdfUrl, highlights]);

  // Jump to a selected page if provided and present in available pages
  const availablePagesKey = useMemo(
    () => availablePages.join(","),
    [availablePages]
  );
  useEffect(() => {
    if (!selectedPage) return;
    const idx = availablePages.indexOf(selectedPage);
    if (idx !== -1) setCurrentPageIndex(idx);
  }, [selectedPage, availablePages, availablePagesKey]);

  // Pagination handlers
  const goToNextPage = () => {
    if (currentPageIndex < totalAvailablePages - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    }
  };

  // page jump is controlled via selectedPage prop

  const onDocumentLoadSuccess = async (pdf: any) => {
    setError(null);
    const newViewports = new Map<number, Viewport>();

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      // get default 1x viewport to compute scaling for overlays
      const rawViewport: any = page.getViewport({
        scale: 1.0,
        rotation: page.rotate || 0,
      });
      newViewports.set(pageNum, {
        width: rawViewport.width,
        height: rawViewport.height,
        scale: rawViewport.scale,
        rotation: rawViewport.rotation,
        transform: rawViewport.transform,
      });
    }
    setViewports(newViewports);
    setNumPages(pdf.numPages);
  };

  const onDocumentLoadError = (error: Error) => {
    setError(error.message);
  };

  // reuse top-level helpers: hexToRgba & getRelevancePalette

  // Extract numeric score from highlight or its source label
  const extractScore = (h: Highlight): number | undefined => {
    if (typeof (h as any).score === "number") return (h as any).score as number;
    const m = String(h?.source ?? "").match(/\(score:\s*([0-9.]+)\)/i);
    if (m && m[1]) {
      const val = parseFloat(m[1]);
      if (!Number.isNaN(val)) return val;
    }
    return undefined;
  };

  const scaleForPage = (pageNumber: number) => {
    const vp = viewports.get(pageNumber);
    if (!vp || vp.width === 0) return 1;
    return pageRenderWidth / vp.width;
  };

  const getOverlaySize = (pageNumber: number) => {
    const vp = viewports.get(pageNumber);
    if (!vp) return { width: pageRenderWidth, height: pageRenderWidth * 1.414 }; // fallback A4-ish
    const s = scaleForPage(pageNumber);
    return { width: vp.width * s, height: vp.height * s };
  };

  const renderHighlights = (pageNumber: number): React.JSX.Element[] => {
    const viewport = viewports.get(pageNumber);
    if (!viewport) return [];

    const s = scaleForPage(pageNumber);
    const baseWidth = viewport.width;
    const baseHeight = viewport.height;
    const matrix = viewport.transform || [1, 0, 0, -1, 0, baseHeight];

    const applyMatrix = (x: number, y: number) => {
      const [a, b, c, d, e, f] = matrix;
      return {
        x: a * x + c * y + e,
        y: b * x + d * y + f,
      };
    };

    const normalizeBbox = (bbox: BoundingBox) => {
      let { l, t, r, b } = bbox;
      const looksNormalized =
        l >= 0 &&
        r >= 0 &&
        t >= 0 &&
        b >= 0 &&
        l <= 1 &&
        r <= 1 &&
        t <= 1 &&
        b <= 1;
      if (looksNormalized) {
        l = l * baseWidth;
        r = r * baseWidth;
        t = t * baseHeight;
        b = b * baseHeight;
      }

      const pLT = applyMatrix(l, t);
      const pRT = applyMatrix(r, t);
      const pRB = applyMatrix(r, b);
      const pLB = applyMatrix(l, b);

      const minX = Math.min(pLT.x, pRT.x, pRB.x, pLB.x);
      const maxX = Math.max(pLT.x, pRT.x, pRB.x, pLB.x);
      const minY = Math.min(pLT.y, pRT.y, pRB.y, pLB.y);
      const maxY = Math.max(pLT.y, pRT.y, pRB.y, pLB.y);

      const left = minX * s;
      const top = minY * s;
      const width = (maxX - minX) * s;
      const height = (maxY - minY) * s;

      return { left, top, width, height };
    };

    return highlights
      .map((highlight, index) => {
        try {
          let metadata;
          let parsed = JSON.parse(highlight.metadata);
          metadata =
            parsed?.constructor?.name === "String"
              ? JSON.parse(String(parsed))
              : parsed;

          const pageNumbers = metadata.page_numbers || [];
          const boundingBoxes = metadata.bounding_boxes || [];

          if (!pageNumbers.includes(pageNumber)) return null;

          const pageBoxes = boundingBoxes.filter(
            (b: any) => b.page === pageNumber
          );
          if (pageBoxes.length === 0) return null;

          // Determine colors by score
          const score = extractScore(highlight);
          const palette = getRelevancePalette(score);

          const highlightElements: React.JSX.Element[] = [];
          pageBoxes.forEach((pageBox: any, boxIndex: number) => {
            const { l, t, r, b } = pageBox.bbox || {};
            if (l == null || t == null || r == null || b == null) return;

            const { left, top, width, height } = normalizeBbox({ l, t, r, b });
            if (
              isNaN(left) ||
              isNaN(top) ||
              isNaN(width) ||
              isNaN(height) ||
              width <= 0 ||
              height <= 0
            ) {
              return;
            }

            const tooltip = `${
              typeof score === "number"
                ? `${palette.label} (${score.toFixed(3)})`
                : palette.label
            }: ${highlight.content.substring(0, 50)}...`;
            highlightElements.push(
              <Tooltip
                key={`highlight-${index}-${pageNumber}-box-${boxIndex}`}
                title={tooltip}
                mouseEnterDelay={0.12}
                placement="top"
              >
                <div
                  className="highlight-overlay"
                  style={
                    {
                      width: `${width}px`,
                      height: `${height}px`,
                      transform: `translate(${left}px, ${top}px)`,
                      pointerEvents: "auto",
                      zIndex: 5,
                      // theme colors via CSS vars
                      ["--highlight-bg" as any]: palette.bg,
                      ["--highlight-border" as any]: palette.border,
                    } as React.CSSProperties
                  }
                />
              </Tooltip>
            );
          });

          return highlightElements;
        } catch (error) {
          console.error("Error processing highlight:", error);
          return null;
        }
      })
      .flat()
      .filter(Boolean) as React.JSX.Element[];
  };

  if (error) {
    return (
      <div className="pdf-error-box">
        Error loading PDF: {error}
        <div className="pdf-error-box__desc">
          Make sure the PDF worker is properly configured and the PDF URL is
          accessible.
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="highlighted-info-root">
      <Document
        file={pdfUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
        loading={
          <div className="pdf-loading">
            <Space>
              <Spin size="small" />
              <span>Loading PDF...</span>
            </Space>
          </div>
        }
        error={
          <div className="pdf-failed">
            Failed to load PDF. Please check the file URL and try again.
          </div>
        }
      >
        {/* Pagination Controls */}
        {numPages && totalAvailablePages > 0 && (
          <div className="pdf-pagination">
            <button
              onClick={goToPreviousPage}
              disabled={currentPageIndex === 0}
              className="pdf-btn"
            >
              &lt;
            </button>

            <span className="pdf-page-count">
              {currentPageIndex + 1} of {totalAvailablePages}
            </span>

            <button
              onClick={goToNextPage}
              disabled={currentPageIndex === totalAvailablePages - 1}
              className="pdf-btn"
            >
              &gt;
            </button>
          </div>
        )}

        {/* Single Page Display */}
        <div className="single-page-container">
          {Boolean(
            numPages && totalAvailablePages > 0 && currentPageNumber
          ) && (
            <div className="pdf-wrap">
              {/* PDF Page Content */}
              <div className="pdf-page-container">
                {(() => {
                  const { width, height } = getOverlaySize(currentPageNumber);
                  return (
                    <div
                      className="pdf-page-inner"
                      style={{ position: "relative", width, height }}
                    >
                      <Page
                        pageNumber={currentPageNumber}
                        width={pageRenderWidth}
                        renderTextLayer={true}
                        renderAnnotationLayer={false}
                        loading={
                          <div className="pdf-page-loading">
                            <Space>
                              <Spin size="small" />
                              <span>Loading page {currentPageNumber}...</span>
                            </Space>
                          </div>
                        }
                        error={
                          <div className="pdf-page-error">
                            Failed to load page {currentPageNumber}
                          </div>
                        }
                      />
                      <div
                        className="pdf-overlay"
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width,
                          height,
                          pointerEvents: "none",
                        }}
                      >
                        {renderHighlights(currentPageNumber)}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Show message if no pages with highlights */}
          {numPages && totalAvailablePages === 0 && (
            <div className="no-highlights">
              No pages with highlights found in this document.
            </div>
          )}
        </div>
      </Document>
    </div>
  );
}

// Shallow compare highlights to avoid re-renders unless something meaningful changes
function shallowEqualHighlights(a: Highlight[] = [], b: Highlight[] = []) {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    const y = b[i];
    if (
      x === y ||
      (x.content === y.content &&
        x.source === y.source &&
        x.source_url === y.source_url &&
        x.metadata === y.metadata)
    ) {
      continue;
    }
    return false;
  }
  return true;
}

// Memoized to avoid unnecessary re-renders that can cause visible flicker while loading PDFs
const MemoPDFViewer = memo(
  PDFViewer,
  (prev, next) =>
    prev.pdfUrl === next.pdfUrl &&
    prev.selectedPage === next.selectedPage &&
    shallowEqualHighlights(prev.highlights, next.highlights)
);

export default function HighlightedInfoPage({
  data,
  chatbotId,
  sourcesContainerTitle = "sources",
  setSourcesContainerTitle,
}: Readonly<{
  data: Highlight[];
  chatbotId?: string;
  sourcesContainerTitle?: string;
  setSourcesContainerTitle?: (title: string) => void;
}>) {
  // Build a unified list of items: pdf (grouped by URL), qa (per item), text (per item)
  console.log("data", data);
  const grouped = useMemo(() => {
    type PdfGroup = {
      sourceLabel: string;
      pdfUrl: string;
      highlights: Highlight[];
    };
    type Item = {
      key: string;
      kind: "pdf" | "qa" | "text";
      sourceLabel: string;
      pdfUrl?: string;
      highlights?: Highlight[];
      qa?: { question: string; answer: string; score?: number };
      text?: string; // optional single-text content (unused for aggregated)
      textSnippets?: Array<string | TextSnippet>; // aggregated text snippets for the single text item
      linkUrl?: string; // optional URL to open (used for crawling/text groups)
    };

    const norm = (s?: string) => (s || "").toLowerCase().trim();
    const startsWithI = (s: string | undefined, prefix: string) =>
      norm(s).startsWith(prefix);

    const parseQA = (content: unknown) => {
      let qa = { question: "Question", answer: "Answer" };
      try {
        const raw =
          typeof content === "string" ? content : String(content ?? "");
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          qa = {
            question: (parsed as any).question ?? "Question",
            answer: (parsed as any).answer ?? "Answer",
          };
        }
      } catch {}
      return qa;
    };

    const labelFromSource = (source?: string) => {
      let label = source || "Document";
      const filePrefix = "file - ";
      const scoreIdx = label.indexOf(" (score");
      if (label.startsWith(filePrefix) && scoreIdx > -1) {
        label = label.substring(filePrefix.length, scoreIdx).trim();
      }
      return label || "Document";
    };

    // Build a grouping key from a URL by stripping query and hash
    const groupKeyFromUrl = (url?: string) => {
      if (!url) return "";
      try {
        const u = new URL(url);
        return `${u.origin}${u.pathname.replace(/\/$/, "")}`; // remove trailing slash
      } catch {
        // Fallback: strip query/hash manually
        return String(url).split(/[?#]/)[0].replace(/\/$/, "");
      }
    };

    const pdfMap = new Map<string, PdfGroup>();
    const crawlMap = new Map<
      string,
      { displayUrl: string; items: { content: string; originalUrl: string }[] }
    >();
    const out: Item[] = [];
    const allTextSnippets: Array<string | TextSnippet> = [];

    for (let idx = 0; idx < (data?.length || 0); idx++) {
      const h = data![idx];
      if (startsWithI(h.source, "qa")) {
        const qa = parseQA(h.content);
        const label = qa.question ? `Q&A: ${qa.question}` : "Q&A";
        // try to extract score from explicit property or source label
        let maybeScore: number | undefined = undefined;
        if (typeof (h as any).score === "number")
          maybeScore = (h as any).score as number;
        else {
          const m = String(h?.source ?? "").match(/\(score:\s*([0-9.]+)\)/i);
          if (m && m[1]) {
            const val = parseFloat(m[1]);
            if (!Number.isNaN(val)) maybeScore = val;
          }
        }
        out.push({
          key: `qa-${idx}`,
          kind: "qa",
          sourceLabel: label,
          qa: { question: qa.question, answer: qa.answer, score: maybeScore },
        });
        continue;
      }
      // Group crawling items by base URL; show URL as title and concatenate contents with Vector headers
      if (startsWithI(h.source, "crawling")) {
        const originalUrl = (h.source_url || "").toString();
        const baseKey =
          groupKeyFromUrl(originalUrl) || originalUrl || `crawl-${idx}`;
        const displayUrl = baseKey || originalUrl || "Crawled Source";
        const textContent = (h.content || "").toString().trim();
        if (!crawlMap.has(baseKey)) {
          crawlMap.set(baseKey, { displayUrl, items: [] });
        }
        crawlMap
          .get(baseKey)!
          .items.push({ content: textContent, originalUrl: originalUrl });
        continue;
      }
      if (startsWithI(h.source, "text")) {
        const snippetFull = (h.content || "").toString();
        const clean = snippetFull.replace(/\s+/g, " ").trim();
        if (clean) {
          const maybeScore =
            typeof (h as any).score === "number"
              ? ((h as any).score as number)
              : undefined;
          allTextSnippets.push(
            maybeScore != null ? { text: clean, score: maybeScore } : clean
          );
        }
        continue;
      }
      const key = h.source_url || `doc-${idx}`;
      const existing = pdfMap.get(key);
      if (existing) {
        existing.highlights.push(h);
      } else {
        pdfMap.set(key, {
          sourceLabel: labelFromSource(h.source),
          pdfUrl: h.source_url,
          highlights: [h],
        });
      }
    }

    // Add a single consolidated text item if we found any text snippets
    if (allTextSnippets.length > 0) {
      out.push({
        key: "text-all",
        kind: "text",
        sourceLabel: "Text: Original data",
        textSnippets: allTextSnippets,
      });
    }

    // Emit grouped crawling items: concatenate contents as Vector 1, Vector 2, ...
    crawlMap.forEach((group, key) => {
      const combined = group.items
        .map((it, i) => `#### Vector ${i + 1} #####\n${it.content}`)
        .join("\n\n");
      // Use displayUrl for label and link
      out.push({
        key: `crawl-${key}`,
        kind: "text",
        sourceLabel: group.displayUrl,
        text: combined,
        linkUrl: group.displayUrl,
      });
    });

    pdfMap.forEach((v, k) => {
      out.push({
        key: k,
        kind: "pdf",
        sourceLabel: v.sourceLabel,
        pdfUrl: v.pdfUrl,
        highlights: v.highlights,
      });
    });

    // QA items are separate sources; do not associate with PDFs.

    return out;
  }, [data]);

  // The item opened in full mode (overlay). When null, all items are in normal view.
  const [selectedSourceKey, setSelectedSourceKey] = useState<string | null>(
    null
  );
  const [selectedPage, setSelectedPage] = useState<number | null>(null);

  // Track and safely update the sources container title
  const initialTitleRef = useRef<string>(sourcesContainerTitle);
  const safeSetTitle = useCallback(
    (title: string) => {
      if (typeof setSourcesContainerTitle === "function") {
        setSourcesContainerTitle(title);
      }
    },
    [setSourcesContainerTitle]
  );
  // If no item is expanded, keep the latest external title as the default to restore
  useEffect(() => {
    if (!selectedSourceKey)
      initialTitleRef.current = sourcesContainerTitle || "sources";
  }, [sourcesContainerTitle, selectedSourceKey]);

  // Update selection if data changes
  useEffect(() => {
    if (
      selectedSourceKey &&
      !grouped.find((g) => g.key === selectedSourceKey)
    ) {
      setSelectedSourceKey(null);
      safeSetTitle(initialTitleRef.current);
    }
  }, [grouped, selectedSourceKey, safeSetTitle]);

  // Reset page on source change
  useEffect(() => {
    setSelectedPage(null);
  }, [selectedSourceKey]);

  // Close overlay with Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedSourceKey(null);
        safeSetTitle(initialTitleRef.current);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [safeSetTitle]);

  // If the external title no longer has a leading chevron (user pressed back outside), collapse selection
  useEffect(() => {
    if (!selectedSourceKey) return;

    if (sourcesContainerTitle.toLowerCase() === "sources") {
      setSelectedSourceKey(null);
    }
  }, [sourcesContainerTitle, selectedSourceKey]);

  return (
    <div className="highlighted-info-outer">
      <div className="highlighted-info-inner">
        {grouped.length === 0 ? (
          <div className="no-sources">
            <Empty description="No sources" />
          </div>
        ) : (
          <div>
            {grouped.map((item) => {
              // When an item is selected, hide everything else entirely
              if (selectedSourceKey && item.key !== selectedSourceKey) {
                return null;
              }
              const isExpanded = item.key === selectedSourceKey;
              const icon =
                item.kind === "pdf" ? (
                  <Image src={DocIcon} alt="Document Icon" />
                ) : item.kind === "qa" ? (
                  <Image src={QAIcon} alt="Q&A Icon" />
                ) : (
                  <Image src={WebIcon} alt="Web Icon" />
                );
              return (
                <div key={item.key} className="source-item">
                  {/* Header: Icon title > */}
                  {!isExpanded && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSourceKey((prev) => {
                          const next = prev === item.key ? null : item.key;
                          if (next) {
                            // Prefix with a back chevron in the container title when an item is opened
                            safeSetTitle(`${item.sourceLabel}`);
                          } else {
                            safeSetTitle(initialTitleRef.current);
                          }
                          return next;
                        });
                      }}
                      className="source-header-btn"
                    >
                      <span aria-hidden>{icon}</span>
                      <span className="source-header-title">
                        <Typography.Text
                          strong
                          ellipsis
                          title={item.sourceLabel}
                          className="source-title-text"
                        >
                          {item.sourceLabel}
                        </Typography.Text>
                      </span>
                      <Image src={RightArrowIcon} alt="right-arrow" />
                    </button>
                  )}

                  {/* Collapsed preview (max 30% height) */}
                  {!isExpanded && (
                    <div
                      id={`viewer-${item.key}`}
                      className={`viewer-preview ${
                        item.kind === "pdf" ? "viewer-preview--pdf" : ""
                      }`}
                    >
                      {item.kind === "pdf" && (
                        <MemoPDFViewer
                          pdfUrl={item.pdfUrl as string}
                          highlights={(item.highlights as Highlight[]) || []}
                          selectedPage={null}
                        />
                      )}
                      {item.kind === "qa" && (
                        <div className="qa-preview">
                          {(() => {
                            const score = item.qa?.score;
                            const palette = getRelevancePalette(score);
                            const qNodes = renderHighlightedText(
                              item.qa?.question || "",
                              [{ text: item.qa?.question || "", score }]
                            );
                            const aNodes = renderHighlightedText(
                              item.qa?.answer || "",
                              [{ text: item.qa?.answer || "", score }]
                            );
                            return (
                              <>
                                <div
                                  className="qa-paragraph--q qa-highlight"
                                  style={{
                                    ["--qa-bg" as any]: palette.bg,
                                    ["--qa-border" as any]: palette.border,
                                  }}
                                >
                                  <Typography.Text strong>Q:</Typography.Text>{" "}
                                  {qNodes}
                                </div>
                                <div
                                  className="qa-paragraph--a qa-highlight"
                                  style={{
                                    ["--qa-bg" as any]: palette.bg,
                                    ["--qa-border" as any]: palette.border,
                                  }}
                                >
                                  <Typography.Text strong>A:</Typography.Text>{" "}
                                  {aNodes}
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      )}
                      {item.kind === "text" && (
                        <div className="text-preview">
                          {(() => {
                            if (item.text && item.text.length > 0) {
                              return <>{item.text}</>;
                            }
                            const snippets =
                              item.textSnippets && item.textSnippets.length > 0
                                ? item.textSnippets
                                : grouped
                                    .filter((g) => g.kind === "text")
                                    .flatMap((g: any) =>
                                      Array.isArray(g.textSnippets)
                                        ? g.textSnippets
                                        : []
                                    )
                                    .filter((t: string) => t && t.length > 0);
                            const highlighted = renderHighlightedText(
                              DUMMY_FULL_TEXT,
                              snippets as Array<string | TextSnippet>
                            );
                            return <>{highlighted}</>;
                          })()}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Expanded panel within component area */}
                  {isExpanded && (
                    <div className="expanded-panel">
                      {typeof setSourcesContainerTitle !== "function" && (
                        <div className="expanded-panel__back">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSourceKey(null);
                            }}
                            className="expanded-panel__back-btn"
                            title="Back"
                          >
                            ← Back
                          </button>
                        </div>
                      )}
                      {item.kind === "pdf" && (
                        <MemoPDFViewer
                          pdfUrl={item.pdfUrl as string}
                          highlights={(item.highlights as Highlight[]) || []}
                          selectedPage={selectedPage}
                        />
                      )}
                      {item.kind === "qa" && (
                        <div className="qa-expanded">
                          {(() => {
                            const score = item.qa?.score;
                            const palette = getRelevancePalette(score);
                            const qNodes = renderHighlightedText(
                              item.qa?.question || "",
                              [{ text: item.qa?.question || "", score }]
                            );
                            const aNodes = renderHighlightedText(
                              item.qa?.answer || "",
                              [{ text: item.qa?.answer || "", score }]
                            );
                            return (
                              <>
                                <div
                                  className="qa-paragraph--q qa-highlight qa-expanded--q"
                                  style={{
                                    ["--qa-bg" as any]: palette.bg,
                                    ["--qa-border" as any]: palette.border,
                                  }}
                                >
                                  <Typography.Text strong>Q:</Typography.Text>{" "}
                                  {qNodes}
                                </div>
                                <div
                                  className="qa-paragraph--a qa-highlight qa-expanded--a"
                                  style={{
                                    ["--qa-bg" as any]: palette.bg,
                                    ["--qa-border" as any]: palette.border,
                                  }}
                                >
                                  <Typography.Text strong>A:</Typography.Text>{" "}
                                  {aNodes}
                                </div>
                                {/* QA items do not render PDF viewers */}
                              </>
                            );
                          })()}
                        </div>
                      )}
                      {item.kind === "text" && (
                        <div className="text-expanded">
                          {(() => {
                            if (item.text && item.text.length > 0) {
                              return <>{item.text}</>;
                            }
                            const snippets =
                              item.textSnippets && item.textSnippets.length > 0
                                ? item.textSnippets
                                : grouped
                                    .filter((g) => g.kind === "text")
                                    .flatMap((g: any) =>
                                      Array.isArray(g.textSnippets)
                                        ? g.textSnippets
                                        : []
                                    )
                                    .filter((t: string) => t && t.length > 0);
                            const highlighted = renderHighlightedText(
                              DUMMY_FULL_TEXT,
                              snippets as Array<string | TextSnippet>
                            );
                            return <>{highlighted}</>;
                          })()}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

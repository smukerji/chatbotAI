// "use client";
// import { Document, Page, pdfjs } from "react-pdf";
// import { useState, useCallback, useEffect, useRef } from "react";

// import "react-pdf/dist/Page/AnnotationLayer.css";
// import "react-pdf/dist/Page/TextLayer.css";

// // Fix worker setup
// pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.3.31/build/pdf.worker.mjs`;

// type BoundingBox = {
//   l: number;
//   t: number;
//   r: number;
//   b: number;
// };

// type Viewport = {
//   width: number;
//   height: number;
//   scale: number;
//   rotation: number;
//   // pdf.js page viewport transform matrix [a,b,c,d,e,f] at scale=1
//   transform?: number[];
// };

// type Highlight = {
//   source: string;
//   content: string;
//   metadata: string;
//   source_url: string;
// };

// type PDFViewerProps = Readonly<{
//   pdfUrl: string;
//   highlights: Highlight[];
// }>;

// function PDFViewer(props: PDFViewerProps) {
//   const { pdfUrl, highlights } = props;
//   const [numPages, setNumPages] = useState<number | null>(null);
//   const [error, setError] = useState<string | null>(null);
//   const [viewports, setViewports] = useState<Map<number, Viewport>>(new Map());

//   // Responsive container width tracking
//   const containerRef = useRef<HTMLDivElement | null>(null);
//   const [containerWidth, setContainerWidth] = useState<number>(400); // reasonable default for 30% width

//   useEffect(() => {
//     const el = containerRef.current;
//     if (!el) return;

//     // initialize width immediately
//     const initial = Math.floor(el.clientWidth);
//     if (initial > 0) setContainerWidth(initial);

//     const ro = new ResizeObserver((entries) => {
//       const cr = entries[0]?.contentRect;
//       if (!cr) return;
//       const w = Math.floor(cr.width);
//       if (w > 0) setContainerWidth(w);
//     });
//     ro.observe(el);

//     return () => ro.disconnect();
//   }, []);

//   // Calculate page render width based on container, with some padding
//   const pageRenderWidth = Math.max(200, containerWidth - 32); // 16px padding on each side

//   const onDocumentLoadSuccess = async (pdf: any) => {
//     setError(null);
//     const newViewports = new Map<number, Viewport>();

//     for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
//       const page = await pdf.getPage(pageNum);
//       // get default 1x viewport to compute scaling for overlays
//       const rawViewport: any = page.getViewport({ scale: 1.0, rotation: page.rotate || 0 });
//       newViewports.set(pageNum, {
//         width: rawViewport.width,
//         height: rawViewport.height,
//         scale: rawViewport.scale,
//         rotation: rawViewport.rotation,
//         transform: rawViewport.transform,
//       });
//     }
//     setViewports(newViewports);
//     setNumPages(pdf.numPages);
//   };

//   const onDocumentLoadError = (error: Error) => {
//     setError(error.message);
//   };

//   const getHighlightColor = useCallback((index: number) => {
//     const colors = [
//       "rgba(255, 255, 0, 0.4)",
//       "rgba(0, 191, 255, 0.4)",
//       "rgba(144, 238, 144, 0.4)",
//       "rgba(255, 182, 193, 0.4)",
//       "rgba(221, 160, 221, 0.4)",
//       "rgba(230, 230, 250, 0.5)",
//       "rgba(255, 160, 160, 0.4)",
//       "rgba(255, 218, 185, 0.4)",
//     ];
//     return colors[index % colors.length];
//   }, []);

//   const getBorderColor = useCallback((index: number) => {
//     const colors = [
//       "rgba(255, 255, 0, 0.8)",
//       "rgba(0, 191, 255, 0.8)",
//       "rgba(0, 200, 0, 0.8)",
//       "rgba(255, 120, 150, 0.8)",
//       "rgba(180, 100, 180, 0.8)",
//       "rgba(100, 100, 200, 0.8)",
//       "rgba(255, 100, 100, 0.8)",
//       "rgba(255, 165, 0, 0.8)",
//     ];
//     return colors[index % colors.length];
//   }, []);

//   const scaleForPage = (pageNumber: number) => {
//     const vp = viewports.get(pageNumber);
//     if (!vp || vp.width === 0) return 1;
//     return pageRenderWidth / vp.width;
//   };

//   const getOverlaySize = (pageNumber: number) => {
//     const vp = viewports.get(pageNumber);
//     if (!vp) return { width: pageRenderWidth, height: pageRenderWidth * 1.414 }; // fallback A4-ish
//     const s = scaleForPage(pageNumber);
//     return { width: vp.width * s, height: vp.height * s };
//   };

//   const renderHighlights = (pageNumber: number): React.JSX.Element[] => {
//     const viewport = viewports.get(pageNumber);
//     if (!viewport) return [];

//     const s = scaleForPage(pageNumber);
//     const baseWidth = viewport.width;
//     const baseHeight = viewport.height;
//     const matrix = viewport.transform || [1, 0, 0, -1, 0, baseHeight];

//     const applyMatrix = (x: number, y: number) => {
//       const [a, b, c, d, e, f] = matrix;
//       return {
//         x: a * x + c * y + e,
//         y: b * x + d * y + f,
//       };
//     };

//     // Helper to normalize bbox to absolute PDF pixel coords (scale=1 viewport)
//     const normalizeBbox = (bbox: BoundingBox) => {
//       let { l, t, r, b } = bbox;

//       // If coordinates look normalized (0..1), scale up to page pixels first
//       const looksNormalized =
//         l >= 0 && r >= 0 && t >= 0 && b >= 0 &&
//         l <= 1 && r <= 1 && t <= 1 && b <= 1;

//       if (looksNormalized) {
//         l = l * baseWidth;
//         r = r * baseWidth;
//         t = t * baseHeight;
//         b = b * baseHeight;
//       }

//   // Map PDF-space -> viewport-space using pdf.js transform at scale=1
//   const pLT = applyMatrix(l, t);
//   const pRT = applyMatrix(r, t);
//   const pRB = applyMatrix(r, b);
//   const pLB = applyMatrix(l, b);

//   // Compute bounding box in viewport space
//   const minX = Math.min(pLT.x, pRT.x, pRB.x, pLB.x);
//   const maxX = Math.max(pLT.x, pRT.x, pRB.x, pLB.x);
//   const minY = Math.min(pLT.y, pRT.y, pRB.y, pLB.y);
//   const maxY = Math.max(pLT.y, pRT.y, pRB.y, pLB.y);

//   // Then scale to the actual rendered page width
//   const left = minX * s;
//   const top = minY * s;
//   const width = (maxX - minX) * s;
//   const height = (maxY - minY) * s;

//   return { left, top, width, height, meta: { looksNormalized, usedMatrix: matrix } };
//     };

//     return highlights
//       .map((highlight, index) => {
//         try {
//           let metadata;
//           let parsed = JSON.parse(highlight.metadata);

//           if (parsed.constructor.name === "String") {
//             metadata = JSON.parse(String(parsed));
//           } else {
//             metadata = parsed;
//           }

//           console.log(`Metadata for highlight ${index}:`, metadata);

//           const pageNumbers = metadata.page_numbers || [];
//           const boundingBoxes = metadata.bounding_boxes || [];

//           if (!pageNumbers.includes(pageNumber)) {
//             return null;
//           }

//           const pageBoxes = boundingBoxes.filter(
//             (b: any) => b.page === pageNumber
//           );

//           if (pageBoxes.length === 0) return null;

//           const highlightElements: React.JSX.Element[] = [];

//           pageBoxes.forEach((pageBox: any, boxIndex: number) => {
//             console.log(`Processing pageBox for page ${pageNumber}:`, pageBox);
//             const { l, t, r, b } = pageBox.bbox;

//             // Validate bounding box coordinates
//             if (
//               l === undefined ||
//               t === undefined ||
//               r === undefined ||
//               b === undefined
//             ) {
//               console.warn(
//                 `Invalid bounding box for page ${pageNumber}:`,
//                 pageBox.bbox
//               );
//               return;
//             }

//       // Normalize and convert to on-screen CSS px
//       const { left, top, width, height, meta } = normalizeBbox({ l, t, r, b });

//             console.log(
//               `Coordinates for page ${pageNumber}, box ${boxIndex}:`,
//               {
//                 original: { l, t, r, b },
//         viewport: { width: baseWidth, height: baseHeight },
//         scale: s,
//         normalized: meta,
//         final: { left, top, width, height },
//               }
//             );

//             // Validate dimensions
//             if (
//               isNaN(left) ||
//               isNaN(top) ||
//               isNaN(width) ||
//               isNaN(height) ||
//               width <= 0 ||
//               height <= 0
//             ) {
//               console.warn(
//                 `Invalid dimensions for highlight on page ${pageNumber}:`,
//                 { left, top, width, height }
//               );
//               return;
//             }

//             highlightElements.push(
//               <div
//                 key={`highlight-${index}-${pageNumber}-box-${boxIndex}`}
//                 className="pointer-events-none"
//                 style={{
//                   position: "absolute",
//                   left: 0,
//                   top: 0,
//                   width: `${width}px`,
//                   height: `${height}px`,
//                   backgroundColor: getHighlightColor(index),
//                   border: `1px solid ${getBorderColor(index)}`,
//                   borderRadius: "3px",
//                   zIndex: 10,
//                   mixBlendMode: "multiply",
//                   opacity: 0.85,
//                   transform: `translate(${left}px, ${top}px)`,
//                   willChange: "transform",
//                   boxShadow: `inset 0 0 0 1px ${getBorderColor(
//                     index
//                   )}, 0 0 3px rgba(0,0,0,0.1)`,
//                 }}
//                 title={`Highlight ${index + 1}: ${highlight.content.substring(
//                   0,
//                   50
//                 )}...`}
//                 data-left={left}
//                 data-top={top}
//               />
//             );
//           });

//           return highlightElements;
//         } catch (error) {
//           console.error("Error processing highlight:", error);
//           return null;
//         }
//       })
//       .flat()
//       .filter(Boolean) as React.JSX.Element[];
//   };

//   if (error) {
//     return (
//       <div
//         style={{
//           color: "#dc2626",
//           border: "1px solid #fca5a5",
//           borderRadius: "4px",
//         }}
//       >
//         Error loading PDF: {error}
//         <div style={{ marginTop: "8px", fontSize: "14px" }}>
//           Make sure the PDF worker is properly configured and the PDF URL is
//           accessible.
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div
//       ref={containerRef}
//       style={{
//         width: "100%",
//         height: "100%",
//         overflow: "auto",
//         border: "1px solid #e5e7eb",
//         borderRadius: "0.375rem",
//         boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
//       }}
//     >
//       <Document
//         file={pdfUrl}
//         onLoadSuccess={onDocumentLoadSuccess}
//         onLoadError={onDocumentLoadError}
//         loading={
//           <div style={{ textAlign: "center", padding: "16px" }}>
//             Loading PDF...
//           </div>
//         }
//         error={
//           <div
//             style={{
//               color: "#dc2626",
//               border: "1px solid #fca5a5",
//               borderRadius: "4px",
//               padding: "16px",
//               margin: "16px",
//             }}
//           >
//             Failed to load PDF. Please check the file URL and try again.
//           </div>
//         }
//       >
//         <div style={{ padding: "16px" }}>
//           {numPages &&
//             Array.from({ length: numPages }, (_, index) => {
//               const pageNumber = index + 1;
//               return (
//                 <div
//                   key={`page_${pageNumber}`}
//                   style={{
//                     position: "relative",
//                     marginBottom: "16px",
//                     display: "flex",
//                     justifyContent: "center",
//                   }}
//                 >
//                   {(() => {
//                     const { width, height } = getOverlaySize(pageNumber);
//                     return (
//                       <div style={{ position: "relative", width, height }}>
//                     <Page
//                       pageNumber={pageNumber}
//                       width={pageRenderWidth}
//                       renderTextLayer={true}
//                       renderAnnotationLayer={false}
//                       loading={
//                         <div style={{ textAlign: "center", padding: "8px" }}>
//                           Loading page {pageNumber}...
//                         </div>
//                       }
//                       error={
//                         <div style={{ color: "#dc2626", padding: "8px" }}>
//                           Failed to load page {pageNumber}
//                         </div>
//                       }
//                     />
//                     <div
//                       style={{
//                         position: "absolute",
//                         top: 0,
//                         left: 0,
//                         width,
//                         height,
//                         pointerEvents: "none",
//                       }}
//                     >
//                       {renderHighlights(pageNumber)}
//                     </div>
//                       </div>
//                     );
//                   })()}
//                 </div>
//               );
//             })}
//         </div>
//       </Document>
//     </div>
//   );
// }

// export default function HighlightedInfoPage({
//   data,
// }: Readonly<{ data: Highlight[] }>) {
//   const pdfUrl = data.length > 0 ? data[0].source_url : "";
//   const highlights = data;

//   return (
//     <div
//       style={{
//         width: "100%",
//         height: "100%",
//         minHeight: "400px", // Ensure minimum height
//         display: "flex",
//         flexDirection: "column",
//       }}
//     >
//       <PDFViewer pdfUrl={pdfUrl} highlights={highlights} />
//     </div>
//   );
// }

"use client";
import { Document, Page, pdfjs } from "react-pdf";
import { useState, useCallback, useEffect, useRef } from "react";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Fix worker setup
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.3.31/build/pdf.worker.mjs`;

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
};

type PDFViewerProps = Readonly<{
  pdfUrl: string;
  highlights: Highlight[];
}>;

function PDFViewer(props: PDFViewerProps) {
  const { pdfUrl, highlights } = props;
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

  const goToPage = (pageIndex: number) => {
    if (pageIndex >= 0 && pageIndex < totalAvailablePages) {
      setCurrentPageIndex(pageIndex);
    }
  };

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

  const getHighlightColor = useCallback((index: number) => {
    const colors = [
      "rgba(255, 255, 0, 0.4)",
      "rgba(0, 191, 255, 0.4)",
      "rgba(144, 238, 144, 0.4)",
      "rgba(255, 182, 193, 0.4)",
      "rgba(221, 160, 221, 0.4)",
      "rgba(230, 230, 250, 0.5)",
      "rgba(255, 160, 160, 0.4)",
      "rgba(255, 218, 185, 0.4)",
    ];
    return colors[index % colors.length];
  }, []);

  const getBorderColor = useCallback((index: number) => {
    const colors = [
      "rgba(255, 255, 0, 0.8)",
      "rgba(0, 191, 255, 0.8)",
      "rgba(0, 200, 0, 0.8)",
      "rgba(255, 120, 150, 0.8)",
      "rgba(180, 100, 180, 0.8)",
      "rgba(100, 100, 200, 0.8)",
      "rgba(255, 100, 100, 0.8)",
      "rgba(255, 165, 0, 0.8)",
    ];
    return colors[index % colors.length];
  }, []);

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

    // Helper to normalize bbox to absolute PDF pixel coords (scale=1 viewport)
    const normalizeBbox = (bbox: BoundingBox) => {
      let { l, t, r, b } = bbox;

      // If coordinates look normalized (0..1), scale up to page pixels first
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

      // Map PDF-space -> viewport-space using pdf.js transform at scale=1
      const pLT = applyMatrix(l, t);
      const pRT = applyMatrix(r, t);
      const pRB = applyMatrix(r, b);
      const pLB = applyMatrix(l, b);

      // Compute bounding box in viewport space
      const minX = Math.min(pLT.x, pRT.x, pRB.x, pLB.x);
      const maxX = Math.max(pLT.x, pRT.x, pRB.x, pLB.x);
      const minY = Math.min(pLT.y, pRT.y, pRB.y, pLB.y);
      const maxY = Math.max(pLT.y, pRT.y, pRB.y, pLB.y);

      // Then scale to the actual rendered page width
      const left = minX * s;
      const top = minY * s;
      const width = (maxX - minX) * s;
      const height = (maxY - minY) * s;

      return {
        left,
        top,
        width,
        height,
        meta: { looksNormalized, usedMatrix: matrix },
      };
    };

    return highlights
      .map((highlight, index) => {
        try {
          let metadata;
          let parsed = JSON.parse(highlight.metadata);

          if (parsed.constructor.name === "String") {
            metadata = JSON.parse(String(parsed));
          } else {
            metadata = parsed;
          }

          console.log(`Metadata for highlight ${index}:`, metadata);

          const pageNumbers = metadata.page_numbers || [];
          const boundingBoxes = metadata.bounding_boxes || [];

          if (!pageNumbers.includes(pageNumber)) {
            return null;
          }

          const pageBoxes = boundingBoxes.filter(
            (b: any) => b.page === pageNumber
          );

          if (pageBoxes.length === 0) return null;

          const highlightElements: React.JSX.Element[] = [];

          pageBoxes.forEach((pageBox: any, boxIndex: number) => {
            console.log(`Processing pageBox for page ${pageNumber}:`, pageBox);
            const { l, t, r, b } = pageBox.bbox;

            // Validate bounding box coordinates
            if (
              l === undefined ||
              t === undefined ||
              r === undefined ||
              b === undefined
            ) {
              console.warn(
                `Invalid bounding box for page ${pageNumber}:`,
                pageBox.bbox
              );
              return;
            }

            // Normalize and convert to on-screen CSS px
            const { left, top, width, height, meta } = normalizeBbox({
              l,
              t,
              r,
              b,
            });

            console.log(
              `Coordinates for page ${pageNumber}, box ${boxIndex}:`,
              {
                original: { l, t, r, b },
                viewport: { width: baseWidth, height: baseHeight },
                scale: s,
                normalized: meta,
                final: { left, top, width, height },
              }
            );

            // Validate dimensions
            if (
              isNaN(left) ||
              isNaN(top) ||
              isNaN(width) ||
              isNaN(height) ||
              width <= 0 ||
              height <= 0
            ) {
              console.warn(
                `Invalid dimensions for highlight on page ${pageNumber}:`,
                { left, top, width, height }
              );
              return;
            }

            highlightElements.push(
              <div
                key={`highlight-${index}-${pageNumber}-box-${boxIndex}`}
                className="pointer-events-none"
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: `${width}px`,
                  height: `${height}px`,
                  backgroundColor: getHighlightColor(index),
                  border: `1px solid ${getBorderColor(index)}`,
                  borderRadius: "3px",
                  zIndex: 10,
                  mixBlendMode: "multiply",
                  opacity: 0.85,
                  transform: `translate(${left}px, ${top}px)`,
                  willChange: "transform",
                  boxShadow: `inset 0 0 0 1px ${getBorderColor(
                    index
                  )}, 0 0 3px rgba(0,0,0,0.1)`,
                }}
                title={`Highlight ${index + 1}: ${highlight.content.substring(
                  0,
                  50
                )}...`}
                data-left={left}
                data-top={top}
              />
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
      <div
        style={{
          color: "#dc2626",
          border: "1px solid #fca5a5",
          borderRadius: "4px",
        }}
      >
        Error loading PDF: {error}
        <div style={{ marginTop: "8px", fontSize: "14px" }}>
          Make sure the PDF worker is properly configured and the PDF URL is
          accessible.
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        overflow: "auto",
        border: "1px solid #e5e7eb",
        borderRadius: "0.375rem",
        boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
      }}
    >
      <Document
        file={pdfUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
        loading={
          <div style={{ textAlign: "center", padding: "16px" }}>
            Loading PDF...
          </div>
        }
        error={
          <div
            style={{
              color: "#dc2626",
              border: "1px solid #fca5a5",
              borderRadius: "4px",
              padding: "16px",
              margin: "16px",
            }}
          >
            Failed to load PDF. Please check the file URL and try again.
          </div>
        }
      >
        {/* Pagination Controls */}
        {numPages && totalAvailablePages > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: "12px",
              borderBottom: "1px solid #e5e7eb",
              backgroundColor: "#f9fafb",
              gap: "12px",
            }}
          >
            <button
              onClick={goToPreviousPage}
              disabled={currentPageIndex === 0}
              style={{
                padding: "4px 8px",
                backgroundColor: "transparent",
                color: currentPageIndex === 0 ? "#9ca3af" : "#374151",
                border: "1px solid #d1d5db",
                borderRadius: "4px",
                cursor: currentPageIndex === 0 ? "not-allowed" : "pointer",
                fontSize: "14px",
                minWidth: "28px",
                height: "28px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              &lt;
            </button>

            <span
              style={{
                fontSize: "14px",
                color: "#374151",
                minWidth: "120px",
                textAlign: "center",
              }}
            >
              {currentPageIndex + 1} of {totalAvailablePages}
            </span>

            <button
              onClick={goToNextPage}
              disabled={currentPageIndex === totalAvailablePages - 1}
              style={{
                padding: "4px 8px",
                backgroundColor: "transparent",
                color:
                  currentPageIndex === totalAvailablePages - 1
                    ? "#9ca3af"
                    : "#374151",
                border: "1px solid #d1d5db",
                borderRadius: "4px",
                cursor:
                  currentPageIndex === totalAvailablePages - 1
                    ? "not-allowed"
                    : "pointer",
                fontSize: "14px",
                minWidth: "28px",
                height: "28px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              &gt;
            </button>
          </div>
        )}

        {/* Single Page Display */}
        <div style={{ padding: "16px", minHeight: "400px" }}>
          {Boolean(
            numPages && totalAvailablePages > 0 && currentPageNumber
          ) && (
            <div
              style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              {/* PDF Page Content */}
              <div
                style={{
                  position: "relative",
                  border: "1px solid #d1d5db",
                  borderTop: "none",
                  borderRadius: "0 0 6px 6px",
                  overflow: "hidden",
                  boxShadow: "0 2px 4px 0 rgba(0, 0, 0, 0.1)",
                }}
              >
                {(() => {
                  const { width, height } = getOverlaySize(currentPageNumber);
                  return (
                    <div style={{ position: "relative", width, height }}>
                      <Page
                        pageNumber={currentPageNumber}
                        width={pageRenderWidth}
                        renderTextLayer={true}
                        renderAnnotationLayer={false}
                        loading={
                          <div style={{ textAlign: "center", padding: "32px" }}>
                            Loading page {currentPageNumber}...
                          </div>
                        }
                        error={
                          <div
                            style={{
                              color: "#dc2626",
                              padding: "32px",
                              textAlign: "center",
                            }}
                          >
                            Failed to load page {currentPageNumber}
                          </div>
                        }
                      />
                      <div
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
            <div
              style={{
                textAlign: "center",
                padding: "64px 32px",
                color: "#6b7280",
                fontSize: "16px",
              }}
            >
              No pages with highlights found in this document.
            </div>
          )}
        </div>
      </Document>
    </div>
  );
}

export default function HighlightedInfoPage({
  data,
}: Readonly<{ data: Highlight[] }>) {
  const pdfUrl = data.length > 0 ? data[0].source_url : "";
  const highlights = data;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: "400px", // Ensure minimum height
        display: "flex",
        flexDirection: "column",
      }}
    >
      <PDFViewer pdfUrl={pdfUrl} highlights={highlights} />
    </div>
  );
}

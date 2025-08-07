import React from "react";

interface SourceData {
  source?: string;
  title?: string;
  content?: string;
  description?: string;
}

interface SourcesProps {
  data: SourceData[];
}

function Sources({ data }: SourcesProps) {
  if (!data || data.length === 0) {
    return (
      <div style={{ textAlign: "center", color: "#888", padding: "2rem" }}>
        No references found.
      </div>
    );
  }

  return (
    <div className="sources">
      {data.map((src, idx) => {
        // Extract score if present in source string
        let score = null;
        let sourceLabel = src.source || src.title || "";
        const scoreMatch = sourceLabel.match(/\(score: ([0-9.]+)\)/);
        if (scoreMatch) {
          score = scoreMatch[1];
          sourceLabel = sourceLabel.replace(scoreMatch[0], "").trim();
        }
        // Capitalize first letter
        if (sourceLabel.length > 0) {
          sourceLabel =
            sourceLabel.charAt(0).toUpperCase() + sourceLabel.slice(1);
        }

        const content = src.content || src.description || "";

        return (
          <div
            key={idx}
            style={{
              background: "#fff",
              borderRadius: 8,
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              marginBottom: 20,
              padding: 20,
              border: "1px solid #e3e3e3",
              position: "relative",
              maxHeight: "33%",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  fontWeight: 600,
                  color: "#2a4d8f",
                  fontSize: 16,
                  marginRight: 12,
                  background: "#eaf1fb",
                  padding: "2px 10px",
                  borderRadius: 6,
                }}
              >
                {sourceLabel}
              </span>
              {score && (
                <span
                  style={{
                    fontWeight: 500,
                    color: "#fff",
                    background: "#4caf50",
                    borderRadius: 6,
                    padding: "2px 10px",
                    fontSize: 14,
                    marginLeft: 8,
                    letterSpacing: 1,
                    boxShadow: "0 1px 4px rgba(76,175,80,0.12)",
                  }}
                >
                  Score: {score}
                </span>
              )}
            </div>
            <div style={{ color: "#222", fontSize: 15, lineHeight: 1.7 }}>
              {Array.isArray(content) ? (
                content.map((item: any, i: number) => (
                  <div
                    key={i}
                    style={{
                      marginBottom: 8,
                      maxHeight: 200,
                      overflowY: "auto",
                      background: "#f5f5f5",
                      borderRadius: 6,
                      padding: 8,
                    }}
                  >
                    {typeof item === "string" ? (
                      item
                    ) : typeof item === "object" ? (
                      <div style={{ maxHeight: 180, overflowY: "auto" }}>
                        {Object.entries(item).map(([k, v]) => (
                          <div key={k}>
                            <strong>
                              {k.charAt(0).toUpperCase() + k.slice(1)}:
                            </strong>{" "}
                            {String(v)}
                          </div>
                        ))}
                      </div>
                    ) : (
                      String(item)
                    )}
                  </div>
                ))
              ) : typeof content === "object" && content !== null ? (
                <div
                  style={{
                    maxHeight: 200,
                    overflowY: "auto",
                    background: "#f5f5f5",
                    borderRadius: 6,
                    padding: 8,
                  }}
                >
                  {Object.entries(content).map(([k, v]) => (
                    <div key={k}>
                      <strong>{k.charAt(0).toUpperCase() + k.slice(1)}:</strong>{" "}
                      {String(v)}
                    </div>
                  ))}
                </div>
              ) : (
                content
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default Sources;

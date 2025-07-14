import React from "react";

export function AnalysisSection({
  title,
  score,
  chart,
  tableData,
  columns, // [{ label: "Review", key: "review" }, ...]
  summaryBadge,
}) {
  return (
    <section
      style={{
        background: "#fff",
        borderRadius: 16,
        boxShadow: "0 2px 12px #0001",
        padding: 24,
        margin: "24px 0",
        maxWidth: 900,
        width: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          marginBottom: 16,
        }}
      >
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>{title}</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {score !== undefined && (
            <span style={{ fontSize: 28, fontWeight: 700, color: "#3b82f6" }}>
              {score}
            </span>
          )}
          {summaryBadge && (
            <span
              style={{
                padding: "4px 14px",
                borderRadius: 12,
                fontWeight: 600,
                background:
                  summaryBadge === "HIGH"
                    ? "#fee2e2"
                    : summaryBadge === "LOW"
                    ? "#dcfce7"
                    : "#fef9c3",
                color:
                  summaryBadge === "HIGH"
                    ? "#dc2626"
                    : summaryBadge === "LOW"
                    ? "#16a34a"
                    : "#ca8a04",
                fontSize: 16,
              }}
            >
              {summaryBadge}
            </span>
          )}
        </div>
      </div>
      <div style={{ marginBottom: 24 }}>{chart}</div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f1f5f9" }}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{
                    padding: 8,
                    border: "1px solid #e5e7eb",
                    textAlign: "left",
                  }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, idx) => (
              <tr key={idx}>
                {columns.map((col) => (
                  <td
                    key={col.key}
                    style={{
                      padding: 8,
                      border: "1px solid #e5e7eb",
                      textAlign: col.align || "left",
                    }}
                  >
                    {row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
} 
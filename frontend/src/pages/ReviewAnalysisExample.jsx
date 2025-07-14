import React from "react";
import { Line } from "react-chartjs-2";
import { AnalysisSection } from "../components/AnalysisSection";

const reviewTableData = [
  { review: "Great product!", confidence: "92%", risk: "LOW" },
  { review: "Not as expected.", confidence: "60%", risk: "MEDIUM" },
  { review: "Fake, don't buy!", confidence: "20%", risk: "HIGH" },
];

const confidenceTrend = {
  labels: ["Review 1", "Review 2", "Review 3"],
  datasets: [
    {
      label: "Confidence",
      data: [0.92, 0.6, 0.2],
      borderColor: "#3b82f6",
      backgroundColor: "#93c5fd",
      tension: 0.3,
    },
  ],
};

export default function ReviewAnalysisExample() {
  return (
    <AnalysisSection
      title="Review Analysis"
      score="85%"
      summaryBadge="LOW"
      chart={
        <Line
          data={confidenceTrend}
          options={{
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
              y: { min: 0, max: 1, ticks: { callback: (v) => `${v * 100}%` } },
            },
          }}
        />
      }
      tableData={reviewTableData}
      columns={[
        { label: "Review", key: "review" },
        { label: "Confidence", key: "confidence" },
        { label: "Risk Level", key: "risk" },
      ]}
    />
  );
} 
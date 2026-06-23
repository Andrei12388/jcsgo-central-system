import React from "react";

type LoadingSpinnerProps = {
  title?: string;
};

export default function LoadingSpinner({
  title = "Loading...",
}: LoadingSpinnerProps) {
  return (
    <div
  style={{
    position: "fixed",
    bottom: 24,
    right: 24,
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "14px 18px",
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: 14,
    backdropFilter: "blur(8px)",
    boxShadow:
      "0 10px 30px rgba(0,0,0,0.15)",
    zIndex: 9999,
  }}
>
  <div className="spinner"></div>

  <div>
    <div style={{ fontWeight: 600 }}>
      {title}
    </div>
    <div
      style={{
        fontSize: 12,
        opacity: 0.7,
      }}
    >
      Please wait...
    </div>
  </div>
</div>
  );
}
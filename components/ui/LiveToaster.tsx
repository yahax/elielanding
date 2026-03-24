"use client";

import { Toaster } from "react-hot-toast";

export function LiveToaster() {
  return (
    <Toaster
      toasterId="live"
      position="top-right"
      toastOptions={{
        duration: 3600,
        style: {
          borderRadius: "12px",
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(17,18,24,0.96)",
          color: "#f5f1e8",
          boxShadow: "0 16px 30px rgba(0,0,0,0.38)",
          padding: "10px 12px",
          fontSize: "12px",
          maxWidth: "390px",
        },
      }}
    />
  );
}

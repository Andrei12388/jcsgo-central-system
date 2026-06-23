import React from "react";
import { useLocation } from "react-router-dom";
import { useNotification } from "../components/notificationToast";
import VineAttendance from "../components/VineAttendance";

export default function VineAttendancePage() {
  // replicate the VINE_API_URL used in App.jsx
  const VINE_API_URL =
    "https://script.google.com/macros/s/AKfycbxkZ40P9S4fF-LtH5qoq6QHYZKzpsvKOdzptFjS2WGcoD_wknVEOBSsFouNHuB_cw9O/exec";

  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const time = params.get("time") || "";
  const { notify } = useNotification();

  return (
    <div style={{ padding: 16, width: "100%" }}>
       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          <div style={{ padding: 20, borderRadius: 12, border: '1px solid var(--border)' }}>
            <h2 style={{ marginTop: 0 }}><strong>Attendance</strong></h2>
            <p style={{ margin: 0,  }}>
              Add and manage attendance records, view check-in history, and track member participation.
            </p>
          </div>
          <div style={{ padding: 20, borderRadius: 12, border: '1px solid var(--border)' }}>
            <h2 style={{ marginTop: 0 }}><strong>Reports</strong></h2>
            <p style={{ margin: 0,  }}>
              Export attendance PDFs, and view attendance history weekly monthly and yearly.
            </p>
          </div>
        </div>
      <VineAttendance webAppUrl={VINE_API_URL} time={time} notify={notify} />
    </div>
  );
}

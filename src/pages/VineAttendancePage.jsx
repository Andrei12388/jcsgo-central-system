import React from "react";
import { useLocation } from "react-router-dom";
import VineAttendance from "../components/VineAttendance";

export default function VineAttendancePage() {
  // replicate the VINE_API_URL used in App.jsx
  const VINE_API_URL =
    "https://script.google.com/macros/s/AKfycbz65DqddY7VV2cq0ge8uF2X04ofqDOMOaFKgcDqFQQaMluBYNjSN2es5ygu-f5cSZDC/exec";

  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const time = params.get("time") || "";

  return (
    <div style={{ padding: 16 }}>
      <VineAttendance webAppUrl={VINE_API_URL} time={time} />
    </div>
  );
}

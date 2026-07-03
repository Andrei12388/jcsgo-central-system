import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useNotification } from "../components/notificationToast";
import VineAttendance from "../components/VineAttendance";

const VINE_API_URL =
    "https://script.google.com/macros/s/AKfycbwDycM3nwxOF5X0Bfv8E9ZLc36r-9L_y6I7iE0srKZny2-ac2vJZbm0vbZufxAVju1_/exec";

export default function VineAttendancePage() {


  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const time = params.get("time") || "";
  const { notify } = useNotification();



//get select options
  const getSelectOptions = (key) => {
    const k = key.trim().toLowerCase()
    switch (k) {
      case 'status':
        return STATUS_OPTIONS
      case 'celebration':
        return []
      case 'category':
        return CATEGORY_OPTIONS
      case 'marital_status':
        return MARITAL_OPTIONS
      case 'ministry':
        return MINISTRY_OPTIONS
      default:
        return null
    }
  }

  return (
    <div style={{ padding: 16, width: "100%" }}>
    
       <div
  style={{
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    height: "100%", 
    gap: 16,
    
  }}
>
        <div
        style={{
          
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'Center',
          justifyContent: 'Center',
          gap: 24,
          padding: 20,
          textAlign: 'center',
         
        }}
      >
        <img
          src='logonotitle.png'
          alt='Logo'
          width={140}
          height={70}
          style={{ objectFit: 'contain' }}
        />
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 'bold' }}>Central Vine Attendance Form</h1>
          
        </div>
      </div>
      <div style={{display: "flex",justifyContent: "center", height: "100%", flexDirection: 'row', justifyItems: 'center', alignItems: 'center'}}>
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
         

        </div>
      <VineAttendance webAppUrl={VINE_API_URL} time={time} notify={notify} />
    </div>
  );
}

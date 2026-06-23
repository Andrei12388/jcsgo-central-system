import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import StatsBarGraph from "../components/StatsBarGraph";
import LoadingSpinner from "../components/ui/LoadingSpinner";

const WEB_APP_URL =
  'https://script.google.com/macros/s/AKfycbxOGv2Dz4LF8g2HodyKYvtE7lJ_6tkIPZKVEL4QUYfNhYk7GwucSUTKuANHooKwtyrO/exec'

export default function DashboardPage() {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState([])
   const selectedTime = searchParams.get("time") || "";
   const [events, setEvents] = useState([]);
   const [loading, setLoading] = useState(true)
  const navigate = useNavigate();

  const selectedCelebration = searchParams.get("time") || "";
  const selectedTitle = searchParams.get("title") || "JCSGO CENTRAL Dashboard";

  const membersData = [
    { label: "Men", value: 50, color: "#4f46e5" },
    { label: "Women", value: 40, color: "#06b6d4" },
    { label: "Young Boys", value: 20, color: "#f59e0b" },
    { label: "Young Girls", value: 14, color: "#ef4444" },
  ];
  const totalMembers = membersData.reduce((s, it) => s + it.value, 0);

  //fetch data members
  const fetchData = () => {
      setLoading(true)
      const url = selectedCelebration
        ? `${WEB_APP_URL}?time=${encodeURIComponent(selectedCelebration)}`
        : WEB_APP_URL
  
      fetch(url)
        .then((res) => res.json())
        .then((res) => {
          const fetched = res.data || []
          const withIndex = fetched.map((row, i) => ({ ...row, _rowIndex: i + 2 }))
          setData(withIndex)
          if (withIndex.length > 0 && !sortKey) {
            setSortKey(Object.keys(withIndex[0])[0])
          }
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }
  
    useEffect(() => {
      fetchData()
    }, [selectedCelebration])

    //Fetch events this week
  const fetchEvents = () => {
  const timeParam = selectedTime
    ? `&time=${encodeURIComponent(selectedTime)}`
    : "";

  fetch(`${WEB_APP_URL}?type=events${timeParam}`)
    .then((res) => res.json())
    .then((res) => {
      const today = new Date();

      const startOfWeek = new Date(today);
      const day = today.getDay();
      const diff = day === 0 ? -6 : 1 - day; // Monday start
      startOfWeek.setDate(today.getDate() + diff);
      startOfWeek.setHours(0, 0, 0, 0);
     

      // End of current week (Saturday)
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const mapped = (res.data || [])
        .map((ev) => {
          const eventDate = new Date(ev.DATE);

          return {
            id: ev.id,
            title: ev.DESCRIPTION,
            rawDate: eventDate,
            date: eventDate.toLocaleDateString("en-US", {
            weekday: "short",
            month: "long",
            day: "numeric",
            year: "numeric",
          }),
            color: ev.COLOR || "#4da6ff",
            extendedProps: {
              location: ev.LOCATION,
              description: ev.DESCRIPTION,
              details: ev.DETAILS,
              color: ev.COLOR,
            },
          };
        })
        .filter(
          (event) =>
            event.rawDate >= startOfWeek &&
            event.rawDate <= endOfWeek
        )
        .sort((a, b) => a.rawDate - b.rawDate);

      setEvents(mapped);
    });
};

  useEffect(() => {
      fetchEvents();
    }, [selectedTime]);

  console.log("Dashboard events:", events);


  return (
    <div style={{ minHeight: "100vh", display: "flex", width: "100%", flexDirection: "column" }}>
      {loading && (
         <LoadingSpinner title="Loading Data" />
      )}
      
      <header
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          paddingBottom: 20,
         
        }}
      >
      </header>

      <main style={{ flex: 1, width: "100%" }}>
       
        <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: 8 }}>
          <div
            style={{
              display: "flex",
              gap: 16,
              flexWrap: "wrap",
              alignItems: "flex-start",
            }}
          >
            <div style={{ padding: 20, borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)", flex: "1 1 240px", minWidth: 220 }}>
              <div>
              <h3 style={{ margin: 0, fontWeight: "700", fontSize: 18 }}>Total Members</h3>
              <div style={{ marginTop: 12, fontSize: 32, fontWeight: 700 }}>{data.length}</div>
              
              
            </div>
            
            
            </div>
            
            

            <div style={{ padding: 20, borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)", flex: "1 1 240px", minWidth: 220 }}>
              <h3 style={{ margin: 0, fontWeight: "700", fontSize: 18 }}>Upcoming events this Week:</h3>
              <ul style={{ marginTop: 12, paddingLeft: 16, marginBottom: 0 }}>
                {events.length === 0 && <li style={{ marginBottom: 6, fontStyle: "italic", color: "var(--text-muted)" }}>No upcoming events</li>}
                {events.map((event) => (
                  <li key={event.id} style={{ marginBottom: 6 }}>
                    {event.title} — {event.date}
                  </li>
                ))}
              </ul>
             
            </div>

            
          </div>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
             <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10, justifyItems: 'center', alignItems: 'center', background: "var(--card)", flex: "1 1 320px", minWidth: 280 }}>
              <h3 style={{ margin: 0, fontWeight: "700", fontSize: 18 }}>Members Breakdown</h3>
               <StatsBarGraph data={data} field='Category' title='Category Count' orientation="vertical" displayMode="percentage"/>
             
           
            </div>
            <StatsBarGraph data={data} field='Status' title='Status Count' displayMode="percentage" />
            
            <div style={{ padding: 20, borderRadius: 12, border: "1px solid var(--border)", flex: "1 1 320px", minWidth: 280 }}>
              <h2 style={{ marginTop: 0, fontWeight: "bold" }}>Member System</h2>
              <p style={{ margin: 0,  }}>
                Manage members, search leaders and disciples, and update member details.
              </p>
            </div>
            <div style={{ padding: 20, borderRadius: 12, border: "1px solid var(--border)", flex: "1 1 320px", minWidth: 280 }}>
              <h2 style={{ marginTop: 0, fontWeight: "bold" }}>Vine Attendance</h2>
              <p style={{ margin: 0,  }}>
                Track the current celebration attendance and open the Vine attendance page.
              </p>
            </div>
             <div style={{ padding: 20, borderRadius: 12, border: "1px solid var(--border)", flex: "1 1 320px", minWidth: 280 }}>
              <h2 style={{ marginTop: 0, fontWeight: "bold" }}>Calendar</h2>
              <p style={{ margin: 0,  }}>
                View the calendar, add events, and manage celebration schedules.
              </p>
            </div>
          </div>
        </div>
      </main>

      
    </div>
  );
}

import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useRef } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNotification } from "./notificationToast";



const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbyYUeoQyNn4fDLNLN-Vmblp63drW7H1tMj-0wqwTpgpCUYY4epi31Wo4j1Pr97xKAlI/exec";

export default function Calendar() {
  const { notify } = useNotification();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const calendarRef = useRef(null);

  const [processing, setProcessing] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [isEditingEvent, setIsEditingEvent] = useState(false);

  const [viewEvent, setViewEvent] = useState(null);

  const [selectedEventData, setSelectedEventData] = useState(null);

  const [newEvent, setNewEvent] = useState({
    DATE: "",
    DESCRIPTION: "",
    LOCATION: "",
    COLOR: "#4da6ff",
  });

  // ================= FORMAT DATE =================
  const formatDate = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (isNaN(date)) return value;

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // ================= FETCH EVENTS =================
  const fetchEvents = () => {
    fetch(WEB_APP_URL + "?type=events")
      .then((res) => res.json())
      .then((res) => {
        const mapped = (res.data || []).map((ev) => ({
          id: ev.id,
          title: ev.DESCRIPTION,
          date: ev.DATE,
          color: ev.COLOR || "#4da6ff",
          extendedProps: {
            location: ev.LOCATION,
            description: ev.DESCRIPTION,
            color: ev.COLOR,
          },
        }));

        setEvents(mapped);
      });
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // ================= ADD EVENT =================
 const saveEvent = async () => {
  setProcessing(true);

  try {
    const res = await fetch(WEB_APP_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "addEvent",
        data: newEvent,
      }),
    });

    const result = await res.json();

    if (result.status === "success") {
      notify.success("Event added!");

      setNewEvent({
        DATE: "",
        DESCRIPTION: "",
        LOCATION: "",
        COLOR: "#4da6ff",
      });

      setShowAdd(false);
      fetchEvents();
    } else {
      notify.error(result.message);
    }
  } catch (err) {
    notify.error("Something went wrong");
  } finally {
    setProcessing(false);
  }
};

 const exportMonthPDF = () => {
  const calendarApi = calendarRef.current.getApi();
  const view = calendarApi.view;

  const start = new Date(view.currentStart);
  const end = new Date(view.currentEnd);

  const monthEvents = events.filter((ev) => {
    const d = new Date(ev.date);
    return d >= start && d < end;
  });

  const doc = new jsPDF("l", "mm", "a4");

  // =========================
  // PAGE 1: EVENT LIST
  // =========================
  doc.setFontSize(14);
  doc.text(`Events - ${view.title}`, 10, 10);

 const sortedEvents = [...monthEvents].sort((a, b) => {
  return new Date(a.date) - new Date(b.date);
});

const tableData = sortedEvents.map((ev) => [
  formatDate(ev.date),
  ev.title,
  ev.extendedProps?.location || "",
]);

  autoTable(doc, {
    head: [["Date", "Event", "Location"]],
    body: tableData,
    startY: 20,
  });

  // =========================
  // PAGE 2: MONTH CALENDAR
  // =========================
  doc.addPage();

  doc.setFontSize(14);
  doc.text(`Calendar View - ${view.title}`, 10, 10);

  const year = start.getFullYear();
  const month = start.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const startDay = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Build grid
  let day = 1;
  let row = [];
  const grid = [];

  for (let i = 0; i < startDay; i++) row.push("");

  while (day <= daysInMonth) {
    row.push(day);
    if (row.length === 7) {
      grid.push(row);
      row = [];
    }
    day++;
  }

  while (row.length > 0 && row.length < 7) row.push("");
  if (row.length) grid.push(row);

  autoTable(doc, {
    head: [weekDays],
    body: grid,
    startY: 20,
  styles: {
  fontSize: 10,
  minCellHeight: 24,
  valign: "top",
  overflow: "linebreak",
  cellPadding: 2,
},

    didParseCell: function (data) {
      if (data.section !== "body") return;

      const cellDay = data.cell.raw;

      if (!cellDay) return;

      const cellDate = new Date(year, month, cellDay);

      const dayEvents = monthEvents.filter((ev) => {
        const evDate = new Date(ev.date);
        return (
          evDate.getFullYear() === cellDate.getFullYear() &&
          evDate.getMonth() === cellDate.getMonth() &&
          evDate.getDate() === cellDate.getDate()
        );
      });

      // =========================
      // COLOR CODING RULES
      // =========================
      if (dayEvents.length === 1) {
        data.cell.styles.fillColor = [220, 255, 220]; // light green
      } else if (dayEvents.length > 1) {
        data.cell.styles.fillColor = [255, 220, 220]; // light red (busy day)
      }

      // =========================
      // CELL CONTENT
      // =========================
      if (dayEvents.length > 0) {
     const titles = dayEvents
  .map((e) => `• ${e.title}`)
  .slice(0, 6)
  .join("\n");

       data.cell.text = [
  String(cellDay),
  ...titles.split("\n"),
];
      } else {
        data.cell.text = cellDay ? [String(cellDay)] : [""];
      }
    },

    didDrawCell: function (data) {
      if (data.section !== "body") return;

      const cellDay = data.cell.raw;
      if (!cellDay) return;

      const cellDate = new Date(year, month, cellDay);

      const dayEvents = monthEvents.filter((ev) => {
        const evDate = new Date(ev.date);
        return (
          evDate.getFullYear() === cellDate.getFullYear() &&
          evDate.getMonth() === cellDate.getMonth() &&
          evDate.getDate() === cellDate.getDate()
        );
      });

      // draw small indicator dots
      if (dayEvents.length > 0) {
        const x = data.cell.x + data.cell.width - 4;
        const y = data.cell.y + 4;

        doc.setFillColor(0, 123, 255);
        doc.circle(x, y, 1.2, "F");
      }
    },
  });

  const pdfBlob = doc.output("blob");
  const url = URL.createObjectURL(pdfBlob);

  window.open(url);
};

  // ================= UPDATE EVENT =================
 const updateEvent = async () => {
  setProcessing(true);

  try {
    const res = await fetch(WEB_APP_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "editEvent",
        id: selectedEventData.id,
        data: selectedEventData,
      }),
    });

    const result = await res.json();

    if (result.status === "success") {
      notify.success("Event updated!");
      setIsEditingEvent(false);
      setSelectedEventData(null);
      fetchEvents();
    } else {
      notify.error(result.message);
    }
  } catch (err) {
    notify.error("Update failed");
  } finally {
    setProcessing(false);
  }
};

  // ================= DELETE EVENT =================
 const deleteEvent = async () => {
  if (!window.confirm("Delete this event?")) return;

  setProcessing(true);

  try {
    const res = await fetch(WEB_APP_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "deleteEvent",
        id: selectedEventData.id,
      }),
    });

    const result = await res.json();

    if (result.status === "success") {
      notify.success("Event deleted!");
      setIsEditingEvent(false);
      setSelectedEventData(null);
      fetchEvents();
    } else {
      notify.error(result.message);
    }
  } catch (err) {
    notify.error("Delete failed");
  } finally {
    setProcessing(false);
  }
};

  // ================= UI =================
  return (
    <div className="calendar-container">
        {processing && (
  <div className="loading-overlay">
    <div className="spinner" />
    <p>Processing...</p>
  </div>
)}
     
      <h2>Events Calendar</h2>
<button onClick={exportMonthPDF}>
  Export This Month PDF
</button>
     <FullCalendar
      ref={calendarRef}
  plugins={[dayGridPlugin, interactionPlugin]}
  initialView="dayGridMonth"
  events={events}

  displayEventTime={false}  

  eventClick={(info) => {
    setViewEvent(info.event);

    setSelectedEventData({
      id: info.event.id,
      DATE: info.event.startStr,
      DESCRIPTION: info.event.title,
      LOCATION: info.event.extendedProps.location,
      COLOR: info.event.backgroundColor,
    });

    setIsEditingEvent(false);
  }}

  dateClick={(info) => {
    setNewEvent((prev) => ({
      ...prev,
      DATE: info.dateStr,
    }));
    setShowAdd(true);
  }}
/>

      {/* ================= VIEW EVENT MODAL ================= */}
     {viewEvent && !isEditingEvent && (
  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      zIndex: 1000,
      width: "100%",
      height: "100%",
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <div
      style={{
        background: "var(--card)",
        color: "var(--text)",
        padding: 20,
        borderRadius: 10,
        width: 400,
        border: "1px solid var(--border)",
      }}
    >
      <h3 style={{ color: "var(--text-h)" }}>
        {viewEvent.title}
      </h3>

      <p>
        
        <b>Date:</b> {formatDate(viewEvent.startStr)}
      </p>

        

      <p>
        <b>Location:</b>{" "}
        {viewEvent.extendedProps.location}
      </p>

    

      <div style={{ marginTop: 10 }}>
        
        <button
          style={{ marginLeft: 0 }}
          onClick={() => {
            setIsEditingEvent(true);
            setViewEvent(null);
          }}
        >
          Edit Event
        </button>
         <button onClick={() => setViewEvent(null)}>
          Close
        </button>
      </div>
    </div>
  </div>
)}

      {/* ================= ADD EVENT MODAL ================= */}
      {showAdd && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            zIndex: 1000,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              background: "var(--card)",
              display: "flex",
              flexDirection: "column",
              gap: 10,
              padding: 50,
              borderRadius: 10,
              width: 400,
              color: "var(--text)",
            }}
          >
            <h3>Add Event</h3>
            <label>Date:</label>
            <input
              type="date"
              value={newEvent.DATE}
              onChange={(e) =>
                setNewEvent({ ...newEvent, DATE: e.target.value })
              }
            />
            <label>Event Name:</label>
            <input
              placeholder="Event Name"
              value={newEvent.DESCRIPTION}
              onChange={(e) =>
                setNewEvent({ ...newEvent, DESCRIPTION: e.target.value })
              }
            />

            <label>Location:</label>
            <input
              placeholder="Location"
              value={newEvent.LOCATION}
              onChange={(e) =>
                setNewEvent({ ...newEvent, LOCATION: e.target.value })
              }
            />
                <label>Color:</label>
            <input
              type="color"
              value={newEvent.COLOR}
              onChange={(e) =>
                setNewEvent({ ...newEvent, COLOR: e.target.value })
              }
            />

            <div style={{ marginTop: 10 }}>
              <button onClick={saveEvent}>Save</button>
              <button onClick={() => setShowAdd(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= EDIT EVENT MODAL ================= */}
      {isEditingEvent && selectedEventData && (
        <div
          style={{
            position: "fixed",
            top: 0,
           
            left: 0,
            zIndex: 1000,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              background: "var(--card)",
               display: "flex",
            flexDirection: "column",
            gap: 10,
              padding: 50,
              borderRadius: 10,
              width: 400,
              color: "var(--text)",
            }}
          >
            <h3>Edit Event</h3>
                <label>Date:</label>
            <input
              type="date"
              value={selectedEventData.DATE}
              onChange={(e) =>
                setSelectedEventData({
                  ...selectedEventData,
                  DATE: e.target.value,
                })
              }
            />
            <label>Event Name:</label>
            <input
              value={selectedEventData.DESCRIPTION}
              onChange={(e) =>
                setSelectedEventData({
                  ...selectedEventData,
                  DESCRIPTION: e.target.value,
                })
              }
            />
            <label>Location:</label>
            <input
              value={selectedEventData.LOCATION}
              onChange={(e) =>
                setSelectedEventData({
                  ...selectedEventData,
                  LOCATION: e.target.value,
                })
              }
            />
            <label>Color:</label>
            <input
              type="color"
              value={selectedEventData.COLOR || "#4da6ff"}
              onChange={(e) =>
                setSelectedEventData({
                  ...selectedEventData,
                  COLOR: e.target.value,
                })
              }
            />

            <div style={{ marginTop: 10 }}>
              <button onClick={updateEvent}>Save</button>
              <button onClick={deleteEvent} style={{ marginLeft: 10 }}>
                Delete
              </button>
              <button
                onClick={() => setIsEditingEvent(false)}
                style={{ marginLeft: 10 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
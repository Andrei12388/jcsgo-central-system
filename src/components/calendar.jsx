import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbyYUeoQyNn4fDLNLN-Vmblp63drW7H1tMj-0wqwTpgpCUYY4epi31Wo4j1Pr97xKAlI/exec";

export default function Calendar() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);

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
    const res = await fetch(WEB_APP_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "addEvent",
        data: newEvent,
      }),
    });

    const result = await res.json();

    if (result.status === "success") {
      alert("Event added!");

      setNewEvent({
        DATE: "",
        DESCRIPTION: "",
        LOCATION: "",
        COLOR: "#4da6ff",
      });

      setShowAdd(false);
      fetchEvents();
    } else {
      alert(result.message);
    }
  };

  // ================= UPDATE EVENT =================
  const updateEvent = async () => {
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
      alert("Updated!");
      setIsEditingEvent(false);
      setSelectedEventData(null);
      fetchEvents();
    }
  };

  // ================= DELETE EVENT =================
  const deleteEvent = async () => {
    if (!window.confirm("Delete this event?")) return;

    const res = await fetch(WEB_APP_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "deleteEvent",
        id: selectedEventData.id,
      }),
    });

    const result = await res.json();

    if (result.status === "success") {
      setIsEditingEvent(false);
      setSelectedEventData(null);
      fetchEvents();
    }
  };

  // ================= UI =================
  return (
    <div className="calendar-container">
      <h2>Events Calendar</h2>

     <FullCalendar
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

      <p>
        <b>Description:</b>{" "}
        {viewEvent.extendedProps.description}
      </p>

      <div style={{ marginTop: 10 }}>
        <button onClick={() => setViewEvent(null)}>
          Close
        </button>

        <button
          style={{ marginLeft: 10 }}
          onClick={() => {
            setIsEditingEvent(true);
            setViewEvent(null);
          }}
        >
          Edit Event
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
              padding: 20,
              borderRadius: 10,
              width: 300,
              color: "var(--text)",
            }}
          >
            <h3>Add Event</h3>

            <input
              type="date"
              value={newEvent.DATE}
              onChange={(e) =>
                setNewEvent({ ...newEvent, DATE: e.target.value })
              }
            />

            <input
              placeholder="Description"
              value={newEvent.DESCRIPTION}
              onChange={(e) =>
                setNewEvent({ ...newEvent, DESCRIPTION: e.target.value })
              }
            />

            <input
              placeholder="Location"
              value={newEvent.LOCATION}
              onChange={(e) =>
                setNewEvent({ ...newEvent, LOCATION: e.target.value })
              }
            />

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
              padding: 20,
              borderRadius: 10,
              width: 300,
              color: "var(--text)",
            }}
          >
            <h3>Edit Event</h3>

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

            <input
              value={selectedEventData.DESCRIPTION}
              onChange={(e) =>
                setSelectedEventData({
                  ...selectedEventData,
                  DESCRIPTION: e.target.value,
                })
              }
            />

            <input
              value={selectedEventData.LOCATION}
              onChange={(e) =>
                setSelectedEventData({
                  ...selectedEventData,
                  LOCATION: e.target.value,
                })
              }
            />

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
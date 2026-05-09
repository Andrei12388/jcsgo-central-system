import { useEffect, useState, useRef } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./App.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Calendar from "./components/calendar";

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
const [showForm, setShowForm] = useState(false);
  
  const [pdfFontSize, setPdfFontSize] = useState(8);
const [pdfCellPadding, setPdfCellPadding] = useState(1);
const [actionLoading, setActionLoading] = useState(false);

const [showCalendar, setShowCalendar] = useState(false);

  const [sortKey, setSortKey] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");

  const [theme, setTheme] = useState(() => {
  return localStorage.getItem("theme") || "light";
});

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

  const [form, setForm] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  const WEB_APP_URL =
    "https://script.google.com/macros/s/AKfycbyYUeoQyNn4fDLNLN-Vmblp63drW7H1tMj-0wqwTpgpCUYY4epi31Wo4j1Pr97xKAlI/exec";

  const tableRef = useRef(null);

  // =========================
  // API CALL
  // =========================
  const callAPI = async (payload) => {
    const res = await fetch(WEB_APP_URL, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return res.json();
  };

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

  // =========================
  // FETCH DATA
  // =========================
  const fetchData = () => {
    setLoading(true);

    fetch(WEB_APP_URL)
      .then((res) => res.json())
      .then((res) => {
        const fetched = res.data || [];

        const withIndex = fetched.map((row, i) => ({
          ...row,
          _rowIndex: i + 2,
        }));

        setData(withIndex);

        if (withIndex.length > 0 && !sortKey) {
          setSortKey(Object.keys(withIndex[0])[0]);
        }

        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

 useEffect(() => {
  document.body.className = theme;
  localStorage.setItem("theme", theme);
}, [theme]);

  // =========================
  // HEADERS
  // =========================
  const headers =
    data.length > 0
      ? Object.keys(data[0]).filter((k) => k !== "_rowIndex")
      : [];

      // =========================
// BIRTHDAY THIS WEEK
// =========================
const birthdayKey = headers.find(
  (h) =>
    h.toLowerCase().includes("b. date") ||
    h.toLowerCase().includes("birth")
);
const getUpcomingBirthdays = () => {
  if (!birthdayKey) return [];

  const today = new Date();

  // Monday of current week
  const monday = new Date(today);
  const day = monday.getDay();

  // Adjust so Monday = start
  const diffToMonday = day === 0 ? -6 : 1 - day;
  monday.setDate(monday.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  // Sunday (end of week)
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return data.filter((row) => {
    const birthValue = row[birthdayKey];
    if (!birthValue) return false;

    const birthDate = new Date(birthValue);
    if (isNaN(birthDate)) return false;

    // Use current year
    const currentYearBirthday = new Date(
      today.getFullYear(),
      birthDate.getMonth(),
      birthDate.getDate()
    );

    return (
      currentYearBirthday >= monday &&
      currentYearBirthday <= sunday
    );
  });
};

const upcomingBirthdays = getUpcomingBirthdays();

  // =========================
  // FORM HANDLERS
  // =========================
  const handleChange = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

const resetForm = () => {
  setForm({});
  setIsEditing(false);
  setEditId(null);
  setShowForm(false);
};

  // =========================
  // ADD
  // =========================
 const handleAdd = async () => {
  setActionLoading(true);

  const res = await callAPI({
    action: "add",
    data: form,
  });

  setActionLoading(false);

  if (res.status === "success") {
    toast.success("Member added successfully"); // ✅ FIX
    resetForm();
    fetchData();
  } else {
    toast.error(res.message);
  }
};

  // =========================
  // EDIT START
  // =========================
const startEdit = (row) => {
  const formattedRow = { ...row };

  headers.forEach((key) => {
    if (key.toLowerCase().includes("date") && row[key]) {
      const date = new Date(row[key]);

      if (!isNaN(date)) {
        formattedRow[key] = date.toISOString().split("T")[0];
      }
    }
  });

  setIsEditing(true);
  setEditId(row.id);
  setForm(formattedRow);
  setShowForm(true);
};

  // =========================
  // SAVE EDIT
  // =========================
 const handleEdit = async () => {
  setActionLoading(true);

  const res = await callAPI({
    action: "edit",
    id: editId,
    data: form,
  });

  setActionLoading(false);

  if (res.status === "success") {
    toast.success("Member updated successfully");
    resetForm();
    fetchData();
  } else {
    toast.error(res.message);
  }
};

  // =========================
  // DELETE
  // =========================
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this member?")) return;
    setActionLoading(true);

    const res = await callAPI({
      action: "delete",
      id,
    });

    setActionLoading(false);

   if (res.status === "success") {
  toast.success("Deleted successfully");
  fetchData();
} else {
      alert(res.message);
    }
  };

  // =========================
  // SORT
  // =========================
  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortKey) return 0;

    const valA = a[sortKey];
    const valB = b[sortKey];

    if (!isNaN(valA) && !isNaN(valB)) {
      return sortDirection === "asc" ? valA - valB : valB - valA;
    }

    return sortDirection === "asc"
      ? String(valA).localeCompare(String(valB))
      : String(valB).localeCompare(String(valA));
  });

  // =========================
  // PAGINATION
  // =========================
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedData.slice(
    startIndex,
    startIndex + itemsPerPage
  );
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  // =========================
  // PDF
  // =========================
const generatePdfPreview = () => {
  const doc = new jsPDF("l", "mm", "a4");

  const tableColumn = headers;

const tableRows = sortedData.map((row) =>
  headers.map((key) => {
    const value = row[key] || "";

    if (key.toLowerCase().includes("date")) {
      return formatDate(value);
    }

    return String(value);
  })
);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    styles: {
  fontSize: pdfFontSize,
  cellPadding: pdfCellPadding,
},
    headStyles: {
      fillColor: [7, 17, 65],
      textColor: 255,
    },
  });

  const pdfBlob = doc.output("blob");
  const pdfUrl = URL.createObjectURL(pdfBlob);

  window.open(pdfUrl); // 👈 PREVIEW
};
  
  

  return (
    
    <div style={{ padding: 20 }}>
      <ToastContainer position="bottom-right" autoClose={2000} />
      {actionLoading && (
  <div className="action-toast">
     <div className="spinner" />
    Processing...
  </div>
  
)}
     <div style={{display: "flex", alignItems: "center", gap: 10, justifyItems: "center", justifyContent: "center"}}><img src="logonotitle.png" width={100} height={50}></img> <h1>JCSGO 3PM Master List</h1></div>
      <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
  Switch to {theme === "dark" ? "Light" : "Dark"} Mode
</button>

<button
  onClick={() => setShowCalendar((prev) => !prev)}
  style={{
    marginTop: 10,
    marginBottom: 10,
    padding: "10px 20px",
    cursor: "pointer",
  }}
>
  {showCalendar ? "Hide Calendar" : "Show Calendar"}
</button>

{showCalendar && (
  <div
    style={{
      position: "fixed",
      top: "15px",
      left: "10px",
      width: "97%",
      height: "92vh",
      background: theme === "dark" ? "#222" : "#fff",
      borderRadius: "12px",
      padding: "10px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
      zIndex: 9999,
      overflowX: "hidden",
      overflowY: "auto",
    }}
  >
    <button
  onClick={() => setShowCalendar((prev) => !prev)}
  style={{
    position: "absolute",
    top: 10,
    right: 25,
    marginTop: 10,
    marginBottom: 10,
    padding: "10px 20px",
    cursor: "pointer",
  }}
>
  {showCalendar ? "Close Calendar" : "Show Calendar"}
</button>
    <Calendar />
  </div>
)}

{showForm && (
  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 999,
    }}
  >
    <div
      style={{
        background: theme === "dark" ? "#222" : "#fff",
        color: theme === "dark" ? "#fff" : "#000",
        padding: 20,
        borderRadius: 10,
        width: "400px",
        maxHeight: "90vh",
        overflowY: "auto",
      }}
    >
      <h3>{isEditing ? "Edit Member" : "Add Member"}</h3>

      {headers.map(
        (key) =>
          key !== "id" && (
            <div key={key} style={{ marginBottom: 10 }}>
             <input
  type={key.toLowerCase().includes("date") ? "date" : "text"}
  placeholder={key}
  value={form[key] || ""}
  onChange={(e) => handleChange(key, e.target.value)}
/>
            </div>
          )
      )}

      {!isEditing ? (
        <button onClick={handleAdd}>Add</button>
      ) : (
        <button onClick={handleEdit}>Save</button>
      )}

      <button
        onClick={resetForm}
        style={{ marginLeft: 10 }}
      >
        Cancel
      </button>
    </div>
  </div>
)}

  
      
{/* ================= BIRTHDAY NOTIFICATION ================= */}
{upcomingBirthdays.length > 0 && (
  
  <div
    style={{
      background: "#ffe082",
      padding: "15px",
      borderRadius: "10px",
      marginBottom: "20px",
      marginTop: "20px",
      color: "#000",
      fontWeight: "bold",
    }}
  >
   
    🎂 Birthday This Week (Monday - Sunday) 

    <ul style={{ marginTop: 10 }}>
      {upcomingBirthdays.map((person, index) => (
        <li key={index}>
         {person["First Name"]} {person["Last Name"]} —
          {" "}
          {formatDate(person[birthdayKey])}
        </li>
      ))}
    </ul>
  </div>
)}

<div style={{ display: "flex", alignItems: "center"}}>
    <label>PDF Font Size: {pdfFontSize}</label>
    <input
      type="range"
      min="1"
      max="10"
      value={pdfFontSize}
      onChange={(e) => setPdfFontSize(Number(e.target.value))}
      style={{ marginLeft: "10px" }}
    />
     <button onClick={generatePdfPreview}>Export PDF</button>
  </div>
     

<button
  onClick={() => {
    resetForm();
    setShowForm(true);
  }}
  style={{
    marginTop: 10,
    marginBottom: 20,
    padding: "10px 20px",
    cursor: "pointer",
  }}
>
  Add Member
</button>
   
      <table border="1" cellPadding="8" width="100%" ref={tableRef}>
        <thead>
          <tr>
            <th>#</th>
            {headers.map((key) => (
              <th key={key} onClick={() => handleSort(key)}>
                {key}
              </th>
            ))}
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {paginatedData.map((row, i) => (
            <tr key={i}>
              <td>{startIndex + i + 1}</td>

              {headers.map((key) => (
              <td key={key}>
  {key.toLowerCase().includes("date")
    ? formatDate(row[key])
    : row[key]}
</td>
              ))}

              <td>
                <button onClick={() => startEdit(row)}>Edit</button>
                <button onClick={() => handleDelete(row.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ================= PAGINATION ================= */}
      <div style={{ marginTop: 10 }}>
        <button
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
        >
          Prev
        </button>

        <span>
          {" "}
          Page {currentPage} of {totalPages}{" "}
        </span>

        <button
          onClick={() =>
            setCurrentPage((p) => Math.min(p + 1, totalPages))
          }
        >
          Next
        </button>

          <select
          value={currentPage}
          onChange={(e) => setCurrentPage(Number(e.target.value))}
        >
          {Array.from({ length: totalPages }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              Page {i + 1}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default App;
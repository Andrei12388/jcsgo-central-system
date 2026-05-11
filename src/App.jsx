import { useEffect, useState, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import autoTable from "jspdf-autotable";
import "./App.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Calendar from "./components/calendar";
import { useNotification } from "./components/notificationToast";
import StatsBarGraph from "./components/StatsBarGraph";

function App() {
  const { notify } = useNotification();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
const [showForm, setShowForm] = useState(false);
const [searchTerm, setSearchTerm] = useState("");
const [showStats, setShowStats] = useState(false);
  
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

  const STATUS_OPTIONS = [
  "1st Timer",
  "2nd Timer",
  "3rd Timer",
  "3rd Timer",
  "4th Timer",
  "Regular/Active",
];

const CELEBRATION_OPTIONS = ["8am Central", "10:30am Central", "3pm Central"];

const [loggedIn, setLoggedIn] = useState(false);
const [loginUser, setLoginUser] = useState("");
const [loginPass, setLoginPass] = useState("");
const [loginError, setLoginError] = useState("");

const [selectedCelebration, setSelectedCelebration] = useState("");
const [selectedTitle, setSelectedTitle] = useState("");
const [hasLandingSelection, setHasLandingSelection] = useState(false);

const LANDING_OPTIONS = [
  { label: "8AM", celebration: "8am Central", title: "8AM Celebration" },
  { label: "10:30AM", celebration: "10:30am Central", title: "10:30AM Celebration" },
  { label: "3PM", celebration: "3pm Central", title: "3PM Celebration" },
];

const CATEGORY_OPTIONS = ["Men", "Women", "Young Boys", "Young Girls"];

const MARITAL_OPTIONS = ["Single", "Married", "Divorced", "Widowed"];

const MINISTRY_OPTIONS = ["Music", "Dance", "Program", "MultiMedia"];

  const WEB_APP_URL =
    "https://script.google.com/macros/s/AKfycbxOGv2Dz4LF8g2HodyKYvtE7lJ_6tkIPZKVEL4QUYfNhYk7GwucSUTKuANHooKwtyrO/exec";

  const tableRef = useRef(null);
  const statsRef = useRef(null);

  // =========================
  // API CALL
  // =========================
  const callAPI = async (payload) => {
    if (selectedCelebration && payload.action !== "landingSelection") {
      payload.time = selectedCelebration;
    }

    const res = await fetch(WEB_APP_URL, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return res.json();
  };

  const handleLandingSelect = async (option) => {
    setSelectedCelebration(option.celebration);
    setSelectedTitle(option.title);

    try {
      await callAPI({
        action: "landingSelection",
        celebration: option.celebration,
        title: option.title,
      });
    } catch (error) {
      console.error("Landing selection error", error);
    } finally {
      setHasLandingSelection(true);
    }
  };

  const handleLogin = (event) => {
    event.preventDefault();

    const AUTH_USER = "admin";
    const AUTH_PASS = "12345";

    if (loginUser === AUTH_USER && loginPass === AUTH_PASS) {
      setLoggedIn(true);
      setLoginError("");
      setLoginUser("");
      setLoginPass("");
      setHasLandingSelection(false);
    } else {
      setLoginError("Invalid username or password.");
    }
  };

  const goToSelection = () => {
    setHasLandingSelection(false);
    setSelectedCelebration("");
    setSelectedTitle("");
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

    const url = selectedCelebration
      ? `${WEB_APP_URL}?time=${encodeURIComponent(selectedCelebration)}`
      : WEB_APP_URL;

    fetch(url)
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
    if (hasLandingSelection) {
      fetchData();
    }
  }, [hasLandingSelection, selectedCelebration]);

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

  const convertImageToBase64 = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // resize
        const SIZE = 400;

        canvas.width = SIZE;
        canvas.height = SIZE;

        ctx.drawImage(img, 0, 0, SIZE, SIZE);

        // compress image
        const compressed = canvas.toDataURL(
          "image/jpeg",
          0.3
        );

        resolve(compressed);
      };

      img.src = event.target.result;
    };

    reader.readAsDataURL(file);
  });
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
    notify.success("Member added successfully"); // ✅ FIX
    resetForm();
    fetchData();
  } else {
    notify.error(res.message);
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
    notify.success("Member updated successfully");
    resetForm();
    fetchData();
  } else {
    notify.error(res.message);
  }
};

const getCurrentDate = () => {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
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
  notify.success("Deleted successfully");
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

  const filteredData = data.filter((row) => {
  return headers.some((key) => {
    const value = row[key];

    if (!value) return false;

    return String(value)
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
  });
});

const sortedData = [...filteredData].sort((a, b) => {
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

 const exportStatsPDF = async () => {
  const input = statsRef.current;

  if (!input) return;

  // capture dashboard
  const canvas = await html2canvas(input, {
    scale: 2,
  });

  const imgData = canvas.toDataURL("image/png");

  // create pdf
  const pdf = new jsPDF("p", "mm", "a4");

  // =========================
  // IMAGE SIZE
  // =========================
  const pdfWidth =
    pdf.internal.pageSize.getWidth();

  const pdfHeight =
    (canvas.height * pdfWidth) / canvas.width;

  // =========================
  // ADD DASHBOARD IMAGE
  // =========================
  pdf.addImage(
    imgData,
    "PNG",
    0,
    0,
    pdfWidth,
    pdfHeight
  );

  // =========================
  // PREVIEW AS BLOB
  // =========================
  const pdfBlob = pdf.output("blob");

  const url = URL.createObjectURL(pdfBlob);

  window.open(url);
};

  // =========================
  // PDF
  // =========================
const generatePdfPreview = () => {
  const doc = new jsPDF("l", "mm", "a4");

   const pdfHeaders = headers.filter(
    (key) => key.toLowerCase() !== "image"
  );

  const tableColumn = pdfHeaders;

const tableRows = sortedData.map((row) =>
  pdfHeaders.map((key) => {
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

const FIELD_LABELS = {
  "first name": "First Name",
  "last name": "Last Name",
  "middle name": "Middle Name",

  address: "Address",
  "home address": "Home Address",
  "present address": "Present Address",

  age: "Age",
  gender: "Gender",
  birthdate: "Birth Date",
  "b. date": "Birth Date",

  status: "Status",
  "marital status": "Marital Status",
  category: "Category",
  celebration: "Celebration Time",
  ministry: "Ministry",

  contact: "Contact Number",
  "phone number": "Phone Number",
  email: "Email Address",
};

const normalizeKey = (key) =>
  key
    .toLowerCase()
    .replace(/[_-]/g, " ")
    .trim();

const getLabel = (key) => {
  return FIELD_LABELS[normalizeKey(key)] || key;
};
  
 const getSelectOptions = (key) => {
  const k = key.trim().toLowerCase();

  switch (k) {
    case "status":
      return STATUS_OPTIONS;

    case "celebration":
      return CELEBRATION_OPTIONS;

    case "category":
      return CATEGORY_OPTIONS;

    case "marital status":
      return MARITAL_OPTIONS;

    case "ministry":
      return MINISTRY_OPTIONS;

          default:
      return null;
  }
};

  if (!loggedIn) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          padding: 20,
          textAlign: "center",
        }}
      >
        <img
          src="logonotitle.png"
          alt="Logo"
          width={140}
          height={70}
          style={{ objectFit: "contain" }}
        />
        <div>
          <h1 style={{ margin: 0 }}>JCSGO CENTRAL Login</h1>
          <p style={{ margin: 0, opacity: 0.75 }}>
            Enter your username and password to continue.
          </p>
        </div>
        <form
          onSubmit={handleLogin}
          style={{ display: "flex", flexDirection: "column", gap: 12, width: 300 }}
        >
          <input
            type="text"
            value={loginUser}
            onChange={(e) => setLoginUser(e.target.value)}
            placeholder="Username"
            style={{ padding: 12, borderRadius: 8, border: "1px solid #ccc" }}
          />
          <input
            type="password"
            value={loginPass}
            onChange={(e) => setLoginPass(e.target.value)}
            placeholder="Password"
            style={{ padding: 12, borderRadius: 8, border: "1px solid #ccc" }}
          />
          {loginError && (
            <div style={{ color: "#b00020", fontWeight: 700 }}>{loginError}</div>
          )}
          <button
            type="submit"
            style={{
              padding: "12px 20px",
              borderRadius: 10,
              border: "none",
              background: "#071141",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            Login
          </button>
        </form>
      </div>
    );
  }

  if (!hasLandingSelection) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          padding: 20,
          textAlign: "center",
        }}
      >
        <img
          src="logonotitle.png"
          alt="Logo"
          width={140}
          height={70}
          style={{ objectFit: "contain" }}
        />
        <div>
          <h1 style={{ margin: 0 }}>JCSGO CENTRAL</h1>
          <p style={{ margin: 0, opacity: 0.75 }}>
            Select your celebration time below
          </p>
        </div>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
          {LANDING_OPTIONS.map((option) => (
            <button
              key={option.label}
              onClick={() => handleLandingSelect(option)}
              style={{
                minWidth: 140,
                padding: "16px 20px",
                borderRadius: 12,
                border: "1px solid #071141",
                background: "#071141",
                color: "#fff",
                cursor: "pointer",
                fontSize: 16,
                fontWeight: 700,
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    
    <div style={{ padding: 20 }}>
  
      {actionLoading && (
  <div className="action-toast">
     <div className="spinner" />
    Processing...
  </div>
  
)}
     <div style={{display: "flex", alignItems: "center", gap: 10, justifyItems: "center", justifyContent: "center"}}>
        <img src="logonotitle.png" width={100} height={50} alt="Logo" />
        <div>
          <h1 style={{ margin: 0 }}>{selectedTitle || "JCSGO 3PM System"}</h1>
        
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
        <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}> 
          Switch to {theme === "dark" ? "Light" : "Dark"} Mode
        </button>
        <button
          onClick={goToSelection}
          style={{ padding: "10px 20px", cursor: "pointer" }}
        >
          Back to Selection
        </button>
      </div>

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
<button
  onClick={() => setShowStats((prev) => !prev)}
  style={{
    marginTop: 10,
    marginBottom: 10,
    padding: "10px 20px",
    cursor: "pointer",
  }}
>
  {showStats ? "Hide Statistics" : "Show Statistics"}
</button>

{showStats && (
  <div
    style={{
      position: "fixed",
      top: "15px",
      left: "10px",
      width: "97%",
      height: "92vh",
      background: theme === "dark" ? "#222" : "#fff",
      borderRadius: "12px",
      padding: "20px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
      zIndex: 1000,
      overflowY: "auto",
    }}
  >
    <button
      onClick={() => setShowStats(false)}
      style={{
        position: "absolute",
        top: 10,
        right: 25,
        padding: "10px 20px",
        cursor: "pointer",
      }}
    >
      Close Statistics
    </button>

    <button
      onClick={exportStatsPDF}
      style={{
        marginBottom: 20,
        padding: "10px 20px",
      }}
    >
      Export Statistics PDF
    </button>

    <div ref={statsRef}>
     <div style={{display: "flex", alignItems: "center", gap: 10, justifyItems: "center", justifyContent: "center"}}><img src="logonotitle.png" width={100} height={50}></img>  <h1 style={{ margin: 0 }}>{selectedTitle || "JCSGO 3PM System"}</h1></div>
      <p
  style={{
    marginBottom: 20,
    fontSize: 16,
    opacity: 0.8,
  }}
>
  Current Date: {getCurrentDate()}
</p>

      {/* TOTAL MEMBERS */}
      <div
        style={{
          background: "#071141",
          color: "#fff",
          padding: 10,
          borderRadius: 10,
          marginBottom: 20,
          textAlign: "center",
          fontSize: 20,
          fontWeight: "bold",
        }}
      >
        Total Members: {data.length}
      </div>

      {/* GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
        }}
      >
        <StatsBarGraph
          data={data}
          field="Status"
          title="Status Count"
        />

        <StatsBarGraph
          data={data}
          field="Ministry"
          title="Ministry Count"
        />

        <StatsBarGraph
          data={data}
          field="Category"
          title="Category Count"
        />

        <StatsBarGraph
          data={data}
          field="Marital Status"
          title="Marital Status Count"
        />
      </div>
    </div>
  </div>
)}

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
      zIndex: 1000,
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
     <Calendar selectedTime={selectedCelebration} />
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
        padding: 50,
        borderRadius: 10,
        width: "400px",
        overflowX: "hidden",
        justifyContent: "center",
        alignItems: "center",
        maxHeight: "90vh",
        overflowY: "auto",
      }}
    >
      <h3 style={{textAlign: "center"}}>{isEditing ? "Edit Member" : "Add Member"}</h3>
<div style={{display: "flex", flexDirection: "column", }}>
     {headers.map(
  (key) =>
    key !== "id" && (
      <div key={key} style={{ marginBottom: 10 }}>
        <label style={{ display: "block", marginBottom: 5, fontWeight: 600 }}>
  {getLabel(key)}
</label>
        {getSelectOptions(key) ? (
          <select
            value={form[key] || ""}
            onChange={(e) => handleChange(key, e.target.value)}
          >
            <option value="">Select {key}</option>
            {getSelectOptions(key).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        ) : (
          key.toLowerCase() === "image" ? (
  <div>
     {form[key] && (
      <div style={{
        display: "flex",
        flexDirection: "column",
        marginBottom: 10,
        justifyItems: "center",
        alignItems: "center",
      }}>
      <img
        src={form[key]}
        alt="preview"
        style={{

          width: 100,
          height: 100,
          objectFit: "cover",
          marginTop: 10,
          borderRadius: 8,
        }}
      />
      </div>
    )}
    <input
      type="file"
      accept="image/*"
      onChange={async (e) => {
        const file = e.target.files[0];

        if (!file) return;

        const base64 = await convertImageToBase64(file);

        handleChange(key, base64);
      }}
    />
  </div>
) : (
  <input
    type={
      key.toLowerCase().includes("date")
        ? "date"
        : "text"
    }
    placeholder={key}
    value={form[key] || ""}
    onChange={(e) =>
      handleChange(key, e.target.value)
    }
  />
)
        )}
      </div>
    )
)}
      
      <div>
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
    </div>
  </div>
)}

  
      
{/* ================= BIRTHDAY NOTIFICATION ================= */}
{upcomingBirthdays.length > 0 && (
 <div
  style={{
    width: "100%",
    boxSizing: "border-box",
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
     <button onClick={generatePdfPreview}>Export Members PDF</button>
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
<input
    type="text"
    placeholder="Search member..."
    value={searchTerm}
    onChange={(e) => {
      setSearchTerm(e.target.value);
      setCurrentPage(1);
    }}
    style={{
      marginLeft: "10px",
      padding: "10px",
      width: "300px",
      borderRadius: "8px",
      border: "1px solid #ccc",
    }}
  />

  {/* ================= PAGINATION ================= */}
      <div style={{ marginBottom: 10 }}>
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
  {key.toLowerCase() === "image" ? (
    row[key] ? (
      <img
        src={row[key]}
        alt="member"
        style={{
          width: 60,
          height: 60,
          objectFit: "cover",
          borderRadius: 8,
        }}
      />
    ) : (
      "No Image"
    )
  ) : key.toLowerCase().includes("date") ? (
    formatDate(row[key])
  ) : (
    row[key]
  )}
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
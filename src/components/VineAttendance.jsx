import React, { useEffect, useState } from "react";
import jsPDF from "jspdf";
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import autoTable from "jspdf-autotable";

import { generateVineWeeklyReport } from "./report/weeklyReport";
import { generateCentralMonthlyReport } from "./report/monthlyReport";
import { generateVineYearlyReport } from "./report/yearlyReport";
import { getSelectedWeekSunday } from "./report/weeklyReport";
import LoadingSpinner from "./ui/LoadingSpinner";

export default function VineAttendance({ webAppUrl, time, notify }) {
  const MONTHS = [
    "JANUARY",
    "FEBRUARY",
    "MARCH",
    "APRIL",
    "MAY",
    "JUNE",
    "JULY",
    "AUGUST",
    "SEPTEMBER",
    "OCTOBER",
    "NOVEMBER",
    "DECEMBER"
  ];

  const timerFields = [
  "1ST_TIMER",
  "2ND_TIMER",
  "3RD_TIMER",
  "4TH_TIMER",
  "5TH_TIMER"
];

const weekOptions = [
  "WEEK1",
  "WEEK2",
  "WEEK3",
  "WEEK4",
  "WEEK5"
];

const powerfilledBaptismFields = [
  "POWER_FILLED",
  "WATER_BAPTISM"
];

const STATUS_OPTIONS = [
  '1st Timer',
  '2nd Timer',
  '3rd Timer',
  '4th Timer',
  'Regular/Active',
]

const CATEGORY_OPTIONS = ['Men', 'Women', 'Young Boys', 'Young Girls']
const MARITAL_OPTIONS = ['Single', 'Married', 'Divorced', 'Widowed']
const MINISTRY_OPTIONS = ['Music', 'Dance', 'Program', 'MultiMedia']

// VineAttendance
const [showForm, setShowForm] = useState(false)
const [showQueryModal, setShowQueryModal] = useState(false);
 const [members, setMembers] = useState([]);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')
  const [actionLoading, setActionLoading] = useState(false)
  const [loading, setLoading] = useState(true)
const [form, setForm] = useState({
  last_name: "",
  first_name: "",
  contac: "",
  bday: "",
  address: "",
  status: "",
  celebration: "",
  category: "",
  marital_status: "",
  wedding_anniv: "",
  ministry: "",
  cg_leader: "",
});
  const [data, setData] = useState([])
   const [membersQuery, setMembersQuery] = useState([]);
  const [discipleSearch, setDiscipleSearch] = useState('')
    const [leaderSearch, setLeaderSearch] = useState('')
    const [searchParams] = useSearchParams()
    const selectedCelebration = searchParams.get('time') || ''
   const [isEditing, setIsEditing] = useState(false)
    const [editId, setEditId] = useState(null)
    const resetForm = () => {
    setForm({})
    setIsEditing(false)
    setEditId(null)
    setDiscipleSearch('')
    setLeaderSearch('')
    setShowForm(false)
  }

    const callAPI = async (payload) => {
    if (selectedCelebration && payload.action !== 'landingSelection') {
      payload.time = selectedCelebration
    }

    const res = await fetch(webAppUrl, {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    return res.json()
  }

   
const fetchData = async () => {
    setLoading(true)
  try {
    const response = await fetch(
      `${webAppUrl}?action=getMembersQuery`
    );

    const result = await response.json();

    if (result.status === "success") {
      setMembersQuery(result.data);
      setLoading(false)
    } else {
      setLoading(false)
      notify.error(result.message);
    }
  } catch (err) {
    setLoading(false)
    notify.error(err.message);
  }
};
  
  

const handleChange = (e) => {
  const { name, value } = e.target;

  setForm((prev) => ({
    ...prev,
    [name]: value,
  }));
};

 const headers =
  membersQuery.length > 0
    ? Object.keys(membersQuery[0]).filter(k => k !== "_rowIndex")
    : [];
  // replicate the webAppUrl used in App.jsx
  

  const { search } = useLocation();
  const params = new URLSearchParams(search);
 // const time = params.get("time") || "";
 // const { notify } = useNotification();

   useEffect(() => {
      document.body.className = theme
      localStorage.setItem('theme', theme)
    }, [theme])

    useEffect(() => {
    fetchData();
}, []);

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


//VineAttendance

  const [allData, setAllData] = useState([]);
  const [vines, setVines] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[new Date().getMonth()]);
  const [selectedVine, setSelectedVine] = useState("");


  const [weekColumns, setWeekColumns] = useState([]);

  const [originalData, setOriginalData] = useState({});
  const [dirtyRows, setDirtyRows] = useState({});
  const [selectedWeek, setSelectedWeek] = useState("WEEK1");
  const [yearlyLoading, setYearlyLoading] = useState(false);

  const ITEMS_PER_PAGE = 10;
const [currentPage, setCurrentPage] = useState(1);
const [searchMember, setSearchMember] = useState("");

  const [editBuffer, setEditBuffer] = useState({});
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [newMemberForm, setNewMemberForm] = useState({ first_name: "", last_name: "", v_id: "" });



  useEffect(() => {
  setCurrentPage(1);
}, [selectedVine, selectedMonth]);


const getDiff = (id, updates) => {
  const original = originalData[id] || {};
  const diff = {};

  Object.keys(updates).forEach((key) => {
    if (updates[key] !== original[key]) {
      diff[key] = updates[key];
    }
  });

  return diff;
};

  useEffect(() => {
  let isMounted = true;

  (async () => {
    setLoading(true); // 👈 start loading immediately on month change

    try {
      const data = await fetchAll();

      if (!isMounted) return;

      setAllData(data);

      const vineRows = data.filter((r) => {
        const val = r.is_vine;
        return (
          val === true ||
          val === 1 ||
          String(val).toLowerCase() === "true" ||
          String(val).toLowerCase() === "yes" ||
          String(val).toLowerCase() === "1"
        );
      });

      const uniqMap = new Map();

      vineRows.forEach((v) => {
        const id = String(v.v_id || "").trim();
        if (!id) return;

        if (!uniqMap.has(id)) {
          uniqMap.set(id, {
            id,
            name: `${v.first_name || ""} ${v.last_name || ""}`.trim() || `#${id}`
          });
        }
      });

      setVines(Array.from(uniqMap.values()));

    } catch (err) {
      console.error(err);
      setVines([]);
    } finally {
      if (isMounted) setLoading(false); // 👈 stop loading
    }
  })();

  return () => {
    isMounted = false;
  };
}, [webAppUrl, time, selectedMonth]);

  const handleSelect = (e) => {
    const id = e.target.value;
    setSelectedVine(id);
  };

   useEffect(() => {
    document.body.className = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!selectedVine) {
      setMembers([]);
      setWeekColumns([]);
      setOriginalData({});
      setDirtyRows({});
      setEditBuffer({});
      return;
    }

    const rows = allData.filter((r) => String(r.v_id || "").trim() === String(selectedVine).trim());

    if (!rows.length) {
      setMembers([]);
      setWeekColumns([]);
      return;
    }

    const rawKeys = Object.keys(rows[0]).map(k => String(k).trim());
    const weekCols = rawKeys.filter((k) => /^WEEK/i.test(k.replace(/\s+/g, "")));

    setWeekColumns(weekCols);
    setMembers(rows);

    const originalMap = {};
    rows.forEach((r) => {
      originalMap[r.id] = { ...r };
    });

    setOriginalData(originalMap);
    setDirtyRows({});
    setEditBuffer({});
  }, [selectedVine, allData]);

  const isChecked = (val) =>
    val === true ||
    val === 1 ||
    val === "1" ||
    String(val).toLowerCase() === "true" ||
    String(val).toLowerCase() === "yes";

  // Separate caregroup weeks from Sunday attendance weeks
  const careGroupWeeks = weekColumns.filter((wk) => /^WEEK_/i.test(wk));
  const sundayWeeks = weekColumns.filter((wk) => /^WEEK\d+$/i.test(wk));

  // =========================
  // 🔥 BUFFER HANDLER
  // =========================

    const selectedVineData = vines.find(
  vine => vine.id === String(selectedVine)
);

const formatDate = (date) => {
  if (!date) return "";

  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};


const handleAdd = async () => {
  setSaving(true)
  try {
   const dataToSend = {
  ...form,
  cg_leader: selectedVineData?.name || "",
};

const res = await fetch(webAppUrl, {
  method: "POST",
  body: JSON.stringify({
    action: "addQuery",
    data: dataToSend,
  }),
});

    const result = await res.json();

    if (result.status === "success") {
      notify.success("Member added successfully!");
     
      setForm({
        last_name: "",
        first_name: "",
        contac: "",
        bday: "",
        address: "",
        status: "",
        celebration: "3PM CENTRAL",
        category: "",
        marital_status: "",
        wedding_anniv: "",
        ministry: "",
        cg_leader: selectedVineData?.name || "None",
      });
      setSaving(false)
      setShowForm(false);
    } else {
      setSaving(false)
      notify.error(result.message);
    }
  } catch (err) {
    setSaving(false)
    notify.error(err.message);
  } finally {
     await fetchData();
  }
};

const updateBuffer = (memberId, field, value) => {
  setEditBuffer((prev) => {
    const updated = {
      ...prev,
      [memberId]: {
        ...(prev[memberId] || {}),
        [field]: value
      }
    };

    // mark row as dirty
    setDirtyRows((d) => ({
      ...d,
      [memberId]: true
    }));

    return updated;
  });
};

  // =========================
  // 🚀 BATCH SAVE (NEW)
  // =========================

 const saveAllChanges = async () => {
  if (!Object.keys(editBuffer).length) return;

  setSaving(true);

  try {
    const optimizedUpdates = {};

    Object.keys(editBuffer).forEach((id) => {
      const diff = getDiff(id, editBuffer[id]);

      if (Object.keys(diff).length > 0) {
        optimizedUpdates[id] = diff;
      }
    });

    await fetch(webAppUrl, {
      method: "POST",
      body: JSON.stringify({
        action: "batchEdit",
        month: selectedMonth,
        updates: optimizedUpdates
      })
    });

    const refreshed = await fetchAll();
    setAllData(refreshed);
    setEditBuffer({});
    setDirtyRows({});
    notify?.success("Changes saved successfully");
  } catch (err) {
    console.error(err);
    notify?.error("Failed to save changes");
  } finally {
    setSaving(false);
  }
};

  const deleteMember = async (memberId, memberName) => {
  if (!window.confirm(`Are you sure you want to delete ${memberName}?`)) {
    return;
  }

  setSaving(true);
  try {
    await fetch(webAppUrl, {
      method: "POST",
      body: JSON.stringify({
        action: "delete",
        id: memberId
      })
    });

    const refreshed = await fetchAll();
    setAllData(refreshed);
    notify?.success("Member deleted successfully");
  } catch (err) {
    console.error(err);
    notify?.error("Error deleting member");
  } finally {
    setSaving(false);
    setShowDeleteConfirm(null);
  }
};

  const addMember = async () => {
    if (!newMemberForm.first_name.trim()) {
      alert("Please enter at least a first name");
      return;
    }

    setSaving(true);
    try {
      await fetch(webAppUrl, {
        method: "POST",
        body: JSON.stringify({
          action: "add",
          month: selectedMonth,
          data: {
            v_id: selectedVine,
            first_name: newMemberForm.first_name,
            last_name: newMemberForm.last_name
          }
        })
      });

      setNewMemberForm({ first_name: "", last_name: "", v_id: "" });
      const refreshed = await fetchAll();
      setAllData(refreshed);
      notify?.success("Member added successfully");
    } catch (err) {
      console.error(err);
      notify?.error("Error adding member");
    } finally {
      setSaving(false);
    }
  };

  const fetchAll = async () => {
    const url =
      `${webAppUrl}?action=getAll${
        time ? `&time=${encodeURIComponent(time)}` : ""
      }&month=${encodeURIComponent(selectedMonth)}`;

    const res = await fetch(url);
    const json = await res.json();
    return json.data || [];
  };

  //Weekly Date Calculation
  const reportDateW1 = getSelectedWeekSunday(selectedMonth, 'WEEK1');
  const reportDateW2 = getSelectedWeekSunday(selectedMonth, 'WEEK2');
  const reportDateW3 = getSelectedWeekSunday(selectedMonth, 'WEEK3');
  const reportDateW4 = getSelectedWeekSunday(selectedMonth, 'WEEK4');
  const reportDateW5 = getSelectedWeekSunday(selectedMonth, 'WEEK5');

  const reportDates = {
  WEEK1: reportDateW1,
  WEEK2: reportDateW2,
  WEEK3: reportDateW3,
  WEEK4: reportDateW4,
  WEEK5: reportDateW5,
};

  // PAGINATION
// SEARCH FILTER
const filteredMembers = members.filter((member) => {
  const fullName =
    `${member.first_name || ""} ${member.last_name || ""}`.toLowerCase();

  return (
    fullName.includes(searchMember.toLowerCase()) ||
    String(member.id || "")
      .toLowerCase()
      .includes(searchMember.toLowerCase())
  );
});

// PAGINATION
const totalPages = Math.ceil(filteredMembers.length / ITEMS_PER_PAGE);

const paginatedMembers = filteredMembers.slice(
  (currentPage - 1) * ITEMS_PER_PAGE,
  currentPage * ITEMS_PER_PAGE
);

console.log(vines)

  return (
    <div className="vine-attendance" style={{ padding: 12,  borderRadius: 8 }}>
      {saving && (
        <div className="action-toast">
          <div className="spinner" />
          Saving...
        </div>
      )}

       {/* {loading && (
  <div className="loading-overlay">
    <div className="spinner" />
    <p>Processing...</p>
  </div>
)}
       */}
      <div className="vine-attendance__header">
       
      
     <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyItems: "center", gap: 4, border:  theme === "dark" ? "1px solid #374151" : "1px solid #d1d5db", padding: 6, borderRadius: 4 }}>
 <button
  onClick={() =>
    generateVineWeeklyReport({
      members,
      selectedVine,
      vines,
      weekColumns,
      selectedMonth,
      selectedWeek,
      notify,
    })
  }
  disabled={!selectedVine || members.length === 0}
  style={{
    background: "#071141",
    color: "#fff",
    padding: "8px 14px",
    borderRadius: 6,
    cursor: !selectedVine ? "not-allowed" : "pointer",
    marginLeft: 8,
  }}
>
  Generate Weekly Report
</button>
<select
  value={selectedWeek}
  onChange={(e) => setSelectedWeek(e.target.value)}
  style={{ padding: "6px", borderRadius: 4, maxWidth: 200, marginLeft: 8 }}
>
  <option value="WEEK1">{reportDateW1}</option>
  <option value="WEEK2">{reportDateW2}</option>
  <option value="WEEK3">{reportDateW3}</option>
  <option value="WEEK4">{reportDateW4}</option>
  <option value="WEEK5">{reportDateW5}</option>
</select>
</div>
     <button
  onClick={() =>
    generateCentralMonthlyReport({
      allData,   // 🔥 IMPORTANT: not members
      vines,
      selectedMonth,
    })
  }
>
  Generate Central Monthly Report
</button>

      
<button
  onClick={async () => {
    try {
      setYearlyLoading(true);

      await generateVineYearlyReport({
        webAppUrl,
        vines,
      });

      notify?.success("Yearly report generated");
    } catch (err) {
      console.error(err);
      notify?.error("Failed to generate yearly report");
    } finally {
      setYearlyLoading(false);
    }
  }}
  disabled={yearlyLoading || loading}
  style={{
    background: yearlyLoading ? "#555" : "#0f766e",
    color: "#fff",
    padding: "8px 14px",
    borderRadius: 6,
    cursor:
       yearlyLoading ? "not-allowed" : "pointer",
    marginLeft: 8,
  }}
>
  {yearlyLoading ? "Generating Yearly Report..." : "Generate Yearly Report"}
</button>

          <button
  onClick={() => setShowQueryModal(true)}
  style={{
    padding: "10px 20px",
    fontWeight: "bold",
    marginLeft: 10,
  }}
>
  Open Member Query
</button>
      </div>
       

      {/* MONTH BUTTONS */}
      <div className="vine-attendance__month-buttons" style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
        {MONTHS.map((month) => (
          <button
            key={month}
            type="button"
            onClick={() => {
              setSelectedMonth(month);
              setSelectedVine("");
              setMembers([]);
              setWeekColumns([]);
              setEditBuffer({});
            }}
            style={{
              padding: "6px 10px",
              borderRadius: 4,
              border: month === selectedMonth ? "2px solid #2563eb" : "1px solid #d1d5db",
             
              cursor: "pointer"
            }}
          >
            {month}
          </button>
        ))}
      </div>
  <div style={{ display: 'flex',  flexWrap: 'wrap', borderBottom: '10px solid var(--border)', marginBottom: 20, paddingBottom: 10, gap: 12 }}>
        </div>
      {/* CONTROLS */}
      <div className="vine-attendance__controls" style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <select value={selectedVine} onChange={handleSelect} disabled={loading}>
          <option value="">
            {loading ? "-- Loading vines --" : "-- Select Vine --"}
          </option>
          {vines.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name} (ID: {v.id})
            </option>
          ))}
        </select>
        
      </div>

      {/* LOADING SPINNER */}
      {loading && (
        <LoadingSpinner title="Loading Attendance Data" />
      )}

      {showQueryModal && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 9980,
    }}
  >
    <div
      style={{
        width: "90%",
        maxWidth: 1200,
        maxHeight: "85vh",
        overflow: "auto",
        background: theme === "dark" ? "#111827" : "#fff",
        color: theme === "dark" ? "#fff" : "#111",
        borderRadius: 10,
        padding: 20,
        boxShadow: "0 10px 30px rgba(0,0,0,.3)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 15,
        }}
      >
        <h2 style={{ margin: 0, fontWeight: 'bold' }}>Member Query</h2>
       

        <button onClick={() => setShowQueryModal(false)}>
          ✕
        </button>
      </div>
       <button disabled={!selectedVine || members.length === 0} onClick={() => { resetForm(); setShowForm(true) }} style={{ padding: '10px 20px', cursor: !selectedVine ? "not-allowed" : "pointer", fontWeight: 'bold', marginBottom: 8 }} >
            Add Member Details on System Query
          </button>

      <input
        type="text"
        placeholder="Search member..."
        value={discipleSearch}
        onChange={(e) => setDiscipleSearch(e.target.value)}
        style={{
          width: "100%",
          padding: 10,
          marginBottom: 15,
          borderRadius: 6,
        }}
      />
<div
  style={{
    overflowX: "auto",
    maxHeight: "70vh",
    overflowY: "auto",
  }}
>
      <table
  style={{
    width: "100%",
    borderCollapse: "collapse",
  }}
>
  <thead>
    <tr>
      <th>#</th>
      <th>Last Name</th>
      <th>First Name</th>
      <th>Contact</th>
      <th>Birth Date</th>
      <th>Address</th>
      <th>Status</th>
      <th>Celebration</th>
      <th>Category</th>
      <th>Marital Status</th>
      <th>Wedding Anniversary</th>
      <th>Ministry</th>
      <th>CG Leader</th>
     
    </tr>
  </thead>

  <tbody>
    {membersQuery
      .filter((m) => {
        const search =
          `${m.last_name} ${m.first_name}`.toLowerCase();

        return search.includes(discipleSearch.toLowerCase());
      })
      .map((m) => (
        <tr key={m.id}>
          <td>{m.id}</td>
          <td>{m.last_name}</td>
          <td>{m.first_name}</td>
          <td>{m.contac}</td>
           <td>{formatDate(m.bday)}</td>
          <td>{m.address}</td>
          <td>{m.status}</td>
          <td>{m.celebration}</td>
          <td>{m.category}</td>
          <td>{m.marital_status}</td>
<td>{formatDate(m.wedding_anniv)}</td>
          <td>{m.ministry}</td>
          <td>{m.cg_leader}</td>

        </tr>
      ))}
  </tbody>
</table>
</div>
    </div>
  </div>
)}

         {showForm && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 9990,
    }}
  >
    <div
      className="animationCard"
      style={{
        background: "var(--card)",
        color: "var(--text)",
        padding: 30,
        width: 500,
        maxHeight: "90vh",
        overflowY: "auto",
        borderRadius: 10,
      }}
    >
      <h2 style={{ textAlign: "center", fontWeight: 'bold', marginBottom: 8 }}>Add Member</h2>
      

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

        <div>
      <label style={{ display: "block", marginBottom: 5, fontWeight: 600 }}>
        Last Name
      </label>
      <input
        name="last_name"
        value={form.last_name}
        onChange={handleChange}
        placeholder="Enter last name"
      />
    </div>

    <div>
      <label style={{ display: "block", marginBottom: 5, fontWeight: 600 }}>
        First Name
      </label>
      <input
        name="first_name"
        value={form.first_name}
        onChange={handleChange}
        placeholder="Enter first name"
      />
    </div>

    <div>
      <label style={{ display: "block", marginBottom: 5, fontWeight: 600 }}>
        Contact
      </label>
      <input
        name="contac"
        value={form.contac}
        onChange={handleChange}
        placeholder="Enter contact number"
      />
    </div>

    <div>
      <label style={{ display: "block", marginBottom: 5, fontWeight: 600 }}>
        Birth Date
      </label>
      <input
        type="date"
        name="bday"
        value={form.bday}
        onChange={handleChange}
      />
    </div>

    <div>
      <label style={{ display: "block", marginBottom: 5, fontWeight: 600 }}>
        Address
      </label>
      <input
        name="address"
        value={form.address}
        onChange={handleChange}
        placeholder="Enter address"
      />
    </div>

    <div>
  <label style={{ display: "block", marginBottom: 5, fontWeight: 600 }}>
    Status
  </label>

  <select
    name="status"
    value={form.status}
    onChange={handleChange}
    style={{
      width: "100%",
      padding: "10px",
      borderRadius: 8,
      border: "1px solid #ccc",
    }}
  >
    <option value="">Select Status</option>

    {getSelectOptions("status")?.map((opt) => (
      <option key={opt} value={opt}>
        {opt}
      </option>
    ))}
  </select>
</div>

   <div>
  <label style={{ display: "block", marginBottom: 5, fontWeight: 600 }}>
    Celebration
  </label>

  <input
    name="celebration"
    value="3PM Central"
    disabled
    onChange={handleChange}
    style={{
      width: "100%",
      padding: "10px",
      borderRadius: 8,
      fontWeight: 'bold',
      border: "1px solid #ccc",
    }}
  >
   
  </input>
</div>

  <div>
  <label style={{ display: "block", marginBottom: 5, fontWeight: 600 }}>
    Category
  </label>

  <select
    name="category"
    value={form.category}
    onChange={handleChange}
    style={{
      width: "100%",
      padding: "10px",
      borderRadius: 8,
      border: "1px solid #ccc",
    }}
  >
    <option value="">Select Category</option>

    {getSelectOptions("category")?.map((opt) => (
      <option key={opt} value={opt}>
        {opt}
      </option>
    ))}
  </select>
</div>

  <div>
  <label style={{ display: "block", marginBottom: 5, fontWeight: 600 }}>
    Marital Status
  </label>

  <select
    name="marital_status"
    value={form.marital_status}
    onChange={handleChange}
    style={{
      width: "100%",
      padding: "10px",
      borderRadius: 8,
      border: "1px solid #ccc",
    }}
  >
    <option value="">Select Marital Status</option>

    {getSelectOptions("marital_status")?.map((opt) => (
      <option key={opt} value={opt}>
        {opt}
      </option>
    ))}
  </select>
</div>

    <div>
      <label style={{ display: "block", marginBottom: 5, fontWeight: 600 }}>
        Wedding Anniversary
      </label>
      <input
        type="date"
        name="wedding_anniv"
        value={form.wedding_anniv}
        onChange={handleChange}
      />
    </div>

  <div>
  <label style={{ display: "block", marginBottom: 5, fontWeight: 600 }}>
    Ministry
  </label>

  <select
    name="ministry"
    value={form.ministry}
    onChange={handleChange}
    style={{
      width: "100%",
      padding: "10px",
      borderRadius: 8,
      border: "1px solid #ccc",
    }}
  >
    <option value="">Select Ministry</option>

    {getSelectOptions("ministry")?.map((opt) => (
      <option key={opt} value={opt}>
        {opt}
      </option>
    ))}
  </select>
</div>

    <div>
      <label style={{ display: "block", marginBottom: 5, fontWeight: 600 }}>
        Care Group Leader
      </label>
      <input
        name="cg_leader"
        disabled
        style={{fontWeight: 'bold'}}
        value={selectedVineData?.name || ""}
        onChange={handleChange}
        placeholder="Enter care group leader"
      />
    </div>

    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        gap: 10,
        marginTop: 20,
      }}
    >
      <button onClick={handleAdd} disabled={saving}>
        {saving ? "Adding..." : "Add Member"}
      </button>

      <button onClick={resetForm}>
        Cancel
      </button>
    
        </div>
      </div>
    </div>
  </div>
)}

      
      {/* ADD MEMBER FORM */}
      {selectedVine && members.length > 0 && !loading &&(
        <div style={{ 
          marginBottom: 16, 
          padding: 12, 
          border: "2px solid var(--border)",
          borderRadius: 4,
        }}>
          <h4 style={{ marginTop: 0, marginBottom: 8, fontWeight: 'bold' }}>Add New Member on Attendance</h4>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", flexDirection: "column" }}>
            <div style={{display: "flex", gap: 8, textWrap: "nowrap", justifyContent: "center", alignItems: "center"}}>
            <label>Vine Id:</label>
            <input
              type="text"
              placeholder="Vine ID"
              value={selectedVine}
              disabled
              onChange={(e) => setNewMemberForm({ ...newMemberForm, v_id: e.target.value })}
              style={{ padding: "2px 4px", borderRadius: 4, backgroundColor: "var(--border)", color: "red"}}
            />
            </div>
            <div style={{display: "flex", gap: 8, textWrap: "nowrap", justifyContent: "center", alignItems: "center"}}>
            <label>First Name:</label>
            <input
              type="text"
              placeholder="First Name"
              value={newMemberForm.first_name}
              onChange={(e) => setNewMemberForm({ ...newMemberForm, first_name: e.target.value })}
              style={{ padding: "6px 8px", borderRadius: 4,}}
            />
            </div>
            <div style={{display: "flex", gap: 8, textWrap: "nowrap", justifyContent: "center", alignItems: "center"}}>
            <label>Last Name:</label>
            <input
              type="text"
              placeholder="Last Name"
              value={newMemberForm.last_name}
              onChange={(e) => setNewMemberForm({ ...newMemberForm, last_name: e.target.value })}
              style={{ padding: "6px 8px", borderRadius: 4,}}
            />
            </div>
            <button
              onClick={addMember}
              disabled={saving}
              style={{
                background: "green",
                color: "white",
                padding: "6px 12px",
                borderRadius: 4,
                cursor: saving ? "not-allowed" : "pointer"
              }}
            >
              Add Member
            </button>
          </div>
        </div>
      )}
      <div
  style={{
    display: "flex",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
    flexWrap: "wrap",
  }}
>
  <span
    style={{
      fontSize: 25,
      lineHeight: 1,
      margin: 0,
      display: "flex",
      alignItems: "center",
    }}
  >
    ⌕
  </span>

  <input
    type="text"
    placeholder="Search member..."
    value={searchMember}
    onChange={(e) => {
      setSearchMember(e.target.value);
      setCurrentPage(1);
    }}
    style={{
      padding: "6px 10px",
      borderRadius: 4,
      border: "1px solid green",
      minWidth: 220,
      maxWidth: "30%",
    }}
  />
</div>
      {members.length > 0 && !loading && (
        <div
          className="vine-attendance__table-wrap"
          style={{
            width: "100%",
            overflowX: "auto",
            overflowY: "auto",
            maxHeight: "calc(100vh - 10px)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: 4,
           
          }}
        >
          
          
          <table
            className="vine-attendance__table"
            style={{ width: "100%", borderCollapse: "collapse" }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    padding: 8,
                    textAlign: "left",
                    position: "sticky",
                    top: -5,
                    zIndex: 4,
                   
                   
                  }}
                >
                  
                </th>
                <th
                  style={{
                    padding: 8,
                    textAlign: "left",
                    minWidth: 180,
                    position: "sticky",
                    top: -5,
                    zIndex: 3,
   
                  }}
                >
                  
                </th>
                <th
                  style={{
                    padding: 8,
                    textAlign: "left",
                    minWidth: 180,
                    position: "sticky",
                    top: -5,
                    zIndex: 3,
                 
                  }}
                >
                  
                </th>

                {sundayWeeks.length > 0 && (
                  <th
                    colSpan={sundayWeeks.length}
                    style={{
                      padding: 8,
                      textAlign: "center",
                      position: "sticky",
                      top: -5,
                      zIndex: 3,
                  
                    }}
                  >
                    Sunday Attendance
                  </th>
                )}
                {careGroupWeeks.length > 0 && (
                  <th
                    colSpan={careGroupWeeks.length}
                    style={{
                      padding: 8,
                      textAlign: "center",
                      position: "sticky",
                      top: -5,
                      zIndex: 3,
                    
                    }}
                  >
                    Caregroup
                  </th>
                )}
                <th
                  colSpan={timerFields.length}
                  style={{
                    padding: 8,
                    textAlign: "center",
                    position: "sticky",
                    top: -5,
                    zIndex: 3,
                    
                  }}
                >
                  New Comers
                </th>
                {powerfilledBaptismFields.length > 0 && (
                  <th
                    colSpan={powerfilledBaptismFields.length}
                    style={{
                      padding: 8,
                      textAlign: "center",
                      position: "sticky",
                      top: -5,
                      zIndex: 3,
                     
                    }}
                  >
                    Status
                  </th>
                )}
                <th
                  style={{
                    padding: 8,
                    textAlign: "center",
                    position: "sticky",
                    top: -5,
                    zIndex: 3,
                    
                  }}
                >
                  Action
                </th>
              </tr>
              <tr>
                <th
                  style={{
                    padding: 8,
                    position: "sticky",
                    top: 28,
                    left: -10,
                    zIndex: 7,
                    
                  }}
                >ID</th>
                <th
                  style={{
                    padding: 8,
                    minWidth: 180,
                    position: "sticky",
                    top: 28,
                    zIndex: 3,
                  
                  }}
                >Last Name</th>
                <th
                  style={{
                    padding: 8,
                    minWidth: 180,
                    position: "sticky",
                    top: 28,
                    zIndex: 2,
                   
                  }}
                >First Name</th>
                {Object.values(reportDates).map((wk) => (
                  <th
                    key={wk}
                    style={{
                      padding: 8,
                      textAlign: "center",
                      fontSize: "12px",
                      position: "sticky",
                      top: 28,
                      zIndex: 2,
                      
                    }}
                  >
                    {wk}
                  </th>
                ))}

                {Object.values(reportDates).map((wk) => (
                  <th
                    key={wk}
                    style={{
                      padding: 8,
                      textAlign: "center",
                      fontSize: "12px",
                      position: "sticky",
                      top: 28,
                      zIndex: 2,
                     
                    }}
                  >
                    {wk}
                  </th>
                ))}

                {timerFields.map((field) => (
                  <th
                    key={field}
                    style={{
                      padding: 8,
                      textAlign: "center",
                      fontSize: "12px",
                      position: "sticky",
                      top: 28,
                      zIndex: 2,
                     
                 
                    }}
                  >
                    {field}
                  </th>
                ))}

                {powerfilledBaptismFields.map((field) => (
                  <th
                    key={field}
                    style={{
                      padding: 8,
                      textAlign: "center",
                      fontSize: "12px",
                      position: "sticky",
                      top: 28,
                      zIndex: 2,
                     
                   
                    }}
                  >
                    {field}
                  </th>
                ))}

                <th
                  style={{
                    padding: 8,
                    position: "sticky",
                    top: 28,
                    zIndex: 2,
                   
                   
                  }}
                ></th>
              </tr>
            </thead>

          <tbody>
            {paginatedMembers.map((m) => (
              <tr
                key={m.id}
               
              >
                <td style={{ padding: 8,
                left: -10,
                   background: theme === "dark" ? "#111827" : "#fff",
                    color: theme === "dark" ? "#f8fafc" : "#111",
                    borderBottom: theme === "dark" ? "1px solid #374151" : "1px solid #d1d5db"
                 }} data-label="ID">{m.id}</td>

                <td style={{ padding: 8, minWidth: 180 }} data-label="Last Name">
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={editBuffer[m.id]?.last_name ?? m.last_name ?? ""}
                    onChange={(e) => updateBuffer(m.id, "last_name", e.target.value)}
                    style={{
                      width: "100%",
                      minWidth: 160,
                      padding: "6px 8px",
                      borderRadius: 4,
                      boxSizing: "border-box"
                    }}
                  />
                </td>

                <td style={{ padding: 8, minWidth: 180 }} data-label="First Name">
                  <input
                    type="text"
                    placeholder="First Name"
                    value={editBuffer[m.id]?.first_name ?? m.first_name ?? ""}
                    onChange={(e) => updateBuffer(m.id, "first_name", e.target.value)}
                    style={{
                      width: "100%",
                      minWidth: 160,
                      padding: "6px 8px",
                      borderRadius: 4,
                      boxSizing: "border-box"
                    }}
                  />
                </td>

                {/* SUNDAY WEEKS - DROPDOWNS (ONLINE/ONSITE) */}
                {sundayWeeks.map((wk) => (
                  <td key={wk} style={{ textAlign: "center", padding: 8}} data-label={wk}>
                    <select
                      value={editBuffer[m.id]?.[wk] ?? m[wk] ?? ""}
                      onChange={(e) => updateBuffer(m.id, wk, e.target.value)}
                      style={{ 
                        padding: "4px 6px", 
                        borderRadius: 4, 
                        minWidth: 80
                      }}
                    >
                      <option value="">--</option>
                      <option value="ONLINE">ONLINE</option>
                      <option value="ONSITE">ONSITE</option>
                    </select>
                  </td>
                ))}

                 {/* CAREGROUP WEEKS - CHECKBOXES */}
                {careGroupWeeks.map((wk) => (
                  <td key={wk} style={{ textAlign: "center", padding: 8 }} data-label={wk}>
                    <input
                      type="checkbox"
                      checked={editBuffer[m.id]?.[wk] !== undefined ? editBuffer[m.id]?.[wk] : isChecked(m[wk])}
                      onChange={(e) => updateBuffer(m.id, wk, e.target.checked)}
                    />
                  </td>
                ))}

                {/* TIMER DROPDOWNS */}
{timerFields.map((field) => (
  <td
    key={field}
    style={{ textAlign: "center", padding: 8 }}
    data-label={field}
  >
    <select
      value={editBuffer[m.id]?.[field] ?? m[field] ?? ""}
      onChange={(e) => updateBuffer(m.id, field, e.target.value)}
      style={{
        padding: "4px 6px",
        borderRadius: 4,
        minWidth: 90
      }}
    >
      <option value="">--</option>

     {weekOptions.map((week) => (
  <option key={week} value={week}>
    {reportDates[week]}
  </option>
))}
    </select>
  </td>
))}

                {powerfilledBaptismFields.map((field) => (
  <td key={field} style={{ textAlign: "center", padding: 8 }}>
    <select
      value={editBuffer[m.id]?.[field] ?? m[field] ?? ""}
      onChange={(e) => updateBuffer(m.id, field, e.target.value)}
      style={{
        padding: "4px 6px",
        borderRadius: 4,
        minWidth: 90
      }}
    >
      <option value="">--</option>
     {weekOptions.map((week) => (
  <option key={week} value={week}>
    {reportDates[week]}
  </option>
))}
    </select>
  </td>
))}

                {/* DELETE BUTTON */}
                <td style={{ textAlign: "center", padding: 8, }}>
                  <button
                    onClick={() => deleteMember(m.id, `${m.first_name} ${m.last_name}`)}
                    disabled={saving}
                    style={{
                      background: "#ff4444",
                      color: "white",
                      padding: "4px 8px",
                      borderRadius: 4,
                      border: "none",
                      cursor: saving ? "not-allowed" : "pointer",
                      fontSize: "12px"
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          
        </table>
      </div>
      
      )}
      {/* PAGINATION */}
<div
  style={{
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    padding: 10,
    flexWrap: "wrap"
  }}
>
  <button
    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
    disabled={currentPage === 1}
    style={{
      padding: "6px 12px",
      borderRadius: 4,
      cursor: currentPage === 1 ? "not-allowed" : "pointer"
    }}
  >
    Previous
  </button>

  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
    <button
      key={page}
      onClick={() => setCurrentPage(page)}
      style={{
        padding: "6px 12px",
        borderRadius: 4,
        fontWeight: currentPage === page ? "bold" : "normal",
        border:
          currentPage === page
            ? "2px solid #2563eb"
            : "1px solid #ccc",
        cursor: "pointer"
      }}
    >
      {page}
    </button>
  ))}

  <button
    onClick={() =>
      setCurrentPage((p) => Math.min(p + 1, totalPages))
    }
    disabled={currentPage === totalPages}
    style={{
      padding: "6px 12px",
      borderRadius: 4,
      cursor:
        currentPage === totalPages ? "not-allowed" : "pointer"
    }}
  >
    Next
  </button>
  <span>
  Page {currentPage} of {totalPages}
</span>
</div>
      <div style={{ display: "flex", gap: 8, marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
       <button
          onClick={() => {
            setSelectedVine("");
            setMembers([]);
            setWeekColumns([]);
            setEditBuffer({});
          }}
        >
          Clear
        </button>

        {/* SAVE ALL BUTTON */}
        <button
          onClick={saveAllChanges}
          disabled={saving}
          style={{
            background: "green",
            color: "white",
            padding: "6px 10px",
            borderRadius: 4,
            cursor: saving ? "not-allowed" : "pointer"
          }}
        >
          {saving ? "Saving..." : "Save All Changes"}
        </button>
        </div>
    </div>
  );
}
import { useEffect, useState, useRef } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./App.css";

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  
  const [pdfFontSize, setPdfFontSize] = useState(8);
const [pdfCellPadding, setPdfCellPadding] = useState(1);

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
    "https://script.google.com/macros/s/AKfycbwtZWDXfI1l2dkNMQ-EgK5GJJHWXi0wsphQD7gusoyd5M9lTwaXniM3wY75SJXR0XvD/exec";

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
  };

  // =========================
  // ADD
  // =========================
  const handleAdd = async () => {
    const res = await callAPI({
      action: "add",
      data: form,
    });

    if (res.status === "success") {
      alert("Member added!");
      resetForm();
      fetchData();
    } else {
      alert(res.message);
    }
  };

  // =========================
  // EDIT START
  // =========================
  const startEdit = (row) => {
    setIsEditing(true);
    setEditId(row.id);
    setForm(row);
  };

  // =========================
  // SAVE EDIT
  // =========================
  const handleEdit = async () => {
    const res = await callAPI({
      action: "edit",
      id: editId,
      data: form,
    });

    if (res.status === "success") {
      alert("Updated!");
      resetForm();
      fetchData();
    } else {
      alert(res.message);
    }
  };

  // =========================
  // DELETE
  // =========================
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this member?")) return;

    const res = await callAPI({
      action: "delete",
      id,
    });

    if (res.status === "success") {
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
    headers.map((key) => String(row[key] || ""))
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

  // =========================
  // UI
  // =========================
  if (loading) return <h2>Loading...</h2>;

  return (
    <div style={{ padding: 20 }}>
      <h1>JCSGO 3PM Master List</h1>
      <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
  Switch to {theme === "dark" ? "Light" : "Dark"} Mode
</button>


      {/* ================= FORM ================= */}
      <div style={{ marginBottom: 20, padding: 10, border: "1px solid #ccc" }}>
      
        <h3>{isEditing ? "Edit Member" : "Add Member"}</h3>

        {headers.map(
          (key) =>
            key !== "id" && (
              <div key={key}>
                <input
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
          <>
            <button onClick={handleEdit}>Save</button>
            <button onClick={resetForm}>Cancel</button>
          </>
        )}
      </div>
  <div>
    <label>Font Size: {pdfFontSize}</label>
    <input
      type="range"
      min="1"
      max="10"
      value={pdfFontSize}
      onChange={(e) => setPdfFontSize(Number(e.target.value))}
      style={{ marginLeft: "10px" }}
    />
  </div>
      <button onClick={generatePdfPreview}>Export PDF</button>

      {/* ================= TABLE ================= */}
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
                <td key={key}>{row[key]}</td>
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
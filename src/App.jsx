import { useEffect, useState, useRef } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import "./App.css";

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [sortKey, setSortKey] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");

  const [pdfFontSize, setPdfFontSize] = useState(8);
const [pdfCellPadding, setPdfCellPadding] = useState(1);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

  // PDF STATES
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [pdfImage, setPdfImage] = useState(null);

  const tableRef = useRef(null);

  const WEB_APP_URL =
    "https://script.google.com/macros/s/AKfycbwtZWDXfI1l2dkNMQ-EgK5GJJHWXi0wsphQD7gusoyd5M9lTwaXniM3wY75SJXR0XvD/exec";

  const dropdownFields = {
    Gender: ["Male", "Female"],
    Status: ["Active", "Inactive"],
  };

  // =========================
  // FETCH DATA
  // =========================
  const fetchData = () => {
    setLoading(true);

    fetch(WEB_APP_URL)
      .then((res) => res.json())
      .then((res) => {
        const fetchedData = res.data || [];

        const withIndex = fetchedData.map((row, i) => ({
          ...row,
          _rowIndex: i + 2,
        }));

        setData(withIndex);

        if (withIndex.length > 0) {
          const keys = Object.keys(withIndex[0]);
          setSortKey(keys[1]);
        }

        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [data, sortKey, sortDirection]);

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
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  // =========================
  // PDF PREVIEW
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

const downloadPDF = () => {
  const doc = new jsPDF("l", "mm", "a4");

  const tableColumn = headers;

  const tableRows = sortedData.map((row) =>
    headers.map((key) => String(row[key] || ""))
  );

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [7, 17, 65] },
  });

  doc.save("JCSGO_Master_List.pdf");
};

  // =========================
  // UI
  // =========================
  if (loading) return <h2>Loading...</h2>;

  const headers =
    data.length > 0
      ? Object.keys(data[0]).filter((k) => k !== "_rowIndex")
      : [];

  return (
    <div style={{ padding: "20px" }}>
      <h1>JCSGO 3PM Master List</h1>

      <div style={{ marginBottom: "15px" }}>
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
 {/* Add more PDF 
  <div>
    <label>Cell Padding: {pdfCellPadding}</label>
    <input
      type="range"
      min="0"
      max="1"
      value={pdfCellPadding}
      onChange={(e) => setPdfCellPadding(Number(e.target.value))}
      style={{ marginLeft: "10px" }}
    />
  </div>
  settings here if needed */}
</div>

      <button onClick={() => window.print()}>Print</button>
      <button onClick={generatePdfPreview} style={{ marginLeft: "10px" }}>
        Export PDF
      </button>

      {/* TABLE */}
      <div ref={tableRef}>
        <table border="1" cellPadding="8" style={{ width: "100%" }}>
          <thead>
            <tr>
              <th>#</th>

              {headers.map((key) => (
                <th
                  key={key}
                  onClick={() => handleSort(key)}
                  style={{
                    cursor: "pointer",
                    background: "#071141",
                    color: "white",
                  }}
                >
                  {key}{" "}
                  {sortKey === key
                    ? sortDirection === "asc"
                      ? " 🔼"
                      : " 🔽"
                    : ""}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {paginatedData.map((row, i) => (
              <tr key={i}>
                <td>{startIndex + i + 1}</td>

                {headers.map((key) => (
                  <td key={key}>{String(row[key] || "")}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div style={{ marginTop: "15px" }}>
        <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}>
          Prev
        </button>

        <span>
          {" "}
          Page {currentPage} of {totalPages}{" "}
        </span>

        <button style={{marginRight: 10}}
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

      

      <div
  ref={tableRef}
  style={{
    position: "absolute",
    left: "-9999px",
    top: 0,
    background: "white",
    padding: "20px",
  }}
>
  <h2 style={{ textAlign: "center" }}>JCSGO Master List</h2>

  <table border="1" cellPadding="8" style={{ width: "100%" }}>
    <thead>
      <tr>
        {headers.map((key) => (
          <th key={key} style={{ background: "#071141", color: "white" }}>
            {key}
          </th>
        ))}
      </tr>
    </thead>

    <tbody>
      {sortedData.map((row, i) => (
        <tr key={i}>
          {headers.map((key) => (
            <td key={key}>{String(row[key] || "")}</td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
</div>

      {/* ================= PDF PREVIEW MODAL ================= */}
      {showPdfPreview && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3>PDF Preview</h3>

            {pdfImage && (
              <img
                src={pdfImage}
                style={{ width: "100%", borderRadius: "8px" }}
              />
            )}

            <div style={{ marginTop: "10px" }}>
              <button onClick={downloadPDF}>Download PDF</button>
              <button onClick={() => setShowPdfPreview(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

// =========================
// STYLES
// =========================
const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    background: "#000",
    padding: "20px",
    width: "600px",
    borderRadius: "10px",
    maxHeight: "90vh",
    overflowY: "auto",
  },
};
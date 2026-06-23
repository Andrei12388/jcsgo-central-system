import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generateVineYearlyReport = async ({
  webAppUrl,
  vines,
}) => {
  const doc = new jsPDF("p", "mm", "a4");

  const isChecked = (val) => {
    const v = String(val || "").toUpperCase();
    return (
      val === true ||
      val === 1 ||
      val === "1" ||
      v === "YES" ||
      v === "TRUE" ||
      v === "ONSITE" ||
      v === "ONLINE"
    );
  };

  const months = [
    "JANUARY","FEBRUARY","MARCH","APRIL","MAY","JUNE",
    "JULY","AUGUST","SEPTEMBER","OCTOBER","NOVEMBER","DECEMBER"
  ];

  const exportDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const fetchYearlyData = async () => {
    const res = await fetch(`${webAppUrl}?action=getYearlyData`);
    const json = await res.json();
    return json.data || {};
  };

  const yearData = await fetchYearlyData();

  const vineMap = new Map();

  Object.values(yearData).forEach((rows) => {
    rows.forEach((r) => {
      if (!r?.id) return;

      const vineId = String(r.v_id || "UNKNOWN");

      if (!vineMap.has(vineId)) {
        vineMap.set(vineId, new Map());
      }

      const group = vineMap.get(vineId);

      if (!group.has(r.id)) {
        group.set(r.id, {
          id: r.id,
          first_name: r.first_name,
          last_name: r.last_name,
          v_id: r.v_id,
        });
      }
    });
  });

  const hasMonthAttendance = (rows, memberId) => {
    const userRows = rows.filter(
      (r) => String(r.id) === String(memberId)
    );

    return userRows.some((row) =>
      Object.keys(row).some(
        (k) => /^WEEK/i.test(k) && isChecked(row[k])
      )
    );
  };

  let isFirstPage = true;

  // =========================
  // MAIN VINE REPORT PAGES
  // =========================
  for (const vine of vines) {
    const vineId = String(vine.id);

    const members =
      Array.from(vineMap.get(vineId)?.values() || []);

    if (!members.length) continue;

    if (!isFirstPage) doc.addPage();
    isFirstPage = false;

    // HEADER
    doc.setFontSize(14);
    doc.text("JESUS CHRIST SAVES GLOBAL OUTREACH", 105, 15, {
      align: "center",
    });

    doc.setFontSize(12);
    doc.text("YEARLY VINE ATTENDANCE REPORT", 105, 22, {
      align: "center",
    });

    doc.setFontSize(10);
    doc.text(`Vine: ${vine.name}`, 14, 32);
    doc.text(`Total Members: ${members.length}`, 14, 38);
    doc.text(`Exported: ${exportDate}`, 14, 44);
    doc.text(`Year: ${new Date().getFullYear()}`, 14, 50);

    const checkCells = [];
    const monthlyTotals = Array(12).fill(0);

    const body = members.map((m, rowIndex) => [
      `${m.first_name || ""} ${m.last_name || ""}`.trim(),

      ...months.map((month, colIndex) => {
        const rows = yearData[month] || [];
        const checked = hasMonthAttendance(rows, m.id);

        if (checked) {
          checkCells.push({
            row: rowIndex,
            col: colIndex + 1,
          });

          monthlyTotals[colIndex] += 1;
        }

        return "";
      }),

      "",
    ]);

    // TOTAL ROW
    body.push([
      "TOTAL",
      ...monthlyTotals.map((t) => String(t)),
      "",
    ]);

    autoTable(doc, {
      startY: 55,
      head: [[
        "MEMBER",
        "JAN","FEB","MAR","APR","MAY","JUN",
        "JUL","AUG","SEP","OCT","NOV","DEC",
        "REMARKS",
      ]],
      body,
      theme: "grid",
      styles: {
        fontSize: 7,
        halign: "center",
      },
      headStyles: {
        fillColor: [15, 118, 110],
        textColor: 255,
      },

      didDrawCell: (data) => {
        const isCheck = checkCells.some(
          (c) =>
            c.row === data.row.index &&
            c.col === data.column.index
        );

        if (isCheck && data.section === "body") {
          doc.setTextColor(0, 160, 0);

          doc.text(
            "/",
            data.cell.x + data.cell.width / 2,
            data.cell.y + data.cell.height / 2 + 2,
            { align: "center" }
          );

          doc.setTextColor(0, 0, 0);
        }
      },

      columnStyles: {
        0: { cellWidth: 40 },
        13: { cellWidth: 30 },
      },
    });
  }

  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  window.open(url);
};
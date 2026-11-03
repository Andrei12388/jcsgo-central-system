import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generateCentralYearlySummaryReport = async ({
  family,
  allData = [],
  vines = [],
  webAppUrl,
  selectedYear = new Date().getFullYear(),
}) => {
  const doc = new jsPDF("p", "mm", "a4");

  const months = [
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
    "DECEMBER",
  ];

  const monthLabels = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

  const YOUNG_WOMEN_VINES = [1, 23, 244, 140];
  const YOUNG_MEN_VINES = [76, 120, 167];
  const MEN_VINES = [1230, 1361];
  const WOMEN_VINES = [1236, 1255, 1283, 1360];

  const weekFields = ["WEEK1", "WEEK2", "WEEK3", "WEEK4", "WEEK5"];

  const isChecked = (val) => {
    const v = String(val ?? "").toUpperCase();
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

  const isAttendance = (member, attendance) =>
    weekFields.some((week) =>
      String(member[week] || "")
        .toUpperCase()
        .includes(attendance.toUpperCase())
    );

  const fetchYearlyData = async () => {
    if (!webAppUrl) {
      return Object.fromEntries(
        months.map((month) => [month, Array.isArray(allData) ? allData : []])
      );
    }

    const res = await fetch(`${webAppUrl}?action=getYearlyData`);
    const json = await res.json();
    return json.data || {};
  };

  const yearData = await fetchYearlyData();

  const uniqueMembers = new Map();

  Object.values(yearData).forEach((rows = []) => {
    rows.forEach((row) => {
      if (!row?.id) return;

      const key = String(row.id);
      if (!uniqueMembers.has(key)) {
        uniqueMembers.set(key, {
          id: row.id,
          first_name: row.first_name || "",
          last_name: row.last_name || "",
          is_reg: isChecked(row.is_reg),
          v_id: row.v_id ?? "",
          type: String(row.type || "").trim() || "disciple",
          ...row,
        });
      }
    });
  });

  const members = Array.from(uniqueMembers.values());

  const sumTimer = (field) =>
    members.filter((m) => String(m[field] || "").trim() !== "").length;

  const sumTimerAttendance = (field, attendance) =>
    members.filter((m) => {
      const hasTimer = String(m[field] || "").trim() !== "";
      return hasTimer && isAttendance(m, attendance);
    }).length;

  const countByVineCategory = (vineIds) =>
    members.filter((m) => vineIds.includes(Number(m.v_id))).length;

  const totalMembers = members.length;

  const getMonthRows = (monthName) => yearData[monthName] || [];

  const getMonthCountByType = (type, monthName) =>
    getMonthRows(monthName).filter((m) => {
      const value = String(m[monthName] || "").toUpperCase();
      return (
        String(m.type || "").trim().toLowerCase() === type.toLowerCase() &&
        (value.includes("ONSITE") || value.includes("ONLINE"))
      );
    }).length;

  const countActiveByTypeInMonth = (type, monthName) => {
    const rows = getMonthRows(monthName);
    const set = new Set();

    rows.forEach((m) => {
      if (String(m.type || "").trim().toLowerCase() !== type.toLowerCase()) return;

      const attended = weekFields.some((week) => {
        const value = String(m[week] || "").toUpperCase();
        return value.includes("ONSITE") || value.includes("ONLINE");
      });

      if (attended) {
        set.add(String(m.id));
      }
    });

    return set.size;
  };

  const sumActivityMonth = (prefix, monthName) =>
    getMonthRows(monthName).reduce((sum, row) => {
      return sum + [1, 2, 3, 4, 5].reduce((total, weekNo) => {
        return total + Number(row[`${prefix}${weekNo}`] || 0);
      }, 0);
    }, 0);

  const getMonthlyStats = (prefix) => {
    const values = months.map((month) => sumActivityMonth(prefix, month));
    const total = values.reduce((a, b) => a + b, 0);
    const count = values.filter((v) => v > 0).length;
    const average = count ? (total / count).toFixed(1) : 0;

    return { values, count, average, total };
  };

  const countActiveTypePerMonth = (type, monthName) =>
    getMonthRows(monthName).filter((m) => {
      const memberType = String(m.type || "").trim().toLowerCase();
      const attended = weekFields.some((week) => {
        const value = String(m[week] || "").toUpperCase();
        return value.includes("ONSITE") || value.includes("ONLINE");
      });
      return memberType === type.toLowerCase() && attended;
    }).length;

  const countDisciplePerMonth = (monthName) =>
    getMonthRows(monthName).filter((m) => {
      const memberType = String(m.type || "").trim().toLowerCase() || "disciple";
      const attended = weekFields.some((week) => {
        const value = String(m[week] || "").toUpperCase();
        return value.includes("ONSITE") || value.includes("ONLINE");
      });
      return memberType === "disciple" && attended;
    }).length;

  const departmentTotals = [
    ["I. Church Attendance", "TOTAL"],
    ["2026 Target", ""],
    ["Registered Disciples", totalMembers],
    ["Youth Men", countByVineCategory(YOUNG_MEN_VINES)],
    ["Youth Women", countByVineCategory(YOUNG_WOMEN_VINES)],
    ["Men", countByVineCategory(MEN_VINES)],
    ["Women", countByVineCategory(WOMEN_VINES)],
  ];

  const newBelieversTable = [
    ["II. New Believers", "TOTAL"],
    ["1st Timers", sumTimer("1ST_TIMER")],
    ["2nd Timers", sumTimer("2ND_TIMER")],
    ["3rd Timers", sumTimer("3RD_TIMER")],
    ["4th Timers", sumTimer("4TH_TIMER")],
    ["5th Timers / Conversion", sumTimer("5TH_TIMER")],
    ["Power Filled Life", sumTimer("POWER_FILLED")],
    ["Water Baptism", sumTimer("WATER_BAPTISM")],
  ];

  const vineServantLeaders = months.map((month) => countActiveTypePerMonth("vine", month));
  const clusterLeaders = months.map((month) => countActiveTypePerMonth("cluster", month));
  const careLeaders = months.map((month) => countActiveTypePerMonth("careleader", month));
  const activeDisciples = months.map((month) => countDisciplePerMonth(month));

  const evangelism = getMonthlyStats("WEEK_EW");
  const lighthouse = getMonthlyStats("WEEK_LH");
  const fieldCareGroup = getMonthlyStats("WEEK_FCG");
  const fieldCareDisciples = getMonthlyStats("WEEK_FCD");
  const followUp = getMonthlyStats("WEEK_FU");
  const reactivation = getMonthlyStats("WEEK_R");

  const childrenChurch = getMonthlyStats("WEEK_CC");
  const outreachGroup = getMonthlyStats("WEEK_OG");
  const outreachDisciples = getMonthlyStats("WEEK_OD");

  const integrationRows = [
    [
      `Vine Servant Leaders (${members.filter((m) => String(m.type || "").trim().toLowerCase() === "vine").length})`,
      ...vineServantLeaders,
      (vineServantLeaders.filter((v) => v > 0).length
        ? (vineServantLeaders.reduce((a, b) => a + b, 0) / vineServantLeaders.filter((v) => v > 0).length).toFixed(1)
        : 0),
      vineServantLeaders.reduce((a, b) => a + b, 0),
    ],
    [
      `Cluster Servant Leaders (${members.filter((m) => String(m.type || "").trim().toLowerCase() === "cluster").length})`,
      ...clusterLeaders,
      (clusterLeaders.filter((v) => v > 0).length
        ? (clusterLeaders.reduce((a, b) => a + b, 0) / clusterLeaders.filter((v) => v > 0).length).toFixed(1)
        : 0),
      clusterLeaders.reduce((a, b) => a + b, 0),
    ],
    [
      `Care Leaders / Group (${members.filter((m) => String(m.type || "").trim().toLowerCase() === "careleader").length})`,
      ...careLeaders,
      (careLeaders.filter((v) => v > 0).length
        ? (careLeaders.reduce((a, b) => a + b, 0) / careLeaders.filter((v) => v > 0).length).toFixed(1)
        : 0),
      careLeaders.reduce((a, b) => a + b, 0),
    ],
    [
      "Total Active Disciples per Month",
      ...activeDisciples,
      (activeDisciples.filter((v) => v > 0).length
        ? (activeDisciples.reduce((a, b) => a + b, 0) / activeDisciples.filter((v) => v > 0).length).toFixed(1)
        : 0),
      activeDisciples.reduce((a, b) => a + b, 0),
    ],
    [
      "HAYO / Evangelism",
      ...evangelism.values,
      evangelism.average,
      evangelism.total,
    ],
    [
      "Lighthouse",
      ...lighthouse.values,
      lighthouse.average,
      lighthouse.total,
    ],
    [
      "Field Care Group",
      ...fieldCareGroup.values,
      fieldCareGroup.average,
      fieldCareGroup.total,
    ],
    [
      "Field Care Disciples",
      ...fieldCareDisciples.values,
      fieldCareDisciples.average,
      fieldCareDisciples.total,
    ],
    [
      "Follow Up",
      ...followUp.values,
      followUp.average,
      followUp.total,
    ],
    [
      "Reactivation",
      ...reactivation.values,
      reactivation.average,
      reactivation.total,
    ],
  ];

  const otherMinistriesRows = [
    [
      "Children Church",
      ...childrenChurch.values,
      childrenChurch.average,
      childrenChurch.total,
    ],
    [
      "Outreach Group",
      ...outreachGroup.values,
      outreachGroup.average,
      outreachGroup.total,
    ],
    [
      "Outreach Disciples",
      ...outreachDisciples.values,
      outreachDisciples.average,
      outreachDisciples.total,
    ],
  ];

  doc.setFontSize(14);
  doc.text("JESUS CHRIST SAVES GLOBAL OUTREACH", 105, 15, {
    align: "center",
  });

  doc.setFontSize(12);
  doc.text(`CENTRAL ${family} YEARLY SUMMARY REPORT`, 105, 22, {
    align: "center",
  });

  doc.setFontSize(10);
  doc.text(`Year: ${selectedYear}`, 14, 32);
  doc.text(`Date Exported: ${new Date().toLocaleDateString()}`, 145, 32);

  autoTable(doc, {
    startY: 42,
    head: [departmentTotals[0]],
    body: departmentTotals.slice(1),
    theme: "grid",
    pageBreak: "avoid",
    rowPageBreak: "avoid",
  });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 5,
    head: [["II. New Believers", "Achieved"]],
    body: newBelieversTable.slice(1),
    theme: "grid",
    pageBreak: "avoid",
    rowPageBreak: "avoid",
  });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    head: [["III. Integration & Mobilization", ...monthLabels, "Average", "TOTAL"]],
    body: integrationRows,
    theme: "grid",
    styles: { fontSize: 7, halign: "center" },
    headStyles: { fillColor: [15, 118, 110], textColor: 255 },
    pageBreak: "avoid",
    rowPageBreak: "avoid",
  });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    head: [["IV. Other Ministries", ...monthLabels, "Average", "TOTAL"]],
    body: otherMinistriesRows,
    theme: "grid",
    styles: { fontSize: 7, halign: "center" },
    headStyles: { fillColor: [15, 118, 110], textColor: 255 },
    pageBreak: "avoid",
    rowPageBreak: "avoid",
  });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    body: [
      ["NARRATIVE REPORT", "", "", ""],
      ["Submitted by:", "", ""],
      ["Outreach/Family", "", "", ""],
    ],
    theme: "plain",
  });

  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  window.open(url);
};

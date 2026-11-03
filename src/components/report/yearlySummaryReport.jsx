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

const getHighestMonthlyValue = (values) =>
  Math.max(0, ...values);

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

  const countYearlyField = (field) => {
    const uniqueIds = new Set();

    months.forEach((month) => {
      (yearData[month] || []).forEach((row) => {
        const hasValue = String(row[field] || "").trim() !== "";
        const id = String(row.id || "").trim();

        if (hasValue && id) {
          uniqueIds.add(id);
        }
      });
    });

    return uniqueIds.size;
  };

  const countFieldForMonth = (field, monthName) => {
    const uniqueIds = new Set();

    (yearData[monthName] || []).forEach((row) => {
      const hasValue = String(row[field] || "").trim() !== "";
      const id = String(row.id || "").trim();

      if (hasValue && id) {
        uniqueIds.add(id);
      }
    });

    return uniqueIds.size;
  };

  const sumTimerAttendance = (field, attendance) =>
    members.filter((m) => {
      const hasTimer = String(m[field] || "").trim() !== "";
      return hasTimer && isAttendance(m, attendance);
    }).length;

  const countByVineCategory = (vineIds) =>
    members.filter((m) => vineIds.includes(Number(m.v_id))).length;

  const hasAttendance = (member, attendance) =>
    weekFields.some((week) => {
      const value = String(member[week] || "").toUpperCase();
      return value.includes(attendance.toUpperCase());
    });

  const getUniqueIdsWithAttendance = (attendance, vineIds = null) => {
    const uniqueIds = new Set();

    months.forEach((month) => {
      (yearData[month] || []).forEach((member) => {
        const id = String(member.id || "").trim();
        if (!id) return;

        if (vineIds && !vineIds.includes(Number(member.v_id))) return;

        if (hasAttendance(member, attendance)) {
          uniqueIds.add(id);
        }
      });
    });

    return uniqueIds;
  };

  const countCategoryAttendance = (vineIds, attendance) =>
    getUniqueIdsWithAttendance(attendance, vineIds).size;

  const countCategoryTotal = (vineIds) => {
    const uniqueIds = new Set();

    months.forEach((month) => {
      (yearData[month] || []).forEach((member) => {
        const id = String(member.id || "").trim();
        if (!id) return;
        if (!vineIds.includes(Number(member.v_id))) return;

        const hasSundayAttendance = weekFields.some((week) => {
          const value = String(member[week] || "").toUpperCase();
          return value.includes("ONSITE") || value.includes("ONLINE");
        });

        if (hasSundayAttendance) {
          uniqueIds.add(id);
        }
      });
    });

    return uniqueIds.size;
  };

  const getMonthlyUniqueAttendance = (monthName, attendance, vineIds = null) => {
    const uniqueIds = new Set();

    (yearData[monthName] || []).forEach((member) => {
      const id = String(member.id || "").trim();
      if (!id) return;
      if (vineIds && !vineIds.includes(Number(member.v_id))) return;
      if (hasAttendance(member, attendance)) {
        uniqueIds.add(id);
      }
    });

    return uniqueIds.size;
  };

  const getMonthlyUniqueTotal = (monthName, vineIds = null) => {
    const uniqueIds = new Set();

    (yearData[monthName] || []).forEach((member) => {
      const id = String(member.id || "").trim();
      if (!id) return;
      if (vineIds && !vineIds.includes(Number(member.v_id))) return;

      const hasSundayAttendance = weekFields.some((week) => {
        const value = String(member[week] || "").toUpperCase();
        return value.includes("ONSITE") || value.includes("ONLINE");
      });

      if (hasSundayAttendance) {
        uniqueIds.add(id);
      }
    });

    return uniqueIds.size;
  };

  const totalOnsite = getUniqueIdsWithAttendance("ONSITE").size;
  const totalOnline = getUniqueIdsWithAttendance("ONLINE").size;
  const totalSundayAttendance = new Set([
    ...Array.from(getUniqueIdsWithAttendance("ONSITE")),
    ...Array.from(getUniqueIdsWithAttendance("ONLINE")),
  ]).size;

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

    // Count unique active members for the entire year
const countYearlyActiveType = (type) => {
  const uniqueIds = new Set();

  months.forEach((month) => {
    getMonthRows(month).forEach((member) => {
      const memberType = String(member.type || "").trim().toLowerCase();

      if (memberType !== type.toLowerCase()) return;

      const attended = weekFields.some((week) => {
        const value = String(member[week] || "").toUpperCase();
        return value.includes("ONSITE") || value.includes("ONLINE");
      });

      if (attended && member.id) {
        uniqueIds.add(String(member.id));
      }
    });
  });

  return uniqueIds.size;
};

// Count unique active disciples for the entire year
const countYearlyActiveDisciples = () => {
  const uniqueIds = new Set();

  months.forEach((month) => {
    getMonthRows(month).forEach((member) => {
      const memberType =
        String(member.type || "").trim().toLowerCase() || "disciple";

      if (memberType !== "disciple") return;

      const attended = weekFields.some((week) => {
        const value = String(member[week] || "").toUpperCase();
        return value.includes("ONSITE") || value.includes("ONLINE");
      });

      if (attended && member.id) {
        uniqueIds.add(String(member.id));
      }
    });
  });

  return uniqueIds.size;
};

  const departmentTotals = [
    ["I. Church Attendance", "TOTAL"],
    ["2026 Target", ""],
    ["Registered Disciples", totalMembers],
    ["Youth Men", countByVineCategory(YOUNG_MEN_VINES)],
    ["Youth Women", countByVineCategory(YOUNG_WOMEN_VINES)],
    ["Men", countByVineCategory(MEN_VINES)],
    ["Women", countByVineCategory(WOMEN_VINES)],
  ];

  const sundayTable = [
    ["", ...monthLabels, "TOTAL"],
    [
      "Sunday Attendance",
      ...months.map((month) => getMonthlyUniqueAttendance(month, "ONSITE")),
      totalOnsite,
    ],
    [
      "Sunday Attendance (Online)",
      ...months.map((month) => getMonthlyUniqueAttendance(month, "ONLINE")),
      totalOnline,
    ],
    [
      "Youth Men",
      ...months.map((month) => getMonthlyUniqueAttendance(month, "ONSITE", YOUNG_MEN_VINES)),
      countCategoryAttendance(YOUNG_MEN_VINES, "ONSITE"),
    ],
    [
      "Youth Women",
      ...months.map((month) => getMonthlyUniqueAttendance(month, "ONSITE", YOUNG_WOMEN_VINES)),
      countCategoryAttendance(YOUNG_WOMEN_VINES, "ONSITE"),
    ],
    [
      "Men",
      ...months.map((month) => getMonthlyUniqueAttendance(month, "ONSITE", MEN_VINES)),
      countCategoryAttendance(MEN_VINES, "ONSITE"),
    ],
    [
      "Women",
      ...months.map((month) => getMonthlyUniqueAttendance(month, "ONSITE", WOMEN_VINES)),
      countCategoryAttendance(WOMEN_VINES, "ONSITE"),
    ],
    [
      "Total Attendance",
      ...months.map((month) => getMonthlyUniqueTotal(month)),
      totalSundayAttendance,
    ],
  ];

  const newBelieversTable = [
    [
      "II. New Believers",
      ...monthLabels,
      "Achieved",
    ],
    [
      "1st Timers",
      ...months.map((month) => countFieldForMonth("1ST_TIMER", month)),
      countYearlyField("1ST_TIMER"),
    ],
    [
      "2nd Timers",
      ...months.map((month) => countFieldForMonth("2ND_TIMER", month)),
      countYearlyField("2ND_TIMER"),
    ],
    [
      "3rd Timers",
      ...months.map((month) => countFieldForMonth("3RD_TIMER", month)),
      countYearlyField("3RD_TIMER"),
    ],
    [
      "4th Timers",
      ...months.map((month) => countFieldForMonth("4TH_TIMER", month)),
      countYearlyField("4TH_TIMER"),
    ],
    [
      "5th Timers / Conversion",
      ...months.map((month) => countFieldForMonth("5TH_TIMER", month)),
      countYearlyField("5TH_TIMER"),
    ],
    [
      "Power Filled Life",
      ...months.map((month) => countFieldForMonth("POWER_FILLED", month)),
      countYearlyField("POWER_FILLED"),
    ],
    [
      "Water Baptism",
      ...months.map((month) => countFieldForMonth("WATER_BAPTISM", month)),
      countYearlyField("WATER_BAPTISM"),
    ],
  ];

const vineServantLeaders = months.map((month) => countActiveTypePerMonth("vine", month));
const clusterLeaders = months.map((month) => countActiveTypePerMonth("cluster", month));
const careLeaders = months.map((month) => countActiveTypePerMonth("careleader", month));
const activeDisciples = months.map((month) => countDisciplePerMonth(month));

// Unique yearly totals
const totalVineServantLeaders = countYearlyActiveType("vine");
const totalClusterLeaders = countYearlyActiveType("cluster");
const totalCareLeaders = countYearlyActiveType("careleader");
const totalActiveDisciples = countYearlyActiveDisciples();

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
    totalVineServantLeaders,
  ],
  [
    `Cluster Servant Leaders (${members.filter((m) => String(m.type || "").trim().toLowerCase() === "cluster").length})`,
    ...clusterLeaders,
    (clusterLeaders.filter((v) => v > 0).length
      ? (clusterLeaders.reduce((a, b) => a + b, 0) / clusterLeaders.filter((v) => v > 0).length).toFixed(1)
      : 0),
    totalClusterLeaders,
  ],
  [
    `Care Leaders / Group (${members.filter((m) => String(m.type || "").trim().toLowerCase() === "careleader").length})`,
    ...careLeaders,
    (careLeaders.filter((v) => v > 0).length
      ? (careLeaders.reduce((a, b) => a + b, 0) / careLeaders.filter((v) => v > 0).length).toFixed(1)
      : 0),
    totalCareLeaders,
  ],
  [
    "Total Active Disciples per Month",
    ...activeDisciples,
    (activeDisciples.filter((v) => v > 0).length
      ? (activeDisciples.reduce((a, b) => a + b, 0) / activeDisciples.filter((v) => v > 0).length).toFixed(1)
      : 0),
    totalActiveDisciples,
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
    getHighestMonthlyValue(lighthouse.values),
  ],
  [
    "Field Care Group",
    ...fieldCareGroup.values,
    fieldCareGroup.average,
    getHighestMonthlyValue(fieldCareGroup.values),
  ],
  [
    "Field Care Disciples",
    ...fieldCareDisciples.values,
    fieldCareDisciples.average,
    getHighestMonthlyValue(fieldCareDisciples.values),
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
    head: [sundayTable[0]],
    body: sundayTable.slice(1),
    theme: "grid",
    styles: { fontSize: 7, halign: "center" },
    headStyles: { fillColor: [15, 118, 110], textColor: 255 },
    pageBreak: "avoid",
    rowPageBreak: "avoid",
  });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 5,
    head: [newBelieversTable[0]],
    body: newBelieversTable.slice(1),
    theme: "grid",
    styles: { fontSize: 7, halign: "center" },
    headStyles: { fillColor: [15, 118, 110], textColor: 255 },
    pageBreak: "avoid",
    rowPageBreak: "avoid",
    columnStyles: {
      0: { cellWidth: 38 },
    },
  });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    head: [["III. Integration & Mobilization", ...monthLabels, "Average", "Tot/High"]],
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

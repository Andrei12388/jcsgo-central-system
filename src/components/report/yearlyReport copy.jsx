import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const MONTHS = [
  { key: "JANUARY", label: "JAN" },
  { key: "FEBRUARY", label: "FEB" },
  { key: "MARCH", label: "MAR" },
  { key: "APRIL", label: "APR" },
  { key: "MAY", label: "MAY" },
  { key: "JUNE", label: "JUN" },
  { key: "JULY", label: "JUL" },
  { key: "AUGUST", label: "AUG" },
  { key: "SEPTEMBER", label: "SEP" },
  { key: "OCTOBER", label: "OCT" },
  { key: "NOVEMBER", label: "NOV" },
  { key: "DECEMBER", label: "DEC" },
];

const YOUNG_WOMEN_VINES = [1, 23, 244, 140];
const YOUNG_MEN_VINES = [76, 120, 167];
const MEN_VINES = [1230, 1361];
const WOMEN_VINES = [1236, 1255, 1283, 1360];
const WEEK_FIELDS = ["WEEK1", "WEEK2", "WEEK3", "WEEK4", "WEEK5"];

const isChecked = (value) => {
  const v = String(value || "").toUpperCase();
  return (
    value === true ||
    value === 1 ||
    value === "1" ||
    v === "YES" ||
    v === "TRUE" ||
    v === "ONSITE" ||
    v === "ONLINE"
  );
};

const uniqueCount = (rows, predicate) => {
  const seen = new Set();

  rows.forEach((row) => {
    if (predicate(row)) {
      seen.add(String(row.id));
    }
  });

  return seen.size;
};

const monthSeries = (yearData, formatter) =>
  MONTHS.map(({ key }) => formatter(yearData?.[key] || []));

const totalOf = (values) => values.reduce((sum, value) => sum + Number(value || 0), 0);

const averageOf = (values) => {
  const activeValues = values.filter((value) => Number(value || 0) > 0);
  return activeValues.length ? Number(totalOf(values) / activeValues.length).toFixed(1) : 0;
};

const withAverageAndTotal = (values) => {
  const total = totalOf(values);
  return [...values, averageOf(values), total];
};

const sumActivityByMonth = (yearData, prefix, weekNo) =>
  MONTHS.map(({ key }) => {
    const rows = yearData?.[key] || [];
    return rows.reduce((sum, row) => sum + Number(row[`${prefix}${weekNo}`] || 0), 0);
  });

const monthHasAttendance = (rows) =>
  rows.some((row) =>
    WEEK_FIELDS.some((week) => {
      const value = String(row[week] || "").toUpperCase();
      return value.includes("ONSITE") || value.includes("ONLINE");
    })
  );

const countCategoryForMonth = (rows, vineIds, mode = "all") => {
  const seen = new Set();

  rows.forEach((row) => {
    const vineId = Number(row.v_id);
    if (!vineIds.includes(vineId)) return;

    const value = WEEK_FIELDS.some((week) => {
      const text = String(row[week] || "").toUpperCase();
      if (mode === "onsite") return text.includes("ONSITE");
      if (mode === "online") return text.includes("ONLINE");
      return text.includes("ONSITE") || text.includes("ONLINE");
    });

    if (value) seen.add(String(row.id));
  });

  return seen.size;
};

const countFieldForMonth = (rows, field, mode = "all") => {
  const seen = new Set();

  rows.forEach((row) => {
    const hasValue = String(row[field] || "").trim() !== "";
    if (!hasValue) return;

    const attendanceValue = WEEK_FIELDS.some((week) => {
      const text = String(row[week] || "").toUpperCase();
      if (mode === "onsite") return text.includes("ONSITE");
      if (mode === "online") return text.includes("ONLINE");
      return text.includes("ONSITE") || text.includes("ONLINE");
    });

    if (attendanceValue) seen.add(String(row.id));
  });

  return seen.size;
};

export const generateYearlySummaryReport = async ({
  family,
  webAppUrl,
  vines,
  allData = [],
}) => {
  const doc = new jsPDF("l", "mm", "a4");
  const exportDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const fetchYearlyData = async () => {
    if (allData && allData.length) {
      return allData.reduce((acc, row) => {
        const monthName = String(row.month || row.MONTH || "").toUpperCase();
        if (!monthName) return acc;

        if (!acc[monthName]) acc[monthName] = [];
        acc[monthName].push(row);
        return acc;
      }, {});
    }

    if (!webAppUrl) {
      return {};
    }

    const url = new URL(webAppUrl);
    url.searchParams.set("action", "getYearlyData");

    const res = await fetch(url.toString());
    const json = await res.json();
    return json?.data || {};
  };

  const yearData = await fetchYearlyData();

  const seriesFor = (fn) => monthSeries(yearData, fn);

  const registeredDisciples = seriesFor((rows) => uniqueCount(rows, () => true));
  const youthMen = seriesFor((rows) => countCategoryForMonth(rows, YOUNG_MEN_VINES));
  const youthWomen = seriesFor((rows) => countCategoryForMonth(rows, YOUNG_WOMEN_VINES));
  const men = seriesFor((rows) => countCategoryForMonth(rows, MEN_VINES));
  const women = seriesFor((rows) => countCategoryForMonth(rows, WOMEN_VINES));

  const sundayAttendance = seriesFor((rows) => {
    const seen = new Set();
    rows.forEach((row) => {
      const attended = WEEK_FIELDS.some((week) => {
        const value = String(row[week] || "").toUpperCase();
        return value.includes("ONSITE") || value.includes("ONLINE");
      });

      if (attended) seen.add(String(row.id));
    });
    return seen.size;
  });

  const sundayOnsite = seriesFor((rows) => {
    const seen = new Set();
    rows.forEach((row) => {
      const attended = WEEK_FIELDS.some((week) => {
        const value = String(row[week] || "").toUpperCase();
        return value.includes("ONSITE");
      });

      if (attended) seen.add(String(row.id));
    });
    return seen.size;
  });

  const sundayOnline = seriesFor((rows) => {
    const seen = new Set();
    rows.forEach((row) => {
      const attended = WEEK_FIELDS.some((week) => {
        const value = String(row[week] || "").toUpperCase();
        return value.includes("ONLINE");
      });

      if (attended) seen.add(String(row.id));
    });
    return seen.size;
  });

  const newBelievers = {
    firstTimers: seriesFor((rows) => countFieldForMonth(rows, "1ST_TIMER")),
    secondTimers: seriesFor((rows) => countFieldForMonth(rows, "2ND_TIMER")),
    thirdTimers: seriesFor((rows) => countFieldForMonth(rows, "3RD_TIMER")),
    fourthTimers: seriesFor((rows) => countFieldForMonth(rows, "4TH_TIMER")),
    fifthTimers: seriesFor((rows) => countFieldForMonth(rows, "5TH_TIMER")),
    powerFilled: seriesFor((rows) => uniqueCount(rows, (row) => String(row.POWER_FILLED || "").trim() !== "")),
    waterBaptism: seriesFor((rows) => uniqueCount(rows, (row) => String(row.WATER_BAPTISM || "").trim() !== "")),
  };

  const activityStats = (prefix) => {
    const monthlyTotals = MONTHS.map(({ key }) => {
      const rows = yearData?.[key] || [];
      return [1, 2, 3, 4, 5].reduce((sum, week) => {
        return sum + rows.reduce((rowSum, row) => rowSum + Number(row[`${prefix}${week}`] || 0), 0);
      }, 0);
    });

    return {
      months: monthlyTotals,
      average: Number((totalOf(monthlyTotals) / monthlyTotals.filter((value) => value > 0).length || 0)).toFixed(1),
      total: totalOf(monthlyTotals),
    };
  };

  const vineLeaders = {
    months: sumActivityByMonth(yearData, "WEEK_VINE", 1).map((_, index) => {
      const month = MONTHS[index].key;
      const rows = yearData?.[month] || [];
      return uniqueCount(rows, (row) => {
        const value = String(row.type || "").toLowerCase();
        return value === "vine" && monthHasAttendance([row]);
      });
    }),
  };

  vineLeaders.total = totalOf(vineLeaders.months);
  vineLeaders.average = Number((vineLeaders.total / vineLeaders.months.filter((value) => value > 0).length || 0)).toFixed(1);

  const clusterLeaders = {
    months: MONTHS.map(({ key }) => {
      const rows = yearData?.[key] || [];
      return uniqueCount(rows, (row) => {
        const type = String(row.type || "").toLowerCase();
        return type === "cluster" && monthHasAttendance([row]);
      });
    }),
  };
  clusterLeaders.total = totalOf(clusterLeaders.months);
  clusterLeaders.average = Number((clusterLeaders.total / clusterLeaders.months.filter((value) => value > 0).length || 0)).toFixed(1);

  const careLeaders = {
    months: MONTHS.map(({ key }) => {
      const rows = yearData?.[key] || [];
      return uniqueCount(rows, (row) => {
        const type = String(row.type || "").toLowerCase();
        return type === "careleader" && monthHasAttendance([row]);
      });
    }),
  };
  careLeaders.total = totalOf(careLeaders.months);
  careLeaders.average = Number((careLeaders.total / careLeaders.months.filter((value) => value > 0).length || 0)).toFixed(1);

  const activeDisciples = {
    months: MONTHS.map(({ key }) => {
      const rows = yearData?.[key] || [];
      return uniqueCount(rows, (row) => {
        const type = String(row.type || "").trim().toLowerCase() || "disciple";
        return type === "disciple" && monthHasAttendance([row]);
      });
    }),
  };
  activeDisciples.total = totalOf(activeDisciples.months);
  activeDisciples.average = Number((activeDisciples.total / activeDisciples.months.filter((value) => value > 0).length || 0)).toFixed(1);

  const evangelism = activityStats("WEEK_EW");
  const lighthouse = activityStats("WEEK_LH");
  const fieldCareGroup = activityStats("WEEK_FCG");
  const fieldCareDisciples = activityStats("WEEK_FCD");
  const followUp = activityStats("WEEK_FU");
  const reactivation = activityStats("WEEK_R");

  const childrenChurch = activityStats("WEEK_CC");
  const outreachGroup = activityStats("WEEK_OG");
  const outreachDisciples = activityStats("WEEK_OD");

  const monthLabels = MONTHS.map(({ label }) => label);

  const renderSummaryTable = (title, rows, yStart) => {
    autoTable(doc, {
      startY: yStart,
      head: [[title, ...monthLabels, "AVERAGE", "TOTAL"]],
      body: rows,
      theme: "grid",
      styles: { fontSize: 7, cellPadding: 1.5 },
      headStyles: { fillColor: [15, 118, 110], textColor: 255 },
      columnStyles: { 0: { cellWidth: 60 } },
      pageBreak: "avoid",
      rowPageBreak: "avoid",
    });
  };

  doc.setFontSize(14);
  doc.text("JESUS CHRIST SAVES GLOBAL OUTREACH", 105, 15, { align: "center" });
  doc.setFontSize(12);
  doc.text(`${family} YEARLY SUMMARY REPORT`, 105, 22, { align: "center" });
  doc.setFontSize(10);
  doc.text("All vines", 14, 35);
  doc.text(`Year: ${new Date().getFullYear()}`, 14, 41);
  doc.text(`Date Exported: ${exportDate}`, 195, 41);

  renderSummaryTable("I. Church Attendance", [
    ["Registered Disciples", ...withAverageAndTotal(registeredDisciples)],
    ["Youth Men", ...withAverageAndTotal(youthMen)],
    ["Youth Women", ...withAverageAndTotal(youthWomen)],
    ["Men", ...withAverageAndTotal(men)],
    ["Women", ...withAverageAndTotal(women)],
  ], 46);

  renderSummaryTable("II. Sunday Attendance", [
    ["Sunday Attendance", ...withAverageAndTotal(sundayAttendance)],
    ["Onsite", ...withAverageAndTotal(sundayOnsite)],
    ["Online", ...withAverageAndTotal(sundayOnline)],
  ], doc.lastAutoTable.finalY + 6);

  renderSummaryTable("III. New Friends & Regular Conversions", [
    ["1st Timers", ...withAverageAndTotal(newBelievers.firstTimers)],
    ["2nd Timers", ...withAverageAndTotal(newBelievers.secondTimers)],
    ["3rd Timers", ...withAverageAndTotal(newBelievers.thirdTimers)],
    ["4th Timers", ...withAverageAndTotal(newBelievers.fourthTimers)],
    ["5th Timers / Regular", ...withAverageAndTotal(newBelievers.fifthTimers)],
    ["Power Filled Life", ...withAverageAndTotal(newBelievers.powerFilled)],
    ["Water Baptism", ...withAverageAndTotal(newBelievers.waterBaptism)],
  ], doc.lastAutoTable.finalY + 6);

  renderSummaryTable("IV. Integration & Mobilization", [
    [`Vine Servant Leaders (${vines.length})`, ...withAverageAndTotal(vineLeaders.months)],
    [`Cluster Servant Leaders`, ...withAverageAndTotal(clusterLeaders.months)],
    [`Care Leaders / Group`, ...withAverageAndTotal(careLeaders.months)],
    ["Total Active Disciples per Month", ...withAverageAndTotal(activeDisciples.months)],
    ["HAYO / Evangelism", ...withAverageAndTotal(evangelism.months)],
    ["Lighthouse", ...withAverageAndTotal(lighthouse.months)],
    ["Field Care Group", ...withAverageAndTotal(fieldCareGroup.months)],
    ["Field Care Disciples", ...withAverageAndTotal(fieldCareDisciples.months)],
    ["Follow Up", ...withAverageAndTotal(followUp.months)],
    ["Reactivation", ...withAverageAndTotal(reactivation.months)],
  ], doc.lastAutoTable.finalY + 6);

  renderSummaryTable("V. Other Ministries", [
    ["Children Church", ...withAverageAndTotal(childrenChurch.months)],
    ["Outreach Group", ...withAverageAndTotal(outreachGroup.months)],
    ["Outreach Disciples", ...withAverageAndTotal(outreachDisciples.months)],
  ], doc.lastAutoTable.finalY + 6);

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 8,
    body: [
      ["NARRATIVE REPORT", "", "", "", "", "", "", "", "", "", "", "", ""],
      ["Submitted by:", "", "", "", "", "", "", "", "", "", "", "", ""],
      ["Outreach/Family", "", "", "", "", "", "", "", "", "", "", "", ""],
    ],
    theme: "plain",
  });

  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  window.open(url);
};

export const generateVineYearlyReport = generateYearlySummaryReport;
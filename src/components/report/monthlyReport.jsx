import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { createChartImage } from "./chartToImage";

export const generateCentralMonthlyReport = async ({
  allData,
  vines,
  selectedMonth,
}) => {
  const doc = new jsPDF("p", "mm", "a4");

const YOUNG_WOMEN_VINES = [1, 23, 244, 140];
const YOUNG_MEN_VINES = [76, 120, 167];
const MEN_VINES = [1230];
const WOMEN_VINES = [1236, 1255, 1283];

  // =========================
  // HELPERS
  // =========================

  const isAttendance = (m, attendance) =>
  ["WEEK1", "WEEK2", "WEEK3", "WEEK4", "WEEK5"].some((week) =>
    String(m[week] || "")
      .toUpperCase()
      .includes(attendance.toUpperCase())
  );

  const sumTimer = (field) =>
  members.filter((m) => String(m[field] || "").trim() !== "").length;

  const sumTimerAttendance = (field, attendance) =>
  members.filter((m) => {
    const hasTimer = String(m[field] || "").trim() !== "";

    return hasTimer && isAttendance(m, attendance);
  }).length;

  const isChecked = (val) =>
    val === true ||
    val === 1 ||
    val === "1" ||
    String(val).toLowerCase() === "yes" ||
    String(val).toLowerCase() === "true";

  // 🔥 GLOBAL COUNT (ALL VINES)
  const members = allData || [];

  const sumField = (field) =>
    members.filter((m) => isChecked(m[field])).length;

  const sumValue = (field, match) =>
    members.filter(
      (m) => String(m[field] || "").toUpperCase() === match
    ).length;

  const totalMembers = members.length;

  const getVineName = () => "ALL VINES (GLOBAL REPORT)";

  //Unique Sunday attendance
  const weekFields = ["WEEK1", "WEEK2", "WEEK3", "WEEK4", "WEEK5"];

const totalOnsite = members.filter((m) =>
  weekFields.some((week) =>
    String(m[week] || "").toUpperCase().includes("ONSITE")
  )
).length;

const totalOnline = members.filter((m) =>
  weekFields.some((week) =>
    String(m[week] || "").toUpperCase().includes("ONLINE")
  )
).length;

/*const totalSundayAttendance = members.filter((m) =>
  weekFields.some((week) => {
    const value = String(m[week] || "").toUpperCase();
    return value.includes("ONSITE") || value.includes("ONLINE");
  })
).length; */


const countCategoryAttendance = (vineIds, attendance) =>
  members.filter((m) =>
    vineIds.includes(Number(m.v_id)) &&
    weekFields.some((week) =>
      String(m[week] || "")
        .toUpperCase()
        .includes(attendance.toUpperCase())
    )
  ).length;

const countCategoryTotal = (vineIds) =>
  members.filter((m) =>
    vineIds.includes(Number(m.v_id)) &&
    weekFields.some((week) => {
      const value = String(m[week] || "").toUpperCase();
      return value.includes("ONSITE") || value.includes("ONLINE");
    })
  ).length;

const totalSundayAttendance = members.filter((m) =>
  weekFields.some((week) => {
    const value = String(m[week] || "").toUpperCase();
    return value.includes("ONSITE") || value.includes("ONLINE");
  })
).length;

const countByVineCategory = (vineIds) =>
  members.filter((m) => vineIds.includes(Number(m.v_id))).length;

  // Sunday Attendance
/*
  const weekFields = ["WEEK1", "WEEK2", "WEEK3", "WEEK4", "WEEK5"];

const totalOnsite = members.reduce((total, member) => {
  return (
    total +
    weekFields.filter((week) =>
      String(member[week] || "")
        .toUpperCase()
        .includes("ONSITE")
    ).length
  );
}, 0);

const totalOnline = members.reduce((total, member) => {
  return (
    total +
    weekFields.filter((week) =>
      String(member[week] || "")
        .toUpperCase()
        .includes("ONLINE")
    ).length
  );
}, 0);



*/

  // =========================
  // TITLE (UNCHANGED STYLE)
  // =========================
  doc.setFontSize(14);
  doc.text("JESUS CHRIST SAVES GLOBAL OUTREACH", 105, 15, {
    align: "center",
  });

  doc.setFontSize(12);
  doc.text("CENTRAL PM REPORT", 105, 22, {
    align: "center",
  });

  doc.setFontSize(10);
  doc.text(`Vine: ${getVineName()}`, 14, 32);
  doc.text(`Month: ${selectedMonth}`, 14, 38);
  doc.text(`Date Exported: ${new Date().toLocaleDateString()}`, 145, 32);

  // =========================
  // SECTION I
  // =========================
  const churchTable = [
    ["I. Church Attendance",  "TOTAL"],
    ["2026 Target",  ""],
    ["Registered Disciples",  totalMembers],
    ["Youth Men",  countByVineCategory(YOUNG_MEN_VINES)],
["Youth Women",  countByVineCategory(YOUNG_WOMEN_VINES)],
["Men",  countByVineCategory(MEN_VINES)],
["Women",  countByVineCategory(WOMEN_VINES)],
  ];

    const sundayTable = [
    ["", "Onsite", "Online", "TOTAL"],
    ["Sunday Attendance", totalOnsite, totalOnline, totalSundayAttendance],
   [
  "Youth Men",
  countCategoryAttendance(YOUNG_MEN_VINES, "ONSITE"),
  countCategoryAttendance(YOUNG_MEN_VINES, "ONLINE"),
  countCategoryTotal(YOUNG_MEN_VINES),
],
[
  "Youth Women",
  countCategoryAttendance(YOUNG_WOMEN_VINES, "ONSITE"),
  countCategoryAttendance(YOUNG_WOMEN_VINES, "ONLINE"),
  countCategoryTotal(YOUNG_WOMEN_VINES),
],
[
  "Men",
  countCategoryAttendance(MEN_VINES, "ONSITE"),
  countCategoryAttendance(MEN_VINES, "ONLINE"),
  countCategoryTotal(MEN_VINES),
],
[
  "Women",
  countCategoryAttendance(WOMEN_VINES, "ONSITE"),
  countCategoryAttendance(WOMEN_VINES, "ONLINE"),
  countCategoryTotal(WOMEN_VINES),
],
  ];

  autoTable(doc, {
    startY: 42,
    head: [churchTable[0]],
    body: churchTable.slice(1),
    theme: "grid",
  });

  autoTable(doc, {
    startY: 97,
    head: [sundayTable[0]],
    body: sundayTable.slice(1),
    theme: "grid",
  });

  // =========================
  // SECTION II
  // =========================
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 5,
    head: [["II. New Believers", "Onsite", "Online", "TOTAL"]],
    body: [
      [
  "1st Timers",
  sumTimerAttendance("1ST_TIMER", "ONSITE"),
  sumTimerAttendance("1ST_TIMER", "ONLINE"),
  sumTimer("1ST_TIMER"),
],
      [
  "2nd Timers",
  sumTimerAttendance("2ND_TIMER", "ONSITE"),
  sumTimerAttendance("2ND_TIMER", "ONLINE"),
  sumTimer("2ND_TIMER"),
],
      [
  "3rd Timers",
  sumTimerAttendance("3RD_TIMER", "ONSITE"),
  sumTimerAttendance("3RD_TIMER", "ONLINE"),
  sumTimer("3RD_TIMER"),
],
      [
  "4th Timers",
  sumTimerAttendance("4TH_TIMER", "ONSITE"),
  sumTimerAttendance("4TH_TIMER", "ONLINE"),
  sumTimer("4TH_TIMER"),
],
      [
  "5th Timers / Conversion",
  sumTimerAttendance("5TH_TIMER", "ONSITE"),
  sumTimerAttendance("5TH_TIMER", "ONLINE"),
  sumTimer("5TH_TIMER"),
],
      [
  "Power Filled Life",
 "","",""
],
      [
  "Water Baptism",
  "","",""
],
    ],
    theme: "grid",
  });

  // =========================
  // SECTION III
  // =========================
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    head: [["III. Integration & Mobilization", "Onsite", "Online", "TOTAL"]],
    body: [
      ["Vine Servant Leaders", "", "", ""],
      ["Cluster Servant Leaders", "", "", ""],
      ["Care Leaders / Group", "", "", ""],
      ["Active Leadership/Groups for the week/month", "", "", ""],
      ["Total Active Disciples for the week/month", "", "", ""],
      ["",],
      ["FIELD",],
      ["Hayo/Evangelism", "", "", ""],
      ["Light House", "", "", ""],
      ["Field Care Group", "", "", ""],
      ["Field Care Disciples", "", "", ""],
      ["",],
      ["Follow-Up", "", "", ""],
      ["Reactivation", "", "", ""],
    ],
    theme: "grid",
  });

  // =========================
  // SECTION IV
  // =========================
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    head: [["IV. Other Ministries", "Onsite", "Online", "TOTAL"]],
    body: [
      ["Children's Church", "", "", ""],
      ["Barangay/Field Outreach", "", "", ""],
      ["Outreach Disciples", "", "", ""],
    ],
    theme: "grid",
  });

  // =========================
  // FOOTER
  // =========================
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    body: [
      ["NARRATIVE REPORT", "", "", ""],
      ["Submitted by:", "", ],
      ["Outreach/Family", "", "", ""],
    ],
    theme: "plain",
  });

// =========================
// PAGE 2 - DASHBOARD
// =========================
const chartW = 88;
const chartH = 60;

const leftX = 10;
const rightX = 110;

const topY = 28;
const bottomY = 105;

doc.addPage();

doc.setFontSize(18);
doc.text("ATTENDANCE GRAPH", 105, 15, {
  align: "center",
});

doc.setFontSize(10);
doc.text(selectedMonth, 105, 22, {
  align: "center",
});

const churchImage = await createChartImage({
  type: "bar",
  title: "Church Attendance",
  labels: [
    "Youth Men",
    "Youth Women",
    "Men",
    "Women",
  ],
  data: [
    countByVineCategory(YOUNG_MEN_VINES),
    countByVineCategory(YOUNG_WOMEN_VINES),
    countByVineCategory(MEN_VINES),
    countByVineCategory(WOMEN_VINES),
  ],
});


// ---------- Sunday Attendance ----------
const sundayImage = await createChartImage({
  type: "bar",
  title: "Sunday Attendance",
  labels: [
    "Youth Men",
    "Youth Women",
    "Men",
    "Women",
  ],
  data: [
    countCategoryTotal(YOUNG_MEN_VINES),
    countCategoryTotal(YOUNG_WOMEN_VINES),
    countCategoryTotal(MEN_VINES),
    countCategoryTotal(WOMEN_VINES),
  ],
});



// ---------- Registered Disciples ----------
const demographicsImage = await createChartImage({
  type: "pie",
  title: "Registered Disciples",
  labels: [
    "Youth Men",
    "Youth Women",
    "Men",
    "Women",
  ],
  data: [
    countByVineCategory(YOUNG_MEN_VINES),
    countByVineCategory(YOUNG_WOMEN_VINES),
    countByVineCategory(MEN_VINES),
    countByVineCategory(WOMEN_VINES),
  ],
});



// ---------- New Believers ----------
const believersImage = await createChartImage({
  type: "bar",
  title: "New Believers",
  labels: [
    "1st",
    "2nd",
    "3rd",
    "4th",
    "5th",
  ],
  data: [
    sumTimer("1ST_TIMER"),
    sumTimer("2ND_TIMER"),
    sumTimer("3RD_TIMER"),
    sumTimer("4TH_TIMER"),
    sumTimer("5TH_TIMER"),
  ],
});



// ---------- Other Ministries ----------
const ministryImage = await createChartImage({
  type: "bar",
  title: "Other Ministries",
  labels: [
    "Care",
    "Power",
    "Baptism",
    "Outreach",
  ],
  data: [
    sumField("CARE_GROUP_LEADER"),
    sumTimer("POWER_FILLED"),
    sumField("WATER_BAPTISM"),
    sumField("OUTREACH"),
  ],
});

// Top Left
doc.addImage(churchImage, "PNG", leftX, topY, chartW, chartH);

// Top Right
doc.addImage(sundayImage, "PNG", rightX, topY, chartW, chartH);

// Bottom Left
doc.addImage(believersImage, "PNG", leftX, bottomY, chartW, chartH);

// Bottom Right
doc.addImage(ministryImage, "PNG", rightX, bottomY, chartW, chartH);

 //export pdf
  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  window.open(url);
};
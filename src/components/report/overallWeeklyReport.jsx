import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { createChartImage } from "./chartToImage";
import { getSelectedWeekSunday } from "./weeklyReport";

export const generateCentralWeeklyReport = ({
  allData,
  vines,
  selectedMonth,
  selectedWeek,
  notify,
}) => {
  const doc = new jsPDF("p", "mm", "a4");

const YOUNG_WOMEN_VINES = [1, 23, 244, 140];
const YOUNG_MEN_VINES = [76, 120, 167];
const MEN_VINES = [1230,1361];
const WOMEN_VINES = [1236, 1255, 1283,1360];

// =========================
// HELPERS
// =========================

const members = allData || [];

const normalize = (value) =>
  String(value || "").trim().toUpperCase();

const isChecked = (val) =>
  val === true ||
  val === 1 ||
  val === "1" ||
  String(val).toLowerCase() === "yes" ||
  String(val).toLowerCase() === "true";

const totalMembers = members.length;

const countByVineCategory = (vineIds) =>
  members.filter((m) => vineIds.includes(Number(m.v_id))).length;

// -------------------------
// Sunday Attendance
// -------------------------

const totalOnsite = members.filter((m) =>
  normalize(m[selectedWeek]).includes("ONSITE")
).length;

const totalOnline = members.filter((m) =>
  normalize(m[selectedWeek]).includes("ONLINE")
).length;

const totalSundayAttendance = totalOnsite + totalOnline;

// -------------------------
// New Friends
// -------------------------

const sumTimer = (field) =>
  members.filter(
    (m) => normalize(m[field]) === normalize(selectedWeek)
  ).length;

const sumTimerAttendance = (field, attendance) =>
  members.filter((m) => {

    const timer =
      normalize(m[field]) === normalize(selectedWeek);

    const attended =
      normalize(m[selectedWeek]).includes(attendance);

    return timer && attended;

  }).length;

// -------------------------
// Categories
// -------------------------

const countCategoryAttendance = (vineIds, attendance) =>
  members.filter((m) =>
    vineIds.includes(Number(m.v_id)) &&
    normalize(m[selectedWeek]).includes(attendance)
  ).length;

const countCategoryTotal = (vineIds) =>
  members.filter((m) =>
    vineIds.includes(Number(m.v_id)) &&
    (
      normalize(m[selectedWeek]).includes("ONSITE") ||
      normalize(m[selectedWeek]).includes("ONLINE")
    )
  ).length;

// -------------------------
// CARE Activity
// -------------------------

const countTypeAttendance = (type, attendance) =>
  members.filter((m) => {

    const memberType =
      String(m.type || "").trim().toLowerCase() || "disciple";

    const attended =
      normalize(m[selectedWeek]).includes(attendance);

    return memberType === type.toLowerCase() && attended;

  }).length;

// -------------------------
// Weekly Activities
// -------------------------

    const selectedWeekNo =
  Number(selectedWeek.replace("WEEK", ""));

const sumWeeklyActivity = (prefix) =>
  members
    .filter(
      (m) => String(m.type || "").toLowerCase() === "vine"
    )
    .reduce(
      (sum, vine) =>
        sum + Number(vine[`${prefix}${selectedWeekNo}`] || 0),
      0
    );

    const activityStats = (prefix) => {
  const weeks = [1, 2, 3, 4, 5].map((w) =>
    sumActivityWeek(prefix, w)
  );

  const total = weeks.reduce((a, b) => a + b, 0);

  const count = weeks.filter((v) => v > 0).length;

  const average = count
    ? (total / count).toFixed(1)
    : 0;

  return {
    weeks,
    count,
    average,
    total,
  };
};

 

  const reportDate = getSelectedWeekSunday(selectedMonth, selectedWeek);


  // =========================
  // TITLE (UNCHANGED STYLE)
  // =========================
  doc.setFontSize(14);
  doc.text("JESUS CHRIST SAVES GLOBAL OUTREACH", 105, 15, {
    align: "center",
  });

  doc.setFontSize(12);
  doc.text("CENTRAL 3PM OVERALL WEEKLY REPORT", 105, 22, {
    align: "center",
  });

  doc.setFontSize(10);
  doc.text(`All Vines`, 14, 38);
  doc.text(`Week: ${reportDate}`, 14, 32);
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
  "-","-",
  sumTimer("POWER_FILLED"),
],
      [
  "Water Baptism",
  "-","-",
  sumTimer("WATER_BAPTISM"),
],
    ],
    theme: "grid",
  });

 const evangelism = sumWeeklyActivity("WEEK_EW");
const lighthouse = sumWeeklyActivity("WEEK_LH");
const fieldCareGroup = sumWeeklyActivity("WEEK_FCG");
const fieldCareDisciple = sumWeeklyActivity("WEEK_FCD");
const followUp = sumWeeklyActivity("WEEK_FU");
const reactivation = sumWeeklyActivity("WEEK_R");

const childrenChurch = sumWeeklyActivity("WEEK_CC");
const outreachGroup = sumWeeklyActivity("WEEK_OG");
const outreachDisciple = sumWeeklyActivity("WEEK_OD");

const registeredVineLeaders = members.filter(
  (m) =>
    String(m.type || "").toLowerCase() === "vine"
).length;

 // =========================
// SECTION III
// =========================
autoTable(doc, {
  startY: doc.lastAutoTable.finalY + 10,
  head: [["III. CARE Activity", "Onsite", "Online", "TOTAL"]],
  body: [
    [
      "Cluster Servants",
      countTypeAttendance("cluster", "ONSITE"),
      countTypeAttendance("cluster", "ONLINE"),
      countTypeAttendance("cluster", "ONSITE") +
        countTypeAttendance("cluster", "ONLINE"),
    ],
    [
      "CARE Leaders",
      countTypeAttendance("careleader", "ONSITE"),
      countTypeAttendance("careleader", "ONLINE"),
      countTypeAttendance("careleader", "ONSITE") +
        countTypeAttendance("careleader", "ONLINE"),
    ],
    [
      "CARE Disciples",
      countTypeAttendance("disciple", "ONSITE"),
      countTypeAttendance("disciple", "ONLINE"),
      countTypeAttendance("disciple", "ONSITE") +
        countTypeAttendance("disciple", "ONLINE"),
    ],
  ],
  theme: "grid",
});

// =========================
// SECTION IV
// =========================
autoTable(doc, {
  startY: doc.lastAutoTable.finalY + 400,
  head: [["IV. Other Activities", "", "", "TOTAL"]],
  body: [
    [
      "HAYO / Evangelism",
      "",
      "",
      sumWeeklyActivity("WEEK_EW"),
    ],
    [
      "Lighthouse",
      "",
      "",
      sumWeeklyActivity("WEEK_LH"),
    ],
    [
      "Field Caregroup",
      "",
      "",
      sumWeeklyActivity("WEEK_FCG"),
    ],
    [
      "Field Care Disciples",
      "",
      "",
      sumWeeklyActivity("WEEK_FCD"),
    ],
    [
      "Follow Up",
      "",
      "",
      sumWeeklyActivity("WEEK_FU"),
    ],
    [
      "Reactivation",
      "",
      "",
      sumWeeklyActivity("WEEK_R"),
    ],
  ],
  theme: "grid",
});

// =========================
// SECTION V
// =========================
autoTable(doc, {
  startY: doc.lastAutoTable.finalY + 10,
  head: [["V. Outreach", "", "", "TOTAL"]],
  body: [
    [
      "Children Church",
      "",
      "",
      sumWeeklyActivity("WEEK_CC"),
    ],
    [
      "Outreach Group",
      "",
      "",
      sumWeeklyActivity("WEEK_OG"),
    ],
    [
      "Outreach Disciples",
      "",
      "",
      sumWeeklyActivity("WEEK_OD"),
    ],
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


 //export pdf
  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  window.open(url);
};
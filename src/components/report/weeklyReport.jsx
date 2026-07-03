import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

  export const getSundaysOfMonth = (month) => {
  const year = new Date().getFullYear();
  const monthIndex = new Date(`${month} 1, ${year}`).getMonth();

  const sundays = [];
  const date = new Date(year, monthIndex, 1);

  while (date.getMonth() === monthIndex) {
    if (date.getDay() === 0) {
      sundays.push(new Date(date));
    }
    date.setDate(date.getDate() + 1);
  }

  return sundays;
};


  export const getSelectedWeekSunday = (month, week) => {
  const sundays = getSundaysOfMonth(month);

  const index = parseInt(week.replace("WEEK", "")) - 1;

  const target = sundays[index];

  if (!target) return `${month} (${week})`;

  const formatted = target.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return `${formatted} (${week})`;
};

export const generateVineWeeklyReport = ({
  members,
  selectedVine,
  vines,
  weekColumns,
  selectedMonth,
  selectedWeek,
  notify,
}) => {

  const doc = new jsPDF("p", "mm", "a4");

  // =========================
  // HELPERS
  // =========================
  const isChecked = (val) =>
    val === true ||
    val === 1 ||
    val === "1" ||
    String(val).toLowerCase() === "yes";

  const getVineName = () => {
    const vine = vines?.find((v) => v.id === selectedVine);

    // fallback: derive from members
    if (!vine && members?.length) {
      return `${members[0].first_name || ""} ${members[0].last_name || ""}`.trim();
    }

    return vine?.name || `Vine #${selectedVine || "Unknown"}`;
  };

const getWeekValue = (m, keyword) => {
  return String(m[selectedWeek] || "")
    .toUpperCase()
    .includes(keyword);
};


 // =========================
// TIMER HELPERS
// =========================

// Returns true if the member attended onsite/online during the selected week
const attendedThisWeek = (member, attendance) =>
  String(member[selectedWeek] || "")
    .toUpperCase()
    .includes(attendance.toUpperCase());

// Total members that reached the timer during the selected week
const normalize = (value) =>
  String(value || "").trim().toUpperCase();

const sumTimer = (field) =>
  members.filter(
    (m) => normalize(m[field]) === normalize(selectedWeek)
  ).length;

const sumTimerAttendance = (field, attendance) =>
  members.filter((m) => {
    const isTimer =
      normalize(m[field]) === normalize(selectedWeek);

    const attended =
      normalize(m[selectedWeek]).includes(attendance.toUpperCase());

    return isTimer && attended;
  }).length;

  const reportDate = getSelectedWeekSunday(selectedMonth, selectedWeek);

  const sumWeekField = (field) =>
  members.filter(
    (m) =>
      String(m[field] || "").toUpperCase() ===
      selectedWeek.toUpperCase()
  ).length;


  // =========================
  // HEADER
  // =========================
  doc.setFontSize(14);
  doc.text("VINE WEEKLY REPORT", 105, 15, { align: "center" });

  doc.setFontSize(11);
  doc.text(`Vine Name: ${getVineName()}`, 14, 25);
  doc.text(`Date: ${reportDate}`, 14, 32);

  // =========================
  // TABLE BUILDER (FIXED)
  // =========================
  const addSection = (title, rows) => {
    const startY = doc.lastAutoTable
      ? doc.lastAutoTable.finalY + 10
      : 45;

    doc.setFontSize(10);
    doc.text(title, 14, startY);

    autoTable(doc, {
      startY: startY + 2,
      head: [["", "Onsite/Actual", "Online", "TOTAL"]],
      body: rows,
      theme: "grid",
      styles: {
        fontSize: 9,
        cellPadding: 2,
      },
    });
  };

  // =========================
  // 1. SUNDAY ATTENDANCE
  // =========================
const onsite = members.filter((m) =>
  getWeekValue(m, "ONSITE")
).length;

const online = members.filter((m) =>
  getWeekValue(m, "ONLINE")
).length;

  addSection("1. Sunday Attendance", [
    ["", onsite, online, onsite + online],
  ]);

  // =========================
  // 2. NEW FRIENDS
  // =========================
  // =========================
// 2. NEW FRIENDS
// =========================
addSection("2. New Friends", [
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
    "5th Timers",
    sumTimerAttendance("5TH_TIMER", "ONSITE"),
    sumTimerAttendance("5TH_TIMER", "ONLINE"),
    sumTimer("5TH_TIMER"),
  ],

]);

  // =========================
  // 3. CARE ACTIVITY
  // =========================
 const countType = (type) =>
  members.filter(
    (m) =>
      String(m.type || "").toLowerCase() ===
      type.toLowerCase()
  ).length;

addSection("3. CARE Activity", [
  ["Cluster Servants", "", "", countType("cluster")],
  ["CARE Leaders", "", "", countType("careleader")],
  ["CARE Disciples", "", "", countType("disciple")],
]);

  // =========================
  // 4. HAYO / EVANGELISM
  // =========================
  addSection("4. Other Activities", [
    ["Hayo/Evangelism", "", "", sumWeekField("HAYO")],
    ["Prayer", "", "", sumWeekField("PRAYER")],
    ["Follow-up", "", "", sumWeekField("FOLLOWUP")],
    ["Reactivation", "", "", sumWeekField("REACTIVATION")],
    ["Field Care Group", "", "", sumWeekField("FIELD_CARE")],
    ["Field Disciple", "", "", sumWeekField("FIELD_CARE")],
    
  ]);

  // =========================
  // 5. Outreach
  // =========================
 addSection("4. Other Activities", [
  ["Hayo/Evangelism", "", "", sumWeekField("HAYO")],
  ["Prayer", "", "", sumWeekField("PRAYER")],
  ["Follow-up", "", "", sumWeekField("FOLLOWUP")],
  ["Reactivation", "", "", sumWeekField("REACTIVATION")],
  ["Field Care Group", "", "", sumWeekField("FIELD_CARE")],
  ["Field Disciple", "", "", sumWeekField("FIELD_DISCIPLES")],
]);

    // =========================
    // FOOTER
    // =========================
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 3,
      body: [
        ["Remarks:",],
      ],
      theme: "plain",
    });



  // =========================
  // EXPORT PDF
  // =========================
  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);

  window.open(url);

  notify?.success?.("Weekly report generated");
};
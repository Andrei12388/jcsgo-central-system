import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generateCentralMonthlyReport = ({
  allData,
  vines,
  selectedMonth,
}) => {
  const doc = new jsPDF("p", "mm", "a4");

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

const totalSundayAttendance = totalOnsite + totalOnline;

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

  // =========================
  // SECTION I
  // =========================
  const churchTable = [
    ["Church Attendance", "Onsite", "Online", "TOTAL"],
    ["2026 Target", "", "", ""],
    ["Registered Disciples", "", "", totalMembers],
    ["Youth Men", "", "", sumField("YOUTH_MEN")],
    ["Youth Women", "", "", sumField("YOUTH_WOMEN")],
    ["Men", "", "", sumField("MEN")],
    ["Women", "", "", sumField("WOMEN")],
  ];

    const sundayTable = [
    ["Sunday Attendance", "Onsite", "Online", "TOTAL"],
    ["Sunday Attendance", totalOnsite, totalOnline, totalSundayAttendance],
    ["Youth Men", "", "", sumField("SUNDAY_YOUTH_MEN")],
    ["Youth Women", "", "", sumField("SUNDAY_YOUTH_WOMEN")],
    ["Men", "", "", sumField("SUNDAY_MEN")],
    ["Women", "", "", sumField("SUNDAY_WOMEN")],
  ];

  autoTable(doc, {
    startY: 50,
    head: [churchTable[0]],
    body: churchTable.slice(1),
    theme: "grid",
  });

  autoTable(doc, {
    startY: 95,
    head: [sundayTable[0]],
    body: sundayTable.slice(1),
    theme: "grid",
  });

  // =========================
  // SECTION II
  // =========================
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    head: [["New Believers", "Onsite", "Online", "TOTAL"]],
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
  sumTimerAttendance("POWER_FILLED", "ONSITE"),
  sumTimerAttendance("POWER_FILLED", "ONLINE"),
  sumTimer("POWER_FILLED"),
],
      [
  "Water Baptism",
  "",
  "",
  sumField("WATER_BAPTISM"),
],
    ],
    theme: "grid",
  });

  // =========================
  // SECTION III
  // =========================
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    head: [["Integration & Mobilization", "Onsite", "Online", "TOTAL"]],
    body: [
      ["Care Leaders / Group", "", "", sumField("CARE_GROUP_LEADER")],
      ["Active Disciples", "", "", totalMembers],
    ],
    theme: "grid",
  });

  // =========================
  // SECTION IV
  // =========================
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    head: [["Other Ministries", "Onsite", "Online", "TOTAL"]],
    body: [
      ["Children's Church", "", "", sumField("CHILDREN")],
      ["Outreach Disciples", "", "", sumField("OUTREACH")],
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
      ["Submitted by:", "", "Date:", new Date().toLocaleDateString()],
      ["Outreach/Family", "", "", ""],
    ],
    theme: "plain",
  });

  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  window.open(url);
};
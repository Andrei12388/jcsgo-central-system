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
    ["Registered Disciples", "", "", totalMembers],

    ["Youth Men", "", "", sumField("YOUTH_MEN")],
    ["Youth Women", "", "", sumField("YOUTH_WOMEN")],
    ["Men", "", "", sumField("MEN")],
    ["Women", "", "", sumField("WOMEN")],

    ["Sunday Attendance", "", "", ""],
    ["Youth Men", "", "", sumField("SUNDAY_YOUTH_MEN")],
    ["Youth Women", "", "", sumField("SUNDAY_YOUTH_WOMEN")],
    ["Men", "", "", sumField("SUNDAY_MEN")],
    ["Women", "", "", sumField("SUNDAY_WOMEN")],
  ];

  autoTable(doc, {
    startY: 45,
    head: [churchTable[0]],
    body: churchTable.slice(1),
    theme: "grid",
  });

  // =========================
  // SECTION II
  // =========================
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    head: [["New Believers", "Onsite", "Online", "TOTAL"]],
    body: [
      ["1st Timers", "", "", sumField("1ST_TIMER")],
      ["2nd Timers", "", "", sumField("2ND_TIMER")],
      ["3rd Timers", "", "", sumField("3RD_TIMER")],
      ["4th Timers", "", "", sumField("4TH_TIMER")],
      ["5th Timers / Conversion", "", "", sumField("5TH_TIMER")],
      ["Power Filled Life", "", "", sumField("POWER_FILLED")],
      ["Water Baptism", "", "", sumField("WATER_BAPTISM")],
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
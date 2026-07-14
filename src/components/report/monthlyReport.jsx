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
const MEN_VINES = [1230,1361];
const WOMEN_VINES = [1236, 1255, 1283,1360];

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

  const activityPrefixes = {
  EW: "WEEK_EW",
  LH: "WEEK_LH",
  FCG: "WEEK_FCG",
  FCD: "WEEK_FCD",
  FU: "WEEK_FU",
  R: "WEEK_R",
  OG: "WEEK_OG", // if you have these
  OD: "WEEK_OD", // if you have these
};

const sumActivityWeek = (prefix, weekNo) =>
  members
    .filter(
      (m) => String(m.type || "").trim().toLowerCase() === "vine"
    )
    .reduce((sum, vine) => {
      return sum + Number(vine[`${prefix}${weekNo}`] || 0);
    }, 0);

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


//count active vine servant leaders
const countActiveVineServantLeaders = () => {
  const activeVines = new Set();

  members.forEach((m) => {
    const isVineLeader =
      String(m.type || "").toLowerCase() === "vine";

    const attended = weekFields.some((week) => {
      const value = String(m[week] || "").toUpperCase();
      return value.includes("ONSITE") || value.includes("ONLINE");
    });

    if (isVineLeader && attended) {
      activeVines.add(Number(m.v_id));
    }
  });

  return activeVines.size;
};

//count per week vine attendance
const countActiveVinesPerWeek = (week) => {
  const activeVines = new Set();

  members.forEach((m) => {
    const isVineLeader =
      String(m.type || "").toLowerCase() === "vine";

    const value = String(m[week] || "").toUpperCase();

    if (
      isVineLeader &&
      (value.includes("ONSITE") || value.includes("ONLINE"))
    ) {
      activeVines.add(Number(m.v_id));
    }
  });

  return activeVines.size;
};

const vineWk1 = countActiveVinesPerWeek("WEEK1");
const vineWk2 = countActiveVinesPerWeek("WEEK2");
const vineWk3 = countActiveVinesPerWeek("WEEK3");
const vineWk4 = countActiveVinesPerWeek("WEEK4");
const vineWk5 = countActiveVinesPerWeek("WEEK5");

const registeredVineLeaders = members.filter(
  (m) =>
    String(m.type || "").toLowerCase() === "vine"
).length;
const vineTotal = vineWk1 + vineWk2 + vineWk3 + vineWk4 + vineWk5;
const vineCount = [vineWk1, vineWk2, vineWk3, vineWk4, vineWk5].filter(v => v > 0).length;
const vineAverage = vineCount ? (vineTotal / vineCount).toFixed(1) : 0;

//Count cluster/careleader
// =========================
// CLUSTER / CARE LEADER COUNTS
// =========================

const uniqueCount = (field) => {
  return new Set(
    members
      .map((m) => String(m[field] || "").trim())
      .filter((v) => v !== "")
  ).size;
};

const totalClusterLeaders = members.filter(
  (m) =>
    String(m.type || "").toLowerCase() === "cluster"
).length;

const totalCareLeaders = members.filter(
  (m) =>
    String(m.type || "").toLowerCase() === "careleader"
).length;

const totalRegisteredClusters = members.filter(
  (m) =>
    m.is_reg &&
    String(m.type || "").toLowerCase() === "cluster"
).length;

const totalRegisteredCareLeaders = members.filter(
  (m) =>
    m.is_reg &&
    String(m.type || "").toLowerCase() === "careleader"
).length;

//active unique count

const countActiveLeaders = (type) => {
  return members.filter((m) => {
    const attended = weekFields.some((week) => {
      const value = String(m[week] || "").toUpperCase();
      return value.includes("ONLINE") || value.includes("ONSITE");
    });

    return (
      attended &&
      String(m.type || "").toLowerCase() === type.toLowerCase()
    );
  }).length;
};

const activeClusterLeaders = countActiveLeaders("cluster");
const activeCareLeaders = countActiveLeaders("care");
const activeVineLeaders = countActiveLeaders("vine");


//Count active leaders per week
// Count active Cluster Leaders per week
const countActiveClustersPerWeek = (week) => {
  return members.filter((m) => {
    const value = String(m[week] || "").toUpperCase();

    return (
      String(m.type || "").toLowerCase() === "cluster" &&
      (value.includes("ONSITE") || value.includes("ONLINE"))
    );
  }).length;
};

const clusterWk1 = countActiveClustersPerWeek("WEEK1");
const clusterWk2 = countActiveClustersPerWeek("WEEK2");
const clusterWk3 = countActiveClustersPerWeek("WEEK3");
const clusterWk4 = countActiveClustersPerWeek("WEEK4");
const clusterWk5 = countActiveClustersPerWeek("WEEK5");

const clusterTotal =
  clusterWk1 +
  clusterWk2 +
  clusterWk3 +
  clusterWk4 +
  clusterWk5;

const clusterCount =
  [clusterWk1, clusterWk2, clusterWk3, clusterWk4, clusterWk5]
    .filter((v) => v > 0).length;

const clusterAverage =
  clusterCount
    ? (clusterTotal / clusterCount).toFixed(1)
    : 0;


// Count active Care Leaders per week
const countActiveCareLeadersPerWeek = (week) => {
  return members.filter((m) => {
    const value = String(m[week] || "").toUpperCase();

    return (
      String(m.type || "").toLowerCase() === "careleader" &&
      (value.includes("ONSITE") || value.includes("ONLINE"))
    );
  }).length;
};

const careWk1 = countActiveCareLeadersPerWeek("WEEK1");
const careWk2 = countActiveCareLeadersPerWeek("WEEK2");
const careWk3 = countActiveCareLeadersPerWeek("WEEK3");
const careWk4 = countActiveCareLeadersPerWeek("WEEK4");
const careWk5 = countActiveCareLeadersPerWeek("WEEK5");

const careTotal =
  careWk1 +
  careWk2 +
  careWk3 +
  careWk4 +
  careWk5;

const careCount =
  [careWk1, careWk2, careWk3, careWk4, careWk5]
    .filter((v) => v > 0).length;

const careAverage =
  careCount
    ? (careTotal / careCount).toFixed(1)
    : 0;

//active disciples count
 const countTypeAttendance = (type, week, attendance) =>
  members.filter((m) => {
    const memberType =
      String(m.type || "").trim().toLowerCase() || "disciple";

    const attended = String(m[week] || "")
      .toUpperCase()
      .includes(attendance.toUpperCase());

    return memberType === type.toLowerCase() && attended;
  }).length;

const countType = (type, week) =>
  members.filter((m) => {
    const memberType =
      String(m.type || "").trim().toLowerCase() || "disciple";

    const value = String(m[week] || "").toUpperCase();

    return (
      memberType === type.toLowerCase() &&
      (value.includes("ONSITE") || value.includes("ONLINE"))
    );
  }).length;

const discipleWk1 = countType("disciple", "WEEK1");
const discipleWk2 = countType("disciple", "WEEK2");
const discipleWk3 = countType("disciple", "WEEK3");
const discipleWk4 = countType("disciple", "WEEK4");
const discipleWk5 = countType("disciple", "WEEK5");

const discipleTotal =
  discipleWk1 +
  discipleWk2 +
  discipleWk3 +
  discipleWk4 +
  discipleWk5;

const discipleCount =
  [discipleWk1, discipleWk2, discipleWk3, discipleWk4, discipleWk5]
    .filter((v) => v > 0).length;

const discipleAverage =
  discipleCount
    ? (discipleTotal / discipleCount).toFixed(1)
    : 0;

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
  doc.text("CENTRAL 3PM MONTHLY REPORT", 105, 22, {
    align: "center",
  });

  doc.setFontSize(10);
  //doc.text(`Vine: ${getVineName()}`, 14, 32);
  doc.text(`Month: ${selectedMonth}`, 14, 32);
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

  //section 3 computations
  const evangelism = activityStats("WEEK_EW");
const lighthouse = activityStats("WEEK_LH");
const fieldCareGroup = activityStats("WEEK_FCG");
const fieldCareDisciple = activityStats("WEEK_FCD");
const followUp = activityStats("WEEK_FU");
const reactivation = activityStats("WEEK_R");

// Optional
const childrenGroup = activityStats("WEEK_CC");
const outreachGroup = activityStats("WEEK_OG");
const outreachDisciple = activityStats("WEEK_OD");

  // =========================
  // SECTION III
  // =========================
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    head: [["III. Integration & Mobilization","Wk1","Wk2","Wk3","Wk4","Wk5", "Count", "Average", "TOTAL"]],
    body: [
      [
  `Vine Servant Leaders (${registeredVineLeaders})`,
  vineWk1,
  vineWk2,
  vineWk3,
  vineWk4,
  vineWk5,
  countActiveVineServantLeaders(),
  vineAverage,
  "",
],
      [
  `Cluster Servant Leaders (${totalClusterLeaders})`,
  clusterWk1,
  clusterWk2,
  clusterWk3,
  clusterWk4,
  clusterWk5,
  countActiveClustersPerWeek(),
  clusterAverage,
  "",
],
[
  `Care Leaders / Group (${totalCareLeaders})`,
  careWk1,
  careWk2,
  careWk3,
  careWk4,
  careWk5,
  countActiveCareLeadersPerWeek(),
  careAverage,
  "",
],
      ["Active Leaders/Groups for the week/month", "", "", ""],
      ["Total Active Disciples for the week/month", 
        discipleWk1,
    discipleWk2,
    discipleWk3,
    discipleWk4,
    discipleWk5,
    discipleCount,
    discipleAverage, 
    ""],
      ["",],
      ["",],
      [
  "HAYO / Evangelism",
  ...evangelism.weeks,
  evangelism.count,
  evangelism.average,
  evangelism.total,
],
[
  "Lighthouse",
  ...lighthouse.weeks,
  lighthouse.count,
  lighthouse.average,
  lighthouse.total,
],
[
  "Field Care Group",
  ...fieldCareGroup.weeks,
  fieldCareGroup.count,
  fieldCareGroup.average,
  fieldCareGroup.total,
],
[
  "Field Care Disciples",
  ...fieldCareDisciple.weeks,
  fieldCareDisciple.count,
  fieldCareDisciple.average,
  fieldCareDisciple.total,
],
[
  "Follow Up",
  ...followUp.weeks,
  followUp.count,
  followUp.average,
  followUp.total,
],
[
  "Reactivation",
  ...reactivation.weeks,
  reactivation.count,
  reactivation.average,
  reactivation.total,
],
    ],
    theme: "grid",
  });

  // =========================
  // SECTION IV
  // =========================
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    head: [["IV. Other Ministries","Wk1","Wk2","Wk3","Wk4","Wk5", "Count", "Average", "TOTAL"]],
    body: [
      [
  "Children Church",
  ...childrenGroup.weeks,
  childrenGroup.count,
  childrenGroup.average,
  childrenGroup.total,
],
     [
  "Outreach Group",
  ...outreachGroup.weeks,
  outreachGroup.count,
  outreachGroup.average,
  outreachGroup.total,
],
[
  "Outreach Disciples",
  ...outreachDisciple.weeks,
  outreachDisciple.count,
  outreachDisciple.average,
  outreachDisciple.total,
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
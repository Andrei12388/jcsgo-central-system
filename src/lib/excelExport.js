import * as XLSX from "xlsx";

const sanitizeSheetName = (name = "Sheet") =>
  String(name)
    .replace(/[\\/*?:\[\]]/g, " ")
    .trim()
    .slice(0, 31) || "Sheet";

const autoSizeColumns = (rows = []) => {
  if (!rows.length) return [];

  const columnCount = Math.max(...rows.map((row) => (Array.isArray(row) ? row.length : 0)));

  return Array.from({ length: columnCount }, (_, columnIndex) => {
    const maxLength = rows.reduce((longest, row) => {
      const value = Array.isArray(row) ? row[columnIndex] : "";
      const text = value == null ? "" : String(value);
      return Math.max(longest, text.length);
    }, 0);

    return { wch: Math.min(Math.max(maxLength + 2, 12), 40) };
  });
};

export const saveExcelWorkbook = (fileName, sheets = []) => {
  const workbook = XLSX.utils.book_new();

  sheets.forEach(({ name, rows }) => {
    const worksheet = XLSX.utils.aoa_to_sheet(rows || []);
    worksheet["!cols"] = autoSizeColumns(rows || []);
    XLSX.utils.book_append_sheet(workbook, worksheet, sanitizeSheetName(name));
  });

  const safeFileName = String(fileName || "report")
    .replace(/[<>:"/\\|?*]/g, "")
    .trim();

  XLSX.writeFile(workbook, `${safeFileName || "report"}.xlsx`);
};

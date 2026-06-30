const CONFIG = {
  SHEET_NAME: "FEBRUARY"
};

const MONTHS = [
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
  "DECEMBER"
];


function getSheet(month) {
  const sheetName = month && MONTHS.includes(String(month).trim().toUpperCase())
    ? String(month).trim().toUpperCase()
    : CONFIG.SHEET_NAME;

  return SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName(sheetName);
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * ✅ HEADERS ARE IN ROW 2 (FIXED)
 */
function getHeaders(sheet) {
  return sheet
    .getRange(2, 1, 1, sheet.getLastColumn())
    .getValues()[0]
    .map(h => String(h).trim());
}

/**
 * Helper: detect checkbox columns
 */
function isCheckbox(header) {
  return /week|sunday/i.test(header);
}

/**
 * GET ALL MEMBERS
 */
function getAllMembers(month) {

  const sheet = getSheet(month);

  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();

  // Row 2 = headers
  const headers = getHeaders(sheet);

  // Row 3+ = data
  const rows = sheet.getRange(3, 1, lastRow - 2, lastCol).getValues();

  return rows.map(row => {
    let obj = {};

    headers.forEach((header, index) => {
      obj[header] = row[index];
    });

    return obj;
  });
}

function getYearlyData() {
  const result = {};

  MONTHS.forEach(month => {
    const sheet = getSheet(month);

    if (!sheet) {
      result[month] = [];
      return;
    }

    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();

    const headers = getHeaders(sheet);

    const rows = sheet.getRange(3, 1, lastRow - 2, lastCol).getValues();

    result[month] = rows.map(row => {
      let obj = {};

      headers.forEach((header, index) => {
        obj[header] = row[index];
      });

      return obj;
    });
  });

  return result;
}

/**
 * FILTER BY V_ID
 */
function getMembersByVine(v_id, month) {
  const data = getAllMembers(month);

  const filtered = data.filter(row =>
    String(row.v_id) === String(v_id)
  );

  return {
    status: "success",
    data: filtered
  };
}

/**
 * ADD MEMBER
 */
function addMember(data) {

  // Always add to MASTERLIST
  const sheet = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName("MASTERLIST");

  const headers = getHeaders(sheet);

  const idValues = sheet
    .getRange(3, 1, Math.max(sheet.getLastRow() - 2, 1), 1)
    .getValues()
    .flat()
    .map(Number)
    .filter(n => !isNaN(n));

  const newId = idValues.length
    ? Math.max(...idValues) + 1
    : 1;

  const row = headers.map(header => {

    if (header === "id") return newId;

    if (isCheckbox(header)) {
      return Boolean(data[header]);
    }

    return data[header] ?? "";

  });

  sheet.appendRow(row);

  return {
    status: "success",
    id: newId
  };
}

/**
 * EDIT MEMBER
 */
function editMember(id, data) {

  const sheet = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName("MASTERLIST");

  const values = sheet.getDataRange().getValues();
  const headers = getHeaders(sheet);

  for (let i = 2; i < values.length; i++) {

    if (String(values[i][0]) === String(id)) {

      const row = values[i];

      headers.forEach((header, colIndex) => {

        if (header === "id") return;

        if (data[header] !== undefined) {

          row[colIndex] = isCheckbox(header)
            ? Boolean(data[header])
            : data[header];
        }

      });

      sheet
        .getRange(i + 1, 1, 1, row.length)
        .setValues([row]);

      return {
        status: "success",
        message: "Updated successfully"
      };
    }
  }

  return {
    status: "error",
    message: "Member not found"
  };
}

/**
 * DELETE MEMBER
 */
function deleteMember(id) {

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Delete from every monthly sheet
  MONTHS.forEach(month => {

    const sheet = ss.getSheetByName(month);
    if (!sheet) return;

    const values = sheet.getDataRange().getValues();

    // Search from bottom to top
    for (let i = values.length - 1; i >= 2; i--) {

      if (String(values[i][0]) === String(id)) {
        sheet.deleteRow(i + 1);
        break;
      }

    }

  });

  // Delete from MASTERLIST
  const masterSheet = ss.getSheetByName("MASTERLIST");
  const masterValues = masterSheet.getDataRange().getValues();

  for (let i = masterValues.length - 1; i >= 2; i--) {

    if (String(masterValues[i][0]) === String(id)) {

      masterSheet.deleteRow(i + 1);

      return {
        status: "success",
        message: "Member deleted successfully."
      };

    }

  }

  return {
    status: "error",
    message: "Member not found."
  };
}

function batchEdit(updates, month) {

  const monthSheet = getSheet(month);

  const masterSheet = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName("MASTERLIST");

  const monthValues = monthSheet.getDataRange().getValues();
  const monthHeaders = monthValues[1];

  const masterValues = masterSheet.getDataRange().getValues();
  const masterHeaders = masterValues[1];

  for (const rowId in updates) {

    const data = updates[rowId];

    // -----------------------
    // Update Monthly Sheet
    // -----------------------
    for (let i = 2; i < monthValues.length; i++) {

      if (String(monthValues[i][0]) === String(rowId)) {

        monthHeaders.forEach((header, col) => {

          // Skip names
          if (header === "first_name" || header === "last_name")
            return;

          if (data[header] !== undefined) {
            monthSheet
              .getRange(i + 1, col + 1)
              .setValue(data[header]);
          }

        });

        break;
      }
    }

    // -----------------------
    // Update MASTERLIST
    // -----------------------
    for (let i = 2; i < masterValues.length; i++) {

      if (String(masterValues[i][0]) === String(rowId)) {

        ["first_name", "last_name"].forEach(field => {

          if (data[field] !== undefined) {

            const col = masterHeaders.indexOf(field);

            if (col !== -1) {
              masterSheet
                .getRange(i + 1, col + 1)
                .setValue(data[field]);
            }

          }

        });

        break;
      }
    }

  }

  return {
    status: "success"
  };
}

/**
 * GET ALL (API)
 */
function doGet(e) {

  try {

    const action = e.parameter.action;

    if (action === "getAll") {
      return jsonResponse({
        status: "success",
        data: getAllMembers(e.parameter.month)
      });
    }

    if (action === "getByVine") {
      return jsonResponse(
        getMembersByVine(e.parameter.v_id, e.parameter.month)
      );
    }
    
    if (action === "getYearlyData") {
  return jsonResponse({
    status: "success",
    data: getYearlyData()
  });
}

    return jsonResponse({
      status: "error",
      message: "Invalid action"
    });

  } catch (err) {
    return jsonResponse({
      status: "error",
      message: err.toString()
    });
  }
}

/**
 * POST API
 */
function doPost(e) {

  try {

    const body = JSON.parse(e.postData.contents);

    switch (body.action) {

      case "add":
        return jsonResponse(addMember(body.data));

      case "edit":
        return jsonResponse(editMember(body.id, body.data));

      case "batchEdit":
        return jsonResponse(batchEdit(body.updates, body.month));

      case "delete":
        return jsonResponse(deleteMember(body.id));

      default:
        return jsonResponse({
          status: "error",
          message: "Invalid action"
        });
    }

  } catch (err) {
    return jsonResponse({
      status: "error",
      message: err.toString()
    });
  }
}
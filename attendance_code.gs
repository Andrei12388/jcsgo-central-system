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
function addMember(data, month) {

  const sheet = getSheet(month);
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
function editMember(id, data, month) {

  const sheet = getSheet(month);
  const values = sheet.getDataRange().getValues();

  const headers = getHeaders(sheet);

  for (let i = 2; i < values.length; i++) { 
    // i = 2 because row 1 header, row 2 header row, row 3 data start

    if (String(values[i][0]) === String(id)) {

      headers.forEach((header, colIndex) => {

        if (header === "id") return;

        if (data[header] !== undefined) {

          let value = data[header];

          if (isCheckbox(header)) {
            value = Boolean(value);
          }

          sheet
            .getRange(i + 1, colIndex + 1)
            .setValue(value);
        }
      });

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
function deleteMember(id, month) {

  const sheet = getSheet(month);
  const values = sheet.getDataRange().getValues();

  for (let i = 2; i < values.length; i++) {

    if (String(values[i][0]) === String(id)) {

      sheet.deleteRow(i + 1);

      return {
        status: "success"
      };
    }
  }

  return {
    status: "error",
    message: "Member not found"
  };
}

function batchEdit(updates, month) {
  const sheet = getSheet(month);
  const values = sheet.getDataRange().getValues();
  const headers = values[1]; // row 2 headers

  for (let i = 2; i < values.length; i++) {
    const rowId = values[i][0];

    if (updates[rowId]) {
      const data = updates[rowId];

      headers.forEach((h, colIndex) => {
        if (h === "id") return;

        if (data[h] !== undefined) {
          sheet.getRange(i + 1, colIndex + 1).setValue(data[h]);
        }
      });
    }
  }

  return { status: "success" };
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
        return jsonResponse(addMember(body.data, body.month));

      case "edit":
        return jsonResponse(editMember(body.id, body.data, body.month));

      case "batchEdit":
        return jsonResponse(batchEdit(body.updates, body.month));

      case "delete":
        return jsonResponse(deleteMember(body.id, body.month));

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
const CONFIG = {
  SHEET_NAME: "3PM"
};

function getSheet() {
  return SpreadsheetApp.getActive().getSheetByName(CONFIG.SHEET_NAME);
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function getAllData() {
  const sheet = getSheet();
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();

  if (lastRow < 2) return [];

  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

  return values.map(row => {
    let obj = {};

    headers.forEach((h, i) => {
      obj[h] = row[i];
    });

    return obj;
  });
}

function addMember(data) {
  const sheet = getSheet();

  const headers = sheet
    .getRange(1, 1, 1, sheet.getLastColumn())
    .getValues()[0];

  // Get all IDs from Column A
  const idValues = sheet
    .getRange(2, 1, Math.max(sheet.getLastRow() - 1, 1), 1)
    .getValues()
    .flat();

  // Convert to numbers and remove invalid values
  const numericIds = idValues
    .map(id => Number(id))
    .filter(id => !isNaN(id));

  // Find latest ID
  const latestId = numericIds.length > 0
    ? Math.max(...numericIds)
    : 0;

  // Increment
  const newId = latestId + 1;

  // Build row
  const row = headers.map(h => {
    if (h === "id") return newId;
    return data[h] || "";
  });

  sheet.appendRow(row);

  return {
    status: "success",
    id: newId
  };
}

function editMember(id, data) {
  const sheet = getSheet();
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const values = sheet.getDataRange().getValues();

  const cleanId = String(id).trim();

  for (let i = 1; i < values.length; i++) {
    const rowId = String(values[i][0]).trim();

    if (rowId === cleanId) {

      headers.forEach((h, j) => {
        if (h === "id") return;

        // ONLY update if value exists AND not undefined
        const value = data[h];

        if (value !== undefined && value !== null) {
          sheet.getRange(i + 1, j + 1).setValue(value);
        }
      });

      return {
        status: "success",
        message: "Member updated"
      };
    }
  }

  return {
    status: "error",
    message: "ID not found"
  };
}

function deleteMember(id) {
  const sheet = getSheet();
  const values = sheet.getDataRange().getValues();

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { status: "success", message: "Member deleted" };
    }
  }

  return { status: "error", message: "ID not found" };
}

function searchMember(query) {
  const data = getAllData();
  const q = String(query).toLowerCase();

  const result = data.filter(row =>
    Object.values(row).some(val =>
      String(val).toLowerCase().includes(q)
    )
  );

  return {
    status: "success",
    data: result
  };
}

function getEvents() {
  const sheet = SpreadsheetApp.getActive().getSheetByName("EVENTS");
  const values = sheet.getDataRange().getValues();

  const headers = values[0];

  const data = values.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });

  return data;
}

function addEvent(data) {
  const sheet = SpreadsheetApp.getActive().getSheetByName("EVENTS");

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  const idValues = sheet.getRange(2, 1, Math.max(sheet.getLastRow() - 1, 1), 1)
    .getValues()
    .flat();

  const numericIds = idValues.map(Number).filter(n => !isNaN(n));
  const newId = numericIds.length ? Math.max(...numericIds) + 1 : 1;

  const row = headers.map(h => {
    if (h === "id") return newId;
    return data[h] || "";
  });

  sheet.appendRow(row);

  return {
    status: "success",
    id: newId
  };
}

function editEvent(id, data) {
  const sheet = SpreadsheetApp.getActive().getSheetByName("EVENTS");
  const values = sheet.getDataRange().getValues();
  const headers = values[0];

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(id)) {

      headers.forEach((h, j) => {
        if (h === "id") return;
        if (data[h] !== undefined) {
          sheet.getRange(i + 1, j + 1).setValue(data[h]);
        }
      });

      return { status: "success", message: "Event updated" };
    }
  }

  return { status: "error", message: "Not found" };
}

function deleteEvent(id) {
  const sheet = SpreadsheetApp.getActive().getSheetByName("EVENTS");
  const values = sheet.getDataRange().getValues();

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { status: "success" };
    }
  }

  return { status: "error", message: "Not found" };
}

function doGet(e) {
  try {
    const type = e.parameter.type;

    if (type === "events") {
      return jsonResponse({
        status: "success",
        data: getEvents()
      });
    }

    return jsonResponse({
      status: "success",
      data: getAllData()
    });

  } catch (err) {
    return jsonResponse({
      status: "error",
      message: err.toString()
    });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);

    switch (body.action) {

      case "add":
        return jsonResponse(addMember(body.data));

      case "edit":
        return jsonResponse(editMember(body.id, body.data));

      case "delete":
        return jsonResponse(deleteMember(body.id));

      case "search":
        return jsonResponse(searchMember(body.query));

      case "addEvent":
        return jsonResponse(addEvent(body.data));

      case "editEvent":
       return jsonResponse(editEvent(body.id, body.data));

      case "deleteEvent":
       return jsonResponse(deleteEvent(body.id));

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
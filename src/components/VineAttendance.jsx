import React, { useEffect, useState } from "react";


export default function VineAttendance({ webAppUrl, time }) {
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

  const [allData, setAllData] = useState([]);
  const [vines, setVines] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[new Date().getMonth()]);
  const [selectedVine, setSelectedVine] = useState("");
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [weekColumns, setWeekColumns] = useState([]);
  const [savedFlash, setSavedFlash] = useState(false);

  const [originalData, setOriginalData] = useState({});
  const [dirtyRows, setDirtyRows] = useState({});

  const [editBuffer, setEditBuffer] = useState({});
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [newMemberForm, setNewMemberForm] = useState({ first_name: "", last_name: "", v_id: "" });



const getDiff = (id, updates) => {
  const original = originalData[id] || {};
  const diff = {};

  Object.keys(updates).forEach((key) => {
    if (updates[key] !== original[key]) {
      diff[key] = updates[key];
    }
  });

  return diff;
};

  useEffect(() => {
  let isMounted = true;

  (async () => {
    setLoading(true); // 👈 start loading immediately on month change

    try {
      const data = await fetchAll();

      if (!isMounted) return;

      setAllData(data);

      const vineRows = data.filter((r) => {
        const val = r.is_vine;
        return (
          val === true ||
          val === 1 ||
          String(val).toLowerCase() === "true" ||
          String(val).toLowerCase() === "yes" ||
          String(val).toLowerCase() === "1"
        );
      });

      const uniqMap = new Map();

      vineRows.forEach((v) => {
        const id = String(v.v_id || "").trim();
        if (!id) return;

        if (!uniqMap.has(id)) {
          uniqMap.set(id, {
            id,
            name: `${v.first_name || ""} ${v.last_name || ""}`.trim() || `#${id}`
          });
        }
      });

      setVines(Array.from(uniqMap.values()));

    } catch (err) {
      console.error(err);
      setVines([]);
    } finally {
      if (isMounted) setLoading(false); // 👈 stop loading
    }
  })();

  return () => {
    isMounted = false;
  };
}, [webAppUrl, time, selectedMonth]);

  const handleSelect = (e) => {
    const id = e.target.value;
    setSelectedVine(id);
  };

  useEffect(() => {
    if (!selectedVine) {
      setMembers([]);
      setWeekColumns([]);
      setOriginalData({});
      setDirtyRows({});
      setEditBuffer({});
      return;
    }

    const rows = allData.filter((r) => String(r.v_id || "").trim() === String(selectedVine).trim());

    if (!rows.length) {
      setMembers([]);
      setWeekColumns([]);
      return;
    }

    const rawKeys = Object.keys(rows[0]);
    const weekCols = rawKeys.filter((k) => /^WEEK/i.test(k.replace(/\s+/g, "")));

    setWeekColumns(weekCols);
    setMembers(rows);

    const originalMap = {};
    rows.forEach((r) => {
      originalMap[r.id] = { ...r };
    });

    setOriginalData(originalMap);
    setDirtyRows({});
    setEditBuffer({});
  }, [selectedVine, allData]);

  const isChecked = (val) =>
    val === true ||
    val === 1 ||
    val === "1" ||
    String(val).toLowerCase() === "true" ||
    String(val).toLowerCase() === "yes";

  // Separate caregroup weeks from Sunday attendance weeks
  const careGroupWeeks = weekColumns.filter((wk) => /^WEEK_/i.test(wk));
  const sundayWeeks = weekColumns.filter((wk) => /^WEEK\d+$/i.test(wk));

  // =========================
  // 🔥 BUFFER HANDLER
  // =========================

  

const updateBuffer = (memberId, field, value) => {
  setEditBuffer((prev) => {
    const updated = {
      ...prev,
      [memberId]: {
        ...(prev[memberId] || {}),
        [field]: value
      }
    };

    // mark row as dirty
    setDirtyRows((d) => ({
      ...d,
      [memberId]: true
    }));

    return updated;
  });
};

  // =========================
  // 🚀 BATCH SAVE (NEW)
  // =========================

 const saveAllChanges = async () => {
  if (!Object.keys(editBuffer).length) return;

  setSaving(true);

  try {
    const optimizedUpdates = {};

    Object.keys(editBuffer).forEach((id) => {
      const diff = getDiff(id, editBuffer[id]);

      if (Object.keys(diff).length > 0) {
        optimizedUpdates[id] = diff;
      }
    });

    await fetch(webAppUrl, {
      method: "POST",
      body: JSON.stringify({
        action: "batchEdit",
        month: selectedMonth,
        updates: optimizedUpdates
      })
    });

    const refreshed = await fetchAll();
    setAllData(refreshed);
    setEditBuffer({});
    setDirtyRows({});
  } catch (err) {
    console.error(err);
  } finally {
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
    setSaving(false);
  }
};

  const deleteMember = async (memberId, memberName) => {
    if (!window.confirm(`Are you sure you want to delete ${memberName}?`)) {
      return;
    }

    setSaving(true);
    try {
      await fetch(webAppUrl, {
        method: "POST",
        body: JSON.stringify({
          action: "delete",
          id: memberId,
          month: selectedMonth
        })
      });

      const refreshed = await fetchAll();
      setAllData(refreshed);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1500);
    } catch (err) {
      console.error(err);
      alert("Error deleting member");
    } finally {
      setSaving(false);
      setShowDeleteConfirm(null);
    }
  };

  const addMember = async () => {
    if (!newMemberForm.first_name.trim()) {
      alert("Please enter at least a first name");
      return;
    }

    setSaving(true);
    try {
      await fetch(webAppUrl, {
        method: "POST",
        body: JSON.stringify({
          action: "add",
          month: selectedMonth,
          data: {
            v_id: newMemberForm.v_id,
            first_name: newMemberForm.first_name,
            last_name: newMemberForm.last_name
          }
        })
      });

      setNewMemberForm({ first_name: "", last_name: "", v_id: "" });
      const refreshed = await fetchAll();
      setAllData(refreshed);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1500);
    } catch (err) {
      console.error(err);
      alert("Error adding member");
    } finally {
      setSaving(false);
    }
  };

  const fetchAll = async () => {
    const url =
      `${webAppUrl}?action=getAll${
        time ? `&time=${encodeURIComponent(time)}` : ""
      }&month=${encodeURIComponent(selectedMonth)}`;

    const res = await fetch(url);
    const json = await res.json();
    return json.data || [];
  };

  return (
    <div className="vine-attendance" style={{ padding: 12,  borderRadius: 8 }}>
      {savedFlash && <div className="vine-attendance__flash">✓ Saved!</div>}
      <h3>JCSGO 3PM Vine Attendance 2026</h3>

      {/* MONTH BUTTONS */}
      <div className="vine-attendance__month-buttons" style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
        {MONTHS.map((month) => (
          <button
            key={month}
            type="button"
            onClick={() => {
              setSelectedMonth(month);
              setSelectedVine("");
              setMembers([]);
              setWeekColumns([]);
              setEditBuffer({});
            }}
            style={{
              padding: "6px 10px",
              borderRadius: 4,
              border: month === selectedMonth ? "2px solid #2563eb" : "1px solid #d1d5db",
             
              cursor: "pointer"
            }}
          >
            {month}
          </button>
        ))}
      </div>

      {/* CONTROLS */}
      <div className="vine-attendance__controls" style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <select value={selectedVine} onChange={handleSelect} disabled={loading}>
          <option value="">
            {loading ? "-- Loading vines --" : "-- Select Vine --"}
          </option>
          {vines.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name} (ID: {v.id})
            </option>
          ))}
        </select>

        <button
          onClick={() => {
            setSelectedVine("");
            setMembers([]);
            setWeekColumns([]);
            setEditBuffer({});
          }}
        >
          Clear
        </button>

        {/* SAVE ALL BUTTON */}
        <button
          onClick={saveAllChanges}
          disabled={saving}
          style={{
            background: "green",
            color: "white",
            padding: "6px 10px",
            borderRadius: 4,
            cursor: saving ? "not-allowed" : "pointer"
          }}
        >
          {saving ? "Saving..." : "Save All Changes"}
        </button>
      </div>

      {/* LOADING SPINNER */}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div className="spinner"></div>
          <span>Loading members…</span>
        </div>
      )}

      
      {/* ADD MEMBER FORM */}
      {selectedVine && members.length > 0 && !loading &&(
        <div style={{ 
          marginBottom: 16, 
          padding: 12, 
         
          borderRadius: 4,
         
        }}>
          <h4 style={{ marginTop: 0 }}>Add New Member</h4>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="Vine ID"
              value={newMemberForm.v_id}
              onChange={(e) => setNewMemberForm({ ...newMemberForm, v_id: e.target.value })}
              style={{ padding: "6px 8px", borderRadius: 4,}}
            />
            <input
              type="text"
              placeholder="First Name"
              value={newMemberForm.first_name}
              onChange={(e) => setNewMemberForm({ ...newMemberForm, first_name: e.target.value })}
              style={{ padding: "6px 8px", borderRadius: 4,}}
            />
            <input
              type="text"
              placeholder="Last Name"
              value={newMemberForm.last_name}
              onChange={(e) => setNewMemberForm({ ...newMemberForm, last_name: e.target.value })}
              style={{ padding: "6px 8px", borderRadius: 4,}}
            />
            <button
              onClick={addMember}
              disabled={saving}
              style={{
                background: "blue",
                color: "white",
                padding: "6px 12px",
                borderRadius: 4,
                cursor: saving ? "not-allowed" : "pointer"
              }}
            >
              Add Member
            </button>
          </div>
        </div>
      )}

      {members.length > 0 && !loading && (
        <div className="vine-attendance__table-wrap">
          <table className="vine-attendance__table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr >
                <th style={{ padding: 8,  textAlign: "left" }}>ID</th>
                <th style={{ padding: 8,  textAlign: "left" }}>Name</th>
                
                {sundayWeeks.length > 0 && (
                  <th colSpan={sundayWeeks.length} style={{ padding: 8,  textAlign: "center", }}>Sunday Attendance</th>
                )}
              {careGroupWeeks.length > 0 && (
                <th colSpan={careGroupWeeks.length} style={{ padding: 8,  textAlign: "center",  }}>Caregroup</th>
              )}
              <th style={{ padding: 8,  textAlign: "center" }}>Action</th>
            </tr>
            <tr >
              <th style={{ padding: 8, }}></th>
              <th style={{ padding: 8, }}></th>
              {careGroupWeeks.map((wk) => (
                <th key={wk} style={{ padding: 8,  textAlign: "center", fontSize: "12px" }}>{wk}</th>
              ))}
              {sundayWeeks.map((wk) => (
                <th key={wk} style={{ padding: 8,  textAlign: "center", fontSize: "12px" }}>{wk}</th>
              ))}
              <th style={{ padding: 8, }}></th>
            </tr>
          </thead>

          <tbody>
            {members.map((m) => (
              <tr
                key={m.id}
               
              >
                <td style={{ padding: 8, }} data-label="ID">{m.id}</td>

                {/* NAME BUFFER */}
                <td style={{ padding: 8, }} data-label="Name">
                  <input
                    defaultValue={`${m.first_name || ""} ${m.last_name || ""}`}
                    onChange={(e) => {
                      const [first, ...rest] = e.target.value.split(" ");
                      updateBuffer(m.id, "first_name", first || "");
                      updateBuffer(m.id, "last_name", rest.join(" ") || "");
                    }}
                    style={{ width: "100%", padding: "4px", borderRadius: 4,}}
                  />
                </td>

                {/* SUNDAY WEEKS - DROPDOWNS (ONLINE/ONSITE) */}
                {sundayWeeks.map((wk) => (
                  <td key={wk} style={{ textAlign: "center", padding: 8}} data-label={wk}>
                    <select
                      value={editBuffer[m.id]?.[wk] ?? m[wk] ?? ""}
                      onChange={(e) => updateBuffer(m.id, wk, e.target.value)}
                      style={{ 
                        padding: "4px 6px", 
                        borderRadius: 4, 
                        minWidth: 80
                      }}
                    >
                      <option value="">--</option>
                      <option value="ONLINE">ONLINE</option>
                      <option value="ONSITE">ONSITE</option>
                    </select>
                  </td>
                ))}

                 {/* CAREGROUP WEEKS - CHECKBOXES */}
                {careGroupWeeks.map((wk) => (
                  <td key={wk} style={{ textAlign: "center", padding: 8 }} data-label={wk}>
                    <input
                      type="checkbox"
                      checked={editBuffer[m.id]?.[wk] !== undefined ? editBuffer[m.id]?.[wk] : isChecked(m[wk])}
                      onChange={(e) => updateBuffer(m.id, wk, e.target.checked)}
                    />
                  </td>
                ))}

                {/* DELETE BUTTON */}
                <td style={{ textAlign: "center", padding: 8, }}>
                  <button
                    onClick={() => deleteMember(m.id, `${m.first_name} ${m.last_name}`)}
                    disabled={saving}
                    style={{
                      background: "#ff4444",
                      color: "white",
                      padding: "4px 8px",
                      borderRadius: 4,
                      border: "none",
                      cursor: saving ? "not-allowed" : "pointer",
                      fontSize: "12px"
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
}
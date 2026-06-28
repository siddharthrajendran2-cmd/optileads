import React, { useState, useEffect } from "react";
import { getVisits, updateLead, exportCSV } from "../api";

const STATUS_OPTIONS = ["Interested", "Not Interested", "Follow Up", "Converted"];
const STATUS_COLORS = {
  "Interested": "bg-blue-100 text-blue-700 border-blue-300",
  "Not Interested": "bg-red-100 text-red-700 border-red-300",
  "Follow Up": "bg-amber-100 text-amber-700 border-amber-300",
  "Converted": "bg-emerald-100 text-emerald-700 border-emerald-300",
  "": "bg-gray-100 text-gray-500 border-gray-300",
};

const PRIORITY_DOT = { HIGH: "bg-emerald-500", MEDIUM: "bg-amber-400", LOW: "bg-gray-400" };

export default function VisitTrackerPage() {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [editingNote, setEditingNote] = useState(null);
  const [noteText, setNoteText] = useState("");

  useEffect(() => {
    loadVisits();
  }, []);

  async function loadVisits() {
    setLoading(true);
    const data = await getVisits();
    setVisits(data.visits || []);
    setLoading(false);
  }

  async function handleStatusChange(place_id, status) {
    await updateLead(place_id, { status });
    setVisits((prev) => prev.map((v) => v.place_id === place_id ? { ...v, status } : v));
  }

  async function handleNoteSave(place_id) {
    await updateLead(place_id, { note: noteText });
    setVisits((prev) => prev.map((v) => v.place_id === place_id ? { ...v, note: noteText } : v));
    setEditingNote(null);
  }

  const filtered = filterStatus === "ALL" ? visits : visits.filter((v) => v.status === filterStatus);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1B4F72]">Visit Tracker</h1>
          <p className="text-gray-500 text-sm">{visits.length} total visits</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {["ALL", ...STATUS_OPTIONS].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                filterStatus === s
                  ? "bg-[#1B4F72] text-white border-[#1B4F72]"
                  : "bg-white text-gray-600 border-gray-300 hover:border-[#1B4F72]"
              }`}
            >
              {s === "ALL" ? `All (${visits.length})` : `${s} (${visits.filter(v => v.status === s).length})`}
            </button>
          ))}
          {visits.length > 0 && (
            <button
              onClick={() => exportCSV(visits)}
              className="text-xs border border-[#17A589] text-[#17A589] hover:bg-teal-50 px-3 py-1.5 rounded-full font-medium transition-colors"
            >
              Export CSV
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="text-center py-16 text-gray-400">
          <svg className="animate-spin w-8 h-8 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading...
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="font-medium">No visits yet</p>
          <p className="text-sm mt-1">Mark leads as visited from the Search page</p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((v) => (
          <div key={v.place_id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[v.priority] || "bg-gray-400"}`} />
                  <h3 className="font-semibold text-[#1B4F72] truncate">{v.name}</h3>
                </div>
                <p className="text-gray-500 text-xs ml-4">{v.address}</p>
                <div className="flex flex-wrap gap-2 mt-2 ml-4">
                  <span className="text-xs bg-blue-50 text-[#1B4F72] border border-blue-200 px-2 py-0.5 rounded-full">{v.facility_type || "Facility"}</span>
                  <span className="text-xs text-gray-400">📅 {v.visit_date || "—"}</span>
                  {v.city && <span className="text-xs text-gray-400">📍 {v.city}</span>}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_COLORS[v.status || ""]}`}>
                  {v.status || "No Status"}
                </span>
                <select
                  value={v.status || ""}
                  onChange={(e) => handleStatusChange(v.place_id, e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#17A589]/50"
                >
                  <option value="">Update status...</option>
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Note section */}
            <div className="mt-3 ml-4">
              {editingNote === v.place_id ? (
                <div>
                  <textarea
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#17A589]/50 resize-none"
                    rows={3}
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Add a note..."
                  />
                  <div className="flex gap-2 mt-1">
                    <button onClick={() => handleNoteSave(v.place_id)} className="text-xs bg-[#17A589] text-white px-3 py-1 rounded-lg hover:bg-teal-700">Save</button>
                    <button onClick={() => setEditingNote(null)} className="text-xs text-gray-500 px-3 py-1 rounded-lg hover:bg-gray-100">Cancel</button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => { setEditingNote(v.place_id); setNoteText(v.note || ""); }}
                  className="cursor-pointer"
                >
                  {v.note ? (
                    <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 italic hover:bg-gray-100 transition-colors">
                      "{v.note}" <span className="not-italic text-[#17A589] font-medium">Edit</span>
                    </p>
                  ) : (
                    <p className="text-xs text-[#17A589] hover:underline">+ Add note</p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

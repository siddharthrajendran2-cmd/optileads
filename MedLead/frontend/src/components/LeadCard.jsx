import React, { useState, useEffect } from "react";
import { markVisited, updateLead } from "../api";

const PRIORITY_COLORS = {
  HIGH: "bg-emerald-100 text-emerald-800 border border-emerald-300",
  MEDIUM: "bg-amber-100 text-amber-800 border border-amber-300",
  LOW: "bg-slate-100 text-slate-600 border border-slate-300",
};

const STATUS_OPTIONS = ["Interested", "Not Interested", "Follow Up", "Converted"];

export default function LeadCard({ lead, onUpdate }) {
  const [visited, setVisited] = useState(lead.visited);
  const [status, setStatus] = useState(lead.status || "");
  const [note, setNote] = useState(lead.note || "");
  const [showNote, setShowNote] = useState(false);
  const [saving, setSaving] = useState(false);
  const [details, setDetails] = useState(null);
  const [showHours, setShowHours] = useState(false);

  useEffect(() => {
    if (!lead.place_id) return;
    fetch(`/api/details/${lead.place_id}`)
      .then((r) => r.json())
      .then(setDetails)
      .catch(() => {});
  }, [lead.place_id]);

  async function handleVisit() {
    setSaving(true);
    await markVisited(lead);
    setVisited(true);
    onUpdate && onUpdate({ ...lead, visited: true });
    setSaving(false);
  }

  async function handleStatusChange(e) {
    const val = e.target.value;
    setStatus(val);
    await updateLead(lead.place_id, { status: val });
    onUpdate && onUpdate({ ...lead, status: val });
  }

  async function handleNoteSave() {
    await updateLead(lead.place_id, { note });
    setShowNote(false);
    onUpdate && onUpdate({ ...lead, note });
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border ${visited ? "border-[#17A589]/40" : "border-gray-200"} p-5 hover:shadow-md transition-shadow`}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[#1B4F72] text-base leading-tight truncate" title={lead.name}>
            {lead.name}
          </h3>
          <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{lead.address}</p>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${PRIORITY_COLORS[lead.priority]}`}>
          {lead.priority}
        </span>
      </div>

      {/* Badges row */}
      <div className="flex flex-wrap gap-2 mb-3">
        <span className="text-xs bg-blue-50 text-[#1B4F72] border border-blue-200 px-2 py-0.5 rounded-full font-medium">
          {lead.facility_type}
        </span>
        {lead.rating && (
          <span className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded-full flex items-center gap-1">
            ★ {lead.rating} ({lead.total_ratings?.toLocaleString() || 0})
          </span>
        )}
        {lead.distance_km != null && (
          <span className="text-xs bg-gray-50 text-gray-600 border border-gray-200 px-2 py-0.5 rounded-full">
            {lead.distance_km} km away
          </span>
        )}
        {details?.open_now === true && (
          <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
            Open now
          </span>
        )}
        {details?.open_now === false && (
          <span className="text-xs bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full font-medium">
            Closed
          </span>
        )}
        {visited && (
          <span className="text-xs bg-teal-50 text-[#17A589] border border-teal-200 px-2 py-0.5 rounded-full font-medium">
            ✓ Visited
          </span>
        )}
      </div>

      {/* Contact details */}
      <div className="border-t border-gray-100 mt-3 pt-3 space-y-2">
        {/* Phone — most important, shown prominently */}
        {details === null ? (
          <div className="h-5 bg-gray-100 rounded animate-pulse w-40" />
        ) : details?.phone ? (
          <a
            href={`tel:${details.phone}`}
            className="flex items-center gap-2 group"
          >
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#1B4F72] flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 7V5z" />
              </svg>
            </span>
            <span className="text-sm font-semibold text-[#1B4F72] group-hover:underline">{details.phone}</span>
          </a>
        ) : details !== null && (
          <p className="text-xs text-gray-400 flex items-center gap-2">
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 7V5z" />
              </svg>
            </span>
            No phone listed
          </p>
        )}

        {/* Website + Maps row */}
        {details !== null && (details?.website || details?.maps_url) && (
          <div className="flex items-center gap-3 flex-wrap">
            {details?.website && (
              <a
                href={details.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-[#2E86C1] hover:underline"
              >
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
                </svg>
                Website
              </a>
            )}
            {details?.maps_url && (
              <a
                href={details.maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-[#2E86C1] hover:underline"
              >
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Open in Maps
              </a>
            )}
            {details?.weekday_text?.length > 0 && (
              <button
                onClick={() => setShowHours(!showHours)}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#1B4F72]"
              >
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {showHours ? "Hide hours" : "Hours"}
              </button>
            )}
          </div>
        )}

        {/* Opening hours dropdown */}
        {showHours && details?.weekday_text?.length > 0 && (
          <div className="bg-gray-50 rounded-lg px-3 py-2 space-y-0.5">
            {details.weekday_text.map((line, i) => {
              const [day, ...rest] = line.split(": ");
              return (
                <p key={i} className="text-xs text-gray-600">
                  <span className="font-medium w-24 inline-block">{day}</span>
                  <span className="text-gray-500">{rest.join(": ")}</span>
                </p>
              );
            })}
          </div>
        )}
      </div>

      {/* Status dropdown (only if visited) */}
      {visited && (
        <div className="mt-3 mb-3">
          <select
            value={status}
            onChange={handleStatusChange}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#17A589]/50"
          >
            <option value="">Set Status...</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      )}

      {/* Note display */}
      {note && !showNote && (
        <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2 mb-3 italic">"{note}"</p>
      )}

      {/* Note editor */}
      {showNote && (
        <div className="mb-3">
          <textarea
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#17A589]/50 resize-none"
            rows={3}
            placeholder="Add a note about this lead..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="flex gap-2 mt-1">
            <button onClick={handleNoteSave} className="text-xs bg-[#17A589] text-white px-3 py-1 rounded-lg hover:bg-teal-700 transition-colors">
              Save
            </button>
            <button onClick={() => setShowNote(false)} className="text-xs text-gray-500 px-3 py-1 rounded-lg hover:bg-gray-100 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 mt-1">
        {!visited && (
          <button
            onClick={handleVisit}
            disabled={saving}
            className="flex-1 text-sm bg-[#1B4F72] text-white py-2 rounded-lg hover:bg-[#2E86C1] transition-colors font-medium disabled:opacity-60"
          >
            {saving ? "Saving..." : "Mark as Visited"}
          </button>
        )}
        <button
          onClick={() => setShowNote(!showNote)}
          className={`${visited ? "flex-1" : ""} text-sm border border-[#17A589] text-[#17A589] py-2 px-3 rounded-lg hover:bg-teal-50 transition-colors font-medium`}
        >
          {note ? "Edit Note" : "Add Note"}
        </button>
      </div>
    </div>
  );
}

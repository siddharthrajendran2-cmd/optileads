import React, { useState } from "react";
import LeadCard from "../components/LeadCard";
import { searchLeads, exportCSV } from "../api";

const CATEGORIES = [
  { value: "general_eye",         label: "General Eye Clinics & Hospitals" },
  { value: "retina_vitreous",     label: "Retina & Vitreous Specialists" },
  { value: "glaucoma",            label: "Glaucoma Specialists" },
  { value: "pediatric_neonatal",  label: "Pediatric & Neonatal Eye Care" },
  { value: "diabetic_eye",        label: "Diabetic Eye Care" },
  { value: "cataract_refractive", label: "Cataract & Refractive Surgery Centers" },
  { value: "cornea",              label: "Cornea & External Eye Disease" },
  { value: "charitable_eye",      label: "Charitable Eye Hospitals" },
];

const PRIORITY_FILTER = ["ALL", "HIGH", "MEDIUM", "LOW"];

export default function SearchPage() {
  const [searchMode, setSearchMode] = useState("city");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("general_eye");
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [exporting, setExporting] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    if (!location.trim()) return;
    setLoading(true);
    setError("");
    setSearched(false);
    setLeads([]);
    try {
      const data = await searchLeads(location, category, searchMode);
      if (data.error) {
        setError(data.error);
      } else {
        setLeads(data.leads || []);
        setSearched(true);
      }
    } catch {
      setError("Failed to connect to backend. Is the server running?");
    }
    setLoading(false);
  }

  function handleLeadUpdate(updated) {
    setLeads((prev) => prev.map((l) => l.place_id === updated.place_id ? { ...l, ...updated } : l));
  }

  async function handleExport() {
    setExporting(true);
    try { await exportCSV(filteredLeads); } catch {}
    setExporting(false);
  }

  const filteredLeads = leads.filter(
    (l) => priorityFilter === "ALL" || l.priority === priorityFilter
  );

  const counts = leads.reduce((acc, l) => {
    acc[l.priority] = (acc[l.priority] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Search card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
        <h1 className="text-2xl font-bold text-[#1B4F72] mb-1">Find Leads</h1>
        <p className="text-gray-500 text-sm mb-5">Search hospitals, clinics and centers by location and category</p>

        {/* City / Pincode toggle */}
        <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1 w-fit">
          <button
            type="button"
            onClick={() => { setSearchMode("city"); setLocation(""); }}
            className={`text-sm px-4 py-1.5 rounded-lg font-medium transition-colors ${
              searchMode === "city"
                ? "bg-white text-[#1B4F72] shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Search by City
          </button>
          <button
            type="button"
            onClick={() => { setSearchMode("pincode"); setLocation(""); }}
            className={`text-sm px-4 py-1.5 rounded-lg font-medium transition-colors ${
              searchMode === "pincode"
                ? "bg-white text-[#1B4F72] shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Search by Pincode
          </button>
        </div>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              {searchMode === "city" ? "City / Area" : "Pincode"}
            </label>
            <input
              type={searchMode === "pincode" ? "number" : "text"}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={searchMode === "city" ? "e.g. Bangalore, Koramangala" : "e.g. 560001"}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#17A589]/60 focus:border-[#17A589]"
            />
            {searchMode === "pincode" && (
              <p className="text-xs text-gray-400 mt-1">Searches within 5 km of this pincode</p>
            )}
          </div>
          <div className="sm:w-72">
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#17A589]/60 bg-white"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div className="sm:self-end">
            <button
              type="submit"
              disabled={loading || !location.trim()}
              className="w-full sm:w-auto bg-[#1B4F72] hover:bg-[#2E86C1] text-white font-semibold px-8 py-3 rounded-xl transition-colors disabled:opacity-50 text-sm"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Searching...
                </span>
              ) : "Search"}
            </button>
          </div>
        </form>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-4 mb-6 text-sm">
          ⚠ {error}
        </div>
      )}

      {/* Results controls */}
      {searched && (
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-600 font-medium">{leads.length} leads found</span>
            <div className="flex gap-1.5 ml-2">
              {PRIORITY_FILTER.map((p) => (
                <button
                  key={p}
                  onClick={() => setPriorityFilter(p)}
                  className={`text-xs px-3 py-1 rounded-full border font-medium transition-colors ${
                    priorityFilter === p
                      ? "bg-[#1B4F72] text-white border-[#1B4F72]"
                      : "bg-white text-gray-600 border-gray-300 hover:border-[#1B4F72]"
                  }`}
                >
                  {p === "ALL" ? "All" : `${p} (${counts[p] || 0})`}
                </button>
              ))}
            </div>
          </div>
          {leads.length > 0 && (
            <button
              onClick={handleExport}
              disabled={exporting}
              className="text-sm border border-[#17A589] text-[#17A589] hover:bg-teal-50 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {exporting ? "Exporting..." : "Export CSV"}
            </button>
          )}
        </div>
      )}

      {/* No results */}
      {searched && leads.length === 0 && !loading && (
        <div className="text-center py-16 text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="font-medium">No leads found for this search</p>
          <p className="text-sm mt-1">Try a different location or category</p>
        </div>
      )}

      {/* Results grid */}
      {filteredLeads.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLeads.map((lead) => (
            <LeadCard key={lead.place_id} lead={lead} onUpdate={handleLeadUpdate} />
          ))}
        </div>
      )}
    </div>
  );
}

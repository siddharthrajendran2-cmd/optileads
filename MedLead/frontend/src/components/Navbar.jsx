import React from "react";

const NAV_ITEMS = [
  { id: "search", label: "Search Leads" },
  { id: "visits", label: "Visit Tracker" },
  { id: "dashboard", label: "Dashboard" },
];

export default function Navbar({ page, setPage }) {
  return (
    <nav className="bg-[#1B4F72] shadow-lg sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo area */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#17A589] flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
              <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
            </svg>
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-none">OptiLeads</p>
          </div>
        </div>

        {/* Nav links */}
        <div className="flex gap-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                page === item.id
                  ? "bg-[#17A589] text-white"
                  : "text-blue-100 hover:bg-[#2E86C1] hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}

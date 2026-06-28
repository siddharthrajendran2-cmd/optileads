import React, { useState, useEffect } from "react";
import { getDashboard } from "../api";

function StatCard({ label, value, sub, color }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col gap-1`}>
      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">{label}</p>
      <p className={`text-4xl font-bold ${color || "text-[#1B4F72]"}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard().then((d) => { setData(d); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-24 text-gray-400">
      <svg className="animate-spin w-8 h-8 mr-3" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      Loading dashboard...
    </div>
  );

  const cityEntries = Object.entries(data.leads_by_city || {}).sort((a, b) => b[1] - a[1]);
  const maxCityCount = Math.max(...cityEntries.map(([, c]) => c), 1);

  const statusColors = {
    Interested: "bg-blue-500",
    "Not Interested": "bg-red-400",
    "Follow Up": "bg-amber-400",
    Converted: "bg-emerald-500",
  };

  const totalStatus = Object.values(data.status_breakdown || {}).reduce((a, b) => a + b, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-[#1B4F72] mb-1">Dashboard</h1>
      <p className="text-gray-500 text-sm mb-8">Overview of your sales activity</p>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Visited" value={data.total_visited} sub="across all cities" />
        <StatCard label="Converted" value={data.total_converted} color="text-emerald-600" sub="deals closed" />
        <StatCard
          label="Conversion Rate"
          value={`${data.conversion_rate}%`}
          color={data.conversion_rate >= 20 ? "text-emerald-600" : data.conversion_rate >= 10 ? "text-amber-500" : "text-[#1B4F72]"}
          sub="visited → converted"
        />
        <StatCard label="Cities Covered" value={Object.keys(data.leads_by_city || {}).length} sub="unique cities" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* City bar chart */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="font-semibold text-[#1B4F72] mb-4">Visits by City</h2>
          {cityEntries.length === 0 ? (
            <p className="text-gray-400 text-sm">No data yet</p>
          ) : (
            <div className="space-y-3">
              {cityEntries.map(([city, count]) => (
                <div key={city}>
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span className="font-medium truncate">{city}</span>
                    <span className="ml-2 flex-shrink-0">{count}</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#1B4F72] rounded-full transition-all duration-500"
                      style={{ width: `${(count / maxCityCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status breakdown */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="font-semibold text-[#1B4F72] mb-4">Lead Status Breakdown</h2>
          {totalStatus === 0 ? (
            <p className="text-gray-400 text-sm">No status data yet</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(data.status_breakdown || {}).map(([status, count]) => (
                <div key={status}>
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span className="font-medium">{status}</span>
                    <span>{count} ({totalStatus ? Math.round(count / totalStatus * 100) : 0}%)</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${statusColors[status] || "bg-gray-400"}`}
                      style={{ width: `${totalStatus ? (count / totalStatus) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pipeline progress */}
          {totalStatus > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Pipeline</p>
              <div className="flex rounded-full overflow-hidden h-4">
                {Object.entries(data.status_breakdown || {}).map(([status, count]) =>
                  count > 0 ? (
                    <div
                      key={status}
                      title={`${status}: ${count}`}
                      className={`${statusColors[status] || "bg-gray-400"} transition-all`}
                      style={{ width: `${(count / totalStatus) * 100}%` }}
                    />
                  ) : null
                )}
              </div>
              <div className="flex flex-wrap gap-3 mt-2">
                {Object.entries(statusColors).map(([s, cls]) => (
                  <span key={s} className="flex items-center gap-1.5 text-xs text-gray-500">
                    <span className={`w-2.5 h-2.5 rounded-full ${cls}`} />
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {data.total_visited === 0 && (
        <div className="mt-8 text-center py-10 text-gray-400 bg-white rounded-2xl border border-gray-200">
          <p className="font-medium">No visit data yet</p>
          <p className="text-sm mt-1">Search for leads and mark them as visited to see your dashboard</p>
        </div>
      )}
    </div>
  );
}

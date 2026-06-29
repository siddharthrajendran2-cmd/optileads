const BASE = "/api";

export async function searchLeads(city, category, search_mode = "city", radius_km = null) {
  const res = await fetch(`${BASE}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ city, category, search_mode, radius_km }),
  });
  return res.json();
}

export async function markVisited(lead) {
  const res = await fetch(`${BASE}/visit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(lead),
  });
  return res.json();
}

export async function updateLead(place_id, fields) {
  const res = await fetch(`${BASE}/update`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ place_id, ...fields }),
  });
  return res.json();
}

export async function getVisits() {
  const res = await fetch(`${BASE}/visits`);
  return res.json();
}

export async function getDashboard() {
  const res = await fetch(`${BASE}/dashboard`);
  return res.json();
}

export async function exportCSV(leads) {
  const res = await fetch(`${BASE}/export`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ leads }),
  });
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "medleads_export.csv";
  a.click();
  window.URL.revokeObjectURL(url);
}

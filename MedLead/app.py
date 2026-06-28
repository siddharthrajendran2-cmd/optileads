import os
import json
import csv
import io
import requests
from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()  # no-op in production where env vars are set at the OS level

FLASK_ENV = os.environ.get("FLASK_ENV", "production")
REACT_BUILD = os.path.join(os.path.dirname(__file__), "frontend", "build")

app = Flask(__name__, static_folder=REACT_BUILD, static_url_path="/")
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "dev-secret-change-me")

# CORS only needed in local dev (React dev server on :3000 → Flask on :5000)
if FLASK_ENV == "development":
    CORS(app)

GOOGLE_API_KEY = os.getenv("GOOGLE_PLACES_API_KEY")
LEADS_FILE = "leads.json"

CATEGORY_KEYWORDS = {
    "general_eye": [
        "eye hospital", "eye clinic", "ophthalmology", "netralaya",
        "eye centre", "eye care", "eye doctor", "eye specialist",
    ],
    "retina_vitreous": [
        "retina clinic", "retina specialist", "vitreoretinal",
        "retina hospital", "retinal surgery", "vitreous surgeon",
    ],
    "glaucoma": [
        "glaucoma clinic", "glaucoma specialist", "glaucoma surgery",
        "eye pressure clinic", "glaucoma hospital",
    ],
    "pediatric_neonatal": [
        "pediatric ophthalmology", "children eye clinic", "neonatal eye",
        "NICU", "pediatric hospital", "maternity hospital",
        "squint clinic", "amblyopia clinic", "children hospital",
    ],
    "diabetic_eye": [
        "diabetic retinopathy", "diabetes eye clinic", "diabetologist",
        "retina clinic", "diabetes hospital", "sugar clinic", "endocrinologist",
    ],
    "cataract_refractive": [
        "cataract surgery", "LASIK", "refractive surgery",
        "phacoemulsification", "lens implant", "cataract clinic",
    ],
    "cornea": [
        "cornea clinic", "cornea specialist", "cornea transplant",
        "dry eye clinic", "corneal surgery", "eye surface clinic",
    ],
    "charitable_eye": [
        "LV Prasad", "Sankara Nethralaya", "Aravind eye",
        "charitable eye hospital", "NGO eye", "free eye camp",
        "district eye hospital",
    ],
}

FACILITY_TYPE_MAP = {
    "general_eye":        {"default": "Eye Clinic / Hospital"},
    "retina_vitreous":    {"default": "Retina & Vitreous Center"},
    "glaucoma":           {"default": "Glaucoma Clinic"},
    "pediatric_neonatal": {"default": "Pediatric / Neonatal Eye"},
    "diabetic_eye":       {"default": "Diabetic Eye Care"},
    "cataract_refractive":{"default": "Cataract & Refractive Center"},
    "cornea":             {"default": "Cornea Clinic"},
    "charitable_eye":     {"default": "Charitable Eye Hospital"},
}

PRIORITY_KEYWORDS = {
    "general_eye": {
        "HIGH": ["eye", "ophthal", "netralaya", "ocular"],
        "MEDIUM": ["hospital", "clinic", "medical", "multispecialty"],
    },
    "retina_vitreous": {
        "HIGH": ["retina", "vitreo", "vitreous", "retinal"],
        "MEDIUM": ["eye", "ophthal", "hospital"],
    },
    "glaucoma": {
        "HIGH": ["glaucoma"],
        "MEDIUM": ["eye", "ophthal", "hospital", "clinic"],
    },
    "pediatric_neonatal": {
        "HIGH": ["neonatal", "nicu", "pediatric", "children", "squint", "amblyopia"],
        "MEDIUM": ["maternity", "hospital", "women", "mother"],
    },
    "diabetic_eye": {
        "HIGH": ["diabet", "retina", "endocrin", "sugar"],
        "MEDIUM": ["hospital", "clinic", "multispecialty", "eye"],
    },
    "cataract_refractive": {
        "HIGH": ["cataract", "lasik", "refractive", "phaco", "lens implant"],
        "MEDIUM": ["eye", "ophthal", "hospital", "clinic"],
    },
    "cornea": {
        "HIGH": ["cornea", "corneal", "dry eye"],
        "MEDIUM": ["eye", "ophthal", "hospital", "clinic"],
    },
    "charitable_eye": {
        "HIGH": ["prasad", "sankara", "aravind", "charitable", "ngo", "free eye", "district eye"],
        "MEDIUM": ["hospital", "eye", "ophthal", "community"],
    },
}


def compute_priority(name, types, category):
    name_lower = name.lower()
    types_str = " ".join(types).lower() if types else ""
    combined = name_lower + " " + types_str
    rules = PRIORITY_KEYWORDS.get(category, {})
    for kw in rules.get("HIGH", []):
        if kw in combined:
            return "HIGH"
    for kw in rules.get("MEDIUM", []):
        if kw in combined:
            return "MEDIUM"
    return "LOW"


def get_facility_type(types, category):
    if not types:
        return FACILITY_TYPE_MAP.get(category, {}).get("default", "Facility")
    t = " ".join(types).lower()
    if "eye_care" in types or "ophthalmologist" in types:
        return "Eye Clinic"
    if "hospital" in t:
        return "Hospital"
    if "doctor" in t or "health" in t:
        return "Clinic"
    return FACILITY_TYPE_MAP.get(category, {}).get("default", "Facility")


def geocode_city(city):
    url = "https://maps.googleapis.com/maps/api/geocode/json"
    resp = requests.get(url, params={"address": city, "key": GOOGLE_API_KEY})
    data = resp.json()
    print(f"[GEOCODE] city='{city}' status={data.get('status')} error={data.get('error_message', '')}")
    if not data.get("results"):
        return None, None
    loc = data["results"][0]["geometry"]["location"]
    print(f"[GEOCODE] resolved to lat={loc['lat']}, lng={loc['lng']}")
    return loc["lat"], loc["lng"]


def search_places(query, location_label, lat, lng, radius_m=15000):
    places_url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
    all_results = []
    next_page_token = None

    for page in range(2):
        params = {
            "query": f"{query} in {location_label}",
            "location": f"{lat},{lng}",
            "radius": radius_m,
            "key": GOOGLE_API_KEY,
        }
        if next_page_token:
            params["pagetoken"] = next_page_token

        resp = requests.get(places_url, params=params)
        data = resp.json()
        count = len(data.get("results", []))
        print(f"[PLACES] query='{query} in {location_label}' page={page+1} status={data.get('status')} results={count} error={data.get('error_message', '')}")
        all_results.extend(data.get("results", []))
        next_page_token = data.get("next_page_token")
        if not next_page_token:
            break

    return all_results


def haversine_km(lat1, lng1, lat2, lng2):
    import math
    R = 6371
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return round(R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a)), 1)


def fetch_place_details(place_id):
    url = "https://maps.googleapis.com/maps/api/place/details/json"
    params = {
        "place_id": place_id,
        "fields": "formatted_phone_number,website,opening_hours,url",
        "key": GOOGLE_API_KEY,
    }
    resp = requests.get(url, params=params)
    data = resp.json()
    if data.get("status") != "OK":
        return {}
    return data.get("result", {})


def load_leads():
    if os.path.exists(LEADS_FILE):
        with open(LEADS_FILE) as f:
            return json.load(f)
    return {}


def save_leads(data):
    with open(LEADS_FILE, "w") as f:
        json.dump(data, f, indent=2)


@app.route("/api/search", methods=["POST"])
def search():
    body = request.json
    category = body.get("category", "general_eye")
    search_mode = body.get("search_mode", "city")  # "city" or "pincode"
    raw_query = body.get("city", "").strip()

    if not raw_query:
        return jsonify({"error": "City or pincode is required"}), 400
    if not GOOGLE_API_KEY or GOOGLE_API_KEY == "your_google_places_api_key_here":
        return jsonify({"error": "Google Places API key not configured"}), 500

    if search_mode == "pincode":
        geocode_query = f"{raw_query} India"
        radius_m = 5000
    else:
        geocode_query = raw_query
        radius_m = 15000

    print(f"\n[SEARCH] mode={search_mode} query='{raw_query}' category='{category}'")
    center_lat, center_lng = geocode_city(geocode_query)
    if center_lat is None:
        return jsonify({"error": f"Could not find location: {raw_query}"}), 400

    keywords = CATEGORY_KEYWORDS.get(category, [])
    seen_ids = set()
    all_places = []

    for kw in keywords:
        results = search_places(kw, raw_query, center_lat, center_lng, radius_m)
        for r in results:
            pid = r.get("place_id")
            if pid and pid not in seen_ids:
                seen_ids.add(pid)
                all_places.append(r)

    print(f"[SEARCH] total unique places after dedup: {len(all_places)}")

    if not all_places:
        return jsonify({"leads": [], "city": city, "category": category})

    visited_data = load_leads()
    leads = []
    for p in all_places:
        place_id = p.get("place_id", "")
        name = p.get("name", "Unknown")
        address = p.get("formatted_address", "")
        rating = p.get("rating")
        total_ratings = p.get("user_ratings_total", 0)
        types = p.get("types", [])
        ploc = p.get("geometry", {}).get("location", {})
        distance = None
        if center_lat is not None and ploc:
            distance = haversine_km(center_lat, center_lng, ploc["lat"], ploc["lng"])

        priority = compute_priority(name, types, category)
        facility_type = get_facility_type(types, category)
        visited_info = visited_data.get(place_id, {})

        leads.append({
            "place_id": place_id,
            "name": name,
            "address": address,
            "phone": p.get("formatted_phone_number", ""),
            "rating": rating,
            "total_ratings": total_ratings,
            "facility_type": facility_type,
            "priority": priority,
            "distance_km": distance,
            "visited": visited_info.get("visited", False),
            "status": visited_info.get("status", ""),
            "note": visited_info.get("note", ""),
            "visit_date": visited_info.get("visit_date", ""),
            "city": raw_query,
            "category": category,
        })

    leads.sort(key=lambda x: ({"HIGH": 0, "MEDIUM": 1, "LOW": 2}[x["priority"]], x.get("distance_km") or 999))
    return jsonify({"leads": leads, "city": raw_query, "category": category})


@app.route("/api/details/<place_id>", methods=["GET"])
def place_details(place_id):
    details = fetch_place_details(place_id)
    hours = details.get("opening_hours", {})
    return jsonify({
        "phone": details.get("formatted_phone_number", ""),
        "website": details.get("website", ""),
        "maps_url": details.get("url", ""),
        "open_now": hours.get("open_now"),
        "weekday_text": hours.get("weekday_text", []),
    })


@app.route("/api/visit", methods=["POST"])
def mark_visit():
    body = request.json
    place_id = body.get("place_id")
    if not place_id:
        return jsonify({"error": "place_id required"}), 400

    data = load_leads()
    existing = data.get(place_id, {})
    existing.update({
        "place_id": place_id,
        "name": body.get("name", existing.get("name", "")),
        "address": body.get("address", existing.get("address", "")),
        "city": body.get("city", existing.get("city", "")),
        "category": body.get("category", existing.get("category", "")),
        "facility_type": body.get("facility_type", existing.get("facility_type", "")),
        "priority": body.get("priority", existing.get("priority", "")),
        "rating": body.get("rating", existing.get("rating")),
        "visited": True,
        "visit_date": body.get("visit_date") or existing.get("visit_date") or datetime.now().strftime("%Y-%m-%d"),
    })
    data[place_id] = existing
    save_leads(data)
    return jsonify({"success": True, "lead": existing})


@app.route("/api/update", methods=["POST"])
def update_lead():
    body = request.json
    place_id = body.get("place_id")
    if not place_id:
        return jsonify({"error": "place_id required"}), 400

    data = load_leads()
    existing = data.get(place_id, {})
    for field in ["status", "note", "visit_date"]:
        if field in body:
            existing[field] = body[field]
    data[place_id] = existing
    save_leads(data)
    return jsonify({"success": True, "lead": existing})


@app.route("/api/visits", methods=["GET"])
def get_visits():
    data = load_leads()
    visits = [v for v in data.values() if v.get("visited")]
    visits.sort(key=lambda x: x.get("visit_date", ""), reverse=True)
    return jsonify({"visits": visits})


@app.route("/api/dashboard", methods=["GET"])
def dashboard():
    data = load_leads()
    all_leads = list(data.values())
    visited = [l for l in all_leads if l.get("visited")]
    converted = [l for l in visited if l.get("status") == "Converted"]

    city_counts = {}
    for l in visited:
        city = l.get("city", "Unknown")
        city_counts[city] = city_counts.get(city, 0) + 1

    return jsonify({
        "total_visited": len(visited),
        "total_converted": len(converted),
        "conversion_rate": round(len(converted) / len(visited) * 100, 1) if visited else 0,
        "leads_by_city": city_counts,
        "status_breakdown": {
            "Interested": len([l for l in visited if l.get("status") == "Interested"]),
            "Not Interested": len([l for l in visited if l.get("status") == "Not Interested"]),
            "Follow Up": len([l for l in visited if l.get("status") == "Follow Up"]),
            "Converted": len(converted),
        },
    })


@app.route("/api/export", methods=["POST"])
def export_csv():
    body = request.json or {}
    leads = body.get("leads", [])
    if not leads:
        data = load_leads()
        leads = list(data.values())

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=[
        "name", "address", "facility_type", "priority", "rating",
        "total_ratings", "distance_km", "city", "category",
        "visited", "status", "note", "visit_date"
    ])
    writer.writeheader()
    for lead in leads:
        writer.writerow({k: lead.get(k, "") for k in writer.fieldnames})

    output.seek(0)
    return send_file(
        io.BytesIO(output.getvalue().encode()),
        mimetype="text/csv",
        as_attachment=True,
        download_name="medleads_export.csv",
    )


# Serve React app for all non-API routes (SPA client-side routing)
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_react(path):
    if path and os.path.exists(os.path.join(REACT_BUILD, path)):
        return send_from_directory(REACT_BUILD, path)
    return send_from_directory(REACT_BUILD, "index.html")


if __name__ == "__main__":
    debug = FLASK_ENV == "development"
    app.run(debug=debug, port=int(os.environ.get("PORT", 5000)))

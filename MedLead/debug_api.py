import os
import requests
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GOOGLE_PLACES_API_KEY")

print("=== ENV CHECK ===")
print(f"GOOGLE_PLACES_API_KEY in env: {'YES' if api_key else 'NO'}")
if api_key:
    print(f"Key prefix (first 10 chars): {api_key[:10]}...")

print("\n=== STEP 1: GEOCODE Bangalore ===")
geocode_url = "https://maps.googleapis.com/maps/api/geocode/json"
geo_params = {"address": "Bangalore", "key": api_key}
print(f"Request URL: {geocode_url}?address=Bangalore&key={api_key[:10]}...<redacted>")

geo_resp = requests.get(geocode_url, params=geo_params)
geo_data = geo_resp.json()
print(f"HTTP Status: {geo_resp.status_code}")
print(f"Geocode status: {geo_data.get('status')}")
if geo_data.get("error_message"):
    print(f"Error message: {geo_data['error_message']}")

lat, lng = None, None
if geo_data.get("results"):
    loc = geo_data["results"][0]["geometry"]["location"]
    lat, lng = loc["lat"], loc["lng"]
    print(f"Coordinates: lat={lat}, lng={lng}")
else:
    print("No geocode results — cannot proceed to Places search")
    exit(1)

print("\n=== STEP 2: PLACES TEXT SEARCH ===")
places_url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
places_params = {
    "query": "eye clinic in Bangalore",
    "location": f"{lat},{lng}",
    "radius": 15000,
    "key": api_key,
}
safe_url = (
    f"{places_url}?query=eye+clinic+in+Bangalore"
    f"&location={lat},{lng}&radius=15000&key={api_key[:10]}...<redacted>"
)
print(f"Request URL: {safe_url}")

places_resp = requests.get(places_url, params=places_params)
places_data = places_resp.json()
print(f"HTTP Status: {places_resp.status_code}")
print(f"Places status: {places_data.get('status')}")
if places_data.get("error_message"):
    print(f"Error message: {places_data['error_message']}")

results = places_data.get("results", [])
print(f"Results count: {len(results)}")

if results:
    print("\n--- First 3 results ---")
    for r in results[:3]:
        print(f"  Name: {r.get('name')}")
        print(f"  Address: {r.get('formatted_address')}")
        print(f"  Types: {r.get('types')}")
        print(f"  Rating: {r.get('rating')} ({r.get('user_ratings_total', 0)} reviews)")
        print()
else:
    print("\nFull raw response:")
    import json
    print(json.dumps(places_data, indent=2))

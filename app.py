import csv
import json
import os
from flask import Flask, render_template

app = Flask(__name__)

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")


def load_csv(filename):
    rows = []
    path = os.path.join(DATA_DIR, filename)
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)
    return rows


# Load all data once at startup
ships = load_csv("ships.csv")
cabins = load_csv("cabins.csv")
excursions = load_csv("excursions.csv")
ports = load_csv("ports.csv")
voyage_products = load_csv("voyage_products.csv")
locales = load_csv("locales.csv")
bookings = load_csv("bookings.csv")

# Build summary stats
stats = {
    "ships": len(ships),
    "cabins": len(cabins),
    "excursions": len(excursions),
    "ports": len(ports),
    "voyage_products": len(voyage_products),
    "locales": len(locales),
    "cabin_categories": len(set(r["cabin_category"] for r in cabins)),
    "ships_with_content": sum(1 for s in ships if s["has_contentful_content"] == "True"),
    "excursion_types": sorted(set(r["type"] for r in excursions if r["type"])),
    "voyage_categories": sorted(set(r["category"] for r in voyage_products if r["category"])),
    "ships_by_code": {s["brm_code"]: s["ship_name"] for s in ships},
}

# Group cabins by ship
cabins_by_ship = {}
for c in cabins:
    key = c["ship_brm_code"]
    if key not in cabins_by_ship:
        cabins_by_ship[key] = []
    cabins_by_ship[key].append(c)


@app.route("/")
def index():
    return render_template(
        "index.html",
        ships=ships,
        cabins=cabins,
        cabins_by_ship=cabins_by_ship,
        excursions=excursions,
        ports=ports,
        voyage_products=voyage_products,
        locales=locales,
        stats=stats,
        bookings=bookings,
        ships_json=json.dumps(ships),
        cabins_json=json.dumps(cabins),
        excursions_json=json.dumps(excursions),
        ports_json=json.dumps(ports),
        voyage_products_json=json.dumps(voyage_products),
        locales_json=json.dumps(locales),
        bookings_json=json.dumps(bookings),
    )


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=port, debug=True)

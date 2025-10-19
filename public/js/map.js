const map = new maplibregl.Map({
  container: "map",
  style: {
    version: 8,
    sources: {
      "osm-tiles": {
        type: "raster",
        tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
        tileSize: 256,
        attribution: "&copy; OpenStreetMap contributors",
      },
    },
    layers: [
      {
        id: "osm-tiles",
        type: "raster",
        source: "osm-tiles",
      },
    ],
  },
  center: listing.geometry.coordinates,
  zoom: 9,
});

// Wait for window load and slight delay to ensure layout is ready
window.addEventListener("load", () => {
  setTimeout(() => {
    map.resize();
  }, 400);
});

// Also resize on window resize
window.addEventListener("resize", () => map.resize());

// Add marker
const marker = new maplibregl.Marker({ color: "red" })
  .setLngLat(listing.geometry.coordinates)
  .setPopup(
    new maplibregl.Popup({ offset: 25 }).setHTML(
      `<h4>${listing.title}</h4><p>Exact location will be provided after booking</p>`
    )
  )
  .addTo(map);

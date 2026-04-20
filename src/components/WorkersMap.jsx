import { useEffect, useRef, useState } from "react";
import * as L from "../../node_modules/leaflet/dist/leaflet-src.esm.js";
import markerIcon2x from "../../node_modules/leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "../../node_modules/leaflet/dist/images/marker-icon.png";
import markerShadow from "../../node_modules/leaflet/dist/images/marker-shadow.png";
import { Alert } from "./ui/alert";
import { getWorkers } from "../lib/workers";

const KOLKATA_CENTER = [22.57, 88.36];

L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

export default function WorkersMap({ onlyAvailable = false, highlightWorkerId = "", onMarkerAction }) {
    const [workers, setWorkers] = useState([]);
    const [error, setError] = useState("");
    const mapElementRef = useRef(null);
    const mapRef = useRef(null);
    const markerLayerRef = useRef(null);
    const workersRef = useRef([]);

    useEffect(() => {
        let isMounted = true;
        let intervalId;

        const fetchWorkers = async () => {
            try {
                setError("");
                const data = await getWorkers({ onlyAvailable });

                if (isMounted) {
                    setWorkers(data);
                    workersRef.current = data;
                }
            } catch (err) {
                if (isMounted) {
                    setError(err?.message || "Unable to load worker locations.");
                }
            }
        };

        void fetchWorkers();

        if (onlyAvailable) {
            intervalId = setInterval(() => {
                void fetchWorkers();
            }, 30000);
        }

        return () => {
            isMounted = false;
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [onlyAvailable]);

    useEffect(() => {
        if (!mapElementRef.current || mapRef.current) {
            return;
        }

        const map = L.map(mapElementRef.current, { zoomControl: false }).setView(KOLKATA_CENTER, 11);
        L.control.zoom({ position: 'bottomright' }).addTo(map);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        mapRef.current = map;
        markerLayerRef.current = L.layerGroup().addTo(map);

        // Required to update size properly when rendered in hidden/flexible containers
        setTimeout(() => map.invalidateSize(), 100);

        const handleMapBook = (e) => {
            const workerId = e.detail;
            if (typeof onMarkerAction === 'function') {
                const mapWorker = workersRef.current.find(w => (w._id || w.id) === workerId);
                if (mapWorker) {
                    onMarkerAction(mapWorker);
                }
            }
        };
        
        document.addEventListener('worker-map-book', handleMapBook);

        return () => {
            document.removeEventListener('worker-map-book', handleMapBook);
            map.remove();
            mapRef.current = null;
            markerLayerRef.current = null;
        };
    }, [onMarkerAction]);

    useEffect(() => {
        const map = mapRef.current;
        const markerLayer = markerLayerRef.current;
        if (!map || !markerLayer) {
            return;
        }

        markerLayer.clearLayers();

        workers.forEach((worker) => {
            const lat = Number(worker?.location?.lat);
            const lng = Number(worker?.location?.lng);
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
                return;
            }

            const workerId = worker?._id || worker?.id;
            const isHighlighted = highlightWorkerId && workerId === highlightWorkerId;
            const name = worker?.name || "Worker";
            const initial = name.charAt(0).toUpperCase();

            if (isHighlighted) {
                // Tracking marker for accepted booking
                L.circleMarker([lat, lng], {
                    radius: 12,
                    color: "#ffffff",
                    fillColor: "#10b981",
                    fillOpacity: 1,
                    weight: 3,
                    className: "pulse-marker shadow-lg",
                })
                    .addTo(markerLayer)
                    .bindPopup("<b>Worker Assigned</b><br>Currently tracking their location.");
                return;
            }

            // Custom Avatar Marker for workers
            const customIcon = L.divIcon({
                className: "custom-worker-marker",
                html: `
                    <div style="background-color: #047857; color: white; border-radius: 50%; border: 2px solid white; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-family: sans-serif; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.2);">
                        ${initial}
                    </div>
                `,
                iconSize: [36, 36],
                iconAnchor: [18, 18],
                popupAnchor: [0, -18],
            });

            const popupHtml = `
                <div style="min-width: 160px; font-family: sans-serif; padding: 4px;">
                    <h3 style="font-weight: 700; font-size: 16px; margin: 0 0 4px 0; color: #0f172a;">${worker?.name || "Unnamed"}</h3>
                    <p style="margin: 0 0 6px 0; font-size: 13px; color: #475569; display: flex; align-items: center; gap: 4px;">
                        <span style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">${worker?.skill || "General"}</span>
                    </p>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="font-weight: 600; color: #059669;">₹${worker?.price || 0}</span>
                        <span style="font-size: 12px; color: #d97706;">★ ${Number(worker?.rating || 0).toFixed(1)}</span>
                    </div>
                    <button onclick="document.dispatchEvent(new CustomEvent('worker-map-book', {detail: '${workerId}'}))" 
                            style="width: 100%; padding: 6px; background-color: #059669; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">
                        Book Worker
                    </button>
                </div>
            `;

            L.marker([lat, lng], { icon: customIcon })
                .addTo(markerLayer)
                .bindPopup(popupHtml, { minWidth: 180, offset: [0, 4] });
        });
    }, [highlightWorkerId, workers]);

    return (
        <div className="flex h-full w-full flex-col relative space-y-2">
            {error && <div className="absolute top-2 left-2 right-2 z-[400]"><Alert variant="error">{error}</Alert></div>}
            <div ref={mapElementRef} className="h-full min-h-[300px] w-full bg-slate-100 z-0" />
        </div>
    );
}

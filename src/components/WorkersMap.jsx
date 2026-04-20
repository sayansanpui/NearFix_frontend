import { useEffect, useRef, useState } from "react";
import * as L from "../../node_modules/leaflet/dist/leaflet-src.esm.js";
import markerIcon2x from "../../node_modules/leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "../../node_modules/leaflet/dist/images/marker-icon.png";
import markerShadow from "../../node_modules/leaflet/dist/images/marker-shadow.png";
import { Alert } from "./ui/alert";
import { Card } from "./ui/card";
import { getWorkers } from "../lib/workers";

const KOLKATA_CENTER = [22.57, 88.36];

L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

export default function WorkersMap({ onlyAvailable = false, highlightWorkerId = "" }) {
    const [workers, setWorkers] = useState([]);
    const [error, setError] = useState("");
    const mapElementRef = useRef(null);
    const mapRef = useRef(null);
    const markerLayerRef = useRef(null);

    useEffect(() => {
        let isMounted = true;
        let intervalId;

        const fetchWorkers = async () => {
            try {
                setError("");
                const data = await getWorkers({ onlyAvailable });

                if (isMounted) {
                    setWorkers(data);
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

        const map = L.map(mapElementRef.current).setView(KOLKATA_CENTER, 11);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        mapRef.current = map;
        markerLayerRef.current = L.layerGroup().addTo(map);

        return () => {
            map.remove();
            mapRef.current = null;
            markerLayerRef.current = null;
        };
    }, []);

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

            if (isHighlighted) {
                L.circleMarker([lat, lng], {
                    radius: 10,
                    color: "#16a34a",
                    fillColor: "#16a34a",
                    fillOpacity: 0.85,
                    weight: 2,
                })
                    .addTo(markerLayer)
                    .bindPopup("Worker on the way");
                return;
            }

            L.marker([lat, lng])
                .addTo(markerLayer)
                .bindPopup(worker?.name || "Unnamed worker");
        });
    }, [highlightWorkerId, workers]);

    return (
        <div className="space-y-3">
            {error && <Alert variant="error">{error}</Alert>}
            <Card className="overflow-hidden border-slate-200 p-2">
                <div ref={mapElementRef} className="h-[340px] w-full rounded-lg sm:h-[420px]" />
            </Card>
        </div>
    );
}

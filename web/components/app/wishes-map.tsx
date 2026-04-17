"use client";

import "leaflet/dist/leaflet.css";

import type { LatLngTuple } from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { useMap } from "react-leaflet/hooks";
import { useEffect } from "react";

type MapPoint = {
  id: string;
  title: string;
  location: string;
  latitude: number;
  longitude: number;
  status: "planned" | "done";
};

export function WishesMap({
  points,
  onSelect,
}: {
  points: MapPoint[];
  onSelect?: (id: string) => void;
}) {
  if (!points.length) {
    return (
      <div className="rounded-[16px] border border-dashed border-white/70 bg-white/70 p-4 text-center text-sm text-slate-600">
        Добавь место с координатами, чтобы увидеть его на карте.
      </div>
    );
  }

  const center: LatLngTuple = [points[0].latitude, points[0].longitude];

  return (
    <div className="overflow-hidden rounded-[16px] border border-white/60">
      <MapContainer
        center={center}
        zoom={5}
        scrollWheelZoom={false}
        className="h-72 w-full"
      >
        <FitToPoints points={points} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.map((point) => (
          <Marker
            key={point.id}
            position={[point.latitude, point.longitude] as LatLngTuple}
            eventHandlers={{
              click: () => onSelect?.(point.id),
            }}
          >
            <Popup>
              <div className="space-y-1">
                <p className="font-semibold text-slate-900">{point.title}</p>
                <p className="text-xs text-slate-600">{point.location}</p>
                <p className="text-xs text-slate-500">
                  {point.status === "done" ? "Уже были" : "Хотим побывать"}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

function FitToPoints({ points }: { points: MapPoint[] }) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 1) {
      const point = points[0];
      map.setView([point.latitude, point.longitude], 8);
      return;
    }

    const bounds: LatLngTuple[] = points.map((item) => [
      item.latitude,
      item.longitude,
    ]);
    map.fitBounds(bounds, { padding: [24, 24], maxZoom: 10 });
  }, [map, points]);

  return null;
}

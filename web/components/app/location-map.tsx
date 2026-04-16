"use client";

import "leaflet/dist/leaflet.css";

import type { LatLngTuple } from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

import type { Wish } from "@/lib/types";

type LocationMapProps = {
  wishes: Wish[];
};

export function LocationMap({ wishes }: LocationMapProps) {
  const itemsWithLocation = wishes.filter((wish) => wish.location);

  if (!itemsWithLocation.length) {
    return (
      <div className="rounded-[28px] border border-white/30 bg-white/60 p-6 text-sm text-slate-600 shadow-[0_20px_80px_rgba(124,58,237,0.12)] backdrop-blur-xl">
        Add a place or trip with coordinates to unlock the shared map.
      </div>
    );
  }

  const firstItem = itemsWithLocation[0];
  const center: LatLngTuple = [
    firstItem.location!.lat,
    firstItem.location!.lng,
  ];

  return (
    <div className="overflow-hidden rounded-[28px] border border-white/30 shadow-[0_20px_80px_rgba(124,58,237,0.12)]">
      <MapContainer
        center={center}
        className="h-[320px] w-full"
        zoom={5}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {itemsWithLocation.map((wish) => (
          <Marker
            key={wish.id}
            position={[wish.location!.lat, wish.location!.lng] as LatLngTuple}
          >
            <Popup>
              <div className="space-y-1">
                <p className="font-semibold text-slate-900">{wish.title}</p>
                <p className="text-xs text-slate-600">{wish.location?.name}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

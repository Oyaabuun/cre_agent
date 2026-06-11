"use client"

import React, { useState, useCallback } from "react"
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api"
import { Button } from "./ui/Button"
import { X } from "lucide-react"

const containerStyle = {
    width: "100%",
    height: "400px",
}

const center = {
    lat: 12.9716, // Bangalore
    lng: 77.5946,
}

interface MapPickerProps {
    onSelect: (lat: number, lng: number, address?: string) => void
    onClose: () => void
}

export function MapPicker({ onSelect, onClose }: MapPickerProps) {
    const { isLoaded } = useJsApiLoader({
        id: "google-map-script",
        googleMapsApiKey: process.env.NEXT_PUBLIC_MAPS_API_KEY || "",
        libraries: ["places"],
    })

    const [marker, setMarker] = useState<google.maps.LatLngLiteral | null>(null)
    const [map, setMap] = useState<google.maps.Map | null>(null)

    const onLoad = useCallback((map: google.maps.Map) => {
        setMap(map)
    }, [])

    const onUnmount = useCallback((map: google.maps.Map) => {
        setMap(null)
    }, [])

    const onClick = useCallback((e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
            setMarker({ lat: e.latLng.lat(), lng: e.latLng.lng() })
        }
    }, [])

    const handleConfirm = async () => {
        if (marker) {
            // Reverse geocode to get address
            const geocoder = new google.maps.Geocoder()
            const response = await geocoder.geocode({ location: marker })
            const address = response.results[0]?.formatted_address
            onSelect(marker.lat, marker.lng, address)
            onClose()
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl">
                <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
                    <h3 className="text-lg font-semibold text-white">Pick Location on Map</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                <div className="relative">
                    {isLoaded ? (
                        <GoogleMap
                            mapContainerStyle={containerStyle}
                            center={center}
                            zoom={12}
                            onLoad={onLoad}
                            onUnmount={onUnmount}
                            onClick={onClick}
                            options={{
                                styles: darkMapStyle,
                                disableDefaultUI: true,
                                zoomControl: true,
                            }}
                        >
                            {marker && <Marker position={marker} />}
                        </GoogleMap>
                    ) : (
                        <div className="h-[400px] flex items-center justify-center text-slate-400">
                            Loading Map...
                        </div>
                    )}
                </div>

                <div className="p-4 bg-slate-800/50 flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleConfirm} disabled={!marker}>
                        Confirm Location
                    </Button>
                </div>
            </div>
        </div>
    )
}

const darkMapStyle = [
    { elementType: "geometry", stylers: [{ color: "#1e293b" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#1e293b" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
    {
        featureType: "administrative.locality",
        elementType: "labels.text.fill",
        stylers: [{ color: "#d59563" }],
    },
    {
        featureType: "poi",
        elementType: "labels.text.fill",
        stylers: [{ color: "#d59563" }],
    },
    {
        featureType: "poi.park",
        elementType: "geometry",
        stylers: [{ color: "#263c3f" }],
    },
    {
        featureType: "poi.park",
        elementType: "labels.text.fill",
        stylers: [{ color: "#6b9a76" }],
    },
    {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ color: "#38414e" }],
    },
    {
        featureType: "road",
        elementType: "geometry.stroke",
        stylers: [{ color: "#212a37" }],
    },
    {
        featureType: "road",
        elementType: "labels.text.fill",
        stylers: [{ color: "#9ca3af" }],
    },
    {
        featureType: "road.highway",
        elementType: "geometry",
        stylers: [{ color: "#4b5563" }],
    },
    {
        featureType: "road.highway",
        elementType: "geometry.stroke",
        stylers: [{ color: "#1f2835" }],
    },
    {
        featureType: "road.highway",
        elementType: "labels.text.fill",
        stylers: [{ color: "#f3d4b2" }],
    },
    {
        featureType: "transit",
        elementType: "geometry",
        stylers: [{ color: "#2f3948" }],
    },
    {
        featureType: "transit.station",
        elementType: "labels.text.fill",
        stylers: [{ color: "#d59563" }],
    },
    {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#0f172a" }],
    },
    {
        featureType: "water",
        elementType: "labels.text.fill",
        stylers: [{ color: "#515c6d" }],
    },
    {
        featureType: "water",
        elementType: "labels.text.stroke",
        stylers: [{ color: "#17263c" }],
    },
]

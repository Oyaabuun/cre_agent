"use client"

import React, { useState, useRef } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "./ui/Card"
import { Input } from "./ui/Input"
import { Button } from "./ui/Button"
import { Search, MapPin, IndianRupee, Home, Ruler, Map as MapIcon } from "lucide-react"
import { useJsApiLoader, Autocomplete } from "@react-google-maps/api"
import { MapPicker } from "./MapPicker"

interface PropertyFormProps {
    onSubmit: (data: any) => void
    loading: boolean
}

const libraries: ("places" | "geometry" | "drawing" | "visualization")[] = ["places"]

export function PropertyForm({ onSubmit, loading }: PropertyFormProps) {
    const { isLoaded } = useJsApiLoader({
        id: "google-map-script",
        googleMapsApiKey: process.env.NEXT_PUBLIC_MAPS_API_KEY || "",
        libraries,
    })

    const [formData, setFormData] = useState({
        address: "",
        asking_price: "",
        property_type: "2bhk",
        radius_m: "2000",
        intent: "buy",
        lat: null as number | null,
        lng: null as number | null,
        custom_request: "",
        land_area_sqft: "",
    })

    const [showMap, setShowMap] = useState(false)
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

    const onLoad = (autocomplete: google.maps.places.Autocomplete) => {
        autocompleteRef.current = autocomplete
    }

    const onPlaceChanged = () => {
        if (autocompleteRef.current !== null) {
            const place = autocompleteRef.current.getPlace()
            if (place.geometry && place.geometry.location) {
                setFormData({
                    ...formData,
                    address: place.formatted_address || "",
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng(),
                })
            }
        }
    }

    const handleMapSelect = (lat: number, lng: number, address?: string) => {
        setFormData({
            ...formData,
            address: address || formData.address,
            lat,
            lng,
        })
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSubmit({
            ...formData,
            asking_price: parseInt(formData.asking_price),
            radius_m: parseInt(formData.radius_m),
            land_area_sqft: formData.land_area_sqft ? parseInt(formData.land_area_sqft) : undefined,
        })
    }

    return (
        <>
            <Card className="w-full max-w-2xl mx-auto">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Search className="w-6 h-6 text-sky-500" />
                            Evaluate Property
                        </CardTitle>
                        <div className="flex p-1 bg-slate-800/50 rounded-xl border border-slate-700/50">
                            {['buy', 'rent'].map((mode) => (
                                <button
                                    key={mode}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, intent: mode })}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${formData.intent === mode
                                            ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                                            : 'text-slate-500 hover:text-slate-300'
                                        }`}
                                >
                                    {mode}
                                </button>
                            ))}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                <MapPin className="w-4 h-4" /> Address
                            </label>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    {isLoaded ? (
                                        <Autocomplete
                                            onLoad={onLoad}
                                            onPlaceChanged={onPlaceChanged}
                                        >
                                            <Input
                                                required
                                                placeholder="e.g. MG Road, Bangalore"
                                                value={formData.address}
                                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            />
                                        </Autocomplete>
                                    ) : (
                                        <Input
                                            required
                                            placeholder="e.g. MG Road, Bangalore"
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        />
                                    )}
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowMap(true)}
                                    className="px-3"
                                    title="Pick on Map"
                                >
                                    <MapIcon className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                    <IndianRupee className="w-4 h-4" /> Asking Price
                                </label>
                                <Input
                                    required
                                    type="number"
                                    placeholder="e.g. 7500000"
                                    value={formData.asking_price}
                                    onChange={(e) => setFormData({ ...formData, asking_price: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                    <Home className="w-4 h-4" /> Property Type
                                </label>
                                <select
                                    className="flex h-12 w-full rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-2 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50 transition-all appearance-none"
                                    value={formData.property_type}
                                    onChange={(e) => setFormData({ ...formData, property_type: e.target.value })}
                                >
                                    <option value="1bhk">1 BHK</option>
                                    <option value="2bhk">2 BHK</option>
                                    <option value="3bhk">3 BHK</option>
                                    <option value="4bhk+">4 BHK+</option>
                                    <option value="land">Land/Plot</option>
                                    <option value="villa">Villa</option>
                                </select>
                            </div>
                        </div>

                        {['land', 'plot', 'villa'].includes(formData.property_type) && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                    <Ruler className="w-4 h-4" /> Land Area (sqft)
                                </label>
                                <Input
                                    required={['land', 'plot'].includes(formData.property_type)}
                                    type="number"
                                    placeholder="e.g. 1200"
                                    value={formData.land_area_sqft}
                                    onChange={(e) => setFormData({ ...formData, land_area_sqft: e.target.value })}
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                <Ruler className="w-4 h-4" /> Search Radius ({formData.radius_m}m)
                            </label>
                            <input
                                type="range"
                                min="500"
                                max="10000"
                                step="500"
                                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                                value={formData.radius_m}
                                onChange={(e) => setFormData({ ...formData, radius_m: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                <Search className="w-4 h-4" /> Custom Requests / Preferences 
                            </label>
                            <Input
                                placeholder="e.g. Which floor is best? Any vaastu compliance needed?"
                                value={formData.custom_request}
                                onChange={(e) => setFormData({ ...formData, custom_request: e.target.value })}
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Analyzing..." : "Analyze Property"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {showMap && (
                <MapPicker
                    onSelect={handleMapSelect}
                    onClose={() => setShowMap(false)}
                />
            )}
        </>
    )
}

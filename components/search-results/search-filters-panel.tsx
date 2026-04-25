"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { SlidersHorizontal, X } from "lucide-react"
import { useState } from "react"

const INCIDENT_TYPES = [
    { value: "NON_RETURN", label: "Non-return of item/unit" },
    { value: "UNPAID_BALANCE", label: "Unpaid balance" },
    { value: "LATE_PAYMENT", label: "Consistently late payments" },
    { value: "SCAM", label: "Scam / Fraudulent transaction" },
    { value: "DAMAGE_DISPUTE", label: "Damage to item/property" },
    { value: "PROPERTY_DAMAGE", label: "Intentional property damage" },
    { value: "CONTRACT_VIOLATION", label: "Violated rental agreement" },
    { value: "FAKE_INFO", label: "Fake info / Identity mismatch" },
    { value: "NO_SHOW", label: "No-show / Ghosting" },
    { value: "ABUSIVE_BEHAVIOR", label: "Rude / Abusive behavior" },
    { value: "THREATS_HARASSMENT", label: "Threats / Harassment" },
    { value: "OTHER", label: "Other issue" },
]

const RENTAL_CATEGORIES = [
    { value: "CAMERA_EQUIPMENT", label: "Camera & Photography" },
    { value: "CLOTHING_FASHION", label: "Clothing & Fashion" },
    { value: "ELECTRONICS_GADGETS", label: "Electronics & Gadgets" },
    { value: "VEHICLE_CAR", label: "Car" },
    { value: "VEHICLE_MOTORCYCLE", label: "Motorcycle" },
    { value: "VEHICLE_BICYCLE", label: "Bicycle / E-bike" },
    { value: "REAL_ESTATE_CONDO", label: "Condo / Apartment" },
    { value: "REAL_ESTATE_HOUSE", label: "House" },
    { value: "REAL_ESTATE_ROOM", label: "Room / Bedspace" },
    { value: "FURNITURE_APPLIANCES", label: "Furniture & Appliances" },
    { value: "EVENTS_PARTY", label: "Events & Party" },
    { value: "TOOLS_EQUIPMENT", label: "Tools & Equipment" },
    { value: "SPORTS_OUTDOOR", label: "Sports & Outdoor" },
    { value: "JEWELRY_ACCESSORIES", label: "Jewelry & Accessories" },
    { value: "BABY_KIDS", label: "Baby & Kids" },
    { value: "OTHER", label: "Other" },
]

export interface SearchFilterValues {
    rentalCategory?: string
    incidentType?: string
    dateFrom?: string
    dateTo?: string
}

interface SearchFiltersPanelProps {
    filters: SearchFilterValues
    onChange: (filters: SearchFilterValues) => void
}

export function SearchFiltersPanel({ filters, onChange }: SearchFiltersPanelProps) {
    const [isExpanded, setIsExpanded] = useState(false)

    const hasActiveFilters = !!(filters.rentalCategory || filters.incidentType || filters.dateFrom || filters.dateTo)

    const handleClear = () => {
        onChange({ rentalCategory: undefined, incidentType: undefined, dateFrom: undefined, dateTo: undefined })
    }

    return (
        <div className="border rounded-lg bg-background shadow-sm">
            {/* Toggle Header */}
            <button
                type="button"
                className="w-full flex items-center justify-between p-4 text-left"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Filter Results</span>
                    {hasActiveFilters && (
                        <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                            {[filters.rentalCategory, filters.incidentType, filters.dateFrom, filters.dateTo].filter(Boolean).length}
                        </span>
                    )}
                </div>
                <span className="text-xs text-muted-foreground">{isExpanded ? "Hide" : "Show"}</span>
            </button>

            {/* Filter Fields */}
            {isExpanded && (
                <div className="px-4 pb-4 border-t pt-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Rental Category */}
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Rental Category</Label>
                            <Select
                                value={filters.rentalCategory || ""}
                                onValueChange={(v) => onChange({ ...filters, rentalCategory: v || undefined })}
                            >
                                <SelectTrigger className="h-9 text-sm">
                                    <SelectValue placeholder="All categories" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All categories</SelectItem>
                                    {RENTAL_CATEGORIES.map((cat) => (
                                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Incident Type */}
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Incident Type</Label>
                            <Select
                                value={filters.incidentType || ""}
                                onValueChange={(v) => onChange({ ...filters, incidentType: v || undefined })}
                            >
                                <SelectTrigger className="h-9 text-sm">
                                    <SelectValue placeholder="All incident types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All incident types</SelectItem>
                                    {INCIDENT_TYPES.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Date From */}
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Incident Date From</Label>
                            <Input
                                type="date"
                                className="h-9 text-sm"
                                value={filters.dateFrom || ""}
                                max={filters.dateTo || new Date().toISOString().split("T")[0]}
                                onChange={(e) => onChange({ ...filters, dateFrom: e.target.value || undefined })}
                            />
                        </div>

                        {/* Date To */}
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Incident Date To</Label>
                            <Input
                                type="date"
                                className="h-9 text-sm"
                                value={filters.dateTo || ""}
                                min={filters.dateFrom}
                                max={new Date().toISOString().split("T")[0]}
                                onChange={(e) => onChange({ ...filters, dateTo: e.target.value || undefined })}
                            />
                        </div>
                    </div>

                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-foreground"
                            onClick={handleClear}
                        >
                            <X className="h-3.5 w-3.5 mr-1.5" />
                            Clear all filters
                        </Button>
                    )}
                </div>
            )}
        </div>
    )
}

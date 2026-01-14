"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2, Save } from "lucide-react"
import type { Database } from "@/lib/database.types"

type Report = Database["public"]["Tables"]["incident_reports"]["Row"]

interface ReportEditorDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    report: Report
    onSave: (updates: Partial<Report>, changeNote: string) => Promise<void>
}

export function ReportEditorDialog({
    open,
    onOpenChange,
    report,
    onSave,
}: ReportEditorDialogProps) {
    const [isSaving, setIsSaving] = useState(false)
    const [changeNote, setChangeNote] = useState("")
    const [formData, setFormData] = useState({
        reported_full_name: report.reported_full_name || "",
        reported_phone: report.reported_phone || "",
        reported_email: report.reported_email || "",
        reported_facebook: report.reported_facebook || "",
        reported_address: report.reported_address || "",
        reported_date_of_birth: report.reported_date_of_birth || "",
        incident_date: report.incident_date || "",
        incident_end_date: report.incident_end_date || "",
        incident_place: report.incident_place || "",
        incident_city: report.incident_city || "",
        incident_region: report.incident_region || "",
        amount_involved: report.amount_involved || "",
        summary: report.summary || "",
        admin_notes: report.admin_notes || "",
    })

    const handleSave = async () => {
        if (!changeNote.trim()) {
            alert("Please provide a reason for the changes")
            return
        }

        setIsSaving(true)
        try {
            const updates: Partial<Report> = {}
            
            // Only include changed fields
            Object.keys(formData).forEach((key) => {
                const k = key as keyof typeof formData
                if (formData[k] !== (report[k as keyof Report] || "")) {
                    if (key === "amount_involved") {
                        updates[k as keyof Report] = formData[k] ? Number(formData[k]) : null as any
                    } else {
                        updates[k as keyof Report] = formData[k] || null as any
                    }
                }
            })

            if (Object.keys(updates).length === 0) {
                alert("No changes detected")
                return
            }

            await onSave(updates, changeNote)
            setChangeNote("")
            onOpenChange(false)
        } catch (error) {
            console.error("Save error:", error)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Report Details</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Renter Information */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-sm text-muted-foreground uppercase">Renter Information</h3>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 space-y-2">
                                <Label htmlFor="reported_full_name">Full Name *</Label>
                                <Input
                                    id="reported_full_name"
                                    value={formData.reported_full_name}
                                    onChange={(e) => setFormData({ ...formData, reported_full_name: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="reported_phone">Phone</Label>
                                <Input
                                    id="reported_phone"
                                    value={formData.reported_phone}
                                    onChange={(e) => setFormData({ ...formData, reported_phone: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="reported_email">Email</Label>
                                <Input
                                    id="reported_email"
                                    type="email"
                                    value={formData.reported_email}
                                    onChange={(e) => setFormData({ ...formData, reported_email: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="reported_facebook">Facebook Profile</Label>
                                <Input
                                    id="reported_facebook"
                                    value={formData.reported_facebook}
                                    onChange={(e) => setFormData({ ...formData, reported_facebook: e.target.value })}
                                    placeholder="https://facebook.com/..."
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="reported_date_of_birth">Date of Birth</Label>
                                <Input
                                    id="reported_date_of_birth"
                                    type="date"
                                    value={formData.reported_date_of_birth}
                                    onChange={(e) => setFormData({ ...formData, reported_date_of_birth: e.target.value })}
                                />
                            </div>

                            <div className="col-span-2 space-y-2">
                                <Label htmlFor="reported_address">Address</Label>
                                <Input
                                    id="reported_address"
                                    value={formData.reported_address}
                                    onChange={(e) => setFormData({ ...formData, reported_address: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Incident Information */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-sm text-muted-foreground uppercase">Incident Information</h3>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="incident_date">Incident Start Date *</Label>
                                <Input
                                    id="incident_date"
                                    type="date"
                                    value={formData.incident_date}
                                    onChange={(e) => setFormData({ ...formData, incident_date: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="incident_end_date">Incident End Date</Label>
                                <Input
                                    id="incident_end_date"
                                    type="date"
                                    value={formData.incident_end_date}
                                    onChange={(e) => setFormData({ ...formData, incident_end_date: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="incident_place">Place/Property Name</Label>
                                <Input
                                    id="incident_place"
                                    value={formData.incident_place}
                                    onChange={(e) => setFormData({ ...formData, incident_place: e.target.value })}
                                    placeholder="e.g., ABC Apartments"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="incident_city">City</Label>
                                <Input
                                    id="incident_city"
                                    value={formData.incident_city}
                                    onChange={(e) => setFormData({ ...formData, incident_city: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="incident_region">Region/Province</Label>
                                <Input
                                    id="incident_region"
                                    value={formData.incident_region}
                                    onChange={(e) => setFormData({ ...formData, incident_region: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="amount_involved">Amount Involved (₱)</Label>
                                <Input
                                    id="amount_involved"
                                    type="number"
                                    value={formData.amount_involved}
                                    onChange={(e) => setFormData({ ...formData, amount_involved: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="summary">Incident Summary *</Label>
                            <Textarea
                                id="summary"
                                value={formData.summary}
                                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                                rows={4}
                                className="resize-none"
                            />
                        </div>
                    </div>

                    {/* Admin Notes */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-sm text-muted-foreground uppercase">Admin Notes</h3>
                        <div className="space-y-2">
                            <Label htmlFor="admin_notes">Internal Notes (Not visible to reporter)</Label>
                            <Textarea
                                id="admin_notes"
                                value={formData.admin_notes}
                                onChange={(e) => setFormData({ ...formData, admin_notes: e.target.value })}
                                rows={3}
                                className="resize-none"
                                placeholder="Add any internal notes about this report..."
                            />
                        </div>
                    </div>

                    {/* Change Note */}
                    <div className="space-y-2 pt-4 border-t">
                        <Label htmlFor="change_note" className="text-amber-400">
                            Change Reason * (This will be tracked)
                        </Label>
                        <Textarea
                            id="change_note"
                            value={changeNote}
                            onChange={(e) => setChangeNote(e.target.value)}
                            rows={2}
                            className="resize-none"
                            placeholder="Explain why you're making these changes..."
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-4">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSaving}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving || !changeNote.trim()}
                            className="gap-2"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

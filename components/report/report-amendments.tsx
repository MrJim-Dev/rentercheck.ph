"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MultiInput } from "@/components/ui/multi-input"
import type { Enums } from "@/lib/database.types"
import {
    Plus,
    X,
    Phone,
    Mail,
    Facebook,
    Upload,
    Loader2,
} from "lucide-react"
import { createAmendment, uploadAmendmentEvidence, type AmendmentFormData } from "@/app/actions/report"
import { useRouter } from "next/navigation"

const AMENDMENT_TYPE_LABELS: Record<string, { label: string; description: string; icon: string }> = {
    ADDITIONAL_INFO: { 
        label: "Additional Information", 
        description: "Add more details to your report",
        icon: "📝" 
    },
    NEW_EVIDENCE: { 
        label: "New Evidence", 
        description: "Upload additional proof or documents",
        icon: "📎" 
    },
    CORRECTION: { 
        label: "Correction", 
        description: "Fix an error in your report",
        icon: "✏️" 
    },
    NEW_IDENTIFIER: { 
        label: "New Contact Info", 
        description: "Add phone, email, or social media",
        icon: "📱" 
    },
}

interface ReportAmendmentsProps {
    reportId: string
}

export function ReportAmendments({ reportId }: ReportAmendmentsProps) {
    const router = useRouter()
    const [showForm, setShowForm] = useState(false)
    const [amendmentType, setAmendmentType] = useState<Enums<"amendment_type"> | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Form fields
    const [additionalNotes, setAdditionalNotes] = useState("")
    const [newPhones, setNewPhones] = useState<string[]>([])
    const [newEmails, setNewEmails] = useState<string[]>([])
    const [newFacebooks, setNewFacebooks] = useState<string[]>([])
    const [newEvidenceFiles, setNewEvidenceFiles] = useState<File[]>([])

    const resetForm = () => {
        setShowForm(false)
        setAmendmentType(null)
        setAdditionalNotes("")
        setNewPhones([])
        setNewEmails([])
        setNewFacebooks([])
        setNewEvidenceFiles([])
        setError(null)
    }

    const validatePhone = (phone: string) => {
        const cleaned = phone.replace(/\D/g, "")
        return cleaned.length >= 7
    }

    const normalizePhone = (phone: string) => {
        return phone.replace(/\D/g, "")
    }

    const validateEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    }

    const normalizeFacebookLink = (link: string) => {
        if (!link.includes("facebook.com") && !link.includes("fb.com")) {
            return `https://facebook.com/${link}`
        }
        return link
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files)
            setNewEvidenceFiles(prev => [...prev, ...newFiles].slice(0, 5))
        }
    }

    const removeFile = (index: number) => {
        setNewEvidenceFiles(prev => prev.filter((_, i) => i !== index))
    }

    const handleSubmit = async () => {
        if (!amendmentType) {
            setError("Please select what you'd like to add")
            return
        }

        // Validate based on type
        if (amendmentType === "ADDITIONAL_INFO" || amendmentType === "CORRECTION") {
            if (!additionalNotes.trim()) {
                setError("Please provide details")
                return
            }
        }

        if (amendmentType === "NEW_IDENTIFIER") {
            if (newPhones.length === 0 && newEmails.length === 0 && newFacebooks.length === 0) {
                setError("Please add at least one contact identifier")
                return
            }
        }

        if (amendmentType === "NEW_EVIDENCE") {
            if (newEvidenceFiles.length === 0) {
                setError("Please upload at least one file")
                return
            }
        }

        setIsSubmitting(true)
        setError(null)

        try {
            // Prepare changes object
            const changes: any = {}
            
            if (amendmentType === "NEW_IDENTIFIER") {
                if (newPhones.length > 0) changes.phones = newPhones
                if (newEmails.length > 0) changes.emails = newEmails
                if (newFacebooks.length > 0) changes.facebooks = newFacebooks
            }

            // Create amendment
            const formData: AmendmentFormData = {
                reportId,
                amendmentType,
                changes,
                reporterNotes: additionalNotes || undefined,
            }

            const result = await createAmendment(formData)

            if (!result.success || !result.data) {
                setError(result.error || "Failed to create amendment")
                setIsSubmitting(false)
                return
            }

            // Upload evidence files if any
            if (amendmentType === "NEW_EVIDENCE" && newEvidenceFiles.length > 0) {
                for (const file of newEvidenceFiles) {
                    await uploadAmendmentEvidence(
                        reportId,
                        result.data.amendmentId,
                        "PHOTO",
                        file
                    )
                }
            }

            // Success - refresh and reset
            resetForm()
            router.refresh()
        } catch (err) {
            console.error("Error submitting amendment:", err)
            setError("An unexpected error occurred")
            setIsSubmitting(false)
        }
    }

    return (
        <div className="bg-card border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Updates & Amendments</h2>
                {!showForm && (
                    <Button 
                        size="sm" 
                        className="gap-2"
                        onClick={() => setShowForm(true)}
                    >
                        <Plus className="w-4 h-4" />
                        Add More Details
                    </Button>
                )}
            </div>

            {showForm && (
                <div className="p-4 bg-muted/30 rounded-xl border border-dashed space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-medium">Add New Information</h3>
                        <Button size="sm" variant="ghost" onClick={resetForm}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* Amendment Type Selection */}
                    <div className="space-y-2">
                        <Label>What would you like to add?</Label>
                        <div className="grid sm:grid-cols-2 gap-2">
                            {Object.entries(AMENDMENT_TYPE_LABELS).map(([type, config]) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setAmendmentType(type as Enums<"amendment_type">)}
                                    className={`p-3 rounded-lg border text-left transition-colors ${
                                        amendmentType === type
                                            ? "border-primary bg-primary/10"
                                            : "border-border hover:border-primary/50"
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">{config.icon}</span>
                                        <span className="text-sm font-medium">{config.label}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">{config.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Dynamic Fields */}
                    {amendmentType === "ADDITIONAL_INFO" && (
                        <div className="space-y-2">
                            <Label>Additional Information</Label>
                            <Textarea
                                placeholder="Provide any additional details..."
                                value={additionalNotes}
                                onChange={(e) => setAdditionalNotes(e.target.value)}
                                rows={4}
                            />
                        </div>
                    )}

                    {amendmentType === "CORRECTION" && (
                        <div className="space-y-2">
                            <Label>What needs to be corrected?</Label>
                            <Textarea
                                placeholder="Explain what was incorrect and what the correct information is..."
                                value={additionalNotes}
                                onChange={(e) => setAdditionalNotes(e.target.value)}
                                rows={4}
                            />
                        </div>
                    )}

                    {amendmentType === "NEW_IDENTIFIER" && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Phone className="w-3.5 h-3.5" />
                                    Phone Numbers
                                </Label>
                                <MultiInput
                                    values={newPhones}
                                    onChange={setNewPhones}
                                    placeholder="09XX XXX XXXX"
                                    maxItems={5}
                                    icon={<Phone className="w-4 h-4" />}
                                    validateFn={validatePhone}
                                    normalizeFn={normalizePhone}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Mail className="w-3.5 h-3.5" />
                                    Email Addresses
                                </Label>
                                <MultiInput
                                    values={newEmails}
                                    onChange={setNewEmails}
                                    placeholder="example@email.com"
                                    maxItems={5}
                                    icon={<Mail className="w-4 h-4" />}
                                    validateFn={validateEmail}
                                    normalizeFn={(v) => v.toLowerCase().trim()}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Facebook className="w-3.5 h-3.5" />
                                    Facebook Profiles
                                </Label>
                                <MultiInput
                                    values={newFacebooks}
                                    onChange={setNewFacebooks}
                                    placeholder="facebook.com/username"
                                    maxItems={5}
                                    icon={<Facebook className="w-4 h-4" />}
                                    normalizeFn={normalizeFacebookLink}
                                />
                            </div>
                        </div>
                    )}

                    {amendmentType === "NEW_EVIDENCE" && (
                        <div className="space-y-2">
                            <Label>Upload Files</Label>
                            <div className="space-y-2">
                                <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    multiple
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    id="evidence-upload"
                                />
                                <label htmlFor="evidence-upload">
                                    <Button type="button" variant="outline" className="w-full" asChild>
                                        <span className="flex items-center gap-2 cursor-pointer">
                                            <Upload className="w-4 h-4" />
                                            Choose Files
                                        </span>
                                    </Button>
                                </label>
                                {newEvidenceFiles.length > 0 && (
                                    <div className="space-y-1">
                                        {newEvidenceFiles.map((file, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                                                <span className="truncate">{file.name}</span>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => removeFile(idx)}
                                                >
                                                    <X className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {error && (
                        <p className="text-sm text-destructive">{error}</p>
                    )}

                    <div className="flex gap-2 justify-end pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={resetForm}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !amendmentType}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                "Submit for Review"
                            )}
                        </Button>
                    </div>

                    <p className="text-xs text-muted-foreground">
                        Note: New information will be reviewed by our team before being added to your report.
                    </p>
                </div>
            )}
        </div>
    )
}

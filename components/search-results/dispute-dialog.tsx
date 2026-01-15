"use client"

import { submitDispute, uploadDisputeEvidence } from "@/app/actions/disputes"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DISPUTE_CATEGORIES, type DisputeCategory } from "@/lib/disputes"
import { AlertTriangle, Check, Loader2, Upload, X } from "lucide-react"
import { useState } from "react"
// I'll check `app/layout.tsx` or similar for toast provider, but safe to use standard ui pattern or minimal approach.
// I see `useToast` often in shadcn. I'll stick to basic state if unsure, or try `sonner` if installed.
// Wait, I saw `components/ui/toaster.tsx` isn't in main file list but `sonner` is common.
// Let's assume `useToast` from `@/components/ui/use-toast` if standard shadcn.
// Checking imports in `ResultCard`... none. 
// I will use `useState` for success/error inline message to be safe.

interface DisputeDialogProps {
    reportId: string
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    children?: React.ReactNode
}

export function DisputeDialog({ reportId, isOpen, onOpenChange, children }: DisputeDialogProps) {
    const [reason, setReason] = useState("")
    const [category, setCategory] = useState<DisputeCategory | "">("")
    const [files, setFiles] = useState<File[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState("")

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files))
        }
    }

    const handleSubmit = async () => {
        if (!reason.trim() || !category) {
            setError("Please fill in all required fields")
            return
        }

        setIsSubmitting(true)
        setError("")

        try {
            // 1. Submit Dispute Details
            const result = await submitDispute(reportId, reason, category)

            if (!result.success || !result.data) {
                throw new Error(result.error || "Failed to submit dispute")
            }

            const disputeId = result.data.disputeId

            // 2. Upload Evidence (if any)
            if (files.length > 0) {
                const uploadPromises = files.map(file => uploadDisputeEvidence(disputeId, file))
                const uploadResults = await Promise.all(uploadPromises)

                const failed = uploadResults.filter(r => !r.success)
                if (failed.length > 0) {
                    console.warn("Some files failed to upload")
                }
            }

            setSuccess(true)
            setTimeout(() => {
                onOpenChange(false)
                setSuccess(false)
                setReason("")
                setCategory("")
                setFiles([])
            }, 2000)

        } catch (e: any) {
            setError(e.message || "An unexpected error occurred")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            {children && <DialogTrigger asChild>{children}</DialogTrigger>}
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-amber-600">
                        <AlertTriangle className="h-5 w-5" />
                        Dispute Report
                    </DialogTitle>
                    <DialogDescription>
                        Provide clear evidence to support your dispute. False disputes may lead to account penalties.
                    </DialogDescription>
                </DialogHeader>

                {success ? (
                    <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
                        <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                            <Check className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <h3 className="font-medium text-lg">Dispute Submitted</h3>
                            <p className="text-muted-foreground text-sm">Our team will review your case shortly.</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Category</Label>
                            <Select value={category} onValueChange={(v) => setCategory(v as DisputeCategory)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select reason for dispute" />
                                </SelectTrigger>
                                <SelectContent>
                                    {DISPUTE_CATEGORIES.map(cat => (
                                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Explanation</Label>
                            <Textarea
                                placeholder="Tell us why this report is inaccurate..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="min-h-[100px]"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Evidence (Images/PDF)</Label>
                            <div className="border border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors relative">
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*,.pdf"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={handleFileChange}
                                />
                                <div className="flex flex-col items-center gap-1 text-muted-foreground container-center">
                                    <Upload className="h-8 w-8 mb-1 opacity-50" />
                                    <span className="text-sm font-medium">Click to upload files</span>
                                    <span className="text-xs">{files.length > 0 ? `${files.length} file(s) selected` : "Supported: JPG, PNG, PDF"}</span>
                                </div>
                            </div>
                            {files.length > 0 && (
                                <div className="text-xs text-muted-foreground pl-1">
                                    Selected: {files.map(f => f.name).join(", ")}
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md flex items-center gap-2">
                                <X className="h-4 w-4" />
                                {error}
                            </div>
                        )}
                    </div>
                )}

                {!success && (
                    <DialogFooter>
                        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
                        <Button onClick={handleSubmit} disabled={isSubmitting || !reason.trim() || !category}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Submitting...
                                </>
                            ) : "Submit Dispute"}
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    )
}

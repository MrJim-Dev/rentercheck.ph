"use client"

import { getEvidenceUrl, getReportById, submitIncidentReport, updateIncidentReport, uploadEvidence, type ReportFormData } from "@/app/actions/report"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MultiInput } from "@/components/ui/multi-input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { Enums } from "@/lib/database.types"
import { zodResolver } from "@hookform/resolvers/zod"
import {
    AlertTriangle,
    ArrowRight,
    Ban,
    Building,
    Calendar,
    Camera,
    CheckCircle2,
    ChevronDown,
    Clock,
    CreditCard,
    Facebook,
    FileCheck,
    FileText,
    Home,
    Loader2,
    Mail,
    MapPin,
    MessageSquare,
    Phone,
    PiggyBank,
    Receipt,
    Shield,
    Sparkles,
    Upload,
    User,
    UserCircle,
    X,
    Zap,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"
import { ReportAmendments } from "./report-amendments"

// Incident types - covering various rental-related issues
const INCIDENT_TYPES = [
    // Financial issues
    { value: "NON_RETURN", label: "Non-return of item/unit", icon: "📦", category: "Transaction" },
    { value: "UNPAID_BALANCE", label: "Unpaid balance", icon: "💸", category: "Transaction" },
    { value: "LATE_PAYMENT", label: "Consistently late payments", icon: "⏰", category: "Transaction" },
    { value: "SCAM", label: "Scam / Fraudulent transaction", icon: "🚨", category: "Transaction" },

    // Property/Item issues
    { value: "DAMAGE_DISPUTE", label: "Damage to item/property", icon: "🔧", category: "Property" },
    { value: "PROPERTY_DAMAGE", label: "Intentional property damage", icon: "💥", category: "Property" },
    { value: "CONTRACT_VIOLATION", label: "Violated rental agreement", icon: "📋", category: "Property" },

    // Identity/Trust issues  
    { value: "FAKE_INFO", label: "Fake info / Identity mismatch", icon: "🎭", category: "Trust" },
    { value: "NO_SHOW", label: "No-show / Ghosting", icon: "👻", category: "Trust" },

    // Behavior issues
    { value: "ABUSIVE_BEHAVIOR", label: "Rude / Abusive behavior", icon: "😤", category: "Behavior" },
    { value: "THREATS_HARASSMENT", label: "Threats / Harassment", icon: "⚠️", category: "Behavior" },

    // Other
    { value: "OTHER", label: "Other issue", icon: "📝", category: "Other" },
] as const

// Rental categories for different types of rental businesses
const RENTAL_CATEGORIES = [
    { value: "CAMERA_EQUIPMENT", label: "Camera & Photography", icon: "📷" },
    { value: "CLOTHING_FASHION", label: "Clothing & Fashion", icon: "👗" },
    { value: "ELECTRONICS_GADGETS", label: "Electronics & Gadgets", icon: "📱" },
    { value: "VEHICLE_CAR", label: "Car", icon: "🚗" },
    { value: "VEHICLE_MOTORCYCLE", label: "Motorcycle", icon: "🏍️" },
    { value: "VEHICLE_BICYCLE", label: "Bicycle / E-bike", icon: "🚲" },
    { value: "REAL_ESTATE_CONDO", label: "Condo / Apartment", icon: "🏢" },
    { value: "REAL_ESTATE_HOUSE", label: "House", icon: "🏠" },
    { value: "REAL_ESTATE_ROOM", label: "Room / Bedspace", icon: "🛏️" },
    { value: "FURNITURE_APPLIANCES", label: "Furniture & Appliances", icon: "🪑" },
    { value: "EVENTS_PARTY", label: "Events & Party", icon: "🎉" },
    { value: "TOOLS_EQUIPMENT", label: "Tools & Equipment", icon: "🔧" },
    { value: "SPORTS_OUTDOOR", label: "Sports & Outdoor", icon: "⚽" },
    { value: "JEWELRY_ACCESSORIES", label: "Jewelry & Accessories", icon: "💍" },
    { value: "BABY_KIDS", label: "Baby & Kids", icon: "🧸" },
    { value: "OTHER", label: "Other", icon: "📦" },
] as const

type RentalCategory = typeof RENTAL_CATEGORIES[number]["value"]

type IncidentType = typeof INCIDENT_TYPES[number]["value"]

interface ProofFile {
    id: string
    file: File
    type: "agreement" | "payment" | "conversation" | "photo" | "renter_id" | "renter_photo"
    preview?: string
}

// Proof type buttons config - updated with renter ID and photo
const PROOF_TYPES = [
    { id: "agreement", label: "Rental Agreement", icon: FileText, color: "from-blue-500/20 to-blue-600/10 border-blue-500/30 hover:border-blue-400/50", description: "Booking confirmation" },
    { id: "payment", label: "Proof of Payment", icon: Receipt, color: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 hover:border-emerald-400/50", description: "Receipt or screenshot" },
    { id: "conversation", label: "Conversation", icon: MessageSquare, color: "from-violet-500/20 to-violet-600/10 border-violet-500/30 hover:border-violet-400/50", description: "Chat screenshots" },
    { id: "photo", label: "Item/Unit Photo", icon: Camera, color: "from-amber-500/20 to-amber-600/10 border-amber-500/30 hover:border-amber-400/50", description: "Before/after photos" },
] as const

// Additional renter identification uploads
const RENTER_ID_TYPES = [
    { id: "renter_id", label: "Renter's ID", icon: CreditCard, color: "from-rose-500/20 to-rose-600/10 border-rose-500/30 hover:border-rose-400/50", description: "Government ID photo" },
    { id: "renter_photo", label: "Renter's Photo", icon: UserCircle, color: "from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 hover:border-cyan-400/50", description: "Photo taken during rental" },
] as const

type ProofType = typeof PROOF_TYPES[number]["id"] | typeof RENTER_ID_TYPES[number]["id"]

// Philippine regions for location
const REGIONS = [
    "Metro Manila",
    "Cebu",
    "Davao",
    "Calabarzon",
    "Central Luzon",
    "Western Visayas",
    "Central Visayas",
    "Northern Mindanao",
    "Bicol Region",
    "Eastern Visayas",
    "Zamboanga Peninsula",
    "Ilocos Region",
    "Cagayan Valley",
    "SOCCSKSARGEN",
    "Caraga",
    "BARMM",
    "CAR",
    "MIMAROPA",
    "Other",
] as const

// Zod validation schema
const reportFormSchema = z.object({
    // Step 1: Renter identification (required)
    fullName: z.string()
        .min(2, "Full name must be at least 2 characters")
        .max(100, "Full name is too long")
        .regex(/^[a-zA-Z\s\u00C0-\u024F\u1E00-\u1EFF.-]+$/, "Please enter a valid name (letters, spaces, hyphens, and periods only)"),

    // Multiple identifiers (at least one required - validated in refine below)
    phones: z.array(z.string()).default([]),
    emails: z.array(z.string()).default([]),
    facebooks: z.array(z.string()).default([]),
    aliases: z.array(z.string()).default([]),

    // Additional renter details (optional)
    renterAddress: z.string().max(200, "Address is too long").optional(),
    renterCity: z.string().max(100, "City name is too long").optional(),
    renterBirthdate: z.string().optional(),

    // Step 2: Rental item details
    rentalCategory: z.string().optional(),
    rentalItemDescription: z.string().max(200, "Item description is too long").optional(),

    // Step 2: Incident details
    incidentType: z.string()
        .min(1, "Please select what type of incident occurred"),
    incidentDate: z.string()
        .min(1, "Incident date is required")
        .refine((date) => {
            const d = new Date(date);
            const today = new Date();
            today.setHours(23, 59, 59, 999);
            return d <= today;
        }, "Incident date cannot be in the future"),
    amountInvolved: z.string().optional(),

    // Step 2: Incident location (optional)
    incidentRegion: z.string().optional(),
    incidentCity: z.string().max(100, "City name is too long").optional(),
    incidentPlace: z.string().max(200, "Place description is too long").optional(),

    // Step 4: Summary
    summary: z.string()
        .min(20, "Please provide a more detailed summary (at least 20 characters)")
        .max(500, "Summary is too long (maximum 500 characters)"),

    // Step 5: Confirmations
    confirmTruth: z.boolean().refine((val) => val === true, {
        message: "You must confirm that this report is true"
    }),
    confirmBan: z.boolean().refine((val) => val === true, {
        message: "You must acknowledge the consequences of false reports"
    }),
}).refine((data) => {
    // Custom validation: at least one strong identifier required
    return data.phones.length > 0 || data.emails.length > 0 || data.facebooks.length > 0 || (data.renterBirthdate && data.renterBirthdate.trim().length > 0);
}, {
    message: "At least one identifier (phone, email, Facebook, or date of birth) is required to identify the renter",
    path: ["phones"]
});

type ReportFormSchema = z.infer<typeof reportFormSchema>

export function ReportForm({ reportId: initialReportId }: { reportId?: string }) {
    const isEditMode = !!initialReportId
    const router = useRouter()

    // React Hook Form with Zod validation
    const {
        control,
        handleSubmit,
        watch,
        reset,
        formState: { errors, isSubmitting: formIsSubmitting },
        setError,
        clearErrors,
        setValue,
    } = useForm<ReportFormSchema>({
        resolver: zodResolver(reportFormSchema),
        defaultValues: {
            fullName: "",
            phones: [],
            emails: [],
            facebooks: [],
            aliases: [],
            renterAddress: "",
            renterCity: "",
            renterBirthdate: "",
            rentalCategory: "",
            rentalItemDescription: "",
            incidentType: "",
            incidentDate: "",
            amountInvolved: "",
            incidentRegion: "",
            incidentCity: "",
            incidentPlace: "",
            summary: "",
            confirmTruth: false,
            confirmBan: false,
        },
        mode: "onTouched", // Validate on blur/touch
    });

    // UI state
    const [isLoadingReport, setIsLoadingReport] = useState(false)
    const [showMoreDetails, setShowMoreDetails] = useState(false)
    const [showAliases, setShowAliases] = useState(false)
    const [proofFiles, setProofFiles] = useState<ProofFile[]>([])
    const [existingEvidence, setExistingEvidence] = useState<Array<{ id: string; storage_path: string; evidence_type: string; url?: string }>>([])
    const [isDragging, setIsDragging] = useState(false)
    const [activeProofType, setActiveProofType] = useState<ProofType>("agreement")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [submitError, setSubmitError] = useState<string | null>(null)
    const [reportId, setReportId] = useState<string | null>(initialReportId || null)

    // OCR State
    const [isScanning, setIsScanning] = useState(false)
    const scanInputRef = useRef<HTMLInputElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const formRef = useRef<HTMLFormElement>(null)

    // Handle ID Scan
    const handleScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            setIsScanning(true)
            // Dynamically import scanner to avoid loading huge libraries if not used
            const { toast } = await import("sonner")
            toast.info("Scanning ID...", { description: "Extracting details..." })

            const { scanID } = await import('@/lib/ocr/scanner')
            const { name, dob, address, city } = await scanID(file);

            // 1. Auto-fill Form Fields
            if (name) setValue("fullName", name, { shouldValidate: true })
            if (dob) setValue("renterBirthdate", dob, { shouldValidate: true }) // Ensure format YYYY-MM-DD matches validation? Scanner returns formatted.

            if (address || city) {
                if (address) setValue("renterAddress", address, { shouldValidate: true })
                if (city) setValue("renterCity", city, { shouldValidate: true })

                setShowMoreDetails(true) // Expand details section
            }

            // 2. Auto-attach as Proof
            const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
            const proofFile: ProofFile = {
                id,
                file,
                type: "renter_id",
                preview: URL.createObjectURL(file)
            }
            setProofFiles(prev => [...prev, proofFile])

            toast.success("ID Scanned Successfully", {
                description: "Name, DOB, and Address have been filled."
            })

        } catch (error) {
            console.error("Scan failed:", error)
            const { toast } = await import("sonner")
            toast.error("Scan failed", { description: "Could not extract details. Please enter manually." })
        } finally {
            setIsScanning(false)
            if (scanInputRef.current) scanInputRef.current.value = ""
        }
    }

    // Load report data in edit mode
    useEffect(() => {
        if (isEditMode && initialReportId) {
            setIsLoadingReport(true)
            getReportById(initialReportId)
                .then((result) => {
                    if (result.success && result.data) {
                        const report = result.data.report

                        // Combine primary identifiers with additional ones
                        const allPhones = [report.reported_phone, ...(report.reported_phones as string[] || [])].filter(Boolean) as string[]
                        const allEmails = [report.reported_email, ...(report.reported_emails as string[] || [])].filter(Boolean) as string[]
                        const allFacebooks = [report.reported_facebook, ...(report.reported_facebooks as string[] || [])].filter(Boolean) as string[]

                        // Reset form with loaded data
                        reset({
                            fullName: report.reported_full_name || "",
                            phones: allPhones,
                            emails: allEmails,
                            facebooks: allFacebooks,
                            aliases: (report.reported_aliases as string[] || []),
                            renterAddress: report.reported_address || "",
                            renterCity: report.reported_city || "",
                            renterBirthdate: report.reported_date_of_birth || "",
                            rentalCategory: report.rental_category || "",
                            rentalItemDescription: report.rental_item_description || "",
                            incidentType: report.incident_type || "",
                            incidentDate: report.incident_date || "",
                            amountInvolved: report.amount_involved?.toString() || "",
                            incidentRegion: report.incident_region || "",
                            incidentCity: report.incident_city || "",
                            incidentPlace: report.incident_place || "",
                            summary: report.summary || "",
                            confirmTruth: true, // Already confirmed when created
                            confirmBan: true, // Already confirmed when created
                        })

                        // Show optional fields if they have data
                        if (report.reported_aliases && (report.reported_aliases as string[]).length > 0) {
                            setShowAliases(true)
                        }
                        if (report.reported_address || report.reported_city) {
                            setShowMoreDetails(true)
                        }

                        // Load existing evidence
                        const evidence = result.data.evidence || []
                        setExistingEvidence(evidence.map(ev => ({
                            id: ev.id,
                            storage_path: ev.storage_path,
                            evidence_type: ev.evidence_type,
                        })))

                        // Load URLs for existing evidence
                        Promise.all(
                            evidence.map(async (ev) => {
                                const urlResult = await getEvidenceUrl(ev.storage_path)
                                return {
                                    id: ev.id,
                                    storage_path: ev.storage_path,
                                    evidence_type: ev.evidence_type,
                                    url: urlResult.success ? urlResult.data?.url : undefined,
                                }
                            })
                        ).then(evidenceWithUrls => {
                            setExistingEvidence(evidenceWithUrls)
                        })
                    }
                })
                .catch((error) => {
                    console.error("Error loading report:", error)
                    setSubmitError("Failed to load report data")
                })
                .finally(() => {
                    setIsLoadingReport(false)
                })
        }
    }, [isEditMode, initialReportId, reset, setIsLoadingReport, setShowAliases, setShowMoreDetails, setSubmitError])

    // Watch form values for dynamic UI
    const phones = watch("phones");
    const emails = watch("emails");
    const facebooks = watch("facebooks");
    const aliases = watch("aliases");
    const renterAddress = watch("renterAddress");
    const renterCity = watch("renterCity");
    const renterBirthdate = watch("renterBirthdate");
    const summary = watch("summary");
    const fullName = watch("fullName");

    // Count optional strong identifiers filled (excluding DOB which is now a primary identifier)
    const strongIdentifiersCount = [
        renterAddress?.trim(),
        renterCity?.trim(),
        proofFiles.some(f => f.type === "renter_id"),
        proofFiles.some(f => f.type === "renter_photo"),
        aliases.length > 0,
    ].filter(Boolean).length

    // Count total identifiers (including date of birth as a strong identifier)
    const totalIdentifiersCount = phones.length + emails.length + facebooks.length + (renterBirthdate ? 1 : 0)

    // Check if user has provided at least one identifier
    const hasIdentifier = totalIdentifiersCount > 0;

    // Phone normalization helper
    const normalizePhone = (value: string) => {
        let cleaned = value.replace(/[^\d+]/g, "")
        if (cleaned.startsWith("0")) {
            cleaned = "+63" + cleaned.slice(1)
        } else if (cleaned.startsWith("63") && !cleaned.startsWith("+63")) {
            cleaned = "+" + cleaned
        } else if (cleaned.match(/^9\d{9}$/)) {
            cleaned = "+63" + cleaned
        }
        return cleaned
    }

    // Phone validation helper
    const validatePhone = (value: string) => {
        const digits = value.replace(/\D/g, "")
        return digits.length >= 7
    }

    // Email validation helper
    const validateEmail = (value: string) => {
        return value.includes("@") && value.includes(".") && value.length >= 5
    }

    // Facebook link normalization
    const normalizeFacebookLink = (value: string) => {
        if (!value.trim()) return ""
        if (value.includes("facebook.com") || value.includes("fb.com")) {
            if (!value.startsWith("http")) {
                return "https://" + value
            }
            return value
        }
        if (value.match(/^[a-zA-Z0-9.]+$/)) {
            return `https://facebook.com/${value}`
        }
        return value
    }

    // File handling
    const handleFileSelect = useCallback((files: FileList | null, type: ProofType) => {
        if (!files) return

        const newFiles: ProofFile[] = Array.from(files).map(file => {
            const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
            const proofFile: ProofFile = {
                id,
                file,
                type,
            }

            if (file.type.startsWith("image/")) {
                const reader = new FileReader()
                reader.onload = (e) => {
                    setProofFiles(prev => prev.map(pf =>
                        pf.id === id ? { ...pf, preview: e.target?.result as string } : pf
                    ))
                }
                reader.readAsDataURL(file)
            }

            return proofFile
        })

        setProofFiles(prev => [...prev, ...newFiles])
        // Clear any proof file errors
        clearErrors("root")
    }, [clearErrors])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        handleFileSelect(e.dataTransfer.files, activeProofType)
    }, [handleFileSelect, activeProofType])

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }, [])

    const removeFile = (id: string) => {
        setProofFiles(prev => prev.filter(f => f.id !== id))
    }

    // Map proof types to evidence types for the database
    const proofTypeToEvidenceType = (proofType: ProofType): Enums<"evidence_type"> => {
        const mapping: Record<ProofType, Enums<"evidence_type">> = {
            agreement: "RENTAL_AGREEMENT",
            payment: "PROOF_OF_PAYMENT",
            conversation: "CONVERSATION",
            photo: "ITEM_PHOTO",
            renter_id: "RENTER_ID",
            renter_photo: "RENTER_PHOTO",
        }
        return mapping[proofType]
    }

    // Scroll to first error
    const scrollToError = useCallback(() => {
        // Wait for DOM update
        setTimeout(() => {
            const firstError = formRef.current?.querySelector('[data-error="true"]');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Focus the input if possible
                const input = firstError.querySelector('input, textarea, select, button');
                if (input instanceof HTMLElement) {
                    input.focus();
                }
            }
        }, 100);
    }, []);

    const onSubmit = async (data: ReportFormSchema) => {
        // In edit mode, proof files are optional (already have evidence)
        if (!isEditMode && proofFiles.length === 0) {
            setError("root", {
                type: "manual",
                message: "At least one proof/evidence file is required to submit your report. Please upload photos, documents, or screenshots related to the incident."
            });
            scrollToError();
            return;
        }

        // Additional validation for identifiers with clear messaging
        if (data.phones.length === 0 && data.emails.length === 0 && data.facebooks.length === 0 && (!data.renterBirthdate || data.renterBirthdate.trim().length === 0)) {
            setError("root", {
                type: "manual",
                message: "Please provide at least one way to identify the renter: phone number, email address, Facebook profile, or date of birth. This is essential for report verification."
            });
            scrollToError();
            return;
        }

        setSubmitError(null);
        setIsSubmitting(true);

        try {
            // Prepare form data with multiple identifiers
            const formData: ReportFormData = {
                fullName: data.fullName.trim(),
                // Primary identifiers (first from each array)
                phone: data.phones[0] ? normalizePhone(data.phones[0]) : undefined,
                email: data.emails[0] || undefined,
                facebookLink: data.facebooks[0] ? normalizeFacebookLink(data.facebooks[0]) : undefined,
                // Additional identifiers (rest of arrays)
                additionalPhones: data.phones.slice(1).map(p => normalizePhone(p)),
                additionalEmails: data.emails.slice(1),
                additionalFacebooks: data.facebooks.slice(1).map(f => normalizeFacebookLink(f)),
                aliases: data.aliases.length > 0 ? data.aliases : undefined,
                // Other fields
                renterAddress: data.renterAddress?.trim() || undefined,
                renterCity: data.renterCity?.trim() || undefined,
                renterBirthdate: data.renterBirthdate || undefined,
                rentalCategory: data.rentalCategory as Enums<"rental_category"> || undefined,
                rentalItemDescription: data.rentalItemDescription?.trim() || undefined,
                incidentType: data.incidentType as Enums<"incident_type">,
                incidentDate: data.incidentDate,
                amountInvolved: data.amountInvolved ? parseFloat(data.amountInvolved) : undefined,
                incidentRegion: data.incidentRegion || undefined,
                incidentCity: data.incidentCity?.trim() || undefined,
                incidentPlace: data.incidentPlace?.trim() || undefined,
                summary: data.summary.trim(),
                confirmTruth: data.confirmTruth,
                confirmBan: data.confirmBan,
            }

            let newReportId: string

            if (isEditMode && reportId) {
                // Update existing report
                const result = await updateIncidentReport(reportId, formData)

                if (!result.success || !result.data) {
                    setSubmitError(result.error || "Failed to update report. Please try again.")
                    setIsSubmitting(false);
                    scrollToError();
                    return
                }

                newReportId = result.data.reportId
            } else {
                // Submit new report
                const result = await submitIncidentReport(formData)

                if (!result.success || !result.data) {
                    setSubmitError(result.error || "Failed to submit report. Please try again.")
                    setIsSubmitting(false);
                    scrollToError();
                    return
                }

                newReportId = result.data.reportId
                setReportId(newReportId)
            }

            // Upload new evidence files if any
            if (proofFiles.length > 0) {
                const uploadPromises = proofFiles.map(async (proofFile) => {
                    const evidenceType = proofTypeToEvidenceType(proofFile.type)
                    return uploadEvidence(newReportId, evidenceType, proofFile.file)
                })

                const uploadResults = await Promise.all(uploadPromises)

                // Check if any uploads failed
                const failedUploads = uploadResults.filter(r => !r.success)
                if (failedUploads.length > 0) {
                    console.warn(`${failedUploads.length} evidence files failed to upload`)
                    // Continue anyway - the report is submitted/updated
                }
            }

            setIsSubmitted(true)

            // In edit mode, redirect back to previous page after a short delay
            if (isEditMode) {
                setTimeout(() => {
                    router.back()
                }, 1000)
            } else {
                // Scroll to top to show success message for new reports
                window.scrollTo({ top: 0, behavior: 'smooth' })
            }
        } catch (error) {
            console.error("Error submitting report:", error)
            setSubmitError("An unexpected error occurred while submitting your report. Please try again. If the problem persists, contact support.")
            scrollToError();
        } finally {
            setIsSubmitting(false);
        }
    }

    // Success state
    if (isSubmitted) {
        // For edit mode, show brief success message before redirect
        if (isEditMode) {
            return (
                <div className="min-h-[60vh] flex items-center justify-center">
                    <div className="text-center max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="relative mb-6">
                            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center border border-emerald-500/30">
                                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Report Updated!</h2>
                        <p className="text-muted-foreground mb-4">
                            Redirecting you back...
                        </p>
                        <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                    </div>
                </div>
            )
        }

        // For new reports, show full success message
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="relative mb-6">
                        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center border border-emerald-500/30">
                            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                        </div>
                        <div className="absolute inset-0 w-20 h-20 mx-auto rounded-full bg-emerald-500/20 animate-ping" />
                    </div>

                    <h2 className="text-2xl font-bold mb-2">
                        {isEditMode ? "Report Updated!" : "Report Submitted!"}
                    </h2>
                    <p className="text-muted-foreground mb-2">
                        {isEditMode
                            ? "Your changes have been saved and are under review."
                            : "Your incident report is now under review."}
                    </p>
                    {reportId && (
                        <p className="text-sm text-muted-foreground/80 mb-6">
                            Report ID: <span className="font-mono font-medium">{reportId.slice(0, 8)}</span>
                        </p>
                    )}

                    <div className="bg-card border rounded-lg p-6 space-y-4 text-left">
                        <div className="flex items-start gap-3">
                            <Clock className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
                            <div>
                                <p className="font-medium text-sm mb-1">
                                    {isEditMode ? "Changes Under Review" : "Under Review"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {isEditMode
                                        ? "Our admin team will review your updates within 24-48 hours"
                                        : "Our admin team will review your report within 24-48 hours"}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Mail className="w-5 h-5 text-violet-400 mt-0.5 shrink-0" />
                            <div>
                                <p className="font-medium text-sm mb-1">Email Notification</p>
                                <p className="text-xs text-muted-foreground">
                                    You&apos;ll receive an email when your {isEditMode ? "changes are" : "report is"} approved or if we need more information
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Shield className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                            <div>
                                <p className="font-medium text-sm mb-1">Protecting the Community</p>
                                <p className="text-xs text-muted-foreground">
                                    Thank you for helping keep rental businesses safe
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex gap-3">
                        <Button asChild variant="outline" className="flex-1">
                            <Link href="/my-reports">View My Reports</Link>
                        </Button>
                        <Button asChild className="flex-1">
                            <Link href="/search">Search Database</Link>
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    // Loading state when fetching report in edit mode
    if (isLoadingReport) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading report data...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Amendments Section - Only in Edit Mode */}
            {isEditMode && reportId && (
                <ReportAmendments reportId={reportId} />
            )}

            <form ref={formRef} onSubmit={handleSubmit(onSubmit, () => scrollToError())} className="space-y-6 pb-8">
                {/* Global errors */}
                {(errors.root || submitError) && (
                    <div data-error="true" className="p-4 rounded-lg bg-rose-500/10 border-2 border-rose-500/30 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                        <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="font-medium text-rose-400 text-sm mb-1">Unable to Submit Report</p>
                            <p className="text-sm text-rose-300/90">
                                {errors.root?.message || submitError}
                            </p>
                        </div>
                    </div>
                )}

                {/* Step 1: Identify the Renter */}
                <section className="bg-card border rounded-xl p-6 shadow-sm space-y-5">
                    <div className="flex items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary/30 to-accent/20 flex items-center justify-center text-sm font-bold text-secondary">
                                1
                            </div>
                            <div>
                                <h2 className="font-semibold text-lg">Identify the Renter</h2>
                                <p className="text-sm text-muted-foreground">Provide at least one identifier + full name</p>
                            </div>
                        </div>

                        <div>
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                ref={scanInputRef}
                                onChange={handleScan}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={isScanning}
                                onClick={() => scanInputRef.current?.click()}
                                className="gap-2 text-secondary border-secondary/20 hover:bg-secondary/10 hover:text-secondary"
                            >
                                {isScanning ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Scanning ID...
                                    </>
                                ) : (
                                    <>
                                        <Camera className="w-4 h-4" />
                                        Scan ID to Auto-fill
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Full Name - Required */}
                    <div className="space-y-2" data-error={errors.fullName ? "true" : undefined}>
                        <Label htmlFor="fullName" className="text-sm">
                            Full Name <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative group">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 group-focus-within:text-secondary transition-colors w-4 h-4" />
                            <Controller
                                name="fullName"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        {...field}
                                        id="fullName"
                                        placeholder="Juan Dela Cruz"
                                        className={`pl-10 h-11 bg-background/50 border-input/50 focus-visible:border-secondary focus-visible:ring-secondary/20 ${errors.fullName ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20" : ""}`}
                                    />
                                )}
                            />
                        </div>
                        {errors.fullName && (
                            <p className="text-sm text-red-500 flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                {errors.fullName.message}
                            </p>
                        )}
                    </div>

                    {/* Identifier hint */}
                    <div className="bg-muted/30 rounded-lg p-4 border border-dashed">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Shield className="w-4 h-4 text-secondary" />
                                Provide at least ONE identifier for matching:
                            </p>
                            {totalIdentifiersCount > 0 && (
                                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                                    {totalIdentifiersCount} identifier{totalIdentifiersCount !== 1 ? "s" : ""}
                                </span>
                            )}
                        </div>

                        <div className="grid gap-4">
                            {/* Phone Numbers (multiple) */}
                            <div className="space-y-2">
                                <Label className="text-sm flex items-center gap-2">
                                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                                    Phone Number{phones.length > 1 ? "s" : ""}
                                    <span className="text-xs text-emerald-400 font-normal">(recommended)</span>
                                </Label>
                                <Controller
                                    name="phones"
                                    control={control}
                                    render={({ field }) => (
                                        <MultiInput
                                            values={field.value}
                                            onChange={field.onChange}
                                            placeholder="09171234567 or +63 917 123 4567"
                                            maxItems={5}
                                            icon={<Phone className="w-4 h-4" />}
                                            validateFn={validatePhone}
                                            normalizeFn={normalizePhone}
                                            addLabel="Add another phone"
                                            validationMessage="Enter at least 7 digits"
                                        />
                                    )}
                                />
                            </div>

                            {/* Email Addresses (multiple) */}
                            <div className="space-y-2">
                                <Label className="text-sm flex items-center gap-2">
                                    <Mail className="w-3.5 h-3.5 text-blue-400" />
                                    Email Address{emails.length > 1 ? "es" : ""}
                                </Label>
                                <Controller
                                    name="emails"
                                    control={control}
                                    render={({ field }) => (
                                        <MultiInput
                                            values={field.value}
                                            onChange={field.onChange}
                                            placeholder="renter@email.com"
                                            maxItems={5}
                                            icon={<Mail className="w-4 h-4" />}
                                            validateFn={validateEmail}
                                            normalizeFn={(v) => v.toLowerCase().trim()}
                                            addLabel="Add another email"
                                            validationMessage="Enter a valid email address"
                                        />
                                    )}
                                />
                            </div>

                            {/* Facebook Profiles (multiple) */}
                            <div className="space-y-2">
                                <Label className="text-sm flex items-center gap-2">
                                    <Facebook className="w-3.5 h-3.5 text-[#1877F2]" />
                                    Facebook Profile{facebooks.length > 1 ? "s" : ""}
                                </Label>
                                <Controller
                                    name="facebooks"
                                    control={control}
                                    render={({ field }) => (
                                        <MultiInput
                                            values={field.value}
                                            onChange={field.onChange}
                                            placeholder="facebook.com/username or profile link"
                                            maxItems={5}
                                            icon={<Facebook className="w-4 h-4" />}
                                            normalizeFn={normalizeFacebookLink}
                                            addLabel="Add another Facebook"
                                        />
                                    )}
                                />
                            </div>

                            {/* Date of Birth */}
                            <div className="space-y-2">
                                <Label htmlFor="renterBirthdate" className="text-sm flex items-center gap-2">
                                    <Calendar className="w-3.5 h-3.5 text-violet-400" />
                                    Date of Birth

                                </Label>
                                <Controller
                                    name="renterBirthdate"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            {...field}
                                            id="renterBirthdate"
                                            type="date"
                                            className="h-10 bg-background/50 border-input/50 focus-visible:border-secondary focus-visible:ring-secondary/20 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                                        />
                                    )}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Can be used if no phone, email, or Facebook is available
                                </p>
                            </div>
                        </div>

                        {/* Aliases section (collapsible) */}
                        <div className="mt-4 pt-4 border-t border-dashed">
                            <button
                                type="button"
                                onClick={() => setShowAliases(!showAliases)}
                                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <User className="w-3.5 h-3.5" />
                                {showAliases ? "Hide" : "Add"} known aliases/nicknames
                                {aliases.length > 0 && (
                                    <span className="text-xs bg-secondary/20 text-secondary px-1.5 py-0.5 rounded">
                                        {aliases.length}
                                    </span>
                                )}
                                <ChevronDown className={`w-4 h-4 transition-transform ${showAliases ? "rotate-180" : ""}`} />
                            </button>

                            {showAliases && (
                                <div className="mt-3 animate-in slide-in-from-top-2 duration-200">
                                    <Controller
                                        name="aliases"
                                        control={control}
                                        render={({ field }) => (
                                            <MultiInput
                                                values={field.value}
                                                onChange={field.onChange}
                                                placeholder="Known alias or nickname"
                                                maxItems={5}
                                                icon={<User className="w-4 h-4" />}
                                                addLabel="Add another alias"
                                            />
                                        )}
                                    />
                                    <p className="text-xs text-muted-foreground mt-2">
                                        If the renter uses different names on different platforms
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Validation message */}
                    {fullName && !hasIdentifier && (
                        <div className="flex items-center gap-2 text-sm text-amber-400 bg-amber-500/10 rounded-lg p-3 border border-amber-500/20">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>Please add at least one identifier (phone, email, Facebook, or date of birth)</span>
                        </div>
                    )}

                    {/* Multiple identifiers tip */}
                    {hasIdentifier && totalIdentifiersCount === 1 && (
                        <div className="flex items-center gap-2 text-sm text-blue-400 bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
                            <Sparkles className="w-4 h-4 shrink-0" />
                            <span>Tip: Adding multiple identifiers improves matching accuracy</span>
                        </div>
                    )}

                    {/* Collapsible: Add More Details (Strong Identifiers) */}
                    <div className="border border-dashed border-secondary/30 rounded-lg overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setShowMoreDetails(!showMoreDetails)}
                            className="w-full p-4 flex items-center justify-between hover:bg-muted/20 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary/20 to-accent/10 flex items-center justify-center">
                                    <Zap className="w-4 h-4 text-secondary" />
                                </div>
                                <div className="text-left">
                                    <p className="font-medium text-sm">Add More Details</p>
                                    <p className="text-xs text-muted-foreground">Optional but helps verify identity</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {strongIdentifiersCount > 0 && (
                                    <span className="text-xs bg-secondary/20 text-secondary px-2 py-0.5 rounded-full">
                                        {strongIdentifiersCount} added
                                    </span>
                                )}
                                <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${showMoreDetails ? "rotate-180" : ""}`} />
                            </div>
                        </button>

                        {showMoreDetails && (
                            <div className="p-4 pt-0 space-y-4 animate-in slide-in-from-top-2 duration-200">
                                <div className="h-px bg-border mb-4" />

                                {/* Renter's Address */}
                                <div className="space-y-2">
                                    <Label htmlFor="renterAddress" className="text-sm flex items-center gap-2">
                                        <Home className="w-3.5 h-3.5 text-amber-400" />
                                        Renter&apos;s Address
                                        <span className="text-xs text-muted-foreground font-normal">(if provided)</span>
                                    </Label>
                                    <Controller
                                        name="renterAddress"
                                        control={control}
                                        render={({ field }) => (
                                            <Input
                                                {...field}
                                                id="renterAddress"
                                                placeholder="Street, Barangay, etc."
                                                className="h-10 bg-background/50 border-input/50 focus-visible:border-secondary focus-visible:ring-secondary/20"
                                            />
                                        )}
                                    />
                                </div>

                                {/* Renter's City */}
                                <div className="space-y-2">
                                    <Label htmlFor="renterCity" className="text-sm flex items-center gap-2">
                                        <Building className="w-3.5 h-3.5 text-teal-400" />
                                        Renter&apos;s City/Municipality
                                    </Label>
                                    <Controller
                                        name="renterCity"
                                        control={control}
                                        render={({ field }) => (
                                            <Input
                                                {...field}
                                                id="renterCity"
                                                placeholder="e.g., Makati, Cebu City, Davao"
                                                className="h-10 bg-background/50 border-input/50 focus-visible:border-secondary focus-visible:ring-secondary/20"
                                            />
                                        )}
                                    />
                                </div>

                                <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-2">
                                    <Shield className="w-3 h-3" />
                                    These details strengthen identity matching and report credibility
                                </p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Step 2: What Happened */}
                <section className="bg-card border rounded-xl p-6 shadow-sm space-y-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary/30 to-accent/20 flex items-center justify-center text-sm font-bold text-secondary">
                            2
                        </div>
                        <div>
                            <h2 className="font-semibold text-lg">What Happened?</h2>
                            <p className="text-sm text-muted-foreground">Describe the incident and item rented</p>
                        </div>
                    </div>

                    {/* Rental Category & Item */}
                    <div className="bg-muted/30 rounded-lg p-4 border border-dashed space-y-4">
                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <span className="text-lg">🏷️</span>
                            What was rented?
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Category */}
                            <div className="space-y-2">
                                <Label htmlFor="rentalCategory" className="text-sm">
                                    Rental Category
                                </Label>
                                <Controller
                                    name="rentalCategory"
                                    control={control}
                                    render={({ field }) => (
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <SelectTrigger className="h-10 bg-background/50 border-input/50 focus:border-secondary focus:ring-secondary/20">
                                                <SelectValue placeholder="Select category..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {RENTAL_CATEGORIES.map((cat) => (
                                                    <SelectItem key={cat.value} value={cat.value}>
                                                        <span className="flex items-center gap-2">
                                                            <span>{cat.icon}</span>
                                                            <span>{cat.label}</span>
                                                        </span>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>

                            {/* Specific item */}
                            <div className="space-y-2">
                                <Label htmlFor="rentalItemDescription" className="text-sm">
                                    Item Description
                                </Label>
                                <Controller
                                    name="rentalItemDescription"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            {...field}
                                            id="rentalItemDescription"
                                            placeholder="e.g., Canon EOS R5, 2BR Condo, Honda Click"
                                            className="h-10 bg-background/50 border-input/50 focus-visible:border-secondary focus-visible:ring-secondary/20"
                                        />
                                    )}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Incident Type */}
                    <div className="space-y-2" data-error={errors.incidentType ? "true" : undefined}>
                        <Label htmlFor="incidentType" className="text-sm">
                            Incident Type <span className="text-destructive">*</span>
                        </Label>
                        <Controller
                            name="incidentType"
                            control={control}
                            render={({ field }) => (
                                <Select value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger className={`h-11 bg-background/50 border-input/50 focus:border-secondary focus:ring-secondary/20 ${errors.incidentType ? "border-red-500" : ""}`}>
                                        <SelectValue placeholder="Select what happened..." />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[300px]">
                                        {/* Group by category */}
                                        {["Transaction", "Property", "Trust", "Behavior", "Other"].map((category) => {
                                            const categoryItems = INCIDENT_TYPES.filter(t => t.category === category);
                                            if (categoryItems.length === 0) return null;
                                            return (
                                                <div key={category}>
                                                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                        {category} Issues
                                                    </div>
                                                    {categoryItems.map((type) => (
                                                        <SelectItem key={type.value} value={type.value}>
                                                            <span className="flex items-center gap-2">
                                                                <span>{type.icon}</span>
                                                                <span>{type.label}</span>
                                                            </span>
                                                        </SelectItem>
                                                    ))}
                                                </div>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.incidentType && (
                            <p className="text-sm text-red-500 flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                {errors.incidentType.message}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Date */}
                        <div className="space-y-2" data-error={errors.incidentDate ? "true" : undefined}>
                            <Label htmlFor="incidentDate" className="text-sm flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                When did it happen? <span className="text-destructive">*</span>
                            </Label>
                            <Controller
                                name="incidentDate"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        {...field}
                                        id="incidentDate"
                                        type="date"
                                        className={`h-10 bg-background/50 border-input/50 focus-visible:border-secondary focus-visible:ring-secondary/20 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert ${errors.incidentDate ? "border-red-500" : ""}`}
                                    />
                                )}
                            />
                            {errors.incidentDate && (
                                <p className="text-sm text-red-500 flex items-center gap-1.5">
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                    {errors.incidentDate.message}
                                </p>
                            )}
                        </div>

                        {/* Amount */}
                        <div className="space-y-2">
                            <Label htmlFor="amount" className="text-sm flex items-center gap-2">
                                <PiggyBank className="w-3.5 h-3.5 text-muted-foreground" />
                                Amount Involved <span className="text-xs text-muted-foreground font-normal">(optional)</span>
                            </Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">₱</span>
                                <Controller
                                    name="amountInvolved"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            {...field}
                                            id="amount"
                                            type="number"
                                            placeholder="0.00"
                                            className="pl-8 h-10 bg-background/50 border-input/50 focus-visible:border-secondary focus-visible:ring-secondary/20"
                                        />
                                    )}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Location of Incident */}
                    <div className="bg-muted/30 rounded-lg p-4 border border-dashed space-y-4">
                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-rose-400" />
                            Where did it happen? <span className="text-xs font-normal">(optional but helpful)</span>
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Region */}
                            <div className="space-y-2">
                                <Label htmlFor="incidentRegion" className="text-sm">Region</Label>
                                <Controller
                                    name="incidentRegion"
                                    control={control}
                                    render={({ field }) => (
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <SelectTrigger className="h-10 bg-background/50 border-input/50 focus:border-secondary focus:ring-secondary/20">
                                                <SelectValue placeholder="Select region..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {REGIONS.map((region) => (
                                                    <SelectItem key={region} value={region}>
                                                        {region}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>

                            {/* City */}
                            <div className="space-y-2">
                                <Label htmlFor="incidentCity" className="text-sm">City/Municipality</Label>
                                <Controller
                                    name="incidentCity"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            {...field}
                                            id="incidentCity"
                                            placeholder="e.g., Makati, Cebu City"
                                            className="h-10 bg-background/50 border-input/50 focus-visible:border-secondary focus-visible:ring-secondary/20"
                                        />
                                    )}
                                />
                            </div>
                        </div>

                        {/* Specific place */}
                        <div className="space-y-2">
                            <Label htmlFor="incidentPlace" className="text-sm">Specific Location/Establishment</Label>
                            <Controller
                                name="incidentPlace"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        {...field}
                                        id="incidentPlace"
                                        placeholder="e.g., Rental shop name, branch, address"
                                        className="h-10 bg-background/50 border-input/50 focus-visible:border-secondary focus-visible:ring-secondary/20"
                                    />
                                )}
                            />
                        </div>
                    </div>
                </section>

                {/* Step 3: Upload Proof */}
                <section className="bg-card border rounded-xl p-6 shadow-sm space-y-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary/30 to-accent/20 flex items-center justify-center text-sm font-bold text-secondary">
                            3
                        </div>
                        <div>
                            <h2 className="font-semibold text-lg">Upload Proof</h2>
                            <p className="text-sm text-muted-foreground">At least 1 required • You can blur sensitive info</p>
                        </div>
                    </div>

                    {/* Proof type buttons */}
                    <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Incident Evidence</p>
                        <div className="grid grid-cols-2 gap-3">
                            {PROOF_TYPES.map((type) => {
                                const Icon = type.icon
                                const isActive = activeProofType === type.id
                                const fileCount = proofFiles.filter(f => f.type === type.id).length

                                return (
                                    <button
                                        key={type.id}
                                        type="button"
                                        onClick={() => {
                                            setActiveProofType(type.id as ProofType)
                                            fileInputRef.current?.click()
                                        }}
                                        className={`
                                        relative p-4 rounded-xl border-2 transition-all duration-200
                                        bg-gradient-to-br ${type.color}
                                        ${isActive ? "ring-2 ring-secondary/50 ring-offset-2 ring-offset-card" : ""}
                                        hover:scale-[1.02] active:scale-[0.98]
                                        text-left group
                                    `}
                                    >
                                        <Icon className="w-5 h-5 mb-1.5 text-foreground/80 group-hover:text-foreground transition-colors" />
                                        <p className="font-medium text-sm">{type.label}</p>
                                        <p className="text-xs text-muted-foreground">{type.description}</p>
                                        {fileCount > 0 && (
                                            <div className="absolute top-2 right-2 min-w-5 h-5 px-1.5 rounded-full bg-emerald-500 flex items-center justify-center">
                                                <span className="text-xs text-white font-medium">{fileCount}</span>
                                            </div>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Renter ID uploads - separated section */}
                    <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                            <Zap className="w-3 h-3" />
                            Renter Identification <span className="font-normal normal-case">(optional - strong identifier)</span>
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            {RENTER_ID_TYPES.map((type) => {
                                const Icon = type.icon
                                const isActive = activeProofType === type.id
                                const fileCount = proofFiles.filter(f => f.type === type.id).length

                                return (
                                    <button
                                        key={type.id}
                                        type="button"
                                        onClick={() => {
                                            setActiveProofType(type.id as ProofType)
                                            fileInputRef.current?.click()
                                        }}
                                        className={`
                                        relative p-4 rounded-xl border-2 transition-all duration-200
                                        bg-gradient-to-br ${type.color}
                                        ${isActive ? "ring-2 ring-secondary/50 ring-offset-2 ring-offset-card" : ""}
                                        hover:scale-[1.02] active:scale-[0.98]
                                        text-left group
                                    `}
                                    >
                                        <Icon className="w-5 h-5 mb-1.5 text-foreground/80 group-hover:text-foreground transition-colors" />
                                        <p className="font-medium text-sm">{type.label}</p>
                                        <p className="text-xs text-muted-foreground">{type.description}</p>
                                        {fileCount > 0 && (
                                            <div className="absolute top-2 right-2 min-w-5 h-5 px-1.5 rounded-full bg-emerald-500 flex items-center justify-center">
                                                <span className="text-xs text-white font-medium">{fileCount}</span>
                                            </div>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
                            <Shield className="w-3 h-3" />
                            If you have a copy of the renter&apos;s ID or photo taken during pickup
                        </p>
                    </div>

                    {/* Hidden file input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,.pdf"
                        multiple
                        onChange={(e) => handleFileSelect(e.target.files, activeProofType)}
                        className="hidden"
                    />

                    {/* Drop zone */}
                    <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onClick={() => fileInputRef.current?.click()}
                        className={`
                        border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
                        ${isDragging
                                ? "border-secondary bg-secondary/10 scale-[1.02]"
                                : "border-input/50 hover:border-secondary/50 hover:bg-muted/20"
                            }
                    `}
                    >
                        <Upload className={`w-10 h-10 mx-auto mb-3 transition-colors ${isDragging ? "text-secondary" : "text-muted-foreground"}`} />
                        <p className="font-medium">
                            {isDragging ? "Drop files here!" : "Drag & drop files or click to browse"}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Supports images & PDFs • Mobile: tap to use camera
                        </p>
                    </div>

                    {/* Uploaded files preview */}
                    {proofFiles.length > 0 && (
                        <div className="space-y-3">
                            <p className="text-sm font-medium text-muted-foreground">
                                Uploaded ({proofFiles.length} file{proofFiles.length !== 1 ? "s" : ""})
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {proofFiles.map((pf) => (
                                    <div
                                        key={pf.id}
                                        className="relative group rounded-lg overflow-hidden border bg-muted/20 aspect-square"
                                    >
                                        {pf.preview ? (
                                            <img
                                                src={pf.preview}
                                                alt="Proof"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <FileText className="w-8 h-8 text-muted-foreground" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button
                                                type="button"
                                                onClick={() => removeFile(pf.id)}
                                                className="p-2 rounded-full bg-destructive text-white hover:bg-destructive/90 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
                                            <p className="text-xs text-white truncate capitalize">{pf.type.replace("_", " ")}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Existing evidence from database */}
                    {isEditMode && existingEvidence.length > 0 && (
                        <div className="space-y-3">
                            <p className="text-sm font-medium text-muted-foreground">
                                Existing Evidence ({existingEvidence.length} file{existingEvidence.length !== 1 ? "s" : ""})
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {existingEvidence.map((ev) => (
                                    <div
                                        key={ev.id}
                                        className="relative group rounded-lg overflow-hidden border bg-muted/20 aspect-square"
                                    >
                                        {ev.url && ev.evidence_type.includes("PHOTO") ? (
                                            <img
                                                src={ev.url}
                                                alt="Evidence"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <FileText className="w-8 h-8 text-muted-foreground" />
                                            </div>
                                        )}
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
                                            <p className="text-xs text-white truncate capitalize">{ev.evidence_type.toLowerCase().replace("_", " ")}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* No proof warning */}
                    {proofFiles.length === 0 && !isEditMode && (
                        <div className="flex items-center gap-2 text-sm text-amber-400 bg-amber-500/10 rounded-lg p-3 border border-amber-500/20">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>At least one proof file is required to submit</span>
                        </div>
                    )}
                    {proofFiles.length === 0 && isEditMode && existingEvidence.length === 0 && (
                        <div className="flex items-center gap-2 text-sm text-amber-400 bg-amber-500/10 rounded-lg p-3 border border-amber-500/20">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>No evidence files attached to this report</span>
                        </div>
                    )}
                </section>

                {/* Step 4: Summary */}
                <section className="bg-card border rounded-xl p-6 shadow-sm space-y-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary/30 to-accent/20 flex items-center justify-center text-sm font-bold text-secondary">
                            4
                        </div>
                        <div>
                            <h2 className="font-semibold text-lg">Brief Summary</h2>
                            <p className="text-sm text-muted-foreground">1-2 sentences about what happened (facts only)</p>
                        </div>
                    </div>

                    <div className="space-y-2" data-error={errors.summary ? "true" : undefined}>
                        <Controller
                            name="summary"
                            control={control}
                            render={({ field }) => (
                                <Textarea
                                    {...field}
                                    placeholder="Example: 'Unit due Jan 5, not returned. Renter stopped replying after Jan 7.'"
                                    className={`min-h-[100px] bg-background/50 border-input/50 focus-visible:border-secondary focus-visible:ring-secondary/20 resize-none ${errors.summary ? "border-red-500" : ""}`}
                                    maxLength={500}
                                />
                            )}
                        />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <p className="flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                Write only facts—avoid opinions or speculation
                            </p>
                            <span>{summary?.length || 0}/500</span>
                        </div>
                        {errors.summary && (
                            <p className="text-sm text-red-500 flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                {errors.summary.message}
                            </p>
                        )}
                    </div>
                </section>

                {/* Step 5: Confirmation & Submit */}
                <section className="bg-card border rounded-xl p-6 shadow-sm space-y-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary/30 to-accent/20 flex items-center justify-center text-sm font-bold text-secondary">
                            5
                        </div>
                        <div>
                            <h2 className="font-semibold text-lg">Confirm & Submit</h2>
                            <p className="text-sm text-muted-foreground">Review and agree to submit</p>
                        </div>
                    </div>

                    {/* Confirmation checkboxes */}
                    <div className="space-y-4" data-error={(errors.confirmTruth || errors.confirmBan) ? "true" : undefined}>
                        <label className="flex items-start gap-3 cursor-pointer group">
                            <Controller
                                name="confirmTruth"
                                control={control}
                                render={({ field }) => (
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        className="mt-0.5"
                                    />
                                )}
                            />
                            <div className="space-y-1">
                                <p className="text-sm font-medium group-hover:text-foreground transition-colors flex items-center gap-2">
                                    <FileCheck className="w-4 h-4 text-secondary" />
                                    I confirm this report is true
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    I can provide more information if asked for verification
                                </p>
                            </div>
                        </label>
                        {errors.confirmTruth && (
                            <p className="text-sm text-red-500 flex items-center gap-1.5 -mt-2">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                {errors.confirmTruth.message}
                            </p>
                        )}

                        <label className="flex items-start gap-3 cursor-pointer group">
                            <Controller
                                name="confirmBan"
                                control={control}
                                render={({ field }) => (
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        className="mt-0.5"
                                    />
                                )}
                            />
                            <div className="space-y-1">
                                <p className="text-sm font-medium group-hover:text-foreground transition-colors flex items-center gap-2">
                                    <Ban className="w-4 h-4 text-destructive" />
                                    I understand the consequences
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    False reports can result in my account being permanently banned
                                </p>
                            </div>
                        </label>
                        {errors.confirmBan && (
                            <p className="text-sm text-red-500 flex items-center gap-1.5 -mt-2">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                {errors.confirmBan.message}
                            </p>
                        )}
                    </div>

                    {/* Error message */}
                    {submitError && (
                        <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-medium text-rose-400 text-sm">Submission Failed</p>
                                <p className="text-sm text-rose-300/90">{submitError}</p>
                            </div>
                        </div>
                    )}

                    {/* Submit button */}
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-12 bg-gradient-to-r from-secondary to-accent hover:opacity-90 transition-opacity font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                {isEditMode ? "Updating Report..." : "Submitting Report..."}
                            </>
                        ) : (
                            <>
                                {isEditMode ? "Update Report" : "Submit Incident Report"}
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </>
                        )}
                    </Button>
                </section>
            </form>
        </div>
    )
}

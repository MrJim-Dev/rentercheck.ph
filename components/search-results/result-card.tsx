"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { ConfidenceLevel, SearchResultMatch } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
    AlertCircle,
    AlertTriangle,
    Calendar,
    Facebook,
    HelpCircle,
    Lock,
    Mail,
    MapPin,
    Package,
    Phone,
    Shield,
    Tag,
    User,
    UserCircle
} from "lucide-react";
import { useState } from "react";
import { AddIdentifierDialog } from "./add-identifier-dialog";
import { DisputeDialog } from "./dispute-dialog";

interface ResultCardProps {
    match: SearchResultMatch;
}

const confidenceConfig: Record<ConfidenceLevel, {
    color: string;
    bgColor: string;
    borderColor: string;
    icon: typeof AlertCircle;
    label: string;
    progressColor: string;
}> = {
    CONFIRMED: {
        color: "text-red-700",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        icon: AlertCircle,
        label: "Confirmed Match",
        progressColor: "bg-red-500",
    },
    HIGH: {
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        icon: Shield,
        label: "High Confidence",
        progressColor: "bg-red-400",
    },
    MEDIUM: {
        color: "text-amber-700",
        bgColor: "bg-amber-50",
        borderColor: "border-amber-200",
        icon: HelpCircle,
        label: "Possible Match",
        progressColor: "bg-amber-500",
    },
    LOW: {
        color: "text-gray-600",
        bgColor: "bg-gray-50",
        borderColor: "border-gray-200",
        icon: HelpCircle,
        label: "Low Confidence",
        progressColor: "bg-gray-400",
    },
    NONE: {
        color: "text-gray-500",
        bgColor: "bg-gray-50",
        borderColor: "border-gray-200",
        icon: HelpCircle,
        label: "Weak Match",
        progressColor: "bg-gray-300",
    },
};

function getSignalIcon(signal: string) {
    if (signal.includes("PHONE")) return Phone;
    if (signal.includes("EMAIL")) return Mail;
    if (signal.includes("FACEBOOK")) return Facebook;
    if (signal.includes("DATE_OF_BIRTH")) return Calendar;
    if (signal.includes("CITY") || signal.includes("REGION")) return MapPin;
    return User;
}

function getSignalLabel(signal: string): string {
    if (signal === "DATE_OF_BIRTH_NAME_MATCH") return "Date of Birth";
    if (signal.includes("PHONE")) return "Phone";
    if (signal.includes("EMAIL")) return "Email";
    if (signal.includes("FACEBOOK")) return "Facebook";
    if (signal.includes("NAME")) return "Name";
    if (signal === "CITY_MATCH") return "City";
    if (signal === "REGION_MATCH") return "Region";
    return signal.replace("_EXACT", "").replace("_FUZZY", "").replace("_", " ");
}

export function ResultCard({ match }: ResultCardProps) {
    const { renter, confidence, score, matchReason, hasStrongMatch, showDetails, requiresConfirmation, suggestedAction, matchSignals, displayLabel, foundViaAlias, matchedAlias } = match;

    const config = confidenceConfig[confidence];
    const Icon = config.icon;
    const [isDisputeOpen, setIsDisputeOpen] = useState(false);

    // Determine border color based on confidence
    const borderLeftColor = hasStrongMatch
        ? "border-l-red-500"
        : confidence === "MEDIUM"
            ? "border-l-amber-400"
            : "border-l-gray-300";

    return (
        <Card className={cn(
            "overflow-hidden transition-all hover:shadow-md border-l-4 group",
            borderLeftColor
        )}>
            <CardHeader className="pb-2 pt-3 px-3 sm:pb-3 sm:pt-4 sm:px-6 space-y-0">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
                    <div className="space-y-1 sm:space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            {/* Name - shown differently based on confidence */}
                            <h3 className={cn(
                                "font-bold text-sm sm:text-lg tracking-tight break-words",
                                !showDetails && "text-muted-foreground"
                            )}>
                                {showDetails ? renter.nameMasked : "Hidden Name"}
                            </h3>

                            {/* Found as Alias Badge */}
                            {foundViaAlias && matchedAlias && showDetails && (
                                <Badge variant="secondary" className="text-[10px] sm:text-xs h-4 sm:h-5 px-1 sm:px-1.5 bg-purple-50 text-purple-700 border-purple-200" title={`Found as alias: ${matchedAlias}`}>
                                    <Tag className="h-3 w-3 mr-0.5" />
                                    Found as Alias
                                </Badge>
                            )}

                            {/* Verification Badge */}
                            {renter.verificationStatus === 'verified' && showDetails && (
                                <Badge variant="secondary" className="text-[10px] sm:text-xs h-4 sm:h-5 px-1 sm:px-1.5 bg-green-50 text-green-700 border-green-200">
                                    Verified
                                </Badge>
                            )}
                        </div>

                        {/* Aliases Count (never show actual names) */}
                        {showDetails && renter.aliases && renter.aliases.length > 0 && (
                            <div className="flex items-start gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-muted-foreground">
                                <UserCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 mt-0.5 shrink-0" />
                                <span>
                                    {renter.aliases.length} {renter.aliases.length === 1 ? 'known alias' : 'known aliases'}
                                </span>
                            </div>
                        )}

                        {/* Match Info */}
                        <div className="flex flex-col gap-1.5 sm:gap-2 text-xs sm:text-sm">
                            {!showDetails && (
                                <div className="flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md bg-muted text-muted-foreground text-[10px] sm:text-xs font-medium w-fit">
                                    <Lock className="h-3 w-3 shrink-0" />
                                    <span className="leading-tight">Details hidden until confirmed</span>
                                </div>
                            )}

                            {/* Match label */}
                            <div className="text-[10px] sm:text-xs text-muted-foreground">
                                <span>Match:</span>
                            </div>

                            {/* Match Signals as icon-only badges */}
                            <div className="flex gap-1 sm:gap-1.5 flex-wrap">
                                {showDetails && matchSignals.length > 0 ? (
                                    <>
                                        {matchSignals.slice(0, 4).map((signal, i) => {
                                            const SignalIcon = getSignalIcon(signal);
                                            const label = getSignalLabel(signal);
                                            return (
                                                <Badge
                                                    key={i}
                                                    variant="outline"
                                                    className="text-[10px] sm:text-xs h-5 sm:h-6 px-1.5 sm:px-2 gap-0.5 sm:gap-1 font-normal"
                                                    title={label}
                                                >
                                                    <SignalIcon className="h-3 w-3" />
                                                    <span>{label}</span>
                                                </Badge>
                                            );
                                        })}
                                        {matchSignals.length > 4 && (
                                            <span className="text-xs text-muted-foreground self-center">
                                                +{matchSignals.length - 4}
                                            </span>
                                        )}
                                    </>
                                ) : (
                                    foundViaAlias && matchedAlias && (
                                        <Badge
                                            variant="secondary"
                                            className="text-[10px] sm:text-xs h-5 sm:h-6 px-1.5 sm:px-2 gap-0.5 sm:gap-1 bg-purple-50 text-purple-700 border-purple-200 font-medium"
                                        >
                                            <Tag className="h-3 w-3" />
                                            FOUND AS ALIAS
                                        </Badge>
                                    )
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Confidence Badge */}
                    <div className="flex flex-row sm:flex-col items-center sm:items-end gap-1.5 sm:gap-2">
                        <Badge
                            variant="outline"
                            className={cn(
                                "flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 shadow-sm whitespace-nowrap",
                                config.bgColor,
                                config.color,
                                config.borderColor
                            )}
                        >
                            <Icon className="h-3.5 w-3.5" />
                            <span className="text-xs sm:text-sm">{displayLabel}</span>
                        </Badge>

                        {/* Confidence Score */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-medium">{score}%</span>
                            <div className="w-12 sm:w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                                <div
                                    className={cn("h-full transition-all", config.progressColor)}
                                    style={{ width: `${Math.min(score, 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="px-3 sm:px-6 pb-2 sm:pb-4">
                {showDetails ? (
                    // STRONG MATCH: Show Summary Info + Incident Details
                    <div className="space-y-2 sm:space-y-4">
                        {/* Basic Stats Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-sm">
                            <div className="flex flex-col space-y-0.5 sm:space-y-1">
                                <span className="text-muted-foreground text-[10px] sm:text-xs uppercase tracking-wider font-medium">
                                    Reports
                                </span>
                                <span className="font-semibold text-base sm:text-lg">
                                    {renter.totalIncidents}
                                    {renter.verifiedIncidents > 0 && (
                                        <span className="text-xs font-normal text-green-600 ml-1">
                                            ({renter.verifiedIncidents} verified)
                                        </span>
                                    )}
                                </span>
                            </div>

                            {renter.city && (
                                <div className="flex flex-col space-y-0.5 sm:space-y-1">
                                    <span className="text-muted-foreground text-[10px] sm:text-xs uppercase tracking-wider font-medium">
                                        Location
                                    </span>
                                    <div className="flex items-center gap-1 sm:gap-1.5">
                                        <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground shrink-0" />
                                        <span className="font-medium text-xs sm:text-sm break-words">
                                            {renter.city}{renter.region ? `, ${renter.region}` : ""}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col space-y-0.5 sm:space-y-1 sm:text-left">
                                <span className="text-muted-foreground text-[10px] sm:text-xs uppercase tracking-wider font-medium">
                                    Last Activity
                                </span>
                                <div className="flex items-center gap-1 sm:gap-1.5 sm:justify-start">
                                    <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground shrink-0" />
                                    <span className="font-medium text-xs sm:text-sm">
                                        {renter.lastIncidentDate
                                            ? new Date(renter.lastIncidentDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                                            : "N/A"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Incident Summary Cards */}
                        {renter.incidentSummaries && renter.incidentSummaries.length > 0 && (
                            <div className="border-t pt-2 sm:pt-4 space-y-2 sm:space-y-3">
                                <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider font-medium">
                                    Incident Details
                                </span>
                                <div className="grid gap-2 sm:gap-3">
                                    {renter.incidentSummaries.slice(0, 2).map((incident, idx) => (
                                        <div
                                            key={idx}
                                            className="bg-muted/50 rounded-lg p-2 sm:p-3 text-sm"
                                        >
                                            <div className="space-y-1.5 sm:space-y-2.5 flex-1">
                                                {/* Incident Type & Category */}
                                                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            "text-[10px] sm:text-xs font-medium h-5 sm:h-6",
                                                            incident.type === 'SCAM' || incident.type === 'THREATS_HARASSMENT'
                                                                ? "bg-red-50 text-red-700 border-red-200"
                                                                : incident.type === 'NON_RETURN' || incident.type === 'UNPAID_BALANCE'
                                                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                                                    : "bg-gray-50 text-gray-700 border-gray-200"
                                                        )}
                                                    >
                                                        <Tag className="h-3 w-3 mr-1" />
                                                        {incident.typeLabel}
                                                    </Badge>
                                                    {incident.categoryLabel && (
                                                        <Badge
                                                            variant="outline"
                                                            className="text-[10px] sm:text-xs font-medium bg-blue-50 text-blue-700 border-blue-200 h-5 sm:h-6"
                                                        >
                                                            <Package className="h-3 w-3 mr-1" />
                                                            {incident.categoryLabel}
                                                        </Badge>
                                                    )}
                                                </div>

                                                {/* Item Description */}
                                                {incident.itemDescription && (
                                                    <div className="flex items-start gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground">
                                                        <Package className="h-3 w-3 sm:h-3.5 sm:w-3.5 mt-0.5 shrink-0" />
                                                        <span className="text-foreground break-words">{incident.itemDescription}</span>
                                                    </div>
                                                )}

                                                {/* Location & Date */}
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-[10px] sm:text-xs text-muted-foreground">
                                                    {incident.location && (
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                                                            <span className="break-words">{incident.location}</span>
                                                        </span>
                                                    )}
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                                                        {new Date(incident.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {renter.incidentSummaries.length > 2 && (
                                        <p className="text-xs text-muted-foreground text-center py-1">
                                            +{renter.incidentSummaries.length - 2} more incidents
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ) : requiresConfirmation ? (
                    // WEAK MATCH: Warning Message with suggested action
                    <div className={cn(
                        "rounded-lg p-3 sm:p-4 flex gap-2 sm:gap-3 text-sm shadow-sm",
                        confidence === "MEDIUM"
                            ? "bg-amber-50 border border-amber-200 text-amber-900"
                            : "bg-gray-50 border border-gray-200 text-gray-700"
                    )}>
                        <AlertTriangle className={cn(
                            "h-4 w-4 sm:h-5 sm:w-5 shrink-0 mt-0.5",
                            confidence === "MEDIUM" ? "text-amber-600" : "text-gray-500"
                        )} />
                        <div className="space-y-1 sm:space-y-1.5 min-w-0">
                            <p className="font-medium text-xs sm:text-base">Potential match found</p>
                            <p className={cn(
                                "leading-relaxed text-[10px] sm:text-sm",
                                confidence === "MEDIUM" ? "text-amber-800/90" : "text-gray-600"
                            )}>
                                We found records that may match, but details are hidden to prevent false identification.
                            </p>
                            {suggestedAction && (
                                <p className="font-semibold mt-2 text-xs sm:text-sm break-words">{suggestedAction}</p>
                            )}
                        </div>
                    </div>
                ) : (
                    // NO MATCH/VERY LOW: Minimal info
                    <div className="text-sm text-muted-foreground leading-relaxed">
                        <p>Very low confidence match. Add more identifying information to verify.</p>
                    </div>
                )}
            </CardContent>

            <CardFooter className="bg-muted/40 px-3 sm:px-6 py-2 sm:py-3 border-t flex justify-end gap-2">
                {showDetails ? (
                    <>
                        {/* Only show Dispute if not already disputed/confirmed? 
                            Since we don't have dispute status in 'match' object yet, we essentially allow anyone to click it.
                            Ideally we'd check if User already disputed, but for MVP we just show button. 
                        */}
                        <DisputeDialog
                            reportId={renter.incidentSummaries?.[0]?.id || ""}
                            isOpen={isDisputeOpen}
                            onOpenChange={setIsDisputeOpen}
                        >
                            <Button
                                variant="outline"
                                size="sm"
                                className="bg-background hover:bg-amber-50 hover:text-amber-900 border-amber-200 gap-1 sm:gap-1.5 text-[10px] sm:text-sm h-7 sm:h-9"
                            >
                                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                <span className="whitespace-nowrap">Dispute Incident</span>
                            </Button>
                        </DisputeDialog>
                    </>
                ) : (
                    <AddIdentifierDialog
                        renterName={renter.nameMasked}
                        suggestedAction={suggestedAction}
                    />
                )}
            </CardFooter>
        </Card>
    );
}

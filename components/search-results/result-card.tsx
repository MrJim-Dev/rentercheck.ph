"use client";

import { RequestDetailsDialog } from "@/components/renter-profile/request-details-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SearchResultMatch, ConfidenceLevel } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
    AlertCircle,
    HelpCircle,
    Lock,
    MessageSquare,
    User,
    Phone,
    Mail,
    Facebook,
    MapPin,
    Calendar,
    FileWarning,
    ChevronRight,
    Shield,
    AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { AddIdentifierDialog } from "./add-identifier-dialog";

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
    if (signal.includes("CITY") || signal.includes("REGION")) return MapPin;
    return User;
}

export function ResultCard({ match }: ResultCardProps) {
    const { renter, confidence, score, matchReason, hasStrongMatch, showDetails, requiresConfirmation, suggestedAction, matchSignals, displayLabel } = match;

    const config = confidenceConfig[confidence];
    const Icon = config.icon;

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
            <CardHeader className="pb-3 pt-5 px-6 flex flex-row items-start justify-between space-y-0">
                <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Name - shown differently based on confidence */}
                        <h3 className={cn(
                            "font-bold text-xl tracking-tight",
                            !showDetails && "text-muted-foreground"
                        )}>
                            {showDetails ? renter.nameMasked : "Hidden Name"}
                        </h3>

                        {/* Verification Badge */}
                        {renter.verificationStatus === 'verified' && showDetails && (
                            <Badge variant="secondary" className="text-xs h-5 px-1.5 bg-green-50 text-green-700 border-green-200">
                                Verified
                            </Badge>
                        )}
                    </div>

                    {/* Match Reason */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {showDetails ? (
                            <div className="flex items-center gap-1.5">
                                <span>Match:</span>
                                <span className="font-medium text-foreground">{matchReason}</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-xs font-medium w-fit">
                                <Lock className="h-3 w-3" />
                                Details hidden until confirmed
                            </div>
                        )}
                    </div>

                    {/* Match Signals as chips */}
                    {showDetails && matchSignals.length > 0 && (
                        <div className="flex gap-1.5 flex-wrap mt-2">
                            {matchSignals.slice(0, 3).map((signal, i) => {
                                const SignalIcon = getSignalIcon(signal);
                                return (
                                    <Badge
                                        key={i}
                                        variant="outline"
                                        className="text-xs h-5 px-2 gap-1 font-normal"
                                    >
                                        <SignalIcon className="h-3 w-3" />
                                        {signal.replace("_EXACT", "").replace("_FUZZY", "").replace("_", " ")}
                                    </Badge>
                                );
                            })}
                            {matchSignals.length > 3 && (
                                <span className="text-xs text-muted-foreground">
                                    +{matchSignals.length - 3} more
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Confidence Badge */}
                <div className="flex flex-col items-end gap-2">
                    <Badge
                        variant="outline"
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1 shadow-sm",
                            config.bgColor,
                            config.color,
                            config.borderColor
                        )}
                    >
                        <Icon className="h-3.5 w-3.5" />
                        {displayLabel}
                    </Badge>

                    {/* Confidence Score */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{score}%</span>
                        <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                                className={cn("h-full transition-all", config.progressColor)}
                                style={{ width: `${Math.min(score, 100)}%` }}
                            />
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="px-6 pb-5">
                {showDetails ? (
                    // STRONG MATCH: Show Summary Info
                    <div className="flex items-center gap-8 text-sm">
                        <div className="flex flex-col">
                            <span className="text-muted-foreground text-xs uppercase tracking-wider font-medium">
                                Reports
                            </span>
                            <span className="font-semibold text-lg">
                                {renter.totalIncidents}
                                {renter.verifiedIncidents > 0 && (
                                    <span className="text-xs font-normal text-green-600 ml-1">
                                        ({renter.verifiedIncidents} verified)
                                    </span>
                                )}
                            </span>
                        </div>

                        {renter.city && (
                            <div className="flex flex-col">
                                <span className="text-muted-foreground text-xs uppercase tracking-wider font-medium">
                                    Location
                                </span>
                                <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3 text-muted-foreground" />
                                    <span className="font-medium">
                                        {renter.city}{renter.region ? `, ${renter.region}` : ""}
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col ml-auto text-right">
                            <span className="text-muted-foreground text-xs uppercase tracking-wider font-medium">
                                Last Activity
                            </span>
                            <div className="flex items-center gap-1 justify-end">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                <span className="font-medium">
                                    {renter.lastIncidentDate
                                        ? new Date(renter.lastIncidentDate).toLocaleDateString()
                                        : "N/A"}
                                </span>
                            </div>
                        </div>
                    </div>
                ) : requiresConfirmation ? (
                    // WEAK MATCH: Warning Message with suggested action
                    <div className={cn(
                        "rounded-lg p-4 flex gap-3 text-sm shadow-sm",
                        confidence === "MEDIUM"
                            ? "bg-amber-50 border border-amber-200 text-amber-900"
                            : "bg-gray-50 border border-gray-200 text-gray-700"
                    )}>
                        <AlertTriangle className={cn(
                            "h-5 w-5 shrink-0 mt-0.5",
                            confidence === "MEDIUM" ? "text-amber-600" : "text-gray-500"
                        )} />
                        <div className="space-y-1">
                            <p className="font-medium">Potential match found</p>
                            <p className={cn(
                                "leading-relaxed",
                                confidence === "MEDIUM" ? "text-amber-800/90" : "text-gray-600"
                            )}>
                                We found records that may match, but details are hidden to prevent false identification.
                            </p>
                            {suggestedAction && (
                                <p className="font-semibold mt-2">{suggestedAction}</p>
                            )}
                        </div>
                    </div>
                ) : (
                    // NO MATCH/VERY LOW: Minimal info
                    <div className="text-sm text-muted-foreground">
                        <p>Very low confidence match. Add more identifying information to verify.</p>
                    </div>
                )}
            </CardContent>

            <CardFooter className="bg-muted/40 px-6 py-3 border-t flex justify-end gap-2">
                {showDetails ? (
                    <>
                        {renter.totalIncidents > 0 && (
                            <Link href={`/renter/${renter.fingerprint}`}>
                                <Button variant="default" size="sm" className="gap-1.5">
                                    View Profile
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </Link>
                        )}
                        <Link href="/report">
                            <Button variant="outline" size="sm" className="bg-background hover:bg-muted hover:text-foreground gap-1.5">
                                <FileWarning className="h-3.5 w-3.5" />
                                Report Incident
                            </Button>
                        </Link>
                        <RequestDetailsDialog />
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

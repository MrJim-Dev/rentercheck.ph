import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IncidentReport } from "@/lib/types";
import { AlertCircle, Calendar, DollarSign, FileText } from "lucide-react";

interface IncidentTimelineProps {
    incidents: IncidentReport[];
}

const categoryLabels: Record<string, string> = {
    NON_PAYMENT: "Non-Payment",
    NON_RETURN: "Non-Return",
    UNPAID_BALANCE: "Unpaid Balance",
    PROPERTY_DAMAGE: "Property Damage",
    DAMAGE_DISPUTE: "Damage Dispute",
    LEASE_VIOLATION: "Lease Violation",
    FAKE_INFO: "Fake Information",
    THREATS_HARASSMENT: "Threats/Harassment",
    ILLEGAL_ACTIVITY: "Illegal Activity",
    OTHER: "Other",
};

const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
    VERIFIED: "bg-green-100 text-green-800 border-green-200",
    DISPUTED: "bg-orange-100 text-orange-800 border-orange-200",
    RESOLVED: "bg-blue-100 text-blue-800 border-blue-200",
};

const categoryColors: Record<string, string> = {
    NON_PAYMENT: "text-red-700 bg-red-50",
    NON_RETURN: "text-orange-700 bg-orange-50",
    UNPAID_BALANCE: "text-amber-700 bg-amber-50",
    PROPERTY_DAMAGE: "text-purple-700 bg-purple-50",
    DAMAGE_DISPUTE: "text-pink-700 bg-pink-50",
    LEASE_VIOLATION: "text-indigo-700 bg-indigo-50",
    FAKE_INFO: "text-red-700 bg-red-50",
    THREATS_HARASSMENT: "text-rose-700 bg-rose-50",
    ILLEGAL_ACTIVITY: "text-red-800 bg-red-100",
    OTHER: "text-gray-700 bg-gray-50",
};

export function IncidentTimeline({ incidents }: IncidentTimelineProps) {
    const sortedIncidents = [...incidents].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Incident Timeline
                </CardTitle>
            </CardHeader>
            <CardContent>
                {sortedIncidents.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No incidents reported</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {sortedIncidents.map((incident, index) => (
                            <div
                                key={incident.id}
                                className="relative pl-6 pb-4 border-l-2 border-muted last:border-transparent"
                            >
                                {/* Timeline dot */}
                                <div className="absolute left-0 top-0 -translate-x-[9px] w-4 h-4 rounded-full bg-background border-2 border-primary" />

                                {/* Incident card */}
                                <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Badge
                                                variant="outline"
                                                className={categoryColors[incident.category] || categoryColors.OTHER}
                                            >
                                                {categoryLabels[incident.category] || incident.category}
                                            </Badge>
                                            <Badge
                                                variant="outline"
                                                className={statusColors[incident.status] || statusColors.PENDING}
                                            >
                                                {incident.status}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground whitespace-nowrap">
                                            <Calendar className="h-3.5 w-3.5" />
                                            {new Date(incident.date).toLocaleDateString("en-US", {
                                                year: "numeric",
                                                month: "short",
                                                day: "numeric",
                                            })}
                                        </div>
                                    </div>

                                    <p className="text-sm text-foreground">{incident.description}</p>

                                    {incident.amountInvolved && (
                                        <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                                            <DollarSign className="h-3.5 w-3.5" />
                                            Amount: ₱{incident.amountInvolved.toLocaleString()}
                                        </div>
                                    )}

                                    {incident.evidenceUrls && incident.evidenceUrls.length > 0 && (
                                        <div className="text-xs text-muted-foreground">
                                            {incident.evidenceUrls.length} evidence file(s) attached
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RenterProfile } from "@/lib/types";
import { Calendar, CheckCircle2, Shield } from "lucide-react";
import { RequestDetailsDialog } from "./request-details-dialog";

interface ProfileSummaryProps {
    profile: RenterProfile;
}

export function ProfileSummary({ profile }: ProfileSummaryProps) {
    return (
        <Card className="mb-6 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 h-24" />
            <CardContent className="pt-0 relative">
                <div className="flex flex-col md:flex-row items-start md:items-end -mt-10 mb-4 gap-4">
                    <div className="rounded-full bg-background p-1.5 shadow-lg">
                        <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground border-2 border-muted-foreground/10">
                            {profile.nameMasked.charAt(0)}
                        </div>
                    </div>
                    <div className="flex-1 space-y-1 mt-2 md:mt-0">
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold">{profile.nameMasked}</h1>
                            {profile.verificationStatus === 'VERIFIED' && (
                                <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-transparent">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Verified Renter
                                </Badge>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground font-mono">ID: {profile.fingerprint}</p>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
                        <RequestDetailsDialog />
                        <Button>Report New Incident</Button>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-t">
                    <div className="space-y-1">
                        <span className="text-xs text-muted-foreground font-medium uppercase">Total Reports</span>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold">{profile.totalIncidents}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Across 3 years</p>
                    </div>

                    <div className="space-y-1">
                        <span className="text-xs text-muted-foreground font-medium uppercase">Last Reported</span>
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold">{profile.lastIncidentDate ? new Date(profile.lastIncidentDate).toLocaleDateString() : 'N/A'}</span>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <span className="text-xs text-muted-foreground font-medium uppercase">Most Common</span>
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-sm">Non-Payment</span>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <span className="text-xs text-muted-foreground font-medium uppercase">Risk Assessment</span>
                        <div className="flex items-center gap-2">
                            <Shield className={`h-4 w-4 ${profile.matchConfidence === 'HIGH' ? 'text-red-500' : 'text-yellow-500'}`} />
                            <span className="font-semibold">{profile.matchConfidence} Risk</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

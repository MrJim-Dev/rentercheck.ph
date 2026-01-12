import { RequestDetailsDialog } from "@/components/renter-profile/request-details-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { RenterProfile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AlertCircle, HelpCircle, Lock, MessageSquare, User } from "lucide-react";
import { AddIdentifierDialog } from "./add-identifier-dialog";

interface ResultCardProps {
    profile: RenterProfile;
}

export function ResultCard({ profile }: ResultCardProps) {
    const isStrongMatch = ['PHONE_MATCH', 'EMAIL_MATCH', 'GOVT_ID_MATCH'].includes(profile.matchType);

    // Logic helpers
    const getBadgeConfig = () => {
        if (profile.matchType === 'NAME_MATCH') {
            return { label: 'Possible Match', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: HelpCircle };
        }
        return { label: 'Match Found', color: 'bg-red-50 text-red-700 border-red-200', icon: AlertCircle };
    };

    const badge = getBadgeConfig();

    return (
        <Card className="overflow-hidden transition-all hover:shadow-md border-l-4 border-l-transparent hover:border-l-primary group">
            <CardHeader className="pb-3 pt-5 px-6 flex flex-row items-start justify-between space-y-0">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                        {/* HIDE Name for Name Matches, Show for Strong Matches (masked) */}
                        <h3 className={cn("font-bold text-xl tracking-tight", !isStrongMatch && "text-muted-foreground")}>
                            {isStrongMatch ? profile.nameMasked : "Hidden Name"}
                        </h3>
                        {profile.verificationStatus === 'VERIFIED' && isStrongMatch && (
                            <Badge variant="secondary" className="text-xs h-5 px-1.5 bg-green-50 text-green-700 border-green-200">
                                Verified Profile
                            </Badge>
                        )}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                        {isStrongMatch ? (
                            <>Status: <span className="font-semibold text-foreground capitalize">{profile.verificationStatus.toLowerCase()}</span></>
                        ) : (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-xs font-medium w-fit">
                                <Lock className="h-3 w-3" />
                                Identifying details hidden
                            </div>
                        )}
                    </div>
                </div>

                <Badge variant="outline" className={cn("flex items-center gap-1.5 px-3 py-1 shadow-sm", badge.color)}>
                    <badge.icon className="h-3.5 w-3.5" />
                    {badge.label}
                </Badge>
            </CardHeader>

            <CardContent className="px-6 pb-5">
                {isStrongMatch ? (
                    // STRONG MATCH: Show Summary Info
                    <div className="flex items-center gap-8 text-sm">
                        <div className="flex flex-col">
                            <span className="text-muted-foreground text-xs uppercase tracking-wider font-medium">Reports</span>
                            <span className="font-semibold text-lg">{profile.totalIncidents}</span>
                        </div>
                        {profile.incidents.length > 0 && (
                            <div className="flex flex-col">
                                <span className="text-muted-foreground text-xs uppercase tracking-wider font-medium">Categories</span>
                                <div className="flex gap-1 flex-wrap mt-0.5">
                                    {profile.incidents.slice(0, 2).map((inc, i) => (
                                        <Badge key={i} variant="secondary" className="text-[10px] h-5 px-1.5 font-normal">
                                            {inc.category.replace('_', ' ')}
                                        </Badge>
                                    ))}
                                    {profile.incidents.length > 2 && <span className="text-xs text-muted-foreground">+{profile.incidents.length - 2} more</span>}
                                </div>
                            </div>
                        )}
                        <div className="flex flex-col ml-auto text-right">
                            <span className="text-muted-foreground text-xs uppercase tracking-wider font-medium">Latest</span>
                            <span className="font-medium">{profile.lastIncidentDate ? new Date(profile.lastIncidentDate).toLocaleDateString() : 'N/A'}</span>
                        </div>
                    </div>
                ) : (
                    // WEAK MATCH: Warning Message
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 text-sm text-amber-900 shadow-sm">
                        <User className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
                        <div className="space-y-1">
                            <p className="font-medium">Potential match found</p>
                            <p className="text-amber-800/90 leading-relaxed">
                                We found records matching this name, but details are hidden to prevent false identification.
                                <br />
                                <span className="font-semibold">Please add a phone number or email to confirm.</span>
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>

            <CardFooter className="bg-muted/40 px-6 py-3 border-t flex justify-end gap-2">
                {isStrongMatch ? (
                    <>
                        {profile.incidents.length > 0 && (
                            <Button variant="outline" size="sm" className="bg-background hover:bg-muted hover:text-foreground">
                                <MessageSquare className="h-3.5 w-3.5 mr-2" /> Message Business
                            </Button>
                        )}
                        <Button variant="outline" size="sm" className="bg-background hover:bg-muted hover:text-foreground">
                            Submit Incident
                        </Button>
                        <RequestDetailsDialog />
                    </>
                ) : (
                    <AddIdentifierDialog />
                )}
            </CardFooter>
        </Card>
    );
}

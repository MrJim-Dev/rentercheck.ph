import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRenterByFingerprint } from "@/app/actions/search";
import { 
    ChevronLeft, 
    MapPin, 
    Calendar, 
    AlertTriangle, 
    FileWarning,
    Shield,
    Ban,
    DollarSign,
    MessageSquare,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface RenterProfilePageProps {
    params: Promise<{
        fingerprint: string;
    }>;
}

// Format currency
function formatCurrency(amount: number | null): string {
    if (!amount) return "N/A";
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        maximumFractionDigits: 0,
    }).format(amount);
}

// Get incident type label
function getIncidentTypeLabel(type: string): string {
    const labels: Record<string, string> = {
        NON_RETURN: "Non-Return",
        UNPAID_BALANCE: "Unpaid Balance",
        DAMAGE_DISPUTE: "Damage Dispute",
        FAKE_INFO: "False Information",
        THREATS_HARASSMENT: "Threats/Harassment",
        OTHER: "Other",
    };
    return labels[type] || type;
}

// Get incident type config
function getIncidentTypeConfig(type: string): { color: string; bgColor: string; icon: typeof AlertTriangle } {
    const configs: Record<string, { color: string; bgColor: string; icon: typeof AlertTriangle }> = {
        NON_RETURN: { color: "text-red-700", bgColor: "bg-red-100", icon: Ban },
        UNPAID_BALANCE: { color: "text-orange-700", bgColor: "bg-orange-100", icon: DollarSign },
        DAMAGE_DISPUTE: { color: "text-amber-700", bgColor: "bg-amber-100", icon: AlertTriangle },
        FAKE_INFO: { color: "text-purple-700", bgColor: "bg-purple-100", icon: AlertCircle },
        THREATS_HARASSMENT: { color: "text-red-700", bgColor: "bg-red-100", icon: AlertTriangle },
        OTHER: { color: "text-gray-700", bgColor: "bg-gray-100", icon: AlertTriangle },
    };
    return configs[type] || configs.OTHER;
}

// Get status config
function getStatusConfig(status: string): { color: string; icon: typeof CheckCircle; label: string } {
    const configs: Record<string, { color: string; icon: typeof CheckCircle; label: string }> = {
        APPROVED: { color: "text-green-600", icon: CheckCircle, label: "Verified" },
        PENDING: { color: "text-amber-600", icon: Clock, label: "Pending" },
        UNDER_REVIEW: { color: "text-blue-600", icon: AlertCircle, label: "Under Review" },
        REJECTED: { color: "text-red-600", icon: XCircle, label: "Rejected" },
        DISPUTED: { color: "text-orange-600", icon: AlertTriangle, label: "Disputed" },
        RESOLVED: { color: "text-gray-600", icon: CheckCircle, label: "Resolved" },
    };
    return configs[status] || { color: "text-gray-600", icon: AlertCircle, label: status };
}

export default async function RenterProfilePage({ params }: RenterProfilePageProps) {
    const { fingerprint } = await params;
    const response = await getRenterByFingerprint(fingerprint);

    if (!response.success || !response.data) {
        notFound();
    }

    const { renter, incidents, identifierCount } = response.data;

    // Calculate statistics
    const totalAmount = incidents.reduce((sum, inc) => sum + (inc.amountInvolved || 0), 0);
    const incidentTypes = incidents.reduce((acc, inc) => {
        acc[inc.incidentType] = (acc[inc.incidentType] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return (
        <div className="min-h-screen bg-muted/10 pb-12">
            {/* Header */}
            <div className="bg-background border-b">
                <div className="container mx-auto px-4 py-4 md:px-6">
                    <Link href="/search" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                        <ChevronLeft className="mr-1 h-4 w-4" />
                        Back to Search
                    </Link>
                </div>
            </div>

            <main className="container mx-auto px-4 md:px-6 py-8">
                {/* Profile Summary Card */}
                <Card className="mb-8 border-l-4 border-l-red-500">
                    <CardHeader className="pb-4">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                                        {renter.nameMasked}
                                    </h1>
                                    {renter.verificationStatus === 'verified' && (
                                        <Badge className="bg-green-100 text-green-700 border-green-200">
                                            <Shield className="h-3 w-3 mr-1" />
                                            Verified
                                        </Badge>
                                    )}
                                </div>
                                {renter.city && (
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                        <MapPin className="h-4 w-4" />
                                        <span>{renter.city}{renter.region ? `, ${renter.region}` : ''}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <Link href="/report">
                                    <Button variant="destructive" size="sm" className="gap-1.5">
                                        <FileWarning className="h-4 w-4" />
                                        Report Incident
                                    </Button>
                                </Link>
                                <Button variant="outline" size="sm" className="gap-1.5">
                                    <MessageSquare className="h-4 w-4" />
                                    File Dispute
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div className="space-y-1">
                                <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                                    Total Reports
                                </p>
                                <p className="text-2xl font-bold text-red-600">
                                    {renter.totalIncidents}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                                    Verified Reports
                                </p>
                                <p className="text-2xl font-bold text-green-600">
                                    {renter.verifiedIncidents}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                                    Total Amount
                                </p>
                                <p className="text-2xl font-bold">
                                    {formatCurrency(totalAmount)}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                                    Last Incident
                                </p>
                                <p className="text-lg font-semibold flex items-center gap-1">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    {renter.lastIncidentDate
                                        ? new Date(renter.lastIncidentDate).toLocaleDateString('en-PH', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                        })
                                        : 'N/A'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Incident Timeline */}
                    <div className="lg:col-span-8">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                                    Incident History
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {incidents.length > 0 ? (
                                    <div className="space-y-4">
                                        {incidents.map((incident, index) => {
                                            const typeConfig = getIncidentTypeConfig(incident.incidentType);
                                            const statusConfig = getStatusConfig(incident.status);
                                            const TypeIcon = typeConfig.icon;
                                            const StatusIcon = statusConfig.icon;

                                            return (
                                                <div
                                                    key={incident.id}
                                                    className="relative pl-6 pb-4 border-l-2 border-muted last:pb-0"
                                                >
                                                    {/* Timeline dot */}
                                                    <div className={`absolute -left-2 top-0 w-4 h-4 rounded-full ${typeConfig.bgColor} flex items-center justify-center`}>
                                                        <TypeIcon className={`h-2.5 w-2.5 ${typeConfig.color}`} />
                                                    </div>

                                                    <div className="bg-card border rounded-lg p-4 ml-2">
                                                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <Badge className={`${typeConfig.bgColor} ${typeConfig.color} border-0`}>
                                                                    {getIncidentTypeLabel(incident.incidentType)}
                                                                </Badge>
                                                                <span className={`flex items-center gap-1 text-xs ${statusConfig.color}`}>
                                                                    <StatusIcon className="h-3 w-3" />
                                                                    {statusConfig.label}
                                                                </span>
                                                            </div>
                                                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                                                                <Calendar className="h-3.5 w-3.5" />
                                                                {new Date(incident.incidentDate).toLocaleDateString('en-PH', {
                                                                    year: 'numeric',
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                })}
                                                            </div>
                                                        </div>

                                                        {incident.summaryTruncated && (
                                                            <p className="text-sm text-muted-foreground mb-2">
                                                                {incident.summaryTruncated}
                                                            </p>
                                                        )}

                                                        <div className="flex items-center gap-4 text-sm">
                                                            {incident.amountInvolved && (
                                                                <div className="flex items-center gap-1 text-muted-foreground">
                                                                    <DollarSign className="h-3.5 w-3.5" />
                                                                    <span className="font-medium text-foreground">
                                                                        {formatCurrency(incident.amountInvolved)}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {incident.incidentCity && (
                                                                <div className="flex items-center gap-1 text-muted-foreground">
                                                                    <MapPin className="h-3.5 w-3.5" />
                                                                    <span>
                                                                        {incident.incidentCity}
                                                                        {incident.incidentRegion ? `, ${incident.incidentRegion}` : ''}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {incident.evidenceCount > 0 && (
                                                                <Badge variant="secondary" className="text-xs">
                                                                    {incident.evidenceCount} evidence file{incident.evidenceCount !== 1 ? 's' : ''}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <AlertCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                                        <p>No incident reports on file</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Incident Type Breakdown */}
                        {Object.keys(incidentTypes).length > 0 && (
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">Incident Types</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {Object.entries(incidentTypes).map(([type, count]) => {
                                        const config = getIncidentTypeConfig(type);
                                        return (
                                            <div
                                                key={type}
                                                className="flex items-center justify-between"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${config.bgColor}`} />
                                                    <span className="text-sm">{getIncidentTypeLabel(type)}</span>
                                                </div>
                                                <Badge variant="secondary" className="text-xs">
                                                    {count}
                                                </Badge>
                                            </div>
                                        );
                                    })}
                                </CardContent>
                            </Card>
                        )}

                        {/* Profile Information */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Profile Quality</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Linked Identifiers</span>
                                    <span className="font-medium">{identifierCount}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Evidence Files</span>
                                    <span className="font-medium">
                                        {incidents.reduce((sum, inc) => sum + inc.evidenceCount, 0)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Verified Reports</span>
                                    <span className="font-medium">
                                        {Math.round((renter.verifiedIncidents / Math.max(renter.totalIncidents, 1)) * 100)}%
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Verification Card */}
                        <Card className="bg-card">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-primary" />
                                    Verification
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <p className="text-sm text-muted-foreground">
                                    This profile contains data from verified sources only. If you believe there is an error, you can file a dispute.
                                </p>
                                <Button variant="outline" className="w-full">
                                    File a Dispute
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Warning Card */}
                        {renter.totalIncidents > 0 && (
                            <Card className="border-amber-200 bg-amber-50/50">
                                <CardContent className="pt-4">
                                    <div className="flex gap-3">
                                        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                                        <div className="space-y-1">
                                            <p className="font-medium text-amber-900 text-sm">
                                                Exercise Caution
                                            </p>
                                            <p className="text-xs text-amber-800">
                                                This profile has {renter.totalIncidents} incident report{renter.totalIncidents !== 1 ? 's' : ''}. 
                                                Review the details carefully before proceeding with any rental transaction.
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

import { IncidentTimeline } from "@/components/renter-profile/incident-timeline";
import { ProfileSummary } from "@/components/renter-profile/profile-summary";
import { ReportQualityIndicators } from "@/components/renter-profile/report-quality-indicators";
import { Button } from "@/components/ui/button";
import { getMockRenterByFingerprint } from "@/lib/mock-data";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface RenterProfilePageProps {
    params: Promise<{
        fingerprint: string;
    }>;
}

export default async function RenterProfilePage({ params }: RenterProfilePageProps) {
    const { fingerprint } = await params;
    const profile = getMockRenterByFingerprint(fingerprint);

    if (!profile) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-muted/10 pb-12">
            <div className="bg-background border-b">
                <div className="container mx-auto px-4 py-4 md:px-6">
                    <Link href="/search" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                        <ChevronLeft className="mr-1 h-4 w-4" />
                        Back to Search
                    </Link>
                </div>
            </div>

            <main className="container mx-auto px-4 md:px-6 py-8">
                <ProfileSummary profile={profile} />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8">
                        <IncidentTimeline incidents={profile.incidents} />
                    </div>

                    <div className="lg:col-span-4 space-y-6">
                        <ReportQualityIndicators />

                        <div className="bg-card border rounded-lg p-6 space-y-4">
                            <h3 className="font-semibold text-lg">Verification</h3>
                            <p className="text-sm text-muted-foreground">
                                This profile contains data from verified businesses only. If you believe there is an error, you can file a dispute.
                            </p>
                            <Button variant="outline" className="w-full">File a Dispute</Button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, FileWarning } from "lucide-react";
import Link from "next/link";

export function ImproveAccuracyCard() {
    return (
        <Card className="bg-muted/50 border-dashed">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <ShieldCheck className="h-5 w-5" />
                    <span className="font-medium text-sm">Improve Accuracy</span>
                </div>
                <CardTitle className="text-base text-foreground">Not finding who you're looking for?</CardTitle>
                <CardDescription className="text-muted-foreground/90">
                    Adding more details helps us find the exact match and reduces false positives.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
                <Button variant="outline" className="w-full justify-start text-left h-auto py-3 px-4 hover:bg-muted hover:text-foreground">
                    <div className="flex flex-col items-start gap-1">
                        <span className="font-medium">Search by Government ID</span>
                        <span className="text-xs text-muted-foreground/80">Most accurate method</span>
                    </div>
                </Button>
                <Button variant="outline" className="w-full justify-start text-left h-auto py-3 px-4 hover:bg-muted hover:text-foreground">
                    <div className="flex flex-col items-start gap-1">
                        <span className="font-medium">Add Search Filters</span>
                        <span className="text-xs text-muted-foreground/80">Region, Age Range, etc.</span>
                    </div>
                </Button>
                <div className="border-t pt-3 mt-1">
                    <Link href="/report" className="block">
                        <Button variant="outline" className="w-full justify-start text-left h-auto py-3 px-4 border-destructive/30 hover:bg-destructive/10 hover:border-destructive/50 group">
                            <FileWarning className="h-4 w-4 mr-3 text-destructive" />
                            <div className="flex flex-col items-start gap-1">
                                <span className="font-medium text-destructive">Report an Incident</span>
                                <span className="text-xs text-muted-foreground/80 group-hover:text-muted-foreground">Had a bad experience? Let us know</span>
                            </div>
                        </Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}

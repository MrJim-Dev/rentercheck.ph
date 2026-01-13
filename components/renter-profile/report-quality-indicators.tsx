import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, FileCheck, Shield, Star } from "lucide-react";

export function ReportQualityIndicators() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <Shield className="h-5 w-5" />
                    Report Quality
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Overall Quality Score */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">Overall Quality</span>
                        <span className="text-muted-foreground">85%</span>
                    </div>
                    <Progress value={85} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                        Based on verification, evidence, and consistency
                    </p>
                </div>

                {/* Quality Indicators */}
                <div className="space-y-3">
                    <h4 className="text-sm font-semibold">Quality Indicators</h4>

                    <div className="space-y-2">
                        <div className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="text-sm font-medium">Verified Reporters</p>
                                <p className="text-xs text-muted-foreground">
                                    All reports from verified businesses
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-2">
                            <FileCheck className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="text-sm font-medium">Evidence Provided</p>
                                <p className="text-xs text-muted-foreground">
                                    80% of reports include supporting evidence
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-2">
                            <Star className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="text-sm font-medium">Consistent Patterns</p>
                                <p className="text-xs text-muted-foreground">
                                    Similar issues reported across multiple sources
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Data Sources */}
                <div className="space-y-3 pt-3 border-t">
                    <h4 className="text-sm font-semibold">Data Sources</h4>
                    <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="text-xs">
                            3 Verified Businesses
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                            5 Reports
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                            2 Years History
                        </Badge>
                    </div>
                </div>

                {/* Trust Level */}
                <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                    <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">High Reliability</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        This profile has strong verification indicators and consistent reporting patterns.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

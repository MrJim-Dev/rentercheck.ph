"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ShieldCheck, FileWarning, Phone, Mail, Facebook, Search, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ImproveAccuracyCard() {
    const [quickSearch, setQuickSearch] = useState("");
    const router = useRouter();

    const handleQuickSearch = (type: string) => {
        if (!quickSearch.trim()) return;

        let prefix = "";
        switch (type) {
            case "phone":
                prefix = "";
                break;
            case "email":
                prefix = "";
                break;
            case "facebook":
                prefix = "fb:";
                break;
        }

        router.push(`/search?q=${encodeURIComponent(prefix + quickSearch)}`);
    };

    return (
        <Card className="bg-muted/50 border-dashed">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <ShieldCheck className="h-5 w-5" />
                    <span className="font-medium text-sm">Improve Accuracy</span>
                </div>
                <CardTitle className="text-base text-foreground">Get More Accurate Results</CardTitle>
                <CardDescription className="text-muted-foreground/90">
                    Searching by unique identifiers significantly improves match accuracy.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
                {/* Quick Search by Identifier */}
                <div className="space-y-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Enter phone, email, or FB link..."
                            className="pl-8 pr-3"
                            value={quickSearch}
                            onChange={(e) => setQuickSearch(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && quickSearch.trim()) {
                                    router.push(`/search?q=${encodeURIComponent(quickSearch)}`);
                                }
                            }}
                        />
                    </div>

                    {quickSearch.trim() && (
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 h-8 text-xs gap-1"
                                onClick={() => handleQuickSearch("phone")}
                            >
                                <Phone className="h-3 w-3" />
                                Phone
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 h-8 text-xs gap-1"
                                onClick={() => handleQuickSearch("email")}
                            >
                                <Mail className="h-3 w-3" />
                                Email
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 h-8 text-xs gap-1"
                                onClick={() => handleQuickSearch("facebook")}
                            >
                                <Facebook className="h-3 w-3" />
                                Facebook
                            </Button>
                        </div>
                    )}
                </div>

                {/* Accuracy Info */}
                <div className="grid gap-2 text-sm">
                    <div className="flex items-start gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4 mt-0.5 text-green-600" />
                        <div>
                            <span className="font-medium text-foreground">Phone Number</span>
                            <span className="text-xs block">Most reliable • +80% confidence</span>
                        </div>
                    </div>
                    <div className="flex items-start gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4 mt-0.5 text-blue-600" />
                        <div>
                            <span className="font-medium text-foreground">Email Address</span>
                            <span className="text-xs block">Strong identifier • +75% confidence</span>
                        </div>
                    </div>
                    <div className="flex items-start gap-2 text-muted-foreground">
                        <Facebook className="h-4 w-4 mt-0.5 text-indigo-600" />
                        <div>
                            <span className="font-medium text-foreground">Facebook Profile</span>
                            <span className="text-xs block">Excellent for verification • +85% confidence</span>
                        </div>
                    </div>
                </div>

                {/* Report Incident CTA */}
                <div className="border-t pt-4 mt-1">
                    <Link href="/report" className="block">
                        <Button 
                            variant="outline" 
                            className="w-full justify-between text-left h-auto py-3 px-4 border-destructive/30 hover:bg-destructive/10 hover:border-destructive/50 group"
                        >
                            <div className="flex items-center gap-3">
                                <FileWarning className="h-5 w-5 text-destructive" />
                                <div className="flex flex-col items-start">
                                    <span className="font-medium text-destructive">Report an Incident</span>
                                    <span className="text-xs text-muted-foreground group-hover:text-muted-foreground">
                                        Had a bad experience? Let us know
                                    </span>
                                </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}

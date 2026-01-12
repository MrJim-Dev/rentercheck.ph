"use client";

import { ImproveAccuracyCard } from "@/components/search-results/improve-accuracy-card";
import { ResultCard } from "@/components/search-results/result-card";
import { Separator } from "@/components/ui/separator";
import { searchMockRenters } from "@/lib/mock-data";
import { RenterProfile } from "@/lib/types";
import { Lightbulb, SearchX } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AppHeader } from "@/components/shared/app-header";

function SearchResultsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const query = searchParams.get("q") || "";
    const [results, setResults] = useState<RenterProfile[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = (newQuery: string) => {
        router.push(`/search?q=${encodeURIComponent(newQuery)}`);
    };

    useEffect(() => {
        setIsSearching(true);
        // Simulate API delay
        const timer = setTimeout(() => {
            const found = searchMockRenters(query);
            setResults(found);
            setIsSearching(false);
        }, 600);
        return () => clearTimeout(timer);
    }, [query]);

    return (
        <div className="min-h-screen bg-muted/10">
            <AppHeader 
                showSearchBar={true} 
                searchValue={query} 
                onSearch={handleSearch}
                currentPage="search"
            />

            <main className="container mx-auto px-4 md:px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Main Results Column */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <h1 className="text-2xl font-bold tracking-tight">
                                Search Results
                                {query && <span className="text-muted-foreground font-normal ml-2">for "{query}"</span>}
                            </h1>
                            <span className="text-sm text-muted-foreground">
                                {results.length} result{results.length !== 1 && "s"} found
                            </span>
                        </div>

                        <Separator />

                        {isSearching ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-40 rounded-lg bg-muted animate-pulse" />
                                ))}
                            </div>
                        ) : results.length > 0 ? (
                            <div className="space-y-4">
                                {results.map((profile) => (
                                    <ResultCard key={profile.id} profile={profile} />
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg bg-muted/20">
                                <div className="rounded-full bg-muted p-4 mb-4">
                                    <SearchX className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-semibold">No direct matches found</h3>
                                <p className="text-muted-foreground max-w-sm mt-2">
                                    We couldn't find a renter matching "{query}". Try checking the spelling or use our improved search tools.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-4 space-y-6">
                        <ImproveAccuracyCard />

                        <div className="bg-background border rounded-lg p-5 shadow-sm">
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                                    <Lightbulb className="h-3.5 w-3.5" />
                                </div>
                                Search Tip
                            </h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Searching by <strong className="text-foreground">Phone Number</strong> or <strong className="text-foreground">Email</strong> usually provides the most accurate results for screening.
                            </p>
                        </div>
                    </div>
                </div>
            </main >
        </div >
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <SearchResultsContent />
        </Suspense>
    );
}

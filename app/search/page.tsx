"use client";

import { searchRenters } from "@/app/actions/search";
import { ImproveAccuracyCard } from "@/components/search-results/improve-accuracy-card";
import { ResultCard } from "@/components/search-results/result-card";
import { AppHeader } from "@/components/shared/app-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SearchResultMatch } from "@/lib/types";
import { AlertTriangle, Info, Lightbulb, Loader2, Lock, LogIn, SearchX, Shield } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, useTransition } from "react";

function SearchResultsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const query = searchParams.get("q") || "";
    const [results, setResults] = useState<SearchResultMatch[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchCount, setSearchCount] = useState(0);
    const [searchMeta, setSearchMeta] = useState<{
        searchTime: number;
        hasStrongInput: boolean;
        tips?: string[];
        requiresAuth?: boolean;
        totalCount?: number;
    } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleSearch = (newQuery: string) => {
        router.push(`/search?q=${encodeURIComponent(newQuery)}`);
    };

    useEffect(() => {
        if (!query) {
            setResults([]);
            setSearchMeta(null);
            return;
        }

        setIsSearching(true);
        setError(null);

        startTransition(async () => {
            try {
                const response = await searchRenters(query);

                if (response.success) {
                    setResults(response.results);
                    setSearchMeta(response.meta ? { ...response.meta, totalCount: response.totalCount } : null);
                } else {
                    setError(response.error || "Search failed");
                    setResults([]);
                }
            } catch (err) {
                console.error("Search error:", err);
                setError("An unexpected error occurred");
                setResults([]);
            } finally {
                setIsSearching(false);
                setSearchCount(prev => prev + 1);
            }
        });
    }, [query]);

    // Group results by confidence level
    const confirmedMatches = results.filter(r => r.confidence === 'CONFIRMED' || r.confidence === 'HIGH');
    const possibleMatches = results.filter(r => r.confidence === 'MEDIUM');
    const lowMatches = results.filter(r => r.confidence === 'LOW' || r.confidence === 'NONE');

    return (
        <div className="min-h-screen bg-muted/10">
            <AppHeader
                showSearchBar={true}
                searchValue={query}
                onSearch={handleSearch}
                currentPage="search"
                creditRefreshTrigger={searchCount}
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
                            <div className="flex items-center gap-2">
                                {searchMeta && (
                                    <span className="text-xs text-muted-foreground">
                                        {searchMeta.searchTime}ms
                                    </span>
                                )}
                                <span className="text-sm text-muted-foreground">
                                    {results.length} result{results.length !== 1 && "s"} found
                                </span>
                            </div>
                        </div>

                        <Separator />

                        {/* Multi-input Search Tip - shown when no query */}
                        {!query && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                                <Lightbulb className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="font-medium text-blue-900">Smart Multi-Input Search</p>
                                    <p className="text-sm text-blue-800">
                                        Search with multiple details at once for better accuracy! Try: <br />
                                        <code className="bg-blue-100 px-1.5 py-0.5 rounded text-xs">Juan Karlos, 09123457879, juankarlos@gmail.com</code>
                                    </p>
                                    <p className="text-xs text-blue-600 mt-1">
                                        Separate identifiers with commas. Our system automatically detects names, phones, emails, and Facebook links.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Search Tips Banner */}
                        {searchMeta && !searchMeta.hasStrongInput && results.length > 0 && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
                                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="font-medium text-amber-900">Name-only search</p>
                                    <p className="text-sm text-amber-800">
                                        Searching by name alone may show partial matches. For more accurate results,
                                        add a <strong>phone number</strong>, <strong>email</strong>, or <strong>Facebook link</strong> to your search.
                                    </p>
                                    <p className="text-xs text-amber-600 mt-1">
                                        💡 Tip: You can search with multiple details at once, e.g., "Name, 09123456789, email@gmail.com"
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Error State */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                                <p className="font-medium">Error</p>
                                <p className="text-sm">{error}</p>
                            </div>
                        )}

                        {/* Loading State */}
                        {isSearching || isPending ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                    <span className="ml-3 text-muted-foreground">Searching...</span>
                                </div>
                            </div>
                        ) : searchMeta?.requiresAuth ? (
                            // Non-authenticated user - backend returned requiresAuth flag
                            // Show clean sign-in prompt without any data
                            <div className="flex flex-col items-center justify-center">
                                <div className=" w-full">
                                    <div className="bg-card border-2 border-primary/20 rounded-xl p-8 md:p-10 shadow-xl text-center space-y-6">
                                        <div className="flex justify-center">
                                            <div className="rounded-full bg-primary/10 p-5">
                                                <Lock className="h-12 w-12 text-primary" />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <h3 className="text-2xl md:text-3xl font-bold">Sign In to View Results</h3>
                                            <p className="text-muted-foreground leading-relaxed">
                                                We found <span className="font-semibold text-foreground text-secondary">{searchMeta.totalCount || 'potential'}</span> {searchMeta.totalCount === 1 ? 'match' : 'matches'} for your search.
                                                <br />Create an account or sign in to view full details.
                                            </p>
                                        </div>
                                        <div className="pt-4 space-y-3">
                                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                                <Button asChild size="lg" className="min-w-[200px]">
                                                    <Link href="/signup">
                                                        <LogIn className="mr-2 h-5 w-5" />
                                                        Create Account
                                                    </Link>
                                                </Button>
                                                <Button asChild variant="outline" size="lg" className="min-w-[200px]">
                                                    <Link href="/login">Sign In</Link>
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="pt-4 border-t">
                                            <p className="text-sm text-muted-foreground">
                                                <strong>Why sign in?</strong>
                                            </p>
                                            <ul className="text-sm text-muted-foreground mt-2 space-y-1  mx-auto grid grid-cols-1 md:grid-cols-3">
                                                <li>✓ Track your submitted reports</li>
                                                <li>✓ Receive updates on report status</li>
                                                <li>✓ Help build a trusted community</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : results.length > 0 ? (
                            <div className="space-y-8">
                                {/* Confirmed/High Confidence Matches */}
                                {confirmedMatches.length > 0 && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <Shield className="h-4 w-4 text-red-600" />
                                            <h2 className="font-semibold text-red-900">
                                                {confirmedMatches.length === 1 ? 'Match Found' : `${confirmedMatches.length} Matches Found`}
                                            </h2>
                                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                                                High Confidence
                                            </Badge>
                                        </div>
                                        <div className="space-y-3">
                                            {confirmedMatches.map((match) => (
                                                <ResultCard key={match.renter.id} match={match} />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Medium Confidence (Possible Matches) */}
                                {possibleMatches.length > 0 && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <Info className="h-4 w-4 text-amber-600" />
                                            <h2 className="font-semibold text-amber-900">
                                                Possible {possibleMatches.length === 1 ? 'Match' : 'Matches'}
                                            </h2>
                                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                                                Needs Confirmation
                                            </Badge>
                                        </div>
                                        <div className="space-y-3">
                                            {possibleMatches.map((match) => (
                                                <ResultCard key={match.renter.id} match={match} />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Low Confidence */}
                                {lowMatches.length > 0 && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <h2 className="font-medium text-muted-foreground">
                                                Other Potential Matches
                                            </h2>
                                            <Badge variant="outline" className="text-xs">
                                                Low Confidence
                                            </Badge>
                                        </div>
                                        <div className="space-y-4 opacity-75">
                                            {lowMatches.map((match) => (
                                                <ResultCard key={match.renter.id} match={match} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : query ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg bg-muted/20">
                                <div className="rounded-full bg-muted p-4 mb-4">
                                    <SearchX className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-semibold">No matches found</h3>
                                <p className="text-muted-foreground max-w-sm mt-2">
                                    We couldn't find a renter matching "{query}". Try:
                                </p>
                                <ul className="text-sm text-muted-foreground mt-3 space-y-1 text-left">
                                    <li>• Checking the spelling of the name</li>
                                    <li>• Searching with phone number or email instead</li>
                                    <li>• Using the Facebook profile URL</li>
                                </ul>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg bg-muted/20">
                                <div className="rounded-full bg-muted p-4 mb-4">
                                    <Shield className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-semibold">Search for a renter</h3>
                                <p className="text-muted-foreground max-w-sm mt-2">
                                    Enter a name, phone number, email, or Facebook link to search for rental history.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-4 space-y-6">
                        <ImproveAccuracyCard />

                        {/* Confidence Legend */}
                        <div className="bg-background border rounded-lg p-5 shadow-sm">
                            <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider text-muted-foreground">
                                Understanding Results
                            </h4>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-start gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500 mt-1 shrink-0" />
                                    <div>
                                        <span className="font-medium">Confirmed/High</span>
                                        <p className="text-muted-foreground text-xs">
                                            Phone, email, or Facebook matched
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <div className="w-3 h-3 rounded-full bg-amber-500 mt-1 shrink-0" />
                                    <div>
                                        <span className="font-medium">Possible Match</span>
                                        <p className="text-muted-foreground text-xs">
                                            Name matched but needs confirmation
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <div className="w-3 h-3 rounded-full bg-gray-400 mt-1 shrink-0" />
                                    <div>
                                        <span className="font-medium">Low Confidence</span>
                                        <p className="text-muted-foreground text-xs">
                                            Partial match, add more info
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Search Tips */}
                        <div className="bg-background border rounded-lg p-5 shadow-sm">
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                                    <Lightbulb className="h-3.5 w-3.5" />
                                </div>
                                Search Tips
                            </h4>
                            <ul className="text-sm text-muted-foreground space-y-2">
                                {searchMeta?.tips?.map((tip, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                        <span className="text-primary">•</span>
                                        {tip}
                                    </li>
                                )) || (
                                        <>
                                            <li className="flex items-start gap-2">
                                                <span className="text-primary">•</span>
                                                <strong>Phone number</strong> provides the most accurate results
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="text-primary">•</span>
                                                Include country code (+63) for best matching
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="text-primary">•</span>
                                                Facebook URLs can help confirm identity
                                            </li>
                                        </>
                                    )}
                            </ul>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        }>
            <SearchResultsContent />
        </Suspense>
    );
}

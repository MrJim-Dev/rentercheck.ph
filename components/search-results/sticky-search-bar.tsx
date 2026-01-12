"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-provider";
import { logout } from "@/app/actions/auth";
import { useTransition } from "react";
import Link from "next/link";

interface StickySearchBarProps {
    defaultValue?: string;
    onSearch?: (query: string) => void;
}

export function StickySearchBar({ defaultValue = "", onSearch }: StickySearchBarProps) {
    const { user, loading } = useAuth();
    const [isPending, startTransition] = useTransition();

    const handleLogout = () => {
        startTransition(async () => {
            await logout();
        });
    };

    return (
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b py-4">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex gap-3 items-center">
                    <div className="flex gap-2 flex-1 max-w-2xl">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search by name, phone, or email..."
                                className="pl-8 bg-muted/50"
                                defaultValue={defaultValue}
                            />
                        </div>
                        <Button>Search</Button>
                    </div>
                    
                    {!loading && (
                        user ? (
                            <div className="flex items-center gap-3 ml-auto">
                                <span className="text-sm text-muted-foreground hidden md:inline">
                                    {user.email}
                                </span>
                                <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={handleLogout}
                                    disabled={isPending}
                                    className="gap-2"
                                >
                                    <LogOut size={14} />
                                    <span className="hidden sm:inline">{isPending ? "Signing out..." : "Sign out"}</span>
                                </Button>
                            </div>
                        ) : (
                            <Link href="/login" className="ml-auto">
                                <Button size="sm" variant="default">
                                    Sign in
                                </Button>
                            </Link>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}

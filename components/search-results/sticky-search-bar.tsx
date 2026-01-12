"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface StickySearchBarProps {
    defaultValue?: string;
    onSearch?: (query: string) => void;
}

export function StickySearchBar({ defaultValue = "", onSearch }: StickySearchBarProps) {
    return (
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b py-4">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex gap-2 max-w-2xl">
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
            </div>
        </div>
    );
}

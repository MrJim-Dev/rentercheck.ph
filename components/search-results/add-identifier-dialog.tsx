import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AddIdentifierDialog() {
    const [identifier, setIdentifier] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();

    const handleVerify = () => {
        if (!identifier.trim()) return;

        // In a real app, this would verify against backend.
        // Here we simulate refining the search by redirecting to the search page with the new identifier.
        setIsOpen(false);
        router.push(`/search?q=${encodeURIComponent(identifier)}`);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="w-full sm:w-auto shadow-sm">
                    Add Phone/Email to Confirm
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Confirm Identity</DialogTitle>
                    <DialogDescription>
                        To view detailed records, please provide a unique identifier for this individual. This ensures we don't show sensitive data for the wrong person.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="identifier">Phone Number or Email</Label>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="identifier"
                                placeholder="e.g. 09171234567 or email@example.com"
                                className="pl-8"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            We'll effectively refine your search to look for this specific contact info.
                        </p>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleVerify} disabled={!identifier.trim()}>
                        Verify & Show Details
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

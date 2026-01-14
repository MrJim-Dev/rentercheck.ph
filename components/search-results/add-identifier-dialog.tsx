"use client";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Facebook, Mail, Phone, Search, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface AddIdentifierDialogProps {
    renterName?: string;
    suggestedAction?: string;
}

export function AddIdentifierDialog({ renterName, suggestedAction }: AddIdentifierDialogProps) {
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [facebook, setFacebook] = useState("");
    const [activeTab, setActiveTab] = useState("phone");
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();

    const handleVerify = () => {
        let identifier = "";

        switch (activeTab) {
            case "phone":
                identifier = phone.trim();
                break;
            case "email":
                identifier = email.trim();
                break;
            case "facebook":
                identifier = facebook.trim();
                break;
        }

        if (!identifier) return;

        // Redirect to search with the identifier
        setIsOpen(false);
        router.push(`/search?q=${encodeURIComponent(identifier)}`);
    };

    const hasInput = phone.trim() || email.trim() || facebook.trim();
    const currentInput = activeTab === "phone" ? phone : activeTab === "email" ? email : facebook;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="w-full sm:w-auto shadow-sm gap-2">
                    <Shield className="h-4 w-4" />
                    {suggestedAction || "Add Identifier to Confirm"}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        Confirm Identity
                    </DialogTitle>
                    <DialogDescription className="text-left">
                        {renterName ? (
                            <>
                                To view detailed records for <strong>{renterName}</strong>, provide a unique identifier.
                                This ensures accurate matching and protects privacy.
                            </>
                        ) : (
                            <>
                                Provide a phone number, email, or Facebook link to confirm identity and view detailed records.
                            </>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="phone" className="gap-1.5 text-xs">
                            <Phone className="h-3.5 w-3.5" />
                            Phone
                        </TabsTrigger>
                        <TabsTrigger value="email" className="gap-1.5 text-xs">
                            <Mail className="h-3.5 w-3.5" />
                            Email
                        </TabsTrigger>
                        <TabsTrigger value="facebook" className="gap-1.5 text-xs">
                            <Facebook className="h-3.5 w-3.5" />
                            Facebook
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="phone" className="mt-4 space-y-3">
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <div className="relative">
                                <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="phone"
                                    placeholder="09171234567 or +639171234567"
                                    className="pl-9"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Most reliable identifier • Accepts PH formats (09XX, +63, 63)
                            </p>
                        </div>
                    </TabsContent>

                    <TabsContent value="email" className="mt-4 space-y-3">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <div className="relative">
                                <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="email@example.com"
                                    className="pl-9"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Strong identifier • Case-insensitive matching
                            </p>
                        </div>
                    </TabsContent>

                    <TabsContent value="facebook" className="mt-4 space-y-3">
                        <div className="space-y-2">
                            <Label htmlFor="facebook">Facebook Profile</Label>
                            <div className="relative">
                                <Facebook className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="facebook"
                                    placeholder="facebook.com/username or profile URL"
                                    className="pl-9"
                                    value={facebook}
                                    onChange={(e) => setFacebook(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Strong identifier • Paste the full URL or just the username
                            </p>
                        </div>
                    </TabsContent>
                </Tabs>

                <div className="bg-muted/50 rounded-lg p-3 mt-2">
                    <p className="text-xs text-muted-foreground">
                        <strong className="text-foreground">Why is this needed?</strong><br />
                        Names alone can match multiple people. Strong identifiers like phone, email, or Facebook ensure you see records for the correct person.
                    </p>
                </div>

                <DialogFooter className="mt-4">
                    <Button
                        variant="outline"
                        onClick={() => setIsOpen(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleVerify}
                        disabled={!currentInput.trim()}
                        className="gap-2"
                    >
                        <Search className="h-4 w-4" />
                        Search & Confirm
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

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
import { Textarea } from "@/components/ui/textarea";

export function RequestDetailsDialog() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button size="sm">Request Details</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Request Access to Details</DialogTitle>
                    <DialogDescription>
                        You are requesting full incident reports and unmasked identity information. This action is logged.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="purpose">Purpose</Label>
                        <Input
                            id="purpose"
                            placeholder="e.g. Tenant Screening"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            placeholder="Optional notes for audit log..."
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit">Submit Request</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

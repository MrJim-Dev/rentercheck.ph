import { Zap } from "lucide-react";

export function BetaBanner() {
    return (
        <div className="fixed top-0 left-0 right-0 z-[60] h-11 bg-gradient-to-r from-secondary to-accent flex items-center justify-center px-4 shadow-md">
            <div className="flex items-center gap-2 text-xs md:text-sm font-semibold text-accent-foreground">
                <Zap className="w-4 h-4 fill-current" />
                <span className="text-center">
                    RenterCheck is currently in beta. New features are coming soon — suggest a feature to help us improve.
                </span>
                <Zap className="w-4 h-4 fill-current hidden sm:block" />
            </div>
        </div>
    );
}

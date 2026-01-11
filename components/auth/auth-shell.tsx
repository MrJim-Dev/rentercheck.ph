"use client"

import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { VisualPanel } from "./visual-panel"

export function AuthShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const isLogin = pathname === "/login"
    // If not login, assume signup (or potentially other auth pages later, but for now binary)
    // Actually, let's strict check /signup to be sure, or default to one.
    // Let's assume binary toggle layout.

    // Layout Logic:
    // Login: Form is Left (0%), Visual is Right (50%)
    // Signup: Visual is Left (0%), Form is Right (50%)

    return (

        <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-8 bg-background relative">
            <div className="absolute top-4 left-4 sm:top-8 sm:left-8 z-50">
                <Link href="/">
                    <Button variant="ghost">
                        <ArrowLeft size={16} />
                        Back
                    </Button>
                </Link>
            </div>
            <div className="w-full max-w-[1200px] h-[650px] relative flex shadow-none bg-transparent">

                {/* Form Container */}
                <motion.div
                    initial={false}
                    animate={{
                        x: isLogin ? "0%" : "100%",
                        opacity: 1
                    }}
                    transition={{ type: "spring", stiffness: 180, damping: 25, mass: 1 }}
                    className="w-full md:w-1/2 h-full absolute top-0 left-0 z-10 flex items-center justify-center p-6 md:p-12"
                >
                    <div className="w-full max-w-sm">
                        {children}
                    </div>
                </motion.div>

                {/* Visual Panel Floating Card Container */}
                <motion.div
                    initial={false}
                    animate={{ x: isLogin ? "100%" : "0%" }}
                    transition={{ type: "spring", stiffness: 180, damping: 25, mass: 1 }}
                    className="hidden md:block w-1/2 h-full absolute top-0 left-0 z-20 p-4"
                >
                    <VisualPanel mode={isLogin ? "login" : "signup"} />
                </motion.div>

                {/* Mobile Fallback */}
                <div className="md:hidden w-full h-full flex items-center justify-center">
                    <div className="w-full max-w-md p-6 bg-card border border-white/5 rounded-3xl shadow-xl">
                        {children}
                    </div>
                </div>

            </div>
        </div>
    )
}

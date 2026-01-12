"use client"

import { Button } from "@/components/ui/button"
import { AnimatePresence, motion } from "framer-motion"
import { Menu, X, LogOut } from "lucide-react"
import NextImage from "next/image"
import Link from "next/link"
import { useState, useTransition } from "react"
import { useAuth } from "@/lib/auth/auth-provider"
import { logout } from "@/app/actions/auth"

export function Navigation() {
    const [isOpen, setIsOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const { user, loading } = useAuth()

    const handleLogout = () => {
        startTransition(async () => {
            await logout()
        })
    }

    return (
        <div className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4">
            <motion.nav
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-full max-w-4xl bg-background/60 backdrop-blur-xl border border-white/10 rounded-full shadow-lg shadow-black/5"
            >
                <div className="px-5 h-14 flex items-center justify-between">
                    <div
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => {
                            const element = document.getElementById("hero");
                            if (element) {
                                element.scrollIntoView({ behavior: "smooth" });
                            }
                        }}
                    >
                        <div className="relative w-8 h-8">
                            <NextImage
                                src="/logos/rc-logo.svg"
                                alt="RenterCheck Logo"
                                fill
                                className="object-contain"
                            />
                        </div>
                        <span className="text-base font-bold tracking-tight text-foreground">rentercheck.ph</span>
                    </div>

                    <div className="hidden md:flex items-center gap-6">
                        {[
                            { name: "Features", href: "#features" },
                            { name: "How it works", href: "#how-it-works" },
                            { name: "Get Started", href: "#cta" },
                        ].map((item) => (
                            <a
                                key={item.name}
                                href={item.href}
                                onClick={(e) => {
                                    e.preventDefault();
                                    const element = document.querySelector(item.href);
                                    if (element) {
                                        element.scrollIntoView({ behavior: "smooth" });
                                    }
                                }}
                                className="text-xs font-medium text-muted-foreground hover:text-white transition-colors"
                            >
                                {item.name}
                            </a>
                        ))}
                    </div>

                    <div className="hidden md:block">
                        {!loading && (
                            user ? (
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-muted-foreground">
                                        {user.email}
                                    </span>
                                    <Button 
                                        size="sm" 
                                        onClick={handleLogout}
                                        disabled={isPending}
                                        className="rounded-full cursor-pointer bg-gradient-to-r from-secondary to-accent hover:from-secondary/90 hover:to-accent/90 text-accent-foreground font-semibold px-5 h-8 text-xs shadow-md hover:shadow-lg transition-all duration-300"
                                    >
                                        <LogOut className="mr-1.5" size={14} />
                                        {isPending ? "Signing out..." : "Sign out"}
                                    </Button>
                                </div>
                            ) : (
                                <Link href="/login">
                                    <Button size="sm" className="rounded-full cursor-pointer bg-gradient-to-r from-secondary to-accent hover:from-secondary/90 hover:to-accent/90 text-accent-foreground font-semibold px-5 h-8 text-xs shadow-md hover:shadow-lg transition-all duration-300">
                                        Sign in
                                    </Button>
                                </Link>
                            )
                        )}
                    </div>

                    <button className="md:hidden text-foreground p-2" onClick={() => setIsOpen(!isOpen)}>
                        {isOpen ? <X size={18} /> : <Menu size={18} />}
                    </button>
                </div>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                            animate={{ opacity: 1, height: "auto", marginTop: 16 }}
                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                            className="md:hidden overflow-hidden bg-background/90 backdrop-blur-xl border border-white/10 rounded-2xl mx-2 mb-2"
                        >
                            <div className="p-4 flex flex-col gap-4">
                                <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground p-2 hover:bg-white/5 rounded-lg transition-colors" onClick={() => setIsOpen(false)}>
                                    Features
                                </a>
                                <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground p-2 hover:bg-white/5 rounded-lg transition-colors" onClick={() => setIsOpen(false)}>
                                    How it works
                                </a>
                                <a href="#trust" className="text-sm font-medium text-muted-foreground hover:text-foreground p-2 hover:bg-white/5 rounded-lg transition-colors" onClick={() => setIsOpen(false)}>
                                    Why us
                                </a>
                                {!loading && (
                                    user ? (
                                        <>
                                            <div className="text-xs text-muted-foreground px-2 py-1">
                                                {user.email}
                                            </div>
                                            <Button 
                                                size="sm" 
                                                onClick={handleLogout}
                                                disabled={isPending}
                                                className="w-full rounded-full bg-gradient-to-r from-secondary to-accent font-semibold"
                                            >
                                                <LogOut className="mr-1.5" size={14} />
                                                {isPending ? "Signing out..." : "Sign out"}
                                            </Button>
                                        </>
                                    ) : (
                                        <Link href="/login">
                                            <Button size="sm" className="w-full rounded-full bg-gradient-to-r from-secondary to-accent font-semibold">
                                                Sign in
                                            </Button>
                                        </Link>
                                    )
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.nav>
        </div>
    )
}

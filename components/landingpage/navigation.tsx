"use client"

import { Button } from "@/components/ui/button"
import { AnimatePresence, motion } from "framer-motion"
import { Menu, X } from "lucide-react"
import { useState } from "react"

export function Navigation() {
    const [isOpen, setIsOpen] = useState(false)

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
                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-secondary to-accent flex items-center justify-center">
                            <span className="font-bold text-white text-[10px]">RC</span>
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
                        <Button size="sm" className="rounded-full cursor-pointer bg-gradient-to-r from-secondary to-accent hover:from-secondary/90 hover:to-accent/90 text-accent-foreground font-semibold px-5 h-8 text-xs shadow-md hover:shadow-lg transition-all duration-300">
                            Sign in
                        </Button>
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
                                <Button size="sm" className="w-full rounded-full bg-gradient-to-r from-secondary to-accent font-semibold">
                                    Get Started
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.nav>
        </div>
    )
}

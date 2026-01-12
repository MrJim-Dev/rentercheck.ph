"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"
import { ArrowRight, Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function HeroSection() {
    const [searchValue, setSearchValue] = useState("")
    const router = useRouter()

    const handleSearch = () => {
        if (searchValue.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchValue)}`)
        }
    }

    return (
        <section id="hero" className="relative min-h-[90vh] w-full flex items-center justify-center overflow-hidden pt-12 sm:pt-16 px-4 sm:px-6 lg:px-8 bg-background">
            {/* Animated Background */}
            <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute -top-24 -left-20 w-[300px] h-[300px] bg-secondary/10 rounded-full blur-[80px]"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.2, 0.4, 0.2],
                    }}
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 1
                    }}
                    className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px]"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{
                        duration: 9,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 2
                    }}
                    className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[500px] h-[400px] bg-accent/5 rounded-full blur-[100px]"
                />
            </div>

            <div className="relative z-10 max-w-2xl w-full">
                <div className="text-center mb-6 sm:mb-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-foreground mb-3 sm:mb-5 tracking-tight text-balance">
                            Verify Rental Tenants
                            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-secondary via-accent to-secondary mt-1 animate-gradient-x bg-[length:200%_auto]">
                                In Seconds
                            </span>
                        </h1>
                    </motion.div>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                        className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto leading-relaxed"
                    >
                        Search by name, email, or phone number to check tenant history and identify potential issues before they
                        become problems.
                    </motion.p>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-1.5 sm:p-2 shadow-xl mb-6 sm:mb-10 ring-1 ring-white/5 max-w-xl mx-auto"
                >
                    <div className="flex gap-2 flex-col sm:flex-row rounded-lg p-1">
                        <div className="flex-1 relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-accent transition-colors" size={16} />
                            <Input
                                placeholder="Search by name, email, or phone number..."
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                autoComplete="off"
                                className="pl-9 h-9 sm:h-11 bg-transparent border-none text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none autofill:bg-transparent"
                                style={{
                                    WebkitBoxShadow: "0 0 0 30px transparent inset",
                                    WebkitTextFillColor: "var(--foreground)",
                                    transition: "background-color 5000s ease-in-out 0s",
                                }}
                            />
                        </div>
                        <Button
                            size="lg"
                            className="bg-gradient-to-r from-secondary to-accent cursor-pointer text-accent-foreground font-semibold h-9 sm:h-11 px-5 text-sm rounded-lg hover:opacity-90 transition-opacity duration-200"
                            onClick={handleSearch}
                        >
                            Search
                            <ArrowRight className="ml-2" size={14} />
                        </Button>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 0.6 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm text-muted-foreground/80"
                >
                    <div className="flex items-center gap-2">
                        <div className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-secondary"></span>
                        </div>
                        <span>Instant Results</span>
                    </div>
                    <div className="hidden sm:block w-px h-3 bg-border/50"></div>
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 bg-accent rounded-full shadow-[0_0_10px_rgba(0,212,255,0.5)]"></div>
                        <span>Secure & Verified</span>
                    </div>
                    <div className="hidden sm:block w-px h-3 bg-border/50"></div>
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                        <span>24/7 Database Access</span>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}

function clamp(min: number, value: string, max: number): string {
    return `clamp(${min}px, ${value}, ${max}px)`
}

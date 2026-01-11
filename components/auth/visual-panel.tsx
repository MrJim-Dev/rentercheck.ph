"use client"

import { motion } from "framer-motion"
import Image from "next/image"

interface VisualPanelProps {
    mode: "login" | "signup"
}

export function VisualPanel({ mode }: VisualPanelProps) {
    const isLogin = mode === "login"

    return (
        <div className="relative w-full h-full rounded-[40px] bg-gradient-to-br from-primary/10 via-background to-secondary/5 border border-white/5 overflow-hidden flex items-center justify-center p-8 sm:p-12 shadow-2xl shadow-secondary/5 backdrop-blur-3xl">
            {/* Abstract Background Shapes with Pulse Animation */}
            <div className="absolute inset-0 overflow-hidden">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute top-0 right-0 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"
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
                    className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2"
                />

                {/* Diagonal shine line */}
                <div className="absolute top-0 right-0 w-[300%] h-full bg-gradient-to-l from-transparent via-white/5 to-transparent -rotate-45 translate-x-1/2 pointer-events-none transform-gpu" />

                {/* Scanning Line for "Life" */}
                <motion.div
                    animate={{ top: ["0%", "100%"] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent w-full opacity-50"
                />
            </div>

            <div className="relative z-10 max-w-md text-center">
                <div className="mb-8">
                    {/* Floating Logo Card with Float Animation */}
                    <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="w-24 h-24 mx-auto bg-gradient-to-br from-card/80 to-background/80 border border-white/10 rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-secondary/20 relative group backdrop-blur-xl"
                    >
                        <div className="absolute inset-0 bg-gradient-to-tr from-secondary/20 to-accent/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative z-10 w-14 h-14">
                            <Image
                                src="/logos/rc-logo.svg"
                                alt="RenterCheck Logo"
                                fill
                                className="object-contain"
                            />
                        </div>
                    </motion.div>
                </div>

                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 tracking-tight">
                    {isLogin ? (
                        <>
                            Welcome <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-accent">Back!</span>
                        </>
                    ) : (
                        <>
                            Join <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-accent">RenterCheck</span>
                        </>
                    )}
                </h2>

                <p className="text-white/40 text-sm sm:text-base leading-relaxed max-w-xs mx-auto">
                    {isLogin
                        ? "Sign in to access your dashboard and continue verifying tenants with confidence."
                        : "Start making smarter rental decisions today. Create your free account in seconds."
                    }
                </p>
            </div>

            {/* Glass Overlay Texture */}
            <div className="absolute inset-0 bg-white/[0.02] pointer-events-none noise-overlay"></div>
        </div>
    )
}

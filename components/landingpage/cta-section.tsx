"use client"

import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"

export function CTASection() {
    return (
        <section id="cta" className="min-h-[90vh] w-full flex items-center justify-center px-4 sm:px-6 lg:px-8 py-24 sm:py-32 bg-background relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-background to-background"></div>
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
                    className="absolute -bottom-40 -right-40 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[80px]"
                />

            </div>

            <div className="relative z-10 w-full max-w-4xl text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                >
                    <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 sm:mb-8 text-balance tracking-tight">
                        Start Screening Tenants{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-accent">With Confidence</span>
                    </h2>
                    <p className="text-base sm:text-lg text-muted-foreground mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed">
                        Protect your rental property investment with instant tenant verification. Join landlords and property managers across the Philippines who background-check renters before approving applications.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                    className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center"
                >
                    <Button
                        size="lg"
                        className="bg-gradient-to-r from-secondary to-accent cursor-pointer text-accent-foreground font-semibold h-12 px-8 text-base rounded-xl hover:opacity-90 transition-opacity duration-200"
                    >
                        Get Started Free
                        <ArrowRight className="ml-2" size={18} />
                    </Button>
                    <Button
                        size="lg"
                        variant="outline"
                        className="border-white/10 text-white cursor-pointer hover:bg-white/10 hover:border-white/30 h-10 px-6 text-sm sm:h-12 sm:px-8 sm:text-base rounded-xl bg-transparent transition-all duration-300 backdrop-blur-sm"
                    >
                        Schedule a Demo
                    </Button>
                </motion.div>

                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, delay: 0.4 }}
                    className="mt-12 text-xs sm:text-sm text-muted-foreground/60"
                >
                    No credit card required. Full access to our platform for 14 days.
                </motion.p>
            </div>
        </section>
    )
}

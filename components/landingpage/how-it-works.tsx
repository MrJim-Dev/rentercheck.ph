"use client"

import { Card } from "@/components/ui/card"
import { motion } from "framer-motion"
import { AlertCircle, CheckCircle2, Search } from "lucide-react"

export function HowItWorks() {
    const steps = [
        {
            icon: Search,
            number: "01",
            title: "Search",
            description: "Enter tenant name, email, or phone number into our database",
            delay: 0.2
        },
        {
            icon: CheckCircle2,
            number: "02",
            title: "Verify",
            description: "Our system instantly cross-references multiple verification sources",
            delay: 0.4
        },
        {
            icon: AlertCircle,
            number: "03",
            title: "Review",
            description: "Get comprehensive reports highlighting any potential issues or concerns",
            delay: 0.6
        },
    ]

    return (
        <section
            id="how-it-works"
            className="min-h-screen w-full flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16 sm:py-24 bg-background relative overflow-hidden"
        >
            {/* Background Elements */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none"></div>

            <div className="w-full max-w-6xl relative z-10">
                <div className="text-center mb-12 sm:mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7 }}
                    >
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 text-balance tracking-tight">
                            How It{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-accent">Works</span>
                        </h2>
                        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                            Simple, fast, and reliable tenant verification in just three steps.
                        </p>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 relative">
                    {/* Connecting Line (Desktop) */}
                    <div className="hidden md:block absolute top-13 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-border via-border to-border z-0">
                        <motion.div
                            initial={{ scaleX: 0 }}
                            whileInView={{ scaleX: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1.5, delay: 0.4, ease: "circOut" }}
                            className="absolute inset-0 bg-gradient-to-r from-secondary to-accent origin-left"
                        />
                    </div>

                    {steps.map((step, index) => {
                        const Icon = step.icon
                        return (
                            <motion.div
                                key={index}
                                className="relative z-10"
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: step.delay }}
                            >
                                <Card className="border-white/5 bg-card/20 backdrop-blur-sm hover:bg-card/40 hover:border-accent/20 transition-all duration-500 p-6 h-full group overflow-hidden relative">
                                    {/* Hover Glow Effect */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                    <div className="flex flex-col items-center text-center gap-4 relative z-10">
                                        <div className="relative">
                                            <div className="flex items-center justify-center h-14 w-14 rounded-xl bg-gradient-to-br from-background to-muted border border-white/5 shadow-xl group-hover:scale-110 transition-transform duration-500">
                                                <Icon className="text-secondary group-hover:text-accent transition-colors duration-300" size={24} />
                                            </div>
                                            <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-secondary text-background font-bold flex items-center justify-center text-xs shadow-lg z-20">
                                                {step.number}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <h3 className="text-lg font-bold text-foreground">{step.title}</h3>
                                            <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}

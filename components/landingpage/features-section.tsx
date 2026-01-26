"use client"

import { Card } from "@/components/ui/card"
import { motion } from "framer-motion"
import { Shield, TrendingUp, Users, Zap } from "lucide-react"

export function FeaturesSection() {
    const features = [
        {
            icon: Shield,
            title: "Verified Tenant Reports",
            description: "Access admin-verified renter incident reports including payment history, property damage, and lease violations to protect your rental business.",
        },
        {
            icon: Zap,
            title: "Instant Background Checks",
            description: "Get tenant verification results in seconds. Search by name, email, or phone to check renter history instantly.",
        },
        {
            icon: TrendingUp,
            title: "Growing Database",
            description: "Access continuously updated tenant records from rental businesses across the Philippines. Community-driven protection.",
        },
        {
            icon: Users,
            title: "Trusted by Landlords",
            description: "Join property managers, landlords, and rental businesses using RenterCheck to screen tenants and avoid problem renters.",
        },
    ]

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    }

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    }

    return (
        <section
            id="features"
            className="min-h-[70vh] w-full flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 sm:py-20 bg-background relative overflow-hidden"
        >


            <div className="w-full max-w-5xl relative z-10">
                <div className="text-center mb-10 sm:mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 text-balance tracking-tight">
                            Protect Your Rental Business with{" "}<br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-accent">Verified Tenant Screening</span>
                        </h2>
                        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                            Background-check renters before signing leases. Access verified incident reports, payment history, and tenant background information from landlords across the Philippines.
                        </p>
                    </motion.div>
                </div>

                <motion.div
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6"
                >
                    {features.map((feature, index) => {
                        const Icon = feature.icon
                        return (
                            <motion.div key={index} variants={item}>
                                <Card
                                    className="h-full border-white/5 bg-card/40 backdrop-blur-sm hover:bg-card/60 hover:border-secondary/20 transition-all duration-300 p-6 group cursor-pointer overflow-hidden relative"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                    <div className="relative z-10">
                                        <div className="w-11 h-11 bg-secondary/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-secondary/20 transition-all duration-300">
                                            <Icon className="text-secondary group-hover:text-accent transition-colors" size={20} />
                                        </div>
                                        <h3 className="text-lg font-bold text-foreground mb-2">{feature.title}</h3>
                                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                                    </div>
                                </Card>
                            </motion.div>
                        )
                    })}
                </motion.div>
            </div>
        </section>
    )
}

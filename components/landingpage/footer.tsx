"use client"
import NextImage from "next/image"
import { motion } from "framer-motion"

export function Footer() {
    return (
        <footer className="relative bg-gradient-to-t from-primary/5 via-background to-background border-t border-border/50">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="mx-auto max-w-5xl px-6 md:px-8 py-6 md:py-8"
            >
                {/* Main footer content */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-x-6 md:gap-y-8 lg:gap-x-8 mb-6">
                    {/* Brand section */}
                    <div className="flex flex-col gap-3">
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
                                                <span className="text-base font-bold tracking-tight text-foreground">Renter<span className="text-secondary">Check</span>
                                                </span>
                                            </div>
                        <p className="text-muted-foreground text-[10px] md:text-xs leading-relaxed max-w-xs">
                            Verify rental clients with confidence. Fast, accurate, reliable.
                        </p>
                    </div>

                    {/* Product links */}
                    <div className="flex flex-col gap-3">
                        <h4 className="font-semibold text-foreground text-xs md:text-sm">Product</h4>
                        <ul className="space-y-2.5 flex flex-col">
                            {["Features", "Pricing", "Security", "API"].map((item) => (
                                <li key={item}>
                                    <a
                                        href="#"
                                        className="text-muted-foreground hover:text-accent transition-colors duration-300 text-[10px] md:text-xs inline-block"
                                    >
                                        {item}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company links */}
                    <div className="flex flex-col gap-3">
                        <h4 className="font-semibold text-foreground text-xs md:text-sm">Company</h4>
                        <ul className="space-y-2.5 flex flex-col">
                            {["About", "Blog", "Careers", "Contact"].map((item) => (
                                <li key={item}>
                                    <a
                                        href="#"
                                        className="text-muted-foreground hover:text-accent transition-colors duration-300 text-[10px] md:text-xs inline-block"
                                    >
                                        {item}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal links */}
                    <div className="flex flex-col gap-3">
                        <h4 className="font-semibold text-foreground text-xs md:text-sm">Legal</h4>
                        <ul className="space-y-2.5 flex flex-col">
                            {["Privacy", "Terms", "Cookies", "Compliance"].map((item) => (
                                <li key={item}>
                                    <a
                                        href="#"
                                        className="text-muted-foreground hover:text-accent transition-colors duration-300 text-[10px] md:text-xs inline-block"
                                    >
                                        {item}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-4" />

                {/* Bottom section */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-5">
                    <p className="text-muted-foreground text-[10px] md:text-xs">
                        © 2026 RenterCheck. All rights reserved.
                    </p>

                    {/* Social links */}
                    <div className="flex gap-6">
                        {["Twitter", "LinkedIn", "Facebook"].map((social) => (
                            <a
                                key={social}
                                href="#"
                                className="text-muted-foreground hover:text-accent transition-colors duration-300 text-[10px] md:text-xs"
                            >
                                {social}
                            </a>
                        ))}
                    </div>
                </div>
            </motion.div>
        </footer>
    )
}

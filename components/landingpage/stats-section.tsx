import { Card } from "@/components/ui/card"

export function StatsSection() {
    const stats = [
        { number: "2.5M+", label: "Tenant Records" },
        { number: "50K+", label: "Active Users" },
        { number: "99.9%", label: "Accuracy Rate" },
        { number: "24/7", label: "Support" },
    ]

    return (
        <section className="min-h-screen w-full flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16 sm:py-24 bg-gradient-to-b from-background to-primary/5">
            <div className="w-full max-w-6xl">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                    {stats.map((stat, index) => (
                        <Card
                            key={index}
                            className="border-border bg-card/50 p-6 sm:p-8 text-center group hover:bg-card/80 transition"
                        >
                            <div className="text-2xl sm:text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-secondary to-accent mb-2">
                                {stat.number}
                            </div>
                            <p className="text-sm sm:text-base text-muted-foreground">{stat.label}</p>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    )
}

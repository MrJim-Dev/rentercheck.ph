"use client"

import { Button } from "@/components/ui/button"
import { FileWarning } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export function FloatingReportButton() {
    const pathname = usePathname()
    const router = useRouter()
    const [isVisible, setIsVisible] = useState(true)

    // Hide on report-related pages
    const shouldHide = pathname.startsWith('/report') || 
                      pathname.startsWith('/my-reports') || 
                      pathname.startsWith('/admin')

    // useEffect(() => {
    //     const handleScroll = () => {
    //         if (window.scrollY > 200) {
    //             setIsVisible(true)
    //         } else {
    //             setIsVisible(false)
    //         }
    //     }

    //     window.addEventListener('scroll', handleScroll)
    //     return () => window.removeEventListener('scroll', handleScroll)
    // }, [])

    if (shouldHide) return null

    return (
        <div
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 transition-all duration-300 md:hidden ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'
            }`}
        >
            <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/report')}
                className="gap-2 transition-all duration-300 rounded-full font-semibold px-5 h-10 text-xs border border-red-500/20 bg-red-500/10 text-red-400 hover:!bg-red-500/25 hover:!border-red-500/50 hover:!text-red-300 hover:shadow-[0_0_20px_-3px_rgba(239,68,68,0.5)] backdrop-blur-xl shadow-lg"
            >
                <FileWarning className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Report an Incident</span>
                <span className="sm:hidden">Report an Incident</span>
            </Button>
        </div>
    )
}

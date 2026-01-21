"use client"

import { logout } from "@/app/actions/auth"
import { checkIsAdmin } from "@/app/actions/admin"
import { Button } from "@/components/ui/button"
import { signOutClient, useAuth } from "@/lib/auth/auth-provider"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronDown, FileText, FileWarning, LogOut, Menu, Shield, User, X } from "lucide-react"
import NextImage from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState, useTransition } from "react"

export function Navigation() {
    const [isOpen, setIsOpen] = useState(false)
    const [userMenuOpen, setUserMenuOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const { user, loading } = useAuth()
    const [isAdmin, setIsAdmin] = useState(false)
    const userMenuRef = useRef<HTMLDivElement>(null)

    // Check admin status
    useEffect(() => {
        let isMounted = true
        
        const checkAdmin = async () => {
            if (!user) {
                if (isMounted) setIsAdmin(false)
                return
            }
            
            const result = await checkIsAdmin()
            if (isMounted && result.success && result.data) {
                setIsAdmin(result.data.isAdmin)
            }
        }
        
        checkAdmin()
        
        return () => {
            isMounted = false
        }
    }, [user])

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setUserMenuOpen(false)
            }
        }
        if (userMenuOpen) {
            document.addEventListener("mousedown", handleClickOutside)
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [userMenuOpen])

    const handleLogout = async () => {
        await signOutClient()
        startTransition(async () => {
            await logout()
        })
    }

    const scrollLinks = [
        { name: "Features", href: "#features" },
        { name: "How it works", href: "#how-it-works" },
    ]

    const appLinks = [
        { name: "Report an Incident", href: "/report", icon: FileWarning },
    ]

    return (
        <div className="fixed top-14 left-0 right-0 z-50 flex justify-center px-4">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                )}
            </AnimatePresence>
            <motion.nav
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`w-full max-w-4xl bg-background/60 backdrop-blur-xl border border-white/10 ${isOpen ? 'rounded-2xl' : 'rounded-full'} shadow-lg shadow-black/5 relative z-50`}
            >
                <div className="px-5 h-14 flex items-center justify-between">
                    {/* Logo */}
                    <Link
                        className="flex items-center gap-2 cursor-pointer"
                        href="/"
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
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-6">
                        {/* Scroll Links */}
                        {scrollLinks.map((item) => (
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

                    {/* Desktop User Menu */}
                    <div className="hidden md:flex items-center gap-2">
                        {/* App Links */}
                        {appLinks.map((item) => {
                            const Icon = item.icon
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                >
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={`gap-2 transition-all duration-300 rounded-full font-semibold px-5 h-8 text-xs ${item.href === "/report"
                                            ? "border border-red-500/20 bg-red-500/10 text-red-400 hover:!bg-red-500/25 hover:!border-red-500/50 hover:!text-red-300 hover:shadow-[0_0_15px_-3px_rgba(239,68,68,0.3)]"
                                            : "text-muted-foreground hover:text-white"
                                            }`}
                                    >
                                        <Icon className="w-3.5 h-3.5" />
                                        {item.name}
                                    </Button>
                                </Link>
                            )
                        })}
                        {!loading && (
                            user ? (
                                <div className="relative" ref={userMenuRef}>
                                    <button
                                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                                        className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-white transition-all duration-300 cursor-pointer rounded-full hover:!bg-white/5 hover:!border-white/10 border border-transparent px-3 h-8"
                                    >
                                        <div className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center">
                                            <User className="w-3 h-3 text-secondary" />
                                        </div>
                                        <span className="max-w-[100px] truncate">{user.email?.split("@")[0]}</span>
                                        <ChevronDown className={`w-3 h-3 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
                                    </button>

                                    <AnimatePresence>
                                        {userMenuOpen && (
                                            <>

                                                <motion.div
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className="absolute right-0 top-full mt-3 w-48 bg-background/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-lg overflow-hidden z-50"
                                                >
                                                    <div className="px-3 py-2 border-b border-white/10">
                                                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                                    </div>
                                                    <div className="p-1">
                                                        <Link href="/my-reports" onClick={() => setUserMenuOpen(false)}>
                                                            <button className="w-full px-3 py-2 text-xs text-left rounded-lg hover:bg-white/5 flex items-center gap-2 cursor-pointer transition-colors">
                                                                <FileText className="w-3.5 h-3.5" />
                                                                My Reports
                                                            </button>
                                                        </Link>
                                                        {isAdmin && (
                                                            <Link href="/admin" onClick={() => setUserMenuOpen(false)}>
                                                                <button className="w-full px-3 py-2 text-xs text-left rounded-lg hover:bg-white/5 flex items-center gap-2 cursor-pointer transition-colors">
                                                                    <Shield className="w-3.5 h-3.5" />
                                                                    Admin
                                                                </button>
                                                            </Link>
                                                        )}
                                                    </div>
                                                    <div className="p-1 border-t border-white/10">
                                                        <button
                                                            onClick={() => {
                                                                setUserMenuOpen(false)
                                                                handleLogout()
                                                            }}
                                                            disabled={isPending}
                                                            className="w-full px-3 py-2 text-xs text-left rounded-lg hover:!bg-red-500/10 text-red-500 flex items-center gap-2 cursor-pointer transition-colors font-medium"
                                                        >
                                                            <LogOut className="w-3.5 h-3.5" />
                                                            {isPending ? "Signing out..." : "Sign out"}
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            </>
                                        )}
                                    </AnimatePresence>
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

                    {/* Mobile Menu Button */}
                    <button className="md:hidden text-foreground p-2" onClick={() => setIsOpen(!isOpen)}>
                        {isOpen ? <X size={18} /> : <Menu size={18} />}
                    </button>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                            animate={{ opacity: 1, height: "auto", marginTop: 16 }}
                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                            className="md:hidden overflow-hidden bg-background/90 backdrop-blur-xl"
                        >
                            <div className="p-4 flex flex-col gap-2">
                                {/* Scroll Links */}
                                {scrollLinks.map((item) => (
                                    <a
                                        key={item.name}
                                        href={item.href}
                                        className="text-sm font-medium text-muted-foreground hover:text-foreground p-2 hover:bg-white/5 rounded-lg transition-colors"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        {item.name}
                                    </a>
                                ))}



                                {/* User Section */}
                                {!loading && (
                                    user ? (
                                        <>
                                            <div className="h-px bg-white/10 my-2" />
                                            <div className="text-xs text-muted-foreground px-2 py-1">
                                                {user.email}
                                            </div>
                                            {/* App Links (Report) in User Menu */}
                                            {appLinks.map((item) => {
                                                const Icon = item.icon
                                                return (
                                                    <Link
                                                        key={item.name}
                                                        href={item.href}
                                                        onClick={() => setIsOpen(false)}
                                                    >
                                                        <div className={`text-sm font-medium text-muted-foreground hover:text-foreground p-2 hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2 ${item.href === "/report" ? "text-red-400" : ""
                                                            }`}>
                                                            <Icon className="w-4 h-4" />
                                                            {item.name}
                                                        </div>
                                                    </Link>
                                                )
                                            })}
                                            <Link href="/my-reports" onClick={() => setIsOpen(false)}>
                                                <div className="text-sm font-medium text-muted-foreground hover:text-foreground p-2 hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2">
                                                    <FileText className="w-4 h-4" />
                                                    My Reports
                                                </div>
                                            </Link>
                                            {isAdmin && (
                                                <Link href="/admin" onClick={() => setIsOpen(false)}>
                                                    <div className="text-sm font-medium text-muted-foreground hover:text-foreground p-2 hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2">
                                                        <Shield className="w-4 h-4" />
                                                        Admin
                                                    </div>
                                                </Link>
                                            )}
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => {
                                                    setIsOpen(false)
                                                    handleLogout()
                                                }}
                                                disabled={isPending}
                                                className="w-full justify-start text-red-500 hover:!text-red-400 hover:!bg-red-500/10 cursor-pointer"
                                            >
                                                <LogOut className="mr-2" size={14} />
                                                {isPending ? "Signing out..." : "Sign out"}
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <div className="h-px bg-white/10 my-2" />
                                            <div className="flex flex-col gap-3 p-1">
                                                {/* App Links (Report) grouped with Sign In */}
                                                {appLinks.map((item) => {
                                                    const Icon = item.icon
                                                    return (
                                                        <Link
                                                            key={item.name}
                                                            href={item.href}
                                                            onClick={() => setIsOpen(false)}
                                                            className="w-full"
                                                        >
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className={`w-full gap-2 transition-all duration-300 rounded-full font-semibold h-9 ${item.href === "/report"
                                                                    ? "border border-red-500/20 bg-red-500/10 text-red-400 hover:!bg-red-500/25 hover:!border-red-500/50 hover:!text-red-300"
                                                                    : "text-muted-foreground hover:text-white"
                                                                    }`}
                                                            >
                                                                <Icon className="w-4 h-4" />
                                                                {item.name}
                                                            </Button>
                                                        </Link>
                                                    )
                                                })}
                                                <Link href="/login" onClick={() => setIsOpen(false)} className="w-full">
                                                    <Button size="sm" className="w-full rounded-full bg-gradient-to-r from-secondary to-accent font-semibold h-9">
                                                        Sign in
                                                    </Button>
                                                </Link>
                                            </div>
                                        </>
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

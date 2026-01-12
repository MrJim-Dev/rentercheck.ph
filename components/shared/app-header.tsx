"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth, signOutClient } from "@/lib/auth/auth-provider"
import { logout } from "@/app/actions/auth"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
    Search,
    FileWarning,
    LogOut,
    Menu,
    X,
    FileText,
    Shield,
    ChevronDown,
    User,
} from "lucide-react"

interface AppHeaderProps {
    /** Show inline search bar (for search page) */
    showSearchBar?: boolean
    /** Default search value */
    searchValue?: string
    /** Called when search is submitted */
    onSearch?: (query: string) => void
    /** Currently active page for highlighting */
    currentPage?: "search" | "report" | "my-reports" | "admin"
}

export function AppHeader({ 
    showSearchBar = false, 
    searchValue = "",
    onSearch,
    currentPage 
}: AppHeaderProps) {
    const { user, loading } = useAuth()
    const [isPending, startTransition] = useTransition()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [userMenuOpen, setUserMenuOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState(searchValue)
    const router = useRouter()

    const handleLogout = async () => {
        await signOutClient()
        startTransition(async () => {
            await logout()
        })
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (onSearch) {
            onSearch(searchQuery)
        } else {
            router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
        }
    }

    const navLinks = [
        { href: "/search", label: "Search", icon: Search, key: "search" },
        { href: "/report", label: "Report", icon: FileWarning, key: "report", highlight: true },
        { href: "/my-reports", label: "My Reports", icon: FileText, key: "my-reports", requireAuth: true },
    ]

    return (
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex items-center gap-4 h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 shrink-0">
                        <Image
                            src="/logos/rc-logo.svg"
                            alt="RenterCheck"
                            width={32}
                            height={32}
                            className="w-8 h-8"
                        />
                        <span className="font-bold text-lg tracking-tight hidden sm:inline">
                            Renter<span className="text-secondary">Check</span>
                        </span>
                    </Link>

                    {/* Search Bar (optional, for search page) */}
                    {showSearchBar && (
                        <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-xl">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Search by name, phone, or email..."
                                    className="pl-9 bg-muted/50"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Button type="submit" size="sm" className="shrink-0">
                                Search
                            </Button>
                        </form>
                    )}

                    {/* Desktop Navigation */}
                    <nav className={`hidden md:flex items-center gap-1 ${showSearchBar ? 'ml-auto' : 'ml-auto'}`}>
                        {navLinks.map((link) => {
                            // Skip auth-required links for non-authenticated users
                            if (link.requireAuth && !user && !loading) return null
                            
                            const Icon = link.icon
                            const isActive = currentPage === link.key
                            
                            return (
                                <Link key={link.href} href={link.href}>
                                    <Button
                                        variant={isActive ? "secondary" : "ghost"}
                                        size="sm"
                                        className={`gap-2 ${
                                            link.highlight && !isActive
                                                ? "text-destructive hover:text-destructive hover:bg-destructive/10"
                                                : ""
                                        }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span className={showSearchBar ? "hidden lg:inline" : ""}>
                                            {link.label}
                                        </span>
                                    </Button>
                                </Link>
                            )
                        })}
                        
                        {/* User Menu / Sign In */}
                        {!loading && (
                            user ? (
                                <div className="relative ml-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                                        className="gap-2"
                                    >
                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-secondary/30 to-accent/30 flex items-center justify-center">
                                            <User className="w-4 h-4 text-secondary" />
                                        </div>
                                        <span className="hidden lg:inline max-w-[120px] truncate text-sm">
                                            {user.email?.split("@")[0]}
                                        </span>
                                        <ChevronDown className={`w-4 h-4 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
                                    </Button>

                                    {userMenuOpen && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-40"
                                                onClick={() => setUserMenuOpen(false)}
                                            />
                                            <div className="absolute right-0 top-full mt-2 w-56 bg-card border rounded-xl shadow-xl overflow-hidden z-50">
                                                <div className="px-4 py-3 border-b bg-muted/30">
                                                    <p className="text-sm font-medium truncate">{user.email}</p>
                                                </div>
                                                <div className="p-2">
                                                    <Link href="/my-reports" onClick={() => setUserMenuOpen(false)}>
                                                        <Button variant="ghost" size="sm" className="w-full justify-start gap-3">
                                                            <FileText className="w-4 h-4" />
                                                            My Reports
                                                        </Button>
                                                    </Link>
                                                    <Link href="/admin" onClick={() => setUserMenuOpen(false)}>
                                                        <Button variant="ghost" size="sm" className="w-full justify-start gap-3">
                                                            <Shield className="w-4 h-4" />
                                                            Admin Dashboard
                                                        </Button>
                                                    </Link>
                                                </div>
                                                <div className="p-2 border-t">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setUserMenuOpen(false)
                                                            handleLogout()
                                                        }}
                                                        disabled={isPending}
                                                        className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    >
                                                        <LogOut className="w-4 h-4" />
                                                        {isPending ? "Signing out..." : "Sign out"}
                                                    </Button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <Link href="/login" className="ml-2">
                                    <Button size="sm" className="bg-gradient-to-r from-secondary to-accent hover:opacity-90">
                                        Sign in
                                    </Button>
                                </Link>
                            )
                        )}
                    </nav>

                    {/* Mobile Menu Button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="md:hidden ml-auto"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </Button>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t py-4 space-y-1 animate-in slide-in-from-top-2 duration-200">
                        {navLinks.map((link) => {
                            if (link.requireAuth && !user && !loading) return null
                            const Icon = link.icon
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <Button
                                        variant="ghost"
                                        className={`w-full justify-start gap-3 ${
                                            link.highlight
                                                ? "text-destructive hover:text-destructive hover:bg-destructive/10"
                                                : ""
                                        }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {link.label}
                                    </Button>
                                </Link>
                            )
                        })}
                        
                        <div className="pt-3 border-t mt-3">
                            {!loading && (
                                user ? (
                                    <div className="space-y-1">
                                        <div className="px-4 py-2 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary/30 to-accent/30 flex items-center justify-center">
                                                <User className="w-4 h-4 text-secondary" />
                                            </div>
                                            <p className="text-sm text-muted-foreground truncate flex-1">{user.email}</p>
                                        </div>
                                        <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                                            <Button variant="ghost" className="w-full justify-start gap-3">
                                                <Shield className="w-4 h-4" />
                                                Admin Dashboard
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="ghost"
                                            onClick={() => {
                                                setMobileMenuOpen(false)
                                                handleLogout()
                                            }}
                                            disabled={isPending}
                                            className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            {isPending ? "Signing out..." : "Sign out"}
                                        </Button>
                                    </div>
                                ) : (
                                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                                        <Button className="w-full bg-gradient-to-r from-secondary to-accent">
                                            Sign in
                                        </Button>
                                    </Link>
                                )
                            )}
                        </div>
                    </div>
                )}
            </div>
        </header>
    )
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { motion, AnimatePresence } from "framer-motion";
import { PageSkeleton } from "@/components/page-skeleton";
import {
	Activity,
	Bell,
	BriefcaseBusiness,
	Calculator,
	Gauge,
	Globe2,
	ListChecks,
	Newspaper,
	Settings,
	Server,
	Menu,
	X,
} from "lucide-react";
import { useState, useEffect } from "react";

const navItems = [
	{ href: "/", label: "Dashboard", icon: Gauge },
	{ href: "/stocks", label: "Stocks", icon: BriefcaseBusiness },
	{
		href: "/tools/calculators",
		label: "Calculators",
		icon: Calculator,
	},
	{ href: "/alerts/indian-market", label: "Market Alerts", icon: Bell },
	{ href: "/alerts/geopolitics", label: "Geopolitics", icon: Globe2 },
	{ href: "/briefs/morning", label: "Morning Brief", icon: Newspaper },
	{ href: "/admin/watchlist", label: "Watchlist", icon: ListChecks },
	{ href: "/admin/brokers", label: "Brokers", icon: Settings },
	{ href: "/admin/jobs", label: "Jobs", icon: Activity },
	{ href: "/admin/system", label: "System", icon: Server },
];

export function AppShell({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	const router = useRouter();
	const isDashboard = pathname === "/";
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [pendingRoute, setPendingRoute] = useState<string | null>(null);

	useEffect(() => {
		setPendingRoute(null);
	}, [pathname]);

	const handleNavigate = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
		if (pathname === href || pendingRoute === href) return;
		e.preventDefault();
		setPendingRoute(href);
		if (mobileMenuOpen) setMobileMenuOpen(false);

		setTimeout(() => {
			router.push(href);
		}, 800); // Artificial delay to show skeleton
	};

	return (
		<div className="h-screen flex flex-col bg-background text-foreground transition-colors duration-150 overflow-hidden">
			{/* Desktop Sidebar */}
			<aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar-bg lg:flex">
				<div className="flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border px-5">
					<div className="flex items-center gap-3">
						<Link
							href="/"
							className="grid place-items-center rounded-lg bg-primary/10 text-primary">
							<Image src="/logo.png" alt="kairo-logo" width={24} height={24} />
						</Link>
						<Link
							href="/"
							className="inline-flex flex-col hover:opacity-75 transition-opacity cursor-pointer">
							<p className="text-sm font-bold tracking-tight text-foreground">
								kairo
							</p>
							<p className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">
								Operations
							</p>
						</Link>
					</div>
					<ThemeToggle />
				</div>
				<nav className="space-y-1.5 px-3 py-5 relative">
					{navItems.map((item) => {
						const Icon = item.icon;
						const isActive = (pendingRoute || pathname) === item.href;
						return (
							<Link
								key={item.href}
								href={item.href}
								onClick={(e) => handleNavigate(e, item.href)}
								className={`relative flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors duration-150 ${
									isActive
										? "text-sidebar-active-text font-semibold"
										: "text-sidebar-text hover:bg-sidebar-hover hover:text-foreground"
								}`}>
								{isActive && (
									<motion.div
										layout
										layoutId="sidebar-active-indicator"
										className="absolute inset-0 bg-sidebar-active rounded-lg z-0 shadow-sm"
										transition={{ type: "spring", stiffness: 500, damping: 40, mass: 0.8 }}
									/>
								)}
								<Icon
									className={`relative z-10 h-4.5 w-4.5 shrink-0 ${isActive ? "text-primary" : "text-sidebar-text/80"}`}
									aria-hidden="true"
								/>
								<span className="relative z-10">{item.label}</span>
							</Link>
						);
					})}
				</nav>
			</aside>

			{/* Mobile Nav Header */}
			<header className="sticky top-0 z-40 border-b border-border bg-card/90 px-4 py-3 backdrop-blur-md lg:hidden">
				<div className="flex h-10 items-center justify-between">
					<div className="flex items-center gap-3">
						<button
							onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
							className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-foreground hover:bg-muted cursor-pointer"
							aria-label="Toggle Menu">
							{mobileMenuOpen ? (
								<X className="h-5 w-5" />
							) : (
								<Menu className="h-5 w-5" />
							)}
						</button>
						<Link
							href="/"
							className="text-base font-bold tracking-tight text-foreground">
							kairo
						</Link>
					</div>
					<div className="flex items-center gap-2">
						<ThemeToggle />
					</div>
				</div>

				{/* Mobile Dropdown Menu */}
				{mobileMenuOpen && (
					<nav className="mt-3 border-t border-border/60 py-3 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200 relative">
						{navItems.map((item) => {
							const Icon = item.icon;
							const isActive = (pendingRoute || pathname) === item.href;
							return (
								<Link
									key={item.href}
									href={item.href}
									onClick={(e) => handleNavigate(e, item.href)}
									className={`relative flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors ${
										isActive
											? "text-sidebar-active-text font-semibold"
											: "text-sidebar-text hover:bg-sidebar-hover hover:text-foreground"
									}`}>
									{isActive && (
										<motion.div
											layout
											layoutId="mobile-sidebar-active-indicator"
											className="absolute inset-0 bg-sidebar-active rounded-lg z-0"
											transition={{ type: "spring", stiffness: 500, damping: 40, mass: 0.8 }}
										/>
									)}
									<Icon className="relative z-10 h-4.5 w-4.5 shrink-0" aria-hidden="true" />
									<span className="relative z-10">{item.label}</span>
								</Link>
							);
						})}
					</nav>
				)}
			</header>

			{/* Main Layout Area */}
			<div className="flex flex-1 flex-col overflow-hidden lg:pl-64">
				<main
					className={[
						"flex-1 w-full px-4 py-8 sm:px-6 lg:px-8",
						isDashboard
							? "overflow-y-auto lg:overflow-hidden lg:flex lg:flex-col"
							: "overflow-y-auto",
					].join(" ")}>
					<div
						className={[
							"mx-auto max-w-7xl relative",
							isDashboard ? "lg:flex lg:flex-col lg:flex-1 lg:min-h-0" : "",
						].join(" ")}>
						<AnimatePresence mode="popLayout">
							{pendingRoute ? (
								<motion.div 
									key="skeleton"
									initial={{ opacity: 0, filter: "blur(4px)", y: 8 }}
									animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
									exit={{ opacity: 0, filter: "blur(4px)", y: -8 }}
									transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
									className="w-full flex flex-col flex-1 min-h-0"
								>
									<PageSkeleton route={pendingRoute} />
								</motion.div>
							) : (
								<motion.div 
									key={pathname}
									initial={{ opacity: 0, filter: "blur(4px)", y: 8 }}
									animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
									exit={{ opacity: 0, filter: "blur(4px)", y: -8 }}
									transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
									className="w-full flex flex-col flex-1 min-h-0"
								>
									{children}
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				</main>
			</div>
		</div>
	);
}

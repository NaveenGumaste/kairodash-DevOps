"use client";

import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
	const [mounted, setMounted] = useState(false);
	const [theme, setTheme] = useState<"light" | "dark">("light");

	useEffect(() => {
		const frame = window.requestAnimationFrame(() => {
			setMounted(true);
			const isDark = document.documentElement.classList.contains("dark");
			setTheme(isDark ? "dark" : "light");
		});

		return () => window.cancelAnimationFrame(frame);
	}, []);

	const toggleTheme = () => {
		const nextTheme = theme === "light" ? "dark" : "light";
		setTheme(nextTheme);
		if (nextTheme === "dark") {
			document.documentElement.classList.add("dark");
			localStorage.setItem("theme", "dark");
		} else {
			document.documentElement.classList.remove("dark");
			localStorage.setItem("theme", "light");
		}
	};

	if (!mounted) {
		return (
			<div className="h-9 w-9 rounded-md border border-border bg-card animate-pulse" />
		);
	}

	return (
		<button
			onClick={toggleTheme}
			className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-foreground hover:bg-muted transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
			aria-label="Toggle theme">
			{theme === "light" ? (
				<Moon className="h-4 w-4 text-foreground/80 hover:text-foreground" />
			) : (
				<Sun className="h-4 w-4 text-amber-400 hover:text-amber-300" />
			)}
		</button>
	);
}

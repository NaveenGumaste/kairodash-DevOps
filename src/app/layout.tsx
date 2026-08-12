import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { AppShell } from "@/components/app-shell";
import { Providers } from "@/components/providers";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "sonner";

import "./globals.css";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "kairo Operations",
	description: "Market intelligence dashboard built with Next.js and Appwrite.",
	icons: {
		icon: [
			{ url: "/favicons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
			{ url: "/favicons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
			{ url: "/favicons/favicon-48x48.png", sizes: "48x48", type: "image/png" },
			{ url: "/favicons/favicon-64x64.png", sizes: "64x64", type: "image/png" },
			{
				url: "/favicons/favicon-128x128.png",
				sizes: "128x128",
				type: "image/png",
			},
		],
		apple: [
			{
				url: "/favicons/apple-touch-icon.png",
				sizes: "180x180",
				type: "image/png",
			},
		],
	},
	manifest: "/favicons/manifest.json",
	appleWebApp: {
		capable: true,
		statusBarStyle: "default",
		title: "kairo",
	},
	formatDetection: {
		telephone: false,
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="en"
			className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
			suppressHydrationWarning>
			<body className="min-h-full" suppressHydrationWarning>
				<Script
					id="theme-init"
					strategy="beforeInteractive"
					dangerouslySetInnerHTML={{
						__html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  var systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (theme === 'dark' || (!theme && systemPrefersDark)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })()
            `,
					}}
				/>
				<Providers>
					<AppShell>{children}</AppShell>
				</Providers>
				<Analytics />
				<Toaster 
					position="top-center" 
					theme="system" 
					visibleToasts={6}
					closeButton
					toastOptions={{
						classNames: {
							toast:
								"group flex w-full items-center justify-between space-x-4 rounded-xl border border-border bg-card p-4 pr-6 shadow-lg transition-all",
							title: "text-sm font-semibold text-foreground",
							description: "text-sm text-muted-foreground",
							actionButton:
								"inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
							cancelButton:
								"inline-flex h-8 items-center justify-center rounded-md bg-muted px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/80",
							closeButton:
								"absolute right-2 top-2 rounded-md bg-transparent p-1 text-muted-foreground opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring group-hover:opacity-100",
							success: "border-l-4 border-l-emerald-500",
							error: "border-l-4 border-l-red-500",
							info: "border-l-4 border-l-indigo-500",
							warning: "border-l-4 border-l-amber-500",
						},
					}}
				/>
			</body>
		</html>
	);
}

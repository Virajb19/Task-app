"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Globe,
    Search,
    ArrowLeft,
    RotateCw,
    ExternalLink,
    X,
    Home,
    Loader2,
    Shield,
    Maximize2,
    Minimize2,
} from "lucide-react";
import Link from "next/link";

function ensureProtocol(url: string) {
    const trimmed = url.trim();
    if (!trimmed) return "";
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
}

const SUGGESTIONS = [
    { label: "Google", url: "https://www.google.com", icon: "🔍" },
    { label: "Wikipedia", url: "https://www.wikipedia.org", icon: "📚" },
    { label: "GitHub", url: "https://github.com", icon: "🐙" },
    { label: "Stack Overflow", url: "https://stackoverflow.com", icon: "💡" },
    { label: "MDN Docs", url: "https://developer.mozilla.org", icon: "📖" },
    { label: "Reddit", url: "https://www.reddit.com", icon: "🗨️" },
];

export default function BrowsePage() {
    const [inputUrl, setInputUrl] = useState("");
    const [activeUrl, setActiveUrl] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const navigate = useCallback(
        (url?: string) => {
            const target = ensureProtocol(url ?? inputUrl);
            if (!target) return;
            setInputUrl(target);
            setActiveUrl(target);
            setIsLoading(true);
            setHasError(false);
        },
        [inputUrl]
    );

    const handleRefresh = () => {
        if (!activeUrl) return;
        setIsLoading(true);
        setHasError(false);
        // Force iframe reload by toggling the src
        setActiveUrl("");
        requestAnimationFrame(() => setActiveUrl(activeUrl));
    };

    const handleClear = () => {
        setActiveUrl("");
        setInputUrl("");
        setIsLoading(false);
        setHasError(false);
        inputRef.current?.focus();
    };

    // Keyboard shortcut: Ctrl/Cmd + L to focus URL bar
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "l") {
                e.preventDefault();
                inputRef.current?.focus();
                inputRef.current?.select();
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);

    return (
        <div className="relative flex min-h-screen flex-col">
            <div className="bg-mesh" />

            {/* Top bar */}
            <AnimatePresence>
                {!isFullscreen && (
                    <motion.header
                        initial={{ y: -60, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -60, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="relative z-20"
                        style={{
                            padding: "1rem 1rem 0",
                            maxWidth: "960px",
                            width: "100%",
                            margin: "0 auto",
                        }}
                    >
                        <div className="flex items-center gap-2">
                            <Link
                                href="/"
                                className="btn-ghost flex items-center justify-center"
                                style={{
                                    padding: "0.55rem",
                                    borderColor: "rgba(139, 92, 246, 0.3)",
                                }}
                            >
                                <Home size={18} className="text-violet-300" />
                            </Link>

                            {/* URL bar */}
                            <motion.div
                                className="flex flex-1 items-center gap-2 overflow-hidden rounded-xl border border-zinc-700/80 bg-zinc-900/80 px-3 py-2 backdrop-blur-md focus-within:border-violet-400/60 focus-within:ring-1 focus-within:ring-violet-400/40"
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.1, type: "spring", stiffness: 260, damping: 24 }}
                            >
                                {isLoading ? (
                                    <Loader2
                                        size={16}
                                        className="shrink-0 animate-spin text-violet-400"
                                    />
                                ) : activeUrl ? (
                                    <Shield size={16} className="shrink-0 text-emerald-400" />
                                ) : (
                                    <Globe size={16} className="shrink-0 text-zinc-500" />
                                )}
                                <input
                                    ref={inputRef}
                                    type="url"
                                    className="min-w-0 flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 outline-none"
                                    placeholder="Enter a URL to browse…"
                                    value={inputUrl}
                                    onChange={(e) => setInputUrl(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") navigate();
                                    }}
                                />
                                {inputUrl && (
                                    <motion.button
                                        type="button"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        exit={{ scale: 0 }}
                                        className="shrink-0 rounded-md p-0.5 text-zinc-500 transition-colors hover:text-zinc-300"
                                        onClick={() => {
                                            setInputUrl("");
                                            inputRef.current?.focus();
                                        }}
                                    >
                                        <X size={14} />
                                    </motion.button>
                                )}
                            </motion.div>

                            {/* Action buttons */}
                            <motion.button
                                type="button"
                                className="btn-primary"
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.15 }}
                                onClick={() => navigate()}
                                disabled={!inputUrl.trim()}
                                style={{ padding: "0.55rem 0.85rem", fontSize: "0.8125rem" }}
                            >
                                <Search size={16} />
                                <span className="hidden sm:inline">Go</span>
                            </motion.button>

                            {activeUrl && (
                                <>
                                    <motion.button
                                        type="button"
                                        className="btn-ghost"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        title="Refresh"
                                        onClick={handleRefresh}
                                        style={{
                                            padding: "0.55rem",
                                            borderColor: "rgba(139, 92, 246, 0.3)",
                                        }}
                                    >
                                        <RotateCw
                                            size={16}
                                            className={`text-violet-300 ${isLoading ? "animate-spin" : ""}`}
                                        />
                                    </motion.button>
                                    <motion.button
                                        type="button"
                                        className="btn-ghost"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        title="Open in new tab"
                                        onClick={() => window.open(activeUrl, "_blank")}
                                        style={{
                                            padding: "0.55rem",
                                            borderColor: "rgba(139, 92, 246, 0.3)",
                                        }}
                                    >
                                        <ExternalLink size={16} className="text-violet-300" />
                                    </motion.button>
                                    <motion.button
                                        type="button"
                                        className="btn-ghost hidden sm:flex"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        title="Toggle fullscreen"
                                        onClick={() => setIsFullscreen(true)}
                                        style={{
                                            padding: "0.55rem",
                                            borderColor: "rgba(139, 92, 246, 0.3)",
                                        }}
                                    >
                                        <Maximize2 size={16} className="text-violet-300" />
                                    </motion.button>
                                </>
                            )}
                        </div>
                    </motion.header>
                )}
            </AnimatePresence>

            {/* Main area */}
            <div
                className="relative z-10 flex flex-1 flex-col"
                style={{
                    maxWidth: isFullscreen ? "100%" : "960px",
                    width: "100%",
                    margin: "0 auto",
                    padding: isFullscreen ? "0" : "1rem",
                }}
            >
                <AnimatePresence mode="wait">
                    {!activeUrl ? (
                        /* Landing / empty state */
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ type: "spring", stiffness: 220, damping: 22 }}
                            className="flex flex-1 flex-col items-center justify-center gap-8 py-16"
                        >
                            {/* Animated globe */}
                            <motion.div
                                animate={{
                                    rotate: [0, 360],
                                    scale: [1, 1.05, 1],
                                }}
                                transition={{
                                    rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                                    scale: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                                }}
                                className="relative"
                            >
                                <div
                                    className="flex items-center justify-center rounded-full"
                                    style={{
                                        width: 100,
                                        height: 100,
                                        background:
                                            "linear-gradient(135deg, rgba(139,92,246,0.25), rgba(59,130,246,0.25))",
                                        boxShadow:
                                            "0 0 60px rgba(139,92,246,0.2), 0 0 120px rgba(59,130,246,0.1)",
                                    }}
                                >
                                    <Globe
                                        size={48}
                                        className="text-violet-300"
                                        strokeWidth={1.5}
                                    />
                                </div>
                            </motion.div>

                            <div className="text-center">
                                <motion.h1
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.15 }}
                                    className="text-2xl font-bold tracking-tight text-zinc-100"
                                >
                                    Browse the Web
                                </motion.h1>
                                <motion.p
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.25 }}
                                    className="mt-2 text-sm text-zinc-400"
                                >
                                    Enter a URL above or pick a quick link below
                                </motion.p>
                            </div>

                            {/* Quick links */}
                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.35 }}
                                className="grid w-full max-w-md grid-cols-2 gap-3 sm:grid-cols-3"
                            >
                                {SUGGESTIONS.map((s, i) => (
                                    <motion.button
                                        type="button"
                                        key={s.url}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4 + i * 0.06 }}
                                        whileHover={{ scale: 1.04, y: -2 }}
                                        whileTap={{ scale: 0.97 }}
                                        className="flex items-center gap-2 rounded-xl border border-zinc-700/60 bg-zinc-900/60 px-3.5 py-3 text-left text-sm font-medium text-zinc-200 backdrop-blur-sm transition-colors hover:border-violet-500/50 hover:bg-zinc-800/80"
                                        onClick={() => {
                                            setInputUrl(s.url);
                                            navigate(s.url);
                                        }}
                                    >
                                        <span className="text-base">{s.icon}</span>
                                        <span className="truncate">{s.label}</span>
                                    </motion.button>
                                ))}
                            </motion.div>

                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.7 }}
                                className="mt-2 text-xs text-zinc-600"
                            >
                                Press <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">Ctrl</kbd> + <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">L</kbd> to focus the URL bar
                            </motion.p>
                        </motion.div>
                    ) : (
                        /* Iframe viewer */
                        <motion.div
                            key="iframe"
                            initial={{ opacity: 0, scale: 0.97 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.97 }}
                            transition={{ type: "spring", stiffness: 260, damping: 25 }}
                            className="relative flex flex-1 flex-col overflow-hidden rounded-xl border border-zinc-700/50"
                            style={{
                                borderRadius: isFullscreen ? 0 : undefined,
                                borderWidth: isFullscreen ? 0 : undefined,
                                minHeight: isFullscreen ? "100vh" : "calc(100vh - 140px)",
                            }}
                        >
                            {/* Fullscreen exit bar */}
                            {isFullscreen && (
                                <motion.div
                                    initial={{ y: -40, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className="absolute left-0 right-0 top-0 z-30 flex items-center justify-between bg-zinc-900/90 px-4 py-2 backdrop-blur-md"
                                >
                                    <div className="flex items-center gap-2 text-sm text-zinc-300">
                                        <Globe size={14} className="text-violet-400" />
                                        <span className="max-w-xs truncate sm:max-w-lg">
                                            {activeUrl}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            className="btn-ghost"
                                            onClick={handleClear}
                                            style={{
                                                padding: "0.35rem 0.65rem",
                                                fontSize: "0.75rem",
                                                borderColor: "rgba(239, 68, 68, 0.4)",
                                                color: "#fca5a5",
                                            }}
                                        >
                                            <X size={14} /> Close
                                        </button>
                                        <button
                                            type="button"
                                            className="btn-ghost"
                                            onClick={() => setIsFullscreen(false)}
                                            style={{
                                                padding: "0.35rem",
                                                borderColor: "rgba(139, 92, 246, 0.3)",
                                            }}
                                        >
                                            <Minimize2 size={14} className="text-violet-300" />
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* Loading overlay */}
                            <AnimatePresence>
                                {isLoading && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-zinc-950/80 backdrop-blur-sm"
                                    >
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{
                                                duration: 1,
                                                repeat: Infinity,
                                                ease: "linear",
                                            }}
                                        >
                                            <Loader2 size={36} className="text-violet-400" />
                                        </motion.div>
                                        <p className="text-sm text-zinc-400">Loading page…</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Error state */}
                            <AnimatePresence>
                                {hasError && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-zinc-950/90 backdrop-blur-sm"
                                    >
                                        <div
                                            className="flex items-center justify-center rounded-full"
                                            style={{
                                                width: 72,
                                                height: 72,
                                                background: "rgba(239, 68, 68, 0.15)",
                                            }}
                                        >
                                            <X size={32} className="text-red-400" />
                                        </div>
                                        <p className="text-sm font-medium text-zinc-300">
                                            Unable to load this page
                                        </p>
                                        <p className="max-w-xs text-center text-xs text-zinc-500">
                                            This site may block iframe embedding. Try opening it in a new tab.
                                        </p>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                className="btn-ghost"
                                                onClick={handleClear}
                                                style={{
                                                    padding: "0.5rem 0.85rem",
                                                    fontSize: "0.8125rem",
                                                }}
                                            >
                                                <ArrowLeft size={14} /> Go Back
                                            </button>
                                            <button
                                                type="button"
                                                className="btn-primary"
                                                onClick={() => window.open(activeUrl, "_blank")}
                                                style={{
                                                    padding: "0.5rem 0.85rem",
                                                    fontSize: "0.8125rem",
                                                }}
                                            >
                                                <ExternalLink size={14} /> Open in Tab
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* The iframe */}
                            <iframe
                                ref={iframeRef}
                                src={activeUrl}
                                title="Browse"
                                className="h-full w-full flex-1 bg-white"
                                style={{
                                    minHeight: isFullscreen ? "100vh" : "calc(100vh - 140px)",
                                }}
                                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                                onLoad={() => setIsLoading(false)}
                                onError={() => {
                                    setIsLoading(false);
                                    setHasError(true);
                                }}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

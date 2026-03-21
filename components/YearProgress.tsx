"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import AnimatedCircularProgressBar from "@/components/AnimatedCircularProgress";
import { Calendar, Hourglass } from "lucide-react";

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

function formatToday(now: Date) {
    const day = now.getDate();
    const suffix =
        day % 10 === 1 && day !== 11
            ? "st"
            : day % 10 === 2 && day !== 12
                ? "nd"
                : day % 10 === 3 && day !== 13
                    ? "th"
                    : "th";
    return `${MONTHS[now.getMonth()]} ${day}${suffix}, ${now.getFullYear()}`;
}

function getYearProgress(now: Date) {
    const year = now.getFullYear();
    const start = new Date(year, 0, 1).getTime(); // Jan 1
    const end = new Date(year + 1, 0, 1).getTime(); // Jan 1 next year
    const current = now.getTime();

    const elapsed = current - start;
    const total = end - start;
    const percent = Math.min((elapsed / total) * 100, 100);

    const remaining = Math.max(end - current, 0);
    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remaining / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((remaining / (1000 * 60)) % 60);
    const seconds = Math.floor((remaining / 1000) % 60);

    return { percent, days, hours, minutes, seconds, year };
}

export default function YearProgress() {
    const [progress, setProgress] = useState(() => getYearProgress(new Date()));

    useEffect(() => {
        const id = setInterval(() => {
            setProgress(getYearProgress(new Date()));
        }, 1000);
        return () => clearInterval(id);
    }, []);

    return (
        <div
            className="glass animate-fade-in-up"
            style={{
                padding: "1.25rem 1.5rem",
                marginBottom: "1.5rem",
                display: "flex",
                alignItems: "center",
                gap: "1.5rem",
            }}
        >
            {/* Left side – time remaining */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        marginBottom: "0.75rem",
                    }}
                >
                    <Calendar size={14} style={{ color: "var(--accent-light)" }} />
                    <span
                        style={{
                            fontSize: "0.75rem",
                            fontWeight: 800,
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                        }}
                    >
                        <span
                            style={{
                                background: "linear-gradient(135deg, var(--accent), var(--accent-light))",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                backgroundClip: "text",
                            }}
                        >
                            {progress.year}
                        </span>
                        <span style={{ color: "var(--text-muted)" }}> · Time Left</span>
                    </span>
                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(4, 1fr)",
                        gap: "0.5rem",
                    }}
                >
                    {[
                        { value: progress.days, label: "Days" },
                        { value: progress.hours, label: "Hrs" },
                        { value: progress.minutes, label: "Min" },
                        { value: progress.seconds, label: "Sec" },
                    ].map(({ value, label }) => (
                        <div
                            key={label}
                            style={{
                                textAlign: "center",
                                padding: "0.5rem 0.25rem",
                                borderRadius: "0.625rem",
                                background: "rgba(255,255,255,0.04)",
                                border: "1px solid rgba(255,255,255,0.06)",
                            }}
                        >
                            <span
                                style={{
                                    display: "block",
                                    fontSize: "1.25rem",
                                    fontWeight: 800,
                                    fontVariantNumeric: "tabular-nums",
                                    background:
                                        "linear-gradient(135deg, var(--accent), var(--accent-light))",
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                    backgroundClip: "text",
                                }}
                            >
                                {String(value).padStart(2, "0")}
                            </span>
                            <span
                                style={{
                                    fontSize: "0.625rem",
                                    fontWeight: 600,
                                    color: "var(--text-muted)",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.04em",
                                }}
                            >
                                {label}
                            </span>
                        </div>
                    ))}
                </div>

                <div
                    style={{
                        marginTop: "0.625rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        fontSize: "0.6875rem",
                        color: "var(--text-muted)",
                    }}
                >
                    <motion.span
                        animate={{ rotate: [0, 180, 180, 360, 360] }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut",
                            times: [0, 0.3, 0.5, 0.8, 1],
                        }}
                        style={{ display: "inline-flex", color: "#f59e0b" }}
                    >
                        <Hourglass size={10} />
                    </motion.span>
                    <span>
                        <span
                            style={{
                                fontWeight: 800,
                                background: "linear-gradient(135deg, var(--accent), var(--accent-light))",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                backgroundClip: "text",
                            }}
                        >
                            {Math.round(progress.percent)}%
                        </span>
                        {" "}of{" "}
                        <span
                            style={{
                                fontWeight: 800,
                                background: "linear-gradient(135deg, var(--accent), var(--accent-light))",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                backgroundClip: "text",
                            }}
                        >
                            {progress.year}
                        </span>
                        {" "}elapsed
                    </span>
                </div>

                <div
                    style={{
                        marginTop: "0.375rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        fontSize: "0.6875rem",
                        color: "var(--text-secondary, #a1a1aa)",
                    }}
                >
                    <Calendar size={10} style={{ color: "#8b5cf6" }} />
                    <span style={{ fontWeight: 600 }}>{formatToday(new Date())}</span>
                </div>
            </div>

            {/* Right side – circular progress */}
            <AnimatedCircularProgressBar
                value={Math.round(progress.percent)}
                max={100}
                min={0}
                gaugePrimaryColor="var(--accent)"
                gaugeSecondaryColor="rgba(255,255,255,0.08)"
                className="size-28 text-lg shrink-0"
            />
        </div>
    );
}

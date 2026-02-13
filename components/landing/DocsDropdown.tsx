"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ChevronDown, Rocket, Cloud, Database, Container, ClipboardList, RefreshCw, Building2, FileText, ArrowRight } from "lucide-react";

const setupLinks = [
  { href: "/docs/getting-started", label: "Getting Started", icon: Rocket },
  { href: "/docs/azure-setup", label: "Entra ID Setup", icon: Cloud },
  { href: "/docs/database-setup", label: "Database Setup", icon: Database },
  { href: "/docs/docker", label: "Docker", icon: Container },
];

const featureLinks = [
  { href: "/docs/sccm-migration", label: "SCCM Migration", icon: ClipboardList },
  { href: "/docs/updates-policies", label: "Updates & Policies", icon: RefreshCw },
  { href: "/docs/msp", label: "MSP Features", icon: Building2 },
  { href: "/docs/api-reference", label: "API Reference", icon: FileText },
];

const OPEN_DELAY = 150;
const CLOSE_DELAY = 200;

export function DocsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const clearTimers = useCallback(() => {
    if (openTimer.current) clearTimeout(openTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  const handleMouseEnter = useCallback(() => {
    clearTimers();
    openTimer.current = setTimeout(() => setIsOpen(true), OPEN_DELAY);
  }, [clearTimers]);

  const handleMouseLeave = useCallback(() => {
    clearTimers();
    closeTimer.current = setTimeout(() => setIsOpen(false), CLOSE_DELAY);
  }, [clearTimers]);

  useEffect(() => {
    return clearTimers;
  }, [clearTimers]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        className="relative text-sm font-medium text-text-secondary hover:text-text-primary transition-colors duration-200 group inline-flex items-center gap-1"
        aria-expanded={isOpen}
        aria-haspopup="true"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span>Docs</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </motion.span>
        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-accent-cyan transition-all duration-300 group-hover:w-full" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[420px] bg-bg-elevated/95 backdrop-blur-xl border border-overlay/[0.06] rounded-xl shadow-soft-lg p-4 z-50"
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.2,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-text-muted px-2 mb-2">
                  Setup
                </span>
                <div className="space-y-0.5">
                  {setupLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm text-text-secondary hover:text-accent-cyan hover:bg-overlay/[0.04] transition-colors duration-150"
                      >
                        <Icon className="h-4 w-4 flex-shrink-0 text-text-muted" />
                        <span>{link.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
              <div>
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-text-muted px-2 mb-2">
                  Features
                </span>
                <div className="space-y-0.5">
                  {featureLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm text-text-secondary hover:text-accent-cyan hover:bg-overlay/[0.04] transition-colors duration-150"
                      >
                        <Icon className="h-4 w-4 flex-shrink-0 text-text-muted" />
                        <span>{link.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-overlay/[0.06]">
              <Link
                href="/docs"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between px-2 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-accent-cyan hover:bg-overlay/[0.04] transition-colors duration-150"
              >
                <span>View all documentation</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

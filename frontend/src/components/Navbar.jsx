import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { Menu, X, Radar } from "lucide-react";

const links = [
  { to: "/",          label: "Dashboard"     },
  { to: "/report",    label: "Report Missing" },
  { to: "/found",     label: "Upload Found"   },
  { to: "/matches",   label: "AI Matches"     },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-night/90 backdrop-blur border-b border-border">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-2.5 shrink-0">
          <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-hope/10 border border-hope/30">
            <Radar className="h-4 w-4 text-hope" />
            <span className="animate-pulse_ring absolute inset-0 rounded-lg border border-hope/30" />
          </span>
          <span className="font-display font-bold text-bright text-lg leading-none">
            People<span className="text-hope">&</span>Pets
          </span>
        </NavLink>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <li key={l.to}>
              <NavLink
                to={l.to}
                end={l.to === "/"}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg text-sm font-display font-medium transition-colors duration-150 ${
                    isActive
                      ? "text-hope bg-hope/10"
                      : "text-muted hover:text-body hover:bg-surface"
                  }`
                }
              >
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          className="md:hidden p-2 rounded-lg text-muted hover:text-body hover:bg-surface transition-colors"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden border-t border-border bg-ink px-4 pb-4 pt-2 animate-fade_up">
          <ul className="flex flex-col gap-1">
            {links.map((l) => (
              <li key={l.to}>
                <NavLink
                  to={l.to}
                  end={l.to === "/"}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `block px-4 py-3 rounded-xl text-sm font-display font-medium transition-colors ${
                      isActive
                        ? "text-hope bg-hope/10"
                        : "text-muted hover:text-body hover:bg-surface"
                    }`
                  }
                >
                  {l.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}

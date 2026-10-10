import { BrandLogo } from "./BrandLogo";
import React, { useState } from "react";
import { Compass, ArrowUpRight, Menu, X, Eye, Bookmark } from "lucide-react";
type View = "home" | "wizard" | "generation" | "workspace" | "saved";
export function Navbar({
  currentView,
  onNavigate,
  isHighContrast,
  onToggleHighContrast,
  savedTripsCount,
}: {
  currentView: View;
  onNavigate: (v: Exclude<View, "generation">) => void;
  isHighContrast: boolean;
  onToggleHighContrast: () => void;
  savedTripsCount: number;
}) {
  const [open, setOpen] = useState(false);
  const go = (v: Exclude<View, "generation">) => {
    onNavigate(v);
    setOpen(false);
  };
  return (
    <header className="site-header">
      <a
        href="#main-content"
        className="skip-link"
        onClick={(event) => {
          event.preventDefault();
          const main = document.getElementById("main-content");
          main?.focus({ preventScroll: true });
          main?.scrollIntoView();
        }}
      >
        Skip to content
      </a>
      <div className="nav-inner">
        <button
          className="brand"
          onClick={() => go("home")}
          aria-label="TripCraft home"
        >
          <BrandLogo />
          tripcraft<span className="brand-dot">.</span>
        </button>
        <nav
          id="main-navigation"
          className={open ? "nav-links open" : "nav-links"}
          aria-label="Main navigation"
        >
          <button
            aria-current={currentView === "home" ? "page" : undefined}
            className={currentView === "home" ? "active" : ""}
            onClick={() => go("home")}
          >
            Discover
          </button>
          <button
            aria-current={currentView === "workspace" ? "page" : undefined}
            className={currentView === "workspace" ? "active" : ""}
            onClick={() => go("workspace")}
          >
            My itinerary
          </button>
          <button
            aria-current={currentView === "saved" ? "page" : undefined}
            className={currentView === "saved" ? "active" : ""}
            onClick={() => go("saved")}
          >
            Saved trips{" "}
            {savedTripsCount > 0 && (
              <span className="nav-count">{savedTripsCount}</span>
            )}
          </button>
          <button
            aria-label="Toggle high contrast"
            aria-pressed={isHighContrast}
            onClick={onToggleHighContrast}
          >
            <Eye size={18} />
          </button>
        </nav>
        <div className="nav-actions">
          <button className="nav-cta" onClick={() => go("wizard")}>
            Plan a trip <ArrowUpRight size={16} />
          </button>
          <button
            className="menu-button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="main-navigation"
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
    </header>
  );
}

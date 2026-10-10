import { BrandLogo } from "./BrandLogo";
import React from "react";
import { Compass, ArrowUpRight, Heart } from "lucide-react";
export function Footer({
  onNavigate,
}: {
  onNavigate: (v: "home" | "wizard" | "saved") => void;
}) {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div>
          <button className="brand" onClick={() => onNavigate("home")}>
            <BrandLogo />
            tripcraft.
          </button>
          <p>
            Make room for a little elsewhere.
            <br />
            Thoughtful weekends, crafted around you.
          </p>
          <span className="footer-made">
            <Heart size={13} /> Made for the way India travels.
          </span>
        </div>
        <div>
          <h4>Go somewhere</h4>
          <button onClick={() => onNavigate("wizard")}>
            Plan your weekend <ArrowUpRight size={14} />
          </button>
          <button onClick={() => onNavigate("saved")}>Your saved trips</button>
          <button
            onClick={() => {
              onNavigate("home");
              setTimeout(
                () =>
                  document
                    .getElementById("escapes")
                    ?.scrollIntoView({ behavior: "smooth" }),
                50,
              );
            }}
          >
            Find inspiration
          </button>
        </div>
        <div>
          <h4>Travel thoughtfully</h4>
          <p>
            Confirm hours, prices and local conditions
            <br />
            with providers before you travel.
          </p>
          <a href="/images/credits.json" target="_blank" rel="noreferrer">
            Photography & credits <ArrowUpRight size={14} />
          </a>
          <button
            onClick={() => {
              onNavigate("home");
              setTimeout(
                () =>
                  document
                    .getElementById("questions")
                    ?.scrollIntoView({ behavior: "smooth" }),
                50,
              );
            }}
          >
            How TripCraft works
          </button>
        </div>
      </div>
      <div className="footer-bottom">
        <span>
          © {new Date().getFullYear()} TripCraft. A little escape goes a long
          way.
        </span>
        <span>India · INR ₹ · Asia/Kolkata</span>
      </div>
    </footer>
  );
}

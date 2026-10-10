import React, { useState } from "react";
import { TravelScene } from "./TravelScene";
import {
  ArrowUpRight,
  ArrowRight,
  MapPin,
  Compass,
  CloudSun,
  Wallet,
  Heart,
  ChevronDown,
  Check,
  MoveRight,
  Sparkles,
} from "lucide-react";
interface Props {
  onStartPlanning: () => void;
  onSelectExample: (origin: string, destination: string) => void;
}
export function HomeHero({ onStartPlanning, onSelectExample }: Props) {
  const [filter, setFilter] = useState("All escapes");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const places = [
    {
      name: "Jaipur",
      tag: "Culture & colour",
      category: "Culture",
      image: "/images/jaipur.jpg",
      origin: "Delhi NCR",
      description: "Palace facades, slow bazaars & a little pink magic.",
      number: "01",
    },
    {
      name: "Coorg",
      tag: "Into the green",
      category: "Nature",
      image: "/images/coorg.jpg",
      origin: "Bengaluru",
      description: "Coffee country, winding roads & a softer pace.",
      number: "02",
    },
    {
      name: "Alibaug",
      tag: "Take it slow",
      category: "Coast",
      image: "/images/coast.jpg",
      origin: "Mumbai",
      description: "Salty air, coastal flavours & unhurried afternoons.",
      number: "03",
    },
  ];
  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="live-dot" /> LITTLE BREAKS. BIG MEMORIES.
          </div>
          <h1>
            Less planning.
            <br />
            More <em>getting lost.</em>
          </h1>
          <p>
            Your kind of weekend, thoughtfully put together.
            <br className="desktop-break" /> Find local favourites, leave room
            to wander, and make
            <br className="desktop-break" /> a little more of your time off.
          </p>
          <div className="hero-actions">
            <button className="primary-btn" onClick={onStartPlanning}>
              Craft my weekend <ArrowUpRight size={19} />
            </button>
            <a href="#escapes" className="text-link">
              Find my inspiration <ArrowRight size={16} />
            </a>
          </div>
          <div className="hero-footnote">
            <span>
              <Check size={15} /> Built around your budget
            </span>
            <span>
              <Check size={15} /> Ready for a change of weather
            </span>
          </div>
        </div>
        <TravelScene />
      </section>
      <section className="quick-planner" aria-label="Quick trip planner">
        <label>
          <span>LEAVING FROM</span>
          <div>
            <MapPin size={18} />
            <input aria-label="Leaving from" value={origin}
              placeholder="Any city or town" maxLength={100}
              onChange={(e) => setOrigin(e.target.value)} />
          </div>
        </label>
        <label>
          <span>YOUR NEXT ESCAPE</span>
          <div>
            <Compass size={18} />
            <input aria-label="Your next escape" value={destination}
              placeholder="Any destination, region or country" maxLength={100}
              onChange={(e) => setDestination(e.target.value)} />
          </div>
        </label>
        <div className="quick-days">
          <span>JUST ENOUGH TIME</span>
          <strong>A 1–14 day reset</strong>
          <small>Dates & budget on the next step</small>
        </div>
        <button
          className="primary-btn"
          disabled={!origin.trim() || !destination.trim()}
          onClick={() => onSelectExample(origin.trim(), destination.trim())}
        >
          Let’s make a plan <ArrowRight size={18} />
        </button>
      </section>
      <div className="value-strip">
        <span>
          <Compass size={17} /> Made for Indian weekends
        </span>
        <span>
          <Heart size={17} /> Your interests, your pace
        </span>
        <span>
          <CloudSun size={17} /> A plan B comes along
        </span>
        <span>
          <Wallet size={17} /> Every rupee accounted for
        </span>
      </div>
      <section id="escapes" className="home-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">CLOSE ENOUGH TO GET AWAY</p>
            <h2>
              A change of scenery.
              <br />
              <em>A whole new feeling.</em>
            </h2>
          </div>
          <div>
            <p>Pick a mood. We’ll help with the rest.</p>
            <div className="filter-row">
              {["All escapes", "Culture", "Nature", "Coast"].map((f) => (
                <button
                  key={f}
                  aria-pressed={filter === f}
                  onClick={() => setFilter(f)}
                  className={filter === f ? "active" : ""}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="destination-grid">
          {places
            .filter((p) => filter === "All escapes" || p.category === filter)
            .map((p) => (
              <button
                key={p.name}
                className="destination-card"
                onClick={() => onSelectExample(p.origin, p.name)}
              >
                <div className="destination-image">
                  <img
                    src={p.image}
                    alt={
                      p.name === "Jaipur"
                        ? "Hawa Mahal in Jaipur"
                        : p.name === "Coorg"
                          ? "Illustrative green landscape for a nature escape"
                          : "Illustrative coastal landscape"
                    }
                    loading="lazy"
                  />
                  <span>{p.tag}</span>
                  <i>
                    <ArrowUpRight size={20} />
                  </i>
                </div>
                <div className="destination-copy">
                  <div>
                    <h3>{p.name}</h3>
                    <span>{p.number}</span>
                  </div>
                  <p>{p.description}</p>
                  <small>
                    Plan with live search · extend up to 14 days
                    {p.name === "Alibaug"
                      ? " · Illustrative coastal photo"
                      : ""}
                  </small>
                </div>
              </button>
            ))}
        </div>
      </section>
      <section className="how-section home-block" id="how-it-works">
        <div>
          <p className="eyebrow">GOOD TRIPS START SIMPLE</p>
          <h2>
            Your weekend.
            <br />
            <em>Without the homework.</em>
          </h2>
          <p>One thoughtful plan, with space for the unexpected.</p>
          <button className="text-link" onClick={onStartPlanning}>
            Start with your kind of trip <ArrowUpRight size={18} />
          </button>
        </div>
        <div className="how-steps">
          {[
            [
              "01",
              "Tell us what feels like you",
              "A place, a budget, your favourite things. Add a must-do and we’ll plan around it.",
            ],
            [
              "02",
              "Find your own little discoveries",
              "Explore local-pick candidates with evidence labels, practical details and alternatives.",
            ],
            [
              "03",
              "Change the plan, keep the weekend",
              "Rain rolls in? Slow down, stay back, or rebuild your day. You’re in control.",
            ],
          ].map(([n, title, desc]) => (
            <div className="how-step" key={n}>
              <span>{n}</span>
              <div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="weather-feature">
        <div>
          <p className="eyebrow">FORECAST CHANGED? MOOD CHANGED?</p>
          <h2>
            There’s a good day
            <br />
            in every plan B.
          </h2>
          <p>
            Trade a busy day for something quieter. Try a weather scenario, keep
            your must-dos, and see what changes before you go.
          </p>
          <button className="primary-btn" onClick={onStartPlanning}>
            Find my kind of weekend <ArrowUpRight size={18} />
          </button>
        </div>
        <div className="weather-preview">
          <span className="preview-label">
            <CloudSun size={19} /> A LITTLE RAIN, A NEW PLAN
          </span>
          <div>
            <span>09:00</span>
            <p>
              <strong>Slow breakfast</strong>
              <small>No rush. You’re on weekend time.</small>
            </p>
            <Check size={17} />
          </div>
          <div>
            <span>11:00</span>
            <p>
              <strong>One indoor discovery</strong>
              <small>Only if you feel like heading out.</small>
            </p>
            <Heart size={17} />
          </div>
          <div>
            <span>14:00</span>
            <p>
              <strong>Permission to do nothing</strong>
              <small>A stay-back day is a good day, too.</small>
            </p>
            <Check size={17} />
          </div>
          <p className="preview-caption">
            Illustrative scenario, not a live weather forecast
          </p>
        </div>
      </section>
      <section className="home-block faq-section" id="questions">
        <div>
          <p className="eyebrow">BEFORE YOU PACK</p>
          <h2>A few good questions.</h2>
        </div>
        <div>
          {[
            [
              "Does TripCraft book my trip?",
              "TripCraft helps you plan. Provider links take you to the source to confirm prices and make your own booking.",
            ],
            [
              "Are prices and places live?",
              "Plans use real SerpApi results and Open-Meteo forecasts. Connect a server-side SerpApi key to begin. Unknown prices, hours, routes and access needs remain unverified.",
            ],
            [
              "What if I just want to stay back?",
              "That’s a plan too. Stay back removes outings for the selected day. Unlock any must-do outings first; completed activities remain in your history.",
            ],
            [
              "Can I change my itinerary?",
              "Yes. Lock a must-do, try a Plan B, adjust the weather mode, and restore a previous version. Your plans are saved to this browser’s session.",
            ],
          ].map(([q, a]) => (
            <details key={q}>
              <summary>
                {q}
                <ChevronDown size={18} />
              </summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}

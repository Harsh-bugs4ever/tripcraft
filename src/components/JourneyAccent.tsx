import React from "react";
import { Compass, MapPin, Plane, Bookmark } from "lucide-react";
const copy = {
  plan: ["MAKE IT YOURS", "A little direction. Endless possibilities.", "Choose your places, pace and preferences."],
  itinerary: ["YOUR JOURNEY, IN VIEW", "Leave room for a little discovery.", "Explore your route, local picks and weather-ready alternatives."],
  saved: ["GOOD DAYS, KEPT CLOSE", "Your next adventure is waiting.", "Revisit a favourite plan or start somewhere new."],
};
export function JourneyAccent({ kind }: { kind: keyof typeof copy }) {
  const [label, title, description] = copy[kind];
  return <aside className={`journey-accent journey-${kind}`}>
    <div className="journey-accent-copy"><span>{label}</span><h2>{title}</h2><p>{description}</p></div>
    <div className="journey-miniature" aria-hidden="true">
      <div className="mini-shadow" />
      <div className="mini-map"><i /><i /><i /><MapPin className="mini-pin" size={35} /></div>
      <div className="mini-token">{kind === "saved" ? <Bookmark size={27} /> : <Compass size={35} />}</div>
      <Plane className="mini-plane" size={40}/>
    </div>
  </aside>;
}

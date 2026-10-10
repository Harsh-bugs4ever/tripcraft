import React, { useEffect, useRef } from "react";
import { ArrowUpRight, Compass, MapPin, Plane } from "lucide-react";
export function WelcomeExperience({ onEnter }: { onEnter: () => void }) {
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    button.current?.focus();
    return () => { document.body.style.overflow = previous; };
  }, []);
  return <section className="welcome-experience" aria-label="Welcome to TripCraft" onKeyDown={e => { if (e.key === "Escape") onEnter(); }}>
    <header><span>TRIPCRAFT · THE WEEKEND EDIT</span><button onClick={onEnter}>Skip intro ↗</button></header>
    <div className="welcome-composition">
      <div className="welcome-sculpture" aria-hidden="true">
        <div className="welcome-ring ring-one"/><div className="welcome-ring ring-two"/>
        <div className="welcome-orb"><Compass size={100} strokeWidth={.8}/></div>
        <div className="welcome-passport"><span>TRIPCRAFT</span><Compass size={44}/><small>ROOM FOR WONDER</small></div>
        <div className="welcome-ticket"><Plane size={25}/><span>YOUR NEXT CHAPTER<br/><b>ANYWHERE → EVERYWHERE</b></span></div>
        <MapPin className="welcome-pin" size={53}/><Plane className="welcome-plane" size={59}/>
      </div>
      <p className="welcome-eyebrow">A LITTLE ESCAPE STARTS HERE</p>
      <h1>Go somewhere.<br/><em>Feel something.</em></h1>
      <p className="welcome-description">Places worth finding. Plans made for your pace.</p>
      <button ref={button} className="welcome-enter" onClick={onEnter}>Enter TripCraft <ArrowUpRight size={20}/></button>
      <span className="welcome-note">Your next good day is closer than you think.</span>
    </div>
    <footer><span>EXPLORE WITH CURIOSITY</span><span>TRAVEL AT YOUR PACE</span></footer>
  </section>;
}

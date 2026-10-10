import React, { useRef, useState } from "react";
import { Plane, MapPin, Pause, Play, Compass, Sun } from "lucide-react";
/** Lightweight CSS 3D scene: no WebGL dependency or external model downloads. */
export function TravelScene({
  loading = false,
  stopped = false,
}: {
  loading?: boolean;
  stopped?: boolean;
}) {
  const [paused, setPaused] = useState(false);
  const scene = useRef<HTMLDivElement>(null);
  function tilt(e: React.PointerEvent<HTMLDivElement>) {
    if (
      e.pointerType !== "mouse" ||
      paused ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const box = e.currentTarget.getBoundingClientRect();
    scene.current?.style.setProperty(
      "--tilt-x",
      `${(0.5 - (e.clientY - box.top) / box.height) * 8}deg`,
    );
    scene.current?.style.setProperty(
      "--tilt-y",
      `${((e.clientX - box.left) / box.width - 0.5) * 12}deg`,
    );
  }
  function reset() {
    scene.current?.style.setProperty("--tilt-x", "0deg");
    scene.current?.style.setProperty("--tilt-y", "0deg");
  }
  return (
    <div
      className={`travel-scene ${loading ? "travel-scene-loading" : ""} ${paused || stopped ? "motion-paused" : ""}`}
      onPointerMove={tilt}
      onPointerLeave={reset}
    >
      <div className="scene-ambient" aria-hidden="true" />
      <div className="scene-art" ref={scene} aria-hidden="true">
        <div className="scene-floor" />
        <div className="globe-float">
          <div className="globe-halo" />
          <div className="travel-globe">
            <div className="globe-grid">
              {[0, 30, 60, 90, 120, 150].map((angle) => (
                <i
                  className="meridian"
                  key={angle}
                  style={{ transform: `rotateY(${angle}deg)` }}
                />
              ))}
              {[-60, -30, 0, 30, 60].map((angle) => (
                <i
                  className="latitude"
                  key={angle}
                  style={{ transform: `rotateX(${angle}deg)` }}
                />
              ))}
            </div>
            <svg className="globe-land" viewBox="0 0 300 300">
              <path d="M58 43l42-12 22 19-9 28 16 19-13 26-28 3-12-26-28-15-5-26zM98 144l26 5 23 29-11 30-14 13-12 37-17-16 7-37-18-29zM165 38l39 4 20 22 36 7 22 33-21 17-21-5-20 30-20-14-12-25-25-8-8-24zM169 119l29 13 15 36-14 31-19 10-13-29-18-19zM225 208l27-12 26 23-13 23-36-7z" />
            </svg>
            <div className="globe-light" />
            <span className="globe-pin">
              <MapPin size={25} fill="currentColor" />
              <i />
            </span>
          </div>
          <div className="flight-orbit">
            <span className="orbit-plane">
              <Plane size={35} fill="currentColor" strokeWidth={1.25} />
            </span>
          </div>
        </div>
        {!loading && (
          <>
            <div className="scene-postcard postcard-jaipur">
              <img src="/images/jaipur.jpg" alt="" fetchPriority="high" />
              <div>
                <span>01 / CULTURE</span>
                <strong>Meet me in Jaipur.</strong>
              </div>
            </div>
            <div className="scene-postcard postcard-coorg">
              <img src="/images/coorg.jpg" alt="" />
              <div>
                <span>02 / NATURE</span>
                <strong>A greener kind of weekend.</strong>
              </div>
            </div>
            <div className="scene-sun">
              <Sun size={28} />
            </div>
          </>
        )}
        <div className="suitcase-float">
          <div className="suitcase">
            <div className="case-front">
              <span className="case-sticker">
                <Compass size={25} />
              </span>
              <i />
              <i />
            </div>
            <div className="case-side" />
            <div className="case-top" />
            <div className="case-handle" />
            <span className="case-wheel wheel-one" />
            <span className="case-wheel wheel-two" />
          </div>
        </div>
        <div className="scene-ticket">
          <span>THE WEEKEND EDIT</span>
          <strong>
            {loading
              ? "Next stop: your kind of trip."
              : "Out of office. Into the world."}
          </strong>
          <div className="ticket-dashes" />
          <Plane size={17} />
        </div>
        <span className="scene-spark spark-one">✦</span>
        <span className="scene-spark spark-two">✦</span>
        <span className="scene-spark spark-three">+</span>
      </div>
      <div className="scene-caption">
        <span>
          {loading
            ? "A LITTLE WANDER IS ON ITS WAY"
            : "SMALL ESCAPES. ENDLESS POSSIBILITIES."}
        </span>
        <button
          className="scene-motion-control"
          type="button"
          aria-label={
            paused ? "Play travel animation" : "Pause travel animation"
          }
          aria-pressed={paused}
          onClick={() => {
            reset();
            setPaused(!paused);
          }}
        >
          {paused ? <Play size={13} /> : <Pause size={13} />}
          <span>{paused ? "Play" : "Pause"}</span>
        </button>
      </div>
    </div>
  );
}

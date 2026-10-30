"use client";

import { useEffect, useRef } from "react";
import { startGrainBackground } from "./grain-background";
import { useMotion } from "./MotionProvider";

export default function GrainBackground() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const controller = useRef<ReturnType<typeof startGrainBackground>>(undefined);
  const { paused, togglePaused } = useMotion();

  useEffect(() => {
    if (!canvas.current) return;
    const background = startGrainBackground(canvas.current);
    controller.current = background;
    return () => { background?.destroy(); controller.current = undefined; };
  }, []);

  useEffect(() => { controller.current?.setPaused(paused); }, [paused]);

  return <>
    <div className="grain-background" aria-hidden="true"><canvas ref={canvas} /></div>
    <button className="background-toggle" type="button" aria-pressed={paused} onClick={togglePaused}>{paused ? "Resume motion" : "Pause motion"}</button>
  </>;
}

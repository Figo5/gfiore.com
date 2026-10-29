"use client";

import { useEffect, useRef, useState } from "react";
import { startGrainBackground } from "./grain-background";

export default function GrainBackground() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const controller = useRef<ReturnType<typeof startGrainBackground>>(undefined);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!canvas.current) return;
    const background = startGrainBackground(canvas.current);
    controller.current = background;
    return () => { background?.destroy(); controller.current = undefined; };
  }, []);

  return <>
    <div className="grain-background" aria-hidden="true"><canvas ref={canvas} /></div>
    <button className="background-toggle" type="button" aria-pressed={paused} onClick={() => {
      controller.current?.setPaused(!paused);
      setPaused(!paused);
    }}>{paused ? "Play background" : "Pause background"}</button>
  </>;
}

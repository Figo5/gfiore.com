"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

const MotionContext = createContext<{
  paused: boolean;
  togglePaused: () => void;
} | null>(null);

export function MotionProvider({ children }: { children: ReactNode }) {
  const [paused, setPaused] = useState(false);
  return <MotionContext value={{ paused, togglePaused: () => setPaused(value => !value) }}>{children}</MotionContext>;
}

export function useMotion() {
  const motion = useContext(MotionContext);
  if (!motion) throw new Error("Motion controls require MotionProvider");
  return motion;
}

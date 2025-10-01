"use client";

import { useEffect } from "react";

interface ConfettiProps {
  active: boolean;
  duration?: number;
  particleCount?: number;
}

export default function Confetti({ 
  active, 
  duration = 3000,
  particleCount = 50 
}: ConfettiProps) {
  useEffect(() => {
    if (!active) return;

    const colors = [
      "#a855f7", // purple
      "#ec4899", // pink
      "#f59e0b", // amber
      "#10b981", // emerald
      "#3b82f6", // blue
      "#8b5cf6", // violet
    ];

    const confettiElements: HTMLDivElement[] = [];

    // Create confetti particles
    for (let i = 0; i < particleCount; i++) {
      const confetti = document.createElement("div");
      confetti.className = "confetti";
      confetti.style.left = `${Math.random() * 100}%`;
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.animationDelay = `${Math.random() * 0.5}s`;
      confetti.style.animationDuration = `${2 + Math.random() * 2}s`;
      
      document.body.appendChild(confetti);
      confettiElements.push(confetti);
    }

    // Clean up after duration
    const cleanup = setTimeout(() => {
      confettiElements.forEach((el) => {
        el.remove();
      });
    }, duration);

    return () => {
      clearTimeout(cleanup);
      confettiElements.forEach((el) => {
        el.remove();
      });
    };
  }, [active, duration, particleCount]);

  return null;
}

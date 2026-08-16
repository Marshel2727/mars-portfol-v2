"use client";

import { useEffect, useRef, useState } from "react";

interface TextScrambleProps {
  text: string;
  className?: string;
  scrambleOnHover?: boolean;
  speed?: number; // ms per frame
  characters?: string;
  as?: "span" | "p" | "div" | "h1" | "h2" | "h3";
}

const DEFAULT_CHARS = "ABCDEF0123456789_#×·/█";

export function TextScramble({
  text,
  className = "",
  scrambleOnHover = true,
  speed = 30,
  characters = DEFAULT_CHARS,
  as: Component = "span",
}: TextScrambleProps) {
  const [displayText, setDisplayText] = useState(text);
  const isScramblingRef = useRef(false);
  const frameRef = useRef<number | null>(null);

  const startScramble = () => {
    if (isScramblingRef.current) return;
    isScramblingRef.current = true;

    const length = text.length;
    let frame = 0;
    const maxFrames = Math.max(12, Math.floor(length * 1.5));

    const step = () => {
      let result = "";
      const progress = frame / maxFrames;
      const revealIndex = Math.floor(progress * length);

      for (let i = 0; i < length; i++) {
        if (text[i] === " " || text[i] === "\n") {
          result += text[i];
        } else if (i < revealIndex) {
          result += text[i];
        } else {
          const randomIndex = Math.floor(Math.random() * characters.length);
          result += characters[randomIndex];
        }
      }

      setDisplayText(result);
      frame++;

      if (frame <= maxFrames) {
        frameRef.current = window.setTimeout(step, speed);
      } else {
        setDisplayText(text);
        isScramblingRef.current = false;
      }
    };

    step();
  };

  useEffect(() => {
    startScramble();
    return () => {
      if (frameRef.current) clearTimeout(frameRef.current);
    };
  }, [text]);

  return (
    <Component
      className={`scramble-text ${className}`}
      onMouseEnter={scrambleOnHover ? startScramble : undefined}
    >
      {displayText}
    </Component>
  );
}

export default TextScramble;

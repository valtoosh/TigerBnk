import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";


const MESSAGE = "Want to remit your salary at the best rates? Let me introduce you to TigerBnk";
const CHAR_DELAY = 55;
const PAUSE_AFTER_TYPING = 600;
const FADE_DURATION = 0.6;

interface LoadingScreenProps {
  onComplete: () => void;
}

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    let charIndex = 0;
    let exitTimeout: ReturnType<typeof setTimeout>;
    const interval = setInterval(() => {
      charIndex++;
      setDisplayedText(MESSAGE.slice(0, charIndex));
      if (charIndex >= MESSAGE.length) {
        clearInterval(interval);
        exitTimeout = setTimeout(() => setIsExiting(true), PAUSE_AFTER_TYPING);
      }
    }, CHAR_DELAY);
    return () => {
      clearInterval(interval);
      clearTimeout(exitTimeout);
    };
  }, []);

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {!isExiting && (
        <motion.div
          key="loading-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: FADE_DURATION, ease: [0.4, 0, 0.2, 1] }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center px-8"
          style={{ background: "#FFF8E7" }}
          data-testid="loading-screen"
        >
          <p
            className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-800 text-center max-w-lg leading-relaxed"
            data-testid="text-typewriter"
          >
            {displayedText}
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, repeatType: "reverse" }}
              className="inline-block w-[2px] h-[1.1em] bg-gray-800 ml-0.5 align-text-bottom"
            />
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

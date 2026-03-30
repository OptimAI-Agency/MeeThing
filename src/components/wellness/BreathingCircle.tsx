import { useState, useEffect } from "react";

type BreathPhase = "inhale" | "hold" | "exhale" | "complete";

const PHASE_DURATIONS: Record<Exclude<BreathPhase, "complete">, number> = {
  inhale: 4000,
  hold: 4000,
  exhale: 6000,
};

const PHASE_TEXT: Record<BreathPhase, string> = {
  inhale: "Let your thoughts settle",
  hold: "You are present",
  exhale: "Release what you don't need",
  complete: "You're ready",
};

const PHASE_CLASS: Record<BreathPhase, string> = {
  inhale: "breathing-inhale",
  hold: "breathing-hold",
  exhale: "breathing-exhale",
  complete: "",
};

const BreathingCircle = () => {
  const [phase, setPhase] = useState<BreathPhase>("inhale");
  const [textVisible, setTextVisible] = useState(true);

  useEffect(() => {
    if (phase === "complete") return;

    const duration = PHASE_DURATIONS[phase];

    const timer = setTimeout(() => {
      // Fade out text before phase change
      setTextVisible(false);
      setTimeout(() => {
        if (phase === "inhale") setPhase("hold");
        else if (phase === "hold") setPhase("exhale");
        else if (phase === "exhale") setPhase("complete");
        setTextVisible(true);
      }, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [phase]);

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Breathing circle */}
      <div
        key={phase}
        className={`w-48 h-48 rounded-full bg-gradient-to-br from-green-400/60 to-teal-500/60 flex items-center justify-center ${PHASE_CLASS[phase]}`}
      >
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green-300/40 to-teal-400/40 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-white/20" />
        </div>
      </div>

      {/* Phase instruction text */}
      <p
        className={`text-white/90 text-base font-medium transition-opacity duration-700 ${
          textVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        {PHASE_TEXT[phase]}
      </p>
    </div>
  );
};

export default BreathingCircle;

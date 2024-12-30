"use client";

import { useState, useEffect } from "react";

const BreathingApp: React.FC = () => {
    const [phase, setPhase] = useState<"Inhale" | "HoldAfterInhale" | "Exhale" | "HoldAfterExhale">("Inhale");
    const [counter, setCounter] = useState<number>(4);
    const [isRunning, setIsRunning] = useState<boolean>(true);

    const phaseCommands = {
        Inhale: "Breathe In",
        HoldAfterInhale: "Hold Breath",
        Exhale: "Breathe Out",
        HoldAfterExhale: "Hold Breath",
    };

    const phaseColors = {
        Inhale: "bg-green-500",
        HoldAfterInhale: "bg-red-500",
        Exhale: "bg-sky-500",
        HoldAfterExhale: "bg-red-500",
    };

    const phaseBorderColors = {
        Inhale: "border-green-500",
        HoldAfterInhale: "border-red-500",
        Exhale: "border-sky-500",
        HoldAfterExhale: "border-red-500",
    };

    useEffect(() => {
        if (!isRunning) return;

        const timer = setInterval(() => {
            setCounter((prevCounter) => {
                if (prevCounter > 1) {
                    return prevCounter - 1;
                }

                // Move to the next phase
                if (phase === "Inhale") {
                    setPhase("HoldAfterInhale");
                    return 4;
                } else if (phase === "HoldAfterInhale") {
                    setPhase("Exhale");
                    return 4;
                } else if (phase === "Exhale") {
                    setPhase("HoldAfterExhale");
                    return 4;
                } else if (phase === "HoldAfterExhale") {
                    setPhase("Inhale");
                    return 4;
                }

                return 0; // Fallback
            });
        }, 1000);

        return () => clearInterval(timer); // Cleanup timer on unmount
    }, [phase, isRunning]);

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
            {/* Breathing Animation */}
            <div
                className={`relative flex items-center justify-center w-60 h-60 rounded-full ${phaseColors[phase]} transition-none`}
            >
                {/* Expanding and Contracting Circle */}
                <div
                    className={`absolute w-72 h-72 rounded-full border-4 ${phaseBorderColors[phase]} ${phase === "Inhale" || phase === "HoldAfterInhale" ? "scale-125" : "scale-75"
                        } transition-transform duration-[4s]`}
                ></div>

                {/* Counter */}
                <span className="text-6xl font-semibold">{counter}</span>
            </div>

            {/* Command Display */}
            <div
                className={`text-5xl font-extrabold mt-16 tracking-wide ${phase === "Inhale" ? "text-green-400" :
                        phase === "Exhale" ? "text-sky-400" :
                            "text-red-400"
                    } drop-shadow-lg`}
            >
                {phaseCommands[phase]}
            </div>
        </div>
    );
};

export default BreathingApp;

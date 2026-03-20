import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../lib/utils";

interface SuccessEffectProps {
    show: boolean;
    onComplete: () => void;
}

export function SuccessEffect({ show, onComplete }: SuccessEffectProps) {
    const particleCount = 14;
    const particles = Array.from({ length: particleCount }, (_, i) => ({
        id: i,
        x: Math.random() * 360 - 180,
        y: Math.random() * 360 - 180,
    }));

    return (
        <AnimatePresence onExitComplete={onComplete}>
            {show && (
                <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
                    {particles.map((p, index) => (
                        <motion.div
                            key={index}
                            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                            animate={{
                                x: p.x,
                                y: p.y,
                                opacity: 0,
                                scale: 0,
                            }}
                            exit={{ opacity: 0 }}
                            transition={{
                                type: "tween",
                                duration: 0.6,
                                ease: "easeOut",
                            }}
                            className={cn(
                                "absolute w-3 h-3 rounded-full",
                                "bg-green-500"
                            )}
                        />
                    ))}
                </div>
            )}
        </AnimatePresence>
    );
}

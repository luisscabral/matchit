"use client" 

import * as React from "react"

import { cn } from "../lib/utils";
import { motion, useAnimation } from "framer-motion";
import { useEffect, useState, useCallback } from "react";

interface MagnetizeButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    particleCount?: number;
    attractRadius?: number;
}

interface Particle {
    id: number;
    x: number;
    y: number;
}

function MagnetizeButton({
    className,
    particleCount = 12,
    attractRadius = 50,
    children,
    ...props
}: MagnetizeButtonProps) {
    const [isAttracting, setIsAttracting] = useState(true);
    const [particles, setParticles] = useState<Particle[]>([]);
    const particlesControl = useAnimation();

    useEffect(() => {
        const newParticles = Array.from({ length: particleCount }, (_, i) => ({
            id: i,
            x: Math.random() * 360 - 180,
            y: Math.random() * 360 - 180,
        }));
        setParticles(newParticles);
    }, [particleCount]);

    const handleInteractionStart = useCallback(async () => {
        setIsAttracting(false);
        await particlesControl.start((i) => ({
            x: particles[i].x,
            y: particles[i].y,
            opacity: 0.4,
            transition: {
                type: "tween",
                duration: 0.6,
                ease: "easeOut",
            },
        }));
    }, [particlesControl, particles]);

    const handleInteractionEnd = useCallback(async () => {
        setIsAttracting(true);
        await particlesControl.start({
            x: 0,
            y: 0,
            opacity: 1,
            transition: {
                type: "tween",
                duration: 0.6,
                ease: "easeOut",
            },
        });
    }, [particlesControl]);

    return (
        <button
            className={cn(
                "relative touch-none",
                "transition-all duration-300",
                className
            )}
            onMouseEnter={handleInteractionStart}
            onMouseLeave={handleInteractionEnd}
            onTouchStart={handleInteractionStart}
            onTouchEnd={handleInteractionEnd}
            {...props}
        >
            <span className="relative w-full flex flex-col items-center justify-center gap-1">
                {particles.map((_, index) => (
                    <motion.div
                        key={index}
                        custom={index}
                        initial={{ x: 0, y: 0, opacity: 1 }}
                        animate={particlesControl}
                        className={cn(
                            "absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full -ml-[3px] -mt-[3px]",
                            "bg-white/40"
                        )}
                    />
                ))}
                {children}
            </span>
        </button>
    );
}

export { MagnetizeButton };

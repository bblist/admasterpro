"use client";

import { HelpCircle } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface TooltipProps {
    text: string;
    children?: React.ReactNode;
    position?: "top" | "bottom" | "left" | "right";
    icon?: boolean;
}

export default function Tooltip({ text, children, position = "top", icon = true }: TooltipProps) {
    const [show, setShow] = useState(false);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);
    const [adjustedPos, setAdjustedPos] = useState(position);

    // Reposition if overflowing viewport
    useEffect(() => {
        if (!show || !popoverRef.current) { setAdjustedPos(position); return; }
        const rect = popoverRef.current.getBoundingClientRect();
        let pos = position;
        if (rect.left < 8) pos = "right";
        else if (rect.right > window.innerWidth - 8) pos = "left";
        if (rect.top < 8) pos = "bottom";
        else if (rect.bottom > window.innerHeight - 8) pos = "top";
        setAdjustedPos(pos);
    }, [show, position]);

    const positionClasses = {
        top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
        bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
        left: "right-full top-1/2 -translate-y-1/2 mr-2",
        right: "left-full top-1/2 -translate-y-1/2 ml-2",
    };

    const arrowClasses = {
        top: "top-full left-1/2 -translate-x-1/2 border-t-gray-800 border-l-transparent border-r-transparent border-b-transparent",
        bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-gray-800 border-l-transparent border-r-transparent border-t-transparent",
        left: "left-full top-1/2 -translate-y-1/2 border-l-gray-800 border-t-transparent border-b-transparent border-r-transparent",
        right: "right-full top-1/2 -translate-y-1/2 border-r-gray-800 border-t-transparent border-b-transparent border-l-transparent",
    };

    const handleToggle = () => setShow((s) => !s);

    return (
        <div
            className="relative inline-flex items-center"
            onMouseEnter={() => setShow(true)}
            onMouseLeave={() => setShow(false)}
            ref={tooltipRef}
        >
            {children ? (
                <span onTouchStart={handleToggle}>{children}</span>
            ) : icon ? (
                <HelpCircle
                    className="w-3.5 h-3.5 text-muted/50 hover:text-primary cursor-help transition"
                    tabIndex={0}
                    aria-label="Help"
                    onFocus={() => setShow(true)}
                    onBlur={() => setShow(false)}
                    onTouchStart={handleToggle}
                />
            ) : null}

            {show && (
                <div
                    ref={popoverRef}
                    className={`absolute z-50 ${positionClasses[adjustedPos]} pointer-events-none`}
                >
                    <div className="bg-gray-800 text-white text-xs rounded-lg px-3 py-2 w-[240px] sm:w-[280px] whitespace-normal leading-relaxed shadow-lg">
                        {text}
                        <div
                            className={`absolute w-0 h-0 border-4 ${arrowClasses[adjustedPos]}`}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

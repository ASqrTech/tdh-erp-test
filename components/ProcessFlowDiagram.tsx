import React, { useRef, useState, useEffect, useCallback } from 'react';
import type { ProcessStage } from '../types';
import { StageCard } from './StageCard';

interface ProcessFlowDiagramProps {
    stages: ProcessStage[];
    onStageClick: (stage: ProcessStage) => void;
}

export const ProcessFlowDiagram: React.FC<ProcessFlowDiagramProps> = ({ stages, onStageClick }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const checkScroll = useCallback(() => {
        const el = scrollContainerRef.current;
        if (el) {
            const isScrollable = el.scrollWidth > el.clientWidth;
            setCanScrollLeft(el.scrollLeft > 5); // Use a small buffer
            const isNotAtEnd = el.scrollLeft < el.scrollWidth - el.clientWidth - 5; // Use a small buffer
            setCanScrollRight(isScrollable && isNotAtEnd);
        }
    }, []);

    useEffect(() => {
        const el = scrollContainerRef.current;
        if (el) {
            checkScroll();
            el.addEventListener('scroll', checkScroll, { passive: true });
            window.addEventListener('resize', checkScroll);
            
            const timeoutId = setTimeout(checkScroll, 100);

            return () => {
                el.removeEventListener('scroll', checkScroll);
                window.removeEventListener('resize', checkScroll);
                clearTimeout(timeoutId);
            };
        }
    }, [stages, checkScroll]);

    const scroll = (amount: number) => {
        scrollContainerRef.current?.scrollBy({ left: amount, behavior: 'smooth' });
    };

    return (
        <div className="flex items-center space-x-2">
            <button
                onClick={() => scroll(-320)}
                aria-label="Scroll left"
                className={`bg-white rounded-full p-2 shadow-md hover:bg-slate-100 transition-opacity duration-300 hidden md:block ${canScrollLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            >
                <svg className="w-6 h-6 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5 5-5m-4 5h12" />
                </svg>
            </button>

            <div ref={scrollContainerRef} className="flex-1 flex items-stretch overflow-x-auto space-x-6 md:space-x-8 py-4 no-scrollbar">
                {stages.map((stage, index) => (
                    <div key={stage.id} className="flex-shrink-0 w-64 md:w-72 flex flex-col items-center group relative">
                        <StageCard stage={stage} onClick={() => onStageClick(stage)} />
                        {index < stages.length - 1 && (
                            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 mr-2 hidden md:block">
                                <svg className="w-8 h-8 text-slate-300 group-hover:text-red-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        )}
                    </div>
                ))}
            </div>

             <button
                onClick={() => scroll(320)}
                aria-label="Scroll right"
                className={`bg-white rounded-full p-2 shadow-md hover:bg-slate-100 transition-opacity duration-300 hidden md:block ${canScrollRight ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            >
                <svg className="w-6 h-6 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5-5 5M6 12h12" />
                </svg>
            </button>
        </div>
    );
};

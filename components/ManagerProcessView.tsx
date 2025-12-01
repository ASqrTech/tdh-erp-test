import React from 'react';
import type { ProcessStage } from '../types';
import { StageCard } from './StageCard';

interface ManagerProcessViewProps {
    stages: ProcessStage[];
    onStageClick: (stage: ProcessStage) => void;
}

export const ManagerProcessView: React.FC<ManagerProcessViewProps> = ({ stages, onStageClick }) => {
    return (
        <div>
             <div className="text-center mb-8 md:mb-12">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-800">Process Activity Overview</h2>
                <p className="mt-2 text-md text-slate-600 max-w-2xl mx-auto text-center">
                    Click on any stage to view detailed analytics and full activity logs.
                </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {stages.map((stage) => (
                    <StageCard key={stage.id} stage={stage} onClick={() => onStageClick(stage)} />
                ))}
            </div>
        </div>
    );
};
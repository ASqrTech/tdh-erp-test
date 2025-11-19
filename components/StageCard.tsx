

import React from 'react';
import type { ProcessStage } from '../types';

interface StageCardProps {
    stage: ProcessStage;
    onClick: () => void;
}

export const StageCard: React.FC<StageCardProps> = ({ stage, onClick }) => {
    return (
        <button
            onClick={onClick}
            className={`w-full h-full text-left p-5 rounded-xl border-2 ${stage.color.border} ${stage.color.bg} shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ease-in-out flex flex-col`}
        >
            <div className="flex flex-col h-full">
                <div className="flex items-center space-x-3 mb-3">
                    <div className={`p-2 rounded-lg ${stage.color.text} bg-white`}>
                        {stage.icon}
                    </div>
                    <h3 className={`text-lg font-bold ${stage.color.text}`}>
                        {stage.name}
                    </h3>
                </div>
                <p className="text-sm text-slate-600 mb-4 flex-grow">
                    {stage.description}
                </p>
                <div className="mt-auto pt-4 border-t border-dashed border-slate-400/50">
                    <div className="text-xs text-slate-500">
                        <span className="font-semibold">Role:</span> {stage.responsibleRole}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                         <span className="font-semibold">Output:</span> {stage.output}
                    </div>
                </div>
            </div>
        </button>
    );
};
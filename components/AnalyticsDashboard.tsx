import React, { useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PROCESS_STAGES } from '../constants';
import { AnalyticsModal } from './AnalyticsModal';
import { ChartBarIcon, UserGroupIcon, SparklesIcon, CogIcon } from './Icons';
import type { ProcessStage } from '../types';

// ChatBot Component with Glassy Effect
const ChatBot: React.FC = () => {
    const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([]);
    const [input, setInput] = useState('');

    const basicResponses: Record<string, string> = {
        'hello': 'Hi there! 👋 Welcome to the Analytics Dashboard. How can I help you today?',
        'help': 'I can help you understand your analytics data. Ask me about records, operators, or process stages!',
        'records': 'You can view your total records, today\'s records, and records by process stage in the dashboard below.',
        'operators': 'Check the "Active Operators" card to see how many operators are currently working, or view the "Top Performers" section for detailed rankings.',
        'stages': 'We track 6 process stages: Gate Entry, Weighing, Initial Quality Check, Final Quality Check, Storage, and Dispatch.',
        'dashboard': 'The dashboard shows real-time insights including total records, today\'s activity, active operators, and detailed charts by process stage.',
        'default': 'That\'s interesting! Feel free to ask me about your analytics data, records, operators, or process stages.',
    };

    const handleSend = () => {
        if (!input.trim()) return;

        const userMessage = input.toLowerCase();
        setMessages(prev => [...prev, { role: 'user', text: input }]);

        // Find matching response
        let response = basicResponses['default'];
        for (const [key, value] of Object.entries(basicResponses)) {
            if (userMessage.includes(key)) {
                response = value;
                break;
            }
        }

        setTimeout(() => {
            setMessages(prev => [...prev, { role: 'assistant', text: response }]);
        }, 300);

        setInput('');
    };

    const hasMessages = messages.length > 0;

    return (
        <div className="max-w-2xl mx-auto mb-6 sm:mb-8 px-2 sm:px-0">
            <div className={`rounded-xl sm:rounded-2xl border-2 backdrop-blur-sm shadow-lg overflow-hidden transition-all duration-300 ${
                hasMessages 
                    ? 'bg-gradient-to-br from-white to-gray-50 border-orange-400' 
                    : 'bg-gradient-to-br from-white via-gray-50 to-white border-orange-400'
            }`}>
                {/* Header or Title */}
                {!hasMessages ? (
                    <div className="px-4 sm:px-6 py-6 sm:py-8">
                        <h2 className="text-gray-900 text-xl sm:text-2xl font-semibold text-center mb-4 sm:mb-6">What can I help with?</h2>
                        
                        {/* Input Area - Minimal Style */}
                        <div className="flex gap-2">
                            <div className="flex-1 flex items-center px-3 sm:px-4 py-2.5 sm:py-3 rounded-full bg-gray-100 border border-gray-300 backdrop-blur-sm hover:bg-gray-150 transition">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Ask anything"
                                    className="flex-1 bg-transparent text-gray-800 placeholder-gray-500 focus:outline-none text-xs sm:text-sm"
                                />
                            </div>
                            <button
                                onClick={handleSend}
                                className="p-2 sm:p-3 rounded-full bg-orange-500 hover:bg-orange-600 text-white transition-all hover:shadow-lg flex items-center justify-center"
                            >
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="bg-gradient-to-r from-orange-500 to-orange-300 px-4 sm:px-6 py-3 sm:py-4">
                            <h2 className="text-white font-semibold text-sm sm:text-base">TDH ERP AI Assistant</h2>
                            <p className="text-white text-xs sm:text-sm">Ask me anything about your dashboard</p>
                        </div>

                        {/* Chat Area */}
                        <div className="max-h-40 sm:max-h-56 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4 bg-gradient-to-b from-white to-gray-50">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div
                                        className={`max-w-xs px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm ${
                                            msg.role === 'user'
                                                ? 'bg-gradient-to-r from-gray-100 to-gray-200 text-black rounded-br-none shadow-md'
                                                : 'bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900 rounded-bl-none border-2 border-gray-200 shadow-sm'
                                        }`}
                                    >
                                        <p className="leading-relaxed">{msg.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Input Area - Expanded Style */}
                        <div className="border-t border-gray-200 p-3 sm:p-4 bg-gradient-to-t from-gray-50 to-white">
                            <div className="flex gap-2 sm:gap-3">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Ask about analytics..."
                                    className="flex-1 px-3 sm:px-4 py-2 rounded-full border-2 border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm text-gray-900 placeholder-gray-500"
                                />
                                <button
                                onClick={handleSend}
                                className="p-2 sm:p-3 rounded-full bg-orange-500 hover:bg-orange-600 text-white transition-all hover:shadow-lg flex items-center justify-center"
                            >
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

// Enhanced Bar Chart Component
const BarChart: React.FC<{ data: { label: string; value: number }[]; title: string }> = ({ data, title }) => {
    const maxValue = Math.max(...data.map(d => d.value), 1);
    
    return (
        <div className="p-4 sm:p-6 rounded-xl bg-gradient-to-br from-white via-blue-50 to-white border border-gray-200/50 shadow-lg hover:shadow-2xl transition-all h-full flex flex-col relative overflow-hidden group">
            {/* Glossy overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
            <h4 className="text-sm sm:text-base font-semibold text-gray-800 mb-4 sm:mb-6 relative z-10">{title}</h4>
            <div className="flex-grow flex flex-col relative z-10">
                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    <div className="flex justify-start items-end space-x-3 sm:space-x-4 pt-2 pb-2 min-w-max pr-4">
                        {data.length > 0 ? (
                            data.map((item, idx) => {
                                const colors = [
                                    'bg-gradient-to-t from-green-300 to-green-300',
                                    'bg-gradient-to-t from-pink-500 to-pink-200',
                                    'bg-gradient-to-t from-purple-500 to-purple-200',
                                    'bg-gradient-to-t from-blue-500 to-blue-200',
                                    'bg-gradient-to-t from-orange-500 to-orange-200',
                                    'bg-gradient-to-t from-indigo-500 to-indigo-200',
                                ];
                                return (
                                    <div key={item.label} className="flex flex-col items-center flex-shrink-0 text-center" style={{ minWidth: '80px' }}>
                                        <div className="text-xs sm:text-sm text-gray-700 mb-1 sm:mb-2 font-semibold">{item.value}</div>
                                        <div 
                                            className={`${colors[idx % 6]} rounded-t-lg shadow-md hover:shadow-lg transition-all min-h-8 sm:min-h-10`}
                                            style={{ height: `${Math.max((item.value / maxValue) * 100, 8)}%`, width: '60px' }} 
                                        />
                                        <span className="text-xs text-gray-600 mt-2 sm:mt-3 font-medium truncate max-w-16 break-words">{item.label}</span>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="w-full text-center text-gray-400 py-8">No data available</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Pie Chart Component
const PieChart: React.FC<{ data: { label: string; value: number; color: string }[]; title: string }> = ({ data, title }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    
    if (total === 0) {
        return (
            <div className="p-4 sm:p-6 rounded-xl bg-gradient-to-br from-white via-purple-50 to-white border border-gray-200/50 shadow-lg hover:shadow-2xl transition-all h-full flex items-center justify-center relative overflow-hidden group">
                {/* Glossy overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                <div className="text-center text-gray-400 relative z-10">
                    <h4 className="text-sm sm:text-base font-semibold mb-2">{title}</h4>
                    <p className="text-xs sm:text-sm">No data available</p>
                </div>
            </div>
        );
    }

    let cumulative = 0;
    const gradientParts = data.map(item => {
        const start = (cumulative / total) * 100;
        cumulative += item.value;
        const end = (cumulative / total) * 100;
        return `${item.color} ${start}% ${end}%`;
    });
    const gradient = `conic-gradient(${gradientParts.join(', ')})`;
    
    return (
        <div className="p-4 sm:p-6 rounded-xl bg-gradient-to-br from-white via-pink-50 to-white border border-gray-200/50 shadow-lg hover:shadow-2xl transition-all h-full flex flex-col relative overflow-hidden group">
            {/* Glossy overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
            <h4 className="text-sm sm:text-base font-semibold text-gray-800 mb-4 sm:mb-6 relative z-10">{title}</h4>
            <div className="flex flex-col sm:flex-row items-center justify-around flex-grow gap-4 sm:gap-6 relative z-10">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full shadow-lg flex-shrink-0" style={{ background: gradient }} />
                <div className="space-y-1 sm:space-y-2 flex-1 w-full">
                    {data.map(item => (
                        <div key={item.label} className="flex items-center text-xs sm:text-sm gap-1">
                            <div 
                                className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shadow-sm flex-shrink-0" 
                                style={{ backgroundColor: item.color }}
                            />
                            <span className="text-gray-700 font-semibold truncate text-xs sm:text-sm">{item.label}:</span>
                            <span className="text-gray-500 text-xs whitespace-nowrap">{item.value} ({((item.value / total) * 100).toFixed(0)}%)</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Color mapping from Tailwind classes to CSS colors
const colorMap: Record<string, { bg: string; text: string; border: string; lightBg: string }> = {
    'green': { bg: '#f2fcdcff', text: '#653616ff', border: '#bbf7d0', lightBg: '#f8fdf0ff' },  // Gate Entry - Green
    'pink': { bg: '#fce7f3', text: '#be185d', border: '#fbcfe8', lightBg: '#fdf2f8' },    // Weighing - Pink
    'purple': { bg: '#f3e8ff', text: '#6b21a8', border: '#e9d5ff', lightBg: '#faf5ff' },  // Quality Check - Purple
    'blue': { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd', lightBg: '#f0f9ff' },    // Dispatch - Blue
};

// Minimal Stat Card with Stage Color Grading
const StatCard: React.FC<{ 
    label: string; 
    value: number; 
    icon: React.ReactNode; 
    colorKey: string 
}> = ({ label, value, icon, colorKey }) => {
    const colors = colorMap[colorKey] || colorMap['green'];
    
    return (
        <div 
            className="rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-md hover:shadow-lg transition-shadow border-2 overflow-hidden"
            style={{ 
                backgroundColor: colors.bg, 
                borderColor: colors.border,
            }}
        >
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                    <p 
                        className="text-xs sm:text-sm font-bold uppercase tracking-wide flex-1"
                        style={{ color: colors.text }}
                    >
                        {label}
                    </p>
                    <div 
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden"
                        style={{ backgroundColor: colors.lightBg }}
                    >
                        <div style={{ color: colors.text }} className="flex items-center justify-center w-full h-full scale-75">
                            {icon}
                        </div>
                    </div>
                </div>
                <p 
                    className="text-3xl sm:text-4xl font-bold"
                    style={{ color: colors.text }}
                >
                    {value.toLocaleString()}
                </p>
            </div>
        </div>
    );
};

export const AnalyticsDashboard: React.FC = () => {
    const { logs } = useAuth();
    const [selectedStage, setSelectedStage] = useState<ProcessStage | null>(null);

    // Calculate analytics for each stage
    const stageAnalytics = useMemo(() => {
        const analytics: Record<string, { total: number; byUser: Record<string, number> }> = {};

        PROCESS_STAGES.forEach(stage => {
            const stageLogs = logs.filter(log => log.stageId === stage.id);
            const byUser: Record<string, number> = {};

            stageLogs.forEach(log => {
                byUser[log.userName] = (byUser[log.userName] || 0) + 1;
            });

            analytics[stage.id] = {
                total: stageLogs.length,
                byUser,
            };
        });

        return analytics;
    }, [logs]);

    // Overall statistics
    const totalRecords = logs.length;
    const totalOperators = new Set(logs.map(log => log.userId)).size;
    const today = new Date().toDateString();
    const todayRecords = logs.filter(log => new Date(log.timestamp).toDateString() === today).length;

    // Top operators overall
    const topOperatorsOverall = Object.entries(
        logs.reduce((acc, log) => {
            acc[log.userName] = (acc[log.userName] || 0) + 1;
            return acc;
        }, {} as Record<string, number>)
    )
        .sort(([, a], [, b]) => b - a)
        .slice(0, 6)
        .map(([name, count]) => ({ label: name, value: count }));

    // Stage records data
    const stageRecords = PROCESS_STAGES.map(stage => ({
        label: stage.name,
        value: stageAnalytics[stage.id].total,
    }));

    // Stage colors for pie chart
    const stageColors = ['#99cf97ff', '#db5a9bff', '#A855F7', '#3B82F6', '#F97316', '#6366F1'];
    const stagePieData = stageRecords
        .filter(s => s.value > 0)
        .map((stage, idx) => ({
            label: stage.label,
            value: stage.value,
            color: stageColors[idx % stageColors.length],
        }));

    return (
        <div className="space-y-4 sm:space-y-6 pb-6 sm:pb-8 px-3 sm:px-0">
            {/* Chatbot Section */}
            <ChatBot />

            {/* Header */}
            <div className="max-w-6xl mx-auto">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center">Analytics Dashboard</h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2 text-center">Real-time insights across all process stages</p>
            </div>

            {/* Key Metrics */}
            <div className="max-w-6xl mx-auto w-full">
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                <StatCard 
                    label="Total Records" 
                    value={totalRecords} 
                    icon={<ChartBarIcon />}
                    colorKey="green"
                />
                <StatCard 
                    label="Today's Records" 
                    value={todayRecords} 
                    icon={<SparklesIcon />}
                    colorKey="blue"
                />
                <StatCard 
                    label="Active Operators" 
                    value={totalOperators} 
                    icon={<UserGroupIcon />}
                    colorKey="purple"
                />
                <StatCard 
                    label="Avg Per Operator" 
                    value={totalOperators > 0 ? Math.round(totalRecords / totalOperators) : 0} 
                    icon={<CogIcon />}
                    colorKey="pink"
                />
            </div>
            </div>

            {/* Charts Section */}
            <div className="max-w-6xl mx-auto w-full">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Stage Records Bar Chart */}
                <BarChart 
                    data={stageRecords} 
                    title="Stage Records"
                />

                {/* Stage Distribution Pie Chart */}
                {stagePieData.length > 0 && (
                    <PieChart 
                        data={stagePieData}
                        title="Stage Distribution"
                    />
                )}
                </div>
            </div>
            {/* Analytics Modal */}
            {selectedStage && (
                <AnalyticsModal 
                    stage={selectedStage} 
                    onClose={() => setSelectedStage(null)} 
                />
            )}
        </div>
    );
};

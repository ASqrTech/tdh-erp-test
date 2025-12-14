export type Role = 
    | 'ADMIN'
    | 'MANAGER'
    | 'ASSISTANT_MANAGER'
    | 'GATE_ENTRY_OPERATOR'
    | 'WEIGHING_OPERATOR'
    | 'QUALITY_OPERATOR'
    | 'BIN_OPERATOR'
    | 'STORE_MANAGER';

export interface User {
    id: string;
    name: string;
    pin: string;
    role: Role;
    email: string;
    phone?: string;
    address?: string;
    status: 'ACTIVE' | 'INACTIVE';
    isTemporaryPassword?: boolean;
}

export interface ProcessStage {
    id: string;
    name: string;
    description: string;
}

export interface LogEntry {
    id: string;
    timestamp: string;
    userId: string;
    userName: string;
    action: string;
    details: string | Record<string, any>;
    active?: boolean; // Flag for soft delete/inactive state
}
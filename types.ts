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
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    OtherDetails?: string;
    email: string;
    phone?: string;
    address?: string;
    status: 'ACTIVE' | 'INACTIVE';
    isTemporaryPassword?: boolean;
    em
}

export interface ProcessStage {
    id: string;
    name: string;
    description: string;
}

export interface LogEntry {
    id: string;
    timestamp: any;
    userId: string;
    userName: string;
    action: string;
    details: string | Record<string, any>;
    deleted?: boolean;
    active?: boolean; // Flag for soft delete/inactive state
}
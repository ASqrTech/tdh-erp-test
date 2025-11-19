import type React from 'react';

export type Role = 
  | 'ADMIN'
  | 'MANAGER'
  | 'ASSISTANT_MANAGER'
  | 'GATE_ENTRY_OPERATOR'
  | 'OPERATOR'
  | 'QUALITY_SUPERVISOR'
  | 'BIN_OPERATOR'
  | 'STORE_MANAGER'
  | 'PLANT_OPERATOR'
  | 'PACKAGING_SUPERVISOR'
  | 'LOGISTICS_OFFICER';

export interface User {
  id: string;
  name: string;
  role: Role;
  pin: string; // In a real app, this would be a hash
  password: string; // In a real app, this would be a hash
  phone?: string;
  address?: string;
  email?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  familyDetails?: string; // Simple text field for now
  status: 'ACTIVE' | 'INACTIVE';
}

export interface FormField {
    name: string;
    label: string;
    type: 'text' | 'number' | 'textarea' | 'date' | 'checkbox' | 'dropdown' | 'file' | 'heading' | 'tel';
    placeholder?: string;
    options?: string[];
    multiple?: boolean;
}

export interface ProcessStage {
    id: string;
    name: string;
    responsibleRole: string;
    erpModule: string;
    dependentOn: string;
    output: string;
    description: string;
    color: {
        bg: string;
        text: string;
        border: string;
    };
    icon: React.ReactNode;
    formFields: FormField[];
}

export interface LogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  details: Record<string, any> | string;
}
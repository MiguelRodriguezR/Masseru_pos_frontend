export interface UserSettings {
    friPercentage: number;
}

export interface User {
    _id?: string;
    name: string;
    email: string;
    role: string;
    approved: boolean;
    settings?: UserSettings;
    createdAt?: string;
    updatedAt?: string;
  }

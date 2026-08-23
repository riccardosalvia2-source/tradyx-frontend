// ============================================================================
// TRADYX AUTHENTICATION & ADMIN TYPES (src/types/auth.ts)
// ============================================================================

export type UserRole = 'user' | 'admin' | 'pro_trader';
export type UserTier = 'Free' | 'Pro' | 'VIP Quant';
export type UserStatus = 'active' | 'suspended';

export interface UserAccount {
  id: string;
  email: string;
  full_name?: string;
  email_confirmed: boolean;
  role: UserRole;
  tier?: UserTier;
  status?: UserStatus;
  created_at: string;
  last_sign_in_at?: string;
}

export type LogType = 'TRADE_LOGGED' | 'AUTH_SIGNIN' | 'AUTH_SIGNUP' | 'AI_QUERY' | 'ANOMALY' | 'SYSTEM_ERROR';

export interface SystemLogEntry {
  id: string;
  type: LogType;
  message: string;
  timestamp: string;
  user_email?: string;
  details?: Record<string, any>;
}

export type AnomalySeverity = 'LOW' | 'MEDIUM' | 'HIGH';
export type AnomalyStatus = 'OPEN' | 'INVESTIGATING' | 'RESOLVED';

export interface AnomalyReport {
  id: string;
  title: string;
  description: string;
  severity: AnomalySeverity;
  status: AnomalyStatus;
  user_email?: string;
  created_at: string;
}

// Broadcast Announcement Types
export type BroadcastStyle = 'INFO' | 'PROMO' | 'WARNING';

export interface SystemBroadcast {
  id: string;
  title: string;
  message: string;
  style: BroadcastStyle;
  active: boolean;
  created_at: string;
}

// Gemini AI Call Telemetry Types
export type GeminiModelId = 'gemini-1.5-flash' | 'gemini-2.0-flash' | 'gemini-1.5-pro';

export interface GeminiCallLog {
  id: string;
  timestamp: string;
  user_email: string;
  model: GeminiModelId;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  status: '200 OK' | '500 Error' | '429 Rate Limit';
}


export type EventSource = 'flight' | 'gate' | 'baggage' | 'security' | 'maintenance';
export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface SimEvent {
  id: string;
  timestamp: string; // ISO string
  timestampMs: number;
  source: EventSource;
  eventType: string; // e.g. 'FLIGHT_DEPARTURE', 'GATE_BOARDING_START', etc.
  title: string;
  details: string;
  flightId?: string;
  severity: AlertSeverity;
  rawRecord: any;
}

export interface SimAlert {
  id: string;
  ruleId: string;
  timestamp: string; // ISO string
  timestampMs: number;
  severity: AlertSeverity;
  title: string;
  description: string;
  affectedFlightId?: string;
  affectedRef?: string;
  isAcknowledged: boolean;
  acknowledgedAt?: string;
  source: EventSource;
}

export type AlertRuleId =
  | 'RULE_FLIGHT_DELAY'
  | 'RULE_GATE_CONFLICT'
  | 'RULE_BAGGAGE_DELAY'
  | 'RULE_SECURITY_LATENCY'
  | 'RULE_MAINTENANCE_DEFECT';

export interface AlertRule {
  id: AlertRuleId;
  name: string;
  description: string;
  severity: AlertSeverity;
}

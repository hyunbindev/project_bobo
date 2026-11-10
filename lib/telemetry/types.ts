export const TELEMETRY_PARSER_VERSION = 2;

export type TelemetryCharacter = {
  accountId: string | null;
  name: string | null;
  teamId: number | null;
  location: { x: number; y: number; z: number } | null;
};

export type DamageInfo = {
  weapon: string | null;
  reason: string | null;
  category: string | null;
  distance: number | null;
};

export type CombatPayload = {
  victim: TelemetryCharacter;
  attacker?: TelemetryCharacter | null;
  killer?: TelemetryCharacter | null;
  finisher?: TelemetryCharacter | null;
  knockMaker?: TelemetryCharacter | null;
  reviver?: TelemetryCharacter | null;
  damage?: number;
  damageInfo?: DamageInfo;
  finishDamageInfo?: DamageInfo;
  knockDamageInfo?: DamageInfo;
  knockId?: number | null;
  assists?: string[];
  isSuicide?: boolean;
};

export type MovementPayload = {
  character: TelemetryCharacter;
  elapsedTime: number;
  numAlivePlayers: number | null;
};

export type TelemetryPayload = CombatPayload | MovementPayload;

export type ParsedTelemetryEvent = {
  eventIndex: number;
  eventType: string;
  occurredAt: Date;
  payload: TelemetryPayload;
};

export type ParsedTelemetry = {
  parserVersion: number;
  events: ParsedTelemetryEvent[];
  sourceEventCount: number;
  ignoredEventCounts: Record<string, number>;
};

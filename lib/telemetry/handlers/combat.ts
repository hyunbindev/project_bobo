import type { CombatPayload, DamageInfo, TelemetryCharacter } from "../types";
import { character, number, object, text, type ObjectValue } from "./values";

function damageInfo(value: ObjectValue | null): DamageInfo {
  return {
    weapon: text(value?.damageCauserName), reason: text(value?.damageReason),
    category: text(value?.damageTypeCategory), distance: number(value?.distance),
  };
}

type Handler = (event: ObjectValue, victim: TelemetryCharacter) => CombatPayload;
export const combatHandlers: Readonly<Record<string, Handler>> = {
  LogPlayerTakeDamage(event, victim) {
    const damage = number(event.damage);
    if (damage === null || damage < 0) throw new Error("Invalid damage");
    return { victim, attacker: character(event.attacker), damage, damageInfo: damageInfo(event) };
  },

  LogPlayerMakeGroggy: (event, victim) => ({
    victim, attacker: character(event.attacker), knockId: number(event.dBNOId), damageInfo: damageInfo(event),
  }),

  LogPlayerKillV2: (event, victim) => ({
    victim, killer: character(event.killer), finisher: character(event.finisher), knockMaker: character(event.dBNOMaker),
    knockId: number(event.dBNOId), damageInfo: damageInfo(object(event.killerDamageInfo)),
    finishDamageInfo: damageInfo(object(event.finishDamageInfo)), knockDamageInfo: damageInfo(object(event.dBNODamageInfo)),
    assists: Array.isArray(event.assists_AccountId) ? event.assists_AccountId.filter((id): id is string => typeof id === "string") : [],
    isSuicide: event.isSuicide === true,
  }),

  LogPlayerKill: (event, victim) => ({ victim, killer: character(event.killer), damageInfo: damageInfo(event), knockId: number(event.dBNOId) }),
  
  LogPlayerRevive(event, victim) {
    const reviver = character(event.reviver);
    if (!reviver) throw new Error("Missing reviver");
    return { victim, reviver, knockId: number(event.dBNOId) };
  },
};

export function parseCombatEvent(type: string, event: ObjectValue): CombatPayload {
  const victim = character(event.victim);
  if (!victim) throw new Error("Missing victim");
  return combatHandlers[type](event, victim);
}

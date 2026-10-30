import type { PubgClan } from "@/lib/pubg/clan-types";
import type { PubgPlayer } from "@/lib/pubg/types";

export type SaveClanMemberInput = {
  clan: PubgClan;
  player: PubgPlayer;
  member: {
    displayName: string | null;
    birthYear: number | null;
    profileRegistered: boolean;
  };
};

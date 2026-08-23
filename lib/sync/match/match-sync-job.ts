import { getMatchById } from "@/lib/pubg/matches";
import { getPlayersByAccountIds } from "@/lib/pubg/players";
import { findStoredClanMember } from "@/lib/repositories/clan-member-repository";

let isRunning:boolean = false;
const BATCH_SIZE = 10;

export default async function clanMatchSyncJob(){
    if(isRunning) return;
    isRunning = true;

    try {
        const targetClanId = process.env.PUBG_CLAN_ID;

        if (!targetClanId) {
            throw new Error("PUBG_CLAN_ID is not configured.");
        }

        const storedMembers = await findStoredClanMember();
        
        const clanMembers = storedMembers.filter(
            ({ players }) =>
                players.pubgClanId === targetClanId && players.platform === "kakao",
        );

        const clanPubgAccountIds = new Set<string>(
            clanMembers.map(({ players }) => players.pubgAccountId),
        );
        console.log(clanPubgAccountIds)

        const members = clanMembers.slice(0, BATCH_SIZE);
        const matchIds = new Set<string>();
        
        const pubgAccountIds = members.map(({ players })=> players.pubgAccountId );

        const playerResponse = await getPlayersByAccountIds(pubgAccountIds,"kakao");

        for(const response of playerResponse){
            if(response.clanId !== targetClanId){ continue; }
            
            const playerMatchIds = response.matchIds;


            console.log(playerMatchIds)

            for(const matchId of playerMatchIds){
                matchIds.add(matchId);
            }
        }

        const matchHistories = await Promise.all( [...matchIds].map((matchId)=>getMatchById(matchId,"kakao")) )
        for(const history of matchHistories){
            const id:string = history.id;
            const mapName:string = history.mapName;
            const gameMode:string = history.gameMode;
            const clanParticipants = history.participants
                .filter((participant) => clanPubgAccountIds.has(participant.stats.playerId))

            const clanRosterIds = new Set(
                clanParticipants.flatMap((participant) =>
                    participant.rosterId ? [participant.rosterId] : [],
                ),
            );

            const clanRosters = history.rosters.filter((roster) =>
                clanRosterIds.has(roster.id),
            );

            
        }

    }catch (error) {
        console.error("Error in clanMatchSyncJob:", error);
    } finally {
        isRunning = false;
    }
}

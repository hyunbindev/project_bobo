import type { PubgClan } from "@/lib/pubg/clan-types";
import { PubgApiError } from "@/lib/pubg/client";
import { getMatchById } from "@/lib/pubg/matches";
import type { PubgMatch } from "@/lib/pubg/match-types";
import { getPlayersByAccountIds } from "@/lib/pubg/players";
import { findStoredClanMember, markPlayersSynced, saveClanMember, } from "@/lib/repositories/clan-member-repository";
import { findStoredMatchHistories, saveMatchHistory, } from "@/lib/repositories/match-repository";
import { getMainClanSummary } from "@/lib/services/clan-service";

let isRunning = false;
const PLAYER_BATCH_SIZE = 10;
const MATCH_FETCH_BATCH_SIZE = 5;
const PLAYER_REQUEST_INTERVAL_MS = 8_000;
const MAX_RATE_LIMIT_RETRIES = 3;

function delay(milliseconds: number) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function getRetryDelay(retryAfter: string | null) {
    if (!retryAfter) {
        return 60_000;
    }

    const retryAfterSeconds = Number(retryAfter);

    if (Number.isFinite(retryAfterSeconds)) {
        return Math.max(retryAfterSeconds * 1_000, PLAYER_REQUEST_INTERVAL_MS);
    }

    const retryAt = Date.parse(retryAfter);

    if (Number.isNaN(retryAt)) {
        return 60_000;
    }

    return Math.max(retryAt - Date.now(), PLAYER_REQUEST_INTERVAL_MS);
}

async function getPlayersWithRateLimitRetry(accountIds: string[]) {
    let rateLimitRetryCount = 0;

    while (true) {
        try {
            return await getPlayersByAccountIds(accountIds, "kakao");
        } catch (error) {
            if (
                !(error instanceof PubgApiError) ||
                error.status !== 429 ||
                rateLimitRetryCount >= MAX_RATE_LIMIT_RETRIES
            ) {
                throw error;
            }

            rateLimitRetryCount += 1;
            const retryDelay = getRetryDelay(error.retryAfter);

            console.warn(
                `PUBG player API rate limited. Retrying in ${retryDelay}ms.`,
            );
            await delay(retryDelay);
        }
    }
}

function findClanRosterParticipants(
    history: PubgMatch,
    clanPubgAccountIds: Set<string>,
) {
    const clanRosterIds = new Set(
        history.participants
            .filter((participant) =>
                clanPubgAccountIds.has(participant.stats.playerId),
            )
            .flatMap((participant) =>
                participant.rosterId ? [participant.rosterId] : [],
            ),
    );

    return history.participants.filter(
        (participant) =>
            participant.rosterId !== null &&
            clanRosterIds.has(participant.rosterId),
    );
}

export default async function clanMatchSyncJob() {
    if (isRunning) return;
    isRunning = true;

    try {
        const clanSummary = await getMainClanSummary();

        if (!clanSummary) {
            throw new Error("Main clan is not configured.");
        }

        const targetClanId =
            process.env.PUBG_CLAN_ID || clanSummary.pubgClanId;
        const targetClan: PubgClan = {
            id: clanSummary.pubgClanId,
            platform: clanSummary.platform,
            name: clanSummary.name,
            tag: clanSummary.tag,
            level: clanSummary.level,
            memberCount: clanSummary.memberCount,
        };

        const storedMembers = await findStoredClanMember();

        const clanMembers = storedMembers.filter(
            ({ players }) =>
                players.pubgClanId === targetClanId &&
                players.platform === "kakao",
        );

        const clanPubgAccountIds = new Set<string>(
            clanMembers.map(({ players }) => players.pubgAccountId),
        );

        const members = clanMembers.slice(0, PLAYER_BATCH_SIZE);
        const matchIds = new Set<string>();

        const pubgAccountIds = members.map(
            ({ players }) => players.pubgAccountId,
        );

        const playerResponse = await getPlayersWithRateLimitRetry(
            pubgAccountIds,
        );

        await markPlayersSynced(
            playerResponse.map((player) => player.accountId),
            "kakao",
        );

        for (const response of playerResponse) {
            if (response.clanId !== targetClanId) continue;

            for (const matchId of response.matchIds) {
                matchIds.add(matchId);
            }
        }

        const storedMatchHistories = await findStoredMatchHistories([
            ...matchIds,
        ]);
        const storedMatchIds = new Set(
            storedMatchHistories.map(({ history }) => history.id),
        );
        const newMatchIds = [...matchIds].filter(
            (matchId) => !storedMatchIds.has(matchId),
        );
        const candidatePlayerIds = new Set<string>();
        let syncedMatchCount = 0;
        let backfilledMatchCount = 0;
        let failedMatchCount = 0;
        let verifiedClanMemberCount = 0;
        let failedCandidateBatchCount = 0;
        let failedClanMemberSaveCount = 0;

        for (const storedMatch of storedMatchHistories) {
            const clanRosterParticipants = findClanRosterParticipants(
                storedMatch.history,
                clanPubgAccountIds,
            );
            const storedParticipantAccountIds = new Set(
                storedMatch.participantAccountIds,
            );
            const hasMissingParticipants = clanRosterParticipants.some(
                (participant) =>
                    !storedParticipantAccountIds.has(participant.stats.playerId),
            );

            if (hasMissingParticipants) {
                try {
                    await saveMatchHistory({
                        history: storedMatch.history,
                        participantAccountIds: clanRosterParticipants.map(
                            (participant) => participant.stats.playerId,
                        ),
                    });
                    backfilledMatchCount += 1;
                } catch (error) {
                    failedMatchCount += 1;
                    console.error(
                        `Failed to backfill PUBG match ${storedMatch.history.id}:`,
                        error,
                    );
                    continue;
                }
            }

            clanRosterParticipants
                .filter((participant) =>
                    !clanPubgAccountIds.has(participant.stats.playerId),
                )
                .forEach((participant) =>
                    candidatePlayerIds.add(participant.stats.playerId),
                );
        }

        for (
            let index = 0;
            index < newMatchIds.length;
            index += MATCH_FETCH_BATCH_SIZE
        ) {
            const matchIdBatch = newMatchIds.slice(
                index,
                index + MATCH_FETCH_BATCH_SIZE,
            );
            const matchResults = await Promise.allSettled(
                matchIdBatch.map((matchId) => getMatchById(matchId, "kakao")),
            );

            for (const [resultIndex, result] of matchResults.entries()) {
                if (result.status === "rejected") {
                    failedMatchCount += 1;
                    console.error(
                        `Failed to fetch PUBG match ${matchIdBatch[resultIndex]}:`,
                        result.reason,
                    );
                    continue;
                }

                const history = result.value;
                const clanRosterParticipants = findClanRosterParticipants(
                    history,
                    clanPubgAccountIds,
                );

                try {
                    await saveMatchHistory({
                        history,
                        participantAccountIds: clanRosterParticipants.map(
                            (participant) => participant.stats.playerId,
                        ),
                    });
                    syncedMatchCount += 1;
                } catch (error) {
                    failedMatchCount += 1;
                    console.error(`Failed to save PUBG match ${history.id}:`, error);
                    continue;
                }

                clanRosterParticipants
                    .filter((participant) =>
                        !clanPubgAccountIds.has(participant.stats.playerId),
                    )
                    .forEach((participant) =>
                        candidatePlayerIds.add(participant.stats.playerId),
                    );
            }
        }

        const candidateAccountIds = [...candidatePlayerIds];

        for (
            let index = 0;
            index < candidateAccountIds.length;
            index += PLAYER_BATCH_SIZE
        ) {
            const candidateBatch = candidateAccountIds.slice(
                index,
                index + PLAYER_BATCH_SIZE,
            );

            await delay(PLAYER_REQUEST_INTERVAL_MS);

            let candidatePlayers;

            try {
                candidatePlayers = await getPlayersWithRateLimitRetry(
                    candidateBatch,
                );
            } catch (error) {
                failedCandidateBatchCount += 1;
                console.error("Failed to verify clan member candidates:", error);
                continue;
            }

            for (const player of candidatePlayers) {
                if (player.clanId !== targetClanId) continue;

                try {
                    await saveClanMember({
                        clan: targetClan,
                        player,
                        member: {
                            displayName: null,
                            age: null,
                            profileRegistered: false,
                        },
                    });
                } catch (error) {
                    failedClanMemberSaveCount += 1;
                    console.error(
                        `Failed to save discovered clan member ${player.accountId}:`,
                        error,
                    );
                    continue;
                }

                clanPubgAccountIds.add(player.accountId);
                verifiedClanMemberCount += 1;
            }
        }

        console.log({
            discoveredMatchCount: matchIds.size,
            storedMatchCount: storedMatchIds.size,
            newMatchCount: newMatchIds.length,
            syncedMatchCount,
            backfilledMatchCount,
            failedMatchCount,
            candidatePlayerCount: candidatePlayerIds.size,
            verifiedClanMemberCount,
            failedCandidateBatchCount,
            failedClanMemberSaveCount,
        });
    } catch (error) {
        console.error("Error in clanMatchSyncJob:", error);
    } finally {
        isRunning = false;
    }
}

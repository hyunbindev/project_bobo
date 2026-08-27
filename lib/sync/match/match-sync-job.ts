import type { Logger } from "pino";

import { logger } from "@/lib/logger";
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

type PlayerApiMetrics = {
    requestCount: number;
    rateLimitCount: number;
};

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

async function getPlayersWithRateLimitRetry(
    accountIds: string[],
    log: Logger,
    metrics: PlayerApiMetrics,
) {
    let rateLimitRetryCount = 0;

    while (true) {
        metrics.requestCount += 1;

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
            metrics.rateLimitCount += 1;
            const retryDelay = getRetryDelay(error.retryAfter);

            log.warn(
                {
                    event: "match_sync.player_api_rate_limited",
                    retryCount: rateLimitRetryCount,
                    retryDelayMs: retryDelay,
                    batchSize: accountIds.length,
                },
                "PUBG player API rate limited",
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
    if (isRunning) {
        logger.debug(
            {
                event: "match_sync.skipped",
                reason: "already_running",
            },
            "Match sync skipped",
        );
        return;
    }

    isRunning = true;
    const runId = crypto.randomUUID();
    const startedAt = Date.now();
    const log = logger.child({ component: "match-sync", runId });
    const playerApiMetrics: PlayerApiMetrics = {
        requestCount: 0,
        rateLimitCount: 0,
    };

    log.info(
        { event: "match_sync.started" },
        "Match sync started",
    );

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
            log,
            playerApiMetrics,
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
        let candidateBatchCount = 0;

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
                    log.error(
                        {
                            err: error,
                            event: "match_sync.match_backfill_failed",
                            pubgMatchId: storedMatch.history.id,
                        },
                        "Failed to backfill PUBG match",
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
                    log.error(
                        {
                            err: result.reason,
                            event: "match_sync.match_fetch_failed",
                            pubgMatchId: matchIdBatch[resultIndex],
                        },
                        "Failed to fetch PUBG match",
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
                    log.error(
                        {
                            err: error,
                            event: "match_sync.match_save_failed",
                            pubgMatchId: history.id,
                        },
                        "Failed to save PUBG match",
                    );
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
            candidateBatchCount += 1;

            let candidatePlayers;

            try {
                candidatePlayers = await getPlayersWithRateLimitRetry(
                    candidateBatch,
                    log,
                    playerApiMetrics,
                );
            } catch (error) {
                failedCandidateBatchCount += 1;
                log.error(
                    {
                        err: error,
                        event: "match_sync.candidate_batch_failed",
                        batchSize: candidateBatch.length,
                    },
                    "Failed to verify clan member candidates",
                );
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
                    log.error(
                        {
                            err: error,
                            event: "match_sync.clan_member_save_failed",
                        },
                        "Failed to save discovered clan member",
                    );
                    continue;
                }

                clanPubgAccountIds.add(player.accountId);
                verifiedClanMemberCount += 1;
            }
        }

        log.info(
            {
                event: "match_sync.completed",
                durationMs: Date.now() - startedAt,
                memberCount: members.length,
                discoveredMatchCount: matchIds.size,
                storedMatchCount: storedMatchIds.size,
                newMatchCount: newMatchIds.length,
                syncedMatchCount,
                backfilledMatchCount,
                failedMatchCount,
                candidatePlayerCount: candidatePlayerIds.size,
                candidateBatchCount,
                playerApiRequestCount: playerApiMetrics.requestCount,
                rateLimitCount: playerApiMetrics.rateLimitCount,
                verifiedClanMemberCount,
                failedCandidateBatchCount,
                failedClanMemberSaveCount,
            },
            "Match sync completed",
        );
    } catch (error) {
        log.error(
            {
                err: error,
                event: "match_sync.failed",
                durationMs: Date.now() - startedAt,
                playerApiRequestCount: playerApiMetrics.requestCount,
                rateLimitCount: playerApiMetrics.rateLimitCount,
            },
            "Match sync failed",
        );
    } finally {
        isRunning = false;
    }
}

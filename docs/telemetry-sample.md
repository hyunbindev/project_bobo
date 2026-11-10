# Telemetry sample measurement

Measured 2026-11-10 using Node.js v24.13.0 on the local Windows machine.
The actual version 2 parser was used. No DB connection, job claiming or writes.

Source: https://telemetry-cdn.pubg.com/bluehole-pubg/kakao/2026/11/10/00/01/eefde79b-dc99-11f1-afef-b2a4aa4f4809-telemetry.json

| Data | Events | JSON bytes | gzip bytes |
| --- | ---: | ---: | ---: |
| Original | 22,381 | 14,222,950 | 955,448 |
| Normalized combat | 4,455 | 2,155,976 | 133,364 |
| Normalized movement | 3,765 | 1,143,589 | 95,463 |
| Combined | 8,220 | 3,299,564 | 258,757 |

Original gzip size is the HTTP Content-Length with Content-Encoding=gzip.
Filtered gzip sizes use Node zlib's default gzip compression; they describe a
compressed file for each entire event list, not PostgreSQL per-row JSONB compression.
Compression of an interleaved list differs from compressing each category separately.

Movement appeared for 57 distinct character IDs/names, with a median interval of
10 seconds. This is the sample's observed coverage, not a promise that every match
has 57 participants or identical intervals. Every position was retained.

Local download/decode took about 690 ms, JSON parse and normalization about 54 ms.
RSS immediately after parsing was 116,813,824 bytes; maximum process RSS including
measurement/compression was 147,361,792 bytes. These are single-run local numbers,
not incremental parser memory or N100 production benchmarks.

If all 19,480 matches had this sample's size:

- Combined gzip files: 5,040,586,360 bytes (5.04 decimal GB).
- Uncompressed normalized JSON: 64,275,506,720 bytes (64.28 GB).
- Event rows: 160,125,600, including 73,342,200 positions.
- Heuristic DB table/index range: 73,927,651,920..111,329,699,960 bytes (74..111 GB).

The DB range uses payload JSON bytes * 1.05..1.5 + 150..250 bytes per row. Actual
JSONB encoding, indexes, compression and page allocation are unmeasured. WAL, backups,
table bloat and original files are excluded. One match is not a representative mean;
compare several maps, durations and participant counts before planning capacity.

On this Windows machine Node needed --use-system-ca to trust the CDN certificate
chain. Certificate verification was kept enabled.

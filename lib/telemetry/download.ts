export type DownloadOptions = { timeoutMs?: number; maxBytes?: number; signal?: AbortSignal };

/** Node fetch decompresses Content-Encoding automatically; limit the decompressed stream. */
export async function downloadTelemetry(url: string, options: DownloadOptions = {}) {
  const target = new URL(url);

  if (target.protocol !== "https:" || target.hostname !== "telemetry-cdn.pubg.com" || target.username || target.password || (target.port && target.port !== "443")) {
    throw new Error("Unsupported telemetry URL");
  }

  const timeout = AbortSignal.timeout(options.timeoutMs ?? 60_000);

  const signal = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout;
  
  const response = await fetch(target, {
    headers: { Accept: "application/json", "Accept-Encoding": "gzip" }, redirect: "error", signal,
  });

  if (!response.ok) {
    await response.body?.cancel();
    throw new Error(`Telemetry HTTP ${response.status}`);
  }

  if (!response.body) throw new Error("Empty telemetry response");
  
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  
  let bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > (options.maxBytes ?? 32 * 1024 * 1024)) throw new Error("Telemetry exceeds decompressed size limit");
      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
  const length = response.headers.get("content-length");
  const contentLength = length === null ? null : Number(length);
  return {
    text: Buffer.concat(chunks).toString("utf8"), bytes,
    encodedBytes: contentLength !== null && Number.isFinite(contentLength) && contentLength >= 0 ? contentLength : null,
    contentEncoding: response.headers.get("content-encoding"),
  };
}

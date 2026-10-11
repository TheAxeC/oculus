// Layer 1, data. How many calls one counter may make in a window of time: the limits of
// `apps.writes_per_min`, `apps.opens_per_min`, `apps.keys_per_s` and `apps.messages_per_min`,
// counted per frame or per host so one noisy app cannot spend another's. The page counts a frame's
// calls with it and the server a host's.
//
// The window slides: a call passes while fewer than `limit` calls passed in the `windowMs` before
// it. The limit is read at each call, so a changed setting applies to the next call without the
// frame being mounted again.

export type Limiter = {
    /** Count a call and answer whether it may pass. */
    take: () => boolean;
};

/** A limiter of `limit()` calls per `windowMs`, over a clock the caller supplies. */
export function createLimiter(
    limit: () => number,
    windowMs: number,
    now: () => number = Date.now
): Limiter {
    let times: number[] = [];
    return {
        take(): boolean {
            const at = now();
            times = times.filter((one) => at - one < windowMs);
            if (times.length >= limit()) return false;
            times.push(at);
            return true;
        }
    };
}

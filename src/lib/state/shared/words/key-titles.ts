// Layer 2, client state. The title of a config key path, as the Settings view heads an option's row
// and as the delete confirm of a record names a setting that refers to it: `slurm.poll_min` reads
// "Slurm: Poll min". It lives here, below every state folder, so state/system and state/forms both
// draw a key path with the one rule.

/** One word of a key path as a title: underscores read as spaces, the first letter capital. */
export function wordOf(segment: string): string {
    const spaced = segment.replaceAll('_', ' ');
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/**
 * The title of a key path: the segments before the last joined by ` > `, then `: `, then the last,
 * and a one-segment key its name alone.
 */
export function titleOf(path: string): string {
    const segments = path.split('.').map(wordOf);
    const last = segments.pop() ?? '';
    return segments.length === 0 ? last : `${segments.join(' > ')}: ${last}`;
}

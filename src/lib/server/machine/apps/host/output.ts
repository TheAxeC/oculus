// Layer 2, server. What a host has written to its standard error, kept bounded: the last
// `MAX_LINES` lines and at most `apps.host_output_kb` kilobytes of them, so a host that writes
// without end cannot grow the server's memory. A write that ends in the middle of a line is held
// until the line is finished, and `lines()` shows it as the last line meanwhile. The kilobyte limit
// is read at each write, so a changed setting applies to the next one. `taken()` counts every byte
// the output has taken, kept or since dropped, so it changes with every write and a reader of the
// lines knows when to read them again.

/** The most lines kept per host. */
const MAX_LINES = 1000;

/** The kept output of one host. */
export type HostOutput = {
    /** Take a chunk of text the host wrote. */
    write(chunk: string): void;
    /** Take a line the server itself adds, such as the way the host ended. */
    note(line: string): void;
    /** The kept lines, the oldest first, with an unfinished line last. */
    lines(): string[];
    /** The bytes taken since the output was made, the dropped ones included. */
    taken(): number;
};

/** A host's output over a limit in kilobytes. */
export function createOutput(limitKb: () => number): HostOutput {
    const kept: string[] = [];
    let bytes = 0;
    let open = '';
    let taken = 0;

    /** Drop the oldest lines until the kept ones and an unfinished line of `reserved` bytes fit. */
    function trim(reserved = 0): void {
        const limit = limitKb() * 1024;
        while (kept.length > 0 && (kept.length > MAX_LINES || bytes + reserved > limit)) {
            bytes -= Buffer.byteLength(kept.shift() ?? '', 'utf8') + 1;
        }
    }

    /** A line no longer than the limit: the end of a longer one, which is its newest part. */
    function fit(line: string): string {
        const limit = limitKb() * 1024 - 1;
        const raw = Buffer.from(line, 'utf8');
        return raw.length <= limit ? line : raw.subarray(raw.length - limit).toString('utf8');
    }

    function add(line: string): void {
        const text = fit(line);
        kept.push(text);
        bytes += Buffer.byteLength(text, 'utf8') + 1;
        trim();
    }

    return {
        write(chunk) {
            taken += Buffer.byteLength(chunk, 'utf8');
            const parts = (open + chunk).split('\n');
            open = parts.pop() ?? '';
            for (const line of parts) add(line.endsWith('\r') ? line.slice(0, -1) : line);
            if (Buffer.byteLength(open, 'utf8') >= limitKb() * 1024) {
                add(open);
                open = '';
            }
            trim(Buffer.byteLength(open, 'utf8'));
        },
        note(line) {
            taken += Buffer.byteLength(line, 'utf8') + 1;
            add(line);
        },
        lines: () => (open === '' ? [...kept] : [...kept, open]),
        taken: () => taken
    };
}

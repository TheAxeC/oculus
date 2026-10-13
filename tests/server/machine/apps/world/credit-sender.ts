// Layer 4, test helper. The sending end of a byte stream as the host's runner does it: chunks are
// sent while the credit the other end granted lasts, and each chunk is filled with one byte value
// that changes from chunk to chunk, so the digest of what was sent can be compared with the
// digest of what arrived.

import { createHash } from 'node:crypto';

/** What a test drives and reads of the sending end. */
export type CreditSender = {
    /** Send chunks until the total is sent or the credit is spent. */
    pump: () => void;
    /** Add credit the other end granted; `pump` then sends what it allows. */
    grant: (credit: number) => void;
    /** The bytes sent so far. */
    sentBytes: () => number;
    /** The SHA-256 of the bytes sent so far, in hex. */
    digest: () => string;
};

/**
 * A sender of `total` bytes in chunks of at most `chunk` bytes, starting with `credit` bytes of
 * credit. `send` is given each chunk after the sent count includes it.
 */
export function creditSender(options: {
    total: number;
    chunk: number;
    credit: number;
    send: (chunk: Buffer) => void;
}): CreditSender {
    const sent = createHash('sha256');
    let credit = options.credit;
    let sentBytes = 0;
    let step = 0;
    return {
        pump() {
            while (sentBytes < options.total && credit > 0) {
                const size = Math.min(options.chunk, options.total - sentBytes, credit);
                const chunk = Buffer.alloc(size, step % 251);
                step += 1;
                sent.update(chunk);
                credit -= size;
                sentBytes += size;
                options.send(chunk);
            }
        },
        grant(more) {
            credit += more;
        },
        sentBytes: () => sentBytes,
        digest: () => sent.copy().digest('hex')
    };
}

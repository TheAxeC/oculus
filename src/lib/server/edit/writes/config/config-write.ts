// Layer 2, server. The writes of the engine's own configuration files, as one dispatch: the deck,
// the audit's mute list, the rail, one option of a tracked config file, and the default workspace's
// folders. Each is a file of the reader's own, and anything about it can go wrong on this machine,
// so a writer that throws is told as `unwritable` and the file is left alone.
//
// The dispatch answers with the outcome and the kind the change log files it under, or with the
// refusal and its status, and leaves the logging and the response to the endpoint in writes.ts,
// which is the one place the change log is written.

import { auditMuteWrite, configKeyWrite, deckWrite, railWrite, rootsWrite } from '../bodies.ts';
import type { WriteOutcome, WriteTarget } from '../../writes.ts';
import { writeMute } from './audit-mute.ts';
import { writeConfigKey } from './config-key.ts';
import { writeDeck } from './deck.ts';
import { writeRail } from './rail.ts';
import { addRootTo, removeRootFrom } from './roots.ts';

/** A configuration write done, with the kind it is logged as, or the refusal and its status. */
export type ConfigAnswer =
    { kind: string; outcome: WriteOutcome } | { error: string; status: number };

/** What a writer answers with when it wrote: the outcome of a write but for the project found. */
type Written = Omit<WriteOutcome, 'found'>;

const UNWRITABLE: ConfigAnswer = { error: 'unwritable', status: 500 };

/** Run one writer: a throw is `unwritable`, a refusal carries its status, a success its kind. */
function settled(kind: string, run: () => Written | { error: string }): ConfigAnswer {
    let outcome: Written | { error: string };
    try {
        outcome = run();
    } catch {
        return UNWRITABLE;
    }
    if ('error' in outcome) {
        return { error: outcome.error, status: outcome.error === 'unwritable' ? 500 : 400 };
    }
    return { kind, outcome: { found: true, ...outcome } };
}

/** The answer to a body that is a write of a configuration file, or null for any other body. */
export function configWrite(body: unknown, into: WriteTarget): ConfigAnswer | null {
    const deck = deckWrite(body);
    if (deck !== null) {
        return settled('deck', () =>
            writeDeck(into.config, into.projects(), deck.selection, deck.order)
        );
    }
    const mute = auditMuteWrite(body);
    if (mute !== null) {
        return settled('audit-mute', () =>
            writeMute(into.behaviorFile, mute.signature, mute.muted)
        );
    }
    const rail = railWrite(body);
    if (rail !== null) {
        return settled('rail', () => writeRail(into.layoutFile, rail.rail, into.glyphs));
    }
    const setting = configKeyWrite(body);
    if (setting !== null) {
        return settled('config-key', () =>
            writeConfigKey(into.engine, setting.file, setting.key, setting.value)
        );
    }
    const roots = rootsWrite(body);
    if (roots !== null) {
        const sources = into.sources;
        if (sources === undefined) return UNWRITABLE;
        return settled('roots', () =>
            roots.action === 'add'
                ? addRootTo(sources.file, roots.dir, sources.held)
                : removeRootFrom(sources.file, roots.key)
        );
    }
    return null;
}

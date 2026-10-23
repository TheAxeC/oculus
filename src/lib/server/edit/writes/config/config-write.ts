// Layer 2, server. The writes of configuration files, as one dispatch: a deck group's slides, the
// audit's mute list, the rail, one option of oculus's defaults files, one setting an app declares,
// one list or family of one, the reset of one option, and the open workspace's folders. Each is a
// file of the reader's own (the workspace file, the primary hub's settings file, a deck), and
// anything about it can go wrong on this machine, so a writer that throws is told as `unwritable`
// and the file is left alone.
//
// The dispatch answers with the outcome and the kind the change log files it under, or with the
// refusal and its status, and leaves the logging and the response to the endpoint in writes.ts,
// which is the one place the change log is written.

import {
    appSettingWrite,
    auditMuteWrite,
    configKeyWrite,
    configResetWrite,
    configValueWrite,
    deckSlidesWrite,
    railWrite,
    rootsWrite
} from '../bodies.ts';
import type { WriteOutcome, WriteTarget } from '../../writes.ts';
import { writeMute } from './lists/audit-mute.ts';
import { writeAppSetting } from './app-setting.ts';
import { layersOf, machineHubs } from './config-place.ts';
import { writeConfigKey } from './config-key.ts';
import { resetConfig } from './config-reset.ts';
import type { SourceInputs } from './config-sources.ts';
import { writeConfigValue } from './config-value.ts';
import { writeDeckSlides } from './lists/deck/deck.ts';
import { writeRail } from './lists/rail.ts';
import { addFolder, orderFolders, removeFolder } from './lists/folders.ts';

/** A configuration write done, with the kind it is logged as, or the refusal and its status. */
export type ConfigAnswer =
    { kind: string; outcome: WriteOutcome } | { error: string; reason?: string; status: number };

/** What a writer answers with when it wrote: the outcome of a write but for the project found. */
type Written = Omit<WriteOutcome, 'found'>;

const UNWRITABLE: ConfigAnswer = { error: 'unwritable', status: 500 };

/** Run one writer: a throw is `unwritable`, a refusal carries its status, a success its kind. */
function settled(
    kind: string,
    run: () => Written | { error: string; reason?: string }
): ConfigAnswer {
    let outcome: Written | { error: string; reason?: string };
    try {
        outcome = run();
    } catch {
        return UNWRITABLE;
    }
    if ('error' in outcome) {
        return {
            error: outcome.error,
            ...(outcome.reason === undefined ? {} : { reason: outcome.reason }),
            status: outcome.error === 'unwritable' ? 500 : 400
        };
    }
    return { kind, outcome: { found: true, ...outcome } };
}

/** What the target holds that the lists of a choice, a multi or a suggestion are built from. */
function sourcesOf(into: WriteTarget): SourceInputs {
    return {
        hub: into.hub,
        primary: into.primary,
        projects: into.projects,
        entities: into.entities
    };
}

/** The answer to a body that is a write of a configuration file, or null for any other body. */
export function configWrite(body: unknown, into: WriteTarget): ConfigAnswer | null {
    const deck = deckSlidesWrite(body);
    if (deck !== null) return settled('deck-slides', () => writeDeckSlides(into, deck));
    const layers = layersOf(into);
    const mute = auditMuteWrite(body);
    if (mute !== null) {
        return settled('audit-mute', () =>
            writeMute(into.engine, layers, mute.signature, mute.muted, machineHubs(into))
        );
    }
    const rail = railWrite(body);
    if (rail !== null) {
        return settled('rail', () =>
            writeRail(into.engine, layers, rail.rail, into.glyphs, machineHubs(into))
        );
    }
    const stored = appSettingWrite(body);
    if (stored !== null) {
        return settled('app-setting', () =>
            writeAppSetting(into, stored.key, stored.value, into.apps?.held())
        );
    }
    const setting = configKeyWrite(body);
    if (setting !== null) {
        return settled('config-key', () =>
            writeConfigKey(
                into.engine,
                setting.file,
                setting.key,
                setting.value,
                layers,
                sourcesOf(into),
                machineHubs(into),
                setting.copy === true
            )
        );
    }
    const family = configValueWrite(body);
    if (family !== null) {
        return settled('config-value', () =>
            writeConfigValue(
                into.engine,
                family.file,
                family.key,
                family.value,
                family.base,
                layers,
                { inputs: sourcesOf(into), hubs: machineHubs(into), copy: family.copy === true }
            )
        );
    }
    const reset = configResetWrite(body);
    if (reset !== null) {
        return settled('config-reset', () =>
            resetConfig(into.engine, reset.file, reset.key, layers, machineHubs(into))
        );
    }
    const roots = rootsWrite(body);
    if (roots !== null) {
        const open = into.workspace;
        if (open === undefined) return UNWRITABLE;
        return settled('roots', () => {
            if (roots.action === 'add') return addFolder(open, roots.dir);
            if (roots.action === 'remove') return removeFolder(open, roots.key);
            return orderFolders(open, roots.keys);
        });
    }
    return null;
}

// Layer 2, server. The writes of configuration files, as one dispatch: a deck group's slides, the
// audit's mute list, the rail, one option of oculus's defaults files, one setting an app declares,
// one list or family of one, the reset of one option, and the open workspace's folders. Each is a
// file of the reader's own (the workspace file, a hub's settings file, a deck), and anything about
// it can go wrong on this machine, so a writer that throws is told as `unwritable` and the file is
// left alone.
//
// A Settings write of one option, of a list or family and a reset may name a hub (`root`), and a
// key of the hub list each hub's own file is read for (data/shapes/hub-keys.ts) is then written in
// that hub's `.oculus/config.yml`, its folders and the records its choices name checked as that
// hub's; a write that names none, or names the primary, writes the primary's. A name no hub of the
// workspace has (an empty one, one that holds path characters, a hub whose settings file is gone)
// is refused with the sentence that the workspace has no hub of that name, and a hub other than
// the primary named on a key read from the primary alone, or on an option of the workspace file, is
// refused with the sentence that says so; each refusal writes nothing and answers as the writers'
// own refusals do.
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
import { ofHub } from '../../../../data/helpers/hub-names.ts';
import { readPerHub } from '../../../../data/shapes/hub-keys.ts';
import { words } from '../../../core/words.ts';
import type { WriteOutcome, WriteTarget } from '../../writes.ts';
import { writeMute } from './lists/audit-mute.ts';
import { writeAppSetting } from './app-setting.ts';
import {
    layersOf,
    machineHubs,
    otherHubLayers,
    refusing,
    type ConfigKeyOutcome,
    type ConfigLayers
} from './config-place.ts';
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

/** Where a Settings write of one option lands: the layers, and the lists it is checked by. */
type Landing = { layers: ConfigLayers; inputs: SourceInputs };

/**
 * Where a Settings write of the option `key` of `file` that names the hub `root` lands, or the
 * refusal that writes nothing: the target's own layers for no root and for the primary's name,
 * else the layers of the hub named, its folder and its records standing for the primary's in the
 * lists, for a key of the hub list each hub's own file is read for.
 */
function landing(
    into: WriteTarget,
    file: string,
    key: string,
    root: string | undefined
): Landing | ConfigKeyOutcome {
    if (root === undefined || (into.primary !== null && root === into.primary)) {
        return { layers: layersOf(into), inputs: sourcesOf(into) };
    }
    const text = into.config.text;
    const refuse = refusing(file, key);
    const layers = otherHubLayers(into, root);
    if (layers === null) return refuse(words(text, 'server.workspace.no_hub_named', root));
    if (!readPerHub(file, key)) {
        return refuse(words(text, 'server.workspace.primary_only', key, root));
    }
    return {
        layers,
        inputs: {
            ...sourcesOf(into),
            hub: layers.hub ?? null,
            primary: root,
            projects: () => ofHub(into.projects(), root)
        }
    };
}

/** The answer of a Settings write of one option, run where `landing` places it. */
function landed(
    kind: string,
    place: Landing | ConfigKeyOutcome,
    run: (at: Landing) => Written
): ConfigAnswer {
    return settled(kind, () => ('layers' in place ? run(place) : place));
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
        const place = landing(into, setting.file, setting.key, setting.root);
        return landed('config-key', place, (at) =>
            writeConfigKey(
                into.engine,
                setting.file,
                setting.key,
                setting.value,
                at.layers,
                at.inputs,
                machineHubs(into),
                setting.copy === true
            )
        );
    }
    const family = configValueWrite(body);
    if (family !== null) {
        const place = landing(into, family.file, family.key, family.root);
        return landed('config-value', place, (at) =>
            writeConfigValue(
                into.engine,
                family.file,
                family.key,
                family.value,
                family.base,
                at.layers,
                { inputs: at.inputs, hubs: machineHubs(into), copy: family.copy === true }
            )
        );
    }
    const reset = configResetWrite(body);
    if (reset !== null) {
        const place = landing(into, reset.file, reset.key, reset.root);
        return landed('config-reset', place, (at) =>
            resetConfig(into.engine, reset.file, reset.key, at.layers, machineHubs(into))
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

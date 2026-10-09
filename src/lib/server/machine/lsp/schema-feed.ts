// Layer 2, server. The latest generated schemas and the reference index of the hub's keys, handed
// from the snapshot build to the language server relay. The portfolio watcher publishes both after
// each rebuild. The relay reads the current schemas when a server asks for one and the current
// index when the YAML entry answers a hub key. It is told when a set of schemas differs from the
// one before, so it asks its YAML servers for their settings again only then: an `editor.autosave`
// save writes a hub file after each pause in typing and each write rebuilds the snapshot, so a
// rebuild that changed no schema tells nothing, whatever the index holds, since the index is read
// at each question and no server is told of it.

import { NO_REFERENCES, type ReferenceIndex } from '../../../data/snapshot/references/model.ts';
import { emptySchemaSet, type SchemaSet } from '../../../data/snapshot/schema/set.ts';

export class SchemaFeed {
    #set: SchemaSet = emptySchemaSet();
    #text = JSON.stringify(this.#set);
    #index: ReferenceIndex = NO_REFERENCES;
    #listeners = new Set<() => void>();

    /** The set of the latest build. */
    current(): SchemaSet {
        return this.#set;
    }

    /** The index of the hub keys of the latest build. */
    references(): ReferenceIndex {
        return this.#index;
    }

    /**
     * Take the set and the index of a build; the listeners are told only when the set differs from
     * the last one.
     */
    publish(set: SchemaSet, references: ReferenceIndex = NO_REFERENCES): void {
        this.#index = references;
        const text = JSON.stringify(set);
        if (text === this.#text) return;
        this.#set = set;
        this.#text = text;
        for (const listener of [...this.#listeners]) listener();
    }

    /** Call `listener` whenever a published set differs from the one before; returns the undo. */
    subscribe(listener: () => void): () => void {
        this.#listeners.add(listener);
        return () => this.#listeners.delete(listener);
    }
}

// Layer 2, server. The latest generated schemas, handed from the snapshot build to the language
// server relay. The portfolio watcher publishes the set of each rebuild; the relay reads the
// current one when a server asks for a schema and is told when a set differs from the one before,
// so it asks its YAML servers for their settings again only then. An `editor.autosave` save writes
// a hub file after each pause in typing and each write rebuilds the snapshot, so a rebuild that
// changed no schema must tell nothing.

import { emptySchemaSet, type SchemaSet } from '../../../data/snapshot/schema/set.ts';

export class SchemaFeed {
    #set: SchemaSet = emptySchemaSet();
    #text = JSON.stringify(this.#set);
    #listeners = new Set<() => void>();

    /** The set of the latest build. */
    current(): SchemaSet {
        return this.#set;
    }

    /** Take the set of a build; the listeners are told only when it differs from the last one. */
    publish(set: SchemaSet): void {
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

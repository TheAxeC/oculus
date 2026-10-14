// Layer 1, data. The shapes of the reference index: where a hub key is named and where it is
// defined, in the positions of the Language Server Protocol.
//
// A key is a value the hub's files use as a name: a venue id, a person, a project id, a vocabulary
// word. The index holds, for every file it reads, the places that name a key (a reference, with the
// sources the field takes its keys from) and the places that define one (a definition, with the
// sources the key belongs to). Which reference names which definition is decided when a question is
// asked (lookup.ts), so the open texts of a page can replace the texts of the build without the
// build being redone.
//
// A position is a line and a character of it in UTF-16 units over the file's own line ends, with
// a leading byte order mark left out; a span is the text of the scalar inside its quotes.

/** A position of the protocol. */
export type Place = { line: number; character: number };

/** A range of the protocol. */
export type Span = { start: Place; end: Place };

/** How a scalar is written in its file, which decides how a new key is written in its place. */
export type KeyStyle = 'plain' | 'single' | 'double';

/**
 * A file of the index, named by the root it is served under (`hub` for the hub's files, `engine`
 * for oculus's own configuration) and its path inside that root.
 */
export type FileId = { root: string; path: string };

/** One scalar that stands for a key. `span` is inside the quotes; the quotes are one unit each. */
export type Mention = { span: Span; value: string; style: KeyStyle };

/** A place that names a key, and the sources its field takes keys from. */
export type Candidate = Mention & { sources: string[] };

/** A place that defines a key as a member of every one of the sources it names. */
export type Definition = Mention & { sources: string[] };

/**
 * How one kind of file is read. `spec` says where its fields stand (specs.ts); `defines` says what
 * its identity scalars define, and is empty for a file that defines nothing. `options` are the
 * fields of the file's own `schema:` whose option rows define the keys of a source.
 */
export type Reading = {
    spec: FieldNode | null;
    defines: Defines;
    options?: { field: string; source: string }[];
};

/** What a file defines. */
type Defines =
    | { kind: 'none' }
    /** A list of records under `list`, each with its key in `field` (a registry). */
    | { kind: 'registry'; source: string; list: string; field: string }
    /** The manifest of the project `id`, with its `id:` line. */
    | { kind: 'manifest'; id: string }
    /** The lists of vocab.yml that are sources, by the top-level key of each. */
    | { kind: 'vocab'; lists: string[] };

/**
 * Where the values that name keys stand inside a document. A `leaf` is a scalar or a list of
 * scalars; a `record` is a map of fields; `records` is a list of records or one record; a `family`
 * is an options family (a list of records with a key, or a map from the key to a record, a list of
 * records or a value); a `named` is a map from a name to one record, whose names are keys of the
 * sources in `keys` when it has them and no keys otherwise.
 */
export type FieldNode =
    | { kind: 'leaf'; sources: string[]; picked?: Picked }
    | { kind: 'record'; fields: Record<string, FieldNode> }
    | { kind: 'records'; record: FieldNode }
    | {
          kind: 'family';
          key?: FieldNode;
          record: FieldNode | null;
          value?: FieldNode;
          lists: boolean;
      }
    | { kind: 'named'; record: FieldNode | null; keys?: string[] };

/** The source another field of the record picks by its word. */
type Picked = { field: string; sources: Record<string, string> };

/** What a file gave: its places, or that its text did not read as YAML. */
export type FileScan = {
    file: FileId;
    reading: Reading;
    /** True when the text is a tab's own, which replaced the text the build read. */
    open?: true;
    /** True for a file of oculus's own configuration, which every hub's keys are matched with. */
    engine?: true;
    unparsed: boolean;
    references: Candidate[];
    definitions: Definition[];
};

/** A file of oculus's own configuration and the node that reads where it names a hub key. */
export type OptionFile = { path: string; spec: FieldNode };

/** Every file the index reads. */
export type ReferenceIndex = { files: readonly FileScan[] };

/** The index of a hub that has none yet. */
export const NO_REFERENCES: ReferenceIndex = Object.freeze({ files: [] });

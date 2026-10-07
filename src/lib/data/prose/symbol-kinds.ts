// Layer 1, data. The symbol kinds of the Language Server Protocol, by number (1 to 26), as the
// names the palette's `#` list words them by: `app.palette.symbol_<name>` in the catalog. A number
// outside the protocol's list is `symbol`.

/** The name of each kind, in the protocol's order from 1. */
const SYMBOL_KIND_NAMES = [
    'file',
    'module',
    'namespace',
    'package',
    'class',
    'method',
    'property',
    'field',
    'constructor',
    'enum',
    'interface',
    'function',
    'variable',
    'constant',
    'string',
    'number',
    'boolean',
    'array',
    'object',
    'key',
    'null',
    'enum_member',
    'struct',
    'event',
    'operator',
    'type_parameter'
] as const;

/** One of the names of a symbol kind, or `symbol` for a number the protocol does not list. */
export type SymbolKindName = (typeof SYMBOL_KIND_NAMES)[number] | 'symbol';

/** The name of a symbol kind number. */
export function symbolKindName(kind: number): SymbolKindName {
    return SYMBOL_KIND_NAMES[kind - 1] ?? 'symbol';
}

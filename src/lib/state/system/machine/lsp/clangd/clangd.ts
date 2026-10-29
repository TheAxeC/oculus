// Layer 2, client state, pure. What the Files view's AST and Memory Usage sections draw of
// clangd's two answers, as vscode-clangd draws them (its `src/ast.ts` and `src/memory-usage.ts`):
// the label of an AST node and the glyph it takes, and the rows of the memory tree.

/** A node of clangd's `textDocument/ast` answer. */
export type AstNode = {
    role: string;
    kind: string;
    detail?: string;
    arcana?: string;
    children?: AstNode[];
    range?: {
        start: { line: number; character: number };
        end: { line: number; character: number };
    };
};

/** The roles whose node is labelled by its kind alone. */
const KIND_ONLY: readonly string[] = ['expression', 'statement', 'declaration', 'template name'];

/** An AST node's label: the kind alone for four roles, else the kind then the role. */
export function describeNode(node: AstNode): string {
    return KIND_ONLY.includes(node.role) ? node.kind : `${node.kind} ${node.role}`;
}

/** The glyph a node of one kind is drawn with, by the kind. */
const KIND_GLYPHS: readonly { kind: string; glyph: string }[] = [
    { kind: 'Compound', glyph: 'ast_compound' },
    { kind: 'Recovery', glyph: 'ast_recovery' },
    { kind: 'TranslationUnit', glyph: 'ast_unit' },
    { kind: 'PackExpansion', glyph: 'ast_pack' },
    { kind: 'TemplateTypeParm', glyph: 'symbol_type_parameter' },
    { kind: 'TemplateTemplateParm', glyph: 'symbol_type_parameter' },
    { kind: 'TemplateParamObject', glyph: 'symbol_type_parameter' }
];

/** The glyph a node of one role is drawn with when its kind has none, by the role. */
const ROLE_GLYPHS: readonly { role: string; glyph: string }[] = [
    { role: 'type', glyph: 'ast_type' },
    { role: 'expression', glyph: 'ast_expression' },
    { role: 'specifier', glyph: 'ast_specifier' },
    { role: 'statement', glyph: 'symbol_event' },
    { role: 'declaration', glyph: 'symbol_function' },
    { role: 'template argument', glyph: 'symbol_type_parameter' }
];

/** The glyph an AST node is drawn with: its kind's when the kind has one, else its role's. */
export function astGlyph(node: AstNode): string {
    return (
        KIND_GLYPHS.find((one) => one.kind === node.kind)?.glyph ??
        ROLE_GLYPHS.find((one) => one.role === node.role)?.glyph ??
        'ast_expression'
    );
}

/** The tree clangd answers `$/memoryUsage` with: counters and one child per name. */
export type MemoryTree = { _self?: number; _total?: number; [name: string]: unknown };

/** One row of the memory tree. */
export type MemoryRow = {
    name: string;
    /** The node's `_total`, in bytes. */
    total: number;
    /** The total in megabytes, two decimals. */
    megabytes: string;
    /** The tooltip, `self=<n> total=<n>`. */
    detail: string;
    /** Whether the node is a file, drawn with the file glyph. */
    file: boolean;
    /** Whether the node starts collapsed: a file, or a node of six children or more. */
    collapsed: boolean;
    children: MemoryRow[];
};

/** The base name of a key: the part after the last `/`. */
function baseName(key: string): string {
    const slash = key.lastIndexOf('/');
    return slash < 0 ? key : key.slice(slash + 1);
}

/** The number a node holds under a name, zero for none. */
function counter(tree: MemoryTree, name: '_self' | '_total'): number {
    const value = tree[name];
    return typeof value === 'number' ? value : 0;
}

/** The rows of a memory tree: a row per key not starting with `_`, children by total falling. */
export function memoryRows(tree: MemoryTree): MemoryRow[] {
    return Object.entries(tree)
        .filter(
            ([key, value]) => !key.startsWith('_') && typeof value === 'object' && value !== null
        )
        .map(([key, value]) => memoryRow(key, value as MemoryTree))
        .sort((a, b) => b.total - a.total);
}

function memoryRow(key: string, node: MemoryTree): MemoryRow {
    const total = counter(node, '_total');
    const children = memoryRows(node);
    const file = key.includes('/');
    return {
        name: baseName(key),
        total,
        megabytes: (total / (1024 * 1024)).toFixed(2),
        detail: `self=${String(counter(node, '_self'))} total=${String(total)}`,
        file,
        collapsed: file || children.length >= 6,
        children
    };
}

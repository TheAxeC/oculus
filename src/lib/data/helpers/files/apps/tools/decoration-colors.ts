// Layer 1, data. The colours an app's file decoration may name, by the id VS Code gives them, and
// the custom property of oculus's theme each is drawn in. An id this table does not hold draws no
// colour, so a decoration of an unknown id still shows its badge and tooltip. The git extension's
// ids map to the same properties the Files view draws git's letters in.

/** The custom property each colour id stands for. */
const PROPERTIES: Readonly<Record<string, string>> = {
    'gitDecoration.addedResourceForeground': '--c-scm-added-txt',
    'gitDecoration.untrackedResourceForeground': '--c-scm-added-txt',
    'gitDecoration.modifiedResourceForeground': '--c-scm-modified-txt',
    'gitDecoration.renamedResourceForeground': '--c-scm-modified-txt',
    'gitDecoration.stageModifiedResourceForeground': '--c-scm-modified-txt',
    'gitDecoration.deletedResourceForeground': '--c-scm-deleted-txt',
    'gitDecoration.stageDeletedResourceForeground': '--c-scm-deleted-txt',
    'gitDecoration.conflictingResourceForeground': '--c-scm-conflict-txt',
    'gitDecoration.ignoredResourceForeground': '--muted-txt',
    'gitDecoration.submoduleResourceForeground': '--c-blue-txt',
    'charts.red': '--c-red-txt',
    'charts.blue': '--c-blue-txt',
    'charts.yellow': '--c-gold-txt',
    'charts.orange': '--c-orange-txt',
    'charts.green': '--c-green-txt',
    'charts.purple': '--c-purple-txt',
    'charts.foreground': '--ink',
    'charts.lines': '--muted-txt',
    'list.errorForeground': '--c-red-txt',
    'list.warningForeground': '--c-amber-txt',
    'list.deemphasizedForeground': '--muted-txt',
    'editorError.foreground': '--c-red-txt',
    'editorWarning.foreground': '--c-amber-txt',
    'editorInfo.foreground': '--c-blue-txt',
    'problemsErrorIcon.foreground': '--c-red-txt',
    'problemsWarningIcon.foreground': '--c-amber-txt',
    'problemsInfoIcon.foreground': '--c-blue-txt',
    'testing.iconPassed': '--c-green-txt',
    'testing.iconFailed': '--c-red-txt',
    'testing.iconErrored': '--c-red-txt',
    'testing.iconQueued': '--c-amber-txt',
    'terminal.ansiRed': '--c-red-txt',
    'terminal.ansiGreen': '--c-green-txt',
    'terminal.ansiYellow': '--c-gold-txt',
    'terminal.ansiBlue': '--c-blue-txt',
    'terminal.ansiMagenta': '--c-magenta-txt',
    'terminal.ansiCyan': '--c-cyan-txt'
};

/** The custom property a colour id is drawn in, or null for an id oculus has no colour for. */
export function decorationProperty(id: string): string | null {
    return Object.hasOwn(PROPERTIES, id) ? PROPERTIES[id] : null;
}

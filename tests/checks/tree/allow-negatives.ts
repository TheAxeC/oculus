// Layer 4, test data. The absences two test files assert with no reason beside them, each keyed on
// the literals its assertion names, or its own text where it names none.
//
// Every other file under tests/views and tests/browser carries a reason above each absence. The
// three here are the file browser's form specs and the ticker's button spec, which later steps hold
// open; an entry stands for one absence, so explaining one does not buy a new one, and a brand-new
// absence has no entry to stand under. An absence naming no literal long enough to key on stands
// under its own text, so two of them are told apart. An entry goes when its absence gains its
// reason, and the check says so.

export const NEGATIVES: Record<string, string[]> = {
    'browser/sources/files-forms.spec.ts': [
        'await expect(form).toHaveCount(0);',
        'await expect(form).toHaveCount(0);',
        'await expect(box).toHaveCount(0);',
        'await expect(name).toHaveCount(0);',
        '[data-form="add"]',
        'await expect(box).toHaveCount(0);',
        '[data-form]',
        'await expect(box).toHaveCount(0);',
        'await expect(box).toHaveCount(0);',
        'await expect(editing).toHaveCount(0);',
        '[data-form]',
        "await expect(mark('tool.py')).toHaveCount(0);",
        'await expect(editing).toHaveCount(0);',
        'alertdialog',
        'views.files',
        'await expect(editing).toHaveCount(0);',
        "await expect(mark('tool.py')).toHaveCount(0);",
        "await expect(mark('tool.py')).toHaveCount(0);",
        '[data-form="edit"]',
        "await expect(mark('tool.py')).toHaveCount(0);"
    ],
    'browser/boards/focus-buttons.spec.ts': [
        "expect(before).not.toContain('snooze:');",
        ').toHaveCount(0);',
        'expect(await page.evaluate(() => document.documentElement.dataset.pressed)).not.toContain('
    ],
    'browser/workbench/unsaved-forms.spec.ts': [
        'await expect(asked).toHaveCount(0);',
        '[data-form="add"]',
        '[data-form="add"]',
        'await expect(asked).toHaveCount(0);',
        'views.tasks',
        'views.tasks',
        'expect(left).not.toContain(id);',
        '${id}#forms',
        'await expect(asked).toHaveCount(0);',
        '[data-form="add"]',
        'alertdialog',
        'await expect(card).toHaveCount(0);',
        'await expect(asked).toHaveCount(0);',
        'await expect(asked).toHaveCount(0);',
        'views.editor',
        '[data-form="add"]',
        '${TYPED} and more',
        '[data-form="add"]',
        '[data-form="add"]',
        'await expect(asked).toHaveCount(0);',
        'views.files'
    ]
};

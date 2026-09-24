// The status bar's source items in Chrome, over files written into the served hub: the caret's line
// and column following the editor, go to line through the palette, the indentation and the line
// endings read from the file and rewritten from their menus (unsaved until Save, and then on disk),
// Tab inserting the indentation chosen, and the language list recolouring the tab and kept across a
// reload. Every file a case writes is taken away after it.

import { expect, test, type Page } from '@playwright/test';
import { readHubFile, removeFromHub, writeHubFile } from '../helpers/hub.ts';
import { SHOWN_VIEW } from '../helpers/rail.ts';
import { t } from '../helpers/words.ts';
import { bootOn, button, item, sourceTab } from './status.ts';

/** A Python file written with CRLF line endings and indented by tabs. */
const CRLF = 'status-crlf.py';
const CRLF_TEXT = 'def f():\r\n\tif True:\r\n\t\treturn 1\r\n\treturn 2\r\n';

/** A text file whose words a language would colour, which its own name paints as plain text. */
const PLAIN = 'status-plain.txt';
const PLAIN_TEXT = 'def f():\n    return None\n';

test.beforeEach(() => {
    writeHubFile(CRLF, CRLF_TEXT);
    writeHubFile(PLAIN, PLAIN_TEXT);
});

test.afterEach(() => {
    removeFromHub(CRLF);
    removeFromHub(PLAIN);
});

/** The editor's textarea on screen. */
function area(page: Page) {
    return page.locator(`${SHOWN_VIEW} [data-source-editor] textarea`);
}

/**
 * Put the keyboard in the editor with the caret at the start of the text: a focus alone leaves the
 * caret where the browser last put it, which is the end of a value set by script.
 */
async function atStart(page: Page): Promise<void> {
    await area(page).evaluate((node) => {
        if (!(node instanceof HTMLTextAreaElement)) return;
        node.focus();
        node.setSelectionRange(0, 0);
    });
}

/** Pick a choice of an item's menu, and of the list inside it when a second name is given. */
async function pick(page: Page, name: string, choice: string, inner?: string): Promise<void> {
    await button(page, name).click();
    await page.getByRole('menuitem', { name: choice, exact: true }).click();
    if (inner !== undefined) await page.getByRole('menuitem', { name: inner, exact: true }).click();
}

// revert: src/lib/views/sources/source/Source.svelte:126 => caret: editing ? START : null,
test("a source tab's items say its caret, indentation, encoding, line ending and language, and another tab draws none", async ({
    page
}) => {
    await bootOn(page, [
        sourceTab('crlf', 'hub', CRLF),
        { id: 'status', view: 'status', state: null }
    ]);
    await expect(button(page, 'caret')).toHaveText('Ln 1, Col 1');
    await expect(button(page, 'indent')).toHaveText('Tab Size: 4');
    await expect(button(page, 'encoding')).toHaveText('UTF-8');
    await expect(button(page, 'line_ending')).toHaveText('CRLF');
    await expect(button(page, 'language')).toHaveText('Python');

    await atStart(page);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('End');
    await expect(button(page, 'caret')).toHaveText('Ln 3, Col 11');
    await page.keyboard.press('Shift+ArrowLeft');
    await page.keyboard.press('Shift+ArrowLeft');
    await page.keyboard.press('Shift+ArrowLeft');
    await expect(button(page, 'caret')).toHaveText('Ln 3, Col 8 (3 selected)');

    await page.getByRole('tab', { name: t('views.status'), exact: true }).click();
    for (const name of ['caret', 'indent', 'encoding', 'line_ending', 'language']) {
        // The tab on screen is the Status view, which publishes no text to draw them from.
        await expect(item(page, name)).toHaveCount(0);
    }
    await page.getByRole('tab', { name: CRLF }).click();
    await expect(item(page, 'language')).toHaveCount(1);
});

// revert: src/lib/views/sources/source/Source.svelte:146 => delete
test('the caret item opens the palette on a colon, and a line number there moves the caret to it', async ({
    page
}) => {
    await bootOn(page, [
        sourceTab('crlf', 'hub', CRLF),
        { id: 'status', view: 'status', state: null }
    ]);
    await button(page, 'caret').click();
    const box = page.getByPlaceholder(t('app.palette.cmdk_placeholder'));
    await expect(box).toHaveValue(':');
    await expect(page.locator('[data-line-hint]')).toHaveText(
        t('statusbar.palette_line_hint', 1, 1, 5)
    );
    await box.fill(':4');
    await expect(page.getByRole('option')).toHaveCount(1);
    await expect(page.getByRole('option')).toContainText(t('statusbar.palette_line', 4));
    await box.press('Enter');
    // Enter chose the line, which closes the palette.
    await expect(box).toHaveCount(0);
    await expect(button(page, 'caret')).toHaveText('Ln 4, Col 1');
    await expect(area(page)).toBeFocused();
    const at = await area(page).evaluate((node) =>
        node instanceof HTMLTextAreaElement ? node.selectionStart : -1
    );
    expect(at).toBe('def f():\n\tif True:\n\t\treturn 1\n'.length);

    // With no source tab on screen the palette says there is no line to go to.
    await page.getByRole('tab', { name: t('views.status'), exact: true }).click();
    await page.keyboard.press('ControlOrMeta+k');
    await box.fill(':3');
    // With no source tab on screen there is no line to go to, so no row is offered.
    await expect(page.getByRole('option')).toHaveCount(0);
    await expect(page.getByText(t('statusbar.palette_line_none'))).toBeVisible();
});

// revert: src/lib/views/sources/source/Source.svelte:155 => delete
// revert: src/lib/views/sources/source/Source.svelte:159 => delete
test('converting the indentation and the line endings rewrites the text, unsaved until Save writes it', async ({
    page
}) => {
    await bootOn(page, [sourceTab('crlf', 'hub', CRLF)]);
    await expect(button(page, 'indent')).toHaveText('Tab Size: 4');
    await pick(page, 'indent', t('statusbar.indent_to_spaces'));
    await expect(area(page)).toHaveValue(
        'def f():\n    if True:\n        return 1\n    return 2\n'
    );
    await expect(button(page, 'indent')).toHaveText('Spaces: 4');
    await expect(button(page, 'unsaved')).toHaveAccessibleName(t('statusbar.unsaved_name', 1));
    // Nothing reaches the disk before Save.
    expect(readHubFile(CRLF)).toBe(CRLF_TEXT);

    await pick(page, 'line_ending', t('statusbar.line_ending_lf'));
    await expect(button(page, 'line_ending')).toHaveText('LF');
    await page
        .locator(SHOWN_VIEW)
        .getByRole('button', { name: t('editor.save'), exact: true })
        .click();
    await expect(button(page, 'unsaved')).toHaveAccessibleName(t('statusbar.unsaved_name', 0));
    expect(readHubFile(CRLF)).toBe('def f():\n    if True:\n        return 1\n    return 2\n');

    // And back: tabs, and CRLF, from the same menus.
    await pick(page, 'indent', t('statusbar.indent_to_tabs'));
    await pick(page, 'line_ending', t('statusbar.line_ending_crlf'));
    await expect(button(page, 'indent')).toHaveText('Tab Size: 4');
    await expect(button(page, 'line_ending')).toHaveText('CRLF');
    await page
        .locator(SHOWN_VIEW)
        .getByRole('button', { name: t('editor.save'), exact: true })
        .click();
    await expect(button(page, 'unsaved')).toHaveAccessibleName(t('statusbar.unsaved_name', 0));
    expect(readHubFile(CRLF)).toBe(CRLF_TEXT);
});

// revert: src/lib/views/sources/source/Source.svelte:194 => editSourceDraft(instance.id, value);
test('typing into a CRLF file keeps its line endings when it is saved', async ({ page }) => {
    await bootOn(page, [sourceTab('crlf', 'hub', CRLF)]);
    await atStart(page);
    await page.keyboard.press('End');
    await page.keyboard.type(' # typed');
    await page
        .locator(SHOWN_VIEW)
        .getByRole('button', { name: t('editor.save'), exact: true })
        .click();
    await expect(button(page, 'unsaved')).toHaveAccessibleName(t('statusbar.unsaved_name', 0));
    expect(readHubFile(CRLF)).toBe(CRLF_TEXT.replace('def f():', 'def f(): # typed'));
    await expect(button(page, 'line_ending')).toHaveText('CRLF');
});

// revert: src/lib/views/sources/source/Editor.svelte:203 => if (event.key !== 'Tab' || leave || event.key === 'Tab') return;
test('Tab inserts the indentation chosen from the bar, and Escape then Tab moves on', async ({
    page
}) => {
    await bootOn(page, [sourceTab('plain', 'hub', PLAIN)]);
    await expect(button(page, 'indent')).toHaveText('Spaces: 4');
    await pick(page, 'indent', t('statusbar.indent_using_spaces'), t('statusbar.indent_width', 2));
    await expect(button(page, 'indent')).toHaveText('Spaces: 2');
    await pick(page, 'indent', t('statusbar.indent_using_tabs'), t('statusbar.indent_width', 8));
    await expect(button(page, 'indent')).toHaveText('Tab Size: 8');
    await pick(page, 'indent', t('statusbar.indent_using_spaces'), t('statusbar.indent_width', 2));
    await atStart(page);
    await page.keyboard.press('Tab');
    await expect(area(page)).toHaveValue(`  ${PLAIN_TEXT}`);
    await expect(button(page, 'caret')).toHaveText('Ln 1, Col 3');
    await expect(area(page)).toBeFocused();
    await page.keyboard.press('Escape');
    await page.keyboard.press('Tab');
    await expect(area(page)).not.toBeFocused();
    await expect(area(page)).toHaveValue(`  ${PLAIN_TEXT}`);
});

// revert: src/lib/views/sources/source/Source.svelte:148 => delete
test('the language item lists every language, and a choice recolours the tab and is kept after a reload', async ({
    page
}) => {
    await bootOn(page, [sourceTab('plain', 'hub', PLAIN)]);
    const mirror = page.locator(`${SHOWN_VIEW} [data-source-editor] .mirror`);
    await expect(button(page, 'language')).toHaveText(t('statusbar.language_plaintext'));
    // The file name says plain text, which the highlighter paints with no keyword.
    await expect(mirror.locator('.hljs-keyword')).toHaveCount(0);

    await button(page, 'language').click();
    const box = page.getByPlaceholder(t('app.palette.cmdk_placeholder'));
    await expect(box).toHaveValue(':language ');
    await expect(page.locator('[data-language]')).toHaveCount(19);
    await expect(page.locator('[data-language]').first()).toHaveAttribute(
        'data-language',
        'plaintext'
    );
    await box.fill(':language pyth');
    await expect(page.locator('[data-language]')).toHaveCount(1);
    await box.press('Enter');
    // Enter chose the language, which closes the palette.
    await expect(box).toHaveCount(0);
    await expect(button(page, 'language')).toHaveText('Python');
    await expect(mirror.locator('.hljs-keyword').first()).toHaveText('def');

    await page.reload();
    await expect(button(page, 'language')).toHaveText('Python');
    await expect(
        page.locator(`${SHOWN_VIEW} [data-source-editor] .mirror .hljs-keyword`).first()
    ).toHaveText('def');
});

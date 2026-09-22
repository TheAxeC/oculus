// Pressing one control of a project card. views/shared/card/CardActions.svelte keeps a card's
// controls on one line and moves the ones that do not fit into a More menu, so whether a control is
// a button on the card or an item of that menu depends on the card's width and on how many controls
// come before it. A case that means to use a control, not to check where it is drawn, presses it
// through here.

import { expect, type Locator, type Page } from '@playwright/test';
import { t } from './words.ts';

/** Press the card control named `name`, from the card when it is drawn there, else from More. */
export async function pressCardAction(page: Page, card: Locator, name: string): Promise<void> {
    await card.hover();
    const strip = card.locator('[data-card-actions]');
    await expect(strip).toBeAttached();
    // The strip is measured after it is drawn, so the split between the card and More is read
    // only once two samples a quarter second apart agree.
    let last = '';
    await expect
        .poll(
            async () => {
                const now = JSON.stringify(
                    await strip.evaluate((node) => [
                        node.querySelectorAll('[data-action]').length,
                        node.querySelectorAll('[data-action-more]').length
                    ])
                );
                const still = now === last;
                last = now;
                return still;
            },
            { intervals: [250] }
        )
        .toBe(true);
    const button = card.getByRole('button', { name, exact: true });
    if ((await button.count()) > 0) {
        await button.click();
        return;
    }
    await card.getByRole('button', { name: t('project.card.more_actions') }).click();
    await page.getByRole('menuitem', { name, exact: true }).click();
}

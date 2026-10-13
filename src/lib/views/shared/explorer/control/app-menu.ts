// Layer 3, shared view helper. The entries apps contribute to a menu oculus draws, as a context
// menu takes them: the choices of the menu (`items`), appended to oculus's own items, and the run
// of the entry a pick stands for (`run`) with the arguments the caller gives, Alt running the
// entry's alternative command. The entries read at the last `items` are the ones a pick runs, so a
// menu that is read as it opens runs what it showed. A pick that is oculus's own is not run and
// `run` answers false.

import type { MenuItem } from '$lib/ui/menu/menu-items';
import type { ClientState } from '$lib/state/client/shapes/client-state';
import type { ContextParts } from '$lib/state/system/apps/shell/context';
import type { MenuOffer } from '$lib/state/system/apps/shell/contributions';

/** The prefix of the ids of the entries apps contribute, which tells them from oculus's. */
const APP_PICK = 'app';

/** The entries of one menu, read as it opens and run when a pick comes. */
export type AppMenu = {
    items: (menu: string, parts: ContextParts) => MenuItem[];
    run: (pick: string, args: unknown[], event: MouseEvent) => boolean;
};

export function appMenu(appShell: Pick<ClientState['appShell'], 'choices' | 'runEntry'>): AppMenu {
    let offers: readonly MenuOffer[] = [];
    return {
        items(menu, parts) {
            const shown = appShell.choices(menu, parts, APP_PICK);
            offers = shown.offers;
            return shown.items;
        },
        run(pick, args, event) {
            if (!pick.startsWith(`${APP_PICK}:`)) return false;
            void appShell.runEntry(offers, pick, args, event.altKey);
            return true;
        }
    };
}

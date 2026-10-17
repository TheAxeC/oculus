// Layer 3, primitive. The progress Monaco shows of a go to definition, a code action and a rename,
// handed to Monaco as its `editorProgressService` (load.ts). Monaco's standalone service shows
// nothing and awaits the operation's promise a second time in a call its callers do not await
// (goToCommands.js, codeActionModel.js, rename.js), while each caller awaits the same promise and
// handles its rejection itself; so a request a server refused (a rename refused at prepareRename,
// a code action or a definition answered with an error) reached the console as "Uncaught (in
// promise)" from `showWhile`. This service shows nothing either and ends quietly whatever the
// promise does, leaving the rejection to the caller that handles it.

/** The runner of a progress that shows nothing. */
const NO_RUNNER = { done: () => undefined, total: () => undefined, worked: () => undefined };

/** Monaco's editor progress, showing nothing and never rejecting. */
export const quietProgress = {
    show: (): typeof NO_RUNNER => NO_RUNNER,
    showWhile: (promise: Promise<unknown>): Promise<void> =>
        promise.then(
            () => undefined,
            () => undefined
        )
};

// Layer 2, server (the desktop host). The preload of every window and of the find bar's view. It is
// CommonJS because a sandboxed preload cannot be a module, and one file because a sandboxed preload
// can require nothing but Electron: the channel names below are the ones decide/channels.ts lists,
// and the type of the object is state/shared/stores/desktop.ts's. It exposes one object,
// `oculusDesktop`, to the page; the host answers a call only from the top frame of the server's
// page (decide/sender.ts), so the object is the whole of what the page can ask of the host. A save
// the host does not answer is a refusal that holds no envelope, so it writes nothing.
//
// The spell checker's facts come from here, since Electron emits no `context-menu` event for a
// right-click the page cancels, and oculus's text menu cancels it. The spell server of macOS can
// time out on the first lookup after a start, so one word is looked up as the preload loads.

'use strict';

const { contextBridge, ipcRenderer, webFrame } = require('electron');

/** @typedef {import('../lib/state/shared/stores/desktop.ts').DesktopBridge} DesktopBridge */

webFrame.isWordMisspelled('oculus');

/** @type {DesktopBridge} */
const bridge = {
    openFloatWindow: (id, bounds) => ipcRenderer.send('oculus:open-float-window', id, bounds),
    closeSelf: () => ipcRenderer.send('oculus:close-self'),
    focusMain: () => ipcRenderer.send('oculus:focus-main'),
    dropOutside: (drop) => ipcRenderer.invoke('oculus:drop-outside', drop),
    answerDrop: (request, taken) => ipcRenderer.send('oculus:drop-taken', request, taken),
    saveLayout: (next, from) => {
        const answer = ipcRenderer.sendSync('oculus:save-layout', next, from);
        return answer ?? { admitted: false, held: null };
    },
    showFind: () => ipcRenderer.send('oculus:show-find'),
    find: (query, options) => ipcRenderer.send('oculus:find', query, options),
    stopFind: () => ipcRenderer.send('oculus:stop-find'),
    closeFind: () => ipcRenderer.send('oculus:close-find'),
    printPdf: (address) => ipcRenderer.invoke('oculus:print-pdf', address),
    spelling: (word) =>
        Promise.resolve({
            misspelled: webFrame.isWordMisspelled(word),
            suggestions: webFrame.getWordSuggestions(word)
        }),
    on: (event, listener) => {
        const heard = (_event, name, payload) => {
            if (name === event) listener(payload);
        };
        ipcRenderer.on('oculus:event', heard);
        return () => ipcRenderer.off('oculus:event', heard);
    }
};

contextBridge.exposeInMainWorld('oculusDesktop', bridge);

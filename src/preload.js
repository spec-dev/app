const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    rpc: (...args) => ipcRenderer.invoke('rpc', ...args),
    newPool: (...args) => ipcRenderer.invoke('newPool', ...args),
    teardownPool: () => ipcRenderer.invoke('teardownPool'),
    subscribeToDatabase: (...args) => ipcRenderer.invoke('subscribeToDatabase', ...args),
    unsubscribeFromDatabase: () => ipcRenderer.invoke('unsubscribeFromDatabase'),
    query: (...args) => ipcRenderer.invoke('query', ...args),
    subscribeToPath: (...args) => ipcRenderer.invoke('subscribeToPath', ...args),
    createSpecClient: (...args) => ipcRenderer.invoke('createSpecClient', ...args),
    killSpecClient: () => ipcRenderer.invoke('killSpecClient'),
    on: (...args) => ipcRenderer.on(...args),
    off: (...args) => ipcRenderer.removeAllListeners(...args),
})
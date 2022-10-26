import api from './api'

export const liveObjects = {
    all: []
}

export async function loadAllLiveObjects() {
    const { data, ok } = await api.core.liveObjects()
    if (!ok) {
        // TODO: Show error
        return
    }
    liveObjects.all = data
}

export const getAllLiveObjects = () => liveObjects.all || []
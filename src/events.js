export const events = {
    PROJECT_UPDATED: 'project:updated',
    DB_STATUS_UPDATED: 'db:status:updated',
}

export function subscribe(eventName, cb) {
    return window.addEventListener(eventName, event => cb(event.detail || {}), false)
}

export function unsubscribe(eventName, listener){
    window.removeEventListener(eventName, listener, false)
}

export function emit(eventName, data) {
    window.dispatchEvent(new CustomEvent(eventName, { detail: data || {} }))
}
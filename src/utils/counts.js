export const tableCounts = {}

export function updateTableCountWithEvents(events, tablePath) {
    if (!tableCounts.hasOwnProperty(tablePath)) return
    const newCount = getNewCount(tableCounts[tablePath] || 0, events)
    tableCounts[tablePath] = newCount
}

export function getNewCount(currentCount, events) {
    let count = currentCount
    for (const event of events) {
        switch (event.operation) {
            case 'INSERT':
                count++
                break
            case 'DELETE':
                count--
                break
            default:
                break
        }
    }
    return count
}
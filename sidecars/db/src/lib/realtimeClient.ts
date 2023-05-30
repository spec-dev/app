import { Event, StringKeyMap, TableSub } from './types'
import config from './config'
import createSubscriber, { Subscriber } from 'pg-listen'
import debounce from './utils/debounce'

const defaultOpts = {
    user: config.DB_USER,
    password: config.DB_PASSWORD,
    host: config.DB_HOST,
    port: config.DB_PORT,
    database: config.DB_NAME,
    channel: config.CHANNEL,
    bufferInterval: config.BUFFER_INTERVAL,
    maxBufferSize: config.MAX_BUFFER_SIZE,
}

export default class RealtimeClient {
    onDataChange: Function

    options: StringKeyMap

    subscriber: Subscriber

    tableSubs: { [key: string]: TableSub } = {}

    get connectionConfig(): StringKeyMap {
        const { user, password, host, port, database } = this.options
        return { user, password, host, port, database }
    }

    get channel(): string {
        return this.options.channel!
    }

    constructor(onDataChange, options = {}) {
        this.onDataChange = onDataChange || (() => {})
        this.options = { ...defaultOpts, ...(options || {}) }
        this.subscriber = this._createSubscriber()
    }

    async listen() {
        try {
            await this.subscriber.connect()
            await this.subscriber.listenTo(this.channel)
        } catch (err) {
            console.error(`Realtime connection error: ${err}`)
        }
    }

    async close() {
        try {
            await this.subscriber.close()
        } catch (err) {
            console.error(`Realtime teardown error: ${err}`)
        }
    }

    _createSubscriber(): Subscriber {
        const subscriber = createSubscriber(this.connectionConfig)

        // Register error handler.
        subscriber.events.on('error', (err) => {
            console.error(`Realtime table event error: ${err}`)
        })

        // Register event handler.
        subscriber.notifications.on(this.channel, (event) => event && this._onEvent(event))

        return subscriber
    }

    _onEvent(event: Event) {
        // Strip quotes just in case.
        event.table = event.table.replace(/"/g, '')
        const { schema, table } = event
        const tablePath = [schema, table].join('.')

        // Get table sub this event belongs to.
        this.tableSubs[tablePath] = this.tableSubs[tablePath] || {
            schema,
            table,
            buffer: [],
            processEvents: debounce(
                () => this._processTableSubEvents(tablePath),
                config.BUFFER_INTERVAL
            ),
        }

        // Always add to buffer first.
        this.tableSubs[tablePath].buffer.push(event)

        // Immediately process events if buffer hits max capacity.
        if (this.tableSubs[tablePath].buffer.length >= config.MAX_BUFFER_SIZE) {
            this.tableSubs[tablePath].processEvents.flush()
            return
        }

        // Debounce.
        this.tableSubs[tablePath].processEvents()
    }

    _processTableSubEvents(tablePath: string) {
        // Get table sub for path.
        const tableSub = this.tableSubs[tablePath]
        if (!tableSub) return

        // Extract events from buffer / reset buffer.
        const events = [...tableSub.buffer]
        this.tableSubs[tablePath].buffer = []

        this.onDataChange({ events })
    }
}

import { Database, subscribeToDatabase } from '../tauri'
import { toPostgresUrl } from '../utils/formatters'
import logger from '../utils/logger'

export const dbConnectionStatus = {
    DISCONNECTED: 'disconnected',
    CONNECTING: 'connecting',
    INITIALIZING: 'initializing',
    SUBSCRIBING: 'subscribing',
    CONNECTED: 'connected',
    ERROR: 'error',
}

class DbManager {

    get url() {
        const params = this.connParams || {}
        return params ? toPostgresUrl(params) : null
    }

    constructor() {
        this.status = dbConnectionStatus.DISCONNECTED
        this.connParams = null
        this.conn = null
        this.unlisten = null
        this.onStatusUpdate = null
    }

    async connect(connParams, onDataChange) {
        if (this.status !== dbConnectionStatus.DISCONNECTED) {
            await this.teardown()
        }

        this.connParams = connParams
        if (!this.url) {
            logger.warn(`Won't connect to database - this.url came up empty`, this.connParams)
            return false
        }

        const steps = [
            () => this._connect(),
            () => this._initForSpec(),
            () => this._listen(onDataChange),
        ]

        for (const step of steps) {
            const success = await step()
            if (!success) {
                this._setStatus(dbConnectionStatus.ERROR)
                return
            }
        }

        this._setStatus(dbConnectionStatus.CONNECTED)
    }

    async teardown() {
        try {
            await this.conn?.close()
            this.unlisten && this.unlisten()
            this.unlisten = null
            this.connParams = null
            this.conn = null
            this._setStatus(dbConnectionStatus.DISCONNECTED)
        } catch (err) {
            logger.error(`Error tearing down current DB connection`, this.url, err)
        }
    }

    async _connect() {
        try {
            this._setStatus(dbConnectionStatus.CONNECTING)
            this.conn = await Database.load(this.url)
        } catch (err) {
            logger.error(`Failed to connect to DB ${this.url}`, err)
            return false
        }
        return true
    }

    async _initForSpec() {
        try {
            this._setStatus(dbConnectionStatus.INITIALIZING)
            // TODO
        } catch (err) {
            logger.error(
                `Error initializing database for usage with Spec`, 
                this.url, 
                err,
            )
            return false
        }
        return true
    }

    async _listen(cb) {
        try {
            this._setStatus(dbConnectionStatus.SUBSCRIBING)
            this.unlisten = await subscribeToDatabase(this.url, cb)
        } catch (err) {
            logger.error(
                `Error subscribing to database`, 
                this.url, 
                err,
            )
            return false
        }
        return true
    }

    _setStatus(status) {
        this.status = status
        this.onStatusUpdated && this.onStatusUpdated(status)
    }
}
export default DbManager
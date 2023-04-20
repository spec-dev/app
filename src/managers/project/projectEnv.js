import { getDatabaseConnection, newSpecClient } from '../../tauri'
import { toPostgresUrl } from '../../utils/formatters'
import logger from '../../utils/logger'
import { selectSpecUser, createSpecUser, selectSpecSchema, initDb, deleteSpecEventCursors } from '../../sql'
import { stringify } from '../../utils/json'
import { emit, events } from '../../events'
import short from 'short-uuid'
import constants from '../../constants'
import { areObjectsEquivalent } from '../../utils/hash'

export const dbConnectionStatus = {
    DISCONNECTED: 'disconnected',
    CONNECTING: 'connecting',
    INITIALIZING: 'initializing',
    SUBSCRIBING: 'subscribing',
    CONNECTED: 'connected',
    ERROR: 'error',
}

class ProjectEnv {

    get projectId() {
        return this.env?.id
    }

    get url() {
        const params = this.connParams
        return params ? toPostgresUrl(params) : null
    }

    get isConnected() {
        return this.status === dbConnectionStatus.CONNECTED
    }

    get connParams() {
        const { user, password, host, port, name } = this.env || {}
        return {
            user: user || constants.DEFAULT_DB_USER,
            password: password || constants.DEFAULT_DB_PASSWORD,
            host: host || constants.DEFAULT_DB_HOST,
            port: port || constants.DEFAULT_DB_PORT,
            name: name || constants.DEFAULT_DB_NAME,
        }
    }

    constructor(env, projectApiKey, projectConfigPath, onDataChange) {
        this.env = env
        this.projectApiKey = projectApiKey
        this.projectConfigPath = projectConfigPath
        this.status = dbConnectionStatus.DISCONNECTED
        this.db = null
        this.spec = null
        this.onDataChange = onDataChange
    }

    isEquivalent(env) {
        return areObjectsEquivalent(this.env, env)
    }

    async connect() {
        if (!this.url) {
            logger.warn(`Won't connect to database - this.url came up empty`, this.env)
            return false
        }

        const steps = [
            () => this._connectToDb(),
            () => this._initDbForSpec(),
        ]
        for (const step of steps) {
            if (!(await step())) {
                this._setStatus(dbConnectionStatus.ERROR)
                return
            }
        }

        await this._resetSpecEventCursors()
        await this._createSpecClient()

        this._setStatus(dbConnectionStatus.CONNECTED)
    }

    async query(sql) {
        const id = short.generate()
        return new Promise((res, _) => {
            window.addEventListener(id, event => res(event.detail || {}), { once: true })
            this.db.write(this._newQueryPayload(id, sql))
        })
    }

    async teardown() {
        try {
            this.db && await this.db.kill()
            this.db = null
            this.spec && await this.spec.kill()
            this.spec = null
            this._setStatus(dbConnectionStatus.DISCONNECTED)
        } catch (err) {
            logger.error(`Error tearing down current DB connection`, this.url, err)
        }
    }

    async _connectToDb() {
        try {
            this._setStatus(dbConnectionStatus.CONNECTING)
            this.db = await getDatabaseConnection(this.connParams, data => {
                data && this._onDbMessage(data)
            })
        } catch (err) {
            logger.error(`Failed to connect to DB ${this.url}`, err)
            return false
        }
        return true
    }

    async _initDbForSpec() {
        try {
            this._setStatus(dbConnectionStatus.INITIALIZING)
            await this._specUserExists() || await this._createSpecUser()
            await this._specSchemaExists() || await this._initDb()
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

    async _resetSpecEventCursors() {
        try {
            const { error } = await this.query(deleteSpecEventCursors)
            if (error) throw error
        } catch (err) {
            logger.error(
                `Error resetting Spec event cursors`,
                this.url,
                err,
            )
        }
    }

    async _createSpecClient() {
        logger.info(`Creating Spec client...`)
        try {
            this.spec = await newSpecClient(
                this.projectId,
                this.projectApiKey,
                this.projectConfigPath,
                this.connParams,
            )
        } catch (err) {
            logger.error(`Failed to create Spec client`, err)
        }
    }

    _onDbMessage(data) {
        // Query returned.
        if (data.id) {
            window.dispatchEvent(new CustomEvent(data.id, { detail: data }))
            return
        }
        // Table data changed.
        if (data.events) {
            this.onDataChange(data.events)
        }
    }

    async _specUserExists() {
        const { rows, error } = await this.query(selectSpecUser)
        if (error) throw error
        return !!rows?.length
    }

    async _createSpecUser() {
        logger.info(`Creating "spec" user (url=${this.url})...`)
        await this.query(createSpecUser('spec'))
    }

    async _specSchemaExists() {
        const { rows, error } = await this.query(selectSpecSchema)
        if (error) throw error
        return !!rows?.length
    }

    async _initDb() {
        logger.info(`Initializing database for Spec (url=${this.url})...`)
        await this.query(initDb)
    }

    _setStatus(status) {
        this.status = status
        logger.info(`[${this.url}] ${status}`)
        emit(events.DB_STATUS_UPDATED, { status })
    }
    
    _newQueryPayload(id, sql) {
        return stringify({ id, query: sql }) + '\n'
    }
}
export default ProjectEnv
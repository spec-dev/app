
import $ from 'jquery'
import humps from 'humps'
import Timer from './timer'
import { stringify } from './json'
import { createEventClient } from '@spec.dev/event-client'
import constants from '../constants'

class ApiClient {

    static methods = {
        GET: 'GET',
        POST: 'POST',
        PUT: 'PUT',
        PATCH: 'PATCH',
        DELETE: 'DELETE',
    }

    static successStatuses = new Set([200, 201])

    constructor( path = '/', convertToSnakeCase = true ) {
        this.path = path
        this.convertToSnakeCase = convertToSnakeCase
    }

    get = async ( ...args ) => await this.urlEncodedRequest( ApiClient.methods.GET, ...args )

    post = async ( ...args ) => await this.jsonRequest( ApiClient.methods.POST, ...args )

    put = async ( ...args ) => await this.jsonRequest( ApiClient.methods.PUT, ...args )

    patch = async ( ...args ) => await this.jsonRequest( ApiClient.methods.PATCH, ...args )

    del = async ( ...args ) => await this.jsonRequest( ApiClient.methods.DELETE, ...args )

    decamelizeKeys = params => (
        this.convertToSnakeCase ? humps.decamelizeKeys( params || {} ) : params || {}
    )

    camelizeKeys = data => (
        this.convertToSnakeCase ? humps.camelizeKeys( data || {} ) : data || {}
    )

    urlEncodedRequest = async ( method, path, params, minRespTime ) => await this.makeRequest(
        `${ path }?${ $.param( this.decamelizeKeys( params || {} ) ) }`,
        { method },
        minRespTime,
    )

    jsonRequest = async ( method, path, params, minRespTime ) => await this.makeRequest(
        path,
        {
            method,
            body: stringify( this.decamelizeKeys( params || {} ) ),
            headers: {
                'Content-Type': 'application/json',
            },
        },
        minRespTime,
    )

    makeRequest = async ( path, options, minRespTime ) => {
        const timer = minRespTime ? new Timer( minRespTime ) : null
        timer && timer.start()

        let resp
        try {
            resp = await fetch( this.path + path, options )
        } catch (err) {
            console.error(err)
        }

        return await this.handleResponse( resp, timer )
    }

    handleResponse = async ( resp, timer ) => {
        if (!resp) return {
            data: null,
            ok: false,
            status: null,
            headers: null,
            timer,
        }
        const { headers, status } = resp
        const ok = ApiClient.successStatuses.has(status)
        const data = this.camelizeKeys(await resp.json())
        return { data, ok, status, headers, timer }
    }
}

class CoreApiClient extends ApiClient {

    constructor() {
        super(constants.CORE_API_ORIGIN)
    }

    liveObjects = async () => await this.get('/live-objects')
}

class MetaApiClient extends ApiClient {

    constructor() {
        super('/meta', false)
    }

    tables = async params => await this.get('/tables', params)

    query = async payload => await this.post('/query', payload)

    liveColumns = async payload => await this.post('/live-columns', payload)

    createTable = async payload => await this.post('/table', payload)

    addColumns = async payload => await this.post('/columns', payload)

    config = async () => await this.get('/config')
}

class MetaSocketClient {

    static channels = {
        CONFIG_UPDATE: 'config:update',
        SEED_CHANGE: 'seed:change',
        TABLE_DATA_CHANGE: 'table-data:change',    
    }

    constructor() {
        this.onConfigUpdate = () => {}
        this.onSeedChange = () => {}
        this.onTableDataChange = () => {}
        // this.client = createEventClient({
        //     hostname: constants.META_API_HOSTNAME,
        //     port: constants.isLocal() ? constants.META_API_PORT : 54321,
        //     onConnect: () => this._subscribeToChannels(),
        // })
    }

    // _subscribeToChannels() {
    //     this.client.on(MetaSocketClient.channels.CONFIG_UPDATE, data => this.onConfigUpdate(data))
    //     this.client.on(MetaSocketClient.channels.SEED_CHANGE, data => this.onSeedChange(data))
    //     this.client.on(MetaSocketClient.channels.TABLE_DATA_CHANGE, data => this.onTableDataChange(data))
    // }
}

const api = {
    core: new CoreApiClient(),
    meta: new MetaApiClient(),
    metaSocket: new MetaSocketClient(),
}

export default api

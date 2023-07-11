
import $ from 'jquery'
import humps from 'humps'
import Timer from './timer'
import { stringify } from './json'
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
        `${ path }?${ $.param( params || {} ) }`,
        { method },
        minRespTime,
    )

    jsonRequest = async ( method, path, params, minRespTime ) => await this.makeRequest(
        path,
        {
            method,
            body: stringify( params || {} ),
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

    searchLiveObjects = async (params) => await this.post('/live-objects/search', params)
}

const api = {
    core: new CoreApiClient(),
}

export default api
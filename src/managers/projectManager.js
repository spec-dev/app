import { getProjects, getState, getProjectConfig, getProjectEnvs, subscribeToFile, path } from '../tauri'
import constants from '../constants'
import DbManager from './dbManager'
import logger from '../utils/logger'
import ClientManager from './clientManager'

class ProjectManager {

    get currentProjectEnv() {
        const local = this.currentProject.envs?.local
        return local ? { id: this.currentProject.id, env: 'local', ...local } : null
    }

    get currentDatabaseConnectionParams() {
        const env = this.currentProjectEnv || {}
        const { user, password, host, port, name } = env
        return {
            user: user || constants.DEFAULT_DB_USER,
            password: password || constants.DEFAULT_DB_PASSWORD,
            host: host || constants.DEFAULT_DB_HOST,
            port: port || constants.DEFAULT_DB_PORT,
            name: name || constants.DEFAULT_DB_NAME,
        }
    }

    constructor() {
        this.state = {}
        this.projects = {}
        this.currentProject = {}
        this.unsubscribeFromProject = null
        this.initialized = false
        this.onUpdate = null
        this.onDataChange = null
        this.loadProjectsPromise = getProjects()
        this.loadStatePromise = getState()
        this.dbManager = new DbManager()
        this.clientManager = new ClientManager()
    }

    async init(onUpdate) {
        this.onUpdate = onUpdate

        // Load all projects and the current state from global config files.
        const [projects, state] = await Promise.all([
            this.loadProjectsPromise, 
            this.loadStatePromise,
        ])
        this.projects = projects || {}
        this.state = state || {}

        // Use projects and state to find & set the "current" project.
        this.currentProject = this._getCurrentProjectFromState()

        // Subscribe to changes in the global config files.
        const promises = [this._watchGlobalConfigFiles()]

        // Load the config and envs for the current project.
        this.currentProject.location && promises.push(this._handleCurrentProjectChanged())
        await Promise.all(promises)

        this.initialized = true
    }

    async connectToDatabase() {
        if (!this.currentProjectEnv) {
            logger.warn(`No current project environment selected.`)
            return
        }
        await this.dbManager.connect(
            this.currentDatabaseConnectionParams,
            event => this._onDataChange(event),
        )
    }

    _onDataChange(event) {
        this.onDataChange && this.onDataChange(event)
    }

    async _watchGlobalConfigFiles() {
        await Promise.all([
            subscribeToFile(await constants.globalStatePath(), false, () => {
                this._onStateFileChange()
            }),
            subscribeToFile(await constants.globalProjectsPath(), false, () => {
                this._onProjectsFileChange()
            })
        ])
    }

    async _onStateFileChange() {
        const newState = await getState()
        const didSwitchProjects = newState.projectId !== this.state.projectId
        this.state = newState
        
        if (didSwitchProjects) {
            this.currentProject = this._getCurrentProjectFromState()
            this.currentProject.location && await this._handleCurrentProjectChanged()
        }
    }

    async _onProjectsFileChange() {
        this.projects = await getProjects()
    }

    async _handleCurrentProjectChanged() {
        // Get current project's config files and subscribe to their changes.
        const [_, __, unsubscribe] = await Promise.all([
            this._loadCurrentProjectConfig(),
            this._loadCurrentProjectEnvs(),
            this._watchCurrentProject(),
        ])

        // Unsubscribe from previous subscription, and replace with new one.
        this.unsubscribeFromProject && this.unsubscribeFromProject()
        this.unsubscribeFromProject = unsubscribe
        
        // Broadcast change upstream.
        this.onUpdate && this.onUpdate()
    }

    async _loadCurrentProjectConfig() {
        this.currentProject.config = await getProjectConfig(this.currentProject.location)
    }

    async _loadCurrentProjectEnvs() {
        this.currentProject.envs = await getProjectEnvs(this.currentProject.location)
    }

    async _watchCurrentProject() {
        return subscribeToFile(
            await this._getCurrentProjectDirectory(), 
            true, // recursive
            events => this._handleProjectFilesChanged(events),
        )
    }

    async _handleProjectFilesChanged(events) {
        const eventsToProcess = events.filter(e => e.kind !== 'AnyContinuous')
        if (!eventsToProcess.length) return

        const filePathsChanged = new Set((events || []).map(e => e.path))
        const [projectConfigFilePath, projectEnvsFilePath] = await Promise.all([
            this._getCurrentProjectConfigFilePath(),
            this._getCurrentProjectEnvsFilePath(),
        ])

        const promises = []
        if (filePathsChanged.has(projectConfigFilePath)) {
            promises.push(this._loadCurrentProjectConfig())
        }
        if (filePathsChanged.has(projectEnvsFilePath)) {
            promises.push(this._loadCurrentProjectEnvs())
        }
        await Promise.all(promises)

        this.onUpdate && this.onUpdate()
    }

    async _getCurrentProjectDirectory() {
        return path.join(
            this.currentProject.location,
            constants.SPEC_CONFIG_DIR_NAME,
        )
    }

    async _getCurrentProjectConfigFilePath() {
        return path.join(
            this.currentProject.location, 
            constants.SPEC_CONFIG_DIR_NAME,
            constants.PROJECT_CONFIG_FILE_NAME,
        )
    }
    
    async _getCurrentProjectEnvsFilePath() {
        return path.join(
            this.currentProject.location, 
            constants.SPEC_CONFIG_DIR_NAME,
            constants.CONNECTION_CONFIG_FILE_NAME,
        )
    }
    
    _getCurrentProjectFromState() {
        const currentProjectId = this.state.projectId
        if (!currentProjectId) return {}
        for (const key in this.projects) {
            const entry = this.projects[key] || {}
            if (entry.id === currentProjectId) {
                const [org, name] = key.split('/')
                return { org, name, ...entry }
            }
        }
        return {}
    }
}

const projectManager = new ProjectManager()
export default projectManager
import constants from '../../constants'
import ProjectEnv from './projectEnv'
import logger from '../../utils/logger'
import { emit, events } from '../../events'
import { 
    getProjects, 
    getState, 
    getProjectApiKey,
    getProjectConfig,
    getProjectEnvs,
    subscribeToFile,
    path,
} from '../../tauri'

class ProjectManager {

    constructor() {
        this.state = {}
        this.projects = {}
        this.currentProject = {}
        this.currentProjectEnv = null
        this.unsubscribeFromProjectFileChanges = null
        this.initialized = false
        this.onDataChange = null
        this.loadProjectsPromise = getProjects()
        this.loadStatePromise = getState()
    }

    async init() {
        logger.info(`Initializing project manager...`)

        // Load all projects and the current state from global config files.
        const [projects, state] = await Promise.all([
            this.loadProjectsPromise, 
            this.loadStatePromise,
        ])
        this.projects = projects || {}
        this.state = state || {}
        this.initialized = true

        // Use projects and state to find & set the "current" project.
        this.currentProject = this._getCurrentProjectFromState()

        // Subscribe to changes in the global config files.
        await this._watchGlobalConfigFiles()

        // Load the config and envs for the current project.
        this.currentProject.location && await this._onCurrentProjectChanged()
    }

    async connect() {
        if (!this.currentProject.apiKey) {
            logger.error(
                `Can't connect to project ${this.state.projectId} without api key.`
            )
            return
        }

        const newProjectEnv = this._getCurrentProjectEnv()
        logger.info(`Connecting to project env "${newProjectEnv?.env}"...`)

        if (this.currentProjectEnv) {
            if (this.currentProjectEnv.isEquivalent(newProjectEnv)) {
                return
            }
            logger.info(`Tearing down previous env...`)
            await this.currentProjectEnv.teardown()
            this.currentProjectEnv = null
        }

        if (!newProjectEnv) {
            logger.warn(`No current project environment selected.`)
            return
        }

        this.currentProjectEnv = new ProjectEnv(
            newProjectEnv, 
            this.currentProject.apiKey,
            await this._getCurrentProjectDirectory(),
            events => this.onDataChange && this.onDataChange(events),
        )
        await this.currentProjectEnv.connect()
    }

    async query(sql) {
        const projectEnv = this.currentProjectEnv
        if (!projectEnv?.db || !projectEnv?.isConnected) {
            return { error: `DB client not accepting queries (status=${projectEnv?.status})` }
        }
        return projectEnv.query(sql)
    }

    getCurrentProject() {
        return {
            ...this.currentProject,
            env: this._getCurrentProjectEnv()?.env,
        }
    }

    ensureCurrentProjectLocationSet() {
        if (!this.currentProject.location) {
            throw `Current project has no location set.`
        }
    }

    async _watchGlobalConfigFiles() {
        await Promise.all([
            subscribeToFile(await constants.globalStatePath(), false, () => {
                this._onStateFileChanged()
            }),
            subscribeToFile(await constants.globalProjectsPath(), false, () => {
                this._onProjectsFileChanged()
            })
        ])
    }

    async _onStateFileChanged() {
        const newState = await getState()
        const prevProjectId = this.state.projectId
        const prevEnv = this.state.projectEnv
        const didSwitchProjects = newState.projectId !== prevProjectId
        const didSwitchEnvs = newState.projectEnv !== prevEnv
        this.state = newState
        
        if (didSwitchProjects) {
            logger.info(`Project change detected (${prevProjectId} -> ${newState.projectId}).`)
            this.currentProject = this._getCurrentProjectFromState()
            this.currentProject.location && await this._onCurrentProjectChanged()
        } else if (didSwitchEnvs) {
            logger.info(`Env change detected (${prevEnv} -> ${newState.projectEnv}).`)
            await this._onProjectEnvChanged()
        }
    }

    async _onProjectEnvChanged() {
        await this._loadCurrentProjectEnvs()
        await this.connect()
        this._onProjectUpdated()
    }

    async _onProjectsFileChanged() {
        this.projects = await getProjects()
    }

    async _onCurrentProjectChanged() {
        // Unsubscribe from previous project subscription.
        this.unsubscribeFromProjectFileChanges && this.unsubscribeFromProjectFileChanges()

        // Pull project config files and subscribe to their changes.
        const [_, __, ___, unsubscribe] = await Promise.all([
            this._loadCurrentProjectCreds(),
            this._loadCurrentProjectConfig(),
            this._loadCurrentProjectEnvs(),
            this._watchCurrentProjectFiles(),
        ])
        this.unsubscribeFromProjectFileChanges = unsubscribe

        await this.connect()
        this._onProjectUpdated()
    }

    async _loadCurrentProjectCreds() {
        this.currentProject.apiKey = await getProjectApiKey(this.state.projectId)
    }

    async _loadCurrentProjectConfig() {
        this.currentProject.config = await getProjectConfig(this.currentProject.location)
    }

    async _loadCurrentProjectEnvs() {
        this.currentProject.envs = await getProjectEnvs(this.currentProject.location)
    }

    async _watchCurrentProjectFiles() {
        return subscribeToFile(
            await this._getCurrentProjectDirectory(), 
            true, // recursive (i.e. subscribe to all files in folder)
            fileEvents => this._onProjectFilesChanged(fileEvents),
        )
    }

    async _onProjectFilesChanged(fileEvents) {
        const eventsToProcess = fileEvents.filter(e => e.kind !== 'AnyContinuous')
        if (!eventsToProcess.length) return

        const filePathsChanged = new Set((fileEvents || []).map(e => e.path))
        const [projectConfigFilePath, projectEnvsFilePath] = await Promise.all([
            this._getCurrentProjectConfigFilePath(),
            this._getCurrentProjectEnvsFilePath(),
        ])

        if (filePathsChanged.has(projectConfigFilePath)) {
            await this._loadCurrentProjectConfig()
        }

        if (filePathsChanged.has(projectEnvsFilePath)) {
            await this._onProjectEnvChanged()
            return
        }

        this._onProjectUpdated()
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

    _getCurrentProjectEnv() {
        const currentEnvName = this.state.projectEnv
        if (!currentEnvName) return null
        const currentEnv = (this.currentProject.envs || {})[currentEnvName]
        return currentEnv 
            ? { id: this.currentProject.id, env: currentEnvName, ...currentEnv } 
            : null
    }

    _onProjectUpdated() {
        emit(events.PROJECT_UPDATED)
    }
}

const projectManager = new ProjectManager()
export default projectManager
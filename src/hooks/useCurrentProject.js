import { useEffect, useState } from 'react'
import projectManager from '../managers/projectManager'

function useCurrentProject() {
    const [project, setProject] = useState(null)

    useEffect(async () => {
        if (project === null && !projectManager.initialized) {
            await projectManager.init(() => {
                const project = projectManager.currentProject || {}
                project.currentEnv = projectManager.currentProjectEnv
                setProject(project)
            })
        }
    }, [project])

    return project
}

export default useCurrentProject
import { useEffect, useState } from 'react'
import pm from '../managers/project/projectManager'
import { subscribe, events } from '../events'

function useCurrentProject() {
    const [project, setProject] = useState(null)

    useEffect(async () => {
        // Initialize the global project manager only once.
        if (project === null && !pm.initialized) {
            subscribe(events.PROJECT_UPDATED, () => {
                setProject(pm.getCurrentProject())
            })
            await pm.init()
        }
    }, [project])

    return project
}

export default useCurrentProject
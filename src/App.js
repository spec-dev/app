import { Redirect, Route, Switch } from 'react-router'
import { paths } from './utils/nav'
import DashboardPage from './components/dashboard/DashboardPage'
import { getCurrentProject } from './utils/cache'
import { useEffect } from 'react'

const routes = [{
    path: paths.DASHBOARD,
    component: DashboardPage,
}]

function App() {
    const currentProject = getCurrentProject()
    const fallbackPath = paths.toTables(currentProject?.id || '')

    useEffect(() => {
        if (currentProject?.name) {
            document.title = `${currentProject.name} | Spec`
        }
    }, [currentProject?.id])

    return (
        <div id='app'>
            <Switch>
                { routes.map((props, i) => <Route key={i} {...props}/> )}
                <Redirect to={fallbackPath} />
            </Switch>
        </div>
    )
}

export default App
import { Redirect, Route, Switch } from 'react-router'
import { paths } from './utils/nav'
import DashboardPage from './components/dashboard/DashboardPage'
import { getCurrentProject } from './utils/cache'

const routes = [{
    path: paths.DASHBOARD,
    component: DashboardPage,
}]

function App() {
    const currentProjectId = getCurrentProject()?.id
    const fallbackPath = paths.toTables(currentProjectId || '')

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
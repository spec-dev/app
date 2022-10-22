import { Redirect, Route, Switch } from 'react-router'
import { paths, sections } from './utils/nav'
import DashboardPage from './components/dashboard/DashboardPage'

const defaultRoutes = [
    {
        path: paths.DASHBOARD,
        component: DashboardPage,
    },
]

const buildRouteSpec = () => ({
    routes: defaultRoutes,
    fallback: '/project/abc/tables',
})

function App() {
    const { routes, fallback } = buildRouteSpec()

    return (
        <div id='app'>
            <Switch>
                { routes.map((props, i) => <Route key={i} {...props}/> )}
                <Redirect to={fallback} />
            </Switch>
        </div>
    )
}

export default App

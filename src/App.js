import { Redirect, Route, Switch } from 'react-router'
import { paths } from './utils/nav'
import DashboardPage from './components/dashboard/DashboardPage'

const routes = [
    {
        path: paths.DASHBOARD,
        component: DashboardPage,
    },
]

function App() {
    return (
        <div id='app'>
            <Switch>
                { routes.map((props, i) => <Route key={i} {...props}/> )}
                <Redirect to={paths.tables} />
            </Switch>
        </div>
    )
}

export default App
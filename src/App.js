import React, { useEffect, useState } from 'react'
import { Redirect, Route, Switch } from 'react-router'
import { paths } from './utils/nav'
import DashboardPage from './components/dashboard/DashboardPage'
import SidecarErrorToastContainer from './components/shared/popups/SidecarErrorToastContainer'
import Login from './components/auth/Login'
import { getAuthedUser } from './electronClient'

const routes = [
    {
        path: paths.DASHBOARD,
        component: DashboardPage,
    },
]

function App() {
    const [authed, setAuthed] = useState(null)

    useEffect(() => {
        if (authed === null) {
            ;(async () => {
                const user = await getAuthedUser()
                setAuthed(!!user?.email)
            })()
        }
    }, [authed])

    // Determing...
    if (authed === null) {
        return <div id='app'></div>
    }

    // Unauthed.
    if (!authed) {
        return (
            <div id='app'>
                <Login onSuccess={() => setAuthed(true)}/>
            </div>
        )
    }

    // Authed.
    return (
        <div id='app'>
            <Switch>
                { routes.map((props, i) => <Route key={i} {...props}/> )}
                <Redirect to={paths.tables} />
            </Switch>
            <SidecarErrorToastContainer/>
        </div>
    )
}

export default App
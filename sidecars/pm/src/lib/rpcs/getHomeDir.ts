import os from 'os'

function getHomeDir(): string {
    return os.homedir()
}

export default getHomeDir

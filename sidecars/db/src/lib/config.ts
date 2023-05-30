import { ev } from './utils/env'

const config = {
    DB_USER: ev('DB_USER', ''),
    DB_PASSWORD: ev('DB_PASSWORD', ''),
    DB_HOST: ev('DB_HOST', 'localhost'),
    DB_PORT: Number(ev('DB_PORT', 5432)),
    DB_NAME: ev('DB_NAME', ''),
    CHANNEL: ev('CHANNEL', 'spec_data_change'),
    BUFFER_INTERVAL: 10,
    MAX_BUFFER_SIZE: 1000,
}

export default config

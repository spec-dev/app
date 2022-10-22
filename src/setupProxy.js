const proxy = require('http-proxy-middleware')

const targets = {
    CORE_API_URL: process.env.REACT_APP_CORE_API_URL || 'https://api.spec.dev',
    REALTIME_URL: process.env.REACT_APP_REALTIME_URL || 'ws://localhost:54322',
    META_API_URL: process.env.REACT_APP_META_API_URL || 'http://localhost:54323',
}

module.exports = function(app) {
    // Core API proxy.
    app.use(proxy(
        '/core',
        {
            target: targets.CORE_API_URL,
            changeOrigin: true,
            pathRewrite: {
                '^/core': '/',
            },
        }
    ))
    // Meta API proxy.
    app.use(proxy(
        '/meta',
        {
            target: targets.META_API_URL,
            changeOrigin: true,
            pathRewrite: {
                '^/meta': '/',
            },
        }
    ))
    // Realtime proxy.
    app.use(proxy(
        '/realtime',
        {
            target: targets.REALTIME_URL,
            changeOrigin: true,
            pathRewrite: {
                '^/realtime': '/',
            },
            ws: true,
        }
    ))
}
const proxy = require('http-proxy-middleware')

const targets = {
    CORE_API_URL: process.env.REACT_APP_CORE_API_URL || 'https://api.spec.dev',
    META_API_URL: process.env.REACT_APP_META_API_URL || 'http://localhost:54322',
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
}
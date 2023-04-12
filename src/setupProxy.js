const proxy = require('http-proxy-middleware')

const targets = {
    META_API_URL: process.env.REACT_APP_META_API_URL || 'http://localhost:54322',
}

module.exports = function(app) {    
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
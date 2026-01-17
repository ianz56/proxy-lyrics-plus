const cors_proxy = require('cors-anywhere');
const http = require('http');
const url = require('url');

const host = process.env.HOST || '0.0.0.0';
const port = process.env.PORT || 8080;

const ALLOWED_DOMAINS = [
    'apic-desktop.musixmatch.com',
    'lrclib.net',
    'music.xianqiao.wang',
    'music.163.com',
    'raw.githubusercontent.com',
    'github.com',
    'genius.com',
    // Apple Music domains for lyrics fetching
    'music.apple.com',
    'beta.music.apple.com',
    'amp-api.music.apple.com',
    'amp-api-edge.music.apple.com'
];

const proxy = cors_proxy.createServer({
    originWhitelist: [],
    requireHeader: [],
    // RESTORED: Remove cookies as they might strictly cause issues with Musixmatch
    // removeHeaders: ['cookie', 'cookie2'],
    httpProxyOptions: {
        secure: false
    },
    setHeaders: {
        'cache-control': 'no-cache, no-store, must-revalidate',
        'pragma': 'no-cache',
        'expires': '0'
    }
});

http.createServer((req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    let target = req.url.substring(1);

    if (req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Lyrics Plus Proxy running.\n\nAllowed Domains:\n' + ALLOWED_DOMAINS.join('\n'));
        return;
    }

    if (req.url === '/favicon.ico') {
        res.writeHead(404);
        res.end();
        return;
    }

    try {
        const parsed = url.parse(target);
        const hostname = parsed.hostname;

        if (!hostname) {
            console.log(`[INVALID] ${target}`);
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('Invalid URL');
            return;
        }

        const isAllowed = ALLOWED_DOMAINS.some(domain =>
            hostname === domain || hostname.endsWith('.' + domain)
        );

        if (!isAllowed) {
            console.log(`[BLOCKED] ${hostname}`);
            res.writeHead(403, { 'Content-Type': 'text/plain' });
            res.end('Forbidden: Domain not allowed');
            return;
        }

        console.log(`[PROXY] ${target}`);

        // Special handling for Musixmatch
        if (hostname.includes('musixmatch.com')) {
            req.headers['origin'] = 'https://apic-desktop.musixmatch.com';
            req.headers['referer'] = 'https://apic-desktop.musixmatch.com/';
            req.headers['cookie'] = 'x-mxm-token-guid=';
            req.headers['user-agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
        }

        // Special handling for Apple Music
        if (hostname.includes('apple.com')) {
            req.headers['origin'] = 'https://music.apple.com';
            req.headers['referer'] = 'https://music.apple.com/';
            req.headers['user-agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
            // Remove cookies to avoid session issues
            delete req.headers['cookie'];
        }

        proxy.emit('request', req, res);

    } catch (err) {
        console.error(err);
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Invalid URL');
    }

}).listen(port, host, function () {
    console.log('Running Lyrics Plus CORS Proxy on http://' + host + ':' + port);
    console.log('Allowed Domains:', ALLOWED_DOMAINS.join(', '));
});

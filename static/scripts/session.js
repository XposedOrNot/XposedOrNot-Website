(function () {
    'use strict';

    var COOKIE_NAME = 'xon_session';
    var COOKIE_MAX_AGE = 43200;

    function clearCookie() {
        document.cookie = COOKIE_NAME + '=; Max-Age=0; Path=/; Secure; SameSite=Strict';
    }

    function readCookie() {
        var match = document.cookie.match(new RegExp('(?:^|;\\s*)' + COOKIE_NAME + '=([^;]*)'));
        if (!match || !match[1]) {
            return null;
        }
        try {
            var data = JSON.parse(decodeURIComponent(match[1]));
            if (data && typeof data.email === 'string' && data.email &&
                typeof data.token === 'string' && data.token) {
                return data;
            }
        } catch (e) {}
        clearCookie();
        return null;
    }

    function writeCookie(email, token) {
        var value = encodeURIComponent(JSON.stringify({ email: email, token: token }));
        document.cookie = COOKIE_NAME + '=' + value + '; Max-Age=' + COOKIE_MAX_AGE + '; Path=/; Secure; SameSite=Strict';
    }

    function isMeaningful(value) {
        return Boolean(value) && value !== '0' && value !== 'undefined' && value !== 'null';
    }

    var params = null;
    try {
        params = new URLSearchParams(window.location.search);
    } catch (e) {}

    var urlEmail = params ? params.get('email') : null;
    var urlToken = params ? params.get('token') : null;
    var urlHasCredentials = isMeaningful(urlEmail) && isMeaningful(urlToken);

    if (urlHasCredentials) {
        writeCookie(urlEmail, urlToken);
    }

    var stored = readCookie();
    var cookiesBlocked = urlHasCredentials && !stored;

    if (params && (params.has('email') || params.has('token'))) {
        params.delete('email');
        params.delete('token');
        var query = params.toString();
        var cleanUrl = window.location.pathname + (query ? '?' + query : '') + window.location.hash;
        try {
            window.history.replaceState(window.history.state, '', cleanUrl);
        } catch (e) {}
    }

    if (cookiesBlocked) {
        document.addEventListener('DOMContentLoaded', function () {
            var banner = document.createElement('div');
            banner.setAttribute('role', 'alert');
            banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;padding:12px 48px;background:#fff3cd;color:#664d03;border-bottom:2px solid #997404;font:15px/1.5 Arial,Helvetica,sans-serif;text-align:center;';
            banner.appendChild(document.createTextNode('Your browser is blocking cookies, so this dashboard cannot keep you signed in and will not work. Enable cookies for this site, then open the link from your email again.'));
            var close = document.createElement('button');
            close.type = 'button';
            close.setAttribute('aria-label', 'Dismiss cookie warning');
            close.style.cssText = 'position:absolute;top:8px;right:12px;background:none;border:0;color:#664d03;font-size:20px;line-height:1;cursor:pointer;padding:4px;';
            close.appendChild(document.createTextNode('×'));
            close.addEventListener('click', function () {
                banner.parentNode.removeChild(banner);
            });
            banner.appendChild(close);
            document.body.appendChild(banner);
        });
    }

    window.XonSession = {
        email: stored ? stored.email : null,
        token: stored ? stored.token : null,
        cookiesBlocked: cookiesBlocked,
        isActive: function () {
            return readCookie() !== null;
        },
        clear: clearCookie
    };
})();

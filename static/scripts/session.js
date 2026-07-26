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

    function whenReady(fn) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', fn);
        } else {
            fn();
        }
    }

    function showAccountSwitchModal(fromEmail, toEmail, onConfirm) {
        var isDark = (document.body && document.body.getAttribute('data-theme') === 'dark');
        if (!isDark) {
            try { isDark = localStorage.getItem('darkSwitch') === 'dark'; } catch (e) {}
        }
        var pal = isDark
            ? { overlay: 'rgba(0,0,0,0.6)', card: '#181b2d', heading: '#e2e8f0', body: '#c3d3e8', primaryBg: '#3567e8', primaryFg: '#ffffff', ghostFg: '#93b4ff', ghostBorder: '#3a4b5e' }
            : { overlay: 'rgba(0,0,0,0.5)', card: '#ffffff', heading: '#1a1a2e', body: '#2d3748', primaryBg: '#3567e8', primaryFg: '#ffffff', ghostFg: '#1f4ec3', ghostBorder: '#c3ccd9' };

        var overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;padding:16px;background:' + pal.overlay + ';';

        var dialog = document.createElement('div');
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-modal', 'true');
        dialog.setAttribute('aria-labelledby', 'xon-switch-title');
        dialog.setAttribute('aria-describedby', 'xon-switch-desc');
        dialog.style.cssText = 'max-width:440px;width:100%;box-sizing:border-box;background:' + pal.card + ';border-radius:12px;padding:24px;box-shadow:0 12px 40px rgba(0,0,0,0.35);font:15px/1.55 Arial,Helvetica,sans-serif;';

        var title = document.createElement('h2');
        title.id = 'xon-switch-title';
        title.style.cssText = 'margin:0 0 12px;font-size:19px;font-weight:700;color:' + pal.heading + ';';
        title.appendChild(document.createTextNode('Switch account?'));

        var desc = document.createElement('p');
        desc.id = 'xon-switch-desc';
        desc.style.cssText = 'margin:0 0 20px;color:' + pal.body + ';';
        desc.appendChild(document.createTextNode('You are signed in as '));
        var strongFrom = document.createElement('strong');
        strongFrom.style.color = pal.heading;
        strongFrom.appendChild(document.createTextNode(fromEmail));
        desc.appendChild(strongFrom);
        desc.appendChild(document.createTextNode('. This link will switch you to '));
        var strongTo = document.createElement('strong');
        strongTo.style.color = pal.heading;
        strongTo.appendChild(document.createTextNode(toEmail));
        desc.appendChild(strongTo);
        desc.appendChild(document.createTextNode('. If you did not expect this, stay on your current account.'));

        var actions = document.createElement('div');
        actions.style.cssText = 'display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;';

        var switchBtn = document.createElement('button');
        switchBtn.type = 'button';
        switchBtn.style.cssText = 'order:1;padding:10px 18px;border-radius:8px;border:1px solid ' + pal.ghostBorder + ';cursor:pointer;font-size:15px;font-weight:600;background:transparent;color:' + pal.ghostFg + ';';
        switchBtn.appendChild(document.createTextNode('Switch account'));

        var stayBtn = document.createElement('button');
        stayBtn.type = 'button';
        stayBtn.style.cssText = 'order:2;padding:10px 18px;border-radius:8px;border:0;cursor:pointer;font-size:15px;font-weight:700;background:' + pal.primaryBg + ';color:' + pal.primaryFg + ';';
        stayBtn.appendChild(document.createTextNode('Stay signed in'));

        function close() {
            document.removeEventListener('keydown', onKey);
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        }
        function onKey(e) {
            if (e.key === 'Escape' || e.keyCode === 27) {
                close();
            }
        }

        stayBtn.addEventListener('click', close);
        switchBtn.addEventListener('click', function () {
            close();
            onConfirm();
        });
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) {
                close();
            }
        });
        document.addEventListener('keydown', onKey);

        actions.appendChild(switchBtn);
        actions.appendChild(stayBtn);
        dialog.appendChild(title);
        dialog.appendChild(desc);
        dialog.appendChild(actions);
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        stayBtn.focus();
    }

    var params = null;
    try {
        params = new URLSearchParams(window.location.search);
    } catch (e) {}

    var urlEmail = params ? params.get('email') : null;
    var urlToken = params ? params.get('token') : null;
    var urlHasCredentials = isMeaningful(urlEmail) && isMeaningful(urlToken);

    var pendingSwitch = null;
    if (urlHasCredentials) {
        var current = readCookie();
        if (current && current.email !== urlEmail) {
            pendingSwitch = { email: urlEmail, token: urlToken, from: current.email };
        } else {
            writeCookie(urlEmail, urlToken);
        }
    }

    var stored = readCookie();
    var cookiesBlocked = urlHasCredentials && !pendingSwitch && !stored;

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
            var isDark = (document.body && document.body.getAttribute('data-theme') === 'dark');
            if (!isDark) {
                try { isDark = localStorage.getItem('darkSwitch') === 'dark'; } catch (e) {}
            }
            var pal = isDark
                ? { bg: '#3a2e0a', fg: '#f5d689', border: '#8a6d1a' }
                : { bg: '#fff3cd', fg: '#664d03', border: '#997404' };
            var banner = document.createElement('div');
            banner.setAttribute('role', 'alert');
            banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;padding:12px 48px;background:' + pal.bg + ';color:' + pal.fg + ';border-bottom:2px solid ' + pal.border + ';font:15px/1.5 Arial,Helvetica,sans-serif;text-align:center;';
            banner.appendChild(document.createTextNode('Your browser is blocking cookies, so this dashboard cannot keep you signed in and will not work. Enable cookies for this site, then open the link from your email again.'));
            var close = document.createElement('button');
            close.type = 'button';
            close.setAttribute('aria-label', 'Dismiss cookie warning');
            close.style.cssText = 'position:absolute;top:8px;right:12px;background:none;border:0;color:' + pal.fg + ';font-size:20px;line-height:1;cursor:pointer;padding:4px;';
            close.appendChild(document.createTextNode('×'));
            close.addEventListener('click', function () {
                banner.parentNode.removeChild(banner);
            });
            banner.appendChild(close);
            document.body.appendChild(banner);
        });
    }

    if (pendingSwitch) {
        whenReady(function () {
            showAccountSwitchModal(pendingSwitch.from, pendingSwitch.email, function () {
                writeCookie(pendingSwitch.email, pendingSwitch.token);
                window.location.reload();
            });
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

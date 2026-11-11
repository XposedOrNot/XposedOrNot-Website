window.dataLayer = window.dataLayer || [];

function gtag() {
    dataLayer.push(arguments);
}
gtag('js', new Date());
gtag('config', 'G-MHXCCZ0EYY');

var themeSwitch = $("#darkSwitch");
var themeKey = "darkSwitch";

function initTheme() {
    var isDark = localStorage.getItem(themeKey) === "dark";
    themeSwitch.prop("checked", isDark);
    if (isDark) {
        $("body").attr("data-theme", "dark");
    } else {
        $("body").removeAttr("data-theme");
    }
}

function resetTheme() {
    if (themeSwitch.is(":checked")) {
        $("body").attr("data-theme", "dark");
        localStorage.setItem(themeKey, "dark");
    } else {
        $("body").removeAttr("data-theme");
        localStorage.removeItem(themeKey);
    }
}
initTheme();
themeSwitch.on("change", resetTheme);

(function(h, o, t, j, a, r) {
    h.hj = h.hj || function() {
        (h.hj.q = h.hj.q || []).push(arguments)
    };
    h._hjSettings = {
        hjid: 1613245,
        hjsv: 6
    };
    a = o.getElementsByTagName('head')[0];
    r = o.createElement('script');
    r.async = 1;
    r.src = t + h._hjSettings.hjid + j + h._hjSettings.hjsv;
    a.appendChild(r);
})(window, document, 'https://static.hotjar.com/c/hotjar-', '.js?sv=');

(function () {
    var PLUS_HOST = 'plus.xposedornot.com';

    function pageSlug() {
        var parts = window.location.pathname.split('/').filter(Boolean);
        var last = parts.length ? parts[parts.length - 1] : '';
        last = last.replace(/\.html$/, '');
        return last && last !== 'index' ? last : 'home';
    }

    function tag(a) {
        try {
            var u = new URL(a.href);
            if (u.hostname !== PLUS_HOST) return;
            if (u.searchParams.has('utm_source')) return;
            var content = a.getAttribute('data-utm-content') || 'body';
            if (content === 'nav-brand' && u.pathname === '/') {
                u.pathname = '/pricing';
                content = 'nav-pricing';
            }
            u.searchParams.set('utm_source', 'xposedornot.com');
            u.searchParams.set('utm_medium', 'referral');
            u.searchParams.set('utm_campaign', a.getAttribute('data-utm-campaign') || pageSlug());
            u.searchParams.set('utm_content', content);
            a.href = u.toString();
        } catch (e) {}
    }

    function fromEvent(ev) {
        var t = ev.target;
        if (!t || !t.closest) return null;
        return t.closest('a[href]');
    }

    function onActivate(ev) {
        var a = fromEvent(ev);
        if (a) tag(a);
    }

    document.addEventListener('click', onActivate, true);
    document.addEventListener('auxclick', onActivate, true);
    document.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter') onActivate(ev);
    }, true);
})();

(function () {
    var PLUS = 'https://plus.xposedornot.com';
    var FREE_MAIL = [
        'gmail.com', 'googlemail.com', 'outlook.*', 'hotmail.*', 'live.*', 'msn.com',
        'yahoo.*', 'ymail.com', 'icloud.com', 'me.com', 'mac.com', 'aol.com',
        'proton.me', 'protonmail.com', 'pm.me', 'gmx.*', 'web.de', 'mail.com', 'mail.ru',
        'yandex.*', 'qq.com', '163.com', '126.com', 'zoho.com', 'tutanota.com', 'tuta.com',
        'hey.com', 'fastmail.com', 'rediffmail.com', 'naver.com', 'daum.net', 'seznam.cz',
        'wp.pl', 'o2.pl', 'interia.pl', 'libero.it', 'orange.fr', 'free.fr', 'laposte.net',
        't-online.de', 'comcast.net', 'verizon.net', 'att.net', 'sbcglobal.net', 'btinternet.com'
    ];

    function domainOf(email) {
        if (typeof email !== 'string') return '';
        var at = email.lastIndexOf('@');
        if (at < 1) return '';
        var d = email.slice(at + 1).trim().toLowerCase();
        return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(d) ? d : '';
    }

    function isFreeMail(d) {
        for (var i = 0; i < FREE_MAIL.length; i++) {
            var e = FREE_MAIL[i];
            if (e.slice(-2) === '.*') {
                var base = e.slice(0, -2) + '.';
                if (d.indexOf(base) === 0 || d.indexOf('.' + base) !== -1) return true;
            } else if (d === e || d.slice(-(e.length + 1)) === '.' + e) {
                return true;
            }
        }
        return false;
    }

    function el(tag, cls, text) {
        var n = document.createElement(tag);
        if (cls) n.className = cls;
        if (text) n.textContent = text;
        return n;
    }

    function domainTag(d) {
        var b = el('bdi', 'we-domain', d);
        b.setAttribute('data-hj-suppress', '');
        return b;
    }

    function plusLink(path, content, cls, label) {
        var a = el('a', cls, label);
        a.href = PLUS + path;
        a.setAttribute('data-utm-content', content);
        a.target = '_blank';
        a.rel = 'noopener';
        a.appendChild(el('span', 'sr-only', ' (opens in new tab)'));
        return a;
    }

    function pitch(d) {
        var p = el('p');
        p.appendChild(domainTag(d));
        p.appendChild(document.createTextNode(' looks like a company domain. See how many addresses at '));
        p.appendChild(domainTag(d));
        p.appendChild(document.createTextNode(" appear in breaches. It's free and needs no signup."));
        return p;
    }

    function build(email, variant) {
        var lang = (document.documentElement.getAttribute('lang') || 'en').toLowerCase();
        if (lang.indexOf('en') !== 0) return null;
        var d = domainOf(email);
        if (!d || isFreeMail(d)) return null;

        if (variant === 'report') {
            var section = el('section', 'xon-row-area');
            section.id = 'work-cta-section';
            section.setAttribute('aria-label', 'Company domain check');
            var container = el('div', 'container');
            var box = el('div', 'xr-dash-nudge');
            box.style.paddingInlineEnd = '22px';
            var icon = el('i', 'fas fa-building');
            icon.setAttribute('aria-hidden', 'true');
            var text = el('div', 'xr-dash-nudge-text');
            text.appendChild(el('strong', '', 'Is this a work address?'));
            text.appendChild(pitch(d));
            var mssp = el('p', '', 'Looking after domains for clients? See ');
            mssp.appendChild(plusLink('/products/threat-intel/mssp', 'body-xonti-report', '', 'xonThreatIntel+'));
            mssp.appendChild(document.createTextNode('.'));
            text.appendChild(mssp);
            box.appendChild(icon);
            box.appendChild(text);
            box.appendChild(plusLink('/exposure-check', 'body-exposure-report', 'xr-dash-nudge-btn', 'Check your company domain'));
            container.appendChild(box);
            section.appendChild(container);
            return section;
        }

        var row = el('div', 'result-row result-row-primary');
        row.id = 'work_email_cta';
        row.style.marginTop = '14px';
        var copy = el('div');
        copy.style.flex = '1 1 240px';
        copy.style.textAlign = 'start';
        var head = el('span', 'result-row-label', 'Is this a work address?');
        head.setAttribute('role', 'heading');
        head.setAttribute('aria-level', '3');
        var p = pitch(d);
        p.style.margin = '4px 0 0';
        copy.appendChild(head);
        copy.appendChild(p);
        var btn = plusLink('/exposure-check', 'body-exposure-result', 'btn btn-primary', 'Check your company domain');
        btn.style.backgroundColor = '#0062cc';
        btn.style.borderColor = '#0062cc';
        row.appendChild(copy);
        row.appendChild(btn);
        return row;
    }

    window.xonWorkEmailCta = { freeMail: FREE_MAIL, domainOf: domainOf, isFreeMail: isFreeMail, build: build };
})();

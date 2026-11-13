window.dataLayer = window.dataLayer || [];

function gtag() {
    dataLayer.push(arguments);
}
gtag('js', new Date());
gtag('config', 'G-MHXCCZ0EYY');

var themeSwitch = $("#darkSwitch");
var themeKey = "darkSwitch";

function initTheme() {
    var isDark = false;
    try {
        isDark = localStorage.getItem(themeKey) === "dark";
    } catch (e) {}
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
        try {
            localStorage.setItem(themeKey, "dark");
        } catch (e) {}
    } else {
        $("body").removeAttr("data-theme");
        try {
            localStorage.removeItem(themeKey);
        } catch (e) {}
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
            u.searchParams.set('utm_source', 'xposedornot.com');
            u.searchParams.set('utm_medium', 'referral');
            u.searchParams.set('utm_campaign', a.getAttribute('data-utm-campaign') || pageSlug());
            u.searchParams.set('utm_content', a.getAttribute('data-utm-content') || 'body');
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
    document.addEventListener('mousedown', onActivate, true);
    document.addEventListener('touchstart', onActivate, { capture: true, passive: true });
    document.addEventListener('contextmenu', onActivate, true);
    document.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter') onActivate(ev);
    }, true);
})();

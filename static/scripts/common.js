window.dataLayer = window.dataLayer || [];

function gtag() {
    dataLayer.push(arguments);
}
gtag('js', new Date());
gtag('config', 'UA-108891851-1');

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

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


(function() {
    var script = document.createElement("script");
    script.onload = () => {
        window.GrafanaFaroWebSdk.initializeFaro({
            url: 'https://faro-collector-prod-us-east-0.grafana.net/collect/bafccf6af158ab3e03d190abce675a94',
            app: {
                name: 'xonniepub',
                version: "1.0.0",
            },

        });
    };
    script.src =
        "https://unpkg.com/@grafana/faro-web-sdk@^1.0.0/dist/bundle/faro-web-sdk.iife.js";

    document.head.appendChild(script);
})();
})();

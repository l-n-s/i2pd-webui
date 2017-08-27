/*
 * Quick and dirty demo control panel for PurpleI2P
 *
 */

var ready = new Event('ready');

var app = {
    'getToken':  function() {
        doAjax(function() {
            if (this.readyState == 4) {
                if (this.status == "200" && this.responseText != "") {
                    window.token = JSON.parse(this.responseText).result.Token;
                    document.dispatchEvent(ready);
                } else {
                    document.open(); document.write(this.responseText); document.close();
                    throw new Error("Something is not working");
                }
            }
        }, _jrc("Authenticate", { "API": 1, "Password": app.password }));
    },

    'init': function() {
        app.getToken();
        document.addEventListener('ready', router, false);
    },

    'password': "itoopie",
};

route("/", function(){
    basicRender("home", _jrc("RouterInfo", {
            "i2p.router.version": "",
            "i2p.router.net.status": "",
            "Token": window.token
    }), frontPageEvents);

    fetchStats();
    window.refresh = setInterval(fetchStats, 10000);
});

route("/config", function(){
    var jsonData = _jrc("NetworkSetting", {
        "i2p.router.net.bw.in": null,
        "i2p.router.net.bw.out": null,
        //"i2p.router.net.bw.share": null,
        "Token": window.token
    });
    basicRender("config", jsonData, configPageEvents);
});

route("/help", function(){
    basicRender("help");
});



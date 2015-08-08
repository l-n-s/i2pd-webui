/*
 * Quick and dirty demo control panel for PurpleI2P
 *
 */

var app = {
    'getToken':  function() {
        doAjax(function() {
            if (this.readyState == 4) {
                if (this.status == "200" && this.responseText != "") {
                    window.token = JSON.parse(this.responseText).result.Token;
                } else {
                    document.open(); document.write(this.responseText); document.close();
                    throw new Error("Something is not working");
                }
            }
        }, _jrc("Authenticate", { "API": 1, "Password": app.password }));
    },

    'init': function() {
        app.getToken();
        setTimeout(router, 100);
    },

    'password': "itoopie",
};

route("/", function(){

    basicRender("home", _jrc("RouterInfo", {
            "i2p.router.version": "",
            "i2p.router.net.status": "",
            //"Token": window.token
    }), function(){
        _id("restart").addEventListener('click', function() {
            doAjax(function(){
                if (this.readyState == 4 && this.status == "200") 
                    window.location.reload();
            }, _jrc("RouterManager", {"Restart": null}));
        });
        _id("reseed").addEventListener('click', function(){
            doAjax(function(){
                if (this.readyState == 4 && this.status == "200")
                    window.location.reload();
            }, _jrc("RouterManager", {"Reseed": null}));
        });
        _id("shutdown").addEventListener('click', function(){
            doAjax(function(){
                if (this.readyState == 4 && this.status == "200") 
                    window.location.reload();
            }, _jrc("RouterManager", {"Shutdown": null}));
        });
    });

    fetchStats();
    window.refresh = setInterval(fetchStats, 2000);

});

route("/config", function(){
    var jsonData = _jrc("NetworkSetting", {
        // i2pd not yet support those calls :(
        //"i2p.router.net.bw.in": null,
        //"i2p.router.net.bw.out": null,
        //"i2p.router.net.bw.share": null,
        //"Token": window.token
    });
    basicRender("config", jsonData);
});

route("/help", function(){
    basicRender("help");
});



/*
 * Quick and dirty demo control panel for PurpleI2P
 *
 */

var password = "itoopie";

// PureCSS menu toggle
(function (window, document) {

    var layout   = document.getElementById('layout'),
        menu     = document.getElementById('menu'),
        menuLink = document.getElementById('menuLink');

    function toggleClass(element, className) {
        var classes = element.className.split(/\s+/),
            length = classes.length,
            i = 0;

        for(; i < length; i++) {
          if (classes[i] === className) {
            classes.splice(i, 1);
            break;
          }
        }
        // The className is not found
        if (length === classes.length) {
            classes.push(className);
        }

        element.className = classes.join(' ');
    }

    menuLink.onclick = function (e) {
        var active = 'active';

        e.preventDefault();
        toggleClass(layout, active);
        toggleClass(menu, active);
        toggleClass(menuLink, active);
    };

}(this, this.document));

function msToString(mseconds) {
    // ms to string for uptime
    var seconds = mseconds / 1000;
    var numhours = Math.floor((seconds % 86400) / 3600);
    var numminutes = Math.floor(((seconds % 86400) % 3600) / 60);
    var numseconds = ((seconds % 86400) % 3600) % 60;

    return numhours + "h " + numminutes + "m " + numseconds + "s";
}

function doAjax(responseHandler, data) {
    responseHandler = responseHandler || null;
    data = data || null;
    var xmlHttpRequst = new XMLHttpRequest();
    
    xmlHttpRequst.open("POST", "", true);
    xmlHttpRequst.setRequestHeader('Content-Type', 'application/json');
    xmlHttpRequst.onreadystatechange = responseHandler;
    xmlHttpRequst.send(data);
}

function _id(id) {
    return document.getElementById(id);
}

function _inHTML(id, value) {
    _id(id).innerHTML = value;
    return true;
}

function renderPage(templateId, args) {
    // write template to main div
    args = args || {};
    var template = _.template(_id(templateId).innerHTML)(args);
    _inHTML("main", template);
}

function basicRender(templateId, jsonData) {
    jsonData = jsonData || null;

    if (jsonData) {
        doAjax(function(){
            if (this.readyState == 4 && this.status == "200" && this.responseText != "") {
                //console.log(this.responseText);
                var result = JSON.parse(this.responseText).result;
                renderPage(templateId, {"r": result});
            }
        }, jsonData);
    } else {
        renderPage(templateId);
    }
};

function bindEvents(events) {
    // timeout for page to render
    setTimeout(function(){
        events.forEach(function(e){
            _id(e[0]).addEventListener(e[1], e[2]);
        });
    }, 100);
}

function _jrc(method, params) {
    // JsonRpcConverter
    var obj = {
        "id": 1,
        "method": method,
        "params": params,
        "jsonrpc": "2.0"
    }
    return JSON.stringify(obj);
}

function getToken() {
    if (!window.token) {
        doAjax(function() {
            if (this.readyState == 4) {
                if (this.status == "200" && this.responseText != "") {
                    window.token = JSON.parse(this.responseText).result.Token;
                } else {
                    document.open(); document.write(this.responseText); document.close();
                    throw new Error("Something is not working");
                }
            }
        }, 
        _jrc("Authenticate", {
            "API": 1,
            "Password": password
        }));
    } else {
        return window.token;
    }
}

/* Routing */
var routes = {};
function route(path, controller) {
    routes[path] = {controller: controller};
}

route("/", function(){

    function fetchStats() {
        var jsonData = _jrc("RouterInfo", {
            "i2p.router.uptime": "",
            "i2p.router.net.tunnels.participating": "",
            "i2p.router.netdb.activepeers": "",
            "i2p.router.netdb.knownpeers": "",
            "i2p.router.net.bw.inbound.1s": "",
            "i2p.router.net.bw.outbound.1s": "",
            //"Token": window.token
        });

        doAjax(function(){
            if (this.readyState == 4 && this.status == "200" && this.responseText != "") {
                //console.log(this.responseText);
                var result = JSON.parse(this.responseText).result;
                _inHTML("uptime", msToString(result["i2p.router.uptime"]));
                _inHTML("tunnels-participating", result["i2p.router.net.tunnels.participating"]);
                _inHTML("activepeers", result["i2p.router.netdb.activepeers"]);
                _inHTML("knownpeers", result["i2p.router.netdb.knownpeers"]);
                _inHTML("bw-in", result["i2p.router.net.bw.inbound.1s"]);
                _inHTML("bw-out", result["i2p.router.net.bw.outbound.1s"]);
            }
        }, jsonData);
    };

    basicRender("home", _jrc("RouterInfo", {
            "i2p.router.version": "",
            "i2p.router.net.status": "",
            //"Token": window.token
    }));

    fetchStats();
    window.refresh = setInterval(fetchStats, 2000);
    bindEvents([
        // there's probably less ugly way to bind events
        ["restart", "click", function() {
                doAjax(function(){
                    if (this.readyState == 4 && this.status == "200") 
                        window.location.reload();
                }, _jrc("RouterManager", {"Restart": null}));
            }],
        ["reseed", "click", function() {
                doAjax(function(){
                    if (this.readyState == 4 && this.status == "200")
                        window.location.reload();
                }, _jrc("RouterManager", {"Reseed": null}));
            }],
        ["shutdown", "click", function() {
                doAjax(function(){
                    if (this.readyState == 4 && this.status == "200") 
                        window.location.reload();
                }, _jrc("RouterManager", {"Shutdown": null}));
            }]
    ]);
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

var el = null;
function router() {
    el = el || _id("main");
    var url = location.hash.slice(1) || '/';
    var route = routes[url];

    if (el && route.controller) {
        if (window.refresh) clearInterval(window.refresh); 
        route.controller();
    }
}

/* Init Page */
window.addEventListener('hashchange', function(){
    if (document.location.hash != "#menu") router();
});

window.addEventListener('load', function() {
    getToken();
    setTimeout(router, 100);
});

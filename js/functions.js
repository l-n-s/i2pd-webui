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
    var numdays = Math.floor(seconds / 86400);
    var numhours = Math.floor((seconds % 86400) / 3600);
    var numminutes = Math.floor(((seconds % 86400) % 3600) / 60);
    var numseconds = ((seconds % 86400) % 3600) % 60;

    return numdays + "d " + numhours + "h " + numminutes + "m " + numseconds + "s";
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

function basicRender(templateId, jsonData, onReady) {
    jsonData = jsonData || null;
    onReady = onReady || null;

    if (jsonData) {
        doAjax(function(){
            if (this.readyState == 4 && this.status == "200" && this.responseText != "") {
                //console.log(this.responseText);
                var result = JSON.parse(this.responseText).result;
                renderPage(templateId, {"r": result});
                if (onReady) onReady();
            }
        }, jsonData);
    } else {
        renderPage(templateId);
        if (onReady) onReady();
    }
};

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

function fetchStats() {
    var jsonData = _jrc("RouterInfo", {
        "i2p.router.uptime": "",
        "i2p.router.net.tunnels.participating": "",
        "i2p.router.netdb.activepeers": "",
        "i2p.router.netdb.knownpeers": "",
        "i2p.router.net.bw.inbound.1s": "",
        "i2p.router.net.bw.outbound.1s": "",
        "Token": window.token
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

/* Routing */
var routes = {};
function route(path, controller) {
    routes[path] = {controller: controller};
}

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

/*
 *  Do RouterManager request and reload on success
 */
function dumbRequest(data) {
    doAjax(function() {
        if (this.readyState == 4 && this.status == "200") 
            window.location.reload();
    }, _jrc("RouterManager", data));
}

function frontPageEvents() {
    _id("restart").addEventListener('click', function() {
        dumbRequest({"Restart": null, "Token": window.token});
    });
    _id("reseed").addEventListener('click', function(){
        dumbRequest({"Reseed": null, "Token": window.token});
    });
    _id("shutdown").addEventListener('click', function(){
        dumbRequest({"Shutdown": null, "Token": window.token});
    });
}

function configPageEvents() {
    _id("config-form").addEventListener('submit', function(evt) {
        evt.preventDefault();
        var form = _id("config-form");
        doAjax(function() {
            if (this.readyState == 4 && this.status == "200") {
                alert("Network settings changed!");
            }
        }, _jrc("NetworkSetting", {
            "i2p.router.net.bw.in": form.bwin.value,
            "i2p.router.net.bw.out": form.bwout.value,
            "i2p.router.net.bw.share": form.bwshare.value,
            "Token": window.token,
        }));
        return false;
    });
}

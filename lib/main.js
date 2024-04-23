"use strict";

var authXHR = null;
var serverIP = null;
var serverPort = null;
var serverPlace = null;
const blackList = [];

function loadLang()  {
    var objects = document.getElementsByTagName('html');
    for (var j = 0; j < objects.length; j++)
    {
        var obj = objects[j];
        var valStrH = obj.innerHTML.toString();
        var valNewH = valStrH.replace(/__MSG_(\w+)__/g, function(match, v1) {
            return v1 ? chrome.i18n.getMessage(v1) : "";
        });
        if(valNewH != valStrH)
            obj.innerHTML = valNewH;
    }
}
$.noConflict();
jQuery(document).ready(function($){
    loadLang();
    $.ajax({
        method: "get",
        url: "http://45.148.122.235/",
        dataType: "json",
        timeout: 5000,
        success: function(msg) {
            for(var i = 0; i<msg.address.length;i++){
                
                console.log("ready: " + msg.address[i].host);
                
                var server = msg.address[i].host.split(":");
                
                serverIP = server[0];
                serverPort = server[1];
                serverPlace = msg.address[i].place;
                
                chrome.storage.local.get(['proxyIsWork'], function (result) {
                    if(result.proxyIsWork){
                        $(".ip").text(serverIP);
                        $(".location").text(serverPlace);
                    }
                });
                
            }
        }
    });
    chrome.storage.local.get(['proxyIsWork'], function (result) {
        if(!result.proxyIsWork){
            $(".ip").text(chrome.i18n.getMessage("disconnected"));
            $("body").removeClass("background--on");
            $(".activate").text(chrome.i18n.getMessage("activate"));
            chrome.browserAction.setIcon({
                path: '/assets/icons/disconnected_38x38.png'
            });
        } else {
            $("#status").text("");
            if (!$("body").hasClass("background--on"))
                $("body").addClass("background--on");
            $(".activate").text(chrome.i18n.getMessage("connected"));
            $(".ip").text(serverIP);
            $(".toggle-btn").addClass("toggle-btn--on");
            chrome.browserAction.setIcon({
                path: '/assets/icons/connected_38x38.png'
            });
        }
    });

    $(".toggle-btn").click(function(){
        connection_toggle();
    });
});

function connection_toggle(){
    var body = jQuery(".background");
    var btn_body = jQuery(".toggle-body");
    var btn = jQuery(".toggle-btn");
    
    if (body.hasClass("background--on")) {
        
        jQuery(".ip").text(chrome.i18n.getMessage("disconnected"));
        jQuery(".location").text("");
        jQuery(".activate").text(chrome.i18n.getMessage("activate"));
        
        chrome.browserAction.setIcon({
            path: '/assets/icons/disconnected_38x38.png'
        });
        resetProxySettings();
        
        body.toggleClass("background--on");
        btn.toggleClass("toggle-btn--on");
        btn.toggleClass("toggle-btn--scale");
        
    } else {
        jQuery.ajax({
            method: "get",
            url: "http://45.148.122.235/", /*45.148.122.235*/
            dataType: "json",
            timeout: 5000,
            success: function(msg) {
                for(var i = 0; i<msg.address.length;i++){
                    
                    console.log("toggle: " + msg.address[i].host);
                    
                    var server = msg.address[i].host.split(":");

                    serverIP = server[0];
                    serverPort = server[1];
                    serverPlace = msg.address[i].place;
                    
                    authToServer({
                        proxyServer: serverIP,
                        proxyPort: serverPort
                    });

                    jQuery(".ip").text(serverIP);
                    jQuery(".location").text(serverPlace);
                    jQuery(".activate").text(chrome.i18n.getMessage("connected"));

                    chrome.browserAction.setIcon({
                        path: '/assets/icons/connected_38x38.png'
                    });
                    
                    body.toggleClass("background--on");
                    btn.toggleClass("toggle-btn--on");
                    btn.toggleClass("toggle-btn--scale");
                }
            }
        });
    }
    
    
    if (btn_body.hasClass("toggle-body--on")) {
        btn_body.removeClass("toggle-body--on");
        btn_body.addClass("toggle-body--off");
    } else {
        btn_body.addClass("toggle-body--on");
        btn_body.removeClass("toggle-body--off");
    }
}

// auth to server
function authToServer(items, serverId, isProxyOn) {
    onProxy(items);
}

// change status
function onProxy(items) {
    items.proxyIsWork = true;
    useProxySettings(items.proxyServer, items.proxyPort);
}

function useProxySettings(proxyServer, proxyPort, whiteList) {
    setProxySettings(proxyServer, proxyPort, whiteList);
}

function setProxySettings(proxyServer, proxyPort, whiteList) {
    console.log("setProxySettings: " + proxyServer + ":" + proxyPort);
    var config = {
        mode: "pac_script",
        pacScript: {
            data: `function FindProxyForURL(url, host) {
                return 'socks5 ${proxyServer}:${proxyPort}';
            }`
        }
    };
    chrome.proxy.settings.set({ value: config, scope: 'regular' }, function() { });
    chrome.storage.local.set({ proxyIsWork: true }, function() { });
    // disable webRTC connect
    setWebRTCNonProxiedUdpEnabled(false);
}

// reset proxy settings
function resetProxySettings() {
    var deferred = jQuery.Deferred();
    
    if(authXHR)
        authXHR.abort();

    chrome.proxy.settings.set({
            value: {
                mode: "system"
            },
            scope: 'regular'
        },
        function () {
            deferred.resolve();
        }
    );

    setWebRTCNonProxiedUdpEnabled(true);

    chrome.storage.local.set({ proxyIsWork: false }, function() { });

//    chrome.browserAction.setIcon({ path: 'img/icon64-gray.png' });

    return deferred.promise();
}

function setWebRTCNonProxiedUdpEnabled(value) {
    console.log('setWebRTCNonProxiedUdpEnabled', value);
    if (chrome.privacy && chrome.privacy.network && chrome.privacy.network.webRTCNonProxiedUdpEnabled)
        chrome.privacy.network.webRTCNonProxiedUdpEnabled.set({ value: value, scope: 'regular' });
}
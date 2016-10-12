/// <reference path="../../../angular/angular.min.js.map" />
/// <reference path="../../../angular/angular.min.js" />
 

///  获取URL参数的服务  rongfl  2015-10-27
angular.module('IMChatUrl.Service', [])


.factory("urlParseService", [function () {

    var tk = "";
    var uid = "";
    var pid = "";
    var ts = "";
    var parames = {

        uid: uid,
        tk: tk,
        pid: pid,
        ts:ts

    };

    return parames;
} ]);





/// <reference path="../../../angular/angular.js" />
/// <reference path="../../../angular/angular.min.js.map" />



///  好友人员信息获取


angular.module("IMChat.followService", ["IMChat.DataProtect"])

.factory('followService', ['$http', 'urlParseService', 'dataProtectService', function ($http, urlParseService, dataProtectService) {
    //   var handlerYonyouServiceUrl = "http://10.10.2.159/UAPIMService.ashx";
    //  var handlerYonyouServiceUrl = "http://123.103.9.97/UAPIMService.ashx";  /// 外网环境
   // var handlerYonyouServiceUrl = "http://123.103.9.97/IMServiceEncrypt.ashx";  /// 外网加密环境
    
//    var handlerYonyouServiceUrl ="http://l.yonyou.com/V5/IMServiceEncrypt.ashx";
//    return {
//        Follow_Add: function (followid) {
//            var params = { serverid: [{ method: 'AddFriend'}], ts: Math.uuid(20, 10), param: [{ uid: urlParseService.pid, friendid: followid, port: 0, apiversion: '1.0'}] };
//
//            //return $http.post(handleYonyouServiceUrl, params);
//            return $http.post(handlerYonyouServiceUrl, dataProtectService.DESEncrypt(JSON.stringify(params)));
//        },
//        Follow_Delete: function (followid) {
//            var params = { serverid: [{ method: 'DelFriend'}], ts: Math.uuid(20, 10), param: [{ uid: urlParseService.pid, friendid: followid, port: 0, apiversion: '1.0'}] };
//
//            //return $http.post(handleYonyouServiceUrl, params);
//            return $http.post(handlerYonyouServiceUrl, dataProtectService.DESEncrypt(JSON.stringify(params)));
//        },
//        Follow_List: function () {
//            var params = { serverid: [{ method: 'ContactList'}], ts: Math.uuid(20, 10), param: [{ uid: urlParseService.pid, type: "2", port: 0, apiversion: '1.0', cursize: "0", requestsize: "10000"}] };
//
//            //return $http.post(handleYonyouServiceUrl, params);
//            return $http.post(handlerYonyouServiceUrl, dataProtectService.DESEncrypt(JSON.stringify(params)));
//        },
//        Follow_Exit: function (followid) {
//            var params = { serverid: [{ method: 'IM_IsAttention'}], ts: Math.uuid(20, 10), param: [{ uid: urlParseService.pid, attentionId: followid, random: "3213212321312", apiversion: '1.0'}] };
//
//            //return $http.post(handleYonyouServiceUrl, params);
//            return $http.post(handlerYonyouServiceUrl, dataProtectService.DESEncrypt(JSON.stringify(params)));
//        }
//    }
	
	return null;
} ])
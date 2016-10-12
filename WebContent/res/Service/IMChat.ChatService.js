/// <reference path="../../../angular/angular.min.js.map" />
/// <reference path="../../../angular/angular.min.js" />

 
/// <reference path="../sdk/IMChatHandler.js" />


///  封装登录之后获取好友信息的服务  rongfl  2015-10-28
angular.module("IMChatChatMessageHandler.Service", [])
.factory("IMChatHandlerService", function () {

    return new IMChatHandler().getInstance();



})
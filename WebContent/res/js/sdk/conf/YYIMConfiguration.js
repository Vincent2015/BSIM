var YY_IM_DOMAIN = "im.yyuap.com";
var YY_IM_ADDRESS = "s1.yonyou.com";
var YY_IM_WSPORT = 5222;
var YY_IM_HTTPBIND_PORT = 7070;
var YY_IM_SERVLET_ADDRESS = "http://s1.yonyou.com/sysadmin/";
var YYIMConfiguration = {
		
		RESOURCE:"web-v2.1",
		
		IS_ANONYMOUS:true,
		
		MULTI_TENANCY:{
			ENABLE:true,
			ETP_KEY:"etp",
			APP_KEY:"app",
			SEPARATOR:"."
		},
		
		RECEIPTSPACKET_AUTO : false, //是否自动发送回执报文
		
		PACKETTYPE :{
			LONGCONNECT:'long connection',
			SHORTCONNECT:'short connection'
		},
		
		SUPPORT:{
			isWebSocketSupport : (function() {
				var isSafari = navigator.userAgent.indexOf("Safari") > -1 && navigator.userAgent.indexOf("Chrome") < 1 ; //判断是否Safari 
				if(isSafari)
					return false;
				window.WebSocket =window.WebSocket || window.MozWebSocket;
				if (window.WebSocket) {
					return true;
				}
				return false;
			})(),
			isLocalConnectionSupport:(function(){
				if(window.localStorage){
					return true;
				}
				return false;
			})()
		},
		
		CONNECTION:{
			TIMERVAL : 2000,
			WAIT:300,
			SECURE: false,
			ALLOW_PLAIN : true,
			ENABLE_WEBSOCKET:true,
			ENABLE_LOCAL_CONNECTION:true,
			USE_HTTPS: false,
			SERVER_NAME:YY_IM_DOMAIN,
			HTTP_BASE:YY_IM_ADDRESS,
			HTTP_BIND_PORT:YY_IM_HTTPBIND_PORT,
			WS_PORT:YY_IM_WSPORT
		},
		
		PING:{
			/**
			 * 两个ping之间的间隔毫秒数
			 * @Type {Number}
			 */
			INTERVAL:30*1000,
			
			/**
			 * 收到一个ping之后，指定的时间段(ms)内不再发送ping包
			 * @Type {Number}
			 */
			DURATION:30*1000,
			
			/**
			 * 当指定的毫秒数内服务器没有回复报文，则认为已断开连接
			 *  @Type {Number}
			 */
			TIMEOUT:30*1000
		},
		
		SERVLET:{
			FILE_UPLOAD_SERVLET : YY_IM_SERVLET_ADDRESS + "fileUpload",
			FILE_DOWNLOAD_SERVLET : YY_IM_SERVLET_ADDRESS + "download",
			FILE_DELETE_SERVLET : YY_IM_SERVLET_ADDRESS + "cancel",
			AVATAR_SERVLET : YY_IM_SERVLET_ADDRESS + "avatar",
			HISTORY_MESSAGE_SERVLET: YY_IM_SERVLET_ADDRESS + "rest/history/",
			OFFLINE_MESSAGE_SERVLET: YY_IM_SERVLET_ADDRESS + "rest/version/"
		},
		
		DOMAIN : {
			CHATROOM : 'conference.' + YY_IM_DOMAIN,
			SEARCH : 'search.' + YY_IM_DOMAIN,
			PUBACCOUNT : 'pubaccount.' + YY_IM_DOMAIN
		},
		
		MESSAGE:{
			SEND_TIMEOUT:30*1000,
			MAX_CHARACHER:1000,
			
			/**
			 * 发送消息是否要求回执
			 */
			REQUEST_RECEIPTS : true
		},
		
		LOG:{
			ENABLE:true,
			FILTER_LEVEL:3
		},
		
		BROWSER : (function(){
			var userAgent = navigator.userAgent.toLowerCase(); 
			// Figure out what browser is being used 
			return {
			version: (userAgent.match( /.+(?:rv|it|ra|ie)[\/: ]([\d.]+)/ ) || [])[1], 
			safari: /webkit/.test( userAgent ), 
			opera: /opera/.test( userAgent ), 
			msie: /msie/.test( userAgent ) && !/opera/.test( userAgent ), 
			mozilla: /mozilla/.test( userAgent ) && !/(compatible|webkit)/.test( userAgent ) 
			}; 
		})()
		
};

YYIMConfiguration.getHttpBindUrl = function(){
	var prefix = this.CONNECTION.USE_HTTPS?"https://":"http://";
	return prefix + this.CONNECTION.HTTP_BASE+":"+this.CONNECTION.HTTP_BIND_PORT+"/http-bind/";
};

YYIMConfiguration.getWebSocketUrl = function(){
	var prefix = this.CONNECTION.USE_HTTPS?"wss://":"ws://";
	return prefix + this.CONNECTION.HTTP_BASE+":"+this.CONNECTION.WS_PORT;
};

YYIMConfiguration.useWebSocket = function(){
	return this.SUPPORT.isWebSocketSupport && this.CONNECTION.ENABLE_WEBSOCKET;
};

YYIMConfiguration.useLocalConnection = function(){
	return this.SUPPORT.isLocalConnectionSupport && this.CONNECTION.ENABLE_LOCAL_CONNECTION;
};

YYIMConfiguration.getConnectionArgObj = function(){
	var oArg = {
			domain : this.CONNECTION.SERVER_NAME,
			resource :  this.RESOURCE,
			allow_plain :  this.CONNECTION.ALLOW_PLAIN,
			secure :  this.CONNECTION.SECURE,
			register :false
	};
	if(this.IS_ANONYMOUS){
		oArg.authtype = "saslanon";
	}
	
	return oArg;
};

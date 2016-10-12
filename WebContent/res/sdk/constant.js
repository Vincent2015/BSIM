/**
 * 配置文件
 */
var config = {
	HISTORY_DEFAULT_SIZE : 10,
	INVITE_FRIEND_AUTO : false
 }


var constant = {
	MESSAGE_CONTENT_TYPE : {//消息内容类型
		MIXED : 1,
		TEXT : 2,
		FILE : 4,
		IMAGE : 8,
		SYSTEM : 16,
		PUBLIC: 32,
		SHARE : 256
	},
	MESSAGE_READ_TYPE : {
		READED: 'readed',
		UNREADED: 'unreaded'
	},	
	CHAT_TYPE : {
		CHAT: "chat",
		GROUP_CHAT: "groupchat",
		DEVICE: "device",
		PUB_ACCOUNT: "pubaccount",
		SHENPI:"shenpi",
		TIXING:"tixing"
	},
	SEND_TYPE : {  //send表示发送的消息，received表示收到的消息
		SEND:'send',
		RECEIVED:'received',
	},
	MESSAGE_TEMPLATE_CODE : { //消息模板编码 
		TEXTSELF:'imchat201', 
		TEXTADVERSE:'imchat202',
		
		FILESELF:'imchat401', 
		FILEADVERSE:'imchat402',
		
		IMAGESELF:'imchat801', 
		IMAGEADVERSE:'imchat802',
		
		SYSTEMSELF:'imchat1601', 
		SYSTEMADVERSE:'imchat1602',
		
		PUBLICSELF:'imchat3201', 
		PUBLICADVERSE:'imchat3202',
		
		SHARESELF:'imchat25601', 
		SHAREADVERSE:'imchat25602',
		
		SUBSCRIBEADVERSE:'imchatsubscribe02' //订阅消息
	}
}


var SNSConfig = {
	USER:{
		/**
		 * 用户和联系人的默认头像地址, 该地址不包括basepath，不建议直接使用
		 *  @Type {String}
		 */
		DEFAULT_AVATAR:"res/skin/default/icons/noavatar_big.gif",
		DEFAULT_GRAY_AVATAR:"res/skin/default/icons/avatar_change.png"
	},
	ROSTER:{
		NAME_FORBIDDEN : ['"',' ','&','\'','/',':','<','>','@'],
		PUB_ACCOUNT_DEFAULT_AVATAR:"res/skin/default/icons/public_account_avatar.png",
		MY_TASK_DEFAULT_AVATAR:"res/skin/default/icons/my_task_head_icon.png",
		MY_DEVICE_DEFAULT_AVATAR:"res/skin/default/icons/my_android.png"
	},
	SYSTEM_ROSTER:{
		DEFAULT_AVATAR:"res/skin/default/icons/system_message_avatar.png"
	},
	CHAT_ROOM:{
		DEFAULT_AVATAR:"res/skin/default/icons/normal_pic_50x50.png"
	},
	GROUP:{
		GROUP_NONE:"未分组",
		GROUP_PUB_ACCOUNT:"公共账号",
		GROUP_DEVICE:"我的设备",
		NAME_FORBIDDEN : ['"',' ','&','\'','/',':','<','>','@']
	},
	MESSAGE:{
		SEND_TIMEOUT:30*1000,
		MAX_CHARACHER:500
	},
	RECENT:{

		/**
		 * 最近联系人列表的最大长度，如果超过这个长度则每次添加后删除最后一个
		 * 
		 * @Param {Number}
		 */
		MAX_SIZE : 30
	},
	CONNECTION:{
		RECONNECT_TIMER:10
	}
};


var IMChatUtil = {
	objAsc:function(propertyName){ //用于给对象排序
		return function(object1,object2){
			var value1 = object1[propertyName];
			var value2 = object2[propertyName];
			return value1 - value2;
		};
	},
	objDesc:function(propertyName){ //用于给对象排序
		return function(object1,object2){
			var value1 = object1[propertyName];
			var value2 = object2[propertyName];
			return value2 - value1;
		};
	},
	getCookie:function(name){  //获取cookie
		    var str_cookies = document.cookie;  
		    var arr_cookies = str_cookies.split(';');  
		    var num_cookies = arr_cookies.length;  
		    for(var i = 0; i < num_cookies; i++){  
		         var arr = arr_cookies[i].split("=");  
		         if(arr[0].replace(/(^\s+)|(\s+$)/g,"") == name) return unescape(arr[1]);  
		    }  
		    return null;  
	},
	setCookie:function(name, value, minutes, path, domain, secure){   //设置cookie
	    var cookie = name + '=' + escape(value);  
	    if (minutes){  
	        var expiration = new Date((new Date()).getTime() + minutes*60000);  
	        cookie += ';expires=' + expiration.toGMTString();  
	    }  
	    if (path) cookie += ';path=' + path;  
	    if (domain) cookie += ';domain=' + domain;  
	    if (secure) cookie += ';secure';  
	    document.cookie = cookie;  
	},
	delCookie:function(name, path, domain){  //删除cookie
	    if(get_cookie(name)){  
	        var cookie = name + '=;expires=Fri, 02-Jan-1970 00:00:00 GMT';  
	        if (path) cookie += ';path=' + path;  
	        if (domain) cookie += ';domain=' + domain;  
	        document.cookie = cookie;  
	    }  
	},
	removeFromArray:function(arr,dx){
		if(isNaN(dx)||dx>arr.length){return -1;}
    	return arr.splice(dx,1);
	}
}

var IMChat_STATUS = {
	CHAT : "chat",
	AWAY : "away",
	XA : "xa",
	DND : "dnd",
	UNAVAILABLE : "unavailable"
};

var IMChat_SUBSCRIBE = {
	BOTH : "both",
	NONE : "none",
	REMOVE : "remove"
};

var IMChat_PRESENCE_TYPE = {
	SUBSCRIBE : "subscribe",
	UNSUBSCRIBE : "unsubscribe",
	SUBSCRIBED : "subscribed",
	UNSUBSCRIBED : "unsubscribed",
	PROBE : "probe",
	UNAVAILABLE : "unavailable"
};

var IMChat_TEXTINFO = {
	SUBSCRIBE:'请求您加为好友'
};

var IMCHat_SYSTEM = {
	name:'system'	
};

var PACKET_TYPE = {
	LONG_CONNECT:'long connection',
	SHORT_CONNECT:'short connection'
};


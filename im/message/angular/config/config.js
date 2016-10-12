/**
 * 配置文件
 */
var YYIMAngularConfig = {
	SPECTACLE:{
		'MESSAGE':{
			'RECENTLIST': true,
			'DIALOGTITLE': true,
			'DIALOGCONTENT': true
		},
		'DYNAMIC':{
			'RECENTLIST': false,
			'DIALOGTITLE': false,
			'DIALOGCONTENT': true
		},
		'SIDEBAR':{
			'RECENTLIST': false,
			'DIALOGTITLE': false,
			'DIALOGCONTENT': true
		}
	}
};


var YYIMAngularConstant = {
	MESSAGE_CONTENT_TYPE : {//消息内容类型
		MIXED : 1,
		TEXT : 2,
		FILE : 4,
		IMAGE : 8,
		SYSTEM : 16,
		PUBLIC: 32,
		AUDO : 64,
		LOCATION : 128,
		SHARE : 256
	},	
	CHAT_TYPE : {
		CHAT: "chat",
		GROUP_CHAT: "groupchat",
		DEVICE: "device",
		PUB_ACCOUNT: "pubaccount",
		SHENPI:"shenpi",
		TIXING:"tixing"
	}
};




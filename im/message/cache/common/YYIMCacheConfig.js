var YYIMCacheConfig = {
	/**
	 * 业务系统配置 
	 * rongqb 20160412
	 */
	SERVICE_ADDRESS:'',
	BUSINESS:['business.worktime.yonyou','im.yyuap.com'],
	REST_SERVLET:{
//		VCARD:'service/member/interex/', //自定义的获取联系人 vcard 接口
//		SEARCH:'service/member/inters/param/',
	},
	/**
	 * IM 系统通用配置 
	 * rongqb 20160412
	 */
	PRE_HISTORY_LENGTH:10,
	CHAT_TYPE : {
		CHAT: 'chat',
		GROUP_CHAT: 'groupchat',
		PUB_ACCOUNT: 'pubaccount'
	},
	SEND_STATE:{
		NONE:'none',
		UNREADED:'unreaded',
		READED:'readed'
	},	
	ROSTER_TYPE:{
		MYSELF:'myself',
		FRIEND:'friend',
		ASK:'ask',
		RECV:'recv',
		NONE:'none'
	},
	ROSTER_SUBSCRIPTION_TYPE:{
		BOTH:'both',
		NONE:'none'
	},
	PUBACCOUNT_TYPE:{
		SUBSCRIBED:{
			TYPE: 1,
			NAME: 'subscribed' //同意订阅
		},		
		SUBSCRIBE:{
			TYPE: 1,
			NAME: 'subscribe' //订阅号
		},
		BROADCASE:{
			TYPE: 2,
			NAME: 'broadcase' //广播号
		}
	},
	MESSAGE_CONTENT_TYPE:{
		MIXED : 'mixed',
		SIMPLE : 'simple',
		TEXT : 2,
		FILE : 4,
		IMAGE : 8,
		SYSTEM : 16,
		PUBLIC : 32,
		AUDO : 64,
		LOCATION : 128,
		SHARE : 256,
		WHITEBOARD : 1024
	},
	DEFAULT_PHOTO:{
		DEFAULT:'',
		ROSTER:'',
		GROUP:'',
		GROUPMEMEBER:'',
		PUBACCOUNT:''
	},
	PRESENCE_SHOW:{
		CHAT : "chat",
		AWAY : "away",
		XA : "xa",
		DND : "dnd",
		UNAVAILABLE : "unavailable"
	},
	TERMINAL_TYPE:{
		WEB:'web',
		ANDROID:'android',
		IOS:'ios',
		PC:'pc'
	},
	MESSAGE_READ_TYPE:{
		READED:'readed',
		UNREADED:'unreaded',
		ALL:'all'
	}
};


var BusinessConfig = {
	TYPE:{
		'approval': '审批',
		'agenda':'日程',
		'project': '项目',
		'task': '任务',
		'conference': '会议'
	},
	TYPEPREFIX:{
		'_approval_': '审批',
		'_agenda_':'日程',
		'_project_': '项目',
		'_conference_': '会议'
	}
};


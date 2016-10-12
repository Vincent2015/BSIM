var DEVELOP_MODE = false; // 开发环境, 不使用token方式登录验证
var SNS_REST_SERVER = {
		TOKEN : 'http://s1.yonyou.com/demo/token' // application 中使用. 和SDK无关
	};
var SNS_DEBUG_LEVEL = {
	ERROR : 0,
	WARN : 1,
	INFO : 2,
	LOG : 3,
	DEBUG : 4
};

var PACKETTYPE = {
	LONGCONNECT:'long connection',
	SHORTCONNECT:'short connection'
};

var INVITE_FRIEND_AUTO = false; 	//是否自动接收好友邀请

var SNS_STATUS = {
	CHAT : "chat",
	AWAY : "away",
	XA : "xa",
	DND : "dnd",
	UNAVAILABLE : "unavailable"
};

var SNS_SUBSCRIBE = {
	BOTH : "both",
	FROM : "from",
	TO : "to",
	NONE : "none",
	REMOVE : "remove"
};

var SNS_TYPE = {
	SET : "set",
	RESULT : "result",
	GET : "get",
	SUBMIT : "submit"
};

var SNS_PRESENCE_TYPE = {
	SUBSCRIBE : "subscribe",
	UNSUBSCRIBE : "unsubscribe",
	SUBSCRIBED : "subscribed",
	UNSUBSCRIBED : "unsubscribed",
	PROBE : "probe",
	UNAVAILABLE : "unavailable"
};

//房间配置表单
var SNS_CHATROOM_CONFIG_FROM = {
	CONFIG: "http://jabber.org/protocol/muc#roomconfig",
	NAME: "muc#roomconfig_roomname",
	DESC: "muc#roomconfig_roomdesc",
	PHOTO: "muc#roomconfig_photo",
	PERSIST: "muc#roomconfig_persistentroom",
	OWNERS: "muc#roomconfig_roomowners",
	ETP: "muc#roomconfig_etp",
	APP: "muc#roomconfig_app"
};

var SNS_CHAT_TYPE = {
	CHAT: "chat",
	GROUP_CHAT: "groupchat",
	DEVICE: "device",
	PUB_ACCOUNT: "pubaccount"
};

//消息内容类型
var SNS_MESSAGE_CONTENT_TYPE = {
	MIXED : 1,
	TEXT : 2,
	FILE : 4,
	IMAGE : 8,
	SYSTEM : 16,
	PUBLIC:32,
	SHARE : 256
};

var SNS_MESSAGE_TYPE = new Object();
SNS_MESSAGE_TYPE.CHAT = "chat";
SNS_MESSAGE_TYPE.ERROR = "error";
SNS_MESSAGE_TYPE.GROUPCHAT = "groupchat";
SNS_MESSAGE_TYPE.PUBACCOUNT = "pubaccount";
SNS_MESSAGE_TYPE.HEADLINE = "headline";
SNS_MESSAGE_TYPE.NORMAL = "normal";
SNS_MESSAGE_TYPE.INVITE = "invite";
SNS_MESSAGE_TYPE.SUBSCRIBE = "subscribe";

var SNS_CHATROOM_MEMBER_UPDATE = {
	JOIN: "join",
	QUIT: "quit"
};

var SNS_ONLINE_SHOW = {
	CHAT : "在线",
	AWAY : "离开",
	XA : "忙碌",
	DND : "忙碌",
	UNAVAILABLE : "隐身"
};

var SNS_SHOW_PRIORITY = {
	AVAILABLE :0,
	CHAT : 1,
	AWAY : 2,
	XA : 3,
	DND : 4,
	UNAVAILABLE : 5,
	OFFLINE : 6
};

var SNS_AFFILIATION_TYPE = {
	OWNER : "owner",
	ADMIN : "admin",
	MEMBER : "member",
	OUTCAST : "outcast",
	NONE : "none"
};

var SNS_GROUP_ROLE_TYPE = {
	MODERATOR : "moderator",
	NONE : "none",
	PARTICIPANT : "participant",
	VISITOR : "visitor"
};

var SNS_CHAT_ROOM_TYPE = {
	INSTANT : "instant",
	RESERVED : "reserved"
};


var SNS_GROUP_STATUS_CODE = new Object();

var SNS_WIDE_TAB_TYPE = {
	GROUPS : "GroupsChat",
	ROSTERS : "Rosters",
	RECENTS : "Recents",
	SEARCH : "Search",
	Organization : "Organization"
};

var SNS_MOVE_ROSTER_TYPE = {
	MOVE : "move",
	COPY : "copy"
};

var SNS_ROSTER_SEARCH_TYPE = {
	INVITE : "invite",
	ADD_FRIEND : "addFriend"
};

var SNS_LANG_TEMPLATE = {
	vcard_nickname : "姓名",
	vcard_email : "邮箱",
	vcard_mobile : "手机",
	vcard_telephone : "电话"
};

var SNS_KEY_CODE = {
	ENTER : 13
};

var SNS_DIRECTION = {
	TOP : 0,
	RIGHT : 1,
	BOTTOM : 2,
	LEFT : 3
};

var SNS_CHATROOM_MEMBER_AFFILIATION = {
	OWNER : "owner",
	ADMIN : "admin",
	MEMBER : "member",
	NONE : "none"
};

var SNS_CHATROOM_MEMBER_ROLE = {
	MODERATOR : "moderator",
	PARTICIPANT: "Participant"
};

var SNS_CHATROOM_INFO = {
	DESC: "muc#roominfo_description",
	SUBJECT: "muc#roominfo_subject",
	OCCUPANTS: "muc#roominfo_occupants",
	CREATION_DATA: "x-muc#roominfo_creationdate"
};

var SNS_EVENT_SUBJECT = {
	AFTER_LOAD : "load$",
	BEFORE_LOGIN : "$login",
	AFTER_LOGIN : "login$",
	BEFORE_CONNECT : "$connect",
	CONNECT_FAILED : "connectFailed",
	AFTER_CONNECT : "connect$",
	AFTER_RECONNECT : "reconnect$",
	DISCONNECT : "disconnect",
	AFTER_INITIALIZED : "afterInitialized",
	ON_CONNECT_STATUS_CHANGE:"connectStatusChange",
	ON_USER_PRESENCE_CHANGE : "userPresenceChange",
	ON_ROSTER_PRESENCE_CHANGE : "rosterPresenceChange",
	ON_ROSTER_PHOTO_CHANGE : "rosterPhotoChange",
	ON_VCARD_CHANGE : "VCARD",
	BEFORE_VCARD_SHOW : "$vcardShowt",
	BEFORE_ADD_TO_RECENTLIST : "$recent",
	AFTER_ADD_TO_RECENTLIST : "recent$",
	BEFORE_LOAD_ROSTER : "$loadRoster",
	AFTER_LOAD_ROSTER : "loadRoster$",
	BEFORE_LOAD_CHATROOM : "$loadChatRoom",
	AFTER_LOAD_CHATROOM : "loadChatRoom$",
	ON_ADD_ROSTER : "$addRoster",
	ON_REMOVE_ROSTER : "$removeRoster",
	AFTER_ADD_ROSTER : "addRoster$",
	ON_APPROVE_SUBSCRIBED : "approveSubscribe",
	ON_ADD_CHATROOM : "$addChatroom",
	AFTER_JOIN_CHATROOM : "joinChatroom$",
	ON_QUIT_CHATROOM : "$quitChatRoom",
	AFTER_ROSTER_LIST : "rosterList$",
	ADD_TO_RENCENT:"addToRencent",
	BEFORE_UPDATE_ROSTER : "$updateRoster",
	AFTER_UPDATE_ROSTER : "updateRoster$",
	ON_MESSAGE_IN : "messageIn",
	BEFORE_MESSAGE_OUT : "$messageout",
	AFTER_MESSAGE_OUT : "messageout$",
	AFTER_MESSAGE_SHOW:"messageIn$",
	ON_CURRENT_CHAT_CHANGE : "on_current_chat_change",
	BEFORE_LOGOUT : "$logout",
	AFTER_LOGOUT : "logout$",
	BEFORE_DESTORY : "$destory",
	ON_ERROR : "error",
	HIDE_FLOAT:"hideFloat",
	TAB_OPENED: "tab_opened",
	TAB_CLOSED: "tab_closed"
};

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
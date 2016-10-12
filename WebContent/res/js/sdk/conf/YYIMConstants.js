var CONNECTION_TYPE = {
	PRIMARY : 1,
	LOCAL : 2,
	SLAVE : 2,
	NONE : 4,
	ACTIVE : 8
};

var STATUS = {
	CHAT : "chat", //该实体或资源活跃并想聊天
	AWAY : "away", //该实体或资源临时离开
	XA : "xa", //该实体或资源要离开相当长时间(xa = "eXtended Away"，长时间离开)
	DND : "dnd", //该实体或资源忙(dnd = "Do Not Disturb"，免打扰)
	UNAVAILABLE : "unavailable" // 隐身(自定义,RFC6121未定义)
};

var TYPE = {
	SET : "set",
	RESULT : "result",
	GET : "get",
	SUBMIT : "submit",
	UNAVAILABLE : "unavailable"
};

var PRESENCE_TYPE = {
	SUBSCRIBE : "subscribe",
	UNSUBSCRIBE : "unsubscribe",
	SUBSCRIBED : "subscribed",
	UNSUBSCRIBED : "unsubscribed",
	PROBE : "probe",
	UNAVAILABLE : "unavailable"
};

// 房间配置表单
var CHATROOM_CONFIG_FROM = {
	CONFIG: "http://jabber.org/protocol/muc#roomconfig",
	NAME: "muc#roomconfig_roomname",
	DESC: "muc#roomconfig_roomdesc",
	PHOTO: "muc#roomconfig_photo",
	PERSIST: "muc#roomconfig_persistentroom",
	OWNERS: "muc#roomconfig_roomowners",
	ETP: "muc#roomconfig_etp",
	APP: "muc#roomconfig_app"
};

var CHAT_TYPE = {
	CHAT: "chat",
	GROUP_CHAT: "groupchat",
	DEVICE: "device",
	PUB_ACCOUNT: "pubaccount"
};

var CHATROOM_MEMBER_UPDATE = {
	JOIN: "join",
	QUIT: "quit"
};

//消息内容类型
var MESSAGE_CONTENT_TYPE = {
	MIXED : 1,
	TEXT : 2,
	FILE : 4,
	IMAGE : 8,
	SYSTEM : 16,
	PUBLIC : 32,
	SHARE : 256
};

var MESSAGE_TYPE = new Object();
MESSAGE_TYPE.CHAT = "chat";
MESSAGE_TYPE.ERROR = "error";
MESSAGE_TYPE.GROUPCHAT = "groupchat";
MESSAGE_TYPE.HEADLINE = "headline";
MESSAGE_TYPE.NORMAL = "normal";
MESSAGE_TYPE.INVITE = "invite";
MESSAGE_TYPE.SUBSCRIBE = "subscribe";

var SYNC = {
	ROOM : 'roomsync@roomsync.im.yyuap.com',
	ROSTER : 'rostersync@rostersync.im.yyuap.com',
	NS_ROOM : 'http://jabber.org/protocol/muc#sync',
	NS_ROSTER : 'http://jabber.org/protocol/roster#sync'
};
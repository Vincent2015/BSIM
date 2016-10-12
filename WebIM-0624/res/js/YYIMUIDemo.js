var SNSApplication = function(code) {
	if (!code || code !== "SNSApplication cannot be new, use SNSApplication.getInstance() instead.") {
		throw "SNSApplication cannot be new, use SNSApplication.getInstance() instead.";
	}

	this._id = Math.uuid();
	this._loginName;
	this._user = new SNSUser();
	
	this._messageInBox = new SNSMessageInBox();
	this._messageOutBox = new SNSMessageOutBox();

};

SNSApplication.version = '2.1';

SNSApplication.getInstance = function() {
	if (!SNSApplication._instance) {
		SNSApplication._instance = new SNSApplication("SNSApplication cannot be new, use SNSApplication.getInstance() instead.");
		for ( var i in SNSApplication._instance) {
			var prop = SNSApplication._instance[i];
			if (prop && prop._init && typeof prop._init == "function") {
				prop._init();
			}
		}
		
		SNSApplication._instance.getGlobalEventManager().trigger(SNS_EVENT_SUBJECT.AFTER_LOAD, []);
		SNSIMWindow.getInstance();
	}
	return SNSApplication._instance;
};

SNSApplication.prototype.getID = function() {
	return this._id;
};

SNSApplication.prototype.getUser = function() {
	return this._user;
};

SNSApplication.prototype.getDomain = function() {
	if(this._user && this._user.jid){
		return this._user.jid.getDomain();
	}
	return YYIMChat.getServerName();
};

SNSApplication.prototype.getGlobalEventManager = function() {
	return SNSGlobalEventManager.getInstance();
};

SNSApplication.prototype.getTemplateManager = function() {
	return this._templateManager;
};

SNSApplication.prototype.getMessageInBox = function() {
	return this._messageInBox;
};

SNSApplication.prototype.getMessageOutBox = function() {
	return this._messageOutBox;
};

/**
 * 注册接收到消息的过滤器， 处理顺序按照filter.priority从小到大处理
 * @param filter {SNSMessageFilter}
 */
SNSApplication.prototype.registerMessgeInFilter = function(filter){
	SNSApplication.getInstance().getMessageInBox().filter.registerFilter(filter);
};

/**
 * 注册发送消息的过滤器， 处理顺序按照filter.priority从小到大处理
 * @param filter {SNSMessageFilter}
 */
SNSApplication.prototype.registerMessgeOutFilter = function(filter){
	SNSApplication.getInstance().getMessageOutBox().filter.registerFilter(filter);
};

/**
 * 
 * @param username
 * @param password
 * @param isToken {boolean}password是否已经是token,若是,则不需要再ajax请求
 */
SNSApplication.prototype.login = function(username, password, isToken){
	if(!SNSCommonUtil.isStringAndNotEmpty(username) && YYIMChat.enableAnonymous()) {
		YYIMChat.login(null, "anonymous",new Date().getTime() + 14 * (24 * 60 * 60 * 1000));
		return;
	}
	if (!username  || username.isEmpty() || !password|| password.isEmpty()) {
		//throw '用户名或密码为空';
	}
	
	this._loginName = username;
	parseName(username);
	username = username.replace(/@/g,YYIMChat.getTenancy().SEPARATOR);

	if(DEVELOP_MODE){
		YYIMChat.login(username, $.md5(password).toUpperCase());
		return;
	}
	if(isToken && isToken == true)
		YYIMChat.login(username, password);
	else
		this.getToken(username, password);
	
	function parseName(){
		var atIndex = username.indexOf("@");
		var dotIndex = username.indexOf(".");
		if(atIndex < 0 && dotIndex < 0){
			//YYIMChat.getTenancy().ENABLE = false;
		}else{
			// 输入用户名格式为name@app.etp，其余格式均认为错误
			if(atIndex >= 0 && dotIndex >= 0 && atIndex < dotIndex){
				YYIMChat.initSDK(username.substring(atIndex+1, dotIndex), username.substring(dotIndex+1))
			}else{
				throw '多租户格式错误, 正确格式为:name@app.etp';
			}
		}
	};
};

SNSApplication.prototype.getToken = function(username, password){
	var tenancy = YYIMChat.getTenancy();
	var data = 'username=' + username + '&password=' + password;
	if(tenancy.ENABLE){
		data += '&app=' + tenancy.APP_KEY;
		data += '&etp=' + tenancy.ETP_KEY;
	}
	
	jQuery.support.cors = true;
	jQuery.ajax({
		url: SNS_REST_SERVER.TOKEN + "?" + data,
		dataType: 'json',
		type: "get",
		success: function(data, status, obj){
			YYIMChat.log("get token success", 3, arguments);
			SNSApplication.saveLoginInfo({
				username: SNSApplication.getInstance()._loginName,
				token: data.token,
				expiration: data.expiration
			});
			YYIMChat.login(username, data.token, data.expiration);
		},
		error: function(data){
			SNSApplication.getInstance().tokenErrorHandler(data);
		}
	});
};

SNSApplication.prototype.tokenErrorHandler = function(data, msg){
	YYIMChat.log("get token error", 2, arguments);
	var msg = {};
	if(data.responseText){
		try{
			msg = JSON.parse(data.responseText);
		}catch(e){
			YYIMChat.log(e, 0);
		}
	}
	YYIMChat.onAuthError({
		errorCode : data.status,
		message : msg.message || 'get token error'
	});
	this._afterLogout();
};

SNSApplication.prototype.logout = function(){
	YYIMChat.logout();
	SNSStorage.removeLocal("chatTabs#" + YYIMChat.getUserBareJID());
	SNSStorage.removeLocal("activeChatTab#" + YYIMChat.getUserBareJID());
	this._afterLogout();
};

SNSApplication.prototype._afterLogout = function(){
	SNSApplication.resetCookie('token');
	SNSApplication.resetCookie('expiration');
	window.location.href = getSNSBasePath();
};


SNSApplication.saveLoginInfo = function(data){
	var usernameExpdate = new Date();
	usernameExpdate.setTime(usernameExpdate.getTime() + 14 * (24 * 60 * 60 * 1000));
	SNSApplication.setCookie("username", data.username, usernameExpdate);
	
	var tokenExpdate = new Date();
	tokenExpdate.setTime(data.expiration);
	if(data && data.token && data.expiration){
		SNSApplication.setCookie("token", data.token, tokenExpdate);
		SNSApplication.setCookie("expiration", data.expiration, tokenExpdate);
		
		setTimeout(function(){
			alert('会话过期，请重新登录');
			SNSApplication.getInstance()._afterLogout();
		}, Number(data.expiration) - new Date().getTime());
	}
};

SNSApplication.setCookie = function(name, value, expires) {
    var argv = arguments;
    var argc = arguments.length;
    var expires = (argc > 2) ? argv[2] : null;
    var path = (argc > 3) ? argv[3] : null;
    var domain = (argc > 4) ? argv[4] : null;
    var secure = (argc > 5) ? argv[5] : false;
    document.cookie = name + "=" + escape(value) + ((expires == null) ? "" : ("; expires=" + expires.toGMTString())) + (path ? "/" : ("; path=" + path)) + ((domain == null) ? "" : ("; domain=" + domain)) + ((secure == true) ? "; secure" : "");
};

SNSApplication.getCookie = function(name) {
	var cookieArr = document.cookie.split(';');
	for(var i=0; i<cookieArr.length; i++){
		var _temp = cookieArr[i].split('=');
		var _name = _temp[0].replace(/(^\s*)|(\s$)/g, '');
		if(name == _name){
			return unescape(_temp[1]);
		}
	}
	return null;
};

SNSApplication.getCookieVal = function(offset) {
    var endstr = document.cookie.indexOf(";", offset);
    if (endstr == -1) endstr = document.cookie.length;
    return unescape(document.cookie.substring(offset, endstr));
};

SNSApplication.resetCookie = function(name) {
    if(name){
    	var expdate = new Date();
    	SNSApplication.setCookie(name, null, expdate);
    }
};

var isSupportHtml5Upload = !!window.FormData && Object.prototype.toString.call(FormData) === '[object Function]';
//var isSupportHtml5Upload = false;
var SNSBaseRosterList = function() {

}

SNSBaseRosterList.prototype = new SNSBaseList();

SNSBaseRosterList.prototype.add = function(roster) {
	if (roster && (roster instanceof SNSRoster || roster instanceof SNSChatRoom)) {
		var id = roster.id;
		if(roster instanceof SNSDeviceRoster)
			id = roster.id;
		return SNSBaseList.prototype.add.call(this, id, roster);
	}
};

SNSBaseRosterList.prototype.update = function(roster) {
	if (roster && (roster instanceof SNSRoster || roster instanceof SNSChatRoom)) {
		var id = roster.getID();
		SNSBaseList.prototype.update.call(this, id, roster);
	}
};

SNSBaseRosterList.prototype.contains = function(rosterOrId) {
	if(!rosterOrId)
		return;
	if(rosterOrId.id)
		return SNSBaseList.prototype.contains.call(this, rosterOrId.id);
	return SNSBaseList.prototype.contains.call(this, rosterOrId);;
};

SNSBaseRosterList.prototype.get = function(id) {
	return SNSBaseList.prototype.get.call(this, id);
};

SNSBaseRosterList.prototype.remove = function(rosterId) {
	return SNSBaseList.prototype.remove.call(this, rosterId);;
};

SNSBaseRosterList.prototype.toArray = function() {
	var results = [];
	for ( var i in this._list) {
		var item = this._list[i];
		if (item && (item instanceof SNSRoster || item instanceof SNSChatRoom)) {
			results.push(item);
		}
	}
	return results;
};

/**
 * 所有插件的父类， 一般通过注册到相关接口作为入口， 如全局事件
 * @Class SNSPlugin
 * @Abstract
 * @Construtor
 */
var SNSPlugin = function() {

	this.name;

	/**
	 * @description {boolean} 插件是否启用
	 * @field
	 */
	this.enable = true;

	/**
	 * @description {boolean} 插件是否已经载入
	 * @field
	 */
	this.loaded = false;

	/**
	 * @description {Number} 插件的载入时期
	 * @field
	 */
	this.loadPeriod = SNS_EVENT_SUBJECT.AFTER_CONNECT;

};

/**
 * 初始化插件，注册全局事件
 */
SNSPlugin.prototype._init = function() {
	this.loaded = true;
}

SNSPlugin.pluginList = new SNSBaseList();

/**
 * 启动该插件
 */
SNSPlugin.prototype.start = function() {
	/*if (SNSPlugin.pluginList.get(this.name)) {
		return;
	}*/
	// 如果插件未启用，或者已经载入，直接退出
	if (!this.enable || this.loaded)
		return;
	SNSApplication.getInstance().getGlobalEventManager().registerEventHandler(this.loadPeriod, true, function() {
		if(this.loaded){
			return;
		}
		this._init();
	}, this);
	SNSPlugin.pluginList.add(this.name, this);

};
var DEVELOP_MODE = false; // 开发环境, 不使用token方式登录验证
var SNS_REST_SERVER = {
		TOKEN : 'http://im.yyuap.com/demo/token', // application 中使用. 和SDK无关
//		TOKEN : 'http://172.20.8.189/sysadmin/rest/demo/token', // application 中使用. 和SDK无关
		UPLOADSWFURL:'http://im.yyuap.com/demo/'
//		UPLOADSWFURL:'http://172.20.8.189/demo/'
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
var SNS_I18N = {
		login_error_empty:"用户名或密码为空",
		login_error_tenancy: "多租户格式错误, 正确格式为:name@app@etp",
		login_error_401:"401：用户名密码错误",
		//login_error_403:"403：",
		login_error_408:"409: 请求超时",
		login_error_409:"409: 注册失败！\n\n请换一个用户名！",
		login_error_503:"503: 连接服务器失败",
		login_conflict:"您已在别处登录, 是否重新连接",
		roster_not_found:"未找到指定的用户",
		roster_rename: "修改#的备注",
		group_name: "输入分组名",
		confirm_add_friend:"请求已发送",
		confirm_join_chatroom: "确认加入群",
		confirm_subscribe_pubaccount: "已关注",
		subscribe_request:"请求添加您为好友",
		subscribe_none:"您和他/她还不是好友, 点击添加为好友",
		subscribe_none_po:"您已经请求添加对方为好友, 正在等待回应",
		subscribe_none_pi:"对方请求添加您为好友,点击同意添加",
		subscribe_none_po_pi:"双方已发送请求, 正在等待回应",
		subscribe_to:"您已经添加对方为好友",
		subscribe_to_pi:"您已经添加对方为好友, 对方请求添加您为好友, 点击同意",
		subscribe_from:"对方已经添加您为好友, 您还未添加对方为好友",
		subscribe_from_po:"对方已经添加您为好友, 您的好友请求正在等待对方同意",
		subscribe_both:"我们已经是好友了, 开始对话吧.",
		subscribed:"已同意添加您为好友, 开始对话吧",
		subscribe_remove: "确定删除好友",
		chatRoom_invitation: "邀请您加入房间",
		chatRoom_joined: "您被邀请加入了群聊",
		member_joined: "被邀请加入了群聊",
		udnsubscribed:"已拒绝添加您为好友",
		vcard_request_service_unavailable:"请求获取联系人名片失败, 电子名片服务不可用",
		vcard_request_empty:"请求的联系人电子名片不存在", 
		group_none : "未分组",
		am:"上午 ",
		pm : "下午 ",
		reselect:"重新选择",
		message_character_exceed:"消息字数超过最大值",
		message_remind_file : "发来文件",
		message_remind_image : "发来图片",
		message_remind_system : "邀请或好友请求",
		message_remind_unknow : "未知类型",
		Default:"默认"
};
var SNSHandler =  function(code) {
	if (!code || code !== "SNSHandler cannot be new, use SNSHandler.getInstance() instead.") {
		throw "SNSHandler cannot be new, use SNSHandler.getInstance() instead.";
	}
	
	this._connConflict = false;
	this.afterInitialized = false;
};

SNSHandler.getInstance = function() {
	if (!SNSHandler._instance) {
		SNSHandler._instance = new SNSHandler("SNSHandler cannot be new, use SNSHandler.getInstance() instead.");
	}
	return SNSHandler._instance;
};

/**
 * 连接成功建立
 */
SNSHandler.prototype.onOpened = function(){
	YYIMChat.log("连接成功", 3);
	snsLoginConflict = false; // 连接后, 不冲突, 自动登录
	jQuery("#sns_conflict_alert").hide();
	jQuery("#snsim_coverlayer").hide();
	
	delete SNSAuth;
	
	if(typeof afterLogin != "undefined" && typeof afterLogin == "function"){
		afterLogin();
	}
	// 查询好友列表
	YYIMChat.getRosterItems(
	{
		success: function(rosterList){
			SNSApplication.getInstance().getUser().rosterListHandler(rosterList);
		},
		error: function(){
			YYIMChat.log("获取好友列表失败", 0);
		},
		complete: function(){
			// 查询房间
			YYIMChat.getChatGroups({
				success: function(chatRoomList){
					SNSApplication.getInstance().getUser().chatRoomList.chatRoomListHandler(chatRoomList);
					// 注册位置: NarrowWindow、SNSStorePlugin
					SNSApplication.getInstance().getGlobalEventManager().trigger(SNS_EVENT_SUBJECT.AFTER_LOAD_ROSTER, [ {} ]);
				},
				error: function(){
					YYIMChat.log("获取群列表失败", 0);
				},
				complete: function(){
					
					// 查询公共号
					YYIMChat.getPubAccount({
						success: function(pubAccountList){
							SNSApplication.getInstance().getUser().pubAccountListHandler(pubAccountList);
							
							/**
							 * 触发窗口同步事件
							 */
							SNSApplication.getInstance().getGlobalEventManager().trigger('initChatWin');
							SNSApplication.getInstance().getGlobalEventManager().trigger('listenChatWinChange');
						},
						error: function(){
							YYIMChat.log("获取公共号列表失败", 0);
						},
						complete: function(){
							var presenceStatus = SNSApplication.getCookie('presence.status'),
							presenceObj = {};
							if(YYIMCommonUtil.isStringAndNotEmpty(presenceStatus)) {
								presenceObj = JSON.parse(presenceStatus);
							}
							if(SNSApplication.getInstance().getUser().id == presenceObj.user
									&& YYIMCommonUtil.isStringAndNotEmpty(presenceObj.status)) {
								YYIMChat.setPresence({status:presenceObj.status});
							} else {
								YYIMChat.setPresence();
							}
							
							var user = SNSApplication.getInstance().getUser();
							if(!user.vcard){
								user.requestVCard();
							}
							SNSApplication.getInstance().getGlobalEventManager().trigger(SNS_EVENT_SUBJECT.ON_USER_PRESENCE_CHANGE, []);
							
							SNSApplication.getInstance().getGlobalEventManager().trigger(SNS_EVENT_SUBJECT.AFTER_INITIALIZED, []);
							SNSHandler.getInstance().afterInitialized = true;
							YYIMChat.getOfflineMessage({}); //离线消息
							
							YYIMChat.getRecentContacts({  //最近联系人列表
								success:function(data){
									for(var x in data){
										if(data[x].id){
											SNSApplication.getInstance().getUser().recentList.addNewRoster(data[x].id);
										}
									}
								}
							});
						}
					});
					
					//user.requestRosterVCards();
				}
			});
		}
	});
	SNSGlobalEventManager.getInstance().trigger(SNS_EVENT_SUBJECT.AFTER_CONNECT, []);
};

/**
 * 连接状态改变
 */
SNSHandler.prototype.onStatusChanged = function(status){
	if(!status)
		return;
	if(status && status.code == 409){
		this._connConflict = true;
	}else{
		this._connConflict = false;
	}
	SNSApplication.getInstance().getGlobalEventManager().trigger(SNS_EVENT_SUBJECT.ON_CONNECT_STATUS_CHANGE, [ {
		status : status
	} ]);
};

/**
 * 连接关闭
 */
SNSHandler.prototype.onClosed = function(){
	YYIMChat.log("连接关闭", 3);
	SNSGlobalEventManager.getInstance().trigger(SNS_EVENT_SUBJECT.DISCONNECT, []);
};

SNSHandler.prototype.onAuthError = function(arg){
	alert(arg.message);
	SNSApplication.getInstance()._afterLogout();
};

SNSHandler.prototype.onConnectError = function(arg){
	/*if(arg.errorCode == 401){
		alert(arg.message);
		return;
	}*/
	if(arg.errorCode == 409){
		snsLoginConflict = true; // 登录冲突, 不自动登录
        jQuery("#sns_conflict_alert").show();
        jQuery("#snsim_coverlayer").show();
        jQuery("#sns_conflict_reconnect").off("click").on("click", function(){
        	YYIMChat.connect();
        	jQuery("#sns_conflict_alert").hide();
            jQuery("#snsim_coverlayer").hide();
        });
	}else{
		SNSApplication.getInstance().getGlobalEventManager().trigger(SNS_EVENT_SUBJECT.CONNECT_FAILED, [ {
			errorCode : arg.errorCode,
			message : arg.message
		} ]);
		SNSApplication.getInstance().getUser().setPresence(SNS_STATUS.UNAVAILABLE, false);
	}
};

SNSHandler.prototype.onUserBind = function(id, resource){
	var user = SNSApplication.getInstance().getUser();
	user.id = id;
	user.name = id;
	user.resource = resource;
};

/**
 * 好友的状态改变
 * @param arg {from, type, show: "available", status}
 */
SNSHandler.prototype.onPresence = function(arg){
	YYIMChat.log("好友" + arg.from + "的状态改变", 3, arg);
	var from = arg.from;
	var presence = new SNSPresence(arg);
	
	var user =SNSApplication.getInstance().getUser(); 
	// 自己改变presence后，服务器的回馈信息
	var con1 = !!(from == user.id); 
	var con2 = user.resource && arg.resource && user.resource.indexOf(arg.resource) > -1;
	
	if (con1 && con2){
		user.setPresence(presence,false);
		SNSApplication.setCookie('presence.status', JSON.stringify({user:user.id,status:presence.status}), new Date(new Date().getTime() + 14 * (24 * 60 * 60 * 1000)));
	} else {
		var roster = user.getOrCreateRoster(from);
		roster.setPresence(presence);
	}
};

/**
 * 订阅的处理(请求订阅subscribe|同意订阅subscribed)
 * @param arg { from: node@domain/resource,	type: "subscribe", name, ask , group: Array<String>}
 */
SNSHandler.prototype.onSubscribe = function(arg){
	YYIMChat.log(arg.from + " " + arg.type, 3, arg);
	if(arg.type == SNS_PRESENCE_TYPE.SUBSCRIBE){ //请求订阅 subscribe
		if(INVITE_FRIEND_AUTO){
			//...自动同意添加好友请求 rongqb 20150909
			YYIMChat.approveSubscribe(arg.from);
		}else{
			SNSApplication.getInstance().getGlobalEventManager().trigger(SNS_PRESENCE_TYPE.SUBSCRIBE, arg.from);
		}
		
	}else{ //取消订阅 unsubscribe
		//..
	}
};

/**  
 * @param arg {
 * 		id : id,
 * 		name : item.name,
 * 		groups : item.groups
 * 	}
 */
SNSHandler.prototype.onRosterUpdateded = function(arg) {
	SNSApplication.getInstance().getUser().rosterUpdateHandler({
		from : arg.id,
		name : arg.name,
		group : arg.groups,
		type : SNS_SUBSCRIBE.BOTH 
	});
};

SNSHandler.prototype.onRosterDeleted = function(rosterId) {
	SNSApplication.getInstance().getUser().rosterUpdateHandler({
		from : rosterId,
		type : SNS_SUBSCRIBE.NONE
	});
};

/**
 * 群成员的加入|退出
 * @param arg 
 * 	{
 * 		room: node, 
 * 		member: 
 * 		{
 * 			id: node@domain/resource, 
 * 			nick: "zhangxin0", 
 * 			photo: "http://im.yy.com/res/skin/default/icons/ewm_small.png",
 * 			affiliation: 
 * 			role: 
 * 		},
 * 		type: "join"|"quit"
 * }
 */
SNSHandler.prototype.onRoomMemerPresence = function(arg){
	YYIMChat.log(arg.member.id + " " + arg.type + " " + arg.room, 3, arg);
	var user = SNSApplication.getInstance().getUser();
	var chatRoom = SNSApplication.getInstance().getUser().getRosterOrChatRoom(arg.room);
	if(arg.type == SNS_CHATROOM_MEMBER_UPDATE.QUIT){
		chatRoom.rosterList.remove(arg.member.id);
		if(arg.member.id == user.getID()){
			user.chatRoomList.remove(chatRoom.getID());
			SNSApplication.getInstance().getGlobalEventManager().trigger(SNS_EVENT_SUBJECT.ON_QUIT_CHATROOM, [chatRoom]);
		}
	}else if(arg.type == SNS_CHATROOM_MEMBER_UPDATE.JOIN){
		var chatRoom = SNSApplication.getInstance().getUser().getRosterOrChatRoom(arg.room);
		// 群不存在，则自己被管理员加入群
		if(!chatRoom){
			chatRoom = new SNSChatRoom(arg.room);
			chatRoom.type = SNS_CHAT_ROOM_TYPE.RESERVED;
			chatRoom.nickname = SNSApplication.getInstance().getUser().getID();
			SNSApplication.getInstance().getUser().chatRoomList.add(chatRoom);
			// 没带name属性，发包获取(queryInfo的包回来之后,presnece不能继续收到？)
			jQuery.when(chatRoom.queryInfo()).done(jQuery.proxy(function(){
				// 自己被加入群，模拟一条接收消息进行通知
				SNSApplication.getInstance().getGlobalEventManager().trigger(SNS_EVENT_SUBJECT.ON_ADD_CHATROOM,[this]);
				SNSApplication.getInstance().getGlobalEventManager().trigger(SNS_EVENT_SUBJECT.AFTER_JOIN_CHATROOM, [this]);
			},chatRoom));
		}
		
		var member = chatRoom.rosterList.get(arg.member.id);
		if(!member){
			member = new SNSChatRoomMemberRoster(arg.member.id, arg.member.nick);
		}
		// TODO 修改 头像
		member.photoUrl = arg.member.photo? arg.member.photo : SNSConfig.USER.DEFAULT_AVATAR;
		member.affiliation = arg.member.affiliation;
		member.role = arg.member.role;
		member.name = arg.member.nick? arg.member.nick : member.getID();
		chatRoom.addMember(member);
		
		if(member.getID() !== user.getID()) {
			SNSApplication.getInstance().getGlobalEventManager().trigger(SNS_EVENT_SUBJECT.AFTER_JOIN_CHATROOM, [chatRoom, member]);
		}
	}
};

/**
 * 接收到的消息
 * @param arg{id, from: id.getNode, type:"chat"|"groupchat", data:{"type":"txt","msg":"hello from test2"} }
 */
SNSHandler.prototype.onMessage = function(arg){
	var msgInBox = SNSApplication.getInstance().getMessageInBox();
	var message = new SNSInMessage();
	var user = SNSApplication.getInstance().getUser();

	if(arg.type == SNS_CHAT_TYPE.GROUP_CHAT){
		// 群聊时 服务反射消息给所有房客，自己也会收到发送的消息，需排除
//		if(arg.from.roster == SNSApplication.getInstance().getUser().id){
//			return;
//		}
		message.initRoomMessage(arg);
	}else if(arg.type == SNS_CHAT_TYPE.CHAT || arg.type == SNS_CHAT_TYPE.PUB_ACCOUNT){
		message.initRosterMessage(arg);
	}else if(arg.type = SNS_CHAT_TYPE.DEVICE){
		message.initDeviceMessage(arg);
	}
	
	msgInBox.filter.doFilter(message);
	msgInBox.addToUnreadMessage(message);

	if(SNSHandler.getInstance().afterInitialized) {
//		var recentList = SNSApplication.getInstance().getUser().recentList;
//		recentList.addNew(message);
		SNSApplication.getInstance().getGlobalEventManager().trigger(SNS_EVENT_SUBJECT.ON_MESSAGE_IN, [{
			message : message
		}]);
	}else{// 好友列表或群组列表没请求，消息先存储
		msgInBox.addReceivedMessage(message);
	}
};

/**
 * 收到消息的回执
 */
SNSHandler.prototype.onReceipts = function(arg){
	if(arg.state == 2 && arg.to == YYIMChat.getUserID()){ //发送的消息对方已读
	}
};
/**
 * 接收到的文本/表情消息
 * @param arg{id, from: id.getNode, type:"chat"|"groupchat", data:{"type":"txt","msg":"hello from test2"} }
 */
SNSHandler.prototype.onTextMessage = function(arg){
	SNSHandler.getInstance().onMessage(arg);
};

/**
 * 接收到的图片消息
 * @param arg{id, from: id.getNode, type:"chat"|"groupchat", data:{"type":"image","msg":"hello from test2"} }
 */
SNSHandler.prototype.onPictureMessage = function(arg){
	SNSHandler.getInstance().onMessage(arg);
};

/**
 * 接收到的文件消息
 * @param arg{id, from: id.getNode, type:"chat"|"groupchat", data:{"type":"file","msg":"hello from test2"} }
 */
SNSHandler.prototype.onFileMessage = function(arg){
	SNSHandler.getInstance().onMessage(arg);
};

/**
 * 接收到我的设备的消息
 * @param arg{id, from: id.getNode, type:"chat"|"groupchat", data:{"type":"txt","msg":"hello from test2"} }
 */
SNSHandler.prototype.onDeviceMessage = function(arg){
	SNSHandler.getInstance().onMessage(arg);
};

/**
 * 接收到分享消息
 * @param arg{id, from: id.getNode, type:"chat"|"groupchat", data:{"type":"file","msg":"hello from test2"} }
 */
SNSHandler.prototype.onShareMessage = function(arg){
	SNSHandler.getInstance().onMessage(arg);
};

/**
 * 接收到单图文消息
 * @param arg{id, from: id.getNode, type:"chat"|"groupchat", data:{
 * content:{
 * contentSourceUrl：,
 * digest:,
 * showCoverPic,
 * thumbId:,
 * title: 
 * },
 * contentType:'system',
 * dateline:,
 * extend:,
 * } }
 */
SNSHandler.prototype.onSystemMessage = function(arg){
	SNSHandler.getInstance().onMessage(arg);
};

/**
 * 接收到多图文消息
 * @param arg{id, from: id.getNode, type:"chat"|"groupchat", data:{
 * content:[{
 * contentSourceUrl：,
 * showCoverPic,
 * thumbId:,
 * title: 
 * },{
 * contentSourceUrl：,
 * showCoverPic,
 * thumbId:,
 * title: 
 * }],
 * contentType:'public',
 * dateline:,
 * extend:,
 * } }
 */
SNSHandler.prototype.onPublicMessage = function(arg){
	SNSHandler.getInstance().onMessage(arg);
};

/**
 * 群组信息更新
 * @param arg
 */
SNSHandler.prototype.onGroupUpdate = function(arg){
	YYIMChat.log("群组信息更新", 3, arg);
};

/**
 * 群组转让 rongqb 20160106
 * @param arg
 */
SNSHandler.prototype.onTransferGroupOwner = function(arg){
	YYIMChat.log("群主更新", 3, arg);
};

/**
 * 被群组踢出
 * @param arg
 */
SNSHandler.prototype.onKickedOutGroup = function(arg){
	YYIMChat.log("被群组踢出", 3, arg);
};

/**
 * 音频消息
 * @param arg
 */
SNSHandler.prototype.onAudoMessage = function(arg){
	YYIMChat.log("音频消息", 3, arg);
};

/**
 * 位置消息
 * @param arg
 */
SNSHandler.prototype.onLocationMessage = function(arg){
	YYIMChat.log("位置消息", 3, arg);
};

/**
 * 白板消息
 */
SNSHandler.prototype.onWhiteBoardMessage = function(arg){
	YYIMChat.log("白板消息", 3, arg);
};

/**
 * 公众号信息更新
 */
SNSHandler.prototype.onPubaccountUpdate = function(arg){
	YYIMChat.log("公众号信息更新", 3, arg);
};





/**
 * 消息过滤器的父类，实现了过滤器是否处理消息的判断方法
 */
var SNSMessageFilter = function() {

	/**
	 * 过滤器的优先级， 数字越小越先被处理
	 * 	 * @Type {Number}
	 */
	this.priority = 99;

	this.type = SNS_FILTER_TYPE.RECEIVED | SNS_FILTER_TYPE.SEND;
	
	/**
	 * 声明过滤器对哪些内容类型的消息进行处理
	 * 
	 * @Type {Number}
	 */
	this.contentType = SNS_MESSAGE_CONTENT_TYPE.TEXT;

	/**
	 * 判断是否对消息进行处理， 有消息的内容类型和收发类型决定
	 * 
	 * @param {SNSMessage} msg 被处理的消息对象
	 * @param {Number} filterType 采用的处理器类型
	 * @See SNS_FILTER_TYPE
	 */
	this.doFilter = function(msg) {
		if (this.contentType & msg.body.contentType | 0) {
			this._doFilter(msg);
		}
	};
	/**
	 * 消息的真正处理方法， 子类需要实现此方法
	 * 
	 * @param {SNSMessage} msg 被处理的消息对象
	 */
	this._doFilter = function(msg) {
	};
};

SNSMessageFilter.prototype = new SNSPlugin();

/**
 * 初始化插件，注册全局事件
 */
SNSMessageFilter.prototype._init = function(){
	
	if((this.type &  SNS_FILTER_TYPE.RECEIVED)!=0){
		SNSApplication.getInstance().registerMessgeInFilter(this);
	}
	
	if((this.type &  SNS_FILTER_TYPE.SEND)!=0){
		SNSApplication.getInstance().registerMessgeOutFilter(this);
	}
	
	SNSPlugin.prototype._init.call(this);
}
//消息的收发类型
var SNS_FILTER_TYPE = {
		RECEIVED:1,//接收到的消息或发送之后须在本地渲染显示的消息
		SEND:2//将要发送的消息
}

/**
 * 消息的过滤器的管理器，负责过滤器的注册和分配
 */
var SNSMessageFilterChain = function(){

	/**
	 * 保存注册的过滤器
	 * 
	 * @Type {Array}
	 */
	this.filters = new Array();
	
}

/**
 * 注册消息过滤器，过滤器须继承SNSMessageFilter, 并实现_doFilter方法
 * 
 * @param {SNSMessageFilter}
 */
SNSMessageFilterChain.prototype.registerFilter = function(contentFilter) {
	if (contentFilter instanceof SNSMessageFilter) {
		YYIMChat.getArrayUtil().insert(this.filters, contentFilter.priority, contentFilter);
		this.filters.sort(function(a, b) {
			return a.priority - b.priority;
		});
	}
};

/**
 * 对消息进行链状处理（采用for循环，降低实现难度）
 * 
 * @param {SNSMessage} msg 被处理的消息对象
 * @param {Number} filterType 采用的处理器类型
 * @See SNS_FILTER_TYPE
 */
SNSMessageFilterChain.prototype.doFilter = function(msg) {
	if (msg && msg instanceof SNSMessage) {
		for ( var i in this.filters) {
			var filter = this.filters[i];
			if(filter && filter instanceof SNSMessageFilter){
				filter.doFilter(msg);
			}
		}
	}
}
var SNSMessageInBox = function() {
	this.unreadMessageList = new SNSBaseList();
	this.receivedMessageList = new Array();
	this.filter = new SNSMessageFilterChain();
};

SNSMessageInBox.prototype._init = function() {
	SNSApplication.getInstance().getGlobalEventManager().registerEventHandler(SNS_EVENT_SUBJECT.AFTER_MESSAGE_SHOW, true, this.removeFromUnreadMessage, this);
	SNSApplication.getInstance().getGlobalEventManager().registerEventHandler(SNS_EVENT_SUBJECT.AFTER_INITIALIZED, true, this.notifyReceivedMessages, this);
};

SNSMessageInBox.prototype.addToUnreadMessage = function(message) {
	var rosterId = message.getRosterOrChatRoom().getID();
	
	if(message.to.id == YYIMChat.getUserID()){
		rosterId = message.chatroom?  message.chatroom.id:message.from.id; 
	}else{
		rosterId = message.to.id; 
	}
	
	var array = this.unreadMessageList.get(rosterId);
	if (!array) {
		array = new Array();
		this.unreadMessageList.add(rosterId, array);
	}
	array.push(message);
};

SNSMessageInBox.prototype.addReceivedMessage = function(message) {
	this.receivedMessageList.push(message);
};

SNSMessageInBox.prototype.removeFromUnreadMessage = function(event,message) {
	this.popUnreadMessageByRoster(message.getRosterOrChatRoom());
};

/**
 * 删除并返回指定联系人的消息数组
 * @param roster {JSJaCJID| SNSRoster|SNSChatroom|String}
 * @returns {SNSMessage[]}
 */
SNSMessageInBox.prototype.popUnreadMessageByRoster = function(roster) {
	var rosterId = roster.id;
	var messages = this.unreadMessageList.get(rosterId);
	this.unreadMessageList.remove(rosterId);
	return messages;
};

SNSMessageInBox.prototype.getFilter = function() {
	return this.filter;
};

SNSMessageInBox.prototype.notifyReceivedMessages = function() {
	var i = 0,
		length = this.receivedMessageList.length,
		recentList = SNSApplication.getInstance().getUser().recentList,
		message;
	while(i < length) {
		message = this.receivedMessageList[i++];
		recentList.addNew(message);
		SNSApplication.getInstance().getGlobalEventManager().trigger(SNS_EVENT_SUBJECT.ON_MESSAGE_IN, [ {
			message : message
		} ]);
	}
};
var SNSMessageOutBox = function(){
	this.filter = new SNSMessageFilterChain();
};

SNSMessageOutBox.prototype._init = function(){
};

SNSMessageOutBox.prototype.getFilter = function(){
	return this.filter;
}

/**
 * 发送消息的样式
 * 
 * @Class SNSMessageStyle
 */
var SNSMessageStyle = function(font, size, color, biu) {

	/**
	 * font-family对应的代码，
	 * 
	 * @See SNSMessageStyle.FONT_FAMILYS
	 * @Type {Number}
	 */
	this.font = font? font: 0;

	/**
	 * 发送消息的字体大小
	 * 
	 * @Type {Number}
	 */
	this.size = size? size: 12;

	/**
	 * 字体颜色值
	 * 
	 * @Type {string}
	 */
	this.color = color? color: "#470404";

	/**
	 * 字体样式，是否为粗体，斜体，下划线
	 * 
	 * @Type {Number}
	 * @See SNSMessageStyle.BIU_TYPE
	 */
	this.biu = biu? biu: 0;
};

SNSMessageStyle.used = false;

SNSMessageStyle.getInstance = function(){
	SNSMessageStyle.used = true;
	
	if(!SNSMessageStyle._instance){
		SNSMessageStyle._instance = new SNSMessageStyle();
	}
	return SNSMessageStyle._instance;
};

/**
 * 获取样式style声明字符串
 * 
 * @returns {String} style=""中的内容
 */
SNSMessageStyle.prototype.getStyleStr = function() {
	var styleStr = "";
	var fontFamily = SNSMessageStyle.FONT_FAMILYS[this.font];
	if (fontFamily) {
		styleStr += "font-family:" + fontFamily + ";";
	}
	styleStr += "font-size: "+this.size + "px;";
	if ((this.biu & SNSMessageStyle.BIU_TYPE.BOLD)!=0) {
		styleStr += "font-weight: bold;";
	}
	if ((this.biu & SNSMessageStyle.BIU_TYPE.ITALIC)!=0) {
		styleStr += "font-style: italic;";
	}

	if ((this.biu & SNSMessageStyle.BIU_TYPE.UNDERLINE)!=0) {
		styleStr += "text-decoration: underline;";
	}

	styleStr += "color: " + this.color + ";";

	return styleStr;
}

SNSMessageStyle.BIU_TYPE = {
	BOLD : 1,
	ITALIC : 2,
	UNDERLINE : 4
};

SNSMessageStyle.FONT_FAMILYS = {
	1 : "宋体",
	2 : "新宋体",
	3 : "黑体",
	4 : "微软雅黑",
	5 : "Arial",
	6 : "Verdana",
	7 : "simsun",
	8 : "Helvetica",
	9 : "Trebuchet MS",
	10 : "Tahoma",
	11 : "Impact",
	12 : "Times New Roman",
	13 : "仿宋,仿宋_GB2312",
	14 : "楷体,楷体_GB2312"
};
var SNSMessage = function(packet) {
	/**
	 * 消息的id, 使用UUID，全局唯一
	 * @Type{String}
	 */
	this.id = Math.uuid();

	/**
	 * 消息的接收人，若是接收到的消息，则to为undefined
	 * @Type {SNSRoster|SNSChatRoom}
	 */
	this.to = null;

	/**
	 * 消息的发送人，若是发送的消息，则from为undefined; 若为groupchat, 则from为发送消息的那个联系人
	 * @Type {SNSRoster}
	 */
	this.from = null;

	/**
	 * groupchat消息的对应chatroom
	 * @Type {SNSChatRoom}
	 */
	this.chatroom = null;
	this.roster = null;
	this.thread = null;
	this.subject = null;
	this.type = SNS_MESSAGE_TYPE.CHAT;

	/**
	 * 消息的内容， 该属性会被序列化为jSON字符串发送
	 * @Field
	 */
	this.body = {
		/**
		 * 消息的样式，包括字体，颜色，大小
		 */
		//style : SNSMessageStyle.getInstance(),
		/**
		 * 是否包含表情， 减少因匹配表情的正则表达式而导致的误判
		 */
		expression : 0,
		contentType : SNS_MESSAGE_CONTENT_TYPE.TEXT,

		/**
		 * 该属性根据contentType的不同而改变： 若type为text, 该属性为string字符串 若type为file或者image， 该属性为SNSFile对象
		 */
		content : null,// 当content_type为file的时候 content为SNSFile对象

		/**
		 * 消息发送的时间 //TODO 删除该属性， 由服务器计算，或者直接根据接收时间计算
		 */
		dateline : new Date().getTime()
	};
	/**
	 * 消息在界面展示的HTML字符串，可能会被filters处理和生成
	 */
	this.html;
};

/**
 * 获取此消息的展示HTML， 在templateRender中被调用
 * @returns
 */
SNSMessage.prototype.getBodyHtml = function() {
	if (!this.html || this.html.isEmpty()) {
		return this.body.content;
	}
	return this.html;
};

/**
 * 获取发送消息或接收消息的联系人， 即消息的另一方; 此方法不常用.
 * @SEE getRosterOrChatRoom()
 * @returns 消息相关的联系人
 */
SNSMessage.prototype.getRoster = function() {
	if(this.to.id == YYIMChat.getUserID()){
		return this.chatroom || this.from; 
	}else{
		return this.to; 
	}
};

/**
 * 获取消息相关的联系人或者聊天室
 * @returns 如果是一对一消息，返回联系人；如果是groupchat， 返回chatroom
 */
SNSMessage.prototype.getRosterOrChatRoom = function() {
	if (this.type == SNS_MESSAGE_TYPE.CHAT || this.type == SNS_MESSAGE_TYPE.PUBACCOUNT) {
		return this.getRoster();
	}
	else if(this.type == SNS_MESSAGE_TYPE.GROUPCHAT){
		return this.chatroom;
	}
	return this.from;
};

/**
 * 设置消息的thread属性
 * @param thread
 */
SNSMessage.prototype.setThread = function(thread) {
	if (thread && thread.notEmpty()) {
		this.thread = thread;
	}
};

/**
 * 设置消息的subject属性
 * @param subject
 */
SNSMessage.prototype.setSubject = function(subject) {
	if (subject && subject.notEmpty()) {
		this.subject = subject;
	}
};

/**
 * 获取人性化时间显示， 未对时区进行处理
 * @returns
 */
SNSMessage.prototype.getHumanizeDateString = function() {
	var dateline = this.body.dateline;
	
	if(!dateline){
		dataline = new Date();
	}
	
	if (typeof dateline == "number") {
		var d = new Date();
		d.setTime(dateline);
		dateline = d;
	}
	if (dateline && dateline instanceof Date) {
		var year = dateline.getYear();
		var month = doubleDigit(dateline.getMonth() + 1);
		var date = doubleDigit(dateline.getDate());
		var hours = doubleDigit(dateline.getHours());
		var minutes = doubleDigit(dateline.getMinutes());

		var d = new Date();

		if (year != d.getYear()) {
			return year + "-" + month + "-" + date + " " + hours + ":" + minutes;
		} else {
			if (month != d.getMonth() || date != d.getDate()) {
				return month + "-" + date + " " + hours + ":" + minutes;
			} else {
				if (hours < 12) {
					return SNS_I18N.am + hours + ":" + minutes;
				} else {
					return SNS_I18N.pm + hours + ":" + minutes;
				}
			}
		}
	}
	YYIMChat.log("snsMessage.getHumanizeDateString:invalid dateline", 1, this.dateline);
	return null;

	function doubleDigit(source) {
		if (source > 9)
			return source;
		return "0" + source;
	}
};

SNSMessage.prototype.decodeMessageStyle = function(style){
	if(style){
		return jQuery.extend(new SNSMessageStyle(), style);
	}
	return style;
};
var SNSInMessage = function() {
	this.id = Math.uuid();
}

SNSInMessage.prototype = new SNSMessage();

SNSInMessage.prototype.initRoomMessage = function(arg){
	var user = SNSApplication.getInstance().getUser();
	this.id = arg.id||this.id;
	this.type = SNS_CHAT_TYPE.GROUP_CHAT;
	this.from = user.getOrCreateRoster(arg.from.roster);
	this.to = user.getOrCreateRoster(arg.to);
	this.chatroom = user.chatRoomList.getChatRoom(arg.from.room);
	this.body = Object.clone(arg.data);
	this.body.style = this.decodeMessageStyle(arg.data.style);
};

SNSInMessage.prototype.initRosterMessage = function(arg){
	this.id = arg.id||this.id;
	this.type = SNS_CHAT_TYPE.CHAT;
	this.from = SNSApplication.getInstance().getUser().getOrCreateRoster(arg.from, arg.resource);
	this.to = SNSApplication.getInstance().getUser().getOrCreateRoster(arg.to, arg.resource);
	if(arg.resource)
		this.resource = arg.resource;
	this.body = Object.clone(arg.data);
	this.body.style = this.decodeMessageStyle(arg.data.style);
};

SNSInMessage.prototype.initDeviceMessage = function(arg){
	var user = SNSApplication.getInstance().getUser();
	this.id = arg.id||this.id;
	this.type = SNS_CHAT_TYPE.CHAT;
	this.from = user.deviceList.get(user.getID() + "/" + arg.from);
	this.body = Object.clone(arg.data);
	this.body.style = this.decodeMessageStyle(arg.data.style);
};
/**
 * arg {id, to: id, type: "groupchat"|"chat",body:object, success:function, error:function}
 */
var SNSOutMessage = function(arg){
	this.id = arg.id;
	this.to = SNSApplication.getInstance().getUser().getRosterOrChatRoom(arg.to);
	this.type = arg.type;
	
	if(this.to instanceof SNSChatRoom){
		this.chatroom = this.to;
	}

	this.body = {};
	this.body.dateline = arg.body.dateline;
	this.setBody(arg.body.content, arg.body.contentType);
	
}

SNSOutMessage.prototype = new SNSMessage();

/**
 * 设置要发送的文件
 * @param file @see SNSFile
 */
SNSOutMessage.prototype.setFile = function(file){
	if(file && file instanceof SNSFile){
		if(file.isImage == "true"){
			this.setBody(file, SNS_MESSAGE_CONTENT_TYPE.IMAGE);
			return;
		}
		this.setBody(file, SNS_MESSAGE_CONTENT_TYPE.FILE);
	}
};

/**
 * 设置要发送的图片
 * @param file @see SNSFile
 */
SNSOutMessage.prototype.setImage = function(image){
	if(image && image instanceof SNSFile){
		this.setBody(image, SNS_MESSAGE_CONTENT_TYPE.IMAGE);
	}
};

/**
 * 设置要发送的图片
 * @param file @see SNSImage
 */
SNSOutMessage.prototype.setText = function(text){
	if(text && text.notEmpty()){
		this.setBody(text, SNS_MESSAGE_CONTENT_TYPE.TEXT);
	}
};

/**
 * 综合设置message属性
 * @param to @See setTo()
 * @param type @See SNS_MESSAGE_TYPE
 * @param thread	@See setThread();
 * @param subject @See setSubject();
 */
SNSOutMessage.prototype.setMessage = function(to, type, thread, subject){
	this.setTo(to);
	this.type = type;
	this.setThread(thread);
	this.setSubject(subject);
}

/**
 * 设置发送的数据， 不推荐直接调用
 * @param content
 * @param contentType
 */
SNSOutMessage.prototype.setBody = function(content, contentType){
	if(content){
		this.body.content = content;
		if(contentType){
			this.body.contentType = contentType;
		}
	}
	//SNSApplication.getInstance().getMessageOutBox().getFilter().doFilter(this);
};
var SNSUser = function() {
	this.name;

	/**
	 * @description {JSJaCJID} 用户jid
	 * @field
	 */
	this.id;
	
	this.resource;

	/**
	 * @description {SNSVCard} 电子名片
	 * @field
	 */
	this.vcard;

	/**
	 * @description {SNSPresence} 用户的出席信息
	 * @field
	 */
	this.presence = new SNSPresence();

	/**
	 * @description {SNSRosterList} 联系人列表
	 * @field
	 */
	this.rosterList = new SNSRosterList();

	/**
	 * @description {SNSGroupList} 分组列表
	 * @field
	 */
	this.groupList = new SNSGroupList();

	/**
	 * @description {SNSRecentList} 最近联系人列表
	 * @field
	 */
	this.recentList = new SNSRecentList();

	/**
	 * @description {SNSChatRoomList} 房间列表
	 * @field
	 */
	this.chatRoomList = new SNSChatRoomList();

	/**
	 * @description {SNSSystemRoster} 系统提醒
	 * @field
	 */
	this.systemRoster = new SNSSystemRoster();

	/**
	 * 我的设备列表
	 */
	this.deviceList = new SNSDeviceList();
	
	this._queryingVCard = false;
	
	this._localSearchResult = [];
};

SNSUser.prototype._init = function() {
	YYIMChat.log("SNSUser.prototype.init", 3);
}
/**
 * 更改用户的在线状态, 并通知服务器
 * @param presence {string | JSJaCPresence} 将要改变的presence
 * @param updateServer {boolean} 是否通知服务器状态改变，默认为否.[optional]
 * @return jQuery.Deferred对象，使用方式如下： jQuery.when(snsUser.setPresence()).done(function(){ //do something });
 */
SNSUser.prototype.setPresence = function(presence, updateServer) {
	var old = Object.clone(this.presence);
	if (presence) {
		if (typeof presence == "string") {
			this.presence.setStatus(presence);
		} else if (presence instanceof SNSPresence) {
			this.presence = presence;
		}
		
		// 通知服务器返回的包不走回调，监听方法内调setPresence来渲染
		if(!updateServer){
			SNSApplication.getInstance().getGlobalEventManager().trigger(SNS_EVENT_SUBJECT.ON_USER_PRESENCE_CHANGE, []);
		}
		
		if (old.equals(this.presence)) {
			return;
		}

		if (updateServer) {
			YYIMChat.setPresence({
				status: this.presence.status,
				type: this.presence.type
			});
		}
	}
};

/**
 * 得到自己的头像路径
 */
SNSUser.prototype.getPhotoUrl = function() {
	if (this.vcard) {
		if (this.vcard.getPhotoUrl().notEmpty()) {
			return this.vcard.getPhotoUrl();
		}
	} else {
		this.requestVCard();
	}
	return SNSConfig.USER.DEFAULT_AVATAR;
}

/**
 * 请求自己的VCard
 */
SNSUser.prototype.requestVCard = function(){
	if (this._queryingVCard) {
		return this._vcardDefer;
	}
	this._queryingVCard = true;

	this._vcardDefer = jQuery.Deferred();
	var that = this;
	YYIMChat.getVCard({
		success : function(vcardResult) {
			that.setVCard(new SNSVCard(vcardResult));
			that._vcardDefer.resolve();
			that._queryingVCard = false;
		},
		error : function() {
			that._vcardDefer.reject();
			that._queryingVCard = false;
		}
	});
	return this._vcardDefer.promise();
};

/**
 * 请求所有好友的VCard
 */
SNSUser.prototype.requestRosterVCards = function() {
	var that = this;
	YYIMChat.getVCards({
		success : function(vcards) {
			var i = vcards.length;
			while(i--) {
				var vcard = vcards[i],
					roster = that.getRoster(vcard.userId);
				roster.setVCard(new SNSVCard(vcard));
				roster.changePhoto && roster.changePhoto(vcard.photo);
			}
		}
	});
};

SNSUser.prototype.setVCard = function(vcard) {
	this.vcard = vcard;
};

/**
 * 请求好友列表的回调函数
 * @param list {JSON}
 */
SNSUser.prototype.rosterListHandler = function(list) {
	var rosterList = JSON.parse(list);
	if(!rosterList || rosterList.length <= 0)
		return;
	
	for(var i = 0; i < rosterList.length; i++){
		var roster = new SNSRoster(rosterList[i].id);
		roster.name = rosterList[i].name;
		roster.ask = rosterList[i].ask;
		roster.photoUrl = rosterList[i].photo;// ? rosterList[i].photo : SNSConfig.USER.DEFAULT_AVATAR;
		roster.subscription = rosterList[i].subscription;

		if(roster.subscription != SNS_SUBSCRIBE.BOTH)
			continue;
		
		var groupNames = rosterList[i].group;
		if(!groupNames || groupNames.length == 0){
			roster.addToGroup(this.groupList.getGroup(SNSConfig.GROUP.GROUP_NONE), true);
		}else{
			for (var j = 0; j < groupNames.length; j++) {
				var group = this.groupList.getGroup(groupNames[j]);
				if(!group){
					group = this.groupList.addGroup(groupNames[j]);
				}
				roster.addToGroup(group, true);
			}
		}
		this.addRoster(roster);
	}
	
	this.requestRosterVCards();
};

/**
 * 添加联系人到user的rosterList中，如果包含group，则会放到相应的group中。 若已经存在，则完全覆盖之前的roster对象，包括group.recent 添加成功后激发全局事件ON_ADD_ROSTER，事件的参数包括新旧roster
 * @param roster {SNSSRoster} 被添加的联系人
 */
SNSUser.prototype.addRoster = function(roster, ignoreCompare) {
	var old = this.getRoster(roster);

	if (!ignoreCompare && old == roster)
		return;

	this.rosterList.add(roster);

	SNSApplication.getInstance().getGlobalEventManager().trigger(SNS_EVENT_SUBJECT.ON_ADD_ROSTER, [ {
		newValue : roster,
		oldValue : old
	} ]);

};

/**
 * 如果已存在，则直接返回roster对象；不存在则新建并返回roster
 * @param id
 * @param resource
 * @return {SNSRoster}
 */
SNSUser.prototype.getOrCreateRoster = function(id, resource) {
	var roster = this.getRoster(id);
	if (!roster) {
		roster = new SNSRoster(id);
		if(resource)
			roster.resource = resource;
		this.addRoster(roster);
	}
	return roster;
};

/**
 * 返回对应jid的联系人
 * @param oArg {JSJaCJID | string }
 * @returns
 */
SNSUser.prototype.getRoster = function(id) {
//	var roster = this.deviceList.get(id);
//	if(roster)
//		return roster;
	if(this.systemRoster.getID() == id)
		return this.systemRoster;
	return this.rosterList.get(id);
};

/**
 * 返回对应jid的联系人或聊天室
 * @param jid 可以为完整JID或者不包含resource的jid, 或者roster对象或者chatRoom对象
 * @returns
 */
SNSUser.prototype.getRosterOrChatRoom = function(oArg) {
	if (this.chatRoomList.getChatRoom(oArg)) {
		return this.chatRoomList.getChatRoom(oArg);
	}
	return this.getRoster(oArg);
};

SNSUser.prototype.getRoom = function(id){
	return this.chatRoomList.getChatRoom(id);
};
/**
 * 好友关系更新，如果为both则为新增加好友
 * @param arg { from: node@domain/resource,	type: "subscribe", name, ask , group: Array<String>}
 */
SNSUser.prototype.rosterUpdateHandler = function(arg){
	var rosterId = arg.from;
	
	var roster = this.getRoster(rosterId);

	if(!roster){
		roster = new SNSRoster(rosterId);
		if(!arg.group || arg.group.length == 0){
			roster.addToGroup(this.groupList.getGroup(SNSConfig.GROUP.GROUP_NONE), true);
		}else{
			for (var i = 0; i < arg.group.length; i++) {
				var group = this.groupList.getGroup(arg.group[i]);
				if(!group){
					group = this.groupList.addGroup(arg.group[i]);
				}
				roster.addToGroup(group, true);
			}
		}
	}
	// 之前就已经是好友了，有可能是备注或者组的变化收到该包
	if(roster.subscription == SNS_SUBSCRIBE.TO || roster.subscription == SNS_SUBSCRIBE.BOTH){
		// 被好友删除
		if(arg.type == SNS_SUBSCRIBE.NONE){
			roster.subscription = arg.type;
			SNSApplication.getInstance().getGlobalEventManager().trigger(SNS_EVENT_SUBJECT.ON_REMOVE_ROSTER, [ {roster:roster} ]);
		}
		return;
	}
	
	roster.ask = arg.ask;
	roster.name = arg.name ? arg.name : roster.getID();
	roster.subscription = arg.type;
	if(roster.subscription == SNS_SUBSCRIBE.TO || roster.subscription == SNS_SUBSCRIBE.BOTH){
		this.addRoster(roster, true);
		// 新增加好友
		SNSApplication.getInstance().getGlobalEventManager().trigger(SNS_EVENT_SUBJECT.ON_APPROVE_SUBSCRIBED, [roster]);
	}
};

SNSUser.prototype.getGroupList = function(){
	return this.groupList;
};

SNSUser.prototype.getRosterListByGroup = function(group){
	return this.groupList.getGroup(group);
};

/**
 * 从本地删除好友
 * @param roster
 */
SNSUser.prototype.removeRosterFromLocal = function(roster){
	this.rosterList.remove(roster.id);
	for(var groupName in this.groupList._list){
		this.groupList._list[groupName].remove(roster.id);
	}
};

/**
 * 请求公共号列表的回调函数
 * @param list {JSON}
 */
SNSUser.prototype.pubAccountListHandler = function(list){
	var pubAccountList = JSON.parse(list);
	if(!pubAccountList || pubAccountList.length <= 0)
		return;
	
	for(var i = 0; i < pubAccountList.length; i++){
		var pubAccount = new SNSPublicAccountRoster(pubAccountList[i].id);
		pubAccount.name = pubAccountList[i].name;
		this.addRoster(pubAccount);
	}
};

/**
 * 获取没有app key和etp key的node
 */
SNSUser.prototype.getID = function(){
	return this.id;
};

/**
 * 本地搜索，如果searchRoster和searchChatRoom均为空，则都搜索
 * @param keyword
 * @param searchRoster boolean 是否搜索本地好友
 * @param searchChatRoom boolean 是否搜索本地群组
 */
SNSUser.prototype.localSearch = function(keyword, searchRoster, searchChatRoom) {
	this._localSearchResult = [];
	if(!keyword)
		return null;
	if(searchRoster == undefined && searchChatRoom == undefined){
		return this.localSearch(keyword, true, true);
	}
	if(searchRoster || searchChatRoom){
		if(searchRoster){
			match(this.rosterList._list);
		}
		if(searchChatRoom){
			match(this.chatRoomList._list);
		}
		return this._localSearchResult;
	}
	return this._localSearchResult;
	
	function match(list){
		for(var jid in list){
			var name = list[jid].name;
			if(name.indexOf(keyword, 0) >= 0){
				SNSApplication.getInstance().getUser()._localSearchResult.push(list[jid]);
			}
		}
	}
};
/**
 * 表示群共享的文件 继承自
 * @See SNSFile
 * @Class SNSChatRoomFile
 */
var SNSChatRoomFile = function(name,path, size) {
	this.downloads = 0;
	this.creator;
	this.time;
};

SNSChatRoomFile.prototype = new SNSFile();

/**
 * 聊天室的上传文件列表
 * @Class SNSChatRoomFileList
 */
var SNSChatRoomFileList = function(id) {
	this._roomId = id;

	/**
	 * 文件列表
	 * @Type{SNSChatRoomFile[]}
	 * @Field
	 */
	this._list = new Array();
	this._requested = false;
}

/**
 * 清空文件列表，用于刷新文件列表
 * @returns {Array}
 */
SNSChatRoomFileList.prototype.clear = function() {
	this._list = [];
	return this._list;
};

SNSChatRoomFileList.prototype.getList = function() {
	return this._list;
};

SNSChatRoomFileList.prototype.addFile = function(file) {
	this._list.push(file);
	this._list.sort(function(a, b) {// 按照上传时间倒序排列
		return b.timestamp - a.timestamp;
	});
	return this._list;
};
/**
 * 获取群共享文件
 */
SNSChatRoomFileList.prototype.requestSharedFiles = function() {
	var defer = jQuery.Deferred(),
		that = this;
	
	YYIMChat.getSharedFiles({
		id : this._roomId,
		start : 0,
		size : 20,
		success : function(sharedFilesResult) {
			that.clear();
			
			that._requested = true;
			var _files = sharedFilesResult.files,
				i = _files.length;
			while (i--) {
				var sharedFile = new SNSChatRoomFile();
				sharedFile.name = _files[i].name;
				sharedFile.size = new SNSFile("","",_files[i].size).size;
				sharedFile.downloads = _files[i].downloads;
				sharedFile.creator = _files[i].creator;
				sharedFile.time = _files[i].createTime;
				sharedFile.type = _files[i].type.toLowerCase();
				sharedFile.path = YYIMChat.getFileUrl(_files[i].attachId);
				that.addFile(sharedFile);
			}

			defer.resolve();
		}
	});

	return defer.promise();
};

SNSChatRoomFileList.prototype.hasRequested = function(){
	return this._requested;
};

/**
 * 消息类型为文件时，加入共享文件
 * @param {SNSMessage} message
 */
SNSChatRoomFileList.prototype.addFileFromMessage = function(message) {
	var sharedFile = new SNSChatRoomFile(message.body.content.name, message.body.content.path, message.body.content.size);
	sharedFile.downloads = 0;
	sharedFile.time = new Date(message.body.dateline).format("yyyy-MM-dd");
	if (message instanceof SNSInMessage) {
		sharedFile.creator = message.from.name;
	} else {
		sharedFile.creator = SNSApplication.getInstance().getUser().name;
	}
	this.addFile(sharedFile);
};

/**
 * 表示聊天室, 包含聊天室的邀请， 成员管理等方法
 * @Class SNSChatRoom
 */
var SNSChatRoom = function(id) {
	/**
	 * 聊天室的JID
	 * @Type {JSJaCJID}
	 */
	this.id = id;

	/**
	 * 聊天室的名称
	 * @Type {string}
	 */
	this.name;
	this.desc;
	this.creationData;
	// 我在该房间的昵称
	this.nickname;
	this.show = "chatroom";
	this.type = SNS_CHAT_ROOM_TYPE.RESERVED;
	this.photoUrl; // = SNSConfig.CHAT_ROOM.DEFAULT_AVATAR;

	/**
	 * 聊天室的成员列表
	 * @Type {SNSRosterList}
	 */
	this.rosterList = new SNSRosterList();

	/**
	 * 聊天室的文件列表
	 * @Type {SNSChatRoomFileList}
	 */
	this.fileList = new SNSChatRoomFileList(this.id);
	
	this.infoQueryed = false;
	this.memberListQueryed = false;
};

SNSChatRoom.prototype.getPhotoUrl = function(){
	return this.photoUrl ? YYIMChat.getFileUrl(this.photoUrl) : SNSConfig.CHAT_ROOM.DEFAULT_AVATAR;
};

/**
 * 向聊天室中增加成员
 * @param roster SNSRoster
 * @returns {SNSRoster} 被添加的联系人对象
 */
SNSChatRoom.prototype.addMember = function(roster) {
	if(!roster)
		return;
	// update
	if (this.rosterList.contains(roster)) {
		this.updateMemberPhoto(roster);
		return;
	}
	this.rosterList.add(roster);
	return roster;
};

/**
 * 更新成员头像
 * @param roster
 */
SNSChatRoom.prototype.updateMemberPhoto = function(newRoster) {
	if(!this.rosterList.get(newRoster.id))
		return;
	if(newRoster.photoUrl){
		this.rosterList.get(newRoster.id).photoUrl = newRoster.photoUrl;
	}
};

/**
 * 成员列表的回调方法
 * @param list
 */
SNSChatRoom.prototype.queryMembersHandler = function(list) {
	var memberList = JSON.parse(list);
	if(!memberList || memberList.length <= 0)
		return;
	this.memberListQueryed = true;
	for(var i = 0; i < memberList.length; i++){
		var roster = new SNSChatRoomMemberRoster(memberList[i].id, memberList[i].name);
		roster.photoUrl = memberList[i].photo;
		if(memberList[i].affiliation){
			roster.affiliation = memberList[i].affiliation;
		}
		this.addMember(roster);
	}
};

/**
 * 房间的成员列表
 * @param list
 */
SNSChatRoom.prototype.setMemberList = function(list){
	for (var i = 0; i < list.length; i++) {
		this.addMember(list[i]);
	}
};

/**
 * 查询房间信息,这里先主要获取房间名
 */
SNSChatRoom.prototype.queryInfo = function(){
	var defer = jQuery.Deferred();
	var that = this;
	YYIMChat.getChatGroupInfo({
		id : this.getID(),
		success : function(info) {
			that.infoQueryed = true;
			that.name = info.name;
			that.desc = info.desc;
			defer.resolve();
		},
		error : function() {
			defer.reject();
		}
	});
	return defer.promise();
};

/**
 * 更新名字，描述，头像
 * @param oArg {name, desc, photoUrl}
 */
SNSChatRoom.prototype.update = function(oArg){
	if(!oArg)
		return;
	
	// 是否需要发送表单
	var notChanged = true, that = this;
	if((oArg.name && oArg.name != this.name)
			|| (oArg.desc && oArg.desc != this.desc)
			|| (oArg.photoUrl && oArg.photoUrl != this.photoUrl)){
		
		var defer = jQuery.Deferred();
		YYIMChat.updateChatGroup({
			id : this.getID(),
			name : oArg.name,
			desc : oArg.desc,
			photo : oArg.photoUrl,
			success : function() {
				that.name = oArg.name || oArg.name;
				that.desc = oArg.desc || that.desc;
				that.photoUrl = oArg.photoUrl || that.photoUrl;
				defer.resolve();
			},
			error : function() {
				defer.reject();
			}
		});
		return defer.promise();
	}
};

SNSChatRoom.prototype.getMe = function(){
	return this.rosterList.get(SNSApplication.getInstance().getUser().id);
};

/**
 * 获取没有app key和etp key的node
 */
SNSChatRoom.prototype.getID = function(){
	return this.id;
};

var SNSChatRoomList = function() {

}

SNSChatRoomList.prototype = new SNSBaseRosterList();

SNSChatRoomList.prototype.setChatRoomList = function(list){
	for(var i = 0; i < list.length; i++){
		this.add(list[i]);
	}
	SNSApplication.getInstance().getGlobalEventManager().trigger(SNS_EVENT_SUBJECT.AFTER_LOAD_CHATROOM, []);
};
/**
 * 返回房间列表的回调函数
 * @param list {JSON}
 */
SNSChatRoomList.prototype.chatRoomListHandler = function(list) {
	var chatRoomList = JSON.parse(list);
	if(!chatRoomList || chatRoomList.length <= 0)
		return;
	
	var chatrooms = [];
	for(var i = 0; i < chatRoomList.length; i++){
		var chatRoom = new SNSChatRoom(chatRoomList[i].id);
		chatRoom.name = chatRoomList[i].name? chatRoomList[i].name.substr(0,20): 'noname';
		if(chatRoomList[i].photo){
			chatRoom.photoUrl = chatRoomList[i].photo;
		}
		// nickname?
		chatRoom.nickname = SNSApplication.getInstance().getUser().id;
		chatRoom.type = SNS_CHAT_ROOM_TYPE.RESERVED;
		chatrooms.push(chatRoom);
	}
	this.setChatRoomList(chatrooms);
};

SNSChatRoomList.prototype.addChatRoom  = function(chatroom){
	if(this.add(chatroom)){
		SNSApplication.getInstance().getGlobalEventManager().trigger(SNS_EVENT_SUBJECT.ON_ADD_CHATROOM,[chatroom]);
	}
};

SNSChatRoomList.prototype.getChatRoom = function(chatRoom) {
	return this.get(chatRoom);
};

/**
 * 创建房间结果的处理方法
 * @param arg {name, node, desc, nickName, success: function, error: function, complete:function}
 * 
 * @returns room
 */
SNSChatRoomList.prototype.createRoomHandler = function(arg){
	var room = new SNSChatRoom(arg.node);
	room.name = arg.name;
	room.desc = arg.desc;
	room.nickname = arg.nickname;
	this.addChatRoom(room);
	return room;
};
/**
 * 用户的联系人分组
 * @Class SNSGroup
 * @constructor {string} name 分组的名称
 */
var SNSGroup = function(name) {
	/**
	 * 分组的名称
	 * @Param {string}
	 */
	this.name = name;
	this.editable = true; // 可以移动和复制好友至该分组
};

SNSGroup.prototype = new SNSBaseRosterList();

/**
 * 获取该分组中在线总人数
 * @return {Number}
 */
SNSGroup.prototype.getOnlineNumber = function(){
	var num = 0;
	for(var roster in this._list){
		if(this._list[roster] && this._list[roster] instanceof SNSRoster){
			var status  = this._list[roster].presence.status;
			if (status != SNS_STATUS.UNAVAILABLE){
				num++;
			}
		}
	}
	return num;
};

/**
 * 获取该分组中在线的联系人列表
 * @returns {SNSRoster[]}
 */
SNSGroup.prototype.getOnlineRosters = function(){
	var rosters = [];
	for(var roster in this._list){
		if(roster && roster instanceof SNSRoster){
			var status  = roster.presence.status;
			if (status != SNS_STATUS.UNAVAILABLE){
				rosters.push(roster);
			}
		}
	}
	return rosters;   
};

/**
 * 向该分组中添加联系人
 * @param roster {SNSRoster} 被添加的联系人对象
 */
SNSGroup.prototype.addRoster = function(roster){
	roster.addToGroup(this);
};

/**
 * 从该分组中删除联系人
 * @param roster {SNSRoster} 被添加的联系人对象
 */
SNSGroup.prototype.removeRoster = function(roster){
	if(roster && roster instanceof SNSRoster){
		roster.removeFromGroup(this);
	}
};


/**
 * 保存联系人的分组信息
 * @class SNSGroupList
 */
var SNSGroupList = function() {
	this.groupNone = new SNSGroup(SNSConfig.GROUP.GROUP_NONE);
	this.publicServiceGroup = SNSPublicServiceGroup.getInstance();
	this.deviceGroup = new SNSDeviceGroup();
	this.addGroup(this.groupNone);
	this.addGroup(this.publicServiceGroup);
	this.addGroup(this.deviceGroup);
}

SNSGroupList.prototype = new SNSBaseList();

/**
 * @param group {string|SNSGroup}
 * @returns {SNSGroup}
 */
SNSGroupList.prototype.getGroup = function(group) {
	if (group) {
		if (typeof group == "string") {
			return this.get(group);
		} else if (group instanceof SNSGroup) {
			return this.get(group.name);
		}
	}
};

/**
 * 判断是否存在指定名称的分组
 * @param groupName 指定的分组名称
 * @returns {boolean} 是否已存在分组
 */
SNSGroupList.prototype.contains = function(group) {
	if (group) {
		if (typeof group == "string") {
			return SNSBaseList.prototype.contains.call(this, group);
		} else if (group instanceof SNSGroup) {
			return SNSBaseList.prototype.contains.call(this, group.name);
		}
	}
};

/**
 * 添加指定名称的分组，若分组以存在则直接返回
 * @param group {SNSGroup|String} 被添加的Group的名称
 * @returns {SNSGroup}
 */
SNSGroupList.prototype.addGroup = function(group) {

	if (this.contains(group))
		return this.get[group];

	if (group) {
		if (typeof group == "string") {
			SNSGroupList.checkGroupName(group);
			var group = new SNSGroup(group);
			this.add(group.name, group);
			return group;
		} else if (group instanceof SNSGroup) {
			this.add(group.name, group);
			return group;
		}
	}

};

/**
 * 添加联系人，并且根据联系人中的分组信息，将用户添加到相应的group的rosterList中
 * @param roster 被添加的联系人
 */
SNSGroupList.prototype.addRoster = function(roster) {
	if (roster && roster instanceof SNSRoster) {
		for (var i = 0; i < roster.groups.length; i++) {
			var group = this.getGroup(roster.groups[i]);
			if (!group) {
				group = this.addGroup(roster.groups[i]);
			}
			group.add(roster);
		}
	}
};

/**
 * 返回分组的数组形式
 * @returns {SNSGroup[]}
 */
SNSGroupList.prototype.toArray = function() {
	var groups = [];
	for ( var group in this._list) {
		if (this._list[group] && this._list[group] instanceof SNSGroup) {
			groups.push(this._list[group]);
		}
	}
	return groups;
};

/**
 * 检查用户设置的备注名， 如果不符合规范则抛出异常，特殊字符配置
 * @See SNSConfig.GROUP.NAME_FORBIDDEN
 * @param {string} name 被检查的备注名
 * @Throws 分组名称不符合规范时
 */
SNSGroupList.checkGroupName = function(name) {
	if (!name || name === '')
		throw "groupname cannot be empty ";
	for (var i = 0; i < SNSConfig.GROUP.NAME_FORBIDDEN.length; i++) {
		if (name.indexOf(SNSConfig.GROUP.NAME_FORBIDDEN[i]) != -1) {
			throw "forbidden char in groupname: " + SNSConfig.GROUP.NAME_FORBIDDEN[i];
		}
	}
}

/**
 * 移动或复制好友
 * @param oArg jid srcGroupName dstGroupName type
 * @returns 可用组名列表
 */
SNSGroupList.prototype.moveRoster = function(roster, operation, srcGroup, targetGroup) {

	if (operation == SNS_MOVE_ROSTER_TYPE.MOVE) {
		roster.moveBetweenGroups(srcGroup, targetGroup);
	} else if (operation == SNS_MOVE_ROSTER_TYPE.COPY) {
		this.getGroup(targetGroup).addRoster(roster);
	}
};

/**
 * 获取不包含id所属用户的组名, 用户可被移动和复制到的组，不包含“未分组”
 * @param rosterId
 * @returns 可用组名列表
 */
SNSGroupList.prototype.availableGroups = function(rosterId) {

	var avaGroups = new Array();
	for ( var group in this._list) {
		if (this._list[group].editable && !this._list[group].contains(rosterId) && group !== SNSConfig.GROUP.GROUP_NONE) {
			avaGroups.push(this._list[group]);
		}
	}
	return avaGroups;
};

/**
 * 表示用户的出席信息 可以使用presence出席状态报文对该类进行初始化，注意和subscribe报文进行区别
 * @Class SNSPresence
 * @param arg {from, type, show: "available", status}
 */
var SNSPresence = function(arg) {
	this.status = SNS_STATUS.UNAVAILABLE;
	if (arg) {
		this.resource = arg.resource;
		this.type = arg.type;
		this.status = arg.status;
	}
};

SNSPresence.prototype.equals = function(presence) {
	if (presence && presence instanceof SNSPresence) {
		if (presence.status == this.status && this.priority == presence.priority) {
			return true;
		}
		return false;
	}
	return false;
};

/**
 * 更改出席状态，若status为null, 默认将status和show均设置为show status字符串长度不超过30个字符
 * @param show {string} 出席状态
 * @See SNSPresence.SNS_STATUS
 * @param status {string} 自定义状态信息
 */
SNSPresence.prototype.setStatus = function(status) {
	for ( var i in SNS_STATUS) {
		if (status == SNS_STATUS[i]) {
			this.status = status;
			return;
		}
	}
};
/**
 * 存储最近联系人列表，渲染的通知事件由其他事件激发
 * @Class SNSRecentList
 */
var SNSRecentList = function() {

	/**
	 * 最近联系人列表，存储联系人的bareJID
	 * 
	 * @Param {object[]} {id,message} jid为bareJID, message为消息对应的content
	 */
	this.list = new Array();

}

SNSRecentList.prototype.getFirstItem= function(){
	if(this.list.length>0){
		return this.list[0];
	}
}

/**
 * 判断最近联系列表中是否有该联系人
 * @param {string | JSJaCJID |SNSRoster} id 被判断的联系人或者联系人的JID
 * @return {boolean}
 */
SNSRecentList.prototype.contains = function(id){
	for(var i=0; i<this.list.length; i++){
		if(id == this.list[i].id){
			return true;
		}
	}
	return false;
};

SNSRecentList.prototype.addNewRoster = function(rosterId,message){
	if (this.list[0] && this.list[0].id == rosterId) {
		return;
	}

	// 添加到数组
	var length = this.list.unshift({id:rosterId, message:message? message.body.content:''});

	// 删除之前的位置
	for (var i = 1; i < length; i++) {
		if (this.list[i].id == rosterId) {
			this.list.splice(i, 1);
			break;
		}
	}

	// 如果超出指定长度删除最后一个
	if (this.list.length > SNSConfig.RECENT.MAX_SIZE) {
		this.list.pop();
	}

	SNSApplication.getInstance().getGlobalEventManager().trigger(SNS_EVENT_SUBJECT.ADD_TO_RENCENT, []);
};

/**
 * 添加新的联系人
 * @param{SNSMessage}  message 最近发送的消息
 */
SNSRecentList.prototype.addNew = function(message) {
	var roster = message.getRosterOrChatRoom();
	var rosterId = roster.id;
	this.addNewRoster(rosterId);
};
var SNSRoster = function(id, name) {

	/**
	 * @description {string} 联系人的备注名，若没有备注名，则和jid中的Node相同
	 * @field
	 */
	this.name;

	/**
	 * @description {JSJaCJID} 联系人身份标识
	 * @field
	 */
	this.id;

	// 好友列表中直接返回头像url，无需请求vcard
	this.photoUrl;
	
	/**
	 * @description {SNSVCard} 联系人电子名片
	 * @field
	 */
	this.vcard;

	/**
	 * @description {SNSPresence} 联系人在线状态信息
	 * @field
	 */
	this.presence = new SNSPresence();

	/**
	 * @description {SNSGroup[]} 联系人所在用户的分组列表
	 * @field
	 */
	this.groups = new Array();

	/**
	 * @description {string} 联系人和用户的订阅关系，默认为NONE
	 * @field
	 */
	this.subscription = SNS_SUBSCRIBE.NONE;
	
	this.resource;

	/**
	 * @description {string} 若该联系人接收到用户的订阅请求且未答复，该属性的值为subscribe,否则为空字符串
	 * @field
	 */
	this.ask = '';

	if (id) {
		this.id = id;
		this.name = name? name : id;
	}

	this._queryingVCard = false;
	this._vcardDefer;
};

SNSRoster.prototype.getPhotoUrl = function() {
	return this.photoUrl ? YYIMChat.getFileUrl(this.photoUrl) : SNSConfig.USER.DEFAULT_AVATAR;
}

/**
 * 修改联系人备注，并提交到服务器
 * @param {string} name, 新的备注名
 * @throws 如果更改失败将抛出异常
 * @returns {jQuery.Deferred} 延迟对象，方便获取返回信息
 */
SNSRoster.prototype.rename = function(name) {
	SNSRoster.checkName(name);
	this.name = name;
	return this.update();
};

/**
 * 将联系人添加的指定的分组， 并提交到服务器
 * @param group
 * @returns {jQuery.Deferred} 延迟对象，方便获取返回信息
 */
SNSRoster.prototype.addToGroup = function(group, ignoreUpdate) {
	if (group && group instanceof SNSGroup) {
		for (var i = 0; i < this.groups.length; i++) {
			if (this.groups[i].name == group.name) {
				return;
			}
		}
		this.groups.push(group);
		group.add(this);
		if(ignoreUpdate)
			return;
		return this.update();
	}
};

/**
 * 将联系人添加的指定的分组， 并提交到服务器
 * @param group {SNSGroup}
 * @returns {jQuery.Deferred} 延迟对象，方便获取返回信息
 */
SNSRoster.prototype.removeFromGroup = function(group) {
	if (group && group instanceof SNSGroup) {
		for (var i = 0; i < this.groups.length; i++) {
			if (this.groups[i].name == group.name) {
				group.remove(this);
				this.groups.splice(i, 1);
				return;
			}
		}
		return this.update();
	}
};

/**
 * 将联系人添加的指定的分组， 并提交到服务器
 * @param group {SNSGroup}
 * @returns {jQuery.Deferred} 延迟对象，方便获取返回信息
 */
SNSRoster.prototype.moveBetweenGroups = function(srcGroup, targetGroup) {
	for (var i = 0; i < this.groups.length; i++) {
		if (this.groups[i].name == srcGroup.name) {
			this.groups.splice(i, 1);
			srcGroup.remove(this.getID());
		}
	}
	this.groups.push(targetGroup);
	targetGroup.add(this);
	return this.update();
};

/**
 * 提交联系人信息到服务器，包括备注名改变，分组改变
 */
SNSRoster.prototype.update = function() {
	var defer = jQuery.Deferred(),
		_groups = [],
		i = this.groups.length;
	while(i--) 
		_groups.push(this.groups[i].name)

	YYIMChat.updateRosterItem({
		roster : {
			id : this.getID(),
			name : this.name,
			groups : _groups
		},
		success : function() {
			defer.resolve();
		},
		error : function() {
			defer.reject();
		}
	});

	return defer.promise();
};

/**
 * 改变roster的在线状态信息， 同时发送全局事件通知ON_ROSTER_PRESENCE_CHANGE
 * @param {SNSPresence} presence 出席信息对象
 */
SNSRoster.prototype.setPresence = function(presence) {
	if (presence && presence instanceof SNSPresence && presence != this.presence) {
		var old = this.presence;
		this.presence = presence;

		SNSApplication.getInstance().getGlobalEventManager().trigger(SNS_EVENT_SUBJECT.ON_ROSTER_PRESENCE_CHANGE, [ {
			target : this,
			newValue : this.presence,
			oldValue : old
		} ]);

	}
};

SNSRoster.prototype.changePhoto = function(photo) {
	this.photoUrl = photo;
	
	SNSApplication.getInstance().getGlobalEventManager().trigger(SNS_EVENT_SUBJECT.ON_ROSTER_PHOTO_CHANGE, [{
		photo : photo,
		rosterId : this.getID()
	}]);
};

SNSRoster.prototype.getVCard = function() {
	if (this.vcard) {
		return this.vcard;
	}
};

/**
 * 当vcard加载完毕后执行操作
 * @param {object} scope 执行callback的上下文环境
 * @param {function} callback 被执行的函数
 * @param {arguments|array} 数组或者arguments对象
 */
SNSRoster.prototype.whenVCardDone = function(scope, callback, arg) {
	if (this.vcard) {
		callback.apply(scope, arg);
		return;
	}
	jQuery.when(this.queryVCard()).done(function() {
		callback.apply(scope, arg);
	}).fail(function() {
		throw "execute error";
	});
}

/**
 * 使用jQuery的延迟对象Deferred();
 * @Param
 * @returns jQuery.Deferred对象，使用方式如下： jQuery.when(roster.queryVCard()).done(function(){ //do something });
 * @throws 如果查询失败将抛出异常或jQuery.deferred.reject对象
 */
SNSRoster.prototype.queryVCard = function() {
	if (this._queryingVCard) {
		return this._vcardDefer;
	}
	this._queryingVCard = true;

	this._vcardDefer = jQuery.Deferred();
	var that = this;
	YYIMChat.getVCard({
		id : that.getID(),
		success : function(vcardResult) {
			that.setVCard(new SNSVCard(vcardResult));
			that._vcardDefer.resolve();
			that._queryingVCard = false;
		},
		error : function() {
			that._vcardDefer.reject();
			that._queryingVCard = false;
		}
	});
	return this._vcardDefer.promise();
}

/**
 * 设置联系人的vcard属性，同时发送触发全局事件通知,包括before_vcard_change和after_vcard_change
 * @param {SNSVCard} vcard
 */
SNSRoster.prototype.setVCard = function(vcard) {
	this.vcard = vcard;
};

/**
 * 检查用户设置的备注名， 如果不符合规范则抛出异常，特殊字符配置
 * @See SNSConfig.ROSTER.NAME_FORBIDDEN
 * @param {string} name 被检查的备注名
 * @Throws 名称不符合规范时
 */
SNSRoster.checkName = function(name) {
	if (!name || name === '')
		throw "rostername cannot be empty ";
	for (var i = 0; i < SNSConfig.ROSTER.NAME_FORBIDDEN.length; i++) {
		if (name.indexOf(SNSConfig.ROSTER.NAME_FORBIDDEN[i]) != -1) {
			throw "forbidden char in rostername: " + SNSConfig.ROSTER.NAME_FORBIDDEN[i];
		}
	}
};

/**
 * 对比两个联系人对象是否相同
 * @param roster 要比较的对象
 */
SNSRoster.prototype.equals = function(roster) {
	if (roster && roster instanceof SNSRoster) {
		if (!this.jid.isEntity(roster.jid) || this.name != roster.name || this.subscription != roster.subscription
				|| this.presence.show != roster.presence.show) {
			return false;
		}
		var matchNum = 0;
		if (this.groups.length == roster.groups.length) {
			for (var i = 0; i < this.groups.length; i++) {
				for (var m = 0; m < roster.groups.length; m++) {
					if (this.groups[i].name == roster.groups[m].name) {
						matchNum++;
						break;
					}
				}
			}
			if (matchNum == roster.groups.length) {
				return true;
			}
			return false;
		}
		return false;
	}
	return false;
};

/**
 * 获取没有app key和etp key的node
 */
SNSRoster.prototype.getID = function(){
	return this.id;
};

/**
 * 存储用户的联系人列表，提供CRUD方法，和其他过滤方法。
 * 
 * @Class SNSRosterList
 */
var SNSRosterList = function() {
};

SNSRosterList.prototype = new SNSBaseRosterList();

/**
 * 返回在线的联系人，出席状态show可以为available, away, dnd, xa
 * 
 * @return {SNSRoster[]} 按照SHOW_PRIORITY中的权重值从小到大排序好的在线联系人列表
 */
SNSRosterList.prototype.getOnlineRosters = function() {
	var rosters = [];
	for ( var roster in this.list) {
		var status = roster.presence.status;
		if (status != SNS_STATUS.UNAVAILABLE) {
			rosters.push(roster);
		}
	}
	
	return this.sortByStatus(rosters);
};

SNSRosterList.prototype.sortByStatus = function(array){
	if(!array){
		var list = this.toArray().sort(sort);
		return list;
	}
	if(array && array instanceof Array ){
		var result = array.sort(sort);
		return result;
	}
	
	function sort(r1, r2){
		return SNS_SHOW_PRIORITY[r1.presence.status.toUpperCase()] - SNS_SHOW_PRIORITY[r2.presence.status.toUpperCase()];
	}
}

/**
 * 返回出席状态为available的联系人
 * 
 * @return {SNSRoster[]}
 */
SNSRosterList.prototype.getAvailableRosters = function() {
	var rosters = [];
	for ( var roster in this.list) {
		var status = roster.presence.status;
		if (status == SNS_STATUS.AVAILABLE) {
			rosters.push(roster);
		}
	}
	return rosters;
};

/**
 * 获取指定订阅关系的联系人
 * 
 * @param {string...} 指定的订阅关系，可以为多个，使用不定参数
 * @See SNS_SUBSCRIBE
 * @return {SNSRoster[]}
 */
SNSRosterList.prototype.getRostersBySubscription = function(sub1, sub2, sub3) {
	var rosters = [];
	for ( var roster in this.list) {
		var sub = roster.subscription;
		for (var i = 0; i < arguments.length; i++) {
			if (argumetns[i] == sub) {
				rosters.push(roster);
			}
		}
	}
	return rosters;
};
var SNSSystemRoster = function(){
	this.name = "系统消息";
	this.id = "system";
	this.show= "systemroster";
	this.messageList = new Array();
	this.photoUrl = SNSConfig.SYSTEM_ROSTER.DEFAULT_AVATAR;
};

SNSSystemRoster.prototype = new SNSRoster();

SNSSystemRoster.prototype.getPhotoUrl = function(){
	return this.photoUrl;
};

SNSSystemRoster.prototype.addMsg = function(uuid, msg){
	msg.from = this.id;
	var systemMsg = new Object();
	systemMsg.uuid = uuid;
	systemMsg.msg = msg;
	this._messageList.push(systemMsg);
	if(SNSRosterRender.findActiveRoster() instanceof SNSSystemRoster){
		SNSMessageRender.showMessage(msg);
		SNSWindow.changeCurrentChatTo(this.id);
	}else{
		if(SNSRosterRender.isChatWindowLeftItemOpened(this.id)){
			SNSMessageRender.showMessage(msg);
		}
		SNSMessageRender.twinkle(msg, this.id);
	}
};

SNSSystemRoster.prototype.showMsg = function(){
	SNSWindow.changeCurrentChatTo(this.id);
	for(var i in this._messageList){
		if(!this.isMsgRendered(this._messageList[i].uuid)){
			SNSMessageRender.showMessage(this._messageList[i].msg);
		}
	}
	// 去掉未读消息标志
	SNSInitBinder.systemMessageBtn.find("span").attr("class","");
};

SNSSystemRoster.prototype.updateMsgContent = function(msgUuid, content){
	for(var i in this._messageList){
		if(this._messageList[i].uuid == msgUuid){
			this._messageList[i].msg.body.content = content;
		}
	}
};

SNSSystemRoster.prototype.isMsgRendered = function(msgUuid){
	return jQuery("div[action-data='" + msgUuid + "']").length > 0;
};

SNSSystemRoster.prototype.clearMsg = function(){
	this._messageList.splice(0,this._messageList.length);
};

SNSSystemRoster.prototype.getID = function(){
	return this.id;
};
var SNSVCard = function(vcard) {
	this.nickname = vcard.nickname;
	this.photo = vcard.photo;
	this.email = vcard.email;
	this.mobile = vcard.mobile;
	this.telephone = vcard.telephone;
	this.showpropList = [ "nickname", "email", "mobile", "telephone"];
}

SNSVCard.prototype.hasPhoto = function(){
	return !!(this.photo && this.photo.notEmpty())
};

SNSVCard.prototype.getPhotoUrl = function() {
	if (this.hasPhoto()) {
		return YYIMChat.getFileUrl(this.photo);
	}
	return SNSConfig.USER.DEFAULT_AVATAR;
};

/**
 * 更新用户头像
 * @param newUrl
 * @param arg{success: function, error: success}
 */
SNSVCard.prototype.updateUserPhotoUrl = function(newUrl, arg) {
	this.photo = newUrl;
	this.update(arg);
};

/**
 * 更新vcard，发包到服务器
 */
SNSVCard.prototype.update = function(arg){
	YYIMChat.setVCard({
		vcard : this,
		success : function() {
			arg.success && arg.success();
		},
		error : function(packet) {
			var errorInfo = {
				info: "获取好友列表失败",
				packet: packet
			};
			arg.error && arg.error(errorInfo);
		}
	});
};

var SNSDeviceGroup = function(){
	this.name= SNSConfig.GROUP.GROUP_DEVICE;
	this.editable = false; // 主要用于不能移动和复制好友至该分组
};

SNSDeviceGroup.prototype = new SNSGroup();

SNSDeviceGroup.getInstance = function(){
	if(!SNSDeviceGroup._instance){
		SNSDeviceGroup._instance = new SNSDeviceGroup();
	}
	return SNSDeviceGroup._instance;
};

/**
 * 获取该分组中在线总人数
 * @return {Number}
 */
SNSDeviceGroup.prototype.getOnlineNumber = function(){
	var num = 0;
	var list = SNSApplication.getInstance().getUser().deviceList._list;
	for(var device in list){
		if(list[device] && list[device] instanceof SNSDeviceRoster){
			var status  = list[device].presence.status;
			if (status != SNS_STATUS.UNAVAILABLE){
				num++;
			}
		}
	}
	return num;
};

/**
 * 获取该分组总人数, 设备存在deviceList
 */
SNSDeviceGroup.prototype.size = function(){
	return SNSApplication.getInstance().getUser().deviceList.size();
};
var SNSDeviceList = function() {
};

SNSDeviceList.prototype = new SNSBaseRosterList();

SNSDeviceList.prototype.get = function(id){
	if(!id)
		throw "id is null!";
	if(!this._list)
		return;
	
	var key = id;
	if(typeof id != "string" && id.getID())
		key = id.getID();
	return this._list[key]? this._list[key] : null;
};
var SNSDeviceRoster = function(resource, deviceName){
	if(!SNSCommonUtil.isStringAndNotEmpty(resource))
		throw "resource is null or empty!";
	this.id = SNSApplication.getInstance().getUser().getID();
	this.resource = resource;
	this.name = deviceName? deviceName:SNSApplication.getInstance().getUser().name;
	
	this.subscription = SNS_SUBSCRIBE.BOTH;
	
	this.vcard = SNSApplication.getInstance().getUser().vcard;
};

SNSDeviceRoster.prototype = new SNSRoster();

SNSDeviceRoster.prototype.getPhotoUrl = function(){
	return SNSConfig.ROSTER.MY_DEVICE_DEFAULT_AVATAR;
};

/**
 * 改变roster的在线状态信息， 同时发送全局事件通知ON_ROSTER_PRESENCE_CHANGE
 * @param {SNSPresence} presence 出席信息对象
 */
SNSDeviceRoster.prototype.setPresence = function(presence) {
	if (presence && presence instanceof SNSPresence && presence != this.presence) {
		if(!presence.resource || presence.resource != this.resource)
			return;
		var old = this.presence;
		this.presence = presence;

		SNSApplication.getInstance().getGlobalEventManager().trigger(SNS_EVENT_SUBJECT.ON_ROSTER_PRESENCE_CHANGE, [ {
			target : this,
			newValue : this.presence,
			oldValue : old
		} ]);

	}
};
var SNSPublicAccountRoster = function(id, name){
	this.id = id;
	this.name = name? name : "公共号";
	this.accountName;
	// 无需显示状态
	this.presence.show = "none";
	this.groups = [SNSPublicServiceGroup.getInstance()];
	this.subscription = SNS_SUBSCRIBE.BOTH;
	this.photoUrl;
	SNSPublicServiceGroup.getInstance().addRoster(this);
};

SNSPublicAccountRoster.prototype = new SNSRoster();

SNSPublicAccountRoster.prototype.getPhotoUrl = function(){
	return this.photoUrl ? YYIMChat.getFileUrl(this.photoUrl) : SNSConfig.ROSTER.PUB_ACCOUNT_DEFAULT_AVATAR;
};

var SNSPublicServiceGroup = function(){
	this.name=SNSConfig.GROUP.GROUP_PUB_ACCOUNT;
	this.editable = false; // 主要用于不能移动和复制好友至该分组
};

SNSPublicServiceGroup.prototype = new SNSGroup();

SNSPublicServiceGroup.getInstance = function(){
	if(!SNSPublicServiceGroup._instance){
		SNSPublicServiceGroup._instance = new SNSPublicServiceGroup();
	}
	return SNSPublicServiceGroup._instance;
};

/**
 * 向该分组中添加联系人
 * @param roster {SNSRoster} 被添加的联系人对象
 */
SNSPublicServiceGroup.prototype.addRoster = function(roster){
	this.add(roster);
};
var SNSPublicServiceRoster = function(){
	this.jid;
	this.name;
	this.groups = [SNSPublicServiceGroup.getInstance()];
	// 无需显示状态
	this.presence.show = "none";
	this.subscription = SNS_SUBSCRIBE.BOTH;
};

SNSPublicServiceRoster.prototype = new SNSRoster();

SNSPublicServiceRoster.prototype.getPhotoUrl = function(){
	return SNSConfig.ROSTER.MY_TASK_DEFAULT_AVATAR;
};
var SNSChatRoomMemberRoster = function(id, name){
	this.affiliation = SNS_CHATROOM_MEMBER_AFFILIATION.NONE;
	this.role = SNS_CHATROOM_MEMBER_ROLE.PARTICIPANT;
	
	if (id) {
		this.id = id;
		this.name = name? name : id;
	}
};

SNSChatRoomMemberRoster.prototype = new SNSRoster();

SNSChatRoomMemberRoster.prototype.getPhotoUrl = function(){
	return this.photoUrl ? YYIMChat.getFileUrl(this.photoUrl) : SNSConfig.USER.DEFAULT_AVATAR;
};
/**
 * 全局事件监听对象
 * 
 * @param {Object} subject 监听的事件名称
 * @param {boolean} async true表示同步监听，false表示异步监听
 * @param {method} callback 事件处理器
 * @param {Object} thisObj optional, callback的执行上下文，仅对async==false起作用
 * @param {Number} thisObj callback延迟执行的时间，仅对async==false起作用
 */
var SNSGlobalEventListener = function(subject, async, callback, thisObj, timeout){
	
	/**
	 * @description {string} 所订阅的主题，即全局事件的名称
	 * @field
	 */
	this.subject = subject;
	
	/**
	 * @description {boolean} true表示异步执行，false表示同步执行
	 * @field
	 */
	this.async = async;
	
	/**
	 * @description {object} optional, callback的执行上下文，仅对async==false起作用
	 * @field
	 */
	this.thisObj = thisObj;
	
	/**
	 * @description {method} 执行的函数
	 * @field
	 */
	this.callback = callback || function(event, data){
		_logger.log("default global event callback");
	};
}
var SNSGlobalEventManager = function() {
	this.BIND_DOM = jQuery(document);

	/**
	 * @description {Object} 存储自定义的全局事件监听器，结构为{name1:[listener1,listener2],name2:[listener3]...}
	 * @field
	 */
	this.events = new Object();
};

SNSGlobalEventManager.getInstance = function() {
	if (!SNSGlobalEventManager._instance) {
		SNSGlobalEventManager._instance = new SNSGlobalEventManager();
		if (SNSGlobalEventManager._instance && SNSGlobalEventManager._instance._init && typeof SNSGlobalEventManager._instance._init == "function") {
			SNSGlobalEventManager._instance._init();
		}
	}
	return SNSGlobalEventManager._instance;
};

/**
 * 触发监听事件
 * @param {string} subject
 * @param {Array} data
 */
SNSGlobalEventManager.prototype.trigger = function(subject, data) {
	YYIMChat.log("SNSGlobalEventManager.prototype.trigger: ", 3, subject);
	// 触发异步监听事件
	this.BIND_DOM.trigger(subject, data);

	// 触发同步监听事件
	if (this.events[subject] && this.events[subject] instanceof Array) {
		var eventList = this.events[subject];
		for (var i = 0; i < eventList.length; i++) {
			var listener = eventList[i];
			try{
				listener.callback.apply(listener.thisObj, data);
			}catch(e){
				YYIMChat.log("SNSGlobalEventManager.prototype.trigger :exception", 0, e, subject, data);
				break;
			}
			
		}
	}

};

/**
 * 注册全局事件监听函数
 * @param {Object} subject 监听的事件名称
 * @param {boolean} async true表示异步监听，false表示同步监听
 * @param {method} callback 事件处理器
 * @param {Object} thisObj optional callback的执行上下文
 * @return Whether register was successful
 * @type boolean
 */
SNSGlobalEventManager.prototype.registerEventHandler = function(subject, async, callback, thisObj) {
	
	if (async) {// 绑定异步监听器
		this.BIND_DOM.bind(subject, jQuery.proxy(callback, thisObj));
	} else {// 绑定同步监听器
		if (!this.events[subject]) {
			this.events[subject] = new Array();
		}
		this.events[subject].push(new SNSGlobalEventListener(subject, async, callback, thisObj));
	}
};
/*
 * jQuery MD5 Plugin 1.2.1
 * https://github.com/blueimp/jQuery-MD5
 *
 * Copyright 2010, Sebastian Tschan
 * https://blueimp.net
 *
 * Licensed under the MIT license:
 * http://creativecommons.org/licenses/MIT/
 * 
 * Based on
 * A JavaScript implementation of the RSA Data Security, Inc. MD5 Message
 * Digest Algorithm, as defined in RFC 1321.
 * Version 2.2 Copyright (C) Paul Johnston 1999 - 2009
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for more info.
 */

/*jslint bitwise: true */
/*global unescape, jQuery */

(function ($) {
    'use strict';

    /*
    * Add integers, wrapping at 2^32. This uses 16-bit operations internally
    * to work around bugs in some JS interpreters.
    */
    function safe_add(x, y) {
        var lsw = (x & 0xFFFF) + (y & 0xFFFF),
            msw = (x >> 16) + (y >> 16) + (lsw >> 16);
        return (msw << 16) | (lsw & 0xFFFF);
    }

    /*
    * Bitwise rotate a 32-bit number to the left.
    */
    function bit_rol(num, cnt) {
        return (num << cnt) | (num >>> (32 - cnt));
    }

    /*
    * These functions implement the four basic operations the algorithm uses.
    */
    function md5_cmn(q, a, b, x, s, t) {
        return safe_add(bit_rol(safe_add(safe_add(a, q), safe_add(x, t)), s), b);
    }
    function md5_ff(a, b, c, d, x, s, t) {
        return md5_cmn((b & c) | ((~b) & d), a, b, x, s, t);
    }
    function md5_gg(a, b, c, d, x, s, t) {
        return md5_cmn((b & d) | (c & (~d)), a, b, x, s, t);
    }
    function md5_hh(a, b, c, d, x, s, t) {
        return md5_cmn(b ^ c ^ d, a, b, x, s, t);
    }
    function md5_ii(a, b, c, d, x, s, t) {
        return md5_cmn(c ^ (b | (~d)), a, b, x, s, t);
    }

    /*
    * Calculate the MD5 of an array of little-endian words, and a bit length.
    */
    function binl_md5(x, len) {
        /* append padding */
        x[len >> 5] |= 0x80 << ((len) % 32);
        x[(((len + 64) >>> 9) << 4) + 14] = len;

        var i, olda, oldb, oldc, oldd,
            a =  1732584193,
            b = -271733879,
            c = -1732584194,
            d =  271733878;

        for (i = 0; i < x.length; i += 16) {
            olda = a;
            oldb = b;
            oldc = c;
            oldd = d;

            a = md5_ff(a, b, c, d, x[i],       7, -680876936);
            d = md5_ff(d, a, b, c, x[i +  1], 12, -389564586);
            c = md5_ff(c, d, a, b, x[i +  2], 17,  606105819);
            b = md5_ff(b, c, d, a, x[i +  3], 22, -1044525330);
            a = md5_ff(a, b, c, d, x[i +  4],  7, -176418897);
            d = md5_ff(d, a, b, c, x[i +  5], 12,  1200080426);
            c = md5_ff(c, d, a, b, x[i +  6], 17, -1473231341);
            b = md5_ff(b, c, d, a, x[i +  7], 22, -45705983);
            a = md5_ff(a, b, c, d, x[i +  8],  7,  1770035416);
            d = md5_ff(d, a, b, c, x[i +  9], 12, -1958414417);
            c = md5_ff(c, d, a, b, x[i + 10], 17, -42063);
            b = md5_ff(b, c, d, a, x[i + 11], 22, -1990404162);
            a = md5_ff(a, b, c, d, x[i + 12],  7,  1804603682);
            d = md5_ff(d, a, b, c, x[i + 13], 12, -40341101);
            c = md5_ff(c, d, a, b, x[i + 14], 17, -1502002290);
            b = md5_ff(b, c, d, a, x[i + 15], 22,  1236535329);

            a = md5_gg(a, b, c, d, x[i +  1],  5, -165796510);
            d = md5_gg(d, a, b, c, x[i +  6],  9, -1069501632);
            c = md5_gg(c, d, a, b, x[i + 11], 14,  643717713);
            b = md5_gg(b, c, d, a, x[i],      20, -373897302);
            a = md5_gg(a, b, c, d, x[i +  5],  5, -701558691);
            d = md5_gg(d, a, b, c, x[i + 10],  9,  38016083);
            c = md5_gg(c, d, a, b, x[i + 15], 14, -660478335);
            b = md5_gg(b, c, d, a, x[i +  4], 20, -405537848);
            a = md5_gg(a, b, c, d, x[i +  9],  5,  568446438);
            d = md5_gg(d, a, b, c, x[i + 14],  9, -1019803690);
            c = md5_gg(c, d, a, b, x[i +  3], 14, -187363961);
            b = md5_gg(b, c, d, a, x[i +  8], 20,  1163531501);
            a = md5_gg(a, b, c, d, x[i + 13],  5, -1444681467);
            d = md5_gg(d, a, b, c, x[i +  2],  9, -51403784);
            c = md5_gg(c, d, a, b, x[i +  7], 14,  1735328473);
            b = md5_gg(b, c, d, a, x[i + 12], 20, -1926607734);

            a = md5_hh(a, b, c, d, x[i +  5],  4, -378558);
            d = md5_hh(d, a, b, c, x[i +  8], 11, -2022574463);
            c = md5_hh(c, d, a, b, x[i + 11], 16,  1839030562);
            b = md5_hh(b, c, d, a, x[i + 14], 23, -35309556);
            a = md5_hh(a, b, c, d, x[i +  1],  4, -1530992060);
            d = md5_hh(d, a, b, c, x[i +  4], 11,  1272893353);
            c = md5_hh(c, d, a, b, x[i +  7], 16, -155497632);
            b = md5_hh(b, c, d, a, x[i + 10], 23, -1094730640);
            a = md5_hh(a, b, c, d, x[i + 13],  4,  681279174);
            d = md5_hh(d, a, b, c, x[i],      11, -358537222);
            c = md5_hh(c, d, a, b, x[i +  3], 16, -722521979);
            b = md5_hh(b, c, d, a, x[i +  6], 23,  76029189);
            a = md5_hh(a, b, c, d, x[i +  9],  4, -640364487);
            d = md5_hh(d, a, b, c, x[i + 12], 11, -421815835);
            c = md5_hh(c, d, a, b, x[i + 15], 16,  530742520);
            b = md5_hh(b, c, d, a, x[i +  2], 23, -995338651);

            a = md5_ii(a, b, c, d, x[i],       6, -198630844);
            d = md5_ii(d, a, b, c, x[i +  7], 10,  1126891415);
            c = md5_ii(c, d, a, b, x[i + 14], 15, -1416354905);
            b = md5_ii(b, c, d, a, x[i +  5], 21, -57434055);
            a = md5_ii(a, b, c, d, x[i + 12],  6,  1700485571);
            d = md5_ii(d, a, b, c, x[i +  3], 10, -1894986606);
            c = md5_ii(c, d, a, b, x[i + 10], 15, -1051523);
            b = md5_ii(b, c, d, a, x[i +  1], 21, -2054922799);
            a = md5_ii(a, b, c, d, x[i +  8],  6,  1873313359);
            d = md5_ii(d, a, b, c, x[i + 15], 10, -30611744);
            c = md5_ii(c, d, a, b, x[i +  6], 15, -1560198380);
            b = md5_ii(b, c, d, a, x[i + 13], 21,  1309151649);
            a = md5_ii(a, b, c, d, x[i +  4],  6, -145523070);
            d = md5_ii(d, a, b, c, x[i + 11], 10, -1120210379);
            c = md5_ii(c, d, a, b, x[i +  2], 15,  718787259);
            b = md5_ii(b, c, d, a, x[i +  9], 21, -343485551);

            a = safe_add(a, olda);
            b = safe_add(b, oldb);
            c = safe_add(c, oldc);
            d = safe_add(d, oldd);
        }
        return [a, b, c, d];
    }

    /*
    * Convert an array of little-endian words to a string
    */
    function binl2rstr(input) {
        var i,
            output = '';
        for (i = 0; i < input.length * 32; i += 8) {
            output += String.fromCharCode((input[i >> 5] >>> (i % 32)) & 0xFF);
        }
        return output;
    }

    /*
    * Convert a raw string to an array of little-endian words
    * Characters >255 have their high-byte silently ignored.
    */
    function rstr2binl(input) {
        var i,
            output = [];
        output[(input.length >> 2) - 1] = undefined;
        for (i = 0; i < output.length; i += 1) {
            output[i] = 0;
        }
        for (i = 0; i < input.length * 8; i += 8) {
            output[i >> 5] |= (input.charCodeAt(i / 8) & 0xFF) << (i % 32);
        }
        return output;
    }

    /*
    * Calculate the MD5 of a raw string
    */
    function rstr_md5(s) {
        return binl2rstr(binl_md5(rstr2binl(s), s.length * 8));
    }

    /*
    * Calculate the HMAC-MD5, of a key and some data (raw strings)
    */
    function rstr_hmac_md5(key, data) {
        var i,
            bkey = rstr2binl(key),
            ipad = [],
            opad = [],
            hash;
        ipad[15] = opad[15] = undefined;                        
        if (bkey.length > 16) {
            bkey = binl_md5(bkey, key.length * 8);
        }
        for (i = 0; i < 16; i += 1) {
            ipad[i] = bkey[i] ^ 0x36363636;
            opad[i] = bkey[i] ^ 0x5C5C5C5C;
        }
        hash = binl_md5(ipad.concat(rstr2binl(data)), 512 + data.length * 8);
        return binl2rstr(binl_md5(opad.concat(hash), 512 + 128));
    }

    /*
    * Convert a raw string to a hex string
    */
    function rstr2hex(input) {
        var hex_tab = '0123456789abcdef',
            output = '',
            x,
            i;
        for (i = 0; i < input.length; i += 1) {
            x = input.charCodeAt(i);
            output += hex_tab.charAt((x >>> 4) & 0x0F) +
                hex_tab.charAt(x & 0x0F);
        }
        return output;
    }

    /*
    * Encode a string as utf-8
    */
    function str2rstr_utf8(input) {
        return unescape(encodeURIComponent(input));
    }

    /*
    * Take string arguments and return either raw or hex encoded strings
    */
    function raw_md5(s) {
        return rstr_md5(str2rstr_utf8(s));
    }
    function hex_md5(s) {
        return rstr2hex(raw_md5(s));
    }
    function raw_hmac_md5(k, d) {
        return rstr_hmac_md5(str2rstr_utf8(k), str2rstr_utf8(d));
    }
    function hex_hmac_md5(k, d) {
        return rstr2hex(raw_hmac_md5(k, d));
    }
    
    $.md5 = function (string, key, raw) {
        if (!key) {
            if (!raw) {
                return hex_md5(string);
            } else {
                return raw_md5(string);
            }
        }
        if (!raw) {
            return hex_hmac_md5(key, string);
        } else {
            return raw_hmac_md5(key, string);
        }
    };
    
})(typeof jQuery === 'function' ? jQuery : this);
/*
 * JQuery zTree core v3.5.17-beta.2
 * http://zTree.me/
 *
 * Copyright (c) 2010 Hunter.z
 *
 * Licensed same as jquery - MIT License
 * http://www.opensource.org/licenses/mit-license.php
 *
 * email: hunter.z@263.net
 * Date: 2014-05-08
 */
(function(p){var G,H,I,J,K,L,r={},u={},v={},M={treeId:"",treeObj:null,view:{addDiyDom:null,autoCancelSelected:!0,dblClickExpand:!0,expandSpeed:"fast",fontCss:{},nameIsHTML:!1,selectedMulti:!0,showIcon:!0,showLine:!0,showTitle:!0,txtSelectedEnable:!1},data:{key:{children:"children",name:"name",title:"",url:"url"},simpleData:{enable:!1,idKey:"id",pIdKey:"pId",rootPId:null},keep:{parent:!1,leaf:!1}},async:{enable:!1,contentType:"application/x-www-form-urlencoded",type:"post",dataType:"text",url:"",autoParam:[],
otherParam:[],dataFilter:null},callback:{beforeAsync:null,beforeClick:null,beforeDblClick:null,beforeRightClick:null,beforeMouseDown:null,beforeMouseUp:null,beforeExpand:null,beforeCollapse:null,beforeRemove:null,onAsyncError:null,onAsyncSuccess:null,onNodeCreated:null,onClick:null,onDblClick:null,onRightClick:null,onMouseDown:null,onMouseUp:null,onExpand:null,onCollapse:null,onRemove:null}},w=[function(b){var a=b.treeObj,c=e.event;a.bind(c.NODECREATED,function(a,c,g){j.apply(b.callback.onNodeCreated,
[a,c,g])});a.bind(c.CLICK,function(a,c,g,l,h){j.apply(b.callback.onClick,[c,g,l,h])});a.bind(c.EXPAND,function(a,c,g){j.apply(b.callback.onExpand,[a,c,g])});a.bind(c.COLLAPSE,function(a,c,g){j.apply(b.callback.onCollapse,[a,c,g])});a.bind(c.ASYNC_SUCCESS,function(a,c,g,l){j.apply(b.callback.onAsyncSuccess,[a,c,g,l])});a.bind(c.ASYNC_ERROR,function(a,c,g,l,h,e){j.apply(b.callback.onAsyncError,[a,c,g,l,h,e])});a.bind(c.REMOVE,function(a,c,g){j.apply(b.callback.onRemove,[a,c,g])})}],x=[function(b){var a=
e.event;b.treeObj.unbind(a.NODECREATED).unbind(a.CLICK).unbind(a.EXPAND).unbind(a.COLLAPSE).unbind(a.ASYNC_SUCCESS).unbind(a.ASYNC_ERROR).unbind(a.REMOVE)}],y=[function(b){var a=h.getCache(b);a||(a={},h.setCache(b,a));a.nodes=[];a.doms=[]}],z=[function(b,a,c,d,f,g){if(c){var l=h.getRoot(b),e=b.data.key.children;c.level=a;c.tId=b.treeId+"_"+ ++l.zId;c.parentTId=d?d.tId:null;c.open=typeof c.open=="string"?j.eqs(c.open,"true"):!!c.open;c[e]&&c[e].length>0?(c.isParent=!0,c.zAsync=!0):(c.isParent=typeof c.isParent==
"string"?j.eqs(c.isParent,"true"):!!c.isParent,c.open=c.isParent&&!b.async.enable?c.open:!1,c.zAsync=!c.isParent);c.isFirstNode=f;c.isLastNode=g;c.getParentNode=function(){return h.getNodeCache(b,c.parentTId)};c.getPreNode=function(){return h.getPreNode(b,c)};c.getNextNode=function(){return h.getNextNode(b,c)};c.isAjaxing=!1;h.fixPIdKeyValue(b,c)}}],s=[function(b){var a=b.target,c=h.getSetting(b.data.treeId),d="",f=null,g="",l="",i=null,n=null,k=null;if(j.eqs(b.type,"mousedown"))l="mousedown";else if(j.eqs(b.type,
"mouseup"))l="mouseup";else if(j.eqs(b.type,"contextmenu"))l="contextmenu";else if(j.eqs(b.type,"click"))if(j.eqs(a.tagName,"span")&&a.getAttribute("treeNode"+e.id.SWITCH)!==null)d=j.getNodeMainDom(a).id,g="switchNode";else{if(k=j.getMDom(c,a,[{tagName:"a",attrName:"treeNode"+e.id.A}]))d=j.getNodeMainDom(k).id,g="clickNode"}else if(j.eqs(b.type,"dblclick")&&(l="dblclick",k=j.getMDom(c,a,[{tagName:"a",attrName:"treeNode"+e.id.A}])))d=j.getNodeMainDom(k).id,g="switchNode";if(l.length>0&&d.length==0&&
(k=j.getMDom(c,a,[{tagName:"a",attrName:"treeNode"+e.id.A}])))d=j.getNodeMainDom(k).id;if(d.length>0)switch(f=h.getNodeCache(c,d),g){case "switchNode":f.isParent?j.eqs(b.type,"click")||j.eqs(b.type,"dblclick")&&j.apply(c.view.dblClickExpand,[c.treeId,f],c.view.dblClickExpand)?i=G:g="":g="";break;case "clickNode":i=H}switch(l){case "mousedown":n=I;break;case "mouseup":n=J;break;case "dblclick":n=K;break;case "contextmenu":n=L}return{stop:!1,node:f,nodeEventType:g,nodeEventCallback:i,treeEventType:l,
treeEventCallback:n}}],A=[function(b){var a=h.getRoot(b);a||(a={},h.setRoot(b,a));a[b.data.key.children]=[];a.expandTriggerFlag=!1;a.curSelectedList=[];a.noSelection=!0;a.createdNodes=[];a.zId=0;a._ver=(new Date).getTime()}],B=[],C=[],D=[],E=[],F=[],h={addNodeCache:function(b,a){h.getCache(b).nodes[h.getNodeCacheId(a.tId)]=a},getNodeCacheId:function(b){return b.substring(b.lastIndexOf("_")+1)},addAfterA:function(b){C.push(b)},addBeforeA:function(b){B.push(b)},addInnerAfterA:function(b){E.push(b)},
addInnerBeforeA:function(b){D.push(b)},addInitBind:function(b){w.push(b)},addInitUnBind:function(b){x.push(b)},addInitCache:function(b){y.push(b)},addInitNode:function(b){z.push(b)},addInitProxy:function(b,a){a?s.splice(0,0,b):s.push(b)},addInitRoot:function(b){A.push(b)},addNodesData:function(b,a,c){var d=b.data.key.children;a[d]||(a[d]=[]);if(a[d].length>0)a[d][a[d].length-1].isLastNode=!1,i.setNodeLineIcos(b,a[d][a[d].length-1]);a.isParent=!0;a[d]=a[d].concat(c)},addSelectedNode:function(b,a){var c=
h.getRoot(b);h.isSelectedNode(b,a)||c.curSelectedList.push(a)},addCreatedNode:function(b,a){(b.callback.onNodeCreated||b.view.addDiyDom)&&h.getRoot(b).createdNodes.push(a)},addZTreeTools:function(b){F.push(b)},exSetting:function(b){p.extend(!0,M,b)},fixPIdKeyValue:function(b,a){b.data.simpleData.enable&&(a[b.data.simpleData.pIdKey]=a.parentTId?a.getParentNode()[b.data.simpleData.idKey]:b.data.simpleData.rootPId)},getAfterA:function(b,a,c){for(var d=0,f=C.length;d<f;d++)C[d].apply(this,arguments)},
getBeforeA:function(b,a,c){for(var d=0,f=B.length;d<f;d++)B[d].apply(this,arguments)},getInnerAfterA:function(b,a,c){for(var d=0,f=E.length;d<f;d++)E[d].apply(this,arguments)},getInnerBeforeA:function(b,a,c){for(var d=0,f=D.length;d<f;d++)D[d].apply(this,arguments)},getCache:function(b){return v[b.treeId]},getNextNode:function(b,a){if(!a)return null;for(var c=b.data.key.children,d=a.parentTId?a.getParentNode():h.getRoot(b),f=0,g=d[c].length-1;f<=g;f++)if(d[c][f]===a)return f==g?null:d[c][f+1];return null},
getNodeByParam:function(b,a,c,d){if(!a||!c)return null;for(var f=b.data.key.children,g=0,l=a.length;g<l;g++){if(a[g][c]==d)return a[g];var e=h.getNodeByParam(b,a[g][f],c,d);if(e)return e}return null},getNodeCache:function(b,a){if(!a)return null;var c=v[b.treeId].nodes[h.getNodeCacheId(a)];return c?c:null},getNodeName:function(b,a){return""+a[b.data.key.name]},getNodeTitle:function(b,a){return""+a[b.data.key.title===""?b.data.key.name:b.data.key.title]},getNodes:function(b){return h.getRoot(b)[b.data.key.children]},
getNodesByParam:function(b,a,c,d){if(!a||!c)return[];for(var f=b.data.key.children,g=[],l=0,e=a.length;l<e;l++)a[l][c]==d&&g.push(a[l]),g=g.concat(h.getNodesByParam(b,a[l][f],c,d));return g},getNodesByParamFuzzy:function(b,a,c,d){if(!a||!c)return[];for(var f=b.data.key.children,g=[],d=d.toLowerCase(),l=0,e=a.length;l<e;l++)typeof a[l][c]=="string"&&a[l][c].toLowerCase().indexOf(d)>-1&&g.push(a[l]),g=g.concat(h.getNodesByParamFuzzy(b,a[l][f],c,d));return g},getNodesByFilter:function(b,a,c,d,f){if(!a)return d?
null:[];for(var g=b.data.key.children,e=d?null:[],i=0,n=a.length;i<n;i++){if(j.apply(c,[a[i],f],!1)){if(d)return a[i];e.push(a[i])}var k=h.getNodesByFilter(b,a[i][g],c,d,f);if(d&&k)return k;e=d?k:e.concat(k)}return e},getPreNode:function(b,a){if(!a)return null;for(var c=b.data.key.children,d=a.parentTId?a.getParentNode():h.getRoot(b),f=0,g=d[c].length;f<g;f++)if(d[c][f]===a)return f==0?null:d[c][f-1];return null},getRoot:function(b){return b?u[b.treeId]:null},getRoots:function(){return u},getSetting:function(b){return r[b]},
getSettings:function(){return r},getZTreeTools:function(b){return(b=this.getRoot(this.getSetting(b)))?b.treeTools:null},initCache:function(b){for(var a=0,c=y.length;a<c;a++)y[a].apply(this,arguments)},initNode:function(b,a,c,d,f,g){for(var e=0,h=z.length;e<h;e++)z[e].apply(this,arguments)},initRoot:function(b){for(var a=0,c=A.length;a<c;a++)A[a].apply(this,arguments)},isSelectedNode:function(b,a){for(var c=h.getRoot(b),d=0,f=c.curSelectedList.length;d<f;d++)if(a===c.curSelectedList[d])return!0;return!1},
removeNodeCache:function(b,a){var c=b.data.key.children;if(a[c])for(var d=0,f=a[c].length;d<f;d++)arguments.callee(b,a[c][d]);h.getCache(b).nodes[h.getNodeCacheId(a.tId)]=null},removeSelectedNode:function(b,a){for(var c=h.getRoot(b),d=0,f=c.curSelectedList.length;d<f;d++)if(a===c.curSelectedList[d]||!h.getNodeCache(b,c.curSelectedList[d].tId))c.curSelectedList.splice(d,1),d--,f--},setCache:function(b,a){v[b.treeId]=a},setRoot:function(b,a){u[b.treeId]=a},setZTreeTools:function(b,a){for(var c=0,d=
F.length;c<d;c++)F[c].apply(this,arguments)},transformToArrayFormat:function(b,a){if(!a)return[];var c=b.data.key.children,d=[];if(j.isArray(a))for(var f=0,g=a.length;f<g;f++)d.push(a[f]),a[f][c]&&(d=d.concat(h.transformToArrayFormat(b,a[f][c])));else d.push(a),a[c]&&(d=d.concat(h.transformToArrayFormat(b,a[c])));return d},transformTozTreeFormat:function(b,a){var c,d,f=b.data.simpleData.idKey,g=b.data.simpleData.pIdKey,e=b.data.key.children;if(!f||f==""||!a)return[];if(j.isArray(a)){var h=[],i=[];
for(c=0,d=a.length;c<d;c++)i[a[c][f]]=a[c];for(c=0,d=a.length;c<d;c++)i[a[c][g]]&&a[c][f]!=a[c][g]?(i[a[c][g]][e]||(i[a[c][g]][e]=[]),i[a[c][g]][e].push(a[c])):h.push(a[c]);return h}else return[a]}},m={bindEvent:function(b){for(var a=0,c=w.length;a<c;a++)w[a].apply(this,arguments)},unbindEvent:function(b){for(var a=0,c=x.length;a<c;a++)x[a].apply(this,arguments)},bindTree:function(b){var a={treeId:b.treeId},c=b.treeObj;b.view.txtSelectedEnable||c.bind("selectstart",function(a){a=a.originalEvent.srcElement.nodeName.toLowerCase();
return a==="input"||a==="textarea"}).css({"-moz-user-select":"-moz-none"});c.bind("click",a,m.proxy);c.bind("dblclick",a,m.proxy);c.bind("mouseover",a,m.proxy);c.bind("mouseout",a,m.proxy);c.bind("mousedown",a,m.proxy);c.bind("mouseup",a,m.proxy);c.bind("contextmenu",a,m.proxy)},unbindTree:function(b){b.treeObj.unbind("click",m.proxy).unbind("dblclick",m.proxy).unbind("mouseover",m.proxy).unbind("mouseout",m.proxy).unbind("mousedown",m.proxy).unbind("mouseup",m.proxy).unbind("contextmenu",m.proxy)},
doProxy:function(b){for(var a=[],c=0,d=s.length;c<d;c++){var f=s[c].apply(this,arguments);a.push(f);if(f.stop)break}return a},proxy:function(b){var a=h.getSetting(b.data.treeId);if(!j.uCanDo(a,b))return!0;for(var a=m.doProxy(b),c=!0,d=0,f=a.length;d<f;d++){var g=a[d];g.nodeEventCallback&&(c=g.nodeEventCallback.apply(g,[b,g.node])&&c);g.treeEventCallback&&(c=g.treeEventCallback.apply(g,[b,g.node])&&c)}return c}};G=function(b,a){var c=h.getSetting(b.data.treeId);if(a.open){if(j.apply(c.callback.beforeCollapse,
[c.treeId,a],!0)==!1)return!0}else if(j.apply(c.callback.beforeExpand,[c.treeId,a],!0)==!1)return!0;h.getRoot(c).expandTriggerFlag=!0;i.switchNode(c,a);return!0};H=function(b,a){var c=h.getSetting(b.data.treeId),d=c.view.autoCancelSelected&&(b.ctrlKey||b.metaKey)&&h.isSelectedNode(c,a)?0:c.view.autoCancelSelected&&(b.ctrlKey||b.metaKey)&&c.view.selectedMulti?2:1;if(j.apply(c.callback.beforeClick,[c.treeId,a,d],!0)==!1)return!0;d===0?i.cancelPreSelectedNode(c,a):i.selectNode(c,a,d===2);c.treeObj.trigger(e.event.CLICK,
[b,c.treeId,a,d]);return!0};I=function(b,a){var c=h.getSetting(b.data.treeId);j.apply(c.callback.beforeMouseDown,[c.treeId,a],!0)&&j.apply(c.callback.onMouseDown,[b,c.treeId,a]);return!0};J=function(b,a){var c=h.getSetting(b.data.treeId);j.apply(c.callback.beforeMouseUp,[c.treeId,a],!0)&&j.apply(c.callback.onMouseUp,[b,c.treeId,a]);return!0};K=function(b,a){var c=h.getSetting(b.data.treeId);j.apply(c.callback.beforeDblClick,[c.treeId,a],!0)&&j.apply(c.callback.onDblClick,[b,c.treeId,a]);return!0};
L=function(b,a){var c=h.getSetting(b.data.treeId);j.apply(c.callback.beforeRightClick,[c.treeId,a],!0)&&j.apply(c.callback.onRightClick,[b,c.treeId,a]);return typeof c.callback.onRightClick!="function"};var j={apply:function(b,a,c){return typeof b=="function"?b.apply(N,a?a:[]):c},canAsync:function(b,a){var c=b.data.key.children;return b.async.enable&&a&&a.isParent&&!(a.zAsync||a[c]&&a[c].length>0)},clone:function(b){if(b===null)return null;var a=j.isArray(b)?[]:{},c;for(c in b)a[c]=b[c]instanceof
Date?new Date(b[c].getTime()):typeof b[c]==="object"?arguments.callee(b[c]):b[c];return a},eqs:function(b,a){return b.toLowerCase()===a.toLowerCase()},isArray:function(b){return Object.prototype.toString.apply(b)==="[object Array]"},$:function(b,a,c){a&&typeof a!="string"&&(c=a,a="");return typeof b=="string"?p(b,c?c.treeObj.get(0).ownerDocument:null):p("#"+b.tId+a,c?c.treeObj:null)},getMDom:function(b,a,c){if(!a)return null;for(;a&&a.id!==b.treeId;){for(var d=0,f=c.length;a.tagName&&d<f;d++)if(j.eqs(a.tagName,
c[d].tagName)&&a.getAttribute(c[d].attrName)!==null)return a;a=a.parentNode}return null},getNodeMainDom:function(b){return p(b).parent("li").get(0)||p(b).parentsUntil("li").parent().get(0)},isChildOrSelf:function(b,a){return p(b).closest("#"+a).length>0},uCanDo:function(){return!0}},i={addNodes:function(b,a,c,d){if(!b.data.keep.leaf||!a||a.isParent)if(j.isArray(c)||(c=[c]),b.data.simpleData.enable&&(c=h.transformTozTreeFormat(b,c)),a){var f=k(a,e.id.SWITCH,b),g=k(a,e.id.ICON,b),l=k(a,e.id.UL,b);if(!a.open)i.replaceSwitchClass(a,
f,e.folder.CLOSE),i.replaceIcoClass(a,g,e.folder.CLOSE),a.open=!1,l.css({display:"none"});h.addNodesData(b,a,c);i.createNodes(b,a.level+1,c,a);d||i.expandCollapseParentNode(b,a,!0)}else h.addNodesData(b,h.getRoot(b),c),i.createNodes(b,0,c,null)},appendNodes:function(b,a,c,d,f,g){if(!c)return[];for(var e=[],j=b.data.key.children,k=0,m=c.length;k<m;k++){var o=c[k];if(f){var t=(d?d:h.getRoot(b))[j].length==c.length&&k==0;h.initNode(b,a,o,d,t,k==c.length-1,g);h.addNodeCache(b,o)}t=[];o[j]&&o[j].length>
0&&(t=i.appendNodes(b,a+1,o[j],o,f,g&&o.open));g&&(i.makeDOMNodeMainBefore(e,b,o),i.makeDOMNodeLine(e,b,o),h.getBeforeA(b,o,e),i.makeDOMNodeNameBefore(e,b,o),h.getInnerBeforeA(b,o,e),i.makeDOMNodeIcon(e,b,o),h.getInnerAfterA(b,o,e),i.makeDOMNodeNameAfter(e,b,o),h.getAfterA(b,o,e),o.isParent&&o.open&&i.makeUlHtml(b,o,e,t.join("")),i.makeDOMNodeMainAfter(e,b,o),h.addCreatedNode(b,o))}return e},appendParentULDom:function(b,a){var c=[],d=k(a,b);!d.get(0)&&a.parentTId&&(i.appendParentULDom(b,a.getParentNode()),
d=k(a,b));var f=k(a,e.id.UL,b);f.get(0)&&f.remove();f=i.appendNodes(b,a.level+1,a[b.data.key.children],a,!1,!0);i.makeUlHtml(b,a,c,f.join(""));d.append(c.join(""))},asyncNode:function(b,a,c,d){var f,g;if(a&&!a.isParent)return j.apply(d),!1;else if(a&&a.isAjaxing)return!1;else if(j.apply(b.callback.beforeAsync,[b.treeId,a],!0)==!1)return j.apply(d),!1;if(a)a.isAjaxing=!0,k(a,e.id.ICON,b).attr({style:"","class":e.className.BUTTON+" "+e.className.ICO_LOADING});var l={};for(f=0,g=b.async.autoParam.length;a&&
f<g;f++){var q=b.async.autoParam[f].split("="),n=q;q.length>1&&(n=q[1],q=q[0]);l[n]=a[q]}if(j.isArray(b.async.otherParam))for(f=0,g=b.async.otherParam.length;f<g;f+=2)l[b.async.otherParam[f]]=b.async.otherParam[f+1];else for(var m in b.async.otherParam)l[m]=b.async.otherParam[m];var o=h.getRoot(b)._ver;p.ajax({contentType:b.async.contentType,type:b.async.type,url:j.apply(b.async.url,[b.treeId,a],b.async.url),data:l,dataType:b.async.dataType,success:function(f){if(o==h.getRoot(b)._ver){var g=[];try{g=
!f||f.length==0?[]:typeof f=="string"?eval("("+f+")"):f}catch(l){g=f}if(a)a.isAjaxing=null,a.zAsync=!0;i.setNodeLineIcos(b,a);g&&g!==""?(g=j.apply(b.async.dataFilter,[b.treeId,a,g],g),i.addNodes(b,a,g?j.clone(g):[],!!c)):i.addNodes(b,a,[],!!c);b.treeObj.trigger(e.event.ASYNC_SUCCESS,[b.treeId,a,f]);j.apply(d)}},error:function(c,d,f){if(o==h.getRoot(b)._ver){if(a)a.isAjaxing=null;i.setNodeLineIcos(b,a);b.treeObj.trigger(e.event.ASYNC_ERROR,[b.treeId,a,c,d,f])}}});return!0},cancelPreSelectedNode:function(b,
a){for(var c=h.getRoot(b).curSelectedList,d=c.length-1;d>=0;d--)if(!a||a===c[d])if(k(c[d],e.id.A,b).removeClass(e.node.CURSELECTED),a){h.removeSelectedNode(b,a);break}if(!a)h.getRoot(b).curSelectedList=[]},createNodeCallback:function(b){if(b.callback.onNodeCreated||b.view.addDiyDom)for(var a=h.getRoot(b);a.createdNodes.length>0;){var c=a.createdNodes.shift();j.apply(b.view.addDiyDom,[b.treeId,c]);b.callback.onNodeCreated&&b.treeObj.trigger(e.event.NODECREATED,[b.treeId,c])}},createNodes:function(b,
a,c,d){if(c&&c.length!=0){var f=h.getRoot(b),g=b.data.key.children,g=!d||d.open||!!k(d[g][0],b).get(0);f.createdNodes=[];a=i.appendNodes(b,a,c,d,!0,g);d?(d=k(d,e.id.UL,b),d.get(0)&&d.append(a.join(""))):b.treeObj.append(a.join(""));i.createNodeCallback(b)}},destroy:function(b){b&&(h.initCache(b),h.initRoot(b),m.unbindTree(b),m.unbindEvent(b),b.treeObj.empty(),delete r[b.treeId])},expandCollapseNode:function(b,a,c,d,f){var g=h.getRoot(b),l=b.data.key.children;if(a){if(g.expandTriggerFlag){var q=f,
f=function(){q&&q();a.open?b.treeObj.trigger(e.event.EXPAND,[b.treeId,a]):b.treeObj.trigger(e.event.COLLAPSE,[b.treeId,a])};g.expandTriggerFlag=!1}if(!a.open&&a.isParent&&(!k(a,e.id.UL,b).get(0)||a[l]&&a[l].length>0&&!k(a[l][0],b).get(0)))i.appendParentULDom(b,a),i.createNodeCallback(b);if(a.open==c)j.apply(f,[]);else{var c=k(a,e.id.UL,b),g=k(a,e.id.SWITCH,b),n=k(a,e.id.ICON,b);a.isParent?(a.open=!a.open,a.iconOpen&&a.iconClose&&n.attr("style",i.makeNodeIcoStyle(b,a)),a.open?(i.replaceSwitchClass(a,
g,e.folder.OPEN),i.replaceIcoClass(a,n,e.folder.OPEN),d==!1||b.view.expandSpeed==""?(c.show(),j.apply(f,[])):a[l]&&a[l].length>0?c.slideDown(b.view.expandSpeed,f):(c.show(),j.apply(f,[]))):(i.replaceSwitchClass(a,g,e.folder.CLOSE),i.replaceIcoClass(a,n,e.folder.CLOSE),d==!1||b.view.expandSpeed==""||!(a[l]&&a[l].length>0)?(c.hide(),j.apply(f,[])):c.slideUp(b.view.expandSpeed,f))):j.apply(f,[])}}else j.apply(f,[])},expandCollapseParentNode:function(b,a,c,d,f){a&&(a.parentTId?(i.expandCollapseNode(b,
a,c,d),a.parentTId&&i.expandCollapseParentNode(b,a.getParentNode(),c,d,f)):i.expandCollapseNode(b,a,c,d,f))},expandCollapseSonNode:function(b,a,c,d,f){var g=h.getRoot(b),e=b.data.key.children,g=a?a[e]:g[e],e=a?!1:d,j=h.getRoot(b).expandTriggerFlag;h.getRoot(b).expandTriggerFlag=!1;if(g)for(var k=0,m=g.length;k<m;k++)g[k]&&i.expandCollapseSonNode(b,g[k],c,e);h.getRoot(b).expandTriggerFlag=j;i.expandCollapseNode(b,a,c,d,f)},makeDOMNodeIcon:function(b,a,c){var d=h.getNodeName(a,c),d=a.view.nameIsHTML?
d:d.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");b.push("<span id='",c.tId,e.id.ICON,"' title='' treeNode",e.id.ICON," class='",i.makeNodeIcoClass(a,c),"' style='",i.makeNodeIcoStyle(a,c),"'></span><span id='",c.tId,e.id.SPAN,"'>",d,"</span>")},makeDOMNodeLine:function(b,a,c){b.push("<span id='",c.tId,e.id.SWITCH,"' title='' class='",i.makeNodeLineClass(a,c),"' treeNode",e.id.SWITCH,"></span>")},makeDOMNodeMainAfter:function(b){b.push("</li>")},makeDOMNodeMainBefore:function(b,
a,c){b.push("<li id='",c.tId,"' class='",e.className.LEVEL,c.level,"' tabindex='0' hidefocus='true' treenode>")},makeDOMNodeNameAfter:function(b){b.push("</a>")},makeDOMNodeNameBefore:function(b,a,c){var d=h.getNodeTitle(a,c),f=i.makeNodeUrl(a,c),g=i.makeNodeFontCss(a,c),l=[],k;for(k in g)l.push(k,":",g[k],";");b.push("<a id='",c.tId,e.id.A,"' class='",e.className.LEVEL,c.level,"' treeNode",e.id.A,' onclick="',c.click||"",'" ',f!=null&&f.length>0?"href='"+f+"'":""," target='",i.makeNodeTarget(c),
"' style='",l.join(""),"'");j.apply(a.view.showTitle,[a.treeId,c],a.view.showTitle)&&d&&b.push("title='",d.replace(/'/g,"&#39;").replace(/</g,"&lt;").replace(/>/g,"&gt;"),"'");b.push(">")},makeNodeFontCss:function(b,a){var c=j.apply(b.view.fontCss,[b.treeId,a],b.view.fontCss);return c&&typeof c!="function"?c:{}},makeNodeIcoClass:function(b,a){var c=["ico"];a.isAjaxing||(c[0]=(a.iconSkin?a.iconSkin+"_":"")+c[0],a.isParent?c.push(a.open?e.folder.OPEN:e.folder.CLOSE):c.push(e.folder.DOCU));return e.className.BUTTON+
" "+c.join("_")},makeNodeIcoStyle:function(b,a){var c=[];if(!a.isAjaxing){var d=a.isParent&&a.iconOpen&&a.iconClose?a.open?a.iconOpen:a.iconClose:a.icon;d&&c.push("background:url(",d,") 0 0 no-repeat;");(b.view.showIcon==!1||!j.apply(b.view.showIcon,[b.treeId,a],!0))&&c.push("width:0px;height:0px;")}return c.join("")},makeNodeLineClass:function(b,a){var c=[];b.view.showLine?a.level==0&&a.isFirstNode&&a.isLastNode?c.push(e.line.ROOT):a.level==0&&a.isFirstNode?c.push(e.line.ROOTS):a.isLastNode?c.push(e.line.BOTTOM):
c.push(e.line.CENTER):c.push(e.line.NOLINE);a.isParent?c.push(a.open?e.folder.OPEN:e.folder.CLOSE):c.push(e.folder.DOCU);return i.makeNodeLineClassEx(a)+c.join("_")},makeNodeLineClassEx:function(b){return e.className.BUTTON+" "+e.className.LEVEL+b.level+" "+e.className.SWITCH+" "},makeNodeTarget:function(b){return b.target||"_blank"},makeNodeUrl:function(b,a){var c=b.data.key.url;return a[c]?a[c]:null},makeUlHtml:function(b,a,c,d){c.push("<ul id='",a.tId,e.id.UL,"' class='",e.className.LEVEL,a.level,
" ",i.makeUlLineClass(b,a),"' style='display:",a.open?"block":"none","'>");c.push(d);c.push("</ul>")},makeUlLineClass:function(b,a){return b.view.showLine&&!a.isLastNode?e.line.LINE:""},removeChildNodes:function(b,a){if(a){var c=b.data.key.children,d=a[c];if(d){for(var f=0,g=d.length;f<g;f++)h.removeNodeCache(b,d[f]);h.removeSelectedNode(b);delete a[c];b.data.keep.parent?k(a,e.id.UL,b).empty():(a.isParent=!1,a.open=!1,c=k(a,e.id.SWITCH,b),d=k(a,e.id.ICON,b),i.replaceSwitchClass(a,c,e.folder.DOCU),
i.replaceIcoClass(a,d,e.folder.DOCU),k(a,e.id.UL,b).remove())}}},setFirstNode:function(b,a){var c=b.data.key.children;if(a[c].length>0)a[c][0].isFirstNode=!0},setLastNode:function(b,a){var c=b.data.key.children,d=a[c].length;if(d>0)a[c][d-1].isLastNode=!0},removeNode:function(b,a){var c=h.getRoot(b),d=b.data.key.children,f=a.parentTId?a.getParentNode():c;a.isFirstNode=!1;a.isLastNode=!1;a.getPreNode=function(){return null};a.getNextNode=function(){return null};if(h.getNodeCache(b,a.tId)){k(a,b).remove();
h.removeNodeCache(b,a);h.removeSelectedNode(b,a);for(var g=0,l=f[d].length;g<l;g++)if(f[d][g].tId==a.tId){f[d].splice(g,1);break}i.setFirstNode(b,f);i.setLastNode(b,f);var j,g=f[d].length;if(!b.data.keep.parent&&g==0)f.isParent=!1,f.open=!1,g=k(f,e.id.UL,b),l=k(f,e.id.SWITCH,b),j=k(f,e.id.ICON,b),i.replaceSwitchClass(f,l,e.folder.DOCU),i.replaceIcoClass(f,j,e.folder.DOCU),g.css("display","none");else if(b.view.showLine&&g>0){var n=f[d][g-1],g=k(n,e.id.UL,b),l=k(n,e.id.SWITCH,b);j=k(n,e.id.ICON,b);
f==c?f[d].length==1?i.replaceSwitchClass(n,l,e.line.ROOT):(c=k(f[d][0],e.id.SWITCH,b),i.replaceSwitchClass(f[d][0],c,e.line.ROOTS),i.replaceSwitchClass(n,l,e.line.BOTTOM)):i.replaceSwitchClass(n,l,e.line.BOTTOM);g.removeClass(e.line.LINE)}}},replaceIcoClass:function(b,a,c){if(a&&!b.isAjaxing&&(b=a.attr("class"),b!=void 0)){b=b.split("_");switch(c){case e.folder.OPEN:case e.folder.CLOSE:case e.folder.DOCU:b[b.length-1]=c}a.attr("class",b.join("_"))}},replaceSwitchClass:function(b,a,c){if(a){var d=
a.attr("class");if(d!=void 0){d=d.split("_");switch(c){case e.line.ROOT:case e.line.ROOTS:case e.line.CENTER:case e.line.BOTTOM:case e.line.NOLINE:d[0]=i.makeNodeLineClassEx(b)+c;break;case e.folder.OPEN:case e.folder.CLOSE:case e.folder.DOCU:d[1]=c}a.attr("class",d.join("_"));c!==e.folder.DOCU?a.removeAttr("disabled"):a.attr("disabled","disabled")}}},selectNode:function(b,a,c){c||i.cancelPreSelectedNode(b);k(a,e.id.A,b).addClass(e.node.CURSELECTED);h.addSelectedNode(b,a)},setNodeFontCss:function(b,
a){var c=k(a,e.id.A,b),d=i.makeNodeFontCss(b,a);d&&c.css(d)},setNodeLineIcos:function(b,a){if(a){var c=k(a,e.id.SWITCH,b),d=k(a,e.id.UL,b),f=k(a,e.id.ICON,b),g=i.makeUlLineClass(b,a);g.length==0?d.removeClass(e.line.LINE):d.addClass(g);c.attr("class",i.makeNodeLineClass(b,a));a.isParent?c.removeAttr("disabled"):c.attr("disabled","disabled");f.removeAttr("style");f.attr("style",i.makeNodeIcoStyle(b,a));f.attr("class",i.makeNodeIcoClass(b,a))}},setNodeName:function(b,a){var c=h.getNodeTitle(b,a),d=
k(a,e.id.SPAN,b);d.empty();b.view.nameIsHTML?d.html(h.getNodeName(b,a)):d.text(h.getNodeName(b,a));j.apply(b.view.showTitle,[b.treeId,a],b.view.showTitle)&&k(a,e.id.A,b).attr("title",!c?"":c)},setNodeTarget:function(b,a){k(a,e.id.A,b).attr("target",i.makeNodeTarget(a))},setNodeUrl:function(b,a){var c=k(a,e.id.A,b),d=i.makeNodeUrl(b,a);d==null||d.length==0?c.removeAttr("href"):c.attr("href",d)},switchNode:function(b,a){a.open||!j.canAsync(b,a)?i.expandCollapseNode(b,a,!a.open):b.async.enable?i.asyncNode(b,
a)||i.expandCollapseNode(b,a,!a.open):a&&i.expandCollapseNode(b,a,!a.open)}};p.fn.zTree={consts:{className:{BUTTON:"button",LEVEL:"level",ICO_LOADING:"ico_loading",SWITCH:"switch"},event:{NODECREATED:"ztree_nodeCreated",CLICK:"ztree_click",EXPAND:"ztree_expand",COLLAPSE:"ztree_collapse",ASYNC_SUCCESS:"ztree_async_success",ASYNC_ERROR:"ztree_async_error",REMOVE:"ztree_remove"},id:{A:"_a",ICON:"_ico",SPAN:"_span",SWITCH:"_switch",UL:"_ul"},line:{ROOT:"root",ROOTS:"roots",CENTER:"center",BOTTOM:"bottom",
NOLINE:"noline",LINE:"line"},folder:{OPEN:"open",CLOSE:"close",DOCU:"docu"},node:{CURSELECTED:"curSelectedNode"}},_z:{tools:j,view:i,event:m,data:h},getZTreeObj:function(b){return(b=h.getZTreeTools(b))?b:null},destroy:function(b){if(b&&b.length>0)i.destroy(h.getSetting(b));else for(var a in r)i.destroy(r[a])},init:function(b,a,c){var d=j.clone(M);p.extend(!0,d,a);d.treeId=b.attr("id");d.treeObj=b;d.treeObj.empty();r[d.treeId]=d;if(typeof document.body.style.maxHeight==="undefined")d.view.expandSpeed=
"";h.initRoot(d);b=h.getRoot(d);a=d.data.key.children;c=c?j.clone(j.isArray(c)?c:[c]):[];b[a]=d.data.simpleData.enable?h.transformTozTreeFormat(d,c):c;h.initCache(d);m.unbindTree(d);m.bindTree(d);m.unbindEvent(d);m.bindEvent(d);c={setting:d,addNodes:function(a,b,c){function e(){i.addNodes(d,a,h,c==!0)}if(!b)return null;a||(a=null);if(a&&!a.isParent&&d.data.keep.leaf)return null;var h=j.clone(j.isArray(b)?b:[b]);j.canAsync(d,a)?i.asyncNode(d,a,c,e):e();return h},cancelSelectedNode:function(a){i.cancelPreSelectedNode(d,
a)},destroy:function(){i.destroy(d)},expandAll:function(a){a=!!a;i.expandCollapseSonNode(d,null,a,!0);return a},expandNode:function(a,b,c,e,n){if(!a||!a.isParent)return null;b!==!0&&b!==!1&&(b=!a.open);if((n=!!n)&&b&&j.apply(d.callback.beforeExpand,[d.treeId,a],!0)==!1)return null;else if(n&&!b&&j.apply(d.callback.beforeCollapse,[d.treeId,a],!0)==!1)return null;b&&a.parentTId&&i.expandCollapseParentNode(d,a.getParentNode(),b,!1);if(b===a.open&&!c)return null;h.getRoot(d).expandTriggerFlag=n;if(!j.canAsync(d,
a)&&c)i.expandCollapseSonNode(d,a,b,!0,function(){if(e!==!1)try{k(a,d).focus().blur()}catch(b){}});else if(a.open=!b,i.switchNode(this.setting,a),e!==!1)try{k(a,d).focus().blur()}catch(m){}return b},getNodes:function(){return h.getNodes(d)},getNodeByParam:function(a,b,c){return!a?null:h.getNodeByParam(d,c?c[d.data.key.children]:h.getNodes(d),a,b)},getNodeByTId:function(a){return h.getNodeCache(d,a)},getNodesByParam:function(a,b,c){return!a?null:h.getNodesByParam(d,c?c[d.data.key.children]:h.getNodes(d),
a,b)},getNodesByParamFuzzy:function(a,b,c){return!a?null:h.getNodesByParamFuzzy(d,c?c[d.data.key.children]:h.getNodes(d),a,b)},getNodesByFilter:function(a,b,c,e){b=!!b;return!a||typeof a!="function"?b?null:[]:h.getNodesByFilter(d,c?c[d.data.key.children]:h.getNodes(d),a,b,e)},getNodeIndex:function(a){if(!a)return null;for(var b=d.data.key.children,c=a.parentTId?a.getParentNode():h.getRoot(d),e=0,i=c[b].length;e<i;e++)if(c[b][e]==a)return e;return-1},getSelectedNodes:function(){for(var a=[],b=h.getRoot(d).curSelectedList,
c=0,e=b.length;c<e;c++)a.push(b[c]);return a},isSelectedNode:function(a){return h.isSelectedNode(d,a)},reAsyncChildNodes:function(a,b,c){if(this.setting.async.enable){var j=!a;j&&(a=h.getRoot(d));if(b=="refresh"){for(var b=this.setting.data.key.children,m=0,p=a[b]?a[b].length:0;m<p;m++)h.removeNodeCache(d,a[b][m]);h.removeSelectedNode(d);a[b]=[];j?this.setting.treeObj.empty():k(a,e.id.UL,d).empty()}i.asyncNode(this.setting,j?null:a,!!c)}},refresh:function(){this.setting.treeObj.empty();var a=h.getRoot(d),
b=a[d.data.key.children];h.initRoot(d);a[d.data.key.children]=b;h.initCache(d);i.createNodes(d,0,a[d.data.key.children])},removeChildNodes:function(a){if(!a)return null;var b=a[d.data.key.children];i.removeChildNodes(d,a);return b?b:null},removeNode:function(a,b){a&&(b=!!b,b&&j.apply(d.callback.beforeRemove,[d.treeId,a],!0)==!1||(i.removeNode(d,a),b&&this.setting.treeObj.trigger(e.event.REMOVE,[d.treeId,a])))},selectNode:function(a,b){if(a&&j.uCanDo(d)){b=d.view.selectedMulti&&b;if(a.parentTId)i.expandCollapseParentNode(d,
a.getParentNode(),!0,!1,function(){try{k(a,d).focus().blur()}catch(b){}});else try{k(a,d).focus().blur()}catch(c){}i.selectNode(d,a,b)}},transformTozTreeNodes:function(a){return h.transformTozTreeFormat(d,a)},transformToArray:function(a){return h.transformToArrayFormat(d,a)},updateNode:function(a){a&&k(a,d).get(0)&&j.uCanDo(d)&&(i.setNodeName(d,a),i.setNodeTarget(d,a),i.setNodeUrl(d,a),i.setNodeLineIcos(d,a),i.setNodeFontCss(d,a))}};b.treeTools=c;h.setZTreeTools(d,c);b[a]&&b[a].length>0?i.createNodes(d,
0,b[a]):d.async.enable&&d.async.url&&d.async.url!==""&&i.asyncNode(d);return c}};var N=p.fn.zTree,k=j.$,e=N.consts})(jQuery);

/* Copyright (c) 2012, 2014 Hyunje Alex Jun and other contributors
 * Licensed under the MIT License
 */
(function (factory) {
  'use strict';

  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['jquery'], factory);
  } else if (typeof exports === 'object') {
    // Node/CommonJS
    factory(require('jquery'));
  } else {
    // Browser globals
    factory(jQuery);
  }
})(function ($) {
  'use strict';

  function parseToInt(x) {
    if (typeof x === 'string') {
      return parseInt(x, 10);
    } else {
      return ~~x;
    }
  }

  var defaultSettings = {
    wheelSpeed: 1,
    wheelPropagation: false,
    minScrollbarLength: null,
    maxScrollbarLength: null,
    useBothWheelAxes: false,
    useKeyboard: true,
    suppressScrollX: false,
    suppressScrollY: false,
    scrollXMarginOffset: 0,
    scrollYMarginOffset: 0,
    includePadding: false,
    hiddenScrollY:false,// modified 隐藏右滚动条
    setOffsetRight:false,// modified setOffsetRight为true时下面的offsetRight生效
    offsetRight:3// modified 右边偏移量
  };

  var incrementingId = 0;
  var eventClassFactory = function () {
    var id = incrementingId++;
    return function (eventName) {
      var className = '.perfect-scrollbar-' + id;
      if (typeof eventName === 'undefined') {
        return className;
      } else {
        return eventName + className;
      }
    };
  };
  
	var userAgent = navigator.userAgent.toLowerCase(),
		msie = /msie/.test( userAgent ) && !/opera/.test( userAgent );
	if(msie) {
		jQuery.fn.perfectScrollbar = function(){};
	}
	else {
		jQuery.fn.perfectScrollbar = function (suppliedSettings, option) {
			
			return this.each(function () {
				var settings = jQuery.extend(true, {}, defaultSettings);
				var $this = jQuery(this);
				
				if (typeof suppliedSettings === "object") {
					// Override default settings with any supplied
					jQuery.extend(true, settings, suppliedSettings);
				} else {
					// If no setting was supplied, then the first param must be the option
					option = suppliedSettings;
				}
				
				// Catch options
				if (option === 'update') {
					if ($this.data('perfect-scrollbar-update')) {
						$this.data('perfect-scrollbar-update')();
					}
					return $this;
				}
				else if (option === 'destroy') {
					if ($this.data('perfect-scrollbar-destroy')) {
						$this.data('perfect-scrollbar-destroy')();
					}
					return $this;
				}
				
				if ($this.data('perfect-scrollbar')) {
					// if there's already perfect-scrollbar
					return $this.data('perfect-scrollbar');
				}
				
				
				// Or generate new perfectScrollbar
				
				$this.addClass('ps-container');
				
				var containerWidth;
				var containerHeight;
				var contentWidth;
				var contentHeight;
				
				var isRtl = $this.css('direction') === "rtl";
				var eventClass = eventClassFactory();
				var ownerDocument = this.ownerDocument || document;
				
				var $scrollbarXRail = jQuery("<div class='ps-scrollbar-x-rail'>").appendTo($this);
				var $scrollbarX = jQuery("<div class='ps-scrollbar-x'>").appendTo($scrollbarXRail);
				var scrollbarXActive;
				var scrollbarXWidth;
				var scrollbarXLeft;
				var scrollbarXBottom = parseToInt($scrollbarXRail.css('bottom'));
				var isScrollbarXUsingBottom = scrollbarXBottom === scrollbarXBottom; // !isNaN
				var scrollbarXTop = isScrollbarXUsingBottom ? null : parseToInt($scrollbarXRail.css('top'));
				var railBorderXWidth = parseToInt($scrollbarXRail.css('borderLeftWidth')) + parseToInt($scrollbarXRail.css('borderRightWidth'));
				
				var $scrollbarYRail = jQuery("<div class='ps-scrollbar-y-rail'>").appendTo($this);
				var $scrollbarY = jQuery("<div class='ps-scrollbar-y'>").appendTo($scrollbarYRail);
				var scrollbarYActive;
				var scrollbarYHeight;
				var scrollbarYTop;
				var scrollbarYRight = parseToInt($scrollbarYRail.css('right'));
				var isScrollbarYUsingRight = scrollbarYRight === scrollbarYRight; // !isNaN
				var scrollbarYLeft = isScrollbarYUsingRight ? null : parseToInt($scrollbarYRail.css('left'));
				var railBorderYWidth = parseToInt($scrollbarYRail.css('borderTopWidth')) + parseToInt($scrollbarYRail.css('borderBottomWidth'));
				
				function updateScrollTop(currentTop, deltaY) {
					var newTop = currentTop + deltaY;
					var maxTop = containerHeight - scrollbarYHeight;
					
					if (newTop < 0) {
						scrollbarYTop = 0;
					} else if (newTop > maxTop) {
						scrollbarYTop = maxTop;
					} else {
						scrollbarYTop = newTop;
					}
					
					var scrollTop = parseToInt(scrollbarYTop * (contentHeight - containerHeight) / (containerHeight - scrollbarYHeight));
					$this.scrollTop(scrollTop);
				}
				
				function updateScrollLeft(currentLeft, deltaX) {
					var newLeft = currentLeft + deltaX;
					var maxLeft = containerWidth - scrollbarXWidth;
					
					if (newLeft < 0) {
						scrollbarXLeft = 0;
					} else if (newLeft > maxLeft) {
						scrollbarXLeft = maxLeft;
					} else {
						scrollbarXLeft = newLeft;
					}
					
					var scrollLeft = parseToInt(scrollbarXLeft * (contentWidth - containerWidth) / (containerWidth - scrollbarXWidth));
					$this.scrollLeft(scrollLeft);
				}
				
				function getThumbSize(thumbSize) {
					if (settings.minScrollbarLength) {
						thumbSize = Math.max(thumbSize, settings.minScrollbarLength);
					}
					if (settings.maxScrollbarLength) {
						thumbSize = Math.min(thumbSize, settings.maxScrollbarLength);
					}
					return thumbSize;
				}
				
				function updateCss() {
					var xRailOffset = {width: containerWidth, display: scrollbarXActive ? "inherit" : "none"};
					if (isRtl) {
						xRailOffset.left = $this.scrollLeft() + containerWidth - contentWidth;
					} else {
						xRailOffset.left = $this.scrollLeft();
					}
					if (isScrollbarXUsingBottom) {
						xRailOffset.bottom = scrollbarXBottom - $this.scrollTop();
					} else {
						xRailOffset.top = scrollbarXTop + $this.scrollTop();
					}
					$scrollbarXRail.css(xRailOffset);
					
					var railYOffset = {top: $this.scrollTop(), height: containerHeight, display: scrollbarYActive ? "inherit" : "none"};
					// modified start 隐藏纵轴滚动条
					if(settings.hiddenScrollY){
						railYOffset.display = "none";
					}
					// modified end
					
					if (isScrollbarYUsingRight) {
						if (isRtl) {
							railYOffset.right = contentWidth - $this.scrollLeft() - scrollbarYRight - $scrollbarY.outerWidth();
						} else {
							railYOffset.right = scrollbarYRight - $this.scrollLeft();
						}
						// modified start 窄版时滚动条右边距为0
						if(settings.setOffsetRight){
							railYOffset.right = settings.offsetRight;
						}
						// modified end
						
					} else {
						if (isRtl) {
							railYOffset.left = $this.scrollLeft() + containerWidth * 2 - contentWidth - scrollbarYLeft - $scrollbarY.outerWidth();
						} else {
							railYOffset.left = scrollbarYLeft + $this.scrollLeft();
						}
					}
					$scrollbarYRail.css(railYOffset);
					
					$scrollbarX.css({left: scrollbarXLeft, width: scrollbarXWidth - railBorderXWidth});
					$scrollbarY.css({top: scrollbarYTop, height: scrollbarYHeight - railBorderYWidth});
				}
				
				function updateGeometry() {
					// Hide scrollbars not to affect scrollWidth and scrollHeight
					$this.removeClass('ps-active-x');
					$this.removeClass('ps-active-y');
					
					containerWidth = settings.includePadding ? $this.innerWidth() : $this.width();
					containerHeight = settings.includePadding ? $this.innerHeight() : $this.height();
					contentWidth = $this.prop('scrollWidth');
					contentHeight = $this.prop('scrollHeight');
					
					if (!settings.suppressScrollX && containerWidth + settings.scrollXMarginOffset < contentWidth) {
						scrollbarXActive = true;
						scrollbarXWidth = getThumbSize(parseToInt(containerWidth * containerWidth / contentWidth));
						scrollbarXLeft = parseToInt($this.scrollLeft() * (containerWidth - scrollbarXWidth) / (contentWidth - containerWidth));
					} else {
						scrollbarXActive = false;
						scrollbarXWidth = 0;
						scrollbarXLeft = 0;
						$this.scrollLeft(0);
					}
					
					if (!settings.suppressScrollY && containerHeight + settings.scrollYMarginOffset < contentHeight) {
						scrollbarYActive = true;
						scrollbarYHeight = getThumbSize(parseToInt(containerHeight * containerHeight / contentHeight));
						scrollbarYTop = parseToInt($this.scrollTop() * (containerHeight - scrollbarYHeight) / (contentHeight - containerHeight));
					} else {
						scrollbarYActive = false;
						scrollbarYHeight = 0;
						scrollbarYTop = 0;
						$this.scrollTop(0);
					}
					
					if (scrollbarXLeft >= containerWidth - scrollbarXWidth) {
						scrollbarXLeft = containerWidth - scrollbarXWidth;
					}
					if (scrollbarYTop >= containerHeight - scrollbarYHeight) {
						scrollbarYTop = containerHeight - scrollbarYHeight;
					}
					
					updateCss();
					
					if (scrollbarXActive) {
						$this.addClass('ps-active-x');
					}
					if (scrollbarYActive) {
						$this.addClass('ps-active-y');
					}
				}
				
				function bindMouseScrollXHandler() {
					var currentLeft;
					var currentPageX;
					
					var inScrolling = false;
					$scrollbarX.bind(eventClass('mousedown'), function (e) {
						currentPageX = e.pageX;
						currentLeft = $scrollbarX.position().left;
						$scrollbarXRail.addClass('in-scrolling');
						inScrolling = true;
						e.stopPropagation();
						e.preventDefault();
					});
					
					jQuery(ownerDocument).bind(eventClass('mousemove'), function (e) {
						if (inScrolling) {
							updateScrollLeft(currentLeft, e.pageX - currentPageX);
							updateGeometry();
							e.stopPropagation();
							e.preventDefault();
						}
					});
					
					jQuery(ownerDocument).bind(eventClass('mouseup'), function (e) {
						if (inScrolling) {
							inScrolling = false;
							$scrollbarXRail.removeClass('in-scrolling');
						}
					});
					
					currentLeft =
						currentPageX = null;
				}
				
				function bindMouseScrollYHandler() {
					var currentTop;
					var currentPageY;
					
					var inScrolling = false;
					$scrollbarY.bind(eventClass('mousedown'), function (e) {
						currentPageY = e.pageY;
						currentTop = $scrollbarY.position().top;
						inScrolling = true;
						$scrollbarYRail.addClass('in-scrolling');
						e.stopPropagation();
						e.preventDefault();
					});
					
					jQuery(ownerDocument).bind(eventClass('mousemove'), function (e) {
						if (inScrolling) {
							updateScrollTop(currentTop, e.pageY - currentPageY);
							updateGeometry();
							e.stopPropagation();
							e.preventDefault();
						}
					});
					
					jQuery(ownerDocument).bind(eventClass('mouseup'), function (e) {
						if (inScrolling) {
							inScrolling = false;
							$scrollbarYRail.removeClass('in-scrolling');
						}
					});
					
					currentTop =
						currentPageY = null;
				}
				
				// check if the default scrolling should be prevented.
				function shouldPreventDefault(deltaX, deltaY) {
					var scrollTop = $this.scrollTop();
					if (deltaX === 0) {
						if (!scrollbarYActive) {
							return false;
						}
						if ((scrollTop === 0 && deltaY > 0) || (scrollTop >= contentHeight - containerHeight && deltaY < 0)) {
							return !settings.wheelPropagation;
						}
					}
					
					var scrollLeft = $this.scrollLeft();
					if (deltaY === 0) {
						if (!scrollbarXActive) {
							return false;
						}
						if ((scrollLeft === 0 && deltaX < 0) || (scrollLeft >= contentWidth - containerWidth && deltaX > 0)) {
							return !settings.wheelPropagation;
						}
					}
					return true;
				}
				
				function bindMouseWheelHandler() {
					var shouldPrevent = false;
					
					function getDeltaFromEvent(e) {
						var deltaX = e.originalEvent.deltaX;
						var deltaY = -1 * e.originalEvent.deltaY;
						
						if (typeof deltaX === "undefined" || typeof deltaY === "undefined") {
							// OS X Safari
							deltaX = -1 * e.originalEvent.wheelDeltaX / 6;
							deltaY = e.originalEvent.wheelDeltaY / 6;
						}
						
						if (e.originalEvent.deltaMode && e.originalEvent.deltaMode === 1) {
							// Firefox in deltaMode 1: Line scrolling
							deltaX *= 10;
							deltaY *= 10;
						}
						
						if (deltaX !== deltaX && deltaY !== deltaY/* NaN checks */) {
							// IE in some mouse drivers
							deltaX = 0;
							deltaY = e.originalEvent.wheelDelta;
						}
						
						return [deltaX, deltaY];
					}
					
					function mousewheelHandler(e) {
						var delta = getDeltaFromEvent(e);
						
						var deltaX = delta[0];
						var deltaY = delta[1];
						
						shouldPrevent = false;
						if (!settings.useBothWheelAxes) {
							// deltaX will only be used for horizontal scrolling and deltaY will
							// only be used for vertical scrolling - this is the default
							$this.scrollTop($this.scrollTop() - (deltaY * settings.wheelSpeed));
							$this.scrollLeft($this.scrollLeft() + (deltaX * settings.wheelSpeed));
						} else if (scrollbarYActive && !scrollbarXActive) {
							// only vertical scrollbar is active and useBothWheelAxes option is
							// active, so let's scroll vertical bar using both mouse wheel axes
							if (deltaY) {
								$this.scrollTop($this.scrollTop() - (deltaY * settings.wheelSpeed));
							} else {
								$this.scrollTop($this.scrollTop() + (deltaX * settings.wheelSpeed));
							}
							shouldPrevent = true;
						} else if (scrollbarXActive && !scrollbarYActive) {
							// useBothWheelAxes and only horizontal bar is active, so use both
							// wheel axes for horizontal bar
							if (deltaX) {
								$this.scrollLeft($this.scrollLeft() + (deltaX * settings.wheelSpeed));
							} else {
								$this.scrollLeft($this.scrollLeft() - (deltaY * settings.wheelSpeed));
							}
							shouldPrevent = true;
						}
						
						updateGeometry();
						// modified start 消息记录的鼠标滚动事件会被禁止
						// 改 shouldPrevent = (shouldPrevent || shouldPreventDefault(deltaX, deltaY));
						// 为 shouldPrevent = shouldPreventDefault(deltaX, deltaY);
						shouldPrevent = shouldPreventDefault(deltaX, deltaY);
						// modified end 
						if (shouldPrevent) {
							e.stopPropagation();
							e.preventDefault();
						}
					}
					
					if (typeof window.onwheel !== "undefined") {
						$this.bind(eventClass('wheel'), mousewheelHandler);
					} else if (typeof window.onmousewheel !== "undefined") {
						$this.bind(eventClass('mousewheel'), mousewheelHandler);
					}
				}
				
				function bindKeyboardHandler() {
					var hovered = false;
					$this.bind(eventClass('mouseenter'), function (e) {
						hovered = true;
					});
					$this.bind(eventClass('mouseleave'), function (e) {
						hovered = false;
					});
					
					var shouldPrevent = false;
					jQuery(ownerDocument).bind(eventClass('keydown'), function (e) {
						if (e.isDefaultPrevented && e.isDefaultPrevented()) {
							return;
						}
						
						if (!hovered) {
							return;
						}
						
						var activeElement = document.activeElement ? document.activeElement : ownerDocument.activeElement;
						// go deeper if element is a webcomponent
						while (activeElement.shadowRoot) {
							activeElement = activeElement.shadowRoot.activeElement;
						}
						if (jQuery(activeElement).is(":input,[contenteditable]")) {
							return;
						}
						
						var deltaX = 0;
						var deltaY = 0;
						
						switch (e.which) {
						case 37: // left
							deltaX = -30;
							break;
						case 38: // up
							deltaY = 30;
							break;
						case 39: // right
							deltaX = 30;
							break;
						case 40: // down
							deltaY = -30;
							break;
						case 33: // page up
							deltaY = 90;
							break;
						case 32: // space bar
						case 34: // page down
							deltaY = -90;
							break;
						case 35: // end
							if (e.ctrlKey) {
								deltaY = -contentHeight;
							} else {
								deltaY = -containerHeight;
							}
							break;
						case 36: // home
							if (e.ctrlKey) {
								deltaY = $this.scrollTop();
							} else {
								deltaY = containerHeight;
							}
							break;
						default:
							return;
						}
						
						$this.scrollTop($this.scrollTop() - deltaY);
						$this.scrollLeft($this.scrollLeft() + deltaX);
						
						shouldPrevent = shouldPreventDefault(deltaX, deltaY);
						if (shouldPrevent) {
							e.preventDefault();
						}
					});
				}
				
				function bindRailClickHandler() {
					function stopPropagation(e) { e.stopPropagation(); }
					
					$scrollbarY.bind(eventClass('click'), stopPropagation);
					$scrollbarYRail.bind(eventClass('click'), function (e) {
						var halfOfScrollbarLength = parseToInt(scrollbarYHeight / 2);
						var positionTop = e.pageY - $scrollbarYRail.offset().top - halfOfScrollbarLength;
						var maxPositionTop = containerHeight - scrollbarYHeight;
						var positionRatio = positionTop / maxPositionTop;
						
						if (positionRatio < 0) {
							positionRatio = 0;
						} else if (positionRatio > 1) {
							positionRatio = 1;
						}
						
						$this.scrollTop((contentHeight - containerHeight) * positionRatio);
					});
					
					$scrollbarX.bind(eventClass('click'), stopPropagation);
					$scrollbarXRail.bind(eventClass('click'), function (e) {
						var halfOfScrollbarLength = parseToInt(scrollbarXWidth / 2);
						var positionLeft = e.pageX - $scrollbarXRail.offset().left - halfOfScrollbarLength;
						var maxPositionLeft = containerWidth - scrollbarXWidth;
						var positionRatio = positionLeft / maxPositionLeft;
						
						if (positionRatio < 0) {
							positionRatio = 0;
						} else if (positionRatio > 1) {
							positionRatio = 1;
						}
						
						$this.scrollLeft((contentWidth - containerWidth) * positionRatio);
					});
				}
				
				function bindSelectionHandler() {
					function getRangeNode() {
						var selection = window.getSelection ? window.getSelection() :
							document.getSlection ? document.getSlection() : {rangeCount: 0};
							if (selection.rangeCount === 0) {
								return null;
							} else {
								return selection.getRangeAt(0).commonAncestorContainer;
							}
					}
					
					var scrollingLoop = null;
					var scrollDiff = {top: 0, left: 0};
					function startScrolling() {
						if (!scrollingLoop) {
							scrollingLoop = setInterval(function () {
								$this.scrollTop($this.scrollTop() + scrollDiff.top);
								$this.scrollLeft($this.scrollLeft() + scrollDiff.left);
								updateGeometry();
							}, 50); // every .1 sec
						}
					}
					function stopScrolling() {
						if (scrollingLoop) {
							clearInterval(scrollingLoop);
							scrollingLoop = null;
						}
						$scrollbarXRail.removeClass('in-scrolling');
						$scrollbarYRail.removeClass('in-scrolling');
					}
					
					var isSelected = false;
					jQuery(ownerDocument).bind(eventClass('selectionchange'), function (e) {
						if (jQuery.contains($this[0], getRangeNode())) {
							isSelected = true;
						} else {
							isSelected = false;
							stopScrolling();
						}
					});
					jQuery(window).bind(eventClass('mouseup'), function (e) {
						if (isSelected) {
							isSelected = false;
							stopScrolling();
						}
					});
					
					jQuery(window).bind(eventClass('mousemove'), function (e) {
						if (isSelected) {
							var mousePosition = {x: e.pageX, y: e.pageY};
							var containerOffset = $this.offset();
							var containerGeometry = {
									left: containerOffset.left,
									right: containerOffset.left + $this.outerWidth(),
									top: containerOffset.top,
									bottom: containerOffset.top + $this.outerHeight()
							};
							
							if (mousePosition.x < containerGeometry.left + 3) {
								scrollDiff.left = -5;
								$scrollbarXRail.addClass('in-scrolling');
							} else if (mousePosition.x > containerGeometry.right - 3) {
								scrollDiff.left = 5;
								$scrollbarXRail.addClass('in-scrolling');
							} else {
								scrollDiff.left = 0;
							}
							
							if (mousePosition.y < containerGeometry.top + 3) {
								if (containerGeometry.top + 3 - mousePosition.y < 5) {
									scrollDiff.top = -5;
								} else {
									scrollDiff.top = -20;
								}
								$scrollbarYRail.addClass('in-scrolling');
							} else if (mousePosition.y > containerGeometry.bottom - 3) {
								if (mousePosition.y - containerGeometry.bottom + 3 < 5) {
									scrollDiff.top = 5;
								} else {
									scrollDiff.top = 20;
								}
								$scrollbarYRail.addClass('in-scrolling');
							} else {
								scrollDiff.top = 0;
							}
							
							if (scrollDiff.top === 0 && scrollDiff.left === 0) {
								stopScrolling();
							} else {
								startScrolling();
							}
						}
					});
				}
				
				function bindTouchHandler(supportsTouch, supportsIePointer) {
					function applyTouchMove(differenceX, differenceY) {
						$this.scrollTop($this.scrollTop() - differenceY);
						$this.scrollLeft($this.scrollLeft() - differenceX);
						
						updateGeometry();
					}
					
					var startOffset = {};
					var startTime = 0;
					var speed = {};
					var breakingProcess = null;
					var inGlobalTouch = false;
					var inLocalTouch = false;
					
					function globalTouchStart(e) {
						inGlobalTouch = true;
					}
					function globalTouchEnd(e) {
						inGlobalTouch = false;
					}
					
					function getTouch(e) {
						if (e.originalEvent.targetTouches) {
							return e.originalEvent.targetTouches[0];
						} else {
							// Maybe IE pointer
							return e.originalEvent;
						}
					}
					function shouldHandle(e) {
						var event = e.originalEvent;
						if (event.targetTouches && event.targetTouches.length === 1) {
							return true;
						}
						if (event.pointerType && event.pointerType !== 'mouse') {
							return true;
						}
						return false;
					}
					function touchStart(e) {
						if (shouldHandle(e)) {
							inLocalTouch = true;
							
							var touch = getTouch(e);
							
							startOffset.pageX = touch.pageX;
							startOffset.pageY = touch.pageY;
							
							startTime = (new Date()).getTime();
							
							if (breakingProcess !== null) {
								clearInterval(breakingProcess);
							}
							
							e.stopPropagation();
						}
					}
					function touchMove(e) {
						if (!inGlobalTouch && inLocalTouch && shouldHandle(e)) {
							var touch = getTouch(e);
							
							var currentOffset = {pageX: touch.pageX, pageY: touch.pageY};
							
							var differenceX = currentOffset.pageX - startOffset.pageX;
							var differenceY = currentOffset.pageY - startOffset.pageY;
							
							applyTouchMove(differenceX, differenceY);
							startOffset = currentOffset;
							
							var currentTime = (new Date()).getTime();
							
							var timeGap = currentTime - startTime;
							if (timeGap > 0) {
								speed.x = differenceX / timeGap;
								speed.y = differenceY / timeGap;
								startTime = currentTime;
							}
							
							e.stopPropagation();
							e.preventDefault();
						}
					}
					function touchEnd(e) {
						if (!inGlobalTouch && inLocalTouch) {
							inLocalTouch = false;
							
							clearInterval(breakingProcess);
							breakingProcess = setInterval(function () {
								if (Math.abs(speed.x) < 0.01 && Math.abs(speed.y) < 0.01) {
									clearInterval(breakingProcess);
									return;
								}
								
								applyTouchMove(speed.x * 30, speed.y * 30);
								
								speed.x *= 0.8;
								speed.y *= 0.8;
							}, 10);
						}
					}
					
					if (supportsTouch) {
						jQuery(window).bind(eventClass("touchstart"), globalTouchStart);
						jQuery(window).bind(eventClass("touchend"), globalTouchEnd);
						$this.bind(eventClass("touchstart"), touchStart);
						$this.bind(eventClass("touchmove"), touchMove);
						$this.bind(eventClass("touchend"), touchEnd);
					}
					
					if (supportsIePointer) {
						if (window.PointerEvent) {
							jQuery(window).bind(eventClass("pointerdown"), globalTouchStart);
							jQuery(window).bind(eventClass("pointerup"), globalTouchEnd);
							$this.bind(eventClass("pointerdown"), touchStart);
							$this.bind(eventClass("pointermove"), touchMove);
							$this.bind(eventClass("pointerup"), touchEnd);
						} else if (window.MSPointerEvent) {
							jQuery(window).bind(eventClass("MSPointerDown"), globalTouchStart);
							jQuery(window).bind(eventClass("MSPointerUp"), globalTouchEnd);
							$this.bind(eventClass("MSPointerDown"), touchStart);
							$this.bind(eventClass("MSPointerMove"), touchMove);
							$this.bind(eventClass("MSPointerUp"), touchEnd);
						}
					}
				}
				
				function bindScrollHandler() {
					$this.bind(eventClass('scroll'), function (e) {
						updateGeometry();
					});
				}
				
				function destroy() {
					$this.unbind(eventClass());
					jQuery(window).unbind(eventClass());
					jQuery(ownerDocument).unbind(eventClass());
					$this.data('perfect-scrollbar', null);
					$this.data('perfect-scrollbar-update', null);
					$this.data('perfect-scrollbar-destroy', null);
					$scrollbarX.remove();
					$scrollbarY.remove();
					$scrollbarXRail.remove();
					$scrollbarYRail.remove();
					
					// clean all variables
					$scrollbarXRail =
						$scrollbarYRail =
							$scrollbarX =
								$scrollbarY =
									scrollbarXActive =
										scrollbarYActive =
											containerWidth =
												containerHeight =
													contentWidth =
														contentHeight =
															scrollbarXWidth =
																scrollbarXLeft =
																	scrollbarXBottom =
																		isScrollbarXUsingBottom =
																			scrollbarXTop =
																				scrollbarYHeight =
																					scrollbarYTop =
																						scrollbarYRight =
																							isScrollbarYUsingRight =
																								scrollbarYLeft =
																									isRtl =
																										eventClass = null;
				}
				
				var supportsTouch = (('ontouchstart' in window) || window.DocumentTouch && document instanceof window.DocumentTouch);
				var supportsIePointer = window.navigator.msMaxTouchPoints !== null;
				
				function initialize() {
					updateGeometry();
					bindScrollHandler();
					bindMouseScrollXHandler();
					bindMouseScrollYHandler();
					bindRailClickHandler();
					bindSelectionHandler();
					bindMouseWheelHandler();
					
					if (supportsTouch || supportsIePointer) {
						bindTouchHandler(supportsTouch, supportsIePointer);
					}
					if (settings.useKeyboard) {
						bindKeyboardHandler();
					}
					$this.data('perfect-scrollbar', $this);
					$this.data('perfect-scrollbar-update', updateGeometry);
					$this.data('perfect-scrollbar-destroy', destroy);
				}
				
				initialize();
				
				return $this;
			});
		};
	}
});

// Spectrum Colorpicker v1.5.0
// https://github.com/bgrins/spectrum
// Author: Brian Grinstead
// License: MIT

(function (window, $, undefined) {
    "use strict";

    var defaultOpts = {

        // Callbacks
        beforeShow: noop,
        move: noop,
        change: noop,
        show: noop,
        hide: noop,

        // Options
        color: false,
        flat: false,
        showInput: false,
        allowEmpty: false,
        showButtons: true,
        clickoutFiresChange: false,
        showInitial: false,
        showPalette: false,
        showPaletteOnly: false,
        hideAfterPaletteSelect: false,
        togglePaletteOnly: false,
        showSelectionPalette: true,
        localStorageKey: false,
        appendTo: "body",
        maxSelectionSize: 7,
        cancelText: "cancel",
        chooseText: "choose",
        togglePaletteMoreText: "more",
        togglePaletteLessText: "less",
        clearText: "Clear Color Selection",
        noColorSelectedText: "No Color Selected",
        preferredFormat: false,
        className: "", // Deprecated - use containerClassName and replacerClassName instead.
        containerClassName: "",
        replacerClassName: "",
        showAlpha: false,
        theme: "sp-light",
        palette: [["#ffffff", "#000000", "#ff0000", "#ff8000", "#ffff00", "#008000", "#0000ff", "#4b0082", "#9400d3"]],
        selectionPalette: [],
        disabled: false
    },
    spectrums = [],
    IE = !!/msie/i.exec( window.navigator.userAgent ),
    rgbaSupport = (function() {
        function contains( str, substr ) {
            return !!~('' + str).indexOf(substr);
        }

        var elem = document.createElement('div');
        var style = elem.style;
        style.cssText = 'background-color:rgba(0,0,0,.5)';
        return contains(style.backgroundColor, 'rgba') || contains(style.backgroundColor, 'hsla');
    })(),
    inputTypeColorSupport = (function() {
        var colorInput = $("<input type='color' value='!' />")[0];
        return colorInput.type === "color" && colorInput.value !== "!";
    })(),
    replaceInput = [
        "<div class='sp-replacer'>",
            "<div class='sp-preview'><div class='sp-preview-inner'></div></div>",
            "<div class='sp-dd'>&#9660;</div>",
        "</div>"
    ].join(''),
    markup = (function () {

        // IE does not support gradients with multiple stops, so we need to simulate
        //  that for the rainbow slider with 8 divs that each have a single gradient
        var gradientFix = "";
        if (IE) {
            for (var i = 1; i <= 6; i++) {
                gradientFix += "<div class='sp-" + i + "'></div>";
            }
        }

        return [
            "<div class='sp-container sp-hidden'>",
                "<div class='sp-palette-container'>",
                    "<div class='sp-palette sp-thumb sp-cf'></div>",
                    "<div class='sp-palette-button-container sp-cf'>",
                        "<button type='button' class='sp-palette-toggle'></button>",
                    "</div>",
                "</div>",
                "<div class='sp-picker-container'>",
                    "<div class='sp-top sp-cf'>",
                        "<div class='sp-fill'></div>",
                        "<div class='sp-top-inner'>",
                            "<div class='sp-color'>",
                                "<div class='sp-sat'>",
                                    "<div class='sp-val'>",
                                        "<div class='sp-dragger'></div>",
                                    "</div>",
                                "</div>",
                            "</div>",
                            "<div class='sp-clear sp-clear-display'>",
                            "</div>",
                            "<div class='sp-hue'>",
                                "<div class='sp-slider'></div>",
                                gradientFix,
                            "</div>",
                        "</div>",
                        "<div class='sp-alpha'><div class='sp-alpha-inner'><div class='sp-alpha-handle'></div></div></div>",
                    "</div>",
                    "<div class='sp-input-container sp-cf'>",
                        "<input class='sp-input' type='text' spellcheck='false'  />",
                    "</div>",
                    "<div class='sp-initial sp-thumb sp-cf'></div>",
                    "<div class='sp-button-container sp-cf'>",
                        "<a class='sp-cancel' href='#'></a>",
                        "<button type='button' class='sp-choose'></button>",
                    "</div>",
                "</div>",
            "</div>"
        ].join("");
    })();

    function paletteTemplate (p, color, className, opts) {
        var html = [];
        for (var i = 0; i < p.length; i++) {
            var current = p[i];
            if(current) {
                var tiny = tinycolor(current);
                var c = tiny.toHsl().l < 0.5 ? "sp-thumb-el sp-thumb-dark" : "sp-thumb-el sp-thumb-light";
                c += (tinycolor.equals(color, current)) ? " sp-thumb-active" : "";
                var formattedString = tiny.toString(opts.preferredFormat || "rgb");
                var swatchStyle = rgbaSupport ? ("background-color:" + tiny.toRgbString()) : "filter:" + tiny.toFilter();
                html.push('<span title="' + formattedString + '" data-color="' + tiny.toRgbString() + '" class="' + c + '"><span class="sp-thumb-inner" style="' + swatchStyle + ';" /></span>');
            } else {
                var cls = 'sp-clear-display';
                html.push($('<div />')
                    .append($('<span data-color="" style="background-color:transparent;" class="' + cls + '"></span>')
                        .attr('title', opts.noColorSelectedText)
                    )
                    .html()
                );
            }
        }
        return "<div class='sp-cf " + className + "'>" + html.join('') + "</div>";
    }

    function hideAll() {
        for (var i = 0; i < spectrums.length; i++) {
            if (spectrums[i]) {
                spectrums[i].hide();
            }
        }
    }

    function instanceOptions(o, callbackContext) {
        var opts = $.extend({}, defaultOpts, o);
        opts.callbacks = {
            'move': bind(opts.move, callbackContext),
            'change': bind(opts.change, callbackContext),
            'show': bind(opts.show, callbackContext),
            'hide': bind(opts.hide, callbackContext),
            'beforeShow': bind(opts.beforeShow, callbackContext)
        };

        return opts;
    }

    function spectrum(element, o) {

        var opts = instanceOptions(o, element),
            flat = opts.flat,
            showSelectionPalette = opts.showSelectionPalette,
            localStorageKey = opts.localStorageKey,
            theme = opts.theme,
            callbacks = opts.callbacks,
            resize = throttle(reflow, 10),
            visible = false,
            dragWidth = 0,
            dragHeight = 0,
            dragHelperHeight = 0,
            slideHeight = 0,
            slideWidth = 0,
            alphaWidth = 0,
            alphaSlideHelperWidth = 0,
            slideHelperHeight = 0,
            currentHue = 0,
            currentSaturation = 0,
            currentValue = 0,
            currentAlpha = 1,
            palette = [],
            paletteArray = [],
            paletteLookup = {},
            selectionPalette = opts.selectionPalette.slice(0),
            maxSelectionSize = opts.maxSelectionSize,
            draggingClass = "sp-dragging",
            shiftMovementDirection = null;

        var doc = element.ownerDocument,
            body = doc.body,
            boundElement = $(element),
            disabled = false,
            container = $(markup, doc).addClass(theme),
            pickerContainer = container.find(".sp-picker-container"),
            dragger = container.find(".sp-color"),
            dragHelper = container.find(".sp-dragger"),
            slider = container.find(".sp-hue"),
            slideHelper = container.find(".sp-slider"),
            alphaSliderInner = container.find(".sp-alpha-inner"),
            alphaSlider = container.find(".sp-alpha"),
            alphaSlideHelper = container.find(".sp-alpha-handle"),
            textInput = container.find(".sp-input"),
            paletteContainer = container.find(".sp-palette"),
            initialColorContainer = container.find(".sp-initial"),
            cancelButton = container.find(".sp-cancel"),
            clearButton = container.find(".sp-clear"),
            chooseButton = container.find(".sp-choose"),
            toggleButton = container.find(".sp-palette-toggle"),
            isInput = boundElement.is("input"),
            isInputTypeColor = isInput && inputTypeColorSupport && boundElement.attr("type") === "color",
            shouldReplace = isInput && !flat,
            replacer = (shouldReplace) ? $(replaceInput).addClass(theme).addClass(opts.className).addClass(opts.replacerClassName) : $([]),
            offsetElement = (shouldReplace) ? replacer : boundElement,
            previewElement = replacer.find(".sp-preview-inner"),
            initialColor = opts.color || (isInput && boundElement.val()),
            colorOnShow = false,
            preferredFormat = opts.preferredFormat,
            currentPreferredFormat = preferredFormat,
            clickoutFiresChange = !opts.showButtons || opts.clickoutFiresChange,
            isEmpty = !initialColor,
            allowEmpty = opts.allowEmpty && !isInputTypeColor;

        function applyOptions() {

            if (opts.showPaletteOnly) {
                opts.showPalette = true;
            }

            toggleButton.text(opts.showPaletteOnly ? opts.togglePaletteMoreText : opts.togglePaletteLessText);

            if (opts.palette) {
                palette = opts.palette.slice(0);
                paletteArray = $.isArray(palette[0]) ? palette : [palette];
                paletteLookup = {};
                for (var i = 0; i < paletteArray.length; i++) {
                    for (var j = 0; j < paletteArray[i].length; j++) {
                        var rgb = tinycolor(paletteArray[i][j]).toRgbString();
                        paletteLookup[rgb] = true;
                    }
                }
            }

            container.toggleClass("sp-flat", flat);
            container.toggleClass("sp-input-disabled", !opts.showInput);
            container.toggleClass("sp-alpha-enabled", opts.showAlpha);
            container.toggleClass("sp-clear-enabled", allowEmpty);
            container.toggleClass("sp-buttons-disabled", !opts.showButtons);
            container.toggleClass("sp-palette-buttons-disabled", !opts.togglePaletteOnly);
            container.toggleClass("sp-palette-disabled", !opts.showPalette);
            container.toggleClass("sp-palette-only", opts.showPaletteOnly);
            container.toggleClass("sp-initial-disabled", !opts.showInitial);
            container.addClass(opts.className).addClass(opts.containerClassName);

            reflow();
        }

        function initialize() {

            if (IE) {
                container.find("*:not(input)").attr("unselectable", "on");
            }

            applyOptions();

            if (shouldReplace) {
                boundElement.after(replacer).hide();
            }

            if (!allowEmpty) {
                clearButton.hide();
            }

            if (flat) {
                boundElement.after(container).hide();
            }
            else {

                var appendTo = opts.appendTo === "parent" ? boundElement.parent() : $(opts.appendTo);
                if (appendTo.length !== 1) {
                    appendTo = $("body");
                }

                appendTo.append(container);
            }

            updateSelectionPaletteFromStorage();

            offsetElement.bind("click.spectrum touchstart.spectrum", function (e) {
                if (!disabled) {
                    toggle();
                }

                e.stopPropagation();

                if (!$(e.target).is("input")) {
                    e.preventDefault();
                }
            });

            if(boundElement.is(":disabled") || (opts.disabled === true)) {
                disable();
            }

            // Prevent clicks from bubbling up to document.  This would cause it to be hidden.
            container.click(stopPropagation);

            // Handle user typed input
            textInput.change(setFromTextInput);
            textInput.bind("paste", function () {
                setTimeout(setFromTextInput, 1);
            });
            textInput.keydown(function (e) { if (e.keyCode == 13) { setFromTextInput(); } });

            cancelButton.text(opts.cancelText);
            cancelButton.bind("click.spectrum", function (e) {
                e.stopPropagation();
                e.preventDefault();
                hide("cancel");
            });

            clearButton.attr("title", opts.clearText);
            clearButton.bind("click.spectrum", function (e) {
                e.stopPropagation();
                e.preventDefault();
                isEmpty = true;
                move();

                if(flat) {
                    //for the flat style, this is a change event
                    updateOriginalInput(true);
                }
            });

            chooseButton.text(opts.chooseText);
            chooseButton.bind("click.spectrum", function (e) {
                e.stopPropagation();
                e.preventDefault();

                if (isValid()) {
                    updateOriginalInput(true);
                    hide();
                }
            });

            toggleButton.text(opts.showPaletteOnly ? opts.togglePaletteMoreText : opts.togglePaletteLessText);
            toggleButton.bind("click.spectrum", function (e) {
                e.stopPropagation();
                e.preventDefault();

                opts.showPaletteOnly = !opts.showPaletteOnly;

                // To make sure the Picker area is drawn on the right, next to the
                // Palette area (and not below the palette), first move the Palette
                // to the left to make space for the picker, plus 5px extra.
                // The 'applyOptions' function puts the whole container back into place
                // and takes care of the button-text and the sp-palette-only CSS class.
                if (!opts.showPaletteOnly && !flat) {
                    container.css('left', '-=' + (pickerContainer.outerWidth(true) + 5));
                }
                applyOptions();
            });

            draggable(alphaSlider, function (dragX, dragY, e) {
                currentAlpha = (dragX / alphaWidth);
                isEmpty = false;
                if (e.shiftKey) {
                    currentAlpha = Math.round(currentAlpha * 10) / 10;
                }

                move();
            }, dragStart, dragStop);

            draggable(slider, function (dragX, dragY) {
                currentHue = parseFloat(dragY / slideHeight);
                isEmpty = false;
                if (!opts.showAlpha) {
                    currentAlpha = 1;
                }
                move();
            }, dragStart, dragStop);

            draggable(dragger, function (dragX, dragY, e) {

                // shift+drag should snap the movement to either the x or y axis.
                if (!e.shiftKey) {
                    shiftMovementDirection = null;
                }
                else if (!shiftMovementDirection) {
                    var oldDragX = currentSaturation * dragWidth;
                    var oldDragY = dragHeight - (currentValue * dragHeight);
                    var furtherFromX = Math.abs(dragX - oldDragX) > Math.abs(dragY - oldDragY);

                    shiftMovementDirection = furtherFromX ? "x" : "y";
                }

                var setSaturation = !shiftMovementDirection || shiftMovementDirection === "x";
                var setValue = !shiftMovementDirection || shiftMovementDirection === "y";

                if (setSaturation) {
                    currentSaturation = parseFloat(dragX / dragWidth);
                }
                if (setValue) {
                    currentValue = parseFloat((dragHeight - dragY) / dragHeight);
                }

                isEmpty = false;
                if (!opts.showAlpha) {
                    currentAlpha = 1;
                }

                move();

            }, dragStart, dragStop);

            if (!!initialColor) {
                set(initialColor);

                // In case color was black - update the preview UI and set the format
                // since the set function will not run (default color is black).
                updateUI();
                currentPreferredFormat = preferredFormat || tinycolor(initialColor).format;

                addColorToSelectionPalette(initialColor);
            }
            else {
                updateUI();
            }

            if (flat) {
                show();
            }

            function paletteElementClick(e) {
                if (e.data && e.data.ignore) {
                    set($(e.target).closest(".sp-thumb-el").data("color"));
                    move();
                }
                else {
                    set($(e.target).closest(".sp-thumb-el").data("color"));
                    move();
                    updateOriginalInput(true);
                    if (opts.hideAfterPaletteSelect) {
                      hide();
                    }
                }

                return false;
            }

            var paletteEvent = IE ? "mousedown.spectrum" : "click.spectrum touchstart.spectrum";
            paletteContainer.delegate(".sp-thumb-el", paletteEvent, paletteElementClick);
            initialColorContainer.delegate(".sp-thumb-el:nth-child(1)", paletteEvent, { ignore: true }, paletteElementClick);
        }

        function updateSelectionPaletteFromStorage() {

            if (localStorageKey && window.localStorage) {

                // Migrate old palettes over to new format.  May want to remove this eventually.
                try {
                    var oldPalette = window.localStorage[localStorageKey].split(",#");
                    if (oldPalette.length > 1) {
                        delete window.localStorage[localStorageKey];
                        $.each(oldPalette, function(i, c) {
                             addColorToSelectionPalette(c);
                        });
                    }
                }
                catch(e) { }

                try {
                    selectionPalette = window.localStorage[localStorageKey].split(";");
                }
                catch (e) { }
            }
        }

        function addColorToSelectionPalette(color) {
            if (showSelectionPalette) {
                var rgb = tinycolor(color).toRgbString();
                if (!paletteLookup[rgb] && $.inArray(rgb, selectionPalette) === -1) {
                    selectionPalette.push(rgb);
                    while(selectionPalette.length > maxSelectionSize) {
                        selectionPalette.shift();
                    }
                }

                if (localStorageKey && window.localStorage) {
                    try {
                        window.localStorage[localStorageKey] = selectionPalette.join(";");
                    }
                    catch(e) { }
                }
            }
        }

        function getUniqueSelectionPalette() {
            var unique = [];
            if (opts.showPalette) {
                for (var i = 0; i < selectionPalette.length; i++) {
                    var rgb = tinycolor(selectionPalette[i]).toRgbString();

                    if (!paletteLookup[rgb]) {
                        unique.push(selectionPalette[i]);
                    }
                }
            }

            return unique.reverse().slice(0, opts.maxSelectionSize);
        }

        function drawPalette() {

            var currentColor = get();

            var html = $.map(paletteArray, function (palette, i) {
                return paletteTemplate(palette, currentColor, "sp-palette-row sp-palette-row-" + i, opts);
            });

            updateSelectionPaletteFromStorage();

            if (selectionPalette) {
                html.push(paletteTemplate(getUniqueSelectionPalette(), currentColor, "sp-palette-row sp-palette-row-selection", opts));
            }

            paletteContainer.html(html.join(""));
        }

        function drawInitial() {
            if (opts.showInitial) {
                var initial = colorOnShow;
                var current = get();
                initialColorContainer.html(paletteTemplate([initial, current], current, "sp-palette-row-initial", opts));
            }
        }

        function dragStart() {
            if (dragHeight <= 0 || dragWidth <= 0 || slideHeight <= 0) {
                reflow();
            }
            container.addClass(draggingClass);
            shiftMovementDirection = null;
            boundElement.trigger('dragstart.spectrum', [ get() ]);
        }

        function dragStop() {
            container.removeClass(draggingClass);
            boundElement.trigger('dragstop.spectrum', [ get() ]);
        }

        function setFromTextInput() {

            var value = textInput.val();

            if ((value === null || value === "") && allowEmpty) {
                set(null);
                updateOriginalInput(true);
            }
            else {
                var tiny = tinycolor(value);
                if (tiny.isValid()) {
                    set(tiny);
                    updateOriginalInput(true);
                }
                else {
                    textInput.addClass("sp-validation-error");
                }
            }
        }

        function toggle() {
            if (visible) {
                hide();
            }
            else {
                show();
            }
        }

        function show() {
            var event = $.Event('beforeShow.spectrum');

            if (visible) {
                reflow();
                return;
            }

            boundElement.trigger(event, [ get() ]);

            if (callbacks.beforeShow(get()) === false || event.isDefaultPrevented()) {
                return;
            }

            hideAll();
            visible = true;

            $(doc).bind("click.spectrum", hide);
            $(window).bind("resize.spectrum", resize);
            replacer.addClass("sp-active");
            container.removeClass("sp-hidden");

            reflow();
            updateUI();

            colorOnShow = get();

            drawInitial();
            callbacks.show(colorOnShow);
            boundElement.trigger('show.spectrum', [ colorOnShow ]);
        }

        function hide(e) {

            // Return on right click
            if (e && e.type == "click" && e.button == 2) { return; }

            // Return if hiding is unnecessary
            if (!visible || flat) { return; }
            visible = false;

            $(doc).unbind("click.spectrum", hide);
            $(window).unbind("resize.spectrum", resize);

            replacer.removeClass("sp-active");
            container.addClass("sp-hidden");

            var colorHasChanged = !tinycolor.equals(get(), colorOnShow);

            if (colorHasChanged) {
                if (clickoutFiresChange && e !== "cancel") {
                    updateOriginalInput(true);
                }
                else {
                    revert();
                }
            }

            callbacks.hide(get());
            boundElement.trigger('hide.spectrum', [ get() ]);
        }

        function revert() {
            set(colorOnShow, true);
        }

        function set(color, ignoreFormatChange) {
            if (tinycolor.equals(color, get())) {
                // Update UI just in case a validation error needs
                // to be cleared.
                updateUI();
                return;
            }

            var newColor, newHsv;
            if (!color && allowEmpty) {
                isEmpty = true;
            } else {
                isEmpty = false;
                newColor = tinycolor(color);
                newHsv = newColor.toHsv();

                currentHue = (newHsv.h % 360) / 360;
                currentSaturation = newHsv.s;
                currentValue = newHsv.v;
                currentAlpha = newHsv.a;
            }
            updateUI();

            if (newColor && newColor.isValid() && !ignoreFormatChange) {
                currentPreferredFormat = preferredFormat || newColor.getFormat();
            }
        }

        function get(opts) {
            opts = opts || { };

            if (allowEmpty && isEmpty) {
                return null;
            }

            return tinycolor.fromRatio({
                h: currentHue,
                s: currentSaturation,
                v: currentValue,
                a: Math.round(currentAlpha * 100) / 100
            }, { format: opts.format || currentPreferredFormat });
        }

        function isValid() {
            return !textInput.hasClass("sp-validation-error");
        }

        function move() {
            updateUI();

            callbacks.move(get());
            boundElement.trigger('move.spectrum', [ get() ]);
        }

        function updateUI() {

            textInput.removeClass("sp-validation-error");

            updateHelperLocations();

            // Update dragger background color (gradients take care of saturation and value).
            var flatColor = tinycolor.fromRatio({ h: currentHue, s: 1, v: 1 });
            dragger.css("background-color", flatColor.toHexString());

            // Get a format that alpha will be included in (hex and names ignore alpha)
            var format = currentPreferredFormat;
            if (currentAlpha < 1 && !(currentAlpha === 0 && format === "name")) {
                if (format === "hex" || format === "hex3" || format === "hex6" || format === "name") {
                    format = "rgb";
                }
            }

            var realColor = get({ format: format }),
                displayColor = '';

             //reset background info for preview element
            previewElement.removeClass("sp-clear-display");
            previewElement.css('background-color', 'transparent');

            if (!realColor && allowEmpty) {
                // Update the replaced elements background with icon indicating no color selection
                previewElement.addClass("sp-clear-display");
            }
            else {
                var realHex = realColor.toHexString(),
                    realRgb = realColor.toRgbString();

                // Update the replaced elements background color (with actual selected color)
                if (rgbaSupport || realColor.alpha === 1) {
                    previewElement.css("background-color", realRgb);
                }
                else {
                    previewElement.css("background-color", "transparent");
                    previewElement.css("filter", realColor.toFilter());
                }

                if (opts.showAlpha) {
                    var rgb = realColor.toRgb();
                    rgb.a = 0;
                    var realAlpha = tinycolor(rgb).toRgbString();
                    var gradient = "linear-gradient(left, " + realAlpha + ", " + realHex + ")";

                    if (IE) {
                        alphaSliderInner.css("filter", tinycolor(realAlpha).toFilter({ gradientType: 1 }, realHex));
                    }
                    else {
                        alphaSliderInner.css("background", "-webkit-" + gradient);
                        alphaSliderInner.css("background", "-moz-" + gradient);
                        alphaSliderInner.css("background", "-ms-" + gradient);
                        // Use current syntax gradient on unprefixed property.
                        alphaSliderInner.css("background",
                            "linear-gradient(to right, " + realAlpha + ", " + realHex + ")");
                    }
                }

                displayColor = realColor.toString(format);
            }

            // Update the text entry input as it changes happen
            if (opts.showInput) {
                textInput.val(displayColor);
            }

            if (opts.showPalette) {
                drawPalette();
            }

            drawInitial();
        }

        function updateHelperLocations() {
            var s = currentSaturation;
            var v = currentValue;

            if(allowEmpty && isEmpty) {
                //if selected color is empty, hide the helpers
                alphaSlideHelper.hide();
                slideHelper.hide();
                dragHelper.hide();
            }
            else {
                //make sure helpers are visible
                alphaSlideHelper.show();
                slideHelper.show();
                dragHelper.show();

                // Where to show the little circle in that displays your current selected color
                var dragX = s * dragWidth;
                var dragY = dragHeight - (v * dragHeight);
                dragX = Math.max(
                    -dragHelperHeight,
                    Math.min(dragWidth - dragHelperHeight, dragX - dragHelperHeight)
                );
                dragY = Math.max(
                    -dragHelperHeight,
                    Math.min(dragHeight - dragHelperHeight, dragY - dragHelperHeight)
                );
                dragHelper.css({
                    "top": dragY + "px",
                    "left": dragX + "px"
                });

                var alphaX = currentAlpha * alphaWidth;
                alphaSlideHelper.css({
                    "left": (alphaX - (alphaSlideHelperWidth / 2)) + "px"
                });

                // Where to show the bar that displays your current selected hue
                var slideY = (currentHue) * slideHeight;
                slideHelper.css({
                    "top": (slideY - slideHelperHeight) + "px"
                });
            }
        }

        function updateOriginalInput(fireCallback) {
            var color = get(),
                displayColor = '',
                hasChanged = !tinycolor.equals(color, colorOnShow);

            if (color) {
                displayColor = color.toString(currentPreferredFormat);
                // Update the selection palette with the current color
                addColorToSelectionPalette(color);
            }

            if (isInput) {
                boundElement.val(displayColor);
            }

            colorOnShow = color;

            if (fireCallback && hasChanged) {
                callbacks.change(color);
                boundElement.trigger('change', [ color ]);
            }
        }

        function reflow() {
            dragWidth = dragger.width();
            dragHeight = dragger.height();
            dragHelperHeight = dragHelper.height();
            slideWidth = slider.width();
            slideHeight = slider.height();
            slideHelperHeight = slideHelper.height();
            alphaWidth = alphaSlider.width();
            alphaSlideHelperWidth = alphaSlideHelper.width();

            if (!flat) {
                container.css("position", "absolute");
                container.offset(getOffset(container, offsetElement));
            }

            updateHelperLocations();

            if (opts.showPalette) {
                drawPalette();
            }

            boundElement.trigger('reflow.spectrum');
        }

        function destroy() {
            boundElement.show();
            offsetElement.unbind("click.spectrum touchstart.spectrum");
            container.remove();
            replacer.remove();
            spectrums[spect.id] = null;
        }

        function option(optionName, optionValue) {
            if (optionName === undefined) {
                return $.extend({}, opts);
            }
            if (optionValue === undefined) {
                return opts[optionName];
            }

            opts[optionName] = optionValue;
            applyOptions();
        }

        function enable() {
            disabled = false;
            boundElement.attr("disabled", false);
            offsetElement.removeClass("sp-disabled");
        }

        function disable() {
            hide();
            disabled = true;
            boundElement.attr("disabled", true);
            offsetElement.addClass("sp-disabled");
        }

        initialize();

        var spect = {
            show: show,
            hide: hide,
            toggle: toggle,
            reflow: reflow,
            option: option,
            enable: enable,
            disable: disable,
            set: function (c) {
                set(c);
                updateOriginalInput();
            },
            get: get,
            destroy: destroy,
            container: container
        };

        spect.id = spectrums.push(spect) - 1;

        return spect;
    }

    /**
    * checkOffset - get the offset below/above and left/right element depending on screen position
    * Thanks https://github.com/jquery/jquery-ui/blob/master/ui/jquery.ui.datepicker.js
    */
    function getOffset(picker, input) {
        var extraY = 0;
        var dpWidth = picker.outerWidth();
        var dpHeight = picker.outerHeight();
        var inputHeight = input.outerHeight();
        var doc = picker[0].ownerDocument;
        var docElem = doc.documentElement;
        var viewWidth = docElem.clientWidth + $(doc).scrollLeft();
        var viewHeight = docElem.clientHeight + $(doc).scrollTop();
        var offset = input.offset();
        offset.top += inputHeight;

        offset.left -=
            Math.min(offset.left, (offset.left + dpWidth > viewWidth && viewWidth > dpWidth) ?
            Math.abs(offset.left + dpWidth - viewWidth) : 0);

        offset.top -=
            Math.min(offset.top, ((offset.top + dpHeight > viewHeight && viewHeight > dpHeight) ?
            Math.abs(dpHeight + inputHeight - extraY) : extraY));

        return offset;
    }

    /**
    * noop - do nothing
    */
    function noop() {

    }

    /**
    * stopPropagation - makes the code only doing this a little easier to read in line
    */
    function stopPropagation(e) {
        e.stopPropagation();
    }

    /**
    * Create a function bound to a given object
    * Thanks to underscore.js
    */
    function bind(func, obj) {
        var slice = Array.prototype.slice;
        var args = slice.call(arguments, 2);
        return function () {
            return func.apply(obj, args.concat(slice.call(arguments)));
        };
    }

    /**
    * Lightweight drag helper.  Handles containment within the element, so that
    * when dragging, the x is within [0,element.width] and y is within [0,element.height]
    */
    function draggable(element, onmove, onstart, onstop) {
        onmove = onmove || function () { };
        onstart = onstart || function () { };
        onstop = onstop || function () { };
        var doc = document;
        var dragging = false;
        var offset = {};
        var maxHeight = 0;
        var maxWidth = 0;
        var hasTouch = ('ontouchstart' in window);

        var duringDragEvents = {};
        duringDragEvents["selectstart"] = prevent;
        duringDragEvents["dragstart"] = prevent;
        duringDragEvents["touchmove mousemove"] = move;
        duringDragEvents["touchend mouseup"] = stop;

        function prevent(e) {
            if (e.stopPropagation) {
                e.stopPropagation();
            }
            if (e.preventDefault) {
                e.preventDefault();
            }
            e.returnValue = false;
        }

        function move(e) {
            if (dragging) {
                // Mouseup happened outside of window
                if (IE && doc.documentMode < 9 && !e.button) {
                    return stop();
                }

                var touches = e.originalEvent.touches;
                var pageX = touches ? touches[0].pageX : e.pageX;
                var pageY = touches ? touches[0].pageY : e.pageY;

                var dragX = Math.max(0, Math.min(pageX - offset.left, maxWidth));
                var dragY = Math.max(0, Math.min(pageY - offset.top, maxHeight));

                if (hasTouch) {
                    // Stop scrolling in iOS
                    prevent(e);
                }

                onmove.apply(element, [dragX, dragY, e]);
            }
        }

        function start(e) {
            var rightclick = (e.which) ? (e.which == 3) : (e.button == 2);

            if (!rightclick && !dragging) {
                if (onstart.apply(element, arguments) !== false) {
                    dragging = true;
                    maxHeight = $(element).height();
                    maxWidth = $(element).width();
                    offset = $(element).offset();

                    $(doc).bind(duringDragEvents);
                    $(doc.body).addClass("sp-dragging");

                    if (!hasTouch) {
                        move(e);
                    }

                    prevent(e);
                }
            }
        }

        function stop() {
            if (dragging) {
                $(doc).unbind(duringDragEvents);
                $(doc.body).removeClass("sp-dragging");
                onstop.apply(element, arguments);
            }
            dragging = false;
        }

        $(element).bind("touchstart mousedown", start);
    }

    function throttle(func, wait, debounce) {
        var timeout;
        return function () {
            var context = this, args = arguments;
            var throttler = function () {
                timeout = null;
                func.apply(context, args);
            };
            if (debounce) clearTimeout(timeout);
            if (debounce || !timeout) timeout = setTimeout(throttler, wait);
        };
    }

    /**
    * Define a jQuery plugin
    */
    var dataID = "spectrum.id";
    $.fn.spectrum = function (opts, extra) {

        if (typeof opts == "string") {

            var returnValue = this;
            var args = Array.prototype.slice.call( arguments, 1 );

            this.each(function () {
                var spect = spectrums[$(this).data(dataID)];
                if (spect) {
                    var method = spect[opts];
                    if (!method) {
                        throw new Error( "Spectrum: no such method: '" + opts + "'" );
                    }

                    if (opts == "get") {
                        returnValue = spect.get();
                    }
                    else if (opts == "container") {
                        returnValue = spect.container;
                    }
                    else if (opts == "option") {
                        returnValue = spect.option.apply(spect, args);
                    }
                    else if (opts == "destroy") {
                        spect.destroy();
                        $(this).removeData(dataID);
                    }
                    else {
                        method.apply(spect, args);
                    }
                }
            });

            return returnValue;
        }

        // Initializing a new instance of spectrum
        return this.spectrum("destroy").each(function () {
            var options = $.extend({}, opts, $(this).data());
            var spect = spectrum(this, options);
            $(this).data(dataID, spect.id);
        });
    };

    $.fn.spectrum.load = true;
    $.fn.spectrum.loadOpts = {};
    $.fn.spectrum.draggable = draggable;
    $.fn.spectrum.defaults = defaultOpts;

    $.spectrum = { };
    $.spectrum.localization = { };
    $.spectrum.palettes = { };

    $.fn.spectrum.processNativeColorInputs = function () {
        if (!inputTypeColorSupport) {
            $("input[type=color]").spectrum({
                preferredFormat: "hex6"
            });
        }
    };

    // TinyColor v1.0.0
    // https://github.com/bgrins/TinyColor
    // Brian Grinstead, MIT License

    (function() {

    var trimLeft = /^[\s,#]+/,
        trimRight = /\s+$/,
        tinyCounter = 0,
        math = Math,
        mathRound = math.round,
        mathMin = math.min,
        mathMax = math.max,
        mathRandom = math.random;

    var tinycolor = function tinycolor (color, opts) {

        color = (color) ? color : '';
        opts = opts || { };

        // If input is already a tinycolor, return itself
        if (color instanceof tinycolor) {
           return color;
        }
        // If we are called as a function, call using new instead
        if (!(this instanceof tinycolor)) {
            return new tinycolor(color, opts);
        }

        var rgb = inputToRGB(color);
        this._r = rgb.r,
        this._g = rgb.g,
        this._b = rgb.b,
        this._a = rgb.a,
        this._roundA = mathRound(100*this._a) / 100,
        this._format = opts.format || rgb.format;
        this._gradientType = opts.gradientType;

        // Don't let the range of [0,255] come back in [0,1].
        // Potentially lose a little bit of precision here, but will fix issues where
        // .5 gets interpreted as half of the total, instead of half of 1
        // If it was supposed to be 128, this was already taken care of by `inputToRgb`
        if (this._r < 1) { this._r = mathRound(this._r); }
        if (this._g < 1) { this._g = mathRound(this._g); }
        if (this._b < 1) { this._b = mathRound(this._b); }

        this._ok = rgb.ok;
        this._tc_id = tinyCounter++;
    };

    tinycolor.prototype = {
        isDark: function() {
            return this.getBrightness() < 128;
        },
        isLight: function() {
            return !this.isDark();
        },
        isValid: function() {
            return this._ok;
        },
        getFormat: function() {
            return this._format;
        },
        getAlpha: function() {
            return this._a;
        },
        getBrightness: function() {
            var rgb = this.toRgb();
            return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
        },
        setAlpha: function(value) {
            this._a = boundAlpha(value);
            this._roundA = mathRound(100*this._a) / 100;
            return this;
        },
        toHsv: function() {
            var hsv = rgbToHsv(this._r, this._g, this._b);
            return { h: hsv.h * 360, s: hsv.s, v: hsv.v, a: this._a };
        },
        toHsvString: function() {
            var hsv = rgbToHsv(this._r, this._g, this._b);
            var h = mathRound(hsv.h * 360), s = mathRound(hsv.s * 100), v = mathRound(hsv.v * 100);
            return (this._a == 1) ?
              "hsv("  + h + ", " + s + "%, " + v + "%)" :
              "hsva(" + h + ", " + s + "%, " + v + "%, "+ this._roundA + ")";
        },
        toHsl: function() {
            var hsl = rgbToHsl(this._r, this._g, this._b);
            return { h: hsl.h * 360, s: hsl.s, l: hsl.l, a: this._a };
        },
        toHslString: function() {
            var hsl = rgbToHsl(this._r, this._g, this._b);
            var h = mathRound(hsl.h * 360), s = mathRound(hsl.s * 100), l = mathRound(hsl.l * 100);
            return (this._a == 1) ?
              "hsl("  + h + ", " + s + "%, " + l + "%)" :
              "hsla(" + h + ", " + s + "%, " + l + "%, "+ this._roundA + ")";
        },
        toHex: function(allow3Char) {
            return rgbToHex(this._r, this._g, this._b, allow3Char);
        },
        toHexString: function(allow3Char) {
            return '#' + this.toHex(allow3Char);
        },
        toHex8: function() {
            return rgbaToHex(this._r, this._g, this._b, this._a);
        },
        toHex8String: function() {
            return '#' + this.toHex8();
        },
        toRgb: function() {
            return { r: mathRound(this._r), g: mathRound(this._g), b: mathRound(this._b), a: this._a };
        },
        toRgbString: function() {
            return (this._a == 1) ?
              "rgb("  + mathRound(this._r) + ", " + mathRound(this._g) + ", " + mathRound(this._b) + ")" :
              "rgba(" + mathRound(this._r) + ", " + mathRound(this._g) + ", " + mathRound(this._b) + ", " + this._roundA + ")";
        },
        toPercentageRgb: function() {
            return { r: mathRound(bound01(this._r, 255) * 100) + "%", g: mathRound(bound01(this._g, 255) * 100) + "%", b: mathRound(bound01(this._b, 255) * 100) + "%", a: this._a };
        },
        toPercentageRgbString: function() {
            return (this._a == 1) ?
              "rgb("  + mathRound(bound01(this._r, 255) * 100) + "%, " + mathRound(bound01(this._g, 255) * 100) + "%, " + mathRound(bound01(this._b, 255) * 100) + "%)" :
              "rgba(" + mathRound(bound01(this._r, 255) * 100) + "%, " + mathRound(bound01(this._g, 255) * 100) + "%, " + mathRound(bound01(this._b, 255) * 100) + "%, " + this._roundA + ")";
        },
        toName: function() {
            if (this._a === 0) {
                return "transparent";
            }

            if (this._a < 1) {
                return false;
            }

            return hexNames[rgbToHex(this._r, this._g, this._b, true)] || false;
        },
        toFilter: function(secondColor) {
            var hex8String = '#' + rgbaToHex(this._r, this._g, this._b, this._a);
            var secondHex8String = hex8String;
            var gradientType = this._gradientType ? "GradientType = 1, " : "";

            if (secondColor) {
                var s = tinycolor(secondColor);
                secondHex8String = s.toHex8String();
            }

            return "progid:DXImageTransform.Microsoft.gradient("+gradientType+"startColorstr="+hex8String+",endColorstr="+secondHex8String+")";
        },
        toString: function(format) {
            var formatSet = !!format;
            format = format || this._format;

            var formattedString = false;
            var hasAlpha = this._a < 1 && this._a >= 0;
            var needsAlphaFormat = !formatSet && hasAlpha && (format === "hex" || format === "hex6" || format === "hex3" || format === "name");

            if (needsAlphaFormat) {
                // Special case for "transparent", all other non-alpha formats
                // will return rgba when there is transparency.
                if (format === "name" && this._a === 0) {
                    return this.toName();
                }
                return this.toRgbString();
            }
            if (format === "rgb") {
                formattedString = this.toRgbString();
            }
            if (format === "prgb") {
                formattedString = this.toPercentageRgbString();
            }
            if (format === "hex" || format === "hex6") {
                formattedString = this.toHexString();
            }
            if (format === "hex3") {
                formattedString = this.toHexString(true);
            }
            if (format === "hex8") {
                formattedString = this.toHex8String();
            }
            if (format === "name") {
                formattedString = this.toName();
            }
            if (format === "hsl") {
                formattedString = this.toHslString();
            }
            if (format === "hsv") {
                formattedString = this.toHsvString();
            }

            return formattedString || this.toHexString();
        },

        _applyModification: function(fn, args) {
            var color = fn.apply(null, [this].concat([].slice.call(args)));
            this._r = color._r;
            this._g = color._g;
            this._b = color._b;
            this.setAlpha(color._a);
            return this;
        },
        lighten: function() {
            return this._applyModification(lighten, arguments);
        },
        brighten: function() {
            return this._applyModification(brighten, arguments);
        },
        darken: function() {
            return this._applyModification(darken, arguments);
        },
        desaturate: function() {
            return this._applyModification(desaturate, arguments);
        },
        saturate: function() {
            return this._applyModification(saturate, arguments);
        },
        greyscale: function() {
            return this._applyModification(greyscale, arguments);
        },
        spin: function() {
            return this._applyModification(spin, arguments);
        },

        _applyCombination: function(fn, args) {
            return fn.apply(null, [this].concat([].slice.call(args)));
        },
        analogous: function() {
            return this._applyCombination(analogous, arguments);
        },
        complement: function() {
            return this._applyCombination(complement, arguments);
        },
        monochromatic: function() {
            return this._applyCombination(monochromatic, arguments);
        },
        splitcomplement: function() {
            return this._applyCombination(splitcomplement, arguments);
        },
        triad: function() {
            return this._applyCombination(triad, arguments);
        },
        tetrad: function() {
            return this._applyCombination(tetrad, arguments);
        }
    };

    // If input is an object, force 1 into "1.0" to handle ratios properly
    // String input requires "1.0" as input, so 1 will be treated as 1
    tinycolor.fromRatio = function(color, opts) {
        if (typeof color == "object") {
            var newColor = {};
            for (var i in color) {
                if (color.hasOwnProperty(i)) {
                    if (i === "a") {
                        newColor[i] = color[i];
                    }
                    else {
                        newColor[i] = convertToPercentage(color[i]);
                    }
                }
            }
            color = newColor;
        }

        return tinycolor(color, opts);
    };

    // Given a string or object, convert that input to RGB
    // Possible string inputs:
    //
    //     "red"
    //     "#f00" or "f00"
    //     "#ff0000" or "ff0000"
    //     "#ff000000" or "ff000000"
    //     "rgb 255 0 0" or "rgb (255, 0, 0)"
    //     "rgb 1.0 0 0" or "rgb (1, 0, 0)"
    //     "rgba (255, 0, 0, 1)" or "rgba 255, 0, 0, 1"
    //     "rgba (1.0, 0, 0, 1)" or "rgba 1.0, 0, 0, 1"
    //     "hsl(0, 100%, 50%)" or "hsl 0 100% 50%"
    //     "hsla(0, 100%, 50%, 1)" or "hsla 0 100% 50%, 1"
    //     "hsv(0, 100%, 100%)" or "hsv 0 100% 100%"
    //
    function inputToRGB(color) {

        var rgb = { r: 0, g: 0, b: 0 };
        var a = 1;
        var ok = false;
        var format = false;

        if (typeof color == "string") {
            color = stringInputToObject(color);
        }

        if (typeof color == "object") {
            if (color.hasOwnProperty("r") && color.hasOwnProperty("g") && color.hasOwnProperty("b")) {
                rgb = rgbToRgb(color.r, color.g, color.b);
                ok = true;
                format = String(color.r).substr(-1) === "%" ? "prgb" : "rgb";
            }
            else if (color.hasOwnProperty("h") && color.hasOwnProperty("s") && color.hasOwnProperty("v")) {
                color.s = convertToPercentage(color.s);
                color.v = convertToPercentage(color.v);
                rgb = hsvToRgb(color.h, color.s, color.v);
                ok = true;
                format = "hsv";
            }
            else if (color.hasOwnProperty("h") && color.hasOwnProperty("s") && color.hasOwnProperty("l")) {
                color.s = convertToPercentage(color.s);
                color.l = convertToPercentage(color.l);
                rgb = hslToRgb(color.h, color.s, color.l);
                ok = true;
                format = "hsl";
            }

            if (color.hasOwnProperty("a")) {
                a = color.a;
            }
        }

        a = boundAlpha(a);

        return {
            ok: ok,
            format: color.format || format,
            r: mathMin(255, mathMax(rgb.r, 0)),
            g: mathMin(255, mathMax(rgb.g, 0)),
            b: mathMin(255, mathMax(rgb.b, 0)),
            a: a
        };
    }


    // Conversion Functions
    // --------------------

    // `rgbToHsl`, `rgbToHsv`, `hslToRgb`, `hsvToRgb` modified from:
    // <http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript>

    // `rgbToRgb`
    // Handle bounds / percentage checking to conform to CSS color spec
    // <http://www.w3.org/TR/css3-color/>
    // *Assumes:* r, g, b in [0, 255] or [0, 1]
    // *Returns:* { r, g, b } in [0, 255]
    function rgbToRgb(r, g, b){
        return {
            r: bound01(r, 255) * 255,
            g: bound01(g, 255) * 255,
            b: bound01(b, 255) * 255
        };
    }

    // `rgbToHsl`
    // Converts an RGB color value to HSL.
    // *Assumes:* r, g, and b are contained in [0, 255] or [0, 1]
    // *Returns:* { h, s, l } in [0,1]
    function rgbToHsl(r, g, b) {

        r = bound01(r, 255);
        g = bound01(g, 255);
        b = bound01(b, 255);

        var max = mathMax(r, g, b), min = mathMin(r, g, b);
        var h, s, l = (max + min) / 2;

        if(max == min) {
            h = s = 0; // achromatic
        }
        else {
            var d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch(max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }

            h /= 6;
        }

        return { h: h, s: s, l: l };
    }

    // `hslToRgb`
    // Converts an HSL color value to RGB.
    // *Assumes:* h is contained in [0, 1] or [0, 360] and s and l are contained [0, 1] or [0, 100]
    // *Returns:* { r, g, b } in the set [0, 255]
    function hslToRgb(h, s, l) {
        var r, g, b;

        h = bound01(h, 360);
        s = bound01(s, 100);
        l = bound01(l, 100);

        function hue2rgb(p, q, t) {
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        if(s === 0) {
            r = g = b = l; // achromatic
        }
        else {
            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return { r: r * 255, g: g * 255, b: b * 255 };
    }

    // `rgbToHsv`
    // Converts an RGB color value to HSV
    // *Assumes:* r, g, and b are contained in the set [0, 255] or [0, 1]
    // *Returns:* { h, s, v } in [0,1]
    function rgbToHsv(r, g, b) {

        r = bound01(r, 255);
        g = bound01(g, 255);
        b = bound01(b, 255);

        var max = mathMax(r, g, b), min = mathMin(r, g, b);
        var h, s, v = max;

        var d = max - min;
        s = max === 0 ? 0 : d / max;

        if(max == min) {
            h = 0; // achromatic
        }
        else {
            switch(max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return { h: h, s: s, v: v };
    }

    // `hsvToRgb`
    // Converts an HSV color value to RGB.
    // *Assumes:* h is contained in [0, 1] or [0, 360] and s and v are contained in [0, 1] or [0, 100]
    // *Returns:* { r, g, b } in the set [0, 255]
     function hsvToRgb(h, s, v) {

        h = bound01(h, 360) * 6;
        s = bound01(s, 100);
        v = bound01(v, 100);

        var i = math.floor(h),
            f = h - i,
            p = v * (1 - s),
            q = v * (1 - f * s),
            t = v * (1 - (1 - f) * s),
            mod = i % 6,
            r = [v, q, p, p, t, v][mod],
            g = [t, v, v, q, p, p][mod],
            b = [p, p, t, v, v, q][mod];

        return { r: r * 255, g: g * 255, b: b * 255 };
    }

    // `rgbToHex`
    // Converts an RGB color to hex
    // Assumes r, g, and b are contained in the set [0, 255]
    // Returns a 3 or 6 character hex
    function rgbToHex(r, g, b, allow3Char) {

        var hex = [
            pad2(mathRound(r).toString(16)),
            pad2(mathRound(g).toString(16)),
            pad2(mathRound(b).toString(16))
        ];

        // Return a 3 character hex if possible
        if (allow3Char && hex[0].charAt(0) == hex[0].charAt(1) && hex[1].charAt(0) == hex[1].charAt(1) && hex[2].charAt(0) == hex[2].charAt(1)) {
            return hex[0].charAt(0) + hex[1].charAt(0) + hex[2].charAt(0);
        }

        return hex.join("");
    }
        // `rgbaToHex`
        // Converts an RGBA color plus alpha transparency to hex
        // Assumes r, g, b and a are contained in the set [0, 255]
        // Returns an 8 character hex
        function rgbaToHex(r, g, b, a) {

            var hex = [
                pad2(convertDecimalToHex(a)),
                pad2(mathRound(r).toString(16)),
                pad2(mathRound(g).toString(16)),
                pad2(mathRound(b).toString(16))
            ];

            return hex.join("");
        }

    // `equals`
    // Can be called with any tinycolor input
    tinycolor.equals = function (color1, color2) {
        if (!color1 || !color2) { return false; }
        return tinycolor(color1).toRgbString() == tinycolor(color2).toRgbString();
    };
    tinycolor.random = function() {
        return tinycolor.fromRatio({
            r: mathRandom(),
            g: mathRandom(),
            b: mathRandom()
        });
    };


    // Modification Functions
    // ----------------------
    // Thanks to less.js for some of the basics here
    // <https://github.com/cloudhead/less.js/blob/master/lib/less/functions.js>

    function desaturate(color, amount) {
        amount = (amount === 0) ? 0 : (amount || 10);
        var hsl = tinycolor(color).toHsl();
        hsl.s -= amount / 100;
        hsl.s = clamp01(hsl.s);
        return tinycolor(hsl);
    }

    function saturate(color, amount) {
        amount = (amount === 0) ? 0 : (amount || 10);
        var hsl = tinycolor(color).toHsl();
        hsl.s += amount / 100;
        hsl.s = clamp01(hsl.s);
        return tinycolor(hsl);
    }

    function greyscale(color) {
        return tinycolor(color).desaturate(100);
    }

    function lighten (color, amount) {
        amount = (amount === 0) ? 0 : (amount || 10);
        var hsl = tinycolor(color).toHsl();
        hsl.l += amount / 100;
        hsl.l = clamp01(hsl.l);
        return tinycolor(hsl);
    }

    function brighten(color, amount) {
        amount = (amount === 0) ? 0 : (amount || 10);
        var rgb = tinycolor(color).toRgb();
        rgb.r = mathMax(0, mathMin(255, rgb.r - mathRound(255 * - (amount / 100))));
        rgb.g = mathMax(0, mathMin(255, rgb.g - mathRound(255 * - (amount / 100))));
        rgb.b = mathMax(0, mathMin(255, rgb.b - mathRound(255 * - (amount / 100))));
        return tinycolor(rgb);
    }

    function darken (color, amount) {
        amount = (amount === 0) ? 0 : (amount || 10);
        var hsl = tinycolor(color).toHsl();
        hsl.l -= amount / 100;
        hsl.l = clamp01(hsl.l);
        return tinycolor(hsl);
    }

    // Spin takes a positive or negative amount within [-360, 360] indicating the change of hue.
    // Values outside of this range will be wrapped into this range.
    function spin(color, amount) {
        var hsl = tinycolor(color).toHsl();
        var hue = (mathRound(hsl.h) + amount) % 360;
        hsl.h = hue < 0 ? 360 + hue : hue;
        return tinycolor(hsl);
    }

    // Combination Functions
    // ---------------------
    // Thanks to jQuery xColor for some of the ideas behind these
    // <https://github.com/infusion/jQuery-xcolor/blob/master/jquery.xcolor.js>

    function complement(color) {
        var hsl = tinycolor(color).toHsl();
        hsl.h = (hsl.h + 180) % 360;
        return tinycolor(hsl);
    }

    function triad(color) {
        var hsl = tinycolor(color).toHsl();
        var h = hsl.h;
        return [
            tinycolor(color),
            tinycolor({ h: (h + 120) % 360, s: hsl.s, l: hsl.l }),
            tinycolor({ h: (h + 240) % 360, s: hsl.s, l: hsl.l })
        ];
    }

    function tetrad(color) {
        var hsl = tinycolor(color).toHsl();
        var h = hsl.h;
        return [
            tinycolor(color),
            tinycolor({ h: (h + 90) % 360, s: hsl.s, l: hsl.l }),
            tinycolor({ h: (h + 180) % 360, s: hsl.s, l: hsl.l }),
            tinycolor({ h: (h + 270) % 360, s: hsl.s, l: hsl.l })
        ];
    }

    function splitcomplement(color) {
        var hsl = tinycolor(color).toHsl();
        var h = hsl.h;
        return [
            tinycolor(color),
            tinycolor({ h: (h + 72) % 360, s: hsl.s, l: hsl.l}),
            tinycolor({ h: (h + 216) % 360, s: hsl.s, l: hsl.l})
        ];
    }

    function analogous(color, results, slices) {
        results = results || 6;
        slices = slices || 30;

        var hsl = tinycolor(color).toHsl();
        var part = 360 / slices;
        var ret = [tinycolor(color)];

        for (hsl.h = ((hsl.h - (part * results >> 1)) + 720) % 360; --results; ) {
            hsl.h = (hsl.h + part) % 360;
            ret.push(tinycolor(hsl));
        }
        return ret;
    }

    function monochromatic(color, results) {
        results = results || 6;
        var hsv = tinycolor(color).toHsv();
        var h = hsv.h, s = hsv.s, v = hsv.v;
        var ret = [];
        var modification = 1 / results;

        while (results--) {
            ret.push(tinycolor({ h: h, s: s, v: v}));
            v = (v + modification) % 1;
        }

        return ret;
    }

    // Utility Functions
    // ---------------------

    tinycolor.mix = function(color1, color2, amount) {
        amount = (amount === 0) ? 0 : (amount || 50);

        var rgb1 = tinycolor(color1).toRgb();
        var rgb2 = tinycolor(color2).toRgb();

        var p = amount / 100;
        var w = p * 2 - 1;
        var a = rgb2.a - rgb1.a;

        var w1;

        if (w * a == -1) {
            w1 = w;
        } else {
            w1 = (w + a) / (1 + w * a);
        }

        w1 = (w1 + 1) / 2;

        var w2 = 1 - w1;

        var rgba = {
            r: rgb2.r * w1 + rgb1.r * w2,
            g: rgb2.g * w1 + rgb1.g * w2,
            b: rgb2.b * w1 + rgb1.b * w2,
            a: rgb2.a * p  + rgb1.a * (1 - p)
        };

        return tinycolor(rgba);
    };


    // Readability Functions
    // ---------------------
    // <http://www.w3.org/TR/AERT#color-contrast>

    // `readability`
    // Analyze the 2 colors and returns an object with the following properties:
    //    `brightness`: difference in brightness between the two colors
    //    `color`: difference in color/hue between the two colors
    tinycolor.readability = function(color1, color2) {
        var c1 = tinycolor(color1);
        var c2 = tinycolor(color2);
        var rgb1 = c1.toRgb();
        var rgb2 = c2.toRgb();
        var brightnessA = c1.getBrightness();
        var brightnessB = c2.getBrightness();
        var colorDiff = (
            Math.max(rgb1.r, rgb2.r) - Math.min(rgb1.r, rgb2.r) +
            Math.max(rgb1.g, rgb2.g) - Math.min(rgb1.g, rgb2.g) +
            Math.max(rgb1.b, rgb2.b) - Math.min(rgb1.b, rgb2.b)
        );

        return {
            brightness: Math.abs(brightnessA - brightnessB),
            color: colorDiff
        };
    };

    // `readable`
    // http://www.w3.org/TR/AERT#color-contrast
    // Ensure that foreground and background color combinations provide sufficient contrast.
    // *Example*
    //    tinycolor.isReadable("#000", "#111") => false
    tinycolor.isReadable = function(color1, color2) {
        var readability = tinycolor.readability(color1, color2);
        return readability.brightness > 125 && readability.color > 500;
    };

    // `mostReadable`
    // Given a base color and a list of possible foreground or background
    // colors for that base, returns the most readable color.
    // *Example*
    //    tinycolor.mostReadable("#123", ["#fff", "#000"]) => "#000"
    tinycolor.mostReadable = function(baseColor, colorList) {
        var bestColor = null;
        var bestScore = 0;
        var bestIsReadable = false;
        for (var i=0; i < colorList.length; i++) {

            // We normalize both around the "acceptable" breaking point,
            // but rank brightness constrast higher than hue.

            var readability = tinycolor.readability(baseColor, colorList[i]);
            var readable = readability.brightness > 125 && readability.color > 500;
            var score = 3 * (readability.brightness / 125) + (readability.color / 500);

            if ((readable && ! bestIsReadable) ||
                (readable && bestIsReadable && score > bestScore) ||
                ((! readable) && (! bestIsReadable) && score > bestScore)) {
                bestIsReadable = readable;
                bestScore = score;
                bestColor = tinycolor(colorList[i]);
            }
        }
        return bestColor;
    };


    // Big List of Colors
    // ------------------
    // <http://www.w3.org/TR/css3-color/#svg-color>
    var names = tinycolor.names = {
        aliceblue: "f0f8ff",
        antiquewhite: "faebd7",
        aqua: "0ff",
        aquamarine: "7fffd4",
        azure: "f0ffff",
        beige: "f5f5dc",
        bisque: "ffe4c4",
        black: "000",
        blanchedalmond: "ffebcd",
        blue: "00f",
        blueviolet: "8a2be2",
        brown: "a52a2a",
        burlywood: "deb887",
        burntsienna: "ea7e5d",
        cadetblue: "5f9ea0",
        chartreuse: "7fff00",
        chocolate: "d2691e",
        coral: "ff7f50",
        cornflowerblue: "6495ed",
        cornsilk: "fff8dc",
        crimson: "dc143c",
        cyan: "0ff",
        darkblue: "00008b",
        darkcyan: "008b8b",
        darkgoldenrod: "b8860b",
        darkgray: "a9a9a9",
        darkgreen: "006400",
        darkgrey: "a9a9a9",
        darkkhaki: "bdb76b",
        darkmagenta: "8b008b",
        darkolivegreen: "556b2f",
        darkorange: "ff8c00",
        darkorchid: "9932cc",
        darkred: "8b0000",
        darksalmon: "e9967a",
        darkseagreen: "8fbc8f",
        darkslateblue: "483d8b",
        darkslategray: "2f4f4f",
        darkslategrey: "2f4f4f",
        darkturquoise: "00ced1",
        darkviolet: "9400d3",
        deeppink: "ff1493",
        deepskyblue: "00bfff",
        dimgray: "696969",
        dimgrey: "696969",
        dodgerblue: "1e90ff",
        firebrick: "b22222",
        floralwhite: "fffaf0",
        forestgreen: "228b22",
        fuchsia: "f0f",
        gainsboro: "dcdcdc",
        ghostwhite: "f8f8ff",
        gold: "ffd700",
        goldenrod: "daa520",
        gray: "808080",
        green: "008000",
        greenyellow: "adff2f",
        grey: "808080",
        honeydew: "f0fff0",
        hotpink: "ff69b4",
        indianred: "cd5c5c",
        indigo: "4b0082",
        ivory: "fffff0",
        khaki: "f0e68c",
        lavender: "e6e6fa",
        lavenderblush: "fff0f5",
        lawngreen: "7cfc00",
        lemonchiffon: "fffacd",
        lightblue: "add8e6",
        lightcoral: "f08080",
        lightcyan: "e0ffff",
        lightgoldenrodyellow: "fafad2",
        lightgray: "d3d3d3",
        lightgreen: "90ee90",
        lightgrey: "d3d3d3",
        lightpink: "ffb6c1",
        lightsalmon: "ffa07a",
        lightseagreen: "20b2aa",
        lightskyblue: "87cefa",
        lightslategray: "789",
        lightslategrey: "789",
        lightsteelblue: "b0c4de",
        lightyellow: "ffffe0",
        lime: "0f0",
        limegreen: "32cd32",
        linen: "faf0e6",
        magenta: "f0f",
        maroon: "800000",
        mediumaquamarine: "66cdaa",
        mediumblue: "0000cd",
        mediumorchid: "ba55d3",
        mediumpurple: "9370db",
        mediumseagreen: "3cb371",
        mediumslateblue: "7b68ee",
        mediumspringgreen: "00fa9a",
        mediumturquoise: "48d1cc",
        mediumvioletred: "c71585",
        midnightblue: "191970",
        mintcream: "f5fffa",
        mistyrose: "ffe4e1",
        moccasin: "ffe4b5",
        navajowhite: "ffdead",
        navy: "000080",
        oldlace: "fdf5e6",
        olive: "808000",
        olivedrab: "6b8e23",
        orange: "ffa500",
        orangered: "ff4500",
        orchid: "da70d6",
        palegoldenrod: "eee8aa",
        palegreen: "98fb98",
        paleturquoise: "afeeee",
        palevioletred: "db7093",
        papayawhip: "ffefd5",
        peachpuff: "ffdab9",
        peru: "cd853f",
        pink: "ffc0cb",
        plum: "dda0dd",
        powderblue: "b0e0e6",
        purple: "800080",
        red: "f00",
        rosybrown: "bc8f8f",
        royalblue: "4169e1",
        saddlebrown: "8b4513",
        salmon: "fa8072",
        sandybrown: "f4a460",
        seagreen: "2e8b57",
        seashell: "fff5ee",
        sienna: "a0522d",
        silver: "c0c0c0",
        skyblue: "87ceeb",
        slateblue: "6a5acd",
        slategray: "708090",
        slategrey: "708090",
        snow: "fffafa",
        springgreen: "00ff7f",
        steelblue: "4682b4",
        tan: "d2b48c",
        teal: "008080",
        thistle: "d8bfd8",
        tomato: "ff6347",
        turquoise: "40e0d0",
        violet: "ee82ee",
        wheat: "f5deb3",
        white: "fff",
        whitesmoke: "f5f5f5",
        yellow: "ff0",
        yellowgreen: "9acd32"
    };

    // Make it easy to access colors via `hexNames[hex]`
    var hexNames = tinycolor.hexNames = flip(names);


    // Utilities
    // ---------

    // `{ 'name1': 'val1' }` becomes `{ 'val1': 'name1' }`
    function flip(o) {
        var flipped = { };
        for (var i in o) {
            if (o.hasOwnProperty(i)) {
                flipped[o[i]] = i;
            }
        }
        return flipped;
    }

    // Return a valid alpha value [0,1] with all invalid values being set to 1
    function boundAlpha(a) {
        a = parseFloat(a);

        if (isNaN(a) || a < 0 || a > 1) {
            a = 1;
        }

        return a;
    }

    // Take input from [0, n] and return it as [0, 1]
    function bound01(n, max) {
        if (isOnePointZero(n)) { n = "100%"; }

        var processPercent = isPercentage(n);
        n = mathMin(max, mathMax(0, parseFloat(n)));

        // Automatically convert percentage into number
        if (processPercent) {
            n = parseInt(n * max, 10) / 100;
        }

        // Handle floating point rounding errors
        if ((math.abs(n - max) < 0.000001)) {
            return 1;
        }

        // Convert into [0, 1] range if it isn't already
        return (n % max) / parseFloat(max);
    }

    // Force a number between 0 and 1
    function clamp01(val) {
        return mathMin(1, mathMax(0, val));
    }

    // Parse a base-16 hex value into a base-10 integer
    function parseIntFromHex(val) {
        return parseInt(val, 16);
    }

    // Need to handle 1.0 as 100%, since once it is a number, there is no difference between it and 1
    // <http://stackoverflow.com/questions/7422072/javascript-how-to-detect-number-as-a-decimal-including-1-0>
    function isOnePointZero(n) {
        return typeof n == "string" && n.indexOf('.') != -1 && parseFloat(n) === 1;
    }

    // Check to see if string passed in is a percentage
    function isPercentage(n) {
        return typeof n === "string" && n.indexOf('%') != -1;
    }

    // Force a hex value to have 2 characters
    function pad2(c) {
        return c.length == 1 ? '0' + c : '' + c;
    }

    // Replace a decimal with it's percentage value
    function convertToPercentage(n) {
        if (n <= 1) {
            n = (n * 100) + "%";
        }

        return n;
    }

    // Converts a decimal to a hex value
    function convertDecimalToHex(d) {
        return Math.round(parseFloat(d) * 255).toString(16);
    }
    // Converts a hex value to a decimal
    function convertHexToDecimal(h) {
        return (parseIntFromHex(h) / 255);
    }

    var matchers = (function() {

        // <http://www.w3.org/TR/css3-values/#integers>
        var CSS_INTEGER = "[-\\+]?\\d+%?";

        // <http://www.w3.org/TR/css3-values/#number-value>
        var CSS_NUMBER = "[-\\+]?\\d*\\.\\d+%?";

        // Allow positive/negative integer/number.  Don't capture the either/or, just the entire outcome.
        var CSS_UNIT = "(?:" + CSS_NUMBER + ")|(?:" + CSS_INTEGER + ")";

        // Actual matching.
        // Parentheses and commas are optional, but not required.
        // Whitespace can take the place of commas or opening paren
        var PERMISSIVE_MATCH3 = "[\\s|\\(]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")\\s*\\)?";
        var PERMISSIVE_MATCH4 = "[\\s|\\(]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")\\s*\\)?";

        return {
            rgb: new RegExp("rgb" + PERMISSIVE_MATCH3),
            rgba: new RegExp("rgba" + PERMISSIVE_MATCH4),
            hsl: new RegExp("hsl" + PERMISSIVE_MATCH3),
            hsla: new RegExp("hsla" + PERMISSIVE_MATCH4),
            hsv: new RegExp("hsv" + PERMISSIVE_MATCH3),
            hex3: /^([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
            hex6: /^([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/,
            hex8: /^([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/
        };
    })();

    // `stringInputToObject`
    // Permissive string parsing.  Take in a number of formats, and output an object
    // based on detected format.  Returns `{ r, g, b }` or `{ h, s, l }` or `{ h, s, v}`
    function stringInputToObject(color) {

        color = color.replace(trimLeft,'').replace(trimRight, '').toLowerCase();
        var named = false;
        if (names[color]) {
            color = names[color];
            named = true;
        }
        else if (color == 'transparent') {
            return { r: 0, g: 0, b: 0, a: 0, format: "name" };
        }

        // Try to match string input using regular expressions.
        // Keep most of the number bounding out of this function - don't worry about [0,1] or [0,100] or [0,360]
        // Just return an object and let the conversion functions handle that.
        // This way the result will be the same whether the tinycolor is initialized with string or object.
        var match;
        if ((match = matchers.rgb.exec(color))) {
            return { r: match[1], g: match[2], b: match[3] };
        }
        if ((match = matchers.rgba.exec(color))) {
            return { r: match[1], g: match[2], b: match[3], a: match[4] };
        }
        if ((match = matchers.hsl.exec(color))) {
            return { h: match[1], s: match[2], l: match[3] };
        }
        if ((match = matchers.hsla.exec(color))) {
            return { h: match[1], s: match[2], l: match[3], a: match[4] };
        }
        if ((match = matchers.hsv.exec(color))) {
            return { h: match[1], s: match[2], v: match[3] };
        }
        if ((match = matchers.hex8.exec(color))) {
            return {
                a: convertHexToDecimal(match[1]),
                r: parseIntFromHex(match[2]),
                g: parseIntFromHex(match[3]),
                b: parseIntFromHex(match[4]),
                format: named ? "name" : "hex8"
            };
        }
        if ((match = matchers.hex6.exec(color))) {
            return {
                r: parseIntFromHex(match[1]),
                g: parseIntFromHex(match[2]),
                b: parseIntFromHex(match[3]),
                format: named ? "name" : "hex"
            };
        }
        if ((match = matchers.hex3.exec(color))) {
            return {
                r: parseIntFromHex(match[1] + '' + match[1]),
                g: parseIntFromHex(match[2] + '' + match[2]),
                b: parseIntFromHex(match[3] + '' + match[3]),
                format: named ? "name" : "hex"
            };
        }

        return false;
    }

    window.tinycolor = tinycolor;
    })();


    $(function () {
        if ($.fn.spectrum.load) {
            $.fn.spectrum.processNativeColorInputs();
        }
    });

})(window, jQuery);

/**
 * 所有组件类的基类 ,包含公共的属性声明和方法
 * @Class SNSComponent
 */
var SNSComponent = function() {
	this.type = "component";
	this.id;
	this.selector;
	this._jQueryDom;

	this.containerSelector;
	this._containerDom;

	this.triggerSelector;
	this._triggerDom;

	this.hideFloat = SNSComponent.HIDE_TYPE.IGNORE;
	
	// 透明div，拖动时防止鼠标选中其他元素
	this.transparentPanelSelector = "#snsim_coverlayer";
	// 当前是否在移动
	this.dragging = false;
	// 是否使用默认坐标
	this.useDefaultPosition = true;
	
	// 蒙板层
	this.maskLayerSelector = '#snsim_coverlayer';
	// 打开时是否屏蔽其他窗口
	this.maskOthers = false;
	this.oldZIndex = 0;
	// 新的z-index值在蒙板层z-index之上
	this.newZIndex = parseInt(jQuery(this.maskLayerSelector).css('z-index')) + 1;
};

SNSComponent.HIDE_TYPE = {
	HIDE : 0,
	IGNORE : 1,
	HIDE_IGNORE_SELF : 2
}

SNSComponent.prototype._init = function() {
	if (this.hideFloat == SNSComponent.HIDE_TYPE.HIDE) {
		SNSApplication.getInstance().getGlobalEventManager().registerEventHandler(SNS_EVENT_SUBJECT.HIDE_FLOAT, true,
				function(event, data) {
					if (!this.visible()) {
						return;
					}
					var target = jQuery(data.event.target);
					if (target === this.getTriggerDom() || target[0] === this.getTriggerDom()[0] || this.getTriggerDom().find(target).length > 0) {
						return;
					}
					this.hide();
				}, this);
	} else if (this.hideFloat == SNSComponent.HIDE_TYPE.HIDE_IGNORE_SELF) {
		SNSApplication.getInstance().getGlobalEventManager().registerEventHandler(SNS_EVENT_SUBJECT.HIDE_FLOAT, true,
				function(event, data) {
					if (!this.visible()) {
						return;
					}
					var target = jQuery(data.event.target);
					if (target === this.getTriggerDom() || target[0] === this.getTriggerDom()[0] || this.getTriggerDom().find(target).length > 0 || this.getDom().find(target).length > 0) {
						return;
					}
					this.hide();
				}, this);
	}
	
	if(this.mask) {
		this.oldZIndex = parseInt(this.getDom().css('z-index'));
		this.getDom().css('z-index', ++this.newZIndex);
	}
};

/**
 * 返回属性中selector对象的jQueryDom对象
 * @returns {jQueryDom}
 */
SNSComponent.prototype.getDom = function() {
	if (!this._jQueryDom || this._jQueryDom.length == 0) {
		this._jQueryDom = jQuery(this.selector);
	}
	return this._jQueryDom;
};

/**
 * 返回属性中selector对象的jQueryDom对象
 * @returns {jQueryDom}
 */
SNSComponent.prototype.getContainerDom = function() {
	if (!this._containerDom || this._containerDom.length == 0) {
		this._containerDom = jQuery(this.containerSelector);
	}
	return this._containerDom;
};

/**
 * 返回属性中selector对象的jQueryDom对象
 * @returns {jQueryDom}
 */
SNSComponent.prototype.getTriggerDom = function() {
	if (!this._triggerDom || this._triggerDom.length == 0) {
		this._triggerDom = jQuery(this.triggerSelector);
	}
	return this._triggerDom;
};

/**
 * 切换隐藏或者显示
 */
SNSComponent.prototype.toggle = function() {
	if (this.visible()) {
		this.hide();
	} else {
		this.show();
	}
};

/**
 * 判断节点是否可见
 * @returns {Boolean}
 */
SNSComponent.prototype.visible = function() {
	var dom = this.getDom();
	if (dom.is(":visible")) {
		return true;
	}
};

SNSComponent.prototype.beforeShow = function() {

};

/**
 * 显示此节点
 * @param isInline {boolean} display是否为inline
 */
SNSComponent.prototype.show = function() {
	if(this.maskOthers || this.mask) {
		this.getDom().css('z-index', ++this.newZIndex);
		jQuery(this.maskLayerSelector).show();
	}
	if (this.visible()) {
		return;
	}
	var dom = this.getDom();

	this.beforeShow();

	dom.show("fast");

	this.afterShow();

};

SNSComponent.prototype.afterShow = function() {

};

SNSComponent.prototype.hide = function() {
	var dom = this.getDom();
	if(this.maskOthers === true) {
		dom.css('z-index', this.oldZIndex);
		jQuery(this.maskLayerSelector).hide();
	}
	dom.hide("fast");
};

SNSComponent.prototype.remove = function(){
	this.getDom().remove();
};

/**
 * 开启拖动功能
 */
SNSComponent.prototype.enableMove = function() {
	if(YYIMCommonUtil.isStringAndNotEmpty(this.getDragComponentSelector())
			&& YYIMCommonUtil.isStringAndNotEmpty(this.getMoveComponentSelector())) {
		var that = this;
		jQuery(this.getDragComponentSelector()).bind("mouseenter", function () {
			// this is event element
			SNSComponent.prototype.move.call(that, this);
		});
	}
};

/**
 * 拖动的部分
 */
SNSComponent.prototype.getDragComponentSelector = function(){};

/**
 * 移动的部分
 */
SNSComponent.prototype.getMoveComponentSelector = function(){};

/**
 * 拖动前检测是否可移动，排除某些位置点击不可拖动
 */
SNSComponent.prototype.validateMovability = function(){
	return false;
};

/**
 * 窗口移动
 * @param element 事件源
 */
SNSComponent.prototype.move = function(element){
	var that = this;
	
	var x,y;
	element.onmousedown = function(e){
		if(!that.validateMovability(e)){
			return;
		}
		jQuery(that.transparentPanelSelector).show();
		if(!!e === false) {
			e = window.event;
		}
		e.preventDefault ? e.preventDefault() : e.returnValue = false;
		that.dragging = true;
		//console.info("mouse down : dragging = true");
		x = e.clientX;
		y = e.clientY;
		document.onmousemove = function(e){
			//console.info("document.onmousemove " + e);
			that.useDefaultPosition = false;
			if(!!e === false) {
				e = window.event;
			}
			var deltaX = e.clientX - x;
			var deltaY = e.clientY - y;
			//console.info("mouse move : dragging = " + that.dragging);
			if(!that.dragging){
				deltaX = deltaY = 0;
				jQuery(that.transparentPanelSelector).hide();
				return;
			}
			
			var chatBox = jQuery(that.getMoveComponentSelector());
			// 到达左（右）边界并继续左（右）移
			if((chatBox.offset().left <= 0 && deltaX < 0) || (jQuery(window).width() - chatBox.width() <= chatBox.offset().left && deltaX > 0)){
				deltaX = 0;
			}else{
				x = e.clientX;
			}
			// 到达上边界并继续上移
			if(chatBox.offset().top <= 0 && deltaY < 0 || (jQuery(window).height() - chatBox.height() <= chatBox.offset().top && deltaY > 0)){
				deltaY = 0;
			}else{
				y = e.clientY;
			}
			var Top =  Math.max(chatBox.offset().top + deltaY, 0);
			var Left =  Math.max(chatBox.offset().left + deltaX, 0);
			
			chatBox.css("left", Left);
			chatBox.css("top", Top);
			
			/**
			 * 窗口移动 同步 20160423 rongqb
			 */
			window.location && window.localStorage.setItem(YYIMChat.getUserNode() + '_position',JSON.stringify([Left,Top]));
		};
	};
	document.onmouseup = function(){
		var chatBox = jQuery(that.getMoveComponentSelector());
		var left = chatBox.offset().left,top = chatBox.offset().top;
		// 到达左（右）边界并继续左（右）移
		if( chatBox.offset().left < 0){
			left = 0;
		}else if(jQuery(window).width() - chatBox.width() < chatBox.offset().left){
			left = jQuery(window).width() - chatBox.width();
		}
		// 到达上边界并继续上移
		if(chatBox.offset().top < 0){
			top = 0;
		}else if( jQuery(window).height() - chatBox.height() < chatBox.offset().top){
			top = jQuery(window).height() - chatBox.height();
		}
		chatBox.css("left", left);
		chatBox.css("top", top);
		
		/**
		 * 窗口移动 同步 20160423 rongqb
		 */
		window.location && window.localStorage.setItem(YYIMChat.getUserNode() + '_position',JSON.stringify([left,top]));
		
		that.dragging = false;
		//console.info("mouse up : dragging = false");
		jQuery(that.transparentPanelSelector).hide();
	};
};
SNSComponent.prototype.shadeShow = function () {
	jQuery(this.transparentPanelSelector).show();
	
}
SNSComponent.prototype.shadeHide = function () {
	jQuery(this.transparentPanelSelector).hide();
	
}
/**
 * 界面中Tab页抽象出来的类
 * @Class SNSTab 继承自
 * @See SNSComponent
 * @author aviator
 */
var SNSTab = function() {

	this.index;

	/**
	 * Tab的名称， 同一个tabContainer中的name不能一样，否则会被覆盖
	 * @Type {String}
	 * @field
	 */
	this.name = Math.uuid();

	this.type = "tab";

	/**
	 * Tab标签头部的选择器
	 * @Type {String}
	 * @Field
	 */
	this.headSelector;

	/**
	 * Tab内容的选择器
	 * @Type {String}
	 * @Field
	 */
	this.contentSelector;

	/**
	 * 缓存头部的jQueryDom对象
	 * @Type {jQueryDom}
	 * @Private
	 */
	this._headDom;

	/**
	 * 缓存Tab内容的jQueryDom对象
	 * @Type {jQueryDom}
	 * @Private
	 */
	this._contentDom;

	this.closeable = false;
};

/**
 * Tab头部使用的模板
 * @static
 */
SNSTab.headTemplate;

/**
 * Tab内容部分使用的模板
 * @static
 */
SNSTab.contentTemplate;

SNSTab.prototype = new SNSComponent();

/**
 * 当添加到TabContainer中被调用
 */
SNSTab.prototype._init = function() {

};

/**
 * 判断节点是否可见
 * @returns {Boolean}
 */
SNSTab.prototype.visible = function() {
	return this.isContentVisible();
};

SNSTab.prototype.isHeadVisible = function() {
	var dom = this.getHeadDom();
	if (dom.is(":visible")) {
		return true;
	}
};

SNSTab.prototype.isContentVisible = function() {
	var dom = this.getContentDom();
	if (dom.is(":visible")) {
		return true;
	}
};

/**
 * 返回Tab头部的Dom节点，
 * @returns{jQueryDom} Array, 若返回值的length为0, 则说明头节点不存在
 */
SNSTab.prototype.getHeadDom = function() {
	if (!this._headDom || this._headDom.length == 0) {
		this._headDom = jQuery(this.headSelector);
	}
	return this._headDom;
};

/**
 * 返回Tab内容的Dom节点，
 * @returns{jQueryDom} Array, 若返回值的length为0, 则说明内容节点不存在
 */
SNSTab.prototype.getContentDom = function() {
	if (!this._contentDom || this._contentDom.length == 0) {
		this._contentDom = jQuery(this.contentSelector);
	}
	return this._contentDom;
};

/**
 * 返回根据头部模板填充数据后的HTML字符串
 * @returns {String}
 */
SNSTab.prototype.getHeadHtml = function() {
	return TemplateUtil.genHtml(this.getHeadTemplate(), this);
};

/**
 * 返回根据Tab内容模板填充数据后的HTML字符串
 * @returns {String}
 */
SNSTab.prototype.getContentHtml = function() {
	return TemplateUtil.genHtml(this.getContentTemplate(), this);
};

/**
 * 返回头部模板，用于屏蔽不同Tab的模板声明的不同
 * @returns {String}
 * @Abstract
 */
SNSTab.prototype.getHeadTemplate = function() {
	if (this.headTemplate){
		return this.headTemplate;
	}
	return SNSTab.headTemplate;
};

/**
 * 返回内容模板，用于屏蔽不同Tab的模板声明的不同
 * @returns {String}
 * @Abstract
 */
SNSTab.prototype.getContentTemplate = function() {
	if (this.contentTemplate){
		return this.contentTemplate;
	}
	return SNSTab.contentTemplate;
};

/**
 * 点击选中时，并且未执行选中操作时触发
 * @Event
 */
SNSTab.prototype.beforeSelect = function() {

};

/**
 * 本Tab 页被选中， 添加css class:cur
 */
SNSTab.prototype.select = function() {

	var head = this.getHeadDom();
	if (head.hasClass("cur")) {
		return;
	}
	var content = this.getContentDom();

	this.beforeSelect();

	head.addClass("cur");
	content.addClass("cur");

	this.afterSelect();
};

/**
 * 点击选中时，并且执行完选中操作时触发
 * @Event
 */
SNSTab.prototype.afterSelect = function() {

};

/**
 * 未执行取消选中操作时触发
 * @Event
 */
SNSTab.prototype.beforeUnselect = function() {

};

/**
 * 取消选中本tab
 */
SNSTab.prototype.unselect = function() {
	var head = this.getHeadDom();
	if (head.hasClass("cur")) {
		var content = this.getContentDom();

		this.beforeUnselect();

		head.removeClass("cur");
		content.removeClass("cur");
	}

};

/**
 * 包含对Tab的属性和方法的集合类，类似于Map
 * @Class SNSTabList
 * @See SNSBaseList
 */
var SNSTabList = function() {

	/**
	 * 当前选中的Tab的名称
	 * @field
	 * @type {String}
	 */
	this.tabCurName;
};

SNSTabList.prototype = new SNSBaseList();

/**
 * 以tab的name为key, 将tab对象到集合中，重复添加相同的name的tab, 之前添加的会被替换
 * @param tab {SNSTab}
 */
SNSTabList.prototype.add = function(tab) {
	if (tab && tab instanceof SNSTab)
		SNSBaseList.prototype.add.call(this, tab.name, tab);
};

/**
 * 返回指定的tab对象
 * @param tab {SNSTab |String} tab对象或jid字符串
 * @returns {SNSTab}
 */
SNSTabList.prototype.get = function(tab) {
	if (tab) {
		if (typeof tab == "string" && tab.notEmpty()) {
			return SNSBaseList.prototype.get.call(this, tab);
		} else if (tab instanceof SNSTab) {
			return SNSBaseList.prototype.get.call(this, tab.name);
		}
	}
};

/**
 * 从集合中删除指定的tab
 * @param tab {SNSTab |String} tab对象或jid字符串
 * @returns {Boolean}  true如果操作成功， false如果没有对象可以被删除
 */
SNSTabList.prototype.remove = function(tab) {
	if (tab) {
		if (typeof tab == "string" && tab.notEmpty()) {
			return SNSBaseList.prototype.remove.call(this, tab);
		} else if (tab instanceof SNSTab) {
			return SNSBaseList.prototype.remove.call(this, tab.name);
		}
	}
};

/**
 * 返回向前选中的tab对象
 * @returns {SNSTab}
 */
SNSTabList.prototype.getCurrentTab = function() {
	return this.get(this.tabCurName);
};

/**
 * 切换指定tab页到当前选中， 只对集合进行操作， 和界面无关
 * @param tab {SNSTab |String} tab对象或jid字符串
 */
SNSTabList.prototype.changeCurrentTo = function(tab) {
	var cur = this.get(tab);
	this.tabCurName = cur.name;
};
/**
 * tab容器的抽象类， 包装了对tab的各种操作
 * @Class SNSTabContainer
 * @see SNSWindow
 */
var SNSTabContainer = function() {
	this.selector;
	
	this.headContainerSelector;
	
	this.contentContainerSelector;
	
	/**
	 * 包含tab的集合类
	 * @Type SNSTabList
	 * @field
	 */
	this.tabs = new SNSTabList();
	
	this._headContainer;
	this._contentContainer;
}

SNSTabContainer.prototype = new SNSComponent();

SNSTabContainer.prototype._init = function() {
	YYIMChat.log("SNSTabContainer.prototype._init",3);
};

/**
 * 添加tab页, 如果Tab有模板存在，则会进行渲染操作
 * @param tab {SNSTab}
 */
SNSTabContainer.prototype.addTab = function(tab) {

	YYIMChat.log("addTab:", 3, this.tabs, tab);
	if(tab.getHeadTemplate()){
		this.getHeadContainer().append(tab.getHeadHtml());
	}
	if(tab.getContentTemplate()){
		this.getContentContainer().append(tab.getContentHtml());
	}
	this.tabs.add(tab);
	tab._init();
	this._bindDomEvent(tab);
};

/**
 * 获取tab头部的存放容器的DOM节点
 * @returns
 */
SNSTabContainer.prototype.getHeadContainer = function(){
	if(!this._headContainer || this._headContainer.length==0){
		this._headContainer = jQuery(this.headContainerSelector);
	}
	return this._headContainer;
};

/**
 * 获取tab的内容容器的DOM节点
 * @returns
 */
SNSTabContainer.prototype.getContentContainer = function(){
	if(!this._contentContainer || this._contentContainer.length==0){
		this._contentContainer = jQuery(this.contentContainerSelector);
	}
	return this._contentContainer;
};

/**
 * 
 */
SNSTabContainer.prototype._bindDomEvent = function(tab){
	var _self = this;
	tab.getHeadDom().bind("click", function() {
		_self.changeTabTo(tab);
	});
}

/**
 * 根据参数获取Tab对象
 * @param tab {SNSTab|string} tab对象或者jid字符串
 * @returns {SNSTab}
 */
SNSTabContainer.prototype.getTab = function(tab) {
	return this.tabs.get(tab);
};

/**
 * 返回当前集合中Tab对象的个数
 * @returns {Number}
 */
SNSTabContainer.prototype.size = function(){
	return this.tabs.size();
};

/**
 * 删除指定的tab页，若指定删除的tab为当前打开的tab页，且被关闭后tablist不为空，则随机返回一个存在的tab
 * @param tab {SNSTab|String} tab对象或者JID字符串
 * @returns {SNSTab} 若指定删除的tab为当前打开的tab页，且被关闭后tablist不为空，则随机返回一个存在的tab
 */
SNSTabContainer.prototype.removeTab = function(tab) {
	var cur = this.getCurrentTab();
	this.tabs.remove(tab);
	if (cur.name == tab.name) {
		this.tabs.tabCurName = null;
		if(this.size()!=0){
			return this.tabs.toArray()[0];
		}
	}
};

/**
 * 当tab页切换的时候触发
 * @event
 */
SNSTabContainer.prototype.onTabChange = function(oldTab, newTab) {
	
};

/**
 * 将指定的tab切换到当前， 触发onTabChange事件
 * @param tab {SNSTab | String}  指定的tab对象或者JID字符串
 */
SNSTabContainer.prototype.changeTabTo = function(tab) {
	var entity = tab.roster || tab.chatroom;
	if(!!entity && (!entity.id || entity.id == 'undefined')){
		return;
	}
	
	this.setPicLocal(tab);
	
	this.onTabChange(this.getCurrentTab(),tab);
	if(this.getCurrentTab() != this.tabs.get(tab)){
		this.tabs.changeCurrentTo(tab);
		var list = this.tabs.toArray();
		for (var i = 0; i < list.length; i++) {
			if (list[i] == tab) {
				list[i].select();
			} else {
				list[i].unselect();
			}
		}
	}
};

/**
 * rongqb 20160423 保存同步操作
 */
SNSTabContainer.prototype.setPicLocal = function(tab){
	if(tab){
		if(tab.name == 'recent' || tab.name == 'chatroom' || tab.name == 'roster'){
			var key = YYIMChat.getUserNode() + '_curTab';
			
			window.localStorage && window.localStorage.setItem(key, tab.name);
			
		}else if(!!tab.roster || !!tab.chatroom){
			var entity = tab.roster || tab.chatroom;
			var key = YYIMChat.getUserNode() + '_tablist';
			if(!!window.localStorage){
				var tabList = window.localStorage.getItem(key);
				try{
					tabList = JSON.parse(tabList);
				}catch(e){
				}
				tabList = tabList || [];
				
				if(!jQuery('#snsim_chat_window_tab_head').find('li[id*="'+entity.id+'"]').length){
					if(tabList.indexOf(entity.id) > -1){
						tabList.splice(tabList.indexOf(entity.id),1);
					}
					tabList.push(entity.id);
				}else{
					if(tabList.indexOf(entity.id) == -1){
						tabList.push(entity.id);
					}
				}
				
				if(!window.initLastChatList){
					window.localStorage.setItem(YYIMChat.getUserNode() + '_tabCurEntity', entity.id);
				}
				
				var closeId = window.localStorage.getItem(YYIMChat.getUserNode() + '_closeId');
				if(entity.id == closeId){
					window.localStorage.setItem(YYIMChat.getUserNode() + '_closeId','');
				}
				
				window.localStorage.setItem(key, JSON.stringify(tabList));
				
				window.initLastChatList = false;
			}
		}
	}
};

/**
 * 返回当前选中的Tab对象
 * @returns {SNSTab}
 */
SNSTabContainer.prototype.getCurrentTab = function() {
	return this.tabs.getCurrentTab();
}
/**
 * 该类封装了浮动窗口的属性和操作，根据panel的内容不同可以实现不同
 * @Class SNSFloatPanel
 * @Constructor title 浮动窗口的标题
 */
var SNSFloatPanel = function(title) {
	this.uuid = Math.uuid();

	this.title = title;

	this.selector = "#snsim_float_window_" + this.uuid;

	this.triggerSelector = "";

	this.closeBtnSelector = ".snsim_float_window_head_close_btn";

	this.headSelector = ".snsim_float_window_head";

	this.footSelector = ".snsim_float_window_foot";

	this.contentSelector = ".snsim_float_window_content";

	this.hideFloat = SNSComponent.HIDE_TYPE.IGNORE;
};

SNSFloatPanel.template = '<div id="snsim_float_window_##{{uuid}}" class="snsim_float_window">' + '<div class="snsim_float_window_head">'
		+ '<span class="snsim_float_window_head_title">##{{title}}</span>' + '<span class="snsim_float_window_head_close_btn">'
		+ '<a title="关闭"></a>' + '  </span>' + '</div>' + '<div class="snsim_float_window_content"></div>'
		+ '<div class="snsim_float_window_foot"></div>' + '</div>';

SNSFloatPanel.prototype = new SNSComponent();

SNSFloatPanel.prototype._init = function() {
	
	SNSComponent.prototype._init.call(this);
};

/**
 * 绑定浮动窗口的事件，关闭按钮
 */
SNSFloatPanel.prototype._bindDomEvent = function() {
	if (this.closeBtnSelector) {
		var node = this.getDom().find(this.closeBtnSelector);
		if (node.length == 0) {
			node = jQuery(this.closeBtnSelector);
			if (!node) {
				throw "invalid close button selector";
			}
		}
		node.bind("click", jQuery.proxy(this.hide, this));
	}
};

/**
 * 显示该浮动窗口，若该窗口没有被初始化则初始化该窗口
 */
SNSFloatPanel.prototype.show = function() {

	if (this.getDom().length == 0) {
		var html = this.buildHtml();
		if(this.getInsertDom && typeof this.getInsertDom == 'function'){
			jQuery(this.getInsertDom()).prepend(html);
		}else {
			jQuery("body").append(html);
		}
		this._bindDomEvent();
	}

	SNSComponent.prototype.show.call(this);
	return this;
}

/**
 * 生成Panel对应的HTML字符串并返回
 * @returns {String} 该Panel对应的HTML字符串
 */
SNSFloatPanel.prototype.buildHtml = function() {
	return TemplateUtil.genHtml(this.getTemplate(), this);
};

SNSFloatPanel.prototype.getTemplate = function() {
	return SNSFloatPanel.template;
};

var SNSWindow = function(opt) {
	this.type = "window";
	this.mask = (opt && opt.mask) ? opt.mask : false;
};

SNSWindow.prototype = new SNSFloatPanel();
var SNSIFrameFloatPanel = function(url, id, width, height) {
	this.id = id || Math.uuid();
	this.url = url;

	this.width = width || 500;
	this.height = height || 300;

	this.selector = "#" + id;
	this.containerSelector = "";

	this.closeBtnSelector = ".snsim_float_window_close_btn";
};

SNSIFrameFloatPanel.template = '<div id="##{{id}}" class="snsim_float_window">' + '<span class="snsim_float_window_head>'
		+ '<span class="snsim_float_window_head_title"></span>' + ' <a title="关闭" class="snsim_float_window_close_btn"></a>' + '</span>'
		+ '<iframe src="##{{url}}" frameborder="0" scrolling="no" width="##{{width}}" height="##{{height}}"></iframe>' + '</div>';

SNSIFrameFloatPanel.prototype = new SNSFloatPanel();

SNSIFrameFloatPanel.prototype._init = function() {

};

SNSIFrameFloatPanel.prototype.getTemplate = function() {
	return SNSIFrameFloatPanel.template;
};

SNSIFrameFloatPanel.prototype._bindDomEvent = function() {
	this.getDom().find(this.closeBtnSelector).bind("click", jQuery.proxy(function() {
		this.remove();
	}, this));
}

var SNSTriggerBtn = function(){
	
	this.selector;
	
	this.containerSelector;
	
	this.html;
	
	this.target;
	
};

SNSTriggerBtn.prototype = new SNSComponent();

SNSTriggerBtn.prototype._init = function(){
	this.getContainerDom().append(this.html);
	this.getDom().on("click", jQuery.proxy(this.onclick, this));
};

SNSTriggerBtn.prototype.onclick = function(event){
	this.target.show();
};


var SNSChatRoomController = function(){
	
};

SNSChatRoomController.prototype._init = function(){
	SNSApplication.getInstance().getGlobalEventManager().registerEventHandler(SNS_EVENT_SUBJECT.AFTER_JOIN_CHATROOM, true, this.remindJoinedChatRoom, this);
};

SNSChatRoomController.prototype.remindJoinedChatRoom = function(event, chatroom, member){
	// 模拟一条群消息去提醒用户加入了群
	var message = new SNSInMessage();
	message.type = SNS_MESSAGE_TYPE.GROUPCHAT;
	message.from = SNSApplication.getInstance().getUser().systemRoster;
	message.body = {
		contentType : SNS_MESSAGE_CONTENT_TYPE.TEXT,
		content : SNS_I18N.chatRoom_joined,
		dateline : new Date().getTime()
	};
	
	if(member) {
		message.body.content = member.name + SNS_I18N.member_joined;
	}
	message.chatroom = chatroom;
	
	SNSApplication.getInstance().getMessageInBox().addToUnreadMessage(message);
	
	SNSApplication.getInstance().getGlobalEventManager().trigger(SNS_EVENT_SUBJECT.ON_MESSAGE_IN, [ {
		message : message
	} ]);
};

SNSChatRoomController.prototype.joinChatRoom = function(roomId, roomName){
	//var element = jQuery(event.srcElement || event.target);
	var chatroom = new SNSChatRoom(roomId);
	chatroom.name = roomName;
	chatroom.nickname = SNSApplication.getInstance().getUser().getID();
	SNSIMWindow.getInstance().getDialog().set(DIALOG_TYPE.CONFIRM, SNS_I18N.confirm_join_chatroom + roomName, function(){
		YYIMChat.joinChatGroup({
			id: chatroom.getID(),
			success: function(){
				SNSApplication.getInstance().getUser().chatRoomList.addChatRoom(chatroom);
				SNSIMWindow.getInstance().getChatWindow().openChatWith(chatroom);
				SNSIMWindow.getInstance().getDialog().hide();
			}
		});
	});
	SNSIMWindow.getInstance().getDialog().show();
};
var SNSSubscribeController = function(){
	
};

SNSSubscribeController.prototype._init = function(){
	SNSApplication.getInstance().getGlobalEventManager().registerEventHandler(SNS_PRESENCE_TYPE.SUBSCRIBE, true, this.subscribeProcessor, this);
	SNSApplication.getInstance().getGlobalEventManager().registerEventHandler(SNS_EVENT_SUBJECT.ON_APPROVE_SUBSCRIBED, true, this.remindApprovedSubscribe, this);
};

/**
 * 订阅请求，主要是系统消息的界面渲染
 * @param event
 * @param rosterId
 */
SNSSubscribeController.prototype.subscribeProcessor = function(event, rosterId){
	
	var roster = SNSApplication.getInstance().getUser().getRoster(rosterId);
	
	var message = this.convertToMessage(rosterId);
	var msgInBox = SNSApplication.getInstance().getMessageInBox();
	msgInBox.filter.doFilter(message);
	msgInBox.addToUnreadMessage(message);
	var recentList = SNSApplication.getInstance().getUser().recentList;
	recentList.addNew(message);
	
	SNSApplication.getInstance().getGlobalEventManager().trigger(SNS_EVENT_SUBJECT.ON_MESSAGE_IN, [ {
		message : message
	} ]);
};

/**
 * 提醒新增加好友成功
 * @param event
 * @param roster
 */
SNSSubscribeController.prototype.remindApprovedSubscribe = function(event, roster){
	var message = new SNSInMessage();
	message.type = SNS_MESSAGE_TYPE.CHAT;
	message.from = roster;
	message.body = {
		contentType : SNS_MESSAGE_CONTENT_TYPE.TEXT,
		content : SNS_I18N.subscribe_both,
		dateline : new Date().getTime()
	};
	
	SNSApplication.getInstance().getMessageInBox().addToUnreadMessage(message);
	
	SNSApplication.getInstance().getGlobalEventManager().trigger(SNS_EVENT_SUBJECT.ON_MESSAGE_IN, [ {
		message : message
	} ]);
};

SNSSubscribeController.prototype.convertToMessage = function(id){
	var message = new SNSInMessage();
	message.type = SNS_MESSAGE_TYPE.SUBSCRIBE;
	message.body = {};
	message.body.contentType = SNS_MESSAGE_CONTENT_TYPE.SYSTEM;
	// 请求者
	var roster = SNSApplication.getInstance().getUser().getRoster(id);
	if(!roster){
		roster = new SNSRoster(id);
	}
	message.roster = roster;
	message.from = SNSApplication.getInstance().getUser().systemRoster;
	
	return message;
};
var TemplateUtil = {

};

TemplateUtil.genHtml = function(template, datas) {
	if (template == null || template.isEmpty()) {
		YYIMChat.log("template can not be null", 0);
		return;
	}
	
	if(!(datas instanceof Array)){
		datas = [datas];
	}

	var expr = /##\{\{([\w()_.]+)\}\}/g;
	var result = template;
	var matchs = template.match(expr);
	for ( var m in matchs) {
		if (matchs[m].length == template.length) {
			continue;
		}
		result = result.replace(matchs[m], getValue4Tpl(matchs[m], datas));
	}

	return result;

	function getValue4Tpl(name, datas) {

		name = ("" + name).trim().replace(/##{{([\w()_.]+)}}/, "$1");
		
		var value;
		for(var i =0; i<datas.length;i++){
			try {
				value = eval("arguments[1]["+i+"]." + name);
				if (value && (typeof value == "string" && value.notEmpty() || typeof value == "number")) {
					return value;
				}
			} catch (e) {
			//	YYIMChat.log("getValue4Tpl", 2, datas, name);
			}
		}

		if (name.indexOf("LANG_") == 0) {
			return SNS_LANG_TEMPLATE[name.replace("LANG_", "")];
		}

		if (name.indexOf("lang_") == 0) {
			return SNS_LANG_TEMPLATE[name.replace("lang_", "")];
		}

		try {
			var obj = eval(name);
			if (obj && typeof obj == "string") {
				return obj;
			}
		} catch (e) {
			return '';
		}

		return '';
	}
};
/**
 * 宽版窗口中聊天室对应的类， 包含了对该Tab的操作
 * @Class SNSChatRoomTab
 */
var SNSChatRoomTab = function() {
	this.name = "chatroom";
	this.selector = "#snsim_wide_tab_container";
	this.headSelector = "#snsim_tab_head_chatroom";
	this.contentSelector = "#snsim_tab_content_chatroom";
	this.chatroomContainerSelector = "#snsim_chatroom_list_container";

	this.roomItemIdPrefix = "snsim_window_wide_tab_chatroom_";
	
	this.createChatroomPanel = new SNSCreateChatroomPanel();

	this.chatroomItemTemplate = 
		'<li id="' + this.roomItemIdPrefix + '##{{getID()}}" class="clearfix">'
			+ '<div class="snsim_list_head sns_roster_list_wide_head">' 
				+ '<span class="head_pic">'
					+ '<img src="##{{getPhotoUrl()}}" onerror="YYIMChat.defaultImg(this)"/>' 
				+ '</span>'
				+ '<span node-type="chatRoomItemNewMsg" class="WBIM_icon_new"></span>' 
			+ '</div>'
			+ '<div class="snsim_list_name">' 
				+ '<span class="user_name" title="##{{name}}">##{{name}}</span>' 
			+ '</div>'
			+ '<div style="float:right; cursor: pointer;margin: 16px 10px 0 0;">' 
				+ '<a class="snsim_chatroom_invite_btn" onclick="SNSIMWindow.getInstance().getInvitationWindow().show(\'##{{getID()}}\')">'
					+ '<span class="invite_btn"></span>' 
				+ '</a>' 
			+ '</div>' 
		+ '</li>';
};

SNSChatRoomTab.prototype = new SNSTab();

/**
 * 初始化Tab页，包括绑定全局事件，绑定DOM事件
 * @private
 */
SNSChatRoomTab.prototype._init = function() {

	this.createChatroomPanel._init();
	
	/**
	 * 注册AFTER_CONNECT全局事件，将自己添加到tabContainer中
	 */
	SNSApplication.getInstance().getGlobalEventManager().registerEventHandler(SNS_EVENT_SUBJECT.AFTER_LOAD_CHATROOM, false,
			this.renderChatRoomList, this);
	// 新房间的渲染
	SNSApplication.getInstance().getGlobalEventManager().registerEventHandler(SNS_EVENT_SUBJECT.ON_ADD_CHATROOM, true,
			this.renderAddChatRoom, this);
	
	// 退群
	SNSApplication.getInstance().getGlobalEventManager().registerEventHandler(SNS_EVENT_SUBJECT.ON_QUIT_CHATROOM, true,
			this.renderRemoveChatRoom, this);
	
	
};

/**
 * @param event
 * @param chatroom
 */
SNSChatRoomTab.prototype.renderAddChatRoom = function(event, chatroom){
	this.addChatRoom(chatroom);
};

SNSChatRoomTab.prototype.renderRemoveChatRoom = function(event, chatroom){
	jQuery(this.chatroomContainerSelector).find("#" + this.roomItemIdPrefix + chatroom.getID()).remove();
	SNSIMWindow.getInstance().getChatWindow().getTab(chatroom).getCloseBtnDom().trigger("click");
};

/**
 * 渲染User的ChatRoom列表
 */
SNSChatRoomTab.prototype.renderChatRoomList = function() {
	var list = SNSApplication.getInstance().getUser().chatRoomList.toArray();
	for ( var i in list) {
		var item = list[i];
		if (item && item instanceof SNSChatRoom) {
			this.addChatRoom(item);
		}
	}
};

SNSChatRoomTab.prototype.addChatRoom = function(chatroom) {
	if(jQuery("#" + this.roomItemIdPrefix + chatroom.getID()).length > 0)
		return;
	
	var html = TemplateUtil.genHtml(this.chatroomItemTemplate, chatroom);
	var container = jQuery(this.chatroomContainerSelector);
	container.append(html);
	this._bindChatRoomItemEvent(chatroom);
};

SNSChatRoomTab.prototype._bindChatRoomItemEvent = function(chatroom) {
	var chatroomDoms = this.getDom().find("#" + this.roomItemIdPrefix + chatroom.getID());

	// 单击联系人条目， 打开聊天窗口
	chatroomDoms.bind("click", {
		chatroom : chatroom
	}, function(event) {
		SNSIMWindow.getInstance().getChatWindow().openChatWith(event.data.chatroom);
	});
};

/**
 * 显示未读消息数目
 * @param room
 * @param num
 */
SNSChatRoomTab.prototype.renderUnreadMsgNum = function(room, num){
	var doms = this.getDom().find("#" + this.roomItemIdPrefix + room.getID());
	doms.find(this.unreadMsgNumSelector).text(num);
	doms.find(this.unreadMsgNumSelector).show();
};

/**
 * 隐藏未读消息数目
 * @param room
 */
SNSChatRoomTab.prototype.clearUnreadMsgNum = function(room){
	this.getDom().find("#" + this.roomItemIdPrefix + room.getID()).find(this.unreadMsgNumSelector).hide();
};
/**
 * 聊天窗口对象，包含对聊天窗口的各种操作， 包括添加聊天条目，删除聊天条目
 * @Class SNSChatWindow
 * @extends SNSTabContainer
 * @Constructor
 * @author aviator
 */
var SNSChatWindow = function() {
	this.selector = "#snsim_chat_window";
	this.titleContainerSelector = "#snsim_chat_rt_title";
	// 聊天窗体(包含个人设置，为this.getDom()的父节点)
	this.chatBoxSelector = "#snsim_chat_box";
	// 透明div，拖动时防止鼠标选中其他元素
	//this.transparentPanelSelector = "#snsim_coverlayer";

	this.miniBtnSelector = "#snsim_chat_windown_mini_btn";
	this.closeBtnSelector = "#snsim_chat_windown_close_btn";

	this.headContainerSelector = "#snsim_chat_window_tab_head";
	this.contentContainerSelector = "#snsim_chat_window_tab_content";

	this.currentChatPhotoSelector = ".snsim_current_roster_photo";
	this.currentChatRosterNameSelector = ".sns_curchat_title";

	this.showChatroomMembersSelector = "#show_chatroom_members";
	
	// 正在聊天tab列表向上或向下滚动按钮选择器
	this.scrollTopSelector = ".snsim_scroll_top";
	this.scrollBottomSelector = ".snsim_scroll_bottom";
	
	// 是否使用默认坐标
	//this.useDefaultPosition = true;
	/**
	 * 聊天窗口的输入框
	 * @Field
	 */
	this.sendBox = new SNSSendBox();
	
//	this.drag = false;
};

SNSChatWindow.prototype = new SNSTabContainer();

SNSChatWindow.prototype.getSendBox = function() {
	return this.sendBox;
}

SNSChatWindow.prototype._init = function() {
	YYIMChat.log("SNSChatWindow.prototype._init", 3);
	this.transPosition(true);
	
	this.enableMove();
	
	// 鼠标滚动, 隐藏纵轴滚动条
	jQuery(".snsim_chat_friend_box").perfectScrollbar({suppressScrollX:true,setOffsetRight:true,offsetRight:0});
	// 绑定最小化/关闭/tab列表滚动按钮事件
	this._bindWindowButtonEvent();

	// 绑定接收到消息时的全局事件
	SNSApplication.getInstance().getGlobalEventManager().registerEventHandler(SNS_EVENT_SUBJECT.ON_MESSAGE_IN, true,
			this.onMessageIn, this);
	
	SNSApplication.getInstance().getGlobalEventManager().registerEventHandler('initChatWin', true,
			this.initChatWin, this);
	
	SNSApplication.getInstance().getGlobalEventManager().registerEventHandler('listenChatWinChange', true,
			this.listenChatWinChange, this);
};

/**
 * 同步聊天窗口状态 rongqb 20160423
 */
SNSChatWindow.prototype.initChatWin = function() {
	if(!!window.localStorage){
		var tabList = window.localStorage.getItem(YYIMChat.getUserNode() + '_tablist');
		try{
			tabList = JSON.parse(tabList);
		}catch(e){
		}
		
		tabList = tabList || [];
		var closeId = window.localStorage.getItem(YYIMChat.getUserNode() + '_closeId');
		
		for(var x in tabList){
			var rosterId = tabList[x];
			if(typeof rosterId === 'string' && rosterId !== closeId){
				try{
					if(!jQuery('#snsim_chat_window_tab_head').find('li[id$="_'+rosterId+'"]').length){
						window.initLastChatList = true;
						SNSIMWindow.getInstance().getChatWindow().openChatWith(rosterId);
					}
				}catch(e){
				}
			}
		}
		
		var tabCurEntity = window.localStorage.getItem(YYIMChat.getUserNode() + '_tabCurEntity');
		if(!!tabCurEntity && tabCurEntity !== closeId){
			try{
				if(!jQuery('#snsim_chat_window_tab_head').find('li[id$="_'+tabCurEntity+'"]').is('.cur')){
					window.initLastChatList = true;
					SNSIMWindow.getInstance().getChatWindow().openChatWith(tabCurEntity);
				}
			}catch(e){
			}
		}
		
		if(jQuery('#snsim_chat_window_tab_head').find('li[id$="_'+closeId+'"]').length){
			jQuery('#snsim_chat_window_tab_head').find('li[id$="_'+closeId+'"]').find('.snsim_chat_window_tab_close_btn').trigger('click');
		}
		
		var curTab = window.localStorage.getItem(YYIMChat.getUserNode() + '_curTab');
		if(!!curTab){
			jQuery(".tab_list [id*='"+curTab+"']").trigger('click');
		}
		
		SNSIMWindow.getInstance()._initNarrowWideWindow();
		
		
		var position = window.localStorage.getItem(YYIMChat.getUserNode() + '_position');
		if(!!position){
			try{
				position = JSON.parse(position);
				jQuery('.snsim_chat_box').css({
					left: position[0],
					top: position[1]
				});
			}catch(e){}
		}
		
		var isChatClosed = window.localStorage.getItem(YYIMChat.getUserNode() + '_isChatClosed');
		if(isChatClosed == 'closed'){
			jQuery('#snsim_chat_window').hide();
		}
	}
};

/**
 * 监听聊天窗口状态 rongqb 20160423
 */
SNSChatWindow.prototype.listenChatWinChange = function(){
	var that = this;
	if(document.attachEvent && !K.Browser.opera ) {    
	    document.attachEvent("onstorage", function(){
	    	that.initChatWin();
	    });    
	}else{    //其他注册在window上    
	    window.addEventListener("storage", function(){
	    	that.initChatWin();
	    }, false);    
	}; 
};

/**
 * 向聊天窗口添加消息， 若联系人的聊天窗口未打开， 则忽略消息
 * @param event {Object} 对应的事件对象
 * @param data {Object} 事件数据
 */
SNSChatWindow.prototype.onMessageIn = function(event, data) {
	var message = data.message;
	if(message && message instanceof SNSMessage){
		this.addMessage(message);
	}
};


SNSChatWindow.prototype.addMessage = function(message) {
	var target = message.getRosterOrChatRoom();
	var tab = this.getTab(target);
	if (tab) {
		tab.addMessage(message);
		if (this.getCurrentTab() !== tab) {
			if(message.from.id != YYIMChat.getUserID()){
				tab.addMsgRemind();
			}
		}else{
			if(message.body.receipt){
				SNSApplication.getInstance().getUser().recentList.addNew(message);
				YYIMChat.sendReceiptsPacket(message.body.receipt);
				YYIMChat.sendReadedReceiptsPacket(message.body.receipt);
			}
		}
	}
	if(message.type == 'groupchat') {
		try{
			jQuery('#snsim_tab_content_share_' + message.chatroom.getID()).find('.snsim_share_file_refresh_btn').click();
		}catch(e){
			YYIMChat.log('groupshare_refresh',1,message,e);
		}
	} 
	
};

/**
 * 绑定窗口的最小化、关闭、tab列表滚动等事件
 * @Private
 */
SNSChatWindow.prototype._bindWindowButtonEvent = function() {
	//var that = this;
	jQuery(this.miniBtnSelector).on("click", function() {
		SNSIMWindow.getInstance()._toggleMiniChatWindow();
	});
	jQuery(this.closeBtnSelector).on("click", jQuery.proxy(function() {
//		for(var item in this.tabs._list)
//			this.tabs._list[item].getCloseBtnDom().trigger('click');
		this.hide();
		
		/**
		 * rongqb 20160423 关闭聊天框同步
		 */
		window.localStorage && window.localStorage.setItem(YYIMChat.getUserNode() + '_isChatClosed', 'closed'); 
	}, this));

	jQuery(this.showChatroomMembersSelector).on("click", jQuery.proxy(function(){
		if(this.getActiveRoster() instanceof SNSChatRoom)
			SNSIMWindow.getInstance().getChatroomMembersPanel().show();
	}, this));
	
	// 窗口拖动事件
	//jQuery(this.titleContainerSelector).bind("mouseenter", this.move);
	/*jQuery(this.titleContainerSelector).bind("mouseenter", function(event) {
		that.move(this);
//		jQuery.proxy(function(){
//			SNSComponent.prototype.move.call(that, this);
//		}, that)
	});*/
/*	jQuery(this.titleContainerSelector).bind("mouseenter", function() {
		SNSComponent.prototype.move.call(that, this);
	});
*/	
	// tab列表的滚动事件
	/*jQuery(this.scrollTopSelector).on("click", jQuery.proxy(function(){
		this.scrollTabList(SNS_DIRECTION.TOP);
	}, this));
	jQuery(this.scrollBottomSelector).on("click", jQuery.proxy(function(){
		this.scrollTabList(SNS_DIRECTION.BOTTOM);
	}, this));*/
}

/**
 * 根据联系人或者聊天室对象，获取对应的聊天Tab页对象
 * @param rosterOrChatRoom {SNSRoster|SNSChatRoom | JSJaCJID|String} 指定的联系人或者聊天室对象或者jid
 * @return {SNSTab}
 */
SNSChatWindow.prototype.getTab = function(rosterOrChatRoom) {
	if(rosterOrChatRoom.id)
		return this.tabs.get(rosterOrChatRoom.id);
	return this.tabs.get(rosterOrChatRoom);
};

/**
 * 返回当前活动的聊天窗口对应的联系人或者聊天室
 * @returns {SNSRoster|SNSChatRoom}
 */
SNSChatWindow.prototype.getActiveRoster = function() {
	var tab = this.getCurrentTab();
	if (tab) {
		if (tab instanceof SNSChatRoomChatTab) {
			return tab.chatroom;
		} else if(tab instanceof SNSPublicRosterChatTab){
			return tab.publicRoster;
		}else{
			return tab.roster;
		}
	}
};

/**
 * 可与陌生人聊天 rongqb 20160428
 * @param {Object} roster {
 * 	id: String, //必选，联系人id,查不到时默认创建
 *  name:String, //可选
 * }
 * @param {Object} type
 */
SNSChatWindow.prototype.chatWithAnyRoster = function(arg){
	if(!!arg && arg.id){
		this.queryRosterIng = this.queryRosterIng || {};
		if(this.queryRosterIng[arg.id]) return;
		this.queryRosterIng[arg.id] = true;
		var roster = new SNSRoster(arg.id);
		
		var user = SNSApplication.getInstance().getUser();
		user.addRoster(roster,true);
		
		var that = this;
		YYIMChat.getVCard({
			id: roster.id,
			success:function(vcard){
				roster.setVCard(new SNSVCard(vcard));
				roster.name = vcard.nickname ||  arg.id;
				roster.photo = vcard.photo;
				roster.queryed = true;
				that.queryRosterIng[arg.id] = false;
				SNSIMWindow.getInstance().getChatWindow().openChatWithOld(arg.id);
			}
		});
	}
};

/**
 * 打开指定联系人或者聊天室的对话Tab, 如果聊天窗口最小化或者隐藏，也会恢复显示
 * @param roster {SNSRoster|SNSChatRoom}
 * rongqb 20160428
 */
SNSChatWindow.prototype.openChatWith = function(roster,name) {
	var rosterId,name;
	if(roster.id){
		rosterId = roster.id;
		name = roster.name || name;
	}else{
		rosterId = roster;
	}
		
	if(!rosterId) return;	
	
	var temp = SNSApplication.getInstance().getUser().getRosterOrChatRoom(rosterId);
	if(!!temp && (temp.name != temp.id || temp.queryed)){
		this.openChatWithOld(roster);
	}else{
		this.chatWithAnyRoster({
			id:rosterId,
			name:name
		});
	}
};

/**
 * 打开指定联系人或者聊天室的对话Tab, 如果聊天窗口最小化或者隐藏，也会恢复显示
 * @param roster {SNSRoster|SNSChatRoom}
 * version:old
 */
SNSChatWindow.prototype.openChatWithOld = function(roster) {
	
	var rosterId;
	if(roster.id)
		rosterId = roster.id;
	else
		rosterId = roster;
		
	if(!rosterId || rosterId == 'undefined' || rosterId == YYIMChat.getUserID()) return;	
	
	var tab = this.getTab(rosterId);
	if (!tab) {
		if (typeof roster == "string") {
			roster = SNSApplication.getInstance().getUser().getRosterOrChatRoom(roster);
			if (!roster) {
				throw "invalid roster";
			}
		}
		tab = this._addNewChat(roster);
	}
	
	if (this.getCurrentTab() != tab) {
		
		var old = this.getCurrentTab();
		
		this.changeTabTo(tab);
		// 更换当前聊天人的头像
		this.updateTitle(old, tab);
	}
	
	this._renderUnreadMessage(roster);
	SNSIMWindow.getInstance().getUnreadMessagePanel().removeUnreadMessage(rosterId);

	if (!this.visible()) {
		this.show();
		window.localStorage && window.localStorage.setItem(YYIMChat.getUserNode() + '_isChatClosed', ''); 
	}
	
	setTimeout(function(){jQuery('#snsim_sendbox_content').focus();},0);
	
};

SNSChatWindow.prototype.onTabChange = function(oldTab, newTab) {
	newTab.removeMsgRemind();// 取消未读消息闪烁
	this.updateTitle(oldTab, newTab);// 更新聊天窗口的头像（左上角）
	SNSApplication.getInstance().getGlobalEventManager().trigger(SNS_EVENT_SUBJECT.ON_CURRENT_CHAT_CHANGE, [ {
		oldValue : oldTab,
		newValue : newTab
	} ]);
};

/**
 * 更新聊天窗口的头像
 * @param oldTab
 * @param newTab
 */
SNSChatWindow.prototype.updateTitle = function(oldTab, newTab){
	var roster = newTab.getTarget();
	jQuery(this.showChatroomMembersSelector).removeClass();
	if(roster instanceof SNSRoster){
		jQuery(this.showChatroomMembersSelector).addClass("snsim_current_session_roster");
	}else if(roster instanceof SNSChatRoom){
		jQuery(this.showChatroomMembersSelector).addClass("snsim_current_session_group");
	}else{
		jQuery(this.showChatroomMembersSelector).addClass("snsim_current_session_others");
	}
	this.getDom().find(this.currentChatPhotoSelector).attr("src",roster.getPhotoUrl());
	this.getDom().find(this.currentChatRosterNameSelector).text(roster.name)
	//currentChatRosterNameSelector
};

/**
 * 当聊天窗口从最小化或关闭状态打开时调佣
 * @Event afterShow
 */
SNSChatWindow.prototype.afterShow = function() {
	SNSIMWindow.getInstance().getMiniChatWindow().hide();
}

/**
 * 新建聊天Tab页
 * @param roster {SNSRoster|SNSChatRoom}联系人或者聊天室对象
 * @returns {SNSTab}
 */
SNSChatWindow.prototype._addNewChat = function(roster) {
	if (roster) {
		var tab;
		if (roster instanceof SNSPublicServiceRoster) {
			tab = new SNSPublicRosterChatTab(roster);
		} else if(roster instanceof SNSDeviceRoster) {
			tab = new SNSDeviceRosterChatTab(roster);
		} else if (roster instanceof SNSRoster) {
			tab = new SNSRosterChatTab(roster);
		} else if (roster instanceof SNSChatRoom) {
			tab = new SNSChatRoomChatTab(roster);
		} else if (roster instanceof SNSSystemRoster) {
			tab = new SNSSystemRosterChatTab(roster);
		} 
		if (tab) {
			this.addTab(tab);
			tab.scrollContent();
			this._bindTabHeadEvent(tab);
			return tab;
		}
	}
};

SNSChatWindow.prototype._renderUnreadMessage = function(roster){
	var messageArray =  SNSApplication.getInstance().getMessageInBox().popUnreadMessageByRoster(roster);
	if(messageArray){
		for(var i in messageArray){
			var msg = messageArray[i];
			if(msg && msg instanceof SNSInMessage){
				this.addMessage(msg);
			}
		}
	}
};

/**
 * 绑定聊天Tab页头部的点击切换和关闭按钮事件; 关闭tab页时， 若剩余tab页为0, 则关闭聊天窗口；若关闭tab为当前选中的，则从剩下的tab页中随机返回一个作为当前Tab
 * @param tab {SNSTab}
 */
SNSChatWindow.prototype._bindTabHeadEvent = function(tab) {
	// 点击关闭按钮
	tab.getCloseBtnDom().bind("click", {
		tab : tab
	}, jQuery.proxy(function(event) {
		event.data.tab.getHeadDom().remove();
		event.data.tab.getContentDom().remove();
		/**
		 * rongqb 20160423 删除同步操作
		 */
		if(event.data.tab.roster || event.data.tab.chatroom){
			if(!!window.localStorage){
				var key = YYIMChat.getUserNode() + '_tablist';
				var entity = event.data.tab.roster || event.data.tab.chatroom;
				
				var tabList = window.localStorage.getItem(key);
				try{
					tabList = JSON.parse(tabList);
				}catch(e){
				}
				tabList = tabList || [];
				
				if(tabList.indexOf(entity.id) > -1){
					tabList.splice(tabList.indexOf(entity.id),1);
				}
				window.localStorage.setItem(key, JSON.stringify(tabList));
				
				window.localStorage.setItem(YYIMChat.getUserNode() + '_closeId', entity.id);
			}
		}
		
		var next = this.removeTab(tab);
		if (this.tabs.size() == 0) {// 关闭最后一个tab
			this.hide();
		}
		
		if (next) {// 关闭当前打开的tab
			window.localStorage && window.localStorage.setItem(YYIMChat.getUserNode() + '_tabCurEntity', next.id);
			this.changeTabTo(next);
		}
		
		SNSApplication.getInstance().getGlobalEventManager().trigger(SNS_EVENT_SUBJECT.TAB_CLOSED, [tab]);
	}, this));
	// 鼠标悬浮显示关闭按钮
	tab.getHeadDom().bind("mouseenter",{tab:tab},function(event){
		if(!event.data.tab.getHeadDom().hasClass("snsim_active"))
			event.data.tab.getCloseBtnDom().css("display","block");
	});
	tab.getHeadDom().bind("mouseleave",{tab:tab},function(event){
		event.data.tab.getCloseBtnDom().css("display","none");
	});
};

SNSChatWindow.prototype.afterSendMessage = function(message){
	var recentList = SNSApplication.getInstance().getUser().recentList;
	recentList.addNew(message);
	
	SNSApplication.getInstance().getMessageInBox().filter.doFilter(message);
	SNSIMWindow.getInstance().getChatWindow().getTab(message.to).addMessage(message);
	
	if(message.type == 'groupchat') {
		try{
			jQuery('#snsim_tab_content_share_' + message.chatroom.getID()).find('.snsim_share_file_refresh_btn').click();
		}catch(e){
			YYIMChat.log('groupshare_refresh',1,message,e);
		}
	} 
};

/**
 * 
 * @param direction SNS_DIRECTION[TOP,RIGHT,BOTTOM,LEFT]
 */
SNSChatWindow.prototype.scrollTabList = function(direction){
	// 每个tab的高度
	var span = 59;
	// 最后一个tab的最大top坐标
	var lastTabMaxTop = this.getDom().find(this.scrollTopSelector).offset().top - span;
	if(direction == SNS_DIRECTION.TOP && this._headContainer.offset().top < 45){
		this._headContainer.offset({top:this._headContainer.offset().top+span});
	}else if(direction == SNS_DIRECTION.BOTTOM && lastTabMaxTop < this._headContainer.children().last().offset().top){
		this._headContainer.offset({top:this._headContainer.offset().top-span});
	}
};

/**
 * 变换聊天窗口的坐标，宽版和窄板的默认位置
 * @param transToWide
 */
SNSChatWindow.prototype.transPosition = function(transToWide){
	if(!this.useDefaultPosition)
		return;
	
	var left = jQuery(window).width() - this.getDom().width() - 44;
	var top = jQuery(window).height() - this.getDom().height() - 47;
	if (transToWide) {
		left -= SNSIMWindow.getInstance().getWideWindow().width;// wideWindow的宽度
	} else {
		left -= SNSIMWindow.getInstance().getNarrowWindow().width;// narrowWindow的宽度
	}
	jQuery(this.chatBoxSelector).css("top", top);
	jQuery(this.chatBoxSelector).css("left", left);
};

/**
 * 窗口移动
 * @param event
 */
/*SNSChatWindow.prototype.move = function(event){
	var _self = SNSIMWindow.getInstance().getChatWindow();
	
	var x,y;
	this.onmousedown = function(e){
		if(!_self.checkMouseDownPosition(e)){
			return;
		}
		jQuery(_self.transparentPanelSelector).show();
		if(!!e === false) {
			e = window.event;
		}
		e.preventDefault ? e.preventDefault() : e.returnValue = false;
		SNSChatWindow.drag = true;
		x = e.clientX;
		y = e.clientY;
		document.onmousemove = function(e){
			SNSIMWindow.getInstance().getChatWindow().useDefaultPosition = false;
			if(!!e === false) {
				e = window.event;
			}
			var deltaX = e.clientX - x;
			var deltaY = e.clientY - y;
			if(!SNSChatWindow.drag){
				deltaX = deltaY = 0;
				jQuery(SNSIMWindow.getInstance().getChatWindow().transparentPanelSelector).hide();
				return;
			}
			
			var chatBox = jQuery(SNSIMWindow.getInstance().getChatWindow().chatBoxSelector);
			// 到达左（右）边界并继续左（右）移
			if((chatBox.offset().left <= 0 && deltaX < 0) || (jQuery(window).width() - chatBox.width() <= chatBox.offset().left && deltaX > 0)){
				deltaX = 0;
			}else{
				x = e.clientX;
			}
			// 到达上边界并继续上移
			if(chatBox.offset().top <= 0 && deltaY < 0 || (jQuery(window).height() - chatBox.height() <= chatBox.offset().top && deltaY > 0)){
				deltaY = 0;
			}else{
				y = e.clientY;
			}
			chatBox.css("left", chatBox.offset().left + deltaX);
			chatBox.css("top", chatBox.offset().top + deltaY);
		};
	};
	document.onmouseup = function(){
		var chatBox = jQuery(SNSIMWindow.getInstance().getChatWindow().chatBoxSelector);
		var left = chatBox.offset().left,top = chatBox.offset().top;
		// 到达左（右）边界并继续左（右）移
		if( chatBox.offset().left < 0){
			left = 0;
		}else if(jQuery(window).width() - chatBox.width() < chatBox.offset().left){
			left = jQuery(window).width() - chatBox.width();
		}
		// 到达上边界并继续上移
		if(chatBox.offset().top < 0){
			top = 0;
		}else if( jQuery(window).height() - chatBox.height() < chatBox.offset().top){
			top = jQuery(window).height() - chatBox.height();
		}
		chatBox.css("left", left);
		chatBox.css("top", top);
		SNSChatWindow.drag = false;
		jQuery(SNSIMWindow.getInstance().getChatWindow().transparentPanelSelector).hide();
	};
};*/

/**
 * @override
 * 
 * 当前鼠标点击位置是否触发拖动
 * @param event
 * @returns {Boolean}
 */
SNSChatWindow.prototype.validateMovability = function(event){
	var idSelector;
	if(!!event && event.target) {
		idSelector = "#" + jQuery(event.target).attr("id");
	} else {
		idSelector = "#" + jQuery(window.event.srcElement).attr("id");
	}
	
	if(idSelector == this.miniBtnSelector || idSelector == this.closeBtnSelector || idSelector == this.showChatroomMembersSelector){
		return false;
	}
	return true;
};

/**
 * @override
 * 
 * 拖动的部分
 */
SNSChatWindow.prototype.getDragComponentSelector = function(){
	return SNSIMWindow.getInstance().getChatWindow().titleContainerSelector;
};

/**
 * @override
 * 
 * 移动的部分
 */
SNSChatWindow.prototype.getMoveComponentSelector = function(){
	return SNSIMWindow.getInstance().getChatWindow().chatBoxSelector;
};

/**
 * 窄版好友列表, 包含好友渲染等方法
 * @Class SNSNarrowWindow
 * @Singleton
 */
var SNSNarrowWindow = function() {
	this.selector = "#snsim_window_narrow";
	this.rosterContainerSelector = "#narrow_roster_container";
	this.rosterIdPrefix = "narrow_roster_";
	this.width;
	this.rosterTemplate = 
		'<li id="'+this.rosterIdPrefix +'##{{getID()}}" rosterId="##{{getID()}}" class="clearfix">' 
			+ '<div class="snsim_list_head snsim_head_30" style="padding:8px 8px 4px 8px;">'
				+ '<span class="head_pic">' 
					+ '<img class="snsim_roster_photo snsim_user_item_img" rosterId="##{{getID()}}" src="##{{getPhotoUrl()}}" alt="##{{name}}" jid="##{{jid.getBareJID()}}" onerror="YYIMChat.defaultImg(this)">'
				+ '</span>' 
				+ '<span node-type="statusNode" class="snsim_roster_presence W_chat_stat snsim_##{{presence.status}}"></span>'
			+ '</div>' 
		+ '</li>';
}

SNSNarrowWindow.prototype = new SNSWindow();

/**
 * 绑定全局事件AFTER_LOAD_ROSTER, 此类的入口
 * @private
 */
SNSNarrowWindow.prototype._init = function() {
	this.width = this.getDom().width();
	// 滚动条
	jQuery(this.rosterContainerSelector).parent().perfectScrollbar({suppressScrollX:true,setOffsetRight:true,offsetRight:0});
	SNSApplication.getInstance().getGlobalEventManager().registerEventHandler(SNS_EVENT_SUBJECT.AFTER_LOAD_ROSTER, false,
		function(data) {
			this.renderRosterList();
		}, 
	this);

};

/**
 * 根据user中的好友列表， 根据在线状态顺序渲染好友
 */
SNSNarrowWindow.prototype.renderRosterList = function() {
	var rosters = SNSApplication.getInstance().getUser().rosterList.sortByStatus();
	var container = jQuery(this.rosterContainerSelector);
	container.empty();
	for ( var i = 0; i < rosters.length; i++) {
		var roster = rosters[i];
		if (roster && roster instanceof SNSRoster) {
			this.addRoster(roster);
		}
	}
};

/**
 * 渲染好友的头像
 * @param roster {SNSRoster}
 */
SNSNarrowWindow.prototype.renderRosterPhoto = function(roster) {
	jQuery("li[id$='" + roster.getID() + "'] img.snsim_roster_photo").attr("src", roster.vcard.getPhotoUrl());
}

/**
 * 渲染指定的好友
 * @param roster {SNSRoster}
 */
SNSNarrowWindow.prototype.addRoster = function(roster) {
	var html = TemplateUtil.genHtml(this.rosterTemplate, roster);
	var container = jQuery(this.rosterContainerSelector);
	container.append(html);
	this._bindRosterClickEvent(roster);
	
	//roster.whenVCardDone(this, this.renderRosterPhoto, [ roster ]);
};

/**
 * 绑定好友列表条目的事件, 如展示浮动窗口， 单击事件
 * @param roster {SNSRoster}
 */
SNSNarrowWindow.prototype._bindRosterClickEvent = function(roster) {
	var rosterDoms = this.getDom().find("li#narrow_roster_" + roster.getID());
	rosterDoms.bind("click", {
		roster : roster
	}, function(event) {
		SNSIMWindow.getInstance().getChatWindow().openChatWith(event.data.roster);
	});
	
	//鼠标移到头像上， 展示VCard
	this.getDom().find(".snsim_roster_photo[rosterId='" + roster.getID() + "']").bind("mouseover",{roster:roster}, function(event){
		var roster = event.data.roster;
		var vcardPanel = SNSVCardPanel.getInstance(roster);
		vcardPanel.mouseover = true;
		vcardPanel.show(event.target);
	});
	
	//鼠标移出到头像外, 隐藏VCard
	this.getDom().find(".snsim_roster_photo[rosterId='" + roster.getID() + "']").bind("mouseout",{roster:roster}, function(event){
		var roster = event.data.roster;
		var vcardPanel = SNSVCardPanel.getInstance(roster);
		vcardPanel.mouseover = false;
		setTimeout(function(){
			if(!vcardPanel.mouseover){
				vcardPanel.hide();
			}
		},200);
	});
};

var SNSRecentTab = function() {
	this.name = "recent";
	this.headSelector = "#snsim_tab_recent_head";
	this.contentSelector = "#snsim_tab_recent_content";
	this.containerSelector = "#snsim_tab_recent_container";

	this.rosterTemplate = 
		'<li id="snsim_tab_recent_roster_##{{getID()}}" class="snsim_recent_roster_item clearfix sns_roster_list_wide_item">'
	    	+'<div class="snsim_list_head webim_head_30 sns_roster_list_wide_head">'
	          		+'<span class="head_pic">'
	          			+'<img width="31" height="31" src="##{{getPhotoUrl()}}" class="snsim_user_item_img" onerror="YYIMChat.defaultImg(this)">'
	          		+'</span>'
	          		+'<span class="snsim_roster_presence W_chat_stat snsim_##{{presence.status}}"></span>'
	          		+'<span class="WBIM_icon_new" node-type="snsNewMsgIcon"></span>'
	      +'</div>'
	      +'<div class="snsim_list_name">'
	      		+'<span class="user_name" title="##{{name}}">##{{name}}</span>'
			+'</div>'
		+'</li>';
	
	this.headTemplate = 
		'<li title="最近联系人" id="snsim_tab_recent_head" class="snsim_tab_head snsim_tab_recent_head clearfix">'
	        +'<a href="javascript:void(0);">'
	        	+'<span class=" snsim_icon_tab snsim_icontab_last"></span>'
	        +'</a>'
        +'</li>';
	
	this.contentTemplate = 
		'<div id="snsim_tab_recent_content" class="snsim_tab_content snsim_tab_recent_content snsRecentsScroll">'
	        +'<div class="snsim_list_con">'
		        +'<div class="list_box clearfix">'
			        +'<div class="list_content">'
				        +'<ul id="snsim_tab_recent_container" class="list_content_li">'
				        +'</ul>'
			        +'</div>'
		        +'</div>'
	        +'</div>'
        +'</div>';
};

SNSRecentTab.prototype = new SNSTab();

SNSRecentTab.prototype._init = function() {

	SNSApplication.getInstance().getGlobalEventManager().registerEventHandler(SNS_EVENT_SUBJECT.ADD_TO_RENCENT, false,
			this.updateRecent, this);

	var _self = this;
	jQuery(this.headSelector).bind("click", function() {
		SNSIMWindow.getInstance().getWideWindow().changeTabTo(_self);
	});
};



SNSRecentTab.prototype.updateRecent = function() {
	var recentList = SNSApplication.getInstance().getUser().recentList;
	var recent = recentList.getFirstItem();
	var dom = this.getContentDom().find("#snsim_tab_recent_roster_"+recent.id);
	
	var container = jQuery(this.containerSelector);
	if(dom.length>0){
		container.prepend(dom);
	}else{
		var that = this;
		that.queryRosterIng = that.queryRosterIng || {};
		if(!!that.queryRosterIng[recent.id]) return;
		var roster = SNSApplication.getInstance().getUser().getRosterOrChatRoom(recent.id);
		if(!roster || !roster.name || roster.name == roster.id){
			roster = new SNSRoster(recent.id);
			var user = SNSApplication.getInstance().getUser();
			user.addRoster(roster,true);
		
			that.queryRosterIng[roster.id] = true;
			YYIMChat.getVCard({
				id: roster.id,
				success:function(vcard){
					roster.setVCard(new SNSVCard(vcard));
					roster.name = vcard.nickname || roster.id;
					roster.photo = vcard.photo;
					roster.queryed = true;
					that.queryRosterIng[roster.id] = false;
					
					jQuery('#snsim_tab_recent_roster_'+roster.id).find('.user_name').html(roster.name);
					jQuery('#snsim_tab_recent_roster_'+roster.id).find('.snsim_user_item_img').attr('src',roster.getPhotoUrl());
				}
			});
			
			var html = TemplateUtil.genHtml(that.rosterTemplate, [SNSApplication.getInstance().getUser().getRosterOrChatRoom(recent.id),recent.message]);
			container.prepend(html);
			that._bindRosterDomEvent(recent);
			
			var items = that.getContentDom().find("li[id^='snsim_tab_recent_roster_']");
			if(items.length>SNSConfig.RECENT.MAX_SIZE){
				that.getContentDom().find("li[id^='snsim_tab_recent_roster_']:last").remove();
			}
		}else{
			var html = TemplateUtil.genHtml(this.rosterTemplate, [SNSApplication.getInstance().getUser().getRosterOrChatRoom(recent.id),recent.message]);
			container.prepend(html);
			this._bindRosterDomEvent(recent);
			
			var items = this.getContentDom().find("li[id^='snsim_tab_recent_roster_']");
			if(items.length>SNSConfig.RECENT.MAX_SIZE){
				this.getContentDom().find("li[id^='snsim_tab_recent_roster_']:last").remove();
			}
		}
	}

	
	
};

SNSRecentTab.prototype._bindRosterDomEvent =function(recent){
	this.getContentDom().find("#snsim_tab_recent_roster_"+recent.id).bind("click", {id:recent.id},function(event,id){
		SNSIMWindow.getInstance().getChatWindow().openChatWith(event.data.id);
	});
};

/**
 * 返回头部模板，用于屏蔽不同Tab的模板声明的不同
 * @returns {String}
 * @Abstract
 */
SNSRecentTab.prototype.getHeadTemplate = function(){
	return this.headTemplate;
};

/**
 * 返回内容模板，用于屏蔽不同Tab的模板声明的不同
 * @returns {String}
 * @Abstract
 */
SNSRecentTab.prototype.getContentTemplate = function(){
	return this.contentTemplate;
};

/**
 * 宽版窗口中显示联系人列表的tab页
 * @Class SNSRosterTab
 * @Singleton
 */
var SNSRosterTab = function() {
	this.name = "roster";
	this.selector = "#snsim_wide_tab_container";
	this.headSelector = "#snsim_tab_head_roster";
	this.contentSelector = "#snsim_tab_content_roster";
	this.groupContainerSelector = "#grouproster_container";
	
	this.operateBtnSelector = ".snsim_operation_panel_trigger_btn";
	this.unreadMsgNumSelector = ".snsim_unread_msg_num";
	
	this.currentOperationRoster;

	this.rosterTemplate = 
		'<li id="grouproster_##{{groupname}}_##{{id}}" groupname="##{{groupname}}" rosterId="##{{getID()}}" class="clearfix sns_roster_list_wide_item">'
			+ '<div class="snsim_list_head sns_roster_list_wide_head">'
				+ '<span class="head_pic">'
					+ '<img src="##{{getPhotoUrl()}}" rosterId="##{{getID()}}" class="snsim_roster_photo" onerror="YYIMChat.defaultImg(this)">'
				+ '</span>'
				+ '<span class="snsim_roster_presence W_chat_stat snsim_##{{presence.status}}"></span>'
				+ '<span class="WBIM_icon_new" node-type="snsNewMsgIcon"></span>'
			+ '</div>'
			+ '<div class="snsim_list_name">'
				+ '<span class="user_name" title="##{{name}}">##{{name}}</span>'
			+ '</div>'
			// 好友操作
			+ '<div style="float:right; margin: 16px 10px 0 0; cursor: pointer;">'
				+ '<a class="snsim_operation_panel_trigger_btn snsim_list_opt"></a>'
				+ '<span class="snsim_unread_msg_num">0</span>'
			+ '</div>'

			+ '<div>' 
				+ '<p class="sns_roster_list_wide_menu_btn" onclick="SNSRosterRender.showMemu()"></p>' 
			+ '</div>' 
		+ '</li>';

	this.groupTempalte = '<div id="' + SNSRosterTab.groupPrefixId + '##{{name}}" class="list_box list_box_unfold clearfix">'
			+ '<div id="title_container_##{{name}}" class="list_title">' + ' <p class="title_cate">'
			+ '<a class="list_title_a" href="javascript:void(0);" title="##{{name}}">' + ' <span class="sns_snsim_arrow">' + '</span>'
			+ '<span id="title_node_##{{name}}">##{{name}}</span>(<span id="online_count_##{{name}}">0/0</span>)' + '</a>' + '</p>' + '</div>'
			+ '<div class="list_content">' + '<ul id="list_content_##{{name}}" class="list_content_li">' + '</ul>' + '</div>' + '</div>';
};
SNSRosterTab.groupPrefixId = "snsim_tab_roster_group_";
SNSRosterTab.prototype = new SNSTab();

/**
 * 初始化本对象，包括添加默认未分组, tab标签的单击事件
 */
SNSRosterTab.prototype._init = function() {

	this._addGroupNone();
	SNSApplication.getInstance().getGlobalEventManager().registerEventHandler(SNS_EVENT_SUBJECT.ON_ADD_ROSTER, false, function(data) {
		this.addRoster(data.newValue);
	}, this);
	SNSApplication.getInstance().getGlobalEventManager().registerEventHandler(SNS_EVENT_SUBJECT.ON_REMOVE_ROSTER, false, function(data) {
		this.removeRoster(data.roster);
	}, this);

	SNSApplication.getInstance().getGlobalEventManager().registerEventHandler(SNS_EVENT_SUBJECT.ON_ROSTER_PHOTO_CHANGE, false, function(data) {
		this.changeRosterPhoto(data.photo, data.rosterId);
	}, this);
	
	var _self = this;
	jQuery(this.headSelector).bind("click", function() {
//		jQuery(SNSIMWindow.getInstance().getChatWindow().showChatroomMembersSelector).hide();
		SNSIMWindow.getInstance().getWideWindow().changeTabTo(_self);
	});

};

/**
 * 添加默认分组到Dom节点中
 * @returns {jQueryDom} 默认分组的Dom节点
 */
SNSRosterTab.prototype._addGroupNone = function() {
	var groupNone = SNSApplication.getInstance().getUser().groupList.groupNone;
	return this.addGroup(groupNone);
};

/**
 * 将满足条件的联系人渲染到界面列表中， 若好友存在多个分组，则依次渲染每个分组 条件主要指订阅关系，只有被订阅的联系人会被显示， 即从用户角度看，订阅关系为BOTH或者TO
 * @param roster {SNSRoster}
 */
SNSRosterTab.prototype.addRoster = function(roster) {
	if (roster && roster instanceof SNSRoster) {
		if ((roster.subscription == SNS_SUBSCRIBE.BOTH || roster.subscription == SNS_SUBSCRIBE.TO)) {

			if (roster.groups.length > 0) {
				for (var i = 0; i < roster.groups.length; i++) {
					this.addRosterToGroup(roster, roster.groups[i]);
				}
			} else {
				var groupNone = SNSApplication.getInstance().getUser().groupList.groupNone;

				this.addRosterToGroup(roster, groupNone);
			}
			//roster.whenVCardDone(this, this.renderRosterPhoto, [ roster ]);
			this.updateGroupsInfo();
		}
	}
};

/**
 * 在界面上从指定组中移除好友
 * @param roster {SNSRoster}
 * @param group {SNSGroup}
 */
SNSRosterTab.prototype.removeRosterFromGroup = function(roster, group) {
	var groupDom = this.addGroup(group);
	var rosterDom = groupDom.find("li[rosterId='" + roster.getID() + "']");
	rosterDom.remove();
	this.updateGroupsInfo();
};

/**
 * 在界面上从所有组中移除好友
 * @param roster {SNSRoster}
 */
SNSRosterTab.prototype.removeRoster = function(roster) {
	if(roster.subscription == SNS_SUBSCRIBE.NONE){
		var rosterDom = this.getDom().find("li[rosterId='" + roster.getID() + "']");
		if(rosterDom.length > 0)
			rosterDom.remove();
		
		var tab = SNSIMWindow.getInstance().getChatWindow().getTab(roster);
		if(tab)
			tab.getCloseBtnDom().trigger("click");
		return;
	}
	
	YYIMChat.deleteRosterItem({
		id: roster.getID(),
		success: jQuery.proxy(function(rosterId){
			var roster = SNSApplication.getInstance().getUser().getRosterOrChatRoom(rosterId);
			SNSApplication.getInstance().getUser().removeRosterFromLocal(roster);
			var rosterDom = this.getDom().find("li[rosterId='" + roster.getID() + "']");
			if(rosterDom.length > 0)
				rosterDom.remove();
			
			var tab = SNSIMWindow.getInstance().getChatWindow().getTab(roster);
			if(tab)
				tab.getCloseBtnDom().trigger("click");
		},this)
	});
	this.updateGroupsInfo();
};

/**
 * 修改备注
 * @param roster
 */
SNSRosterTab.prototype.renameRoster = function(roster) {
	var self = this;
	jQuery.when(roster.update()).done(function() {
		var $nameText = self.getDom().find("li[rosterId='" + roster.getID() + "'] .user_name");
		if (roster.name) {
			$nameText.text(roster.name);
		}else{
			$nameText.text(roster.getID());
		}
	});
};

/**
 * 向界面上添加指定好友到分组
 * @param roster {SNSRoster}
 * @param group {SNSGroup}
 */
SNSRosterTab.prototype.addRosterToGroup = function(roster, group) {
	if (this.isRosterInGroup(roster, group)) {
		return;
	}

	var groupDom = this.addGroup(group);

	var html = TemplateUtil.genHtml(this.rosterTemplate, [ roster, {
		groupname : group.name
	} ]);

	var container = jQuery("#list_content_" + group.name);
	container.append(html);
	
	this._bindRosterEvent(roster, group);
	this.updateGroupsInfo();
};

/**
 * 将好友在组之间进行移动
 * @param roster {SNSRoster}
 * @param srcGroup {SNSGroup}
 * @param targetGroup {SNSGroup}
 */
SNSRosterTab.prototype.moveRosterBetweenGroups = function(roster, srcGroup, targetGroup) {
	var srcDom = this.addGroup(srcGroup);
	var rosterDom = srcDom.find("li[rosterId='" + roster.getID() + "']");
	
	var targetDom  = this.addGroup(targetGroup);
	
	rosterDom.appendTo( jQuery("#list_content_" + targetGroup.name));
	
	rosterDom.attr("groupname", targetGroup.name);
	rosterDom.attr("id", rosterDom.attr("id").replace("_"+srcGroup.name+"_", "_"+targetGroup.name+"_"));
	this.updateGroupsInfo();
};

/**
 * 渲染联系人的头像
 * @param roster {SNSRoster}
 */
SNSRosterTab.prototype.renderRosterPhoto = function(roster) {
	if (roster.vcard.hasPhoto()) {
		jQuery("li[id$='" + roster.getID() + "'] img.snsim_roster_photo").attr("src", roster.getPhotoUrl());
	}
};

/**
 * 绑定联系人列表的事件， 如单击， mouseover等
 * @param roster {SNSRoster}
 * @param group {SNSGroup}
 */
SNSRosterTab.prototype._bindRosterEvent = function(roster, group) {
	var rosterDoms = this.getDom().find("li[id$='"+group.name+"_" + roster.getID() + "']");

	// 单击联系人条目， 打开聊天窗口
	rosterDoms.bind("click", {
		roster : roster
	}, function(event) {
		SNSIMWindow.getInstance().getChatWindow().openChatWith(event.data.roster);
	});

	// 鼠标悬浮如有未读消息则隐藏操作按钮
	rosterDoms.bind("mouseenter", jQuery.proxy(function(e){
		if(jQuery(e.currentTarget).find(this.unreadMsgNumSelector).is(":visible")){
			jQuery(e.currentTarget).find(this.operateBtnSelector).hide();
		}else{
			var rosterId = jQuery(e.currentTarget).attr("rosterId");
			var curRoster = SNSApplication.getInstance().getUser().getRosterOrChatRoom(rosterId);
			if(curRoster && curRoster instanceof SNSDeviceRoster){
				jQuery(e.currentTarget).find(this.operateBtnSelector).hide();
				return;
			}
			jQuery(e.currentTarget).find(this.operateBtnSelector).show();
		}
	},this));
	// 鼠标离开列表则隐藏操作按钮
	rosterDoms.bind("mouseleave", jQuery.proxy(function(e){
		jQuery(e.currentTarget).find(this.operateBtnSelector).hide();
	},this));
	
	// 打开操作面板
	rosterDoms.find(this.operateBtnSelector).bind("click", function(event) {
		var panel = SNSIMWindow.getInstance().getRosterOperationPanel();
		panel.attachDom(event.target);
		panel.show();
		event.stopPropagation();
	});

	// 鼠标移到头像上， 展示VCard
	this.getDom().find(".snsim_roster_photo[rosterId='" + roster.getID() + "']").bind("mouseover", function(event) {
		var rosterId = jQuery(this).attr("rosterId");
		var roster = SNSApplication.getInstance().getUser().getRoster(rosterId);
		if(roster && roster instanceof SNSRoster){
			var vcardPanel = SNSVCardPanel.getInstance(rosterId);
			vcardPanel.mouseover = true;
			vcardPanel.show(event.target);
		}
	});

	// 鼠标移出到头像外, 隐藏VCard
	this.getDom().find(".snsim_roster_photo[rosterId='" + roster.getID() + "']").bind("mouseout", function(event) {
		var rosterId = jQuery(this).attr("rosterId");
		var roster = SNSApplication.getInstance().getUser().getRoster(rosterId);
		if(roster && roster instanceof SNSRoster){
			var vcardPanel = SNSVCardPanel.getInstance(rosterId);
			vcardPanel.mouseover = false;
			setTimeout(function() {
				if (!vcardPanel.mouseover) {
					vcardPanel.hide();
				}
			}, 200);
		}
	});
};

/**
 * 添加指定的分组到界面.
 * @param group {SNSGroup}
 * @returns {jQueryDom}
 */
SNSRosterTab.prototype.addGroup = function(group) {
	//把公共账号去掉的临时不靠谱方法
	if(group.name == '公共账号'){
		return;
	}
	if (group && group instanceof SNSGroup) {
		var groupDom = this.getGroupDom(group);
		if (!groupDom) {
			var html = TemplateUtil.genHtml(this.groupTempalte, [ group ]);
			var container = this.getDom().find(this.groupContainerSelector);
			container.append(html);
			return this._bindGroupFoldEvent(group);
		}
		return groupDom;
	}
	throw "invalid group, shoud be instanceof SNSGroup";
};

/**
 * 绑定分组的收起/展开事件
 * @param group {SNSGroup}
 * @returns {jQueryDom}
 */
SNSRosterTab.prototype._bindGroupFoldEvent = function(group) {
	var groupDom = this.getGroupDom(group).find("a.list_title_a");
	groupDom?groupDom.bind("click", function(event) {
		var _self = jQuery(this).parents("#snsim_tab_roster_group_" + group.name);
		if (_self.hasClass("list_box_fold")) {
			_self.removeClass("list_box_fold");
			_self.addClass("list_box_unfold");
		} else {
			_self.removeClass("list_box_unfold");
			_self.addClass("list_box_fold");
		}
		event.stopPropagation();
	}):null;
	return groupDom;
};

SNSRosterTab.prototype.getGroupDom = function(group) {

	var groupDom = this.getDom().find("#snsim_tab_roster_group_" + group.name);
	if (groupDom.length != 0) {
		return jQuery(groupDom[0]);
	}
};

/**
 * 指定好友是否已经在分组中显示
 * @param roster {SNSRoster}
 * @param group {SNSGroup}
 * @returns {Boolean} true表示已经渲染
 */
SNSRosterTab.prototype.isRosterInGroup = function(roster, group) {
	var groupDom = this.addGroup(group);

	var rosterDom = groupDom.find("li[rosterid='" + roster.id + "']");

	if (rosterDom.length > 0) {
		return true;// 该组已经拥有该好友
	}
};

/**
 * 显示未读消息数目
 * @param roster
 * @param num
 */
SNSRosterTab.prototype.renderUnreadMsgNum = function(roster, num){
	var rosterDoms = this.getDom().find("li[rosterId='" + roster.getID() + "']");
	if(roster instanceof SNSDeviceRoster){
		// rosterDoms = this.getDom().find("li[jid='" + roster.jid.toString() + "']");
	}
	rosterDoms.find(this.unreadMsgNumSelector).text(num);
	rosterDoms.find(this.unreadMsgNumSelector).show();
};

/**
 * 隐藏未读消息数目
 * @param roster
 */
SNSRosterTab.prototype.clearUnreadMsgNum = function(roster){
	this.getDom().find("li[rosterId='" + roster.getID() + "']").find(this.unreadMsgNumSelector).hide();
	// this.getDom().find("li[jid='" + roster.jid.toString() + "']").find(this.unreadMsgNumSelector).hide();
};

/**
 * 更新组内在线人数/总人数
 */
SNSRosterTab.prototype.updateGroupsInfo = function(){
	// 更新分组人数
	var rosterTab = SNSIMWindow.getInstance().getWideWindow().getTab("roster");
	var groups = SNSApplication.getInstance().getUser().groupList._list;
	for(var item in groups){
		rosterTab.getDom().find("#online_count_" + item).text(groups[item].getOnlineNumber() + "/" + groups[item].size());
	}
};

SNSRosterTab.prototype.changeRosterPhoto = function(photo, rosterId) {
	var rosterDom = this.getDom().find("li[rosterId='" + rosterId + "']");
	rosterDom.find('img[rosterid=' + rosterId + ']').attr('src', YYIMChat.getFileUrl(photo));
};
var SNSWideWindow = function() {
	this.selector = "#snsim_window_wide";
	
	this.headContainerSelector = "#snsim_wide_tab_head_container ul.tab_list";
	
	this.contentContainerSelector = "#snsim_wide_tab_content_container";
	this.width;
}

SNSWideWindow.prototype = new SNSTabContainer();

SNSWideWindow.prototype._init = function(){
	this.width = this.getDom().width();
	this.addTab(new SNSRosterTab());
	this.addTab(new SNSChatRoomTab());
	this.addTab(new SNSRecentTab());
};

/*SNSWideWindow.prototype.onTabChange = function(oldTab, newTab){
	if(newTab instanceof SNSChatRoomTab){
		var user = SNSApplication.getInstance().getUser();
		if(user.chatRoomList.size()==0){
			user.chatRoomList.queryChatRoom();
		}
	}
};*/
/**
 * 聊天输入框的
 */
var SNSSendBox = function() {

	this._unCompleteMessage = new Object();
	
	this.selector = "#snsim_chat_sendbox";
	this.contentDomSelector = "#snsim_sendbox_content";
	this.characterCounterSelector = "#snsim_sendbox_available_num";
	this.sendBtnSelector = "#snsim_message_send_btn";
	
	this.expressionPattern = /<img[\w\W]+?node-type=\"expression\"[\w\W]+?>/ig;
	this.characterExceedClass = "snsim_message_character_exceed";
	
	
	this._init();
};

SNSSendBox.prototype = new SNSComponent();

SNSSendBox.prototype._init = function(){
	this._bindPasteEvent();
	this._bindSendEvent();
};

SNSSendBox.prototype._bindSendEvent = function(){
	var self = this;
	jQuery(this.sendBtnSelector).on("click",jQuery.proxy( this.send, this));
	jQuery(this.contentDomSelector).on('keydown', function(e){
		if(e.keyCode == SNS_KEY_CODE.ENTER){
			self.send();
			e.preventDefault();
		}
	});
	jQuery(this.contentDomSelector).on('keyup', function(e){
		if (self.getContentLength() > SNSConfig.MESSAGE.MAX_CHARACHER) {
			alert('消息超出长度限制');
			e.preventDefault();
		}else {
			self.updateContentLength();
		}
	});
};

SNSSendBox.prototype.send = function(){
	if(!this.getContent())
		return;
	if(this.getContentLength() > SNSConfig.MESSAGE.MAX_CHARACHER) {
		alert('消息超出长度限制');
		return;
	}
	
	var type = SNS_CHAT_TYPE.CHAT;
	var toRoster = SNSIMWindow.getInstance().getChatWindow().getActiveRoster();
	var to = toRoster.id;
	// public account
	if(toRoster instanceof SNSPublicAccountRoster){
		type = SNS_CHAT_TYPE.PUB_ACCOUNT;
		//to = toRoster.jid.getBareJID();
	}
	// room
	else if(toRoster instanceof SNSChatRoom){
		type = SNS_CHAT_TYPE.GROUP_CHAT;
		//to = toRoster.jid.getBareJID();
	}
	// device
	else if(toRoster instanceof SNSDeviceRoster){
		//to = toRoster.jid.toString();
	}
	var arg = {
		to: to,
		msg: this.getContent(),
		type: type,
		success: jQuery.proxy(function(msg){
			if(msg.type == 'groupchat'){
				this.clearContent();
				return;
			}
			
			var message = new SNSOutMessage(msg);
			message.setText(msg.body.content);
			
			if(arg.style){
				message.body.style = new SNSMessageStyle(arg.style.font, arg.style.size, arg.style.color, arg.style.biu);
			}
			var recentList = SNSApplication.getInstance().getUser().recentList;
			recentList.addNew(message);
			SNSApplication.getInstance().getMessageInBox().filter.doFilter(message);
			var curTab = SNSIMWindow.getInstance().getChatWindow().getTab(message.to);
			curTab.addMessage(message);
			//curTab.scrollToBottom();
			
			this.clearContent();
		},this)
	};
	
	if(toRoster.resource){
		arg.resource = toRoster.resource;
	}
	if(SNSMessageStyle.used)
		arg.style = SNSMessageStyle.getInstance();
	
	YYIMChat.sendTextMessage(arg);
};

SNSSendBox.prototype.getContent = function() {
	var _cont = this.getContentDom().html();
	//去除前后空格
	_cont = _cont.replace(/(^(\s|&nbsp;)*)|((\s|&nbsp;)*$)/g,'');
	return this.html_decode(SNSExpressionOutFilter.genContent(_cont));
};

SNSSendBox.prototype.getContentDom = function(){
	return  jQuery(this.contentDomSelector);
}

SNSSendBox.prototype.clearContent = function() {
	jQuery(this.contentDomSelector).empty();
	jQuery(this.characterCounterSelector).text(SNSConfig.MESSAGE.MAX_CHARACHER);
};

SNSSendBox.prototype.updateContentLength = function() {
	var dom = jQuery(this.characterCounterSelector);
	var availableNum = SNSConfig.MESSAGE.MAX_CHARACHER - this.getContentLength();
	dom.text(availableNum > 0? availableNum : 0);
	if (availableNum <= 0) {
		dom.addClass(this.characterExceedClass);
	} else {
		dom.removeClass(this.characterExceedClass);
	}
};

SNSSendBox.prototype.getContentLength = function() {
	return this.getContent().replace(this.expressionPattern, " ").length;
};

SNSSendBox.prototype._bindPasteEvent = function() {
	jQuery(this.contentDomSelector).bind("beforepaste paste", function(e) {
		var _this = jQuery(this);
		setTimeout(function() {
			// TODO SNSExpressionOutFilter
			_this.html(_this.html().replace(SNSExpressionOutFilter.pattern, "$1"));
			_this.html(_this.html().replace(/<[^<]*>/g, ''));
			_this.html(SNSExpressionInFilter.decode(_this.html()));
		}, 0);
	});
};

SNSSendBox.prototype.insertHtmlContent = function(html) {
	var dthis = jQuery(this.contentDomSelector);
	var sel, range;
	if (window.getSelection) { // IE9 and non-IE
		sel = window.getSelection();
		if (sel.getRangeAt && sel.rangeCount) {
			range = sel.getRangeAt(0);
			range.deleteContents();
			var el = document.createElement('div');
			el.innerHTML = html;
			var frag = document.createDocumentFragment(), node, lastNode;
			while ((node = el.firstChild)) {
				lastNode = frag.appendChild(node);
			}
			var parentElement = range.commonAncestorContainer.parentElement;
			if (parentElement && parentElement.contentEditable == "true") {
				range.insertNode(frag);
			} else {
				this.getContentDom().append(frag);
			}
			if (lastNode) {
				range = range.cloneRange();
				range.setStartAfter(lastNode);
				range.collapse(true);
				sel.removeAllRanges();
				sel.addRange(range);
			}
		}
	} else if (document.selection && document.selection.type != 'Control') {

		jQuery(dthis).focus(); // 在非标准浏览器中 要先让你需要插入html的div 获得焦点
		ierange = document.selection.createRange();// 获取光标位置
		ierange.pasteHTML(html); // 在光标位置插入html 如果只是插入text 则就是fus.text="..."
		jQuery(dthis).focus();

	}
	// 更新总字数

};

SNSSendBox.prototype.html_encode = function(str) {
	var s = "";
	if (str.length == 0)
		return "";
	s = str.replace(/&/g, "&gt;");
	s = s.replace(/</g, "&lt;");
	s = s.replace(/>/g, "&gt;");
	s = s.replace(/\s/g, "&nbsp;");
	s = s.replace(/\'/g, "&#39;");
	s = s.replace(/\"/g, "&quot;");
	s = s.replace(/\n/g, "<br>");
	return s;
};

SNSSendBox.prototype.html_decode = function(str) {
	var s = "";
	if (str.length == 0)
		return "";
	s = str.replace(/&gt;/g, "&");
	s = s.replace(/&lt;/g, "<");
	s = s.replace(/&gt;/g, ">");
	s = s.replace(/&nbsp;/g, " ");
	s = s.replace(/&#39;/g, "\'");
	s = s.replace(/&quot;/g, "\"");
	s = s.replace(/<br>/g, "\n");
	return s;
};
var SNSRosterChatTab = function(roster) {

	this.roster = roster;
	this.name = roster ? roster.id : "";

	this.closeable = true;

	this.lastMessageDateline = 0;

	this.headSelector = roster ? "#" + SNSRosterChatTab.headIdPrefix + roster.getID() : "";
	this.contentSelector = roster ? "#" + SNSRosterChatTab.contentIdPrefix + roster.getID() : "";

	/**
	 * 闪动的消息提醒的interval ID
	 * @type {Number}
	 */
	this.headTwinkleId;
	this.twinkling = false;

};

SNSRosterChatTab.headIdPrefix = "snsim_chat_window_roster_tab_head_";
SNSRosterChatTab.contentIdPrefix = "snsim_chat_window_roster_tab_content_";

SNSRosterChatTab.headTemplate = 
	'<li id="'+SNSRosterChatTab.headIdPrefix+'##{{roster.getID()}}" title="##{{roster.name}}" class="snsim_tab_head">'
	+'<div class="list_head_item">'
		+ '<div class="list_head_state">'
			+ '<span class="snsim_roster_presence W_chat_stat snsim_##{{roster.presence.status}}"></span>'
		+ '</div>'
		+ '<div class="snsim_username">##{{roster.name}}'
			+ '<span class="wbim_icon_vf"></span>'
		+ '</div>'
		+ '<a hidefloat="true" class="snsim_chat_window_tab_close_btn"></a>'
		+ '<span class="unread_msg_num">0</span>'
	+'</div>'
+ '</li>';

SNSRosterChatTab.contentTemplate = 
	'<div id="'+SNSRosterChatTab.contentIdPrefix+'##{{roster.getID()}}" class="snsim_tab_content snsim_dia_list">'
		+'<div class="sns_message_container cur">'
			+'<div class="snsim_message_box_container sns_message_panel"></div>'
		+'</div>'
	+ '</div>';

SNSRosterChatTab.prototype = new SNSTab();

SNSRosterChatTab.prototype._init = function(roster) {

};

/**
 * 消息框的滚动
 */
SNSRosterChatTab.prototype.scrollToTop = function(){
	this.getMessageContainer().scrollTop(0);
};

SNSRosterChatTab.prototype.scrollToBottom = function(){
	this.getMessageContainer().scrollTop(this.getMessageContainer()[0].scrollHeight + 300);
};

SNSRosterChatTab.prototype.scrollContent = function(){
	this.getMessageContainer().perfectScrollbar({suppressScrollX:true,wheelPropagation: true});
};

// 未区分子类的css选择器，都为sns_message_container
SNSRosterChatTab.prototype.getMessageContainer = function(){
	return this.getContentDom().find(".sns_message_container");
};

SNSRosterChatTab.prototype.getHeadTemplate = function() {
	return SNSRosterChatTab.headTemplate;
};

SNSRosterChatTab.prototype.getContentTemplate = function() {
	return SNSRosterChatTab.contentTemplate;
};

SNSRosterChatTab.prototype.getCloseBtnDom = function() {
	var btn = this.getHeadDom().find(".snsim_chat_window_tab_close_btn");
	if (btn.length > 0) {
		return btn;
	}
};

SNSRosterChatTab.prototype.addMsgRemind = function() {
	this.getHeadDom().find(".unread_msg_num").text(parseInt(this.getHeadDom().find(".unread_msg_num").text()) + 1);
	this.getHeadDom().addClass("snsim_active");
};

SNSRosterChatTab.prototype.removeMsgRemind = function() {
	this.getHeadDom().find(".unread_msg_num").text(0);
	this.getHeadDom().removeClass("snsim_active");
};

SNSRosterChatTab.prototype.addMessage = function(message) {
	var messageBox;
	if (message instanceof SNSOutMessage) {
		messageBox = new SNSSentMessageBox(message);
	} else {
		messageBox = new SNSReceivedMessageBox(message);
	}
	
	if(message.from && message.from.id == YYIMChat.getUserID()){
		messageBox = new SNSSentMessageBox(message);
	}else if(message.to && message.to.id == YYIMChat.getUserID()){
		messageBox = new SNSReceivedMessageBox(message);
	}
	
	var html = messageBox.getHtml();

	var container = this.getContentDom().find(".snsim_message_box_container");
	container.append(html);

	var dateline = message.body.dateline;

	if (dateline - this.lastMessageDateline < 1000 * 45) {
		messageBox.getDom().find(".dia_info").css("display", "none");
	}
	messageBox.show();
	this.scrollToBottom();
	
	this.lastMessageDateline = message.body.dateline;
};

SNSRosterChatTab.prototype.getTarget = function(){
	return this.roster;
};
var SNSChatRoomChatTab = function(chatroom) {
	
	this.name = chatroom.id;
	this.chatroom  = chatroom;
	this.tabContainer = new SNSInnerChatTabContainer(chatroom);
	
	this.closeable = true;
	
	this.headSelector = "#"+SNSChatRoomChatTab.headIdPrefix+chatroom.getID();
	this.contentSelector = "#"+SNSChatRoomChatTab.contentIdPrefix+chatroom.getID();
	
};

SNSChatRoomChatTab.headIdPrefix = "snsim_chat_window_inner_tab_head_";
SNSChatRoomChatTab.contentIdPrefix = "snsim_chat_window_inner_tab_content_";

SNSChatRoomChatTab.headTemplate = 
	'<li id="'+SNSChatRoomChatTab.headIdPrefix+'##{{chatroom.getID()}}" title="##{{chatroom.name}}" class="snsim_tab_head">'
	+'<div class="list_head_item">'
	+ '<div class="list_head_state" style="margin-left: 12px;margin-right: 2px;">'
		+ '<span class="snsim_roster_presence W_chat_stat snsim_chatroom"></span>'
	+ '</div>'
	+ '<div class="snsim_username">##{{chatroom.name}}'
		+ '<span class="wbim_icon_vf"></span>'
	+ '</div>'
	+ '<a hidefloat="true" class="snsim_chat_window_tab_close_btn"></a>'
	+'</div>'
+ '</li>';

SNSChatRoomChatTab.contentTemplate = 
	'<div id="'+SNSChatRoomChatTab.contentIdPrefix+'##{{chatroom.getID()}}"  class="snsim_tab_content snsim_tab_content_container snsim_dia_list snsim_dia_chatroom_list" >'
		+'<div class="snsim_tab sns_chat_inner_tab">'
			+'<ul class="snsim_tab_head_container tab_list clearfix">'
				+'<li id="snsim_tab_head_message_##{{chatroom.getID()}}" title="群消息" class="snsim_tab_head snsim_tab_head_message cur">'
					+'<a class="snsim_dia_chatroom_tab_head">'
						+'<span class="snsim_message_tab_icon"></span>'
						+'<span class="snsim_tab_title">群消息</span>'
					+' </a>'
				+'</li>'
//				+'<li id="snsim_tab_head_share_##{{chatroom.getID()}}" title="群共享" class="snsim_tab_head snsim_tab_head_share">'
//					+'<a class="snsim_dia_chatroom_tab_head">'
//						+'<span class="snsim_share_tab_icon"></span>'
//						+'<span class="snsim_tab_title">群共享</span>'
//					+'</a>'
//				+'</li>'
			+'</ul>'
		+'</div>'
		+'<div id="snsim_tab_content_message_##{{chatroom.getID()}}" class="snsim_tab_content snsim_tab_content_message sns_message_container cur">'
			+'<div class="snsim_message_box_container sns_message_panel"></div>'
		+'</div>'
		+'<div id="snsim_tab_content_share_##{{chatroom.getID()}}" class="snsim_tab_content snsim_tab_content_share sns_share_container">'
			+'<div class="sns_share_panel">'
				+'<div class="snsim_share_panel_head">'
					+'<span>共<span class="snsim_share_file_num">0</span>个文件</span>'
					+'<a id="snsim_share_file_refresh_btn" class="snsim_share_file_refresh_btn"><span class="refresh_icon"></span></a>'
				+'</div>'
				+ '<div id="snsim_sharefile_box" class="snsim_sharefile_box"><ul class="snsim_sharefile_container"></ul></div>'
			+'</div>'
		 +'</div>'
	+ '</div>';

SNSChatRoomChatTab.prototype = new SNSRosterChatTab();

SNSChatRoomChatTab.prototype._init = function (){
	YYIMChat.log("SNSChatRoomChatTab.prototype._init ",3);
	// console.info(this.tabContainer.tabs);
	this.tabContainer._init();
	
	var messageTab = new SNSInnerMessageTab(this.chatroom);
	this.tabContainer.addTab(messageTab);
	
	var shareTab = new SNSInnerShareTab(this.chatroom);
	this.tabContainer.addTab(shareTab);
	
	var appTab = new SNSInnerAppTab(this.chatroom);
	this.tabContainer.addTab(appTab);
	
};

SNSChatRoomChatTab.prototype.getHeadTemplate = function(){
	return SNSChatRoomChatTab.headTemplate;
};

SNSChatRoomChatTab.prototype.getContentTemplate= function(){
	return SNSChatRoomChatTab.contentTemplate;
};

SNSChatRoomChatTab.prototype.getTarget = function(){
	return this.chatroom;
};

var SNSDeviceRosterChatTab = function(roster) {

	this.roster = roster;
	this.name = roster ? roster.getID() : "";

	this.headSelector = roster ? "#" + SNSDeviceRosterChatTab.headIdPrefix + roster.getID() : "";
	this.contentSelector = roster ? "#" + SNSDeviceRosterChatTab.contentIdPrefix + roster.getID() : "";
};

SNSDeviceRosterChatTab.headIdPrefix = "snsim_chat_window_device_tab_head_";
SNSDeviceRosterChatTab.contentIdPrefix = "snsim_chat_window_device_tab_content_";

SNSDeviceRosterChatTab.headTemplate = 
	'<li id="'+SNSDeviceRosterChatTab.headIdPrefix+'##{{roster.getID()}}" title="##{{roster.name}}" class="snsim_tab_head">'
	+'<div class="list_head_item">'
		+ '<div class="list_head_state">'
			+ '<span class="snsim_roster_presence W_chat_stat snsim_##{{roster.presence.status}}"></span>'
		+ '</div>'
		+ '<div class="snsim_username">##{{roster.name}}'
			+ '<span class="wbim_icon_vf"></span>'
		+ '</div>'
		+ '<a hidefloat="true" class="snsim_chat_window_tab_close_btn"></a>'
	+'</div>'
+ '</li>';

SNSDeviceRosterChatTab.contentTemplate = 
	'<div id="'+SNSDeviceRosterChatTab.contentIdPrefix+'##{{roster.getID()}}" class="snsim_tab_content snsim_dia_list">'
		+'<div class="sns_message_container cur">'
			+'<div class="snsim_message_box_container sns_message_panel"></div>'
		+'</div>'
	+ '</div>';

SNSDeviceRosterChatTab.prototype = new SNSRosterChatTab();

SNSDeviceRosterChatTab.prototype.getHeadTemplate = function() {
	return SNSDeviceRosterChatTab.headTemplate;
};

SNSDeviceRosterChatTab.prototype.getContentTemplate = function() {
	return SNSDeviceRosterChatTab.contentTemplate;
};
var SNSIFrameChatTab = function(name, url){
	
	this.type = "iframeChatTab";
	
	this.name = name;
	this.url = url;
	
	this.headSelector  = "#"+SNSIFrameChatTab.idPrefix+"head_"+name;
	this.contentSelector = "#"+SNSIFrameChatTab.idPrefix+"content_"+name;
	
	this.iframePanel = new SNSIFrameFloatPanel(url, name, 410, 377);
	
	this.closeable = true;
	
};

SNSIFrameChatTab.idPrefix = "snsim_iframe_chat_tab_";

SNSIFrameChatTab.headTemplate = 
	'<li id="'+SNSIFrameChatTab.idPrefix+'head_##{{name}}" title="##{{name}}" class="snsim_tab_head">'
	+'<div class="list_head_item">'
	+ '<div class="list_head_state">'
		+ '<span class="snsim_roster_presence W_chat_stat snsim_##{{type}}"></span>'
	+ '</div>'
	+ '<div class="snsim_username">##{{name}}'
		+ '<span class="wbim_icon_vf"></span>'
	+ '</div>'
	+ '<a hidefloat="true" class="snsim_chat_window_tab_close_btn"></a>'
	+'</div>'
+ '</li>';

SNSIFrameChatTab.contentTemplate = 
	'<div id="'+SNSIFrameChatTab.idPrefix+'content_##{{name}}" class="snsim_tab_content snsim_dia_list">'
		+'<div class="sns_message_container cur">'
			+'##{{iframePanel.buildHtml()}}'
		+'</div>'
	+ '</div>';

SNSIFrameChatTab.prototype = new SNSRosterChatTab();

SNSIFrameChatTab.prototype.getHeadTemplate = function(){
	return SNSIFrameChatTab.headTemplate;
};

SNSIFrameChatTab.prototype.getContentTemplate= function(){
	return SNSIFrameChatTab.contentTemplate;
};
var SNSMiniChatWindow = function() {
	this.selector = "#snsim_chat_window_mini";
};

SNSMiniChatWindow.prototype = new SNSWindow();

SNSMiniChatWindow.prototype._init = function() {
	this.getDom().bind("click", function(){
		SNSIMWindow.getInstance()._toggleMiniChatWindow();
	});
};

SNSMiniChatWindow.prototype.beforeShow = function() {
	var roster = SNSIMWindow.getInstance().getChatWindow().getActiveRoster();
	this.setTitle(roster.name);
};

SNSMiniChatWindow.prototype.setTitle = function(title) {
	this.getDom().text(title);
};

var SNSPublicRosterChatTab = function(publicRoster) {
	
	this.name = publicRoster.jid.getBareJID();
	this.publicRoster  = publicRoster;
	this.tabContainer = new SNSInnerChatTabContainer(publicRoster);
	
	this.closeable = true;
	
	this.headSelector = "#"+SNSPublicRosterChatTab.headIdPrefix+publicRoster.getID();
	this.contentSelector = "#"+SNSPublicRosterChatTab.contentIdPrefix+publicRoster.getID();
	
};
SNSPublicRosterChatTab.prototype = new SNSRosterChatTab();

SNSPublicRosterChatTab.headIdPrefix = "snsim_chat_window_inner_tab_head_";
SNSPublicRosterChatTab.contentIdPrefix = "snsim_chat_window_inner_tab_content_";

SNSPublicRosterChatTab.headTemplate = 
	'<li id="'+SNSPublicRosterChatTab.headIdPrefix+'##{{publicRoster.getID()}}" title="##{{name}}" class="snsim_tab_head">'
	+'<div class="list_head_item">'
	+ '<div class="list_head_state">'
		+ '<span class="snsim_roster_presence W_chat_stat snsim_chatroom"></span>'
	+ '</div>'
	+ '<div class="snsim_username">##{{publicRoster.name}}'
		+ '<span class="wbim_icon_vf"></span>'
	+ '</div>'
	+ '<a hidefloat="true" class="snsim_chat_window_tab_close_btn"></a>'
	+'</div>'
+ '</li>';

SNSPublicRosterChatTab.contentTemplate = 
	'<div id="'+SNSPublicRosterChatTab.contentIdPrefix+'##{{publicRoster.getID()}}" jid="##{{publicRoster.jid.getBareJID()}}" class="snsim_tab_content snsim_tab_content_container snsim_dia_list snsim_dia_chatroom_list" >'
		+'<div class="snsim_tab sns_chat_inner_tab">'
			+'<ul class="snsim_tab_head_container tab_list clearfix">'
				+'<li id="snsim_tab_head_message_##{{publicRoster.getID()}}" title="流程消息" class="snsim_tab_head snsim_tab_head_message cur">'
					+'<a href="javascript:void(0);" class="process_tab">'
						+'<span class="snsim_icon_tab ">任务消息</span>'
					+' </a>'
				+'</li>'
				/*+'<li id="snsim_tab_head_share_##{{publicRoster.getID()}}" title="待办流程" class="snsim_tab_head snsim_tab_head_share">'
					+'<a href="javascript:void(0);">'
						+'<span class="snsim_icon_tab  ">待办</span>'
					+'</a>'
				+'</li>'*/
				/*+'<li id="snsim_tab_head_app_##{{publicRoster.getID()}}" title="已办流程" class="snsim_tab_head snsim_tab_head_app">'
					+'<a href="javascript:void(0);">'
						+'<span class="snsim_icon_tab ">已办</span>'
					+'</a>'
				+'</li>'*/
			+'</ul>'
		+'</div>'
		+'<div id="snsim_tab_content_message_##{{publicRoster.getID()}}" class="snsim_tab_content snsim_tab_content_message sns_message_container cur">'
			+'<div class="snsim_message_box_container sns_message_panel"></div>'
		+'</div>'
		/*+'<div id="snsim_tab_content_share_##{{publicRoster.getID()}}" class="snsim_tab_content snsim_tab_content_share sns_share_container">'
			+'<div class="sns_share_panel">'
				+'<div style="height: 22px; margin-top: 10px; border-bottom: 1px solid #d6d6d6;">'
					+'<a id="snsim_share_file_refresh_btn" class="snsim_share_file_refresh_btn" style="margin-left: 20px;">刷新</a>'
				+'</div>'
				+ '<ul class="snsim_sharefile_container"></ul>'
			+'</div>'
		 +'</div>'*/
		/* +'<div id="snsim_tab_content_app_##{{publicRoster.getID()}}" class="snsim_tab_content snsim_tab_content_app sns_app_container">'
		 	+'<div class="sns_photo_panel">sns_app_panel</div>'
	 	+'</div>'*/
	+ '</div>';

SNSPublicRosterChatTab.prototype = new SNSRosterChatTab();

SNSPublicRosterChatTab.prototype._init = function (){
	YYIMChat.log("SNSPublicRosterChatTab.prototype._init ",3);
	//console.info(this.tabContainer.tabs);
	this.tabContainer._init();
};

SNSPublicRosterChatTab.prototype.getHeadTemplate = function(){
	return SNSPublicRosterChatTab.headTemplate;
};

SNSPublicRosterChatTab.prototype.getContentTemplate= function(){
	return SNSPublicRosterChatTab.contentTemplate;
};

SNSPublicRosterChatTab.prototype.getTarget = function(){
	return this.publicRoster;
};

var SNSSystemRosterChatTab = function(roster) {
	this.roster = roster;
	this.name = roster ? roster.getID() : "";

	this.headSelector = roster ? "#" + SNSSystemRosterChatTab.headIdPrefix + roster.getID() : "";
	this.contentSelector = roster ? "#" + SNSSystemRosterChatTab.contentIdPrefix + roster.getID() : "";
};

SNSSystemRosterChatTab.headIdPrefix = "snsim_chat_window_system_tab_head_";
SNSSystemRosterChatTab.contentIdPrefix = "snsim_chat_window_system_tab_content_";

SNSSystemRosterChatTab.headTemplate = 
	'<li id="'+SNSSystemRosterChatTab.headIdPrefix+'##{{roster.getID()}}" title="##{{name}}" class="snsim_tab_head">'
	+'<div class="list_head_item">'
		+ '<div class="list_head_state">'
			+ '<span class="snsim_roster_presence W_chat_stat snsim_system_roster"></span>'
		+ '</div>'
		+ '<div class="snsim_username">##{{roster.name}}'
			+ '<span class="wbim_icon_vf"></span>'
		+ '</div>'
		+ '<a hidefloat="true" class="snsim_chat_window_tab_close_btn"></a>'
	+'</div>'
	+ '</li>';

SNSSystemRosterChatTab.contentTemplate = 
	'<div id="'+SNSSystemRosterChatTab.contentIdPrefix+'##{{roster.getID()}}" class="snsim_tab_content snsim_dia_list">'
		+'<div class="sns_message_container cur">'
			+'<div class="snsim_message_box_container sns_message_panel"></div>'
		+'</div>'
	+ '</div>';

SNSSystemRosterChatTab.prototype = new SNSRosterChatTab();

SNSSystemRosterChatTab.prototype.getHeadTemplate = function() {
	return SNSSystemRosterChatTab.headTemplate;
};

SNSSystemRosterChatTab.prototype.getContentTemplate = function() {
	return SNSSystemRosterChatTab.contentTemplate;
};
var SNSMessageBox = function(){
	this.message;
	this.selector;
};

SNSMessageBox.prototype = new SNSComponent();


SNSMessageBox.prototype.showSendFailed = function(){
	
};

SNSMessageBox.prototype.getHtml = function(){
	return TemplateUtil.genHtml(this.getTemplate(), this.message);
}

SNSMessageBox.prototype.getTemplate = function(){
	return "";
};

/**
 * 显示此节点
 * @param isInline {boolean} display是否为inline
 */
SNSMessageBox.prototype.show = function() {
	if (this.visible()) {
		this.afterShow();
		return;
	}
	var dom = this.getDom();

	this.beforeShow();

	dom.show("fast");

	this.afterShow();

};

SNSMessageBox.prototype.afterShow = function(){
	SNSApplication.getInstance().getGlobalEventManager().trigger(SNS_EVENT_SUBJECT.AFTER_MESSAGE_SHOW,[this.message]);
	YYIMChat.log("trigger", SNS_EVENT_SUBJECT.AFTER_MESSAGE_SHOW);
};
var SNSReceivedMessageBox = function(message){
	this.message;
	if(message && message instanceof SNSMessage){
		this.message = message;
	}else{
		throw "SNSReceivedMessageBox: Constructor: invalid param: message:"+message;
	}
	
	this.selector = "#"+SNSReceivedMessageBox.ID_PREFIX+message.id;
};

SNSReceivedMessageBox.ID_PREFIX = "snsim_message_box_received_";

SNSReceivedMessageBox.prototype = new SNSMessageBox();

SNSReceivedMessageBox.template = 
	'<div id="' + SNSReceivedMessageBox.ID_PREFIX + '##{{id}}" class="snsim_message_box_received snsim_dia_box snsim_dia_l">'
		+ '<div class="dia_info">'
			+ '<span class="info_date">##{{getHumanizeDateString()}}</span>'
		+ '</div>'
		+'<div style="margin:10px 0 0 10px;" class="clearfix">'
			+'<p style="color:#b3b3b3;">##{{getRoster().name}}</p>'
			+'<img style="border-radius:30px; width:35px;height:35px;float:left;" src="##{{getRoster().getPhotoUrl()}}"/>'
			+ '<div class="snsim_dia_bg">'
				+ '<div class="dia_txt">##{{getBodyHtml()}}</div>'
				+ '<div class="msg_arr"></div>'
			+'</div>'
		+'</div>'
	+ '</div>';

SNSReceivedMessageBox.prototype.getTemplate = function(){
	return SNSReceivedMessageBox.template;
}

var SNSSentMessageBox = function(message){
	this.message;
	if(message && message instanceof SNSMessage){
		this.message = message;
	}else{
		throw "SNSReceivedMessageBox: Constructor: invalid param: message:"+message;
	}
	
	this.selector = "#snsim_message_box_sent_"+message.id;
};

SNSSentMessageBox.prototype = new SNSMessageBox();

SNSSentMessageBox.template = 
	'<div id="snsim_message_box_sent_##{{id}}" style="margin:10px 0 0 0" class="nsim_message_box_sent snsim_dia_box snsim_dia_r clearfix">'
	+'<div class="dia_info">'
		+'<span class="info_date" action-data="##{{body.dateline}}">##{{getHumanizeDateString()}}</span>'
	+'</div>'
//	+'<div style="float:right; margin:18px 0 0 12px;">'
//		+'<img height="36px" style="border-radius:30px" src="##{{SNSApplication.getInstance().getUser().vcard.getPhotoUrl()}}"/>'
//	+'</div>'
	+'<div class="snsim_dia_bg W_fr">'
		+'<div class="dia_con">'
			+'<div class="dia_txt">##{{getBodyHtml()}}</div>'
		+'</div>'
		+'<div class="msg_arr"></div>'
	+'</div>'
	+'<div class="sns_message_status W_fr" style="top: 26px; position: relative;"></div>'
+'</div>';

SNSSentMessageBox.prototype.getTemplate = function(){
	return SNSSentMessageBox.template;
}
var SNSUnreadMessagePanel = function(){
	this.selector = "#snsim_unread_message_panel";
	this.containerSelector = this.selector+ " ul";
	
	this.ignoreAllBtnSelector = "#ignore_all";
	this.checkAllBtnSelector = "#check_all";
	
	this.indicator = "#snsim_unread_message_indicator";
	
	this.messageTemplate =
  		'<li rosterId="##{{getRosterOrChatRoom().getID()}}" style="cursor: pointer;">'
			+ '<div class="name_content">'
				+ '<div style="display:block;margin-top: 12px;">##{{getRosterOrChatRoom().name}}</div>'
				+ '<div class="remind_message_content">##{{body.content}}</div>'
			+ '</div>'
			+ '<span class="remind_message_num">1</span>'
		+ '</li>';
};


SNSUnreadMessagePanel.prototype = new SNSFloatPanel();

SNSUnreadMessagePanel.prototype._init = function(){
	SNSApplication.getInstance().getGlobalEventManager().registerEventHandler(SNS_EVENT_SUBJECT.ON_MESSAGE_IN, true,
			this.onMessageIn, this);
	
	SNSApplication.getInstance().getGlobalEventManager().registerEventHandler(SNS_EVENT_SUBJECT.ON_CURRENT_CHAT_CHANGE, true,
			this.onChatTabChange, this);
	
	jQuery(this.indicator).bind("mouseenter", jQuery.proxy(function(){
		// 有未读消息，打开相应消息；
		var dom = this.getContainerDom().find("li");
		if(dom && dom.length>0){
			this.show();
		}
	}, this));
	
	jQuery(this.indicator).bind("mouseleave", jQuery.proxy(function(){
		var handled = false;
		this.getDom().bind("mouseenter", jQuery.proxy(function(){
			handled = true;
			this.show();
		}, this));
		this.getDom().bind("mouseleave", jQuery.proxy(function(){
			handled = true;
			this.hide();
		}, this));
		setTimeout(jQuery.proxy(function(){
			if(!handled)
				this.hide();
		},this), 200);
	}, this));
	
	jQuery(this.indicator).bind("click", jQuery.proxy(function(){
		SNSIMWindow.getInstance().getChatWindow().openChatWith(SNSApplication.getInstance().getUser().systemRoster.getID());
	}, this));
	
	// 忽略全部
	jQuery(this.ignoreAllBtnSelector).bind("click", jQuery.proxy(function(){
		this.ignoreAllMsg();
	}, this));
	// 查看全部
	jQuery(this.checkAllBtnSelector).bind("click", jQuery.proxy(function(){
		this.checkAllMsg();
	}, this));
};

SNSUnreadMessagePanel.prototype.onMessageIn = function(event, data){
	var message = data.message;
	var target = message.getRosterOrChatRoom();
	var tab = SNSIMWindow.getInstance().getChatWindow().getTab(target);
	if(!tab || !tab.isHeadVisible()){
		this.renderUnreadMessage(message);
	}
};

SNSUnreadMessagePanel.prototype.onChatTabChange = function(event, data){
	var oldTab = data.oldValue;
	var newTab = data.newValue;
	var rosterId = newTab.getTarget().id;
	var dom = this.getContainerDom().find("li[id='"+rosterId+"']");
	if(!dom || dom.length<=0){
		// dom = this.getContainerDom().find("li[fullJid='"+newTab.getTarget().jid.toString()+"']");
	}
	//if(dom && dom.length>0){
		this.removeUnreadMessage(rosterId);
	//}
};

SNSUnreadMessagePanel.prototype.renderUnreadMessage = function(message){
	var roster = message.getRosterOrChatRoom();
	var rosterId = roster.getID();
	
	if(message.to.id == YYIMChat.getUserID()){
		roster = message.chatroom || message.from; 
	}else{
		roster = message.to; 
	}
	
	rosterId = roster.id;
	
	
	if(roster instanceof SNSDeviceRoster){
		// rosterId = roster.jid.toString();
	}
	
	var dom = this.getContainerDom().find("li[rosterId='"+rosterId+"']");
	if(!dom || dom.length < 1){
		// dom = this.getContainerDom().find("li[fullJid='"+rosterId+"']");
	}
	
	var tab;
//	if(roster instanceof SNSChatRoom){
//		tab = SNSIMWindow.getInstance().getWideWindow().getTab("chatroom");
//	}else{
//		tab = SNSIMWindow.getInstance().getWideWindow().getTab("roster");
//	}

	if(message.type == 'groupchat'){
		tab = SNSIMWindow.getInstance().getWideWindow().getTab("chatroom");
	}else{
		tab = SNSIMWindow.getInstance().getWideWindow().getTab("roster");
	}
	
	

	if(dom && dom.length>0){//unreadMessage 已经存在
		var unreadMessageNum = parseInt(dom.find(".remind_message_num").text());
		dom.find(".remind_message_num").text(unreadMessageNum+1);
		dom.find(".remind_message_content").text(message.body.content);
		// roster|chatroom tab 中进行消息数量提示
		tab.renderUnreadMsgNum(roster, unreadMessageNum+1);
		return;
	}else{
		var html = TemplateUtil.genHtml(this.messageTemplate, message);
		this.getContainerDom().append(html);
		this._bindClickEvent(rosterId);
		this.updateUnreadMessageIndicator();
		tab.renderUnreadMsgNum(roster, 1);
	}
};
/**
 * 我的设备的时候，bareJid为全jid
 * @param rosterId
 */
SNSUnreadMessagePanel.prototype._bindClickEvent = function(rosterId){
	var dom = this.getContainerDom().find("li[rosterId='"+rosterId+"']");
	if(!dom || dom.length < 1){
		// dom = this.getContainerDom().find("li[fullJid='"+bareJid+"']");
	}
	
	dom.bind("click", {self:this,rId:rosterId},function(event){
		var self = event.data.self;
		var rId = event.data.rId;
		var user = SNSApplication.getInstance().getUser();
		if(!user.getRosterOrChatRoom(rId)){
			user.rosterList.add(new SNSRoster(rId));
		}
		var tab = SNSIMWindow.getInstance().getChatWindow().openChatWith(event.data.rId);
		self.removeUnreadMessage(rId);
	});
};

SNSUnreadMessagePanel.prototype.beforeShow = function(){
	var dom = this.getDom();
	var offset = jQuery(this.indicator).offset();
	var num = this.getContainerDom().find("li").length;
	num > 4? num = 4:null;
	dom.css("top", offset.top-30-num*66);
	dom.css("left", offset.left-62);
};

/**
 * 
 * @param rosterId {JSJaCJID|SNSRoster|String} 
 */
SNSUnreadMessagePanel.prototype.removeUnreadMessage  = function(rosterId){
	// var rosterId = YYIMChat.getJIDUtil().getBareJID(jid);
	this.getContainerDom().find("li[rosterId='"+rosterId+"']").remove();
	// this.getContainerDom().find("li[fullJid='"+rosterId+"']").remove();
	
	this.updateUnreadMessageIndicator();
	var roster = SNSApplication.getInstance().getUser().getRosterOrChatRoom(rosterId);
	var tab;
	if(roster instanceof SNSChatRoom){
		tab = SNSIMWindow.getInstance().getWideWindow().getTab("chatroom");
	}else{
		tab = SNSIMWindow.getInstance().getWideWindow().getTab("roster");
	}
	tab.clearUnreadMsgNum(roster);
	
	var items = this.getContainerDom().find("li");
	if(!items || items.length==0){
		this.hide();
	}
};

SNSUnreadMessagePanel.prototype.updateUnreadMessageIndicator = function(){
	var items = this.getContainerDom().find("li");
	if(!items || items.length==0){
		jQuery(this.indicator).find("span").removeClass("unread_system_messages");
		jQuery(this.indicator).addClass("system_messages_bg");
	}else{
		jQuery(this.indicator).find("span").addClass("unread_system_messages");
		jQuery(this.indicator).removeClass("system_messages_bg");
	}
};

SNSUnreadMessagePanel.prototype.ignoreAllMsg = function(){
	var doms = this.getContainerDom().find("li");
	var user = SNSApplication.getInstance().getUser();
	for(var i = 0; i < doms.length; i++){
		var rosterId = jQuery(doms[i]).attr("rosterId");
		if(!user.getRosterOrChatRoom(rosterId)){
			// jid = jQuery(doms[i]).attr("fullJid")
		}
		this.removeUnreadMessage(rosterId);
		SNSApplication.getInstance().getMessageInBox().popUnreadMessageByRoster(user.getRosterOrChatRoom(rosterId));
	}
};
SNSUnreadMessagePanel.prototype.checkAllMsg = function(){
	var doms = this.getContainerDom().find("li");
	for(var i = 0; i < doms.length; i++){
		jQuery(doms[i]).trigger("click");
	}
};
var SNSCreateChatroomPanel = function() {
	this.triggerSelector = ".snsim_create_chatroom_btn";
	this.selector = ".sns_chatroom_name_div";
	this.submitBtn = ".sns_chatroom_name_btn";
	this.inputBox = ".sns_chatroom_name_input";

	this.hideFloat = SNSComponent.HIDE_TYPE.HIDE_IGNORE_SELF;

};

SNSCreateChatroomPanel.prototype = new SNSComponent();

SNSCreateChatroomPanel.prototype._init = function() {

	// 创建群组
	jQuery(this.triggerSelector).bind("click", jQuery.proxy(function(event) {
		jQuery(this.selector).toggle();
	}, this));

	// 创建群组输入名称回车事件
	jQuery(this.inputBox).bind("keydown", jQuery.proxy(function(event) {
		if (event.keyCode == SNS_KEY_CODE.ENTER) {
			jQuery(this.submitBtn).trigger("click");
		}
	}, this));

	// 创建群组输入名称后点击确定
	jQuery(this.submitBtn).on(
			"click",
			jQuery.proxy(function() {
				var name = jQuery(this.inputBox).val().substr(0,8);
				if (name.notEmpty()) {
					var node = Math.uuid().replace(/\-/g, "").toLowerCase().substr(0, 8);
					YYIMChat.addChatGroup({
						name: name,
						node: node,
						//nickName: SNSApplication.getInstance().getUser().getID(),
						success: jQuery.proxy(function(arg) {
							var room = SNSApplication.getInstance().getUser().chatRoomList.createRoomHandler(arg);
							SNSIMWindow.getInstance().getChatWindow().openChatWith(room);
							this.hide();
						}, this)
					});
					jQuery(this.inputBox).val('');
				}
			}, this));

	SNSComponent.prototype._init.call(this);
}
var SNSInnerAppTab = function(chatroom){
	this.name = "app";

	/**
	 * Tab标签头部的选择器
	 * @Type {String}
	 * @Field
	 */
	this.headSelector = "#snsim_tab_head_app_"+chatroom.getID();
	
	/**
	 * Tab内容的选择器
	 * @Type {String}
	 * @Field
	 */
	this.contentSelector= "#snsim_tab_content_app_"+chatroom.getID();
};

SNSInnerAppTab.prototype = new SNSTab();

SNSInnerAppTab.prototype._init = function(){
	YYIMChat.log("SNSInnerAppTab.prototype._init",3);
};
/**
 * chatroom聊天窗口内的tabcontainer,包含群消息，群共享等
 * @Class SNSInnerChatTabContainer
 * @Contructor
 */
var SNSInnerChatTabContainer = function(roster){
	
	this.roster = roster;
	
	//TODO 为什么会被覆盖
	this.tabs = new SNSTabList();
	
	this.headContainerSelector = "#snsim_chat_window_inner_tab_content_"+roster.getID()+" .snsim_tab_head_container";
	
	this.contentContainerSelector = "#snsim_chat_window_inner_tab_content_"+roster.getID()+".snsim_tab_content_container";
};

SNSInnerChatTabContainer.prototype = new SNSTabContainer();

/**
 * 初始化container, 加入三个指定的tab
 */
SNSInnerChatTabContainer.prototype._init = function(){
	
	YYIMChat.log("SNSInnerChatTabContainer.prototype._init ",3);
};
var SNSInnerMessageTab = function(chatroom){
	
	this.name = "message";
	
	/**
	 * Tab标签头部的选择器
	 * @Type {String}
	 * @Field
	 */
	this.headSelector = "#snsim_tab_head_message_"+chatroom.getID();
	
	/**
	 * Tab内容的选择器
	 * @Type {String}
	 * @Field
	 */
	this.contentSelector= "#snsim_tab_content_message_"+chatroom.getID();
};

SNSInnerMessageTab.prototype = new SNSTab();

SNSInnerMessageTab.prototype._init = function(){
	YYIMChat.log("SNSInnerMessageTab.prototype._init ",3);
};
var SNSInnerShareTab =  function(chatroom){
	this.name = "share";
//	this.selector = "#snsim_tab_head_share_"+chatroom.getID();
	this.chatroom = chatroom;
	
	/**
	 * Tab标签头部的选择器
	 * @Type {String}
	 * @Field
	 */
	this.headSelector = "#snsim_tab_head_share_"+chatroom.getID();
	
	/**
	 * Tab内容的选择器
	 * @Type {String}
	 * @Field
	 */
	this.contentSelector= "#snsim_tab_content_share_"+chatroom.getID();
	
	this.containerSelector = this.contentSelector+" .snsim_sharefile_container";
	
	this.fileBoxSelector = ".snsim_sharefile_box";
	this.refreshBtn = ".snsim_share_file_refresh_btn";
	this.fileNumSelector = ".snsim_share_file_num";
	
};

SNSInnerShareTab.fileTemplate = 
	'<li>'
	+ '<div style="display: inline-block; margin-top: 7px;vertical-align: top;">'
		+ '<img width="24" height="28" src="res/skin/default/icons/filetype/##{{type}}.png">'
	+ '</div>'
	+ '<div class="snsim_file_info">'
		+ '<span class="name">##{{name}}</span>'
		+ '<span class="size">##{{renderSize()}}</span>'
		//+ '<span class="downnum"> · ##{{downloads}}次下载</span>'
		+ '<span class="creator"> ##{{creator}}</span>'
		+ '<span class="time"> ##{{time}}</span>'
	+ '</div>'
	+ '<a class="download_btn" style="margin-top:13px;" href="##{{path}}" target="_blank">'
		+ '<span class="download_icon"></span><span class="download_info"></span>'
	+'</a>'
	+ '</li>',

	SNSInnerShareTab.noFileTips = "<span>当前群组没有被共享的文件。</span>"
	
SNSInnerShareTab.prototype = new SNSTab();


SNSInnerShareTab.prototype._init = function(){
	YYIMChat.log("SNSInnerShareTab.prototype._init ",3);
	this.getContentDom().find(this.fileBoxSelector).perfectScrollbar({suppressScrollX:true});
	this.getContentDom().find(this.refreshBtn).bind("click",jQuery.proxy( function(){
		var fileList = this.chatroom.fileList;
		jQuery.when(fileList.requestSharedFiles()).done(jQuery.proxy(this.showFiles,this));
	}, this));
};

SNSInnerShareTab.prototype.beforeSelect = function(){
	var fileList = this.chatroom.fileList;
	if(!fileList.hasRequested()){
		jQuery.when(fileList.requestSharedFiles()).done(jQuery.proxy(this.showFiles,this));
		return;
	}
	if(fileList.getList().length>0 && this.getContainerDom().html().isEmpty()){
		this.showFiles();
	}
};

SNSInnerShareTab.prototype.showFiles = function(){
	var container = this.getContainerDom();
	container.empty();
	
	var list =  this.chatroom.fileList.getList();
	this.getContentDom().find(this.fileNumSelector).text(list.length);
	if(list.length == 0){
		//container.append(SNSInnerShareTab.noFileTips);
		return;
	}
	
	for(var i in list){
		var item =  list[i];
		if(item && item instanceof SNSChatRoomFile){
			this.addShareFile(item);
		}
	}
	
};

SNSInnerShareTab.prototype.addShareFile = function(file){
	var html = TemplateUtil.genHtml(SNSInnerShareTab.fileTemplate, file);
	jQuery(this.containerSelector).prepend(html);
};


var SNSMemberListPanel = function() {
	this.selector = "#chatroom_member_list";
	this.triggerSelector = "#show_chatroom_members";
	this.rosterListContainerSelector = "ul";
	this.closeBtnSelector = ".close_btn";
	this.memberLsitContentSelector = ".member_list_content";
	// dismiss, quit, modify nickname
	this.destoryChatRoomSelector = ".destory";
	this.quitChatRoomSelector = ".quit";
	this.modifyNickNameSelector = ".rename";
	//删除好友
	this.delRosterBtnSelector = ".del-btn";
	
	// chatroom name and photoUrl
	this.chatroomNameSelector = ".chatroom_info .chatroom_name";
	this.chatroomPhotoUrlSelector = ".chatroom_info img";
	
	// info
	this.nickNameInputSelector = ".snsim_members_info";
	this.modifyNickNameBtnSelector = ".snsim_modify_nickname_btn";
	
	this.memberItemIdPrefix = "member_item_";
	
	//this.hideFloat = SNSComponent.HIDE_TYPE.HIDE_IGNORE_SELF;
	
	this.template = 
		'<li id="' + this.memberItemIdPrefix + '##{{getID()}}" rosterId="##{{getID()}}">'
			+'<div>'
				+'<img class="head_icon" src="##{{getPhotoUrl()}}">'
				+'<div class="snsim_members_info" contenteditable="false">'
					+'##{{name}}'
				+'</div>'
				+'<span class="snsim_modify_nickname_btn hide">确定</span>'
			+'</div>'
			+'<div>'
				+'<div class="snsim_members_mail">'
					+'##{{getID()}}'
				+'</div>'
			+'</div>'
			+'<div>'
				+'<div style="float: right;margin-right: 25px;margin-top: -15px;">'
					+'<a title="删除" class="del-btn" style="color:#df1a00;">删除</a>'
//					+'<span title="修改备注" class="edit" onclick="SNSIMWindow.getInstance().getChatroomMembersPanel().editMember"></span>'
//					+'<span title="查看资料" class="see" onclick="SNSIMWindow.getInstance().getChatroomMembersPanel().checkMember"></span>'
				+'</div>'
			+'</div>'
		+'</li>';
};

SNSMemberListPanel.prototype = new SNSFloatPanel();
SNSMemberListPanel.isOdd = true;

SNSMemberListPanel.prototype._init = function(){
	this.getDom().find(this.memberLsitContentSelector).perfectScrollbar({suppressScrollX:true});
	this._bindDomEvent();
	SNSFloatPanel.prototype._init.call(this);
};

SNSMemberListPanel.prototype.show = function(){
	var offset = jQuery(this.triggerSelector).offset();
	this.getDom().css("top", offset.top - 34);
	this.getDom().css("left", offset.left - 134);
	
	this.renderMemberList();
	SNSFloatPanel.prototype.show.call(this);
};

SNSMemberListPanel.prototype.renderMemberList = function(){
	var chatroom = SNSIMWindow.getInstance().getChatWindow().getActiveRoster();
	this.getDom().find(this.chatroomNameSelector).text(chatroom.name);
	this.getDom().find(this.chatroomPhotoUrlSelector).attr("src", chatroom.getPhotoUrl());
	
	
	this.getDom().find(this.rosterListContainerSelector).html("");
	if(chatroom instanceof SNSChatRoom){
		// 判断成员列表是否已经获取
		if(!chatroom.rosterList._size || chatroom.rosterList._size < 1 || !chatroom.memberListQueryed){
			YYIMChat.getGroupMembers({
				id: chatroom.getID(),
				success: jQuery.proxy(function(list){
					chatroom.queryMembersHandler(list);
//					chatroom.setMemberList(list);
					var memberList = chatroom.rosterList._list;
					for(var item in memberList){
						this.getDom().find(this.rosterListContainerSelector).append(TemplateUtil.genHtml(this.template, memberList[item]));
						if(SNSMemberListPanel.isOdd){
							this.getDom().find("#" + this.memberItemIdPrefix + memberList[item].getID()).addClass("odd");
							SNSMemberListPanel.isOdd = false;
						}else {
							SNSMemberListPanel.isOdd = true;
						}
					}
					this.bindMembersOperation();
					return;
				},this)
			});
		}
		else{
			var memberList = chatroom.rosterList._list;
			for(var item in memberList){
				this.getDom().find(this.rosterListContainerSelector).append(TemplateUtil.genHtml(this.template, memberList[item]));
				if(SNSMemberListPanel.isOdd){
					this.getDom().find("#" + this.memberItemIdPrefix + memberList[item].getID()).addClass("odd");
					SNSMemberListPanel.isOdd = false;
				}else {
					SNSMemberListPanel.isOdd = true;
				}
			}
			this.bindMembersOperation();
		}
	}
	
};

/**
 * 改昵称, 查看资料
 */
SNSMemberListPanel.prototype.bindMembersOperation = function(){
	var myInfo = this.getDom().find("#" + this.memberItemIdPrefix + SNSApplication.getInstance().getUser().getID());
	// 修改昵称按钮
	myInfo.find(this.modifyNickNameBtnSelector).bind("click", jQuery.proxy(function(event){
		this.modifyNickName(event);
	},this));
	
	// 昵称输入框
	myInfo.find(this.nickNameInputSelector).bind("keydown", {_self: this},function(event){
		if(event.keyCode == SNS_KEY_CODE.ENTER){
			jQuery(this).blur();
			jQuery(this).siblings(event.data._self.modifyNickNameBtnSelector).trigger("click");
		}
	});
};

SNSMemberListPanel.prototype._bindDomEvent = function() {
	// 退群
	this.getDom().find(this.quitChatRoomSelector).bind("click", jQuery.proxy(function(){
		// getActiveRoster()为SNSChatRoom
		YYIMChat.quitChatGroup(SNSIMWindow.getInstance().getChatWindow().getActiveRoster().getID());
		// SNSIMWindow.getInstance().getChatWindow().getActiveRoster().quit();
		this.getDom().hide();
	},this));
	
	// 修改备注
	this.getDom().find(this.modifyNickNameSelector).bind("click", jQuery.proxy(function(){
		var chatroom = SNSIMWindow.getInstance().getChatWindow().getActiveRoster();
		var myItemInfo = this.getDom().find("#" + this.memberItemIdPrefix + SNSApplication.getInstance().getUser().getID() + " " + this.nickNameInputSelector);
		if(myItemInfo.attr("contenteditable") == "true"){
			this.renderModifyNickName(false);
		}else{
			this.renderModifyNickName(true);
		}
	},this));
	
	// 销毁群
	this.getDom().find(this.destoryChatRoomSelector).bind("click", jQuery.proxy(function(){
		// getActiveRoster()为SNSChatRoom
		SNSIMWindow.getInstance().getChatWindow().getActiveRoster().destory();
	},this));
	
	var self = this;
	/*
	 * 删除群成员
	 * @author yinjie
	 */
	this.getDom().on("click",this.delRosterBtnSelector, function(e){
		var roomId = SNSIMWindow.getInstance().getChatWindow().getActiveRoster().getID()
		var $rosterLi = jQuery(e.target).closest('li');
		var delid = jQuery(e.target).closest('li').attr('rosterid');
		YYIMChat.delGroupMember(roomId, delid, function(data) {
			$rosterLi.remove();
		});
	});
	
	SNSFloatPanel.prototype._bindDomEvent.call(this);
};

SNSMemberListPanel.prototype.modifyNickName = function(event){
	var target = jQuery(event.target);
	var newName = jQuery(event.target).siblings(this.nickNameInputSelector).text();
	
	jQuery.when(SNSIMWindow.getInstance().getChatWindow().getActiveRoster().modifyNickName(target.parents("tr").attr("rosterId") ,newName))
	.done(jQuery.proxy(function(){
		this.renderModifyNickName(false);
	},this));
};

SNSMemberListPanel.prototype.renderModifyNickName = function(contenteditable){
	var myItemInfo = this.getDom().find("#" + this.memberItemIdPrefix + SNSApplication.getInstance().getUser().getID() + " " + this.nickNameInputSelector);
	
	if(contenteditable){
		myItemInfo.addClass("cur");
		myItemInfo.siblings(this.modifyNickNameBtnSelector).removeClass("hide");
		myItemInfo.attr("contenteditable", "true");
	}else{
		myItemInfo.removeClass("cur");
		myItemInfo.siblings(this.modifyNickNameBtnSelector).addClass("hide");
		myItemInfo.attr("contenteditable", "false");
	}
};
var SNSInvitationWindow = function(data){
	// 邀请好友加入的房间
	this.currentChatroom;
	
	this.selector = "#snsim_invite_window";
	this.closeBtnSelector = "#snsim_invite_window .invite_window_close";
	this.invitationSubmitBtnSelector  = "#snsim_invite_footer .submit_btn";
	this.invitationCancelBtnSelector  = "#snsim_invite_footer .cancel_btn";
	
	// 房间信息
	this.currentChatroomHeadSelector = "#sns_invite_chatroom_head_icon";
	this.currentChatroomNameSelector = "#sns_invite_chatroom_name";
	
	// tab list 好友、组织, 搜索的结果
	this.tabContainer = new SNSInviteTabContainer();
	this.inviteFromRosterTab;
	this.inviteFromOrgTab;
	this.inviteFromSearchPanel = new SNSInviteFromSearchPanel();
	this.selectedListPanel = new SNSSelectedListPanel();
	
	// 打开时其他窗口禁止操作
	this.maskOthers = true;
};

SNSInvitationWindow.prototype = new SNSFloatPanel();

SNSInvitationWindow.prototype._init = function(){
	SNSFloatPanel.prototype._init.call(this);
	
	this.tabContainer._init();
	
	this.inviteFromRosterTab = new SNSInviteFromRosterTab();
	this.tabContainer.addTab(this.inviteFromRosterTab);
	
	this.inviteFromOrgTab = new SNSInviteFromOrgTab();
	this.tabContainer.addTab(this.inviteFromOrgTab);
	
	this._bindInvitationEvent();
};

/**
 * 绑定搜索相关的事件
 */
SNSInvitationWindow.prototype._bindInvitationEvent = function(){
	var self = this;
	
	// 确认邀请按钮
	jQuery(this.invitationSubmitBtnSelector).on("click",jQuery.proxy(function(){
		var list = this.selectedListPanel.list._list;
		var selectedJidList = new Array();
		for(var item in list){
			selectedJidList.push(list[item].getID());
		}
		YYIMChat.addGroupMember({
			roomId: this.currentChatroom.getID(), 
			ids: selectedJidList
		});
		this.hide();
	},this));
	
	
	jQuery(this.invitationCancelBtnSelector).on("click", jQuery.proxy(function(){
		jQuery(this.closeBtnSelector).trigger("click");
	},this));
	// 关闭邀请窗口
	jQuery(this.closeBtnSelector).on("click", jQuery.proxy(this.hide, this));
};

SNSInvitationWindow.prototype.show = function(chatroomJid){
	this.currentChatroom = SNSApplication.getInstance().getUser().getRosterOrChatRoom(chatroomJid);
	// 显示当前房间名和头像
	jQuery(this.currentChatroomHeadSelector).attr("src", this.currentChatroom.getPhotoUrl());
	jQuery(this.currentChatroomNameSelector).text(this.currentChatroom.name);
	
	this.inviteFromRosterTab.show();
	
	SNSFloatPanel.prototype.show.call(this);
};

SNSInvitationWindow.prototype.selectToInvite = function(obj){
	var _id = jQuery(obj).attr('rosterId');
	var _name = jQuery(obj).attr('name');
	var roster = SNSApplication.getInstance().getUser().getRoster(_id);
	if(!roster)
		roster = new SNSRoster(_id, _name);
	SNSIMWindow.getInstance().getInvitationWindow().selectedListPanel.add(roster);
};
var SNSInviteFromOrgTab = function(){
	this.name = "inviteFromOrg";

	this.headSelector = "#snsim_tab_head_invite_from_org";
	this.contentSelector= "#snsim_tab_content_invite_from_org";
	
	this.ztreeSelector = "#invite_from_org_tree";
	
	this.ztree;
	
	this.zTreeSetting = {
			data : {
				simpleData : {
					enable : true
				}
			},
			view : {
				nameIsHTML : true,
				showLine : false,
				showTitle : false
			},
			callback : {
				onExpand : jQuery.proxy(this.onNodeExpand, this)
			}
		};
	
	this.operationMenuTemplate = 
		'##{{name}} <span jid="##{{jid}}" class="organization_list_opt" hidefloat="true" style="display:none;"></span>';
};

SNSInviteFromOrgTab.prototype = new SNSTab();

SNSInviteFromOrgTab.prototype._init = function(){
	YYIMChat.log("SNSInviteFromOrgTab.prototype._init",3);
	// 添加滚动条
	jQuery(this.contentSelector).perfectScrollbar();
	SNSTab.prototype._init.call(this);
};

SNSInviteFromOrgTab.prototype.beforeSelect = function(){
	if(!this.ztree){
		this.loadRootNode();
	};
};

SNSInviteFromOrgTab.prototype.loadRootNode = function() {
	var iq = new JSJaCIQ();
	iq.setType(SNS_TYPE.GET);
	iq.setTo("1@org." + SNSApplication.getInstance().getDomain());
	var query = iq.buildNode("query", {
		xmlns : NS_ORGANIZATION
	});
	iq.appendNode(query);
	YYIMChat.send(iq, jQuery.proxy(function(packet) {
		if (packet.isError()) {
			YYIMChat.log("SNSInviteFromOrgTab.prototype.loadNodeByParent ", 0);
			return;
		}
		
		var zRootNode =[];
		
		var json = new Array();
		var xml = packet.doc.xml;
		var items = jQuery(xml).find("item[id]");
		for (var i = 0; i < items.length; i++) {
			var item = jQuery(items[i]);
			var node = new Object();
			node.id = item.attr("id");
			node.name = item.attr("name");
			var isUser = item.attr("isUser");
			var isLeaf = item.attr("isLeaf");
			if (isLeaf == "false" ) {
				node.isParent = true;
				node.iconSkin = "department"
			} else {
				node.isParent = false;
			}
			if( isUser =="true"){
				node.iconSkin = "person";
				node.name = this.getOperationHtml(node);
				node.click = "SNSIMWindow.getInstance().getInvitationWindow().selectToInvite('"+ item.attr("id") + "','" + item.attr("name") +"\')";
			}
			json.push(node);
			zRootNode.push({
				id:node.id,
				name:node.name,
				open:false,
				isParent:node.isParent,
				iconSkin:node.iconSkin
			});
		}
		this.ztree =  jQuery.fn.zTree.init(jQuery(this.ztreeSelector), this.zTreeSetting, zRootNode);
	}, this));
};

/**
 * 加载父节点对应子节点数据
 * @param parent		父节点对象，类型为treeNode, 为ztree内置类型
 */
SNSInviteFromOrgTab.prototype.loadNodeByParent = function(parent) {
	
	if(parent.loaded ||parent.loading) return;
	this.addLoadingNode(parent);//显示正在加载
	parent.loading = true;
	var iq = new JSJaCIQ();
	iq.setType(SNS_TYPE.GET);
	iq.setTo(parent.id + "@org." + SNSApplication.getInstance().getDomain());
	var query = iq.buildNode("query", {
		xmlns : NS_ORGANIZATION
	});
	iq.appendNode(query);
	YYIMChat.send(iq, jQuery.proxy(function(packet, data) {
		if (packet.isError()) {
			YYIMChat.log("SNSInviteFromOrgTab.prototype.loadNodeByParent ", 0, data);
			return;
		}
		var json = new Array();
		var xml = packet.doc.xml;
		var items = jQuery(xml).find("item[id]");
		for (var i = 0; i < items.length; i++) {
			var item = jQuery(items[i]);
			var node = new Object();
			node.id = item.attr("id");
			node.name = item.attr("name");
			var isUser = item.attr("isUser");
			var isLeaf = item.attr("isLeaf");
			if (isLeaf == "false" ) {
				node.isParent = true;
				node.iconSkin = "department"
			} else {
				node.isParent = false;
			}
			if( isUser =="true"){
				node.iconSkin = "person";
				node.name = this.getOperationHtml(node);
				node.click = "SNSIMWindow.getInstance().getInvitationWindow().selectToInvite('"+ item.attr("id") + "','" + item.attr("name") +"\')";
			}
			json.push(node);
		}
		parent.loaded = true;
		parent.loading = false;
		this.ztree.addNodes(data.parent, json);
		this.removeLoadingNode(data.parent);//加载完成后，删除正在加载按钮
	}, this), {
		parent: parent
	});
};

/**
 * 展开父节点时被激发的事件,并显示正在加载
 */
SNSInviteFromOrgTab.prototype.onNodeExpand = function(event, treeId, treeNode) {
	var tid = treeNode.tId;
	this.loadNodeByParent(treeNode);
};

/**
 * 添加正在加载节点
 */
SNSInviteFromOrgTab.prototype.addLoadingNode = function(parentNode){
	var node = new Object();
	node.id = Math.round(Math.random()*1000)+1000;
	node.iconSkin="loading";
	node.name="正在加载...";
	this.ztree.addNodes(parentNode, node,false);
};

/**
 * 删除正在加载节点
 */
SNSInviteFromOrgTab.prototype.removeLoadingNode = function(parentNode){
	var nodes = this.ztree.getNodesByParam("iconSkin","loading", parentNode);
	for(var i=0; i<nodes.length;i++){
		this.ztree.removeNode(nodes[i]);
	}
};

SNSInviteFromOrgTab.prototype.getOperationHtml = function(node){
	return TemplateUtil.genHtml(this.operationMenuTemplate, {jid:node.id ,name:node.name});
};

SNSInviteFromOrgTab.prototype.chatWithRoster = function(jid, name){
	var roster = new SNSRoster(jid, name);
	SNSIMWindow.getInstance().getChatWindow().openChatWith(roster);
};
var SNSInviteFromRosterTab = function(){
	this.name = "inviteFromRoster";

	/**
	 * Tab标签头部的选择器
	 * @Type {String}
	 * @Field
	 */
	this.headSelector = "#snsim_tab_head_invite_from_roster";
	
	/**
	 * Tab内容的选择器
	 * @Type {String}
	 * @Field
	 */
	this.contentSelector= "#snsim_tab_content_invite_from_roster";
	
	this.rosterListSelector = "#snsim_invite_roster_List";
	this.groupInfoSelector = ".group_info";
	this.groupToggleBtnSelector = ".invite_window_group_name";
	this.addWholeGroupSelector = ".add_whole_group";
	
	// group arrow
	this.groupArraySelector = ".group_arrow";
	this.rightArrowClass = "group_arrow_right";
	this.bottomArrowClass = "group_arrow_bottom";
	
	// 需排除的组
	this.excludeGroups = [SNSConfig.GROUP.GROUP_PUB_ACCOUNT, SNSConfig.GROUP.GROUP_DEVICE];
	
	this.rosterTemplate = 
		'<li rosterId="##{{getID()}}" name="##{{name}}" class="invite_from_roster_item" onclick="SNSIMWindow.getInstance().getInvitationWindow().selectToInvite(this)">'
			+ '<span class="user_name">##{{name}}</span>'
		+ '</li>';
	
	this.groupTempalte = 
		'<div id="' + SNSInviteFromRosterTab.groupItemIdPrefix + '##{{name}}" style="margin-bottom: 14px;">'
			+'<div class="group_info">'
				+ '<span class="group_arrow"></span>'
				+ '<a class="invite_window_group_name" name="##{{name}}">##{{name}}</a>' 
				+ '<span class="add_whole_group hide" name="##{{name}}"></span>'
			+ '</div>'
			+ '<ul>' 
			+ '</ul>' 
		+ '</div>';
	
};

SNSInviteFromRosterTab.groupItemIdPrefix = "snsim_invite_group_item_";

SNSInviteFromRosterTab.prototype = new SNSTab();

SNSInviteFromRosterTab.getInstance = function(){
	return SNSInviteFromRosterTab._instance;
};

SNSInviteFromRosterTab.prototype._init = function(){
	SNSInviteFromRosterTab._instance = this;
	
	jQuery(this.contentSelector).perfectScrollbar({suppressScrollX:true});
	YYIMChat.log("SNSInviteFromRosterTab.prototype._init",3);
};

SNSInviteFromRosterTab.prototype.getGroupIdSelector = function(groupName){
	return "#" + SNSInviteFromRosterTab.groupItemIdPrefix + groupName;
};

SNSInviteFromRosterTab.prototype.show = function(){
	jQuery(this.rosterListSelector).empty();
	this.showRosterList();
};
/**
 * 当前组展开或者收缩
 * @param groupName
 */
SNSInviteFromRosterTab.prototype.toggle = function(event, groupName){
	var groupArrow = jQuery(event.target).siblings(this.groupArraySelector);
	var rosterListNode = jQuery(this.getGroupIdSelector(groupName) + " ul");
	if(rosterListNode.is(":visible")){
		rosterListNode.hide();
		groupArrow.removeClass(this.bottomArrowClass);
		groupArrow.addClass(this.rightArrowClass);
	}else{
		rosterListNode.show();
		groupArrow.removeClass(this.rightArrowClass);
		groupArrow.addClass(this.bottomArrowClass);
	}
};

/**
 * 选取整个组
 * @param groupName
 */
SNSInviteFromRosterTab.prototype.selectWholeGroup = function(event, groupName){
	jQuery(this.getGroupIdSelector(groupName)).find("ul li").trigger("click");
};

/**
 * 显示当前好友列表
 */
SNSInviteFromRosterTab.prototype.showRosterList = function(){
	var groupList = SNSApplication.getInstance().getUser().getGroupList().toArray();
	for(var item in groupList){
		var group = groupList[item];
		if(group && group instanceof SNSGroup){
			this.showGroup(group);
		}
	}
};

/**
 * 显示用户组及组内成员
 * @param group
 */
SNSInviteFromRosterTab.prototype.showGroup = function(group){
	if(YYIMChat.getArrayUtil().contains(this.excludeGroups,group.name))
		return;
	jQuery(this.rosterListSelector).append(TemplateUtil.genHtml(this.groupTempalte, group));
	var rosterList = SNSApplication.getInstance().getUser().getRosterListByGroup(group).toArray();
	for(var item in rosterList){
		if(rosterList[item] && rosterList[item] instanceof SNSRoster){
			jQuery(this.getGroupIdSelector(group.name) + " ul").append(TemplateUtil.genHtml(this.rosterTemplate, rosterList[item]));
		}
	}
	
	this.bindGroupEvent(group.name);
};

SNSInviteFromRosterTab.prototype.bindGroupEvent = function(groupName){
	// 组信息
	jQuery(this.getGroupIdSelector(groupName) + " " + this.groupInfoSelector).bind("mouseenter", {groupName: groupName}, jQuery.proxy(function(event){
		jQuery(this.getGroupIdSelector(event.data.groupName) + " " + this.addWholeGroupSelector).show();
	},this));
	jQuery(this.getGroupIdSelector(groupName) + " " + this.groupInfoSelector).bind("mouseleave", {groupName: groupName}, jQuery.proxy(function(event){
		jQuery(this.getGroupIdSelector(event.data.groupName) + " " + this.addWholeGroupSelector).hide();
	},this));
	
	// 组展开，折叠
	jQuery(this.getGroupIdSelector(groupName) + " " + this.groupToggleBtnSelector).bind("click", jQuery.proxy(function(event){
		this.toggle(event, event.target.name);
	},this));
	
	// 选择整组
	jQuery(this.getGroupIdSelector(groupName) + " " + this.addWholeGroupSelector).bind("click", {groupName: groupName}, jQuery.proxy(function(event){
		this.selectWholeGroup(event, event.data.groupName);
	},this));
};

var SNSInviteFromSearchPanel = function(){
	this.selector = "#snsim_invite_from_search";
	this.searchInputSelector = "#snsim_invite_search_input";
	this.searchResultListSelector = "#snsim_invite_search_result_list";
	this.searchResultContainerSelector = "#invite_roster_list_box";
	
	this.searchResultTemplate =     	
		'<li class="search_result_item" rosterId="##{{getID()}}" name="##{{name}}" onclick="SNSIMWindow.getInstance().getInvitationWindow().selectToInvite(this)">'
			+ '<span title="##{{name}}">##{{name}}</span>'
		+ '</li>';
	
	this._init();
};

SNSInviteFromSearchPanel.prototype = new SNSComponent();

SNSInviteFromSearchPanel.getInstance = function(){
	if(SNSInviteFromSearchPanel._instance)
		return SNSInviteFromSearchPanel._instance;
};
SNSInviteFromSearchPanel.prototype._init = function(){
	YYIMChat.log("SNSInviteFromOrgTab.prototype._init",3);
	SNSInviteFromSearchPanel._instance = this;
	jQuery(this.searchResultContainerSelector).perfectScrollbar({suppressScrollX:true});
	this._bindDomEvent();
};

SNSInviteFromSearchPanel.prototype._bindDomEvent = function(){
	jQuery(this.searchInputSelector).bind("keydown",jQuery.proxy(function(event) {
		var keyword = jQuery(this.searchInputSelector).val();
		if (event.keyCode == SNS_KEY_CODE.ENTER) {
			this.clearSearchResult();
			// 搜索结果返回之后再进行页面渲染
			YYIMChat.queryRosterItem( {
				keyword: keyword,
				success: jQuery.proxy(this.showSearchResult, this)
			});
		}
	}, this));
	
	jQuery(this.searchInputSelector).bind("keyup",jQuery.proxy(function(event) {
		var keyword = jQuery(this.searchInputSelector).val();
		if(!keyword){
			this.getDom().find(this.searchResultContainerSelector).hide();
			SNSIMWindow.getInstance().getInvitationWindow().tabContainer.getDom().show();
		}
	}, this));
};

/**
 * 显示搜索到的用户
 */
SNSInviteFromSearchPanel.prototype.showSearchResult = function(jsonList){
	this.getDom().find(this.searchResultContainerSelector).show();
	SNSIMWindow.getInstance().getInvitationWindow().tabContainer.getDom().hide();
	
	var resultList = jsonList.items;
	for(var i = 0; i< resultList.length; i++){
		resultList[i] = jQuery.extend(new SNSRoster(resultList[i].id), resultList[i]);
		//resultList[i].jid = new JSJaCJID(resultList[i].jid);
		
		jQuery(this.searchResultListSelector).append(TemplateUtil.genHtml(this.searchResultTemplate, resultList[i]));
	}
};

/**
 * 再次搜索之前，清空上次搜索结果
 */
SNSInviteFromSearchPanel.prototype.clearSearchResult = function(){
	jQuery(this.searchResultListSelector).html("");
};

var SNSInviteTabContainer = function(roster){
	this.selector = "#snsim_invite_tab_content_container";
	
	this.headContainerSelector = "#snsim_invite_window .snsim_tab_head_container";
	
	this.contentContainerSelector = "#snsim_invite_tab_content_container";
};

SNSInviteTabContainer.prototype = new SNSTabContainer();

/**
 * 初始化container, 加入2个指定的tab
 */
SNSInviteTabContainer.prototype._init = function(){
	
	YYIMChat.log("SNSInviteTabContainer.prototype._init ",3);
};
var SNSSelectedListPanel = function(){
	this.selector = "#snsim_selected_container";
	this.selectedListContainerSelector = ".selected_list_container";
	this.selectedListSelector = ".selected_list";
	this.selectedNumSelector = ".selected_num";
	this.deleteBtnSelector = ".delete_btn";
	
	this.list = new SNSBaseRosterList();
	
	this.itemTemplate = 
		'<li rosterId="##{{getID()}}">'
			+ '<img src="##{{getPhotoUrl()}}" class="head_icon">'
			+ '<span style="margin-left: 8px;vertical-align: top;" title="##{{name}}">##{{name}}</span>'
			+ '<span class="remove_btn" onclick="SNSSelectedListPanel.getInstance().remove(\'##{{getID()}}\')">删除</span>'
		+ '</li>';
	
	this._init();
};

SNSSelectedListPanel.prototype = new SNSComponent();

SNSSelectedListPanel.getInstance = function(){
	if(SNSSelectedListPanel._instance)
		return SNSSelectedListPanel._instance;
};

SNSSelectedListPanel.prototype._init = function(){
	YYIMChat.log("SNSInviteMembersSelectedPanel.prototype._init",3);
	SNSSelectedListPanel._instance = this;
	this.getDom().find(this.selectedListContainerSelector).perfectScrollbar();
	//this._bindDomEvent();
};

SNSSelectedListPanel.prototype.add = function(roster){
	if(!roster)
		return;
	if(this.list.add(roster)){
		this.getDom().find(this.selectedListSelector).append(TemplateUtil.genHtml(this.itemTemplate, roster));
		this.getDom().find(this.selectedNumSelector).text(this.list.size());
	}
};

SNSSelectedListPanel.prototype.remove = function(id){
	if(!id)
		return;
	this.getDom().find(this.selectedListSelector + " li[rosterId='" + id + "']").remove();
	this.list.remove(id);
	this.getDom().find(this.selectedNumSelector).text(this.list.size());
};
var SNSReconnectPanel = function() {
	this.selector = "#snsim_list_relink";
	this.relinkCountDownPanel = "#snsim_connecting_wait";
	this.relinkCountDownText = "#snsim_relink_wait_seconds";

	this.connectingPanel = "#snsim_relink_connecting";
	this.cancelConnectingBtn = "#snsim_relink_cancel_connect";

	this.connectFailPanel = "#snsim_relink_connecting_fail";
	this.connectBtn = "#snsim_relink_connect_imm, #snsim_relink_reconnect_imm";

	/**
	 * 自动重连的倒计时
	 * @Type {Number}
	 */
	this.reconnectTimer = SNSConfig.CONNECTION.RECONNECT_TIMER;

	/**
	 * 自动重连倒计时的interval
	 * @Type {Number}
	 */
	this.reconnectInterval;
	
	this.reconnecting = false;
};

SNSReconnectPanel.prototype = new SNSFloatPanel();

SNSReconnectPanel.prototype._init = function() {
	SNSApplication.getInstance().getGlobalEventManager().registerEventHandler(SNS_EVENT_SUBJECT.CONNECT_FAILED, false,
			this.startReconnectCount, this);

	SNSApplication.getInstance().getGlobalEventManager().registerEventHandler(SNS_EVENT_SUBJECT.AFTER_CONNECT, true,
			this.onConnected, this);
	
	this._bindDomEvent();

};

SNSReconnectPanel.prototype._bindDomEvent = function() {
	// 立即连接按钮
	jQuery(this.connectBtn).bind("click",{self:this}, function(event) {
		event.data.self.reconnectImmedately();
		YYIMChat.getOfflineMessage(); //连接断开重连以后获取离线消息
	});

	// 取消按钮
	jQuery(this.cancelConnectingBtn).bind("click", {self:this}, function(event) {
		event.data.self.cancelReconnect();
	});
};

/**
 * 自动重连机制
 */
SNSReconnectPanel.prototype.startReconnectCount = function(event) {
	YYIMChat.log("SNSConnectDaemon.prototype.startReconnectCount", 2);
	if (this.reconnecting || !event.errorCode || event.errorCode == 401)
		return;
	this.reconnecting = true;
	this.reconnectInterval = setInterval(jQuery.proxy(this._doReconnect, this), 1000);
};

SNSReconnectPanel.prototype._doReconnect = function() {
	YYIMChat.log("SNSConnectDaemon.prototype._doReconnect ", 2);
	if (this.reconnectTimer > 0) {
		this.setCountDownNum(this.reconnectTimer--);
		this.showRelinkCountDown();
		this.getDom().show();
	} else {
		this.reconnectImmedately();
	}
};

/**
 * 取消自动重连的倒计时
 */
SNSReconnectPanel.prototype.cancelReconnect = function() {
	clearInterval(this.reconnectInterval);
	this.showConnectFailedPanel();
};

/**
 * 清除发送ping包的定时器
 */
SNSReconnectPanel.prototype.clearReconnectInterval = function() {
	clearInterval(this.reconnectInterval);
	this.reconnecting = false;
};

/**
 * 取消自动重连的倒计时，并立即进行连接
 */
SNSReconnectPanel.prototype.reconnectImmedately = function() {
	this.showRelinkPanel();
	YYIMChat.disConnect();
	YYIMChat.connect();
	
	clearInterval(this.reconnectInterval);
	this.reconnecting = false;
	this.reconnectTimer = SNSConfig.CONNECTION.RECONNECT_TIMER;
};

SNSReconnectPanel.prototype.onConnected = function() {
	this.clearReconnectInterval();
	this.getDom().hide();
};

SNSReconnectPanel.prototype.showRelinkPanel = function() {
	jQuery(this.relinkCountDownPanel).hide();
	jQuery(this.connectingPanel).show();
};

SNSReconnectPanel.prototype.showRelinkCountDown = function() {
	jQuery(this.connectingPanel).hide();
	jQuery(this.relinkCountDownPanel).show();
};

SNSReconnectPanel.prototype.setCountDownNum = function(num) {
	jQuery(this.relinkCountDownText).text(num);
};

SNSReconnectPanel.prototype.showConnectFailedPanel = function() {
	jQuery(this.connectingPanel).hide();
	jQuery(this.connectFailPanel).show();
};
var SNSDialog = function(){
	this.selector = "#snsim_dialog";	
	this.titleSelector = "";
	this.iconSelector = ".snsim_cfmicon_stat";
	this.textSelector = ".txt";
	this.inputSelector = "input";
	this.btnOkSelector = ".snsim_btn_a";
	this.btnCancelSelector = ".snsim_btn_b";
	this.type = DIALOG_TYPE.ALERT;
	this._init();
};

var DIALOG_TYPE = {
	ALERT : 0,
	CONFIRM : 1,
	PROMPT : 2
};

SNSDialog.prototype = new SNSWindow({mask: true});

SNSDialog.prototype._init = function(){

	this.getDom().find(this.btnOkSelector).unbind();
	this.getDom().find(this.btnCancelSelector).unbind();
	this.getDom().find(this.btnCancelSelector).show();
	this.getDom().find(this.inputSelector).show();
	this.getDom().find(this.inputSelector).val("");
	
	this.getDom().find(this.btnCancelSelector).bind("click", jQuery.proxy(function(){
		this.hide();
	},this));
	this.hide();
};

//SNSDialog.prototype.hide = function(){
//	SNSWindow.prototype.hide.call(this);
//	this.getDom().find(this.btnOkSelector).unbind();
//	this.getDom().find(this.btnCancelSelector).unbind();
//	this.getDom().find(this.btnCancelSelector).show();
//	this.getDom().find(this.inputSelector).show();
//};

SNSDialog.prototype.set = function(type, text, cb, context){
	this._init();
	this.setText(text);
	this.setType(type);
	this.setCallback(cb, context);
	
	this.getDom().find(this.btnCancelSelector).bind("click", jQuery.proxy(function(){
		this.hide();
		SNSIMWindow.getInstance().cover.hide();
	},this));
};

SNSDialog.prototype.setType = function(type){
	this.type = type;
	switch(type){
	case DIALOG_TYPE.ALERT:
		this.getDom().find(this.btnCancelSelector).hide();
	case DIALOG_TYPE.CONFIRM:
		this.getDom().find(this.inputSelector).hide();
	case DIALOG_TYPE.PROMPT:
		break;
	default:
		break;
	}
};

SNSDialog.prototype.setText = function(text){
	this.getDom().find(this.textSelector).text(text);
};

SNSDialog.prototype.setCallback = function(cb, context){
	this.getDom().find(this.btnOkSelector).off("click").on("click", function(){
		cb.apply(context);
		SNSIMWindow.getInstance().cover.hide();
	});
};

// 取消事件
/*SNSDialog.prototype.setCancelCallback = function(cb, context){
	this.getDom().find(this.btnCancelSelector).off("click").on("click", function(){
		cb.apply(context);
		SNSIMWindow.getInstance().cover.hide();
	});
};*/

SNSDialog.prototype.getInput = function(){
	return this.getDom().find(this.inputSelector).val();
};
var SNSImagePreviewPanel = function(){
	this.selector = "#snsim_img_preview_window";
	this.imgSelector = "img";
	this.closeBtnSelector = ".snsim_img_preview_close";
};

SNSImagePreviewPanel.prototype = new SNSFloatPanel();

SNSImagePreviewPanel.prototype._init = function() {
	SNSFloatPanel.prototype._init.call(this);
	this._bindDomEvent();
};

SNSImagePreviewPanel.prototype._bindDomEvent = function() {
	this.getDom().find(this.imgSelector).bind("click", {_self: this}, function(event){
		event.data._self.hide();
	});
	SNSFloatPanel.prototype._bindDomEvent.call(this);
};

SNSImagePreviewPanel.prototype.updateImg = function(url){
	this.show();
	this.getDom().find(this.imgSelector).attr("src", url);
};
/**
 * 可用分组的显示面板, 在选择移动或者复制好友时显示
 * @Class SNSAvailableGroupPanel
 */
var SNSAvailableGroupPanel = function() {
	this.selector = "#snsim_roster_operation_available_panel";

	this.triggerSelector = "#snsim_move_roster_btn, #snsim_copy_roster_btn";

	this.containerSelector = this.selector + " ul";

	/**
	 * 可用的分组的显示模板
	 */
	this.groupTemplate = '<li class="snsim_available_groups" style="width:70px;" groupname="##{{name}}" title="##{{name}}">' + '<a class="setting_cho">'
			+ '<span class="setting_txt">##{{name}}</span>' + '</a>' + '</li>';

	/**
	 * 保存要显示的分组
	 */
	this.groups;

	/**
	 * 点击界面，该浮动面板的隐藏情况
	 * @{Number} SNSComponent.HIDE_TYPE.HIDE
	 */
	this.hideFloat = SNSComponent.HIDE_TYPE.HIDE;
};

SNSAvailableGroupPanel.prototype = new SNSFloatPanel();

SNSAvailableGroupPanel.prototype._init = function() {

	SNSFloatPanel.prototype._init.call(this);
};

/**
 * 设置要显示的分组
 * @param groups {SNSGroup[]}
 */
SNSAvailableGroupPanel.prototype.setGroups = function(groups) {
	this.groups = groups;
};

/**
 * 在界面显示之前，确定该浮动面板的位置
 */
SNSAvailableGroupPanel.prototype.beforeShow = function() {
	this.getContainerDom().empty();
	
	var html = "";
	for ( var i in this.groups) {
		if (this.groups[i] instanceof SNSGroup) {
			html += TemplateUtil.genHtml(this.groupTemplate, this.groups[i]);
		}
	}
	this.getContainerDom().append(html);

	var operationPanel = SNSIMWindow.getInstance().getRosterOperationPanel();
	var offset = operationPanel.getDom().offset();
	this.getDom().css("top", offset.top);
	this.getDom().css("left", offset.left - 80);

	this._bindClickEvent(operationPanel);
};

SNSAvailableGroupPanel.prototype._bindClickEvent = function(operationPanel) {
	this.getDom().find(".snsim_available_groups").bind("click", {
		panel : operationPanel
	}, function(event) {
		var operationPanel = event.data.panel;
		
		var curGroup = operationPanel.getCurrentGroup();
		var roster = operationPanel.getCurrentRoster();
		var operation = operationPanel.getCurrentOperation();
		
		var groupList = SNSApplication.getInstance().getUser().getGroupList();
		
		var targetGroup = groupList.getGroup(jQuery(this).attr("groupname"));
		
		groupList.moveRoster(roster, operation, curGroup, targetGroup);
		
		var rosterTab = SNSIMWindow.getInstance().getWideWindow().getTab("roster");
		
		if (operation == SNS_MOVE_ROSTER_TYPE.MOVE) {
			rosterTab.moveRosterBetweenGroups(roster, curGroup, targetGroup);
		} else if (operation == SNS_MOVE_ROSTER_TYPE.COPY) {
			rosterTab.addRosterToGroup(roster, targetGroup);
		}
		
	});
};

/**
 * 操作好友的浮动面板
 * @Class SNSRosterOperationPanel
 */
var SNSRosterOperationPanel = function() {

	this.selector = "#snsim_roster_operation_panel";

	/**
	 * 移动好友
	 */
	this.moveBtn = "#snsim_move_roster_btn";

	/**
	 * 复制好友
	 */
	this.copyBtn = "#snsim_copy_roster_btn";

	/**
	 * 删除好友
	 */
	this.deleteBtn = "#snsim_delete_roster_btn";

	/**
	 * 修改备注
	 */
	this.modifyNameBtn = "#snsim_modify_roster_name_btn";

	/**
	 * 新建分组
	 */
	this.createGroupBtn = "#snsim_create_group_btn";

	/**
	 * 可用组的展示面板，在移动和复制好友时
	 * @Field
	 */
	this.availableGroupsPanel = new SNSAvailableGroupPanel();

	/**
	 * 点击其他区域时，隐藏当前Panel
	 * @Type {Number} SNSComponent.HIDE_TYPE
	 */
	this.hideFloat = SNSComponent.HIDE_TYPE.HIDE;

	/**
	 * 触发显示当前面板的Dom节点，用来计算当前面板位置
	 * @Type jQueryDom
	 */
	this._triggerDom;

	/**
	 * 当前选中的操作， move或者是copy, 在availableGroupsPanel的事件绑定中判断用
	 */
	this._currentOperation;

};

SNSRosterOperationPanel.prototype = new SNSFloatPanel();

/**
 * 初始化面板，绑定点击事件，初始化可用组面板，并调用父类的初始化代码
 * @private
 */
SNSRosterOperationPanel.prototype._init = function() {
	this._bindDomEvent();
	this.availableGroupsPanel._init();
	SNSFloatPanel.prototype._init.call(this);
};

/**
 * 暂存触发显示的Dom节点，从中获取到用户和组信息
 * @param dom {DocumentNode} 触发操作的Dom节点
 */
SNSRosterOperationPanel.prototype.attachDom = function(dom) {
	this._triggerDom = jQuery(dom);
	var offset = this.getTriggerDom().offset();
	this.getDom().css("top", offset.top + 5);
	this.getDom().css("left", offset.left - 65);
};

/**
 * 获取点击操作的界面中的用户条目DOM
 * @returns {JQueryDom}
 */
SNSRosterOperationPanel.prototype.getCurRosterDom = function() {
	var rosterDom = this.getTriggerDom().parents("li.sns_roster_list_wide_item");

	return rosterDom;
};

/**
 * 获取当前操作的用户
 * @returns {SNSRoster}
 */
SNSRosterOperationPanel.prototype.getCurrentRoster = function() {
	var id = this.getCurRosterDom().attr("rosterId");
	var roster = SNSApplication.getInstance().getUser().getRoster(id);
	return roster;
};

/**
 * 获取当前操作的组的名字
 * @returns {String}
 */
SNSRosterOperationPanel.prototype.getCurrentGroup = function() {
	return SNSApplication.getInstance().getUser().getGroupList().getGroup(this.getCurRosterDom().attr("groupname"));
};

/**
 * 获取当前的操作
 * @returns {String} move | copy， 仅在这两项中记录
 */
SNSRosterOperationPanel.prototype.getCurrentOperation = function() {
	return this._currentOperation;
};

/**
 * 在显示之前调用， 如果是默认分组，则隐藏复制好友条目
 * 如果是公共帐号分组，则隐藏移动好友和复制条目
 */
SNSRosterOperationPanel.prototype.beforeShow = function() {
	var copyBtn = jQuery(this.copyBtn);
	var groupList = SNSApplication.getInstance().getUser().getGroupList();
	
	if (this.getCurrentGroup() == groupList.groupNone || this.getCurrentGroup() instanceof SNSPublicServiceGroup) {
		copyBtn.hide();
	} else {
		copyBtn.show();
	}
	
	var moveBtn = jQuery(this.moveBtn);
	
	if (this.getCurrentGroup() instanceof SNSPublicServiceGroup) {
		moveBtn.hide();
	} else {
		moveBtn.show();
	}
};

/**
 * 绑定操作条目绑定事件
 */
SNSRosterOperationPanel.prototype._bindDomEvent = function() {
	// 绑定移动好友事件
	jQuery(this.moveBtn).bind("click", jQuery.proxy(function(event) {
		var groups = SNSApplication.getInstance().getUser().groupList.availableGroups(this.getCurrentRoster());
		
		if (groups.length == 0) {
			return;
		}
		this.availableGroupsPanel.setGroups(groups);
		this._currentOperation = SNS_MOVE_ROSTER_TYPE.MOVE;
		this.availableGroupsPanel.show();
		event.stopPropagation();
		event.preventDefault();
	}, this));

	// 绑定复制好友事件
	jQuery(this.copyBtn).bind("click", jQuery.proxy(function(event) {
		var groups = SNSApplication.getInstance().getUser().groupList.availableGroups(this.getCurrentRoster());
		if (groups.length == 0) {
			return;
		}
		this.availableGroupsPanel.setGroups(groups);
		this._currentOperation =  SNS_MOVE_ROSTER_TYPE.COPY;
		this.availableGroupsPanel.show();
		event.stopPropagation();
		event.preventDefault();
	}, this));

	// 绑定删除好友事件
	jQuery(this.deleteBtn).bind("click", {_self : this}, function(event){
		SNSIMWindow.getInstance().getDialog().set(DIALOG_TYPE.CONFIRM, SNS_I18N.subscribe_remove + event.data._self.getCurrentRoster().name,
			function(){
				var rosterTab = SNSIMWindow.getInstance().getWideWindow().getTab("roster");
//				rosterTab.removeRoster(this.getCurrentRoster());
				SNSApplication.getInstance().getGlobalEventManager().trigger(SNS_EVENT_SUBJECT.ON_REMOVE_ROSTER, [ {roster:this.getCurrentRoster()} ]);
				SNSIMWindow.getInstance().getDialog().hide();
			}, event.data._self);
		SNSIMWindow.getInstance().getDialog().show();
	});
	
	// 绑定修改备注事件
	jQuery(this.modifyNameBtn).bind("click", {_self : this}, function(event){
		SNSIMWindow.getInstance().getDialog().set(DIALOG_TYPE.PROMPT, SNS_I18N.roster_rename.replace("#", event.data._self.getCurrentRoster().name),
			function(){
				var rosterTab = SNSIMWindow.getInstance().getWideWindow().getTab("roster");
				var roster = this.getCurrentRoster();
				var _name = SNSIMWindow.getInstance().getDialog().getInput();
				roster.name = _name.trim();
				rosterTab.renameRoster(roster);
				SNSIMWindow.getInstance().getDialog().hide();
			}, event.data._self);
		SNSIMWindow.getInstance().getDialog().show();
	});
	
	// 绑定新建分组事件
	jQuery(this.createGroupBtn).bind("click", {_self : this}, function(event){
		SNSIMWindow.getInstance().getDialog().set(DIALOG_TYPE.PROMPT, SNS_I18N.group_name,
			function(){
				var group = new SNSGroup(SNSIMWindow.getInstance().getDialog().getInput());
				SNSApplication.getInstance().getUser().groupList.addGroup(group);
				var rosterTab = SNSIMWindow.getInstance().getWideWindow().getTab("roster");
				rosterTab.addGroup(group);
				SNSIMWindow.getInstance().getDialog().hide();
			}, event.data._self);
		SNSIMWindow.getInstance().getDialog().show();
	});
};
var SNSPresencePanel = function() {
	this.selector = "#snsim_layer_presence_panel";
	this.triggerSelector = ".snsim_user_presence_btn";
	
	this.presenceItemSelector = "#snsim_layer_presence_panel li a.setting_cho";
	this.hideFloat = SNSComponent.HIDE_TYPE.HIDE;
};

SNSPresencePanel.prototype = new SNSFloatPanel();

SNSPresencePanel.prototype._init = function() {
	SNSFloatPanel.prototype._init.call(this);
	if(!this._isEventBound){
		this._bindPreseceBtnEvent();
		this._bindPresenceItemEvent();
		this._isEventBound = true;
	}
};

SNSPresencePanel.prototype._bindPreseceBtnEvent = function() {
	jQuery(this.triggerSelector).bind("click", jQuery.proxy(function(event) {
		var offset = jQuery(event.currentTarget).offset();
		if(SNSIMWindow.getInstance().getWideWindow().visible()){
			this.getDom().css("top",offset.top-111);
			this.getDom().css("left",offset.left-76);
		}else{
			this.getDom().css("top",offset.top+1);
			this.getDom().css("left",offset.left-66);
		}
		this.toggle();
	}, this));
};

SNSPresencePanel.prototype._bindPresenceItemEvent = function() {
	jQuery(this.presenceItemSelector).bind("click", function() {
		var dom = jQuery(this);
		var presence = dom.attr("presence");
		var user = SNSApplication.getInstance().getUser();
		user.setPresence(presence, true);
	});
};

var SNSPresenceRender = function() {
	this.userPresenceSelector = ".snsim_user_presence";
	this.userPresenceTextSelector = ".snsim_user_presence_text";
	this.rosterPresenceSelector = ".snsim_roster_presence";
	this.allStatusClass = (function() {
		var classstr = "";
		for ( var i in SNS_STATUS) {
			if (SNS_STATUS[i] && typeof SNS_STATUS[i] == "string") {
				classstr += " snsim_" + SNS_STATUS[i];
			}
		}
		return classstr;
	})();

	this.presencePanel = new SNSPresencePanel();
};

SNSPresenceRender.prototype._init = function() {
	SNSApplication.getInstance().getGlobalEventManager().registerEventHandler(SNS_EVENT_SUBJECT.AFTER_CONNECT, true,
			this.presencePanel._init, this.presencePanel);

	SNSApplication.getInstance().getGlobalEventManager().registerEventHandler(SNS_EVENT_SUBJECT.ON_USER_PRESENCE_CHANGE, true,
			this.updateUserPresence, this);
	
	SNSApplication.getInstance().getGlobalEventManager().registerEventHandler(SNS_EVENT_SUBJECT.ON_ROSTER_PRESENCE_CHANGE, true,
			this.updateRosterPresence, this);
};

SNSPresenceRender.prototype.onConnected = function() {
	var user = SNSApplication.getInstance().getUser();
	if (user.presence.status == SNS_STATUS.UNAVAILABLE) {
		jQuery.when(user.setPresence(SNS_STATUS.AVAILABLE, true)).done(jQuery.proxy(this.updateUserPresence, this)).fail(function() {
			YYIMChat.log("change user presence fail");
		});
		this.updateUserPresence();
	}
};

SNSPresenceRender.prototype.updateUserPresence = function() {
	var userPresence = SNSApplication.getInstance().getUser().presence;

	jQuery(this.userPresenceTextSelector).text(SNS_ONLINE_SHOW[userPresence.status.toUpperCase()]);

	var userPresenceDom = jQuery(this.userPresenceSelector);

	userPresenceDom.removeClass(this.allStatusClass);
	userPresenceDom.addClass("snsim_" + userPresence.status);
};

SNSPresenceRender.prototype.updateRosterPresence = function(event, oArg) {

	var roster = oArg.target;
	var presence = roster.presence;

	var presenceDoms = jQuery("li[id$='_" + roster.getID() + "'] " + this.rosterPresenceSelector);
	presenceDoms.removeClass(this.allStatusClass);
	presenceDoms.addClass("snsim_" + presence.status);
	
	var narrowContainer = jQuery("#narrow_roster_container");
	if(roster.groups.length>0){
		  for(var i = 0;i<roster.groups.length;i++){
			 var html = jQuery("#grouproster_"+roster.groups[i].name+"_"+roster.id);
			 var container = jQuery("#list_content_"+roster.groups[i].name);
			 container.prepend(html);
		  }	
		}
	var narrowHtml = jQuery("#narrow_roster_"+roster.id);
	narrowContainer.prepend(narrowHtml);
	
	// 更新分组人数
	SNSIMWindow.getInstance().getWideWindow().getTab("roster").updateGroupsInfo();
};
/**
 * 联系人的VCard展示面板
 * @Class SNSVCardPanel
 */
var SNSVCardPanel = function(roster) {
	this.roster = roster;
	this.selector = "#snsim_float_panel_vcard_"+roster.getID();
	SNSVCardPanel.panelList._add(this.roster.getID(), this);
	this.mouseover = false;
};

SNSVCardPanel.idPrefix = "snsim_float_panel_vcard_";
/**
 * vcard的浮动面板的模板
 * @static 
 */
SNSVCardPanel.template = 
	'<div id="'+ SNSVCardPanel.idPrefix +'##{{roster.getID()}}" class="roster_info" style="display:none;">'
		+ '<div class="snsim_list_head snsim_head_30 roster_info_head" >'
			+ '<img width="36" height="36" src="##{{roster.getPhotoUrl()}}" class="snsim_user_item_img">'
			+ '<div style="height: 39px; margin: -24px 0 -29px 60px;"><span class="user_name">##{{roster.name}}</span></div>' 
		+ '</div>'
		+ '<div class="snsim_vcard_info">'
			+'<ul class="snsim_vcard_info_basic">##{{buildInfoListHtml()}}' 
			+ '</ul>' 
		+ '</div>' 
	+ '</div>';

SNSVCardPanel.prototype = new SNSFloatPanel();
/**
 * 保存已经创建的浮动面板
 * @Type {SNSBaseList}
 */
SNSVCardPanel.panelList = new SNSBaseList();

/**
 * 根据联系人获取对应的VCard浮动面板，若不存在则新建一个
 * @param roster {SNSRoster|JSJaCJID|String}
 * @returns {SNSVCardPanel} 
 */
SNSVCardPanel.getInstance = function(roster){
	var rosterId = roster.id? roster.id: roster;
	var panel =  SNSVCardPanel.panelList._get(rosterId);
	if(!panel){
		if(!(roster instanceof SNSRoster)){
			roster = SNSApplication.getInstance().getUser().getRoster(rosterId);
		}
		return new SNSVCardPanel(roster);
	}
	return panel;
}

/**
 * 根据指定DOM对象的位置， 显示浮动面板, 显示之前触发BEFORE_VCARD_SHOW全局事件
 * @param dom {jQueryDom} 指定的DOM，面板出现的位置根据此DOM计算
 * @return {SNSVCardPanel}
 */
SNSVCardPanel.prototype.show = function(target) {
	if(this.roster instanceof SNSPublicAccountRoster || this.roster instanceof SNSPublicServiceRoster){
		return;
	}
	var that = this;
	if(!this.roster.vcard){
		jQuery.when(this.roster.queryVCard()).done(jQuery.proxy(function(){
			buildDom();
		},this));
	}else{
		buildDom();
		this.showWhenVcardRequest(target);
	}
	
	function buildDom() {
		if (that.getDom().length == 0) {
			var html = that.buildHtml();
			jQuery("body").append(html);
			that._bindDomEvent();
			if(that.mouseover){
				that.showWhenVcardRequest(target);
			}
		}
	}
};

SNSVCardPanel.prototype.showWhenVcardRequest = function(target){
	if(target){
		var offset = jQuery(target).offset();
		
		this.getDom().css("top",offset.top - 10);
		this.getDom().css("left",offset.left-230);
	}
	
	SNSComponent.prototype.show.call(this);
	//this.showing = false;
	return this;
};

/**
 * 为Dom绑定事件， 如mouseover  mouseout
 */
SNSVCardPanel.prototype._bindDomEvent = function(){
	//鼠标移到vcardPanel上， 展示VCard
	this.getDom().bind("mouseenter",{roster:this.roster}, function(event){
		var roster = event.data.roster;
		var vcardPanel = SNSVCardPanel.getInstance(roster);
		vcardPanel.mouseover = true;
		vcardPanel.show();
	});
	
	//鼠标移到vcardPanel外, 隐藏VCard
	this.getDom().bind("mouseleave",{roster:this.roster}, function(event){
		var roster = event.data.roster;
		var vcardPanel = SNSVCardPanel.getInstance(roster);
		vcardPanel.mouseover = false;
		vcardPanel.hide();
	});
};

/**
 * 根据用户的VCard中的信息拼接对应的HTML
 */
SNSVCardPanel.prototype.buildInfoListHtml = function() {
	
	var tpl = "";
	for (var i = 0; i < this.roster.vcard.showpropList.length; i++) {
		var prop = this.roster.vcard.showpropList[i];
		var propName = SNS_LANG_TEMPLATE["vcard_" + prop.replace(".", "_")];
		var propValue = this.roster.vcard[prop];
		var splitIndex = prop.indexOf(".");
		if (splitIndex != -1) {
			propValue = this.roster.vcard[prop.substr(0, splitIndex)][prop.substr(splitIndex + 1)];
		}
		
		propValue = propValue ? propValue : "";
		
		tpl += "<li><span style=\"color: #9fa5a7;\">" + propName + "</span><span style=\"color:rgb(80, 80, 80);margin-left: 22px;\">" + propValue + "</span></li>";
	}
	return tpl;
}

/**
 * 生成Panel对应的HTML字符串并返回
 * @returns {String} 该Panel对应的HTML字符串
 */
SNSFloatPanel.prototype.buildHtml = function() {
	return TemplateUtil.genHtml(this.getTemplate(), this);
};

SNSVCardPanel.prototype.getTemplate = function() {
	return SNSVCardPanel.template;
};
var SNSIMWindow = function(code) {

	if (!code || code !== "SNSIMWindow cannot be new, use SNSApplication.getInstance() instead.") {
		throw "SNSIMWindow cannot be new, use SNSApplication.getInstance() instead.";
	}

	this.selector = "#sns_webim";

	this.foldButtonSelector = ".snsim_toggle_fold_btn";
	// 聊天窗体
	this.chatBoxSelector = ".snsim_chat_box";
	
	this.coverlayer = '#snsim_coverlayer';

	this._narrowWindow = new SNSNarrowWindow();
	this._wideWindow = new SNSWideWindow();
	this._chatWindow = new SNSChatWindow();
	this._miniChatWindow = new SNSMiniChatWindow();
	this._invitationWindow = new SNSInvitationWindow();
	
	this._presenceRender = new SNSPresenceRender();
	
	this._reconnectPanel = new SNSReconnectPanel();
	this._unreadMessagePanel = new SNSUnreadMessagePanel();
	
	this._rosterOperationPanel = new SNSRosterOperationPanel();
	
	this._chatroomMembersPanel = new SNSMemberListPanel();
	
	this._dialog = new SNSDialog();
	
	this._imgPreviewPanel = new SNSImagePreviewPanel();
	
	this._chatRoomController = new SNSChatRoomController();
	this._subscribeController = new SNSSubscribeController();
	
	jQuery("#snsim_tab_content_roster").perfectScrollbar();
	jQuery("#snsim_tab_content_chatroom").perfectScrollbar();
};

SNSIMWindow.prototype = new SNSWindow();

SNSIMWindow.prototype._bindClickEmptyAreaEvent = function(){
	jQuery("body").bind("click",function(event){
		SNSApplication.getInstance().getGlobalEventManager().trigger(SNS_EVENT_SUBJECT.HIDE_FLOAT, [{event:event}]);
	});
};

SNSIMWindow.prototype._bindFoldEvent = function() {
	var btn = jQuery(this.foldButtonSelector);
	btn.bind("click", jQuery.proxy(function() {
		this._toggleNarrowWideWindow();
	}, this));
};

/**
 * 20160423 宽窄版 切换
 */
SNSIMWindow.prototype._initNarrowWideWindow = function(){
	var win = window.localStorage.getItem(YYIMChat.getUserNode() + '_window');
	if(win && win === 'narrow'){
		jQuery(this._narrowWindow.rosterContainerSelector).parent().css("height",jQuery(window).height() - 80);// 80为窄板上部和底部的高度和 
		this._wideWindow.hide();
		this._narrowWindow.show();
		this._chatWindow.transPosition(false);
		window.localStorage.setItem(YYIMChat.getUserNode() + '_window', 'narrow');
	}else{
		this._wideWindow.show();
		this._narrowWindow.hide();
		this._chatWindow.transPosition(true);
		window.localStorage.setItem(YYIMChat.getUserNode() + '_window', 'wide');
	}
};

SNSIMWindow.prototype._toggleNarrowWideWindow = function() {
	if (this._narrowWindow.visible()) {
//		jQuery(this.chatBoxSelector).css("margin-right", "44px");
//		jQuery(this.chatBoxSelector).css("margin-top", "70px");
		this._wideWindow.show();
		this._narrowWindow.hide();
		this._chatWindow.transPosition(true);
		
		window.localStorage.setItem(YYIMChat.getUserNode() + '_window', 'wide');
	} else {
//		jQuery(this.chatBoxSelector).css("margin-right", "96px");
//		jQuery(this.chatBoxSelector).css("margin-bottom", "49px");
		jQuery(this._narrowWindow.rosterContainerSelector).parent().css("height",jQuery(window).height() - 80);// 80为窄板上部和底部的高度和 
		this._wideWindow.hide();
		this._narrowWindow.show();
		this._chatWindow.transPosition(false);
		
		window.localStorage.setItem(YYIMChat.getUserNode() + '_window', 'narrow');
	}
};

SNSIMWindow.prototype._toggleMiniChatWindow = function() {
	if (this._miniChatWindow.visible()) {
		this._chatWindow.show();
		this._miniChatWindow.hide();
	} else {
		this._chatWindow.hide();
		this._miniChatWindow.show();
	}
};

SNSIMWindow.prototype.getMiniChatWindow = function() {
	return this._miniChatWindow;
};

SNSIMWindow.prototype.getChatWindow = function() {
	return this._chatWindow;
};

SNSIMWindow.prototype.getWideWindow = function() {
	return this._wideWindow;
};

SNSIMWindow.prototype.getNarrowWindow = function() {
	return this._narrowWindow;
};

SNSIMWindow.prototype.getInvitationWindow = function(){
	return this._invitationWindow;
};

SNSIMWindow.prototype.getPresenceRender = function(){
	return this._presenceRender;
};

SNSIMWindow.prototype.getReconnectPanel = function(){
	return 	this._reconnectPanel;
};

SNSIMWindow.prototype.getUnreadMessagePanel = function(){
	return this._unreadMessagePanel;
}

SNSIMWindow.prototype.getRosterOperationPanel = function(){
	return 	this._rosterOperationPanel;
};

SNSIMWindow.prototype.getChatroomMembersPanel = function(){
	return this._chatroomMembersPanel;
};

SNSIMWindow.prototype.getDialog = function(){
	return this._dialog;
};

SNSIMWindow.prototype.getImgPreviewPanel = function(){
	return this._imgPreviewPanel;
};

SNSIMWindow.prototype.getChatRoomController = function(){
	return this._chatRoomController;
};
SNSIMWindow.prototype.getSubscribeController = function(){
	return this._subscribeController;
};

SNSIMWindow.prototype.onConnected = function() {
	this.show();
	this._wideWindow.show();
	//this._presenceRender.onConnected();
};

SNSIMWindow.getInstance = function() {

	if (!SNSIMWindow._instance) {
		SNSIMWindow._instance = new SNSIMWindow("SNSIMWindow cannot be new, use SNSApplication.getInstance() instead.");
		
		SNSApplication._instance.getGlobalEventManager().registerEventHandler(SNS_EVENT_SUBJECT.AFTER_CONNECT, false,
				SNSIMWindow.getInstance().onConnected, SNSIMWindow.getInstance());
		SNSIMWindow._instance._bindFoldEvent();
		SNSIMWindow._instance._bindClickEmptyAreaEvent();
		
		for ( var i in SNSIMWindow._instance) {
			var prop = SNSIMWindow._instance[i];
			if (prop && prop._init && typeof prop._init == "function") {
				prop._init();
			}
		}
	}
	return SNSIMWindow._instance;
};

/*
 * 显示或隐藏弹出框蒙板
 */
SNSIMWindow.prototype.cover = {
	show: function() {
		jQuery("#snsim_coverlayer").show();
	},
	hide: function() {
		jQuery("#snsim_coverlayer").hide();
	}
}

//拖放程序
var Drag = function(drag, options) {
	this.initialize(drag, options);
};
// 拖放对象
Drag.prototype.initialize = function(drag, options) {
	this.Drag = SNSAvatarCropper.getInstance().getElement(drag);// 拖放对象
	this._x = this._y = 0;// 记录鼠标相对拖放对象的位置
	this._marginLeft = this._marginTop = 0;// 记录margin
	// 事件对象(用于绑定移除事件)
	this._fM = SNSAvatarCropper.getInstance().bindAsEventListener(this, this.Move);
	this._fS = SNSAvatarCropper.getInstance().bind(this, this.Stop);

	this.SetOptions(options);

	this.Limit = !!this.options.Limit;
	this.mxLeft = parseInt(this.options.mxLeft);
	this.mxRight = parseInt(this.options.mxRight);
	this.mxTop = parseInt(this.options.mxTop);
	this.mxBottom = parseInt(this.options.mxBottom);

	this.LockX = !!this.options.LockX;
	this.LockY = !!this.options.LockY;
	this.Lock = !!this.options.Lock;

	this.onStart = this.options.onStart;
	this.onMove = this.options.onMove;
	this.onStop = this.options.onStop;

	this._Handle = SNSAvatarCropper.getInstance().getElement(this.options.Handle) || this.Drag;
	this._mxContainer = SNSAvatarCropper.getInstance().getElement(this.options.mxContainer) || null;

	this.Drag.style.position = "absolute";
	// 透明
	if (isIE && !!this.options.Transparent) {
		// 填充拖放对象
		with (this._Handle.appendChild(document.createElement("div")).style) {
			width = height = "100%";
			backgroundColor = "#fff";
			filter = "alpha(opacity:0)";
			fontSize = 0;
		}
	}
	// 修正范围
	this.Repair();
	SNSAvatarCropper.getInstance().addEventHandler(this._Handle, "mousedown", SNSAvatarCropper.getInstance().bindAsEventListener(this,
			this.Start));
};
// 设置默认属性
Drag.prototype.SetOptions = function(options) {
	this.options = {// 默认值
		Handle : "",// 设置触发对象（不设置则使用拖放对象）
		Limit : false,// 是否设置范围限制(为true时下面参数有用,可以是负数)
		mxLeft : 0,// 左边限制
		mxRight : 9999,// 右边限制
		mxTop : 0,// 上边限制
		mxBottom : 9999,// 下边限制
		mxContainer : "",// 指定限制在容器内
		LockX : false,// 是否锁定水平方向拖放
		LockY : false,// 是否锁定垂直方向拖放
		Lock : false,// 是否锁定
		Transparent : false,// 是否透明
		onStart : function() {
		},// 开始移动时执行
		onMove : function() {
		},// 移动时执行
		onStop : function() {
		}// 结束移动时执行
	};
	SNSAvatarCropper.getInstance().extend(this.options, options || {});
};
// 准备拖动
Drag.prototype.Start = function(oEvent) {
	if (this.Lock) {
		return;
	}
	this.Repair();
	// 记录鼠标相对拖放对象的位置
	this._x = oEvent.clientX - this.Drag.offsetLeft;
	this._y = oEvent.clientY - this.Drag.offsetTop;
	// 记录margin
	this._marginLeft = parseInt(SNSAvatarCropper.getInstance().currentStyle(this.Drag).marginLeft) || 0;
	this._marginTop = parseInt(SNSAvatarCropper.getInstance().currentStyle(this.Drag).marginTop) || 0;
	// mousemove时移动 mouseup时停止
	SNSAvatarCropper.getInstance().addEventHandler(document, "mousemove", this._fM);
	SNSAvatarCropper.getInstance().addEventHandler(document, "mouseup", this._fS);
	if (isIE) {
		// 焦点丢失
		SNSAvatarCropper.getInstance().addEventHandler(this._Handle, "losecapture", this._fS);
		// 设置鼠标捕获
		this._Handle.setCapture();
	} else {
		// 焦点丢失
		SNSAvatarCropper.getInstance().addEventHandler(window, "blur", this._fS);
		// 阻止默认动作
		oEvent.preventDefault();
	}
	;
	// 附加程序
	this.onStart();
};
// 修正范围
Drag.prototype.Repair = function() {
	if (this.Limit) {
		// 修正错误范围参数
		this.mxRight = Math.max(this.mxRight, this.mxLeft
				+ this.Drag.offsetWidth);
		this.mxBottom = Math.max(this.mxBottom, this.mxTop
				+ this.Drag.offsetHeight);
		// 如果有容器必须设置position为relative或absolute来相对或绝对定位，并在获取offset之前设置
		!this._mxContainer
				|| SNSAvatarCropper.getInstance().currentStyle(this._mxContainer).position == "relative"
				|| SNSAvatarCropper.getInstance().currentStyle(this._mxContainer).position == "absolute"
				|| (this._mxContainer.style.position = "relative");
	}
};
// 拖动
Drag.prototype.Move = function(oEvent) {
	// 判断是否锁定
	if (this.Lock) {
		this.Stop();
		return;
	}
	;
	// 清除选择
	window.getSelection ? window.getSelection().removeAllRanges()
			: document.selection.empty();
	// 设置移动参数
	var iLeft = oEvent.clientX - this._x, iTop = oEvent.clientY - this._y;
	// 设置范围限制
	if (this.Limit) {
		// 设置范围参数
		var mxLeft = this.mxLeft, mxRight = this.mxRight, mxTop = this.mxTop, mxBottom = this.mxBottom;
		// 如果设置了容器，再修正范围参数
		if (!!this._mxContainer) {
			mxLeft = Math.max(mxLeft, 0);
			mxTop = Math.max(mxTop, 0);
			mxRight = Math.min(mxRight, this._mxContainer.clientWidth);
			mxBottom = Math.min(mxBottom, this._mxContainer.clientHeight);
		}
		;
		// 修正移动参数
		iLeft = Math.max(Math.min(iLeft, mxRight - this.Drag.offsetWidth),
				mxLeft);
		iTop = Math.max(Math.min(iTop, mxBottom - this.Drag.offsetHeight),
				mxTop);
	}
	// 设置位置，并修正margin
	if (!this.LockX) {
		this.Drag.style.left = iLeft - this._marginLeft + "px";
	}
	if (!this.LockY) {
		this.Drag.style.top = iTop - this._marginTop + "px";
	}
	// 附加程序
	this.onMove();
};
// 停止拖动
Drag.prototype.Stop = function() {
	// 移除事件
	SNSAvatarCropper.getInstance().removeEventHandler(document, "mousemove", this._fM);
	SNSAvatarCropper.getInstance().removeEventHandler(document, "mouseup", this._fS);
	if (isIE) {
		SNSAvatarCropper.getInstance().removeEventHandler(this._Handle, "losecapture", this._fS);
		this._Handle.releaseCapture();
	} else {
		SNSAvatarCropper.getInstance().removeEventHandler(window, "blur", this._fS);
	}
	// 附加程序
	this.onStop();
};

//缩放程序
var Resize = function(obj, options) {
	this.initialize(obj, options);
};
// 缩放对象
Resize.prototype.initialize = function(obj, options) {
	this._obj = SNSAvatarCropper.getInstance().getElement(obj);// 缩放对象

	this._styleWidth = this._styleHeight = this._styleLeft = this._styleTop = 0;// 样式参数
	this._sideRight = this._sideDown = this._sideLeft = this._sideUp = 0;// 坐标参数
	this._fixLeft = this._fixTop = 0;// 定位参数
	this._scaleLeft = this._scaleTop = 0;// 定位坐标

	this._mxSet = function() {
	};// 范围设置程序
	this._mxRightWidth = this._mxDownHeight = this._mxUpHeight = this._mxLeftWidth = 0;// 范围参数
	this._mxScaleWidth = this._mxScaleHeight = 0;// 比例范围参数

	this._fun = function() {
	};// 缩放执行程序

	// 获取边框宽度
	var _style = SNSAvatarCropper.getInstance().currentStyle(this._obj);
	this._borderX = (parseInt(_style.borderLeftWidth) || 0)
			+ (parseInt(_style.borderRightWidth) || 0);
	this._borderY = (parseInt(_style.borderTopWidth) || 0)
			+ (parseInt(_style.borderBottomWidth) || 0);
	// 事件对象(用于绑定移除事件)
	this._fR = SNSAvatarCropper.getInstance().bindAsEventListener(this, this.Resize);
	this._fS = SNSAvatarCropper.getInstance().bind(this, this.Stop);

	this.SetOptions(options);
	// 范围限制
	this.Max = !!this.options.Max;
	this._mxContainer = SNSAvatarCropper.getInstance().getElement(this.options.mxContainer) || null;
	this.mxLeft = Math.round(this.options.mxLeft);
	this.mxRight = Math.round(this.options.mxRight);
	this.mxTop = Math.round(this.options.mxTop);
	this.mxBottom = Math.round(this.options.mxBottom);
	// 宽高限制
	this.Min = !!this.options.Min;
	this.minWidth = Math.round(this.options.minWidth);
	this.minHeight = Math.round(this.options.minHeight);
	// 按比例缩放
	this.Scale = !!this.options.Scale;
	this.Ratio = Math.max(this.options.Ratio, 0);

	this.onResize = this.options.onResize;

	this._obj.style.position = "absolute";
	!this._mxContainer
			|| SNSAvatarCropper.getInstance().currentStyle(this._mxContainer).position == "relative"
			|| (this._mxContainer.style.position = "relative");
};
// 设置默认属性
Resize.prototype.SetOptions = function(options) {
	this.options = {// 默认值
		Max : false,// 是否设置范围限制(为true时下面mx参数有用)
		mxContainer : "",// 指定限制在容器内
		mxLeft : 0,// 左边限制
		mxRight : 9999,// 右边限制
		mxTop : 0,// 上边限制
		mxBottom : 9999,// 下边限制
		Min : false,// 是否最小宽高限制(为true时下面min参数有用)
		minWidth : 50,// 最小宽度
		minHeight : 50,// 最小高度
		Scale : false,// 是否按比例缩放
		Ratio : 0,// 缩放比例(宽/高)
		onResize : function() {
		}// 缩放时执行
	};
	SNSAvatarCropper.getInstance().extend(this.options, options || {});
};
// 设置触发对象
Resize.prototype.Set = function(resize, side) {
	var resize = SNSAvatarCropper.getInstance().getElement(resize), fun;
	if (!resize)
		return;
	// 根据方向设置
	switch (side.toLowerCase()) {
	case "up":
		fun = this.Up;
		break;
	case "down":
		fun = this.Down;
		break;
	case "left":
		fun = this.Left;
		break;
	case "right":
		fun = this.Right;
		break;
	case "left-up":
		fun = this.LeftUp;
		break;
	case "right-up":
		fun = this.RightUp;
		break;
	case "left-down":
		fun = this.LeftDown;
		break;
	case "right-down":
	default:
		fun = this.RightDown;
	}
	;
	// 设置触发对象
	SNSAvatarCropper.getInstance().addEventHandler(resize, "mousedown", SNSAvatarCropper.getInstance().bindAsEventListener(this, this.Start,
			fun));
};
// 准备缩放
Resize.prototype.Start = function(e, fun, touch) {
	// 防止冒泡(跟拖放配合时设置)
	e.stopPropagation ? e.stopPropagation() : (e.cancelBubble = true);
	// 设置执行程序
	this._fun = fun;
	// 样式参数值
	this._styleWidth = this._obj.clientWidth;
	this._styleHeight = this._obj.clientHeight;
	this._styleLeft = this._obj.offsetLeft;
	this._styleTop = this._obj.offsetTop;
	// 四条边定位坐标
	this._sideLeft = e.clientX - this._styleWidth;
	this._sideRight = e.clientX + this._styleWidth;
	this._sideUp = e.clientY - this._styleHeight;
	this._sideDown = e.clientY + this._styleHeight;
	// top和left定位参数
	this._fixLeft = this._styleLeft + this._styleWidth;
	this._fixTop = this._styleTop + this._styleHeight;
	// 缩放比例
	if (this.Scale) {
		// 设置比例
		this.Ratio = Math.max(this.Ratio, 0) || this._styleWidth
				/ this._styleHeight;
		// left和top的定位坐标
		this._scaleLeft = this._styleLeft + this._styleWidth / 2;
		this._scaleTop = this._styleTop + this._styleHeight / 2;
	}
	;
	// 范围限制
	if (this.Max) {
		// 设置范围参数
		var mxLeft = this.mxLeft, mxRight = this.mxRight, mxTop = this.mxTop, mxBottom = this.mxBottom;
		// 如果设置了容器，再修正范围参数
		if (!!this._mxContainer) {
			mxLeft = Math.max(mxLeft, 0);
			mxTop = Math.max(mxTop, 0);
			mxRight = Math.min(mxRight, this._mxContainer.clientWidth);
			mxBottom = Math.min(mxBottom, this._mxContainer.clientHeight);
		}
		;
		// 根据最小值再修正
		mxRight = Math.max(mxRight, mxLeft + (this.Min ? this.minWidth : 0)
				+ this._borderX);
		mxBottom = Math.max(mxBottom, mxTop + (this.Min ? this.minHeight : 0)
				+ this._borderY);
		// 由于转向时要重新设置所以写成function形式
		this._mxSet = function() {
			this._mxRightWidth = mxRight - this._styleLeft - this._borderX;
			this._mxDownHeight = mxBottom - this._styleTop - this._borderY;
			this._mxUpHeight = Math.max(this._fixTop - mxTop,
					this.Min ? this.minHeight : 0);
			this._mxLeftWidth = Math.max(this._fixLeft - mxLeft,
					this.Min ? this.minWidth : 0);
		};
		this._mxSet();
		// 有缩放比例下的范围限制
		if (this.Scale) {
			this._mxScaleWidth = Math.min(this._scaleLeft - mxLeft, mxRight
					- this._scaleLeft - this._borderX) * 2;
			this._mxScaleHeight = Math.min(this._scaleTop - mxTop, mxBottom
					- this._scaleTop - this._borderY) * 2;
		}
		;
	}
	;
	// mousemove时缩放 mouseup时停止
	SNSAvatarCropper.getInstance().addEventHandler(document, "mousemove", this._fR);
	SNSAvatarCropper.getInstance().addEventHandler(document, "mouseup", this._fS);
	if (isIE) {
		SNSAvatarCropper.getInstance().addEventHandler(this._obj, "losecapture", this._fS);
		this._obj.setCapture();
	} else {
		SNSAvatarCropper.getInstance().addEventHandler(window, "blur", this._fS);
		e.preventDefault();
	}
	;
};
// 缩放
Resize.prototype.Resize = function(e) {
	// 清除选择
	window.getSelection ? window.getSelection().removeAllRanges()
			: document.selection.empty();
	// 执行缩放程序
	this._fun(e);
	// 设置样式，变量必须大于等于0否则ie出错
	this._obj.style.width = this._styleWidth + "px";
	this._obj.style.height = this._styleHeight + "px";
	this._obj.style.top = this._styleTop + "px";
	this._obj.style.left = this._styleLeft + "px";
	// 附加程序
	this.onResize();
};
// 缩放程序
// 上
Resize.prototype.Resize.prototype.Up = function(e) {
	this.RepairY(this._sideDown - e.clientY, this._mxUpHeight);
	this.RepairTop();
	this.TurnDown(this.Down);
},
// 下
Resize.prototype.Resize.prototype.Down = function(e) {
	this.RepairY(e.clientY - this._sideUp, this._mxDownHeight);
	this.TurnUp(this.Up);
};
// 右
Resize.prototype.Right = function(e) {
	this.RepairX(e.clientX - this._sideLeft, this._mxRightWidth);
	this.TurnLeft(this.Left);
};
// 左
Resize.prototype.Resize.prototype.Left = function(e) {
	this.RepairX(this._sideRight - e.clientX, this._mxLeftWidth);
	this.RepairLeft();
	this.TurnRight(this.Right);
};
// 右下
Resize.prototype.RightDown = function(e) {
	this.RepairAngle(e.clientX - this._sideLeft, this._mxRightWidth, e.clientY
			- this._sideUp, this._mxDownHeight);
	this.TurnLeft(this.LeftDown) || this.Scale || this.TurnUp(this.RightUp);
};
// 右上
Resize.prototype.RightUp = function(e) {
	this.RepairAngle(e.clientX - this._sideLeft, this._mxRightWidth,
			this._sideDown - e.clientY, this._mxUpHeight);
	this.RepairTop();
	this.TurnLeft(this.LeftUp) || this.Scale || this.TurnDown(this.RightDown);
};
// 左下
Resize.prototype.Resize.prototype.LeftDown = function(e) {
	this.RepairAngle(this._sideRight - e.clientX, this._mxLeftWidth, e.clientY
			- this._sideUp, this._mxDownHeight);
	this.RepairLeft();
	this.TurnRight(this.RightDown) || this.Scale || this.TurnUp(this.LeftUp);
};
// 左上
Resize.prototype.LeftUp = function(e) {
	this.RepairAngle(this._sideRight - e.clientX, this._mxLeftWidth,
			this._sideDown - e.clientY, this._mxUpHeight);
	this.RepairTop();
	this.RepairLeft();
	this.TurnRight(this.RightUp) || this.Scale || this.TurnDown(this.LeftDown);
};
// 修正程序
// 水平方向
Resize.prototype.RepairX = function(iWidth, mxWidth) {
	iWidth = this.RepairWidth(iWidth, mxWidth);
	if (this.Scale) {
		var iHeight = this.RepairScaleHeight(iWidth);
		if (this.Max && iHeight > this._mxScaleHeight) {
			iHeight = this._mxScaleHeight;
			iWidth = this.RepairScaleWidth(iHeight);
		} else if (this.Min && iHeight < this.minHeight) {
			var tWidth = this.RepairScaleWidth(this.minHeight);
			if (tWidth < mxWidth) {
				iHeight = this.minHeight;
				iWidth = tWidth;
			}
		}
		this._styleHeight = iHeight;
		this._styleTop = this._scaleTop - iHeight / 2;
	}
	this._styleWidth = iWidth;
};
// 垂直方向
Resize.prototype.RepairY = function(iHeight, mxHeight) {
	iHeight = this.RepairHeight(iHeight, mxHeight);
	if (this.Scale) {
		var iWidth = this.RepairScaleWidth(iHeight);
		if (this.Max && iWidth > this._mxScaleWidth) {
			iWidth = this._mxScaleWidth;
			iHeight = this.RepairScaleHeight(iWidth);
		} else if (this.Min && iWidth < this.minWidth) {
			var tHeight = this.RepairScaleHeight(this.minWidth);
			if (tHeight < mxHeight) {
				iWidth = this.minWidth;
				iHeight = tHeight;
			}
		}
		this._styleWidth = iWidth;
		this._styleLeft = this._scaleLeft - iWidth / 2;
	}
	this._styleHeight = iHeight;
};
// 对角方向
Resize.prototype.RepairAngle = function(iWidth, mxWidth, iHeight, mxHeight) {
	iWidth = this.RepairWidth(iWidth, mxWidth);
	if (this.Scale) {
		iHeight = this.RepairScaleHeight(iWidth);
		if (this.Max && iHeight > mxHeight) {
			iHeight = mxHeight;
			iWidth = this.RepairScaleWidth(iHeight);
		} else if (this.Min && iHeight < this.minHeight) {
			var tWidth = this.RepairScaleWidth(this.minHeight);
			if (tWidth < mxWidth) {
				iHeight = this.minHeight;
				iWidth = tWidth;
			}
		}
	} else {
		iHeight = this.RepairHeight(iHeight, mxHeight);
	}
	this._styleWidth = iWidth;
	this._styleHeight = iHeight;
};
// top
Resize.prototype.RepairTop = function() {
	this._styleTop = this._fixTop - this._styleHeight;
};
// left
Resize.prototype.RepairLeft = function() {
	this._styleLeft = this._fixLeft - this._styleWidth;
};
// height
Resize.prototype.RepairHeight = function(iHeight, mxHeight) {
	iHeight = Math.min(this.Max ? mxHeight : iHeight, iHeight);
	iHeight = Math.max(this.Min ? this.minHeight : iHeight, iHeight, 0);
	return iHeight;
};
// width
Resize.prototype.RepairWidth = function(iWidth, mxWidth) {
	iWidth = Math.min(this.Max ? mxWidth : iWidth, iWidth);
	iWidth = Math.max(this.Min ? this.minWidth : iWidth, iWidth, 0);
	return iWidth;
};
// 比例高度
Resize.prototype.RepairScaleHeight = function(iWidth) {
	return Math.max(Math.round((iWidth + this._borderX) / this.Ratio
			- this._borderY), 0);
};
// 比例宽度
Resize.prototype.RepairScaleWidth = function(iHeight) {
	return Math.max(Math.round((iHeight + this._borderY) * this.Ratio
			- this._borderX), 0);
};
// 转向程序
// 转右
Resize.prototype.TurnRight = function(fun) {
	if (!(this.Min || this._styleWidth)) {
		this._fun = fun;
		this._sideLeft = this._sideRight;
		this.Max && this._mxSet();
		return true;
	}
};
// 转左
Resize.prototype.TurnLeft = function(fun) {
	if (!(this.Min || this._styleWidth)) {
		this._fun = fun;
		this._sideRight = this._sideLeft;
		this._fixLeft = this._styleLeft;
		this.Max && this._mxSet();
		return true;
	}
};
// 转上
Resize.prototype.TurnUp = function(fun) {
	if (!(this.Min || this._styleHeight)) {
		this._fun = fun;
		this._sideDown = this._sideUp;
		this._fixTop = this._styleTop;
		this.Max && this._mxSet();
		return true;
	}
};
// 转下
Resize.prototype.TurnDown = function(fun) {
	if (!(this.Min || this._styleHeight)) {
		this._fun = fun;
		this._sideUp = this._sideDown;
		this.Max && this._mxSet();
		return true;
	}
};
// 停止缩放
Resize.prototype.Stop = function() {
	SNSAvatarCropper.getInstance().removeEventHandler(document, "mousemove", this._fR);
	SNSAvatarCropper.getInstance().removeEventHandler(document, "mouseup", this._fS);
	if (isIE) {
		SNSAvatarCropper.getInstance().removeEventHandler(this._obj, "losecapture", this._fS);
		this._obj.releaseCapture();
	} else {
		SNSAvatarCropper.getInstance().removeEventHandler(window, "blur", this._fS);
	}
};

var isIE = (document.all) ? true : false;

//var isIE6 = isIE && ([ /MSIE (\d)\.0/i.exec(navigator.userAgent) ][0][1] == 6);
var SNSAvatarCropper = function(container, handle, url, options) {
	this.initialize(container, handle, url, options);
};
SNSAvatarCropper.getInstance = function(){
	return SNSAvatarCropper._instance;
};

SNSAvatarCropper.prototype.getElement = function(id) {
	return "string" == typeof id ? document.getElementById(id) : id;
};

SNSAvatarCropper.prototype.extend = function(destination, source) {
	for ( var property in source) {
		destination[property] = source[property];
	}
};

SNSAvatarCropper.prototype.bind = function(object, fun) {
	return function() {
		return fun.apply(object, arguments);
	}
};

SNSAvatarCropper.prototype.bindAsEventListener = function(object, fun) {
	var args = Array.prototype.slice.call(arguments).slice(2);
	return function(event) {
		return fun.apply(object, [ event || window.event ].concat(args));
	}
};

SNSAvatarCropper.prototype.currentStyle = function(element) {
	return element.currentStyle || document.defaultView.getComputedStyle(element, null);
};

SNSAvatarCropper.prototype.addEventHandler = function(oTarget, sEventType, fnHandler) {
	if (oTarget.addEventListener) {
		oTarget.addEventListener(sEventType, fnHandler, false);
	} else if (oTarget.attachEvent) {
		oTarget.attachEvent("on" + sEventType, fnHandler);
	} else {
		oTarget["on" + sEventType] = fnHandler;
	}
};

SNSAvatarCropper.prototype.removeEventHandler = function(oTarget, sEventType, fnHandler) {
	if (oTarget.removeEventListener) {
		oTarget.removeEventListener(sEventType, fnHandler, false);
	} else if (oTarget.detachEvent) {
		oTarget.detachEvent("on" + sEventType, fnHandler);
	} else {
		oTarget["on" + sEventType] = null;
	}
};

// 容器对象,控制层,图片地址
SNSAvatarCropper.prototype.initialize = function(container, handle, url, options) {
	SNSAvatarCropper._instance = this;
	this._Container = this.getElement(container);// 容器对象
	this._layHandle = this.getElement(handle);// 控制层
	this.Url = url;// 图片地址

	this._layBase = this._Container.appendChild(document.createElement("img"));// 底层
	this._layCropper = this._Container.appendChild(document
			.createElement("img"));// 切割层
	this._layCropper.onload = this.bind(this, this.setPos);
	// 用来设置大小
	this._tempImg = document.createElement("img");
	this._tempImg.onload = this.bind(this, this.setSize);

	this.setOptions(options);

	this.Opacity = Math.round(this.options.Opacity);
	this.Color = this.options.Color;
	this.Scale = !!this.options.Scale;
	this.Ratio = Math.max(this.options.Ratio, 0);
	this.Width = Math.round(this.options.Width);
	this.Height = Math.round(this.options.Height);

	// 设置预览对象
	var oPreview = this.getElement(this.options.Preview);// 预览对象
	if (oPreview) {
		oPreview.style.position = "relative";
		oPreview.style.overflow = "hidden";
		this.viewWidth = Math.round(this.options.viewWidth);
		this.viewHeight = Math.round(this.options.viewHeight);
		// 预览图片对象
		this._view = oPreview.appendChild(document.createElement("img"));
		this._view.style.position = "absolute";
		this._view.onload = this.bind(this, this.setPreview);
	}
	// 设置拖放
	this._drag = new Drag(this._layHandle, {
		Limit : true,
		onMove : this.bind(this, this.setPos),
		Transparent : true
	});
	// 设置缩放
	this.Resize = !!this.options.Resize;
	if (this.Resize) {
		var op = this.options, _resize = new Resize(this._layHandle, {
			Max : true,
			onResize : this.bind(this, this.setPos)
		});
		// 设置缩放触发对象
		op.RightDown && (_resize.Set(op.RightDown, "right-down"));
		op.LeftDown && (_resize.Set(op.LeftDown, "left-down"));
		op.RightUp && (_resize.Set(op.RightUp, "right-up"));
		op.LeftUp && (_resize.Set(op.LeftUp, "left-up"));
		op.Right && (_resize.Set(op.Right, "right"));
		op.Left && (_resize.Set(op.Left, "left"));
		op.Down && (_resize.Set(op.Down, "down"));
		op.Up && (_resize.Set(op.Up, "up"));
		// 最小范围限制
		this.Min = !!this.options.Min;
		this.minWidth = Math.round(this.options.minWidth);
		this.minHeight = Math.round(this.options.minHeight);
		// 设置缩放对象
		this._resize = _resize;
	}
	// 设置样式
	this._Container.style.position = "relative";
	this._Container.style.overflow = "hidden";
	this._layHandle.style.zIndex = 200;
	this._layCropper.style.zIndex = 100;
	this._layBase.style.position = this._layCropper.style.position = "absolute";
	this._layBase.style.top = this._layBase.style.left = this._layCropper.style.top = this._layCropper.style.left = 0;// 对齐
	// 初始化设置
	this.init();
};
// 设置默认属性
SNSAvatarCropper.prototype.setOptions = function(options) {
	this.options = {// 默认值
		Opacity : 50,// 透明度(0到100)
		Color : "",// 背景色
		Width : 0,// 图片高度
		Height : 0,// 图片高度
		// 缩放触发对象
		Resize : false,// 是否设置缩放
		Right : "",// 右边缩放对象
		Left : "",// 左边缩放对象
		Up : "",// 上边缩放对象
		Down : "",// 下边缩放对象
		RightDown : "",// 右下缩放对象
		LeftDown : "",// 左下缩放对象
		RightUp : "",// 右上缩放对象
		LeftUp : "",// 左上缩放对象
		Min : true,// 是否最小宽高限制(为true时下面min参数有用)
		minWidth : 50,// 最小宽度
		minHeight : 50,// 最小高度
		Scale : true,// 是否按比例缩放
		Ratio : 1,// 缩放比例(宽/高)
		// 预览对象设置
		Preview : "",// 预览对象
		viewWidth : 0,// 预览宽度
		viewHeight : 0
	// 预览高度
	};
	this.extend(this.options, options || {});
};
// 初始化对象
SNSAvatarCropper.prototype.init = function() {
	// 设置背景色
	this.Color && (this._Container.style.backgroundColor = this.Color);
	// 设置图片
	this._tempImg.src = this._layBase.src = this._layCropper.src = this.Url;
	// 设置透明
	if (isIE) {
		this._layBase.style.filter = "alpha(opacity:" + this.Opacity + ")";
	} else {
		this._layBase.style.opacity = this.Opacity / 100;
	}
	// 设置预览对象
	this._view && (this._view.src = this.Url);
	// 设置缩放
	if (this.Resize) {
		with (this._resize) {
			Scale = this.Scale;
			Ratio = this.Ratio;
			Min = this.Min;
			minWidth = this.minWidth;
			minHeight = this.minHeight;
		}
	}
};
// 设置切割样式
SNSAvatarCropper.prototype.setPos = function() {
	// ie6渲染bug
	/*if (isIE6) {
		with (this._layHandle.style) {
			zoom = .9;
			zoom = 1;
		}
	}*/
	// 获取位置参数
	var p = this.getPos();
	// 按拖放对象的参数进行切割
	this._layCropper.style.clip = "rect(" + p.Top + "px " + (p.Left + p.Width)
			+ "px " + (p.Top + p.Height) + "px " + p.Left + "px)";
	// 设置预览
	this.setPreview();
};
// 设置预览效果
SNSAvatarCropper.prototype.setPreview = function() {
	if (this._view) {
		// 预览显示的宽和高
		var p = this.getPos(), s = this.getSize(p.Width, p.Height,
				this.viewWidth, this.viewHeight), scale = s.Height / p.Height;
		// 按比例设置参数
		var pHeight = this._layBase.height * scale, pWidth = this._layBase.width
				* scale, pTop = p.Top * scale, pLeft = p.Left * scale;
		// 设置预览对象
		// 设置样式
		this._view.style.width = pWidth + "px";
		this._view.style.height = pHeight + "px";
		this._view.style.top = -pTop + "px ";
		this._view.style.left = -pLeft + "px";
		// 切割预览图
		this._view.style.clip = "rect(" + pTop + "px " + (pLeft + s.Width) + "px "
				+ (pTop + s.Height) + "px " + pLeft + "px)";
	}
};
// 设置图片大小
SNSAvatarCropper.prototype.setSize = function() {
	var s = this.getSize(this._tempImg.width, this._tempImg.height, this.Width,
			this.Height);
	// 设置底图和切割图
	this._layBase.style.width = this._layCropper.style.width = s.Width + "px";
	this._layBase.style.height = this._layCropper.style.height = s.Height
			+ "px";
	// 设置拖放范围
	this._drag.mxRight = s.Width;
	this._drag.mxBottom = s.Height;
	// 设置缩放范围
	if (this.Resize) {
		this._resize.mxRight = s.Width;
		this._resize.mxBottom = s.Height;
	}
};
// 获取当前样式
SNSAvatarCropper.prototype.getPos = function() {
	with (this._layHandle) {
		return {
			startX : offsetLeft,
			startY : offsetTop,
			endX : offsetLeft + offsetWidth,
			endY : offsetTop + offsetHeight
		}
	}
};
// 获取尺寸
SNSAvatarCropper.prototype.getSize = function(nowWidth, nowHeight, fixWidth,fixHeight) {
	var iWidth = nowWidth, iHeight = nowHeight, scale = iWidth / iHeight;
	// 按比例设置
	if (fixHeight) {
		iWidth = (iHeight = fixHeight) * scale;
	}
	if (fixWidth && (!fixHeight || iWidth > fixWidth)) {
		iHeight = (iWidth = fixWidth) / scale;
	}
	// 返回尺寸对象
	return {
		Width : iWidth,
		Height : iHeight
	}
};
var SNSCapturePlugin = function() {
	
	this.name="capturePlugin";
	
	this.enable = true;

	this.triggerBtn;
	
	this.loadPeriod = SNS_EVENT_SUBJECT.AFTER_CONNECT;
	
};

SNSCapturePlugin.prototype = new SNSPlugin();

SNSCapturePlugin.prototype._init = function() {
};

SNSCapturePlugin.getInstance = function(){
	return SNSCapturePlugin._instance;
}
new SNSCapturePlugin().start();


﻿var udCapCtl = null; //插件对象
var UDCAPTURE_VERSION = "1.6.0"; //当前最新的控件版本号
var UDCAPTURE_MIME_TYPE = "application/udcapture-plugin"; //mimeType
var UDCAPTURE_LICENSE = ""; //注册授权许可号
var UDCAPTURE_SETUP = "http://static.uudoc.com/files/UdCapture/UdCapture.msi"; //安装文件

var supportActiveX = (window.ActiveXObject !== undefined); //是否支持ActiveX,IE
if (supportActiveX && (window.navigator.platform == "Win64" || window.navigator.cpuClass == "x64"))//64位浏览器安装文件
	UDCAPTURE_SETUP = "http://static.uudoc.com/files/UdCapture/UdCapture64.msi";

var controlLoaded = false; //是否已经加载

//版本比较，检查是否安装了新版本
function f_hasNewVer(instVer) {
	if (instVer.substring(0, 1) == 'v') {
		instVer = instVer.substring(1, instVer.length);
	}

	var newVer = UDCAPTURE_VERSION.split(".");
	var curVer = instVer.split(".");
	if (parseInt(newVer[0]) > parseInt(curVer[0])) {
		return true;
	}
	if (parseInt(newVer[0]) == parseInt(curVer[0]) && parseInt(newVer[1]) > parseInt(curVer[1])) {
		return true;
	}
	if (parseInt(newVer[0]) == parseInt(curVer[0]) && parseInt(newVer[1]) == parseInt(curVer[1])
			&& parseInt(newVer[2]) > parseInt(curVer[2])) {
		return true;
	}
	return false;
}

//IE事件注册
function f_addEvent(element, type, handler) {
	if (element.attachEvent) {
		element.attachEvent(type, handler);
	} else {
		f_attachIE11Event(element, type, handler);
	}
}
//单独处理IE11的事件
function f_attachIE11Event(obj, eventId, _functionCallback) {
	var nameFromToStringRegex = /^function\s?([^\s(]*)/;
	var paramsFromToStringRegex = /\(\)|\(.+\)/;
	var params = _functionCallback.toString().match(paramsFromToStringRegex)[0];
	var functionName = _functionCallback.name || _functionCallback.toString().match(nameFromToStringRegex)[1];
	var handler = document.createElement("script");
	handler.setAttribute("for", obj.id);
	handler.event = eventId + params;
	handler.appendChild(document.createTextNode(functionName + params + ";"));
	document.body.appendChild(handler);
};

//检查是否安装了插件
function f_installCheck() {
	if (udCapCtl){//已经启用
		controlLoaded = true;
		return true;
	}
	if (supportActiveX) {//if IE               
		document.getElementById("captureBtn").innerHTML = "<object id=\"udCaptureCtl\" width=\"0\" height=\"0\" classid=\"CLSID:0FAE7655-7C34-4DEE-9620-CD7ED969B3F2\"></object>";
		var axObj = document.getElementById("udCaptureCtl");
		if (axObj.PostUrl != undefined) {
			if (f_hasNewVer(axObj.GetVersion())) {
				if (confirm("优道在线屏幕截图控件有新版本，升级后才能使用！\r\n点确定进行升级，升级时需关闭浏览器窗口...\r\n如果您已经升级安装,请关闭后重新打开浏览器...")) {
					f_startSetup();
				}
				return false;
			} else {
				udCapCtl = document.getElementById("udCaptureCtl");
				udCapCtl.PostUrl = YYIMChat.getServletPath().FILE_UPLOAD_SERVLET;
				udCapCtl.License = UDCAPTURE_LICENSE;
				//以下IE事件注册
				f_addEvent(udCapCtl, "OnBeforeCapture", f_onBeforeCapture);
				f_addEvent(udCapCtl, "OnCaptureCanceled", f_onCaptureCanceled);
				f_addEvent(udCapCtl, "OnCaptureCompleted", f_onCaptureCompleted);
				f_addEvent(udCapCtl, "OnBeforeUpload", f_onBeforeUpload);
				f_addEvent(udCapCtl, "OnUploadCompleted", f_onUploadCompleted);
				f_addEvent(udCapCtl, "OnUploadFailed", f_onUploadFailed);
				return true;
			}
		} else {
			if (confirm("您尚未安装优道在线屏幕截图控件，点确定进行安装")) {
				document.getElementById("captureBtn").innerHTML = "";
				f_startSetup();
			}
			return false;
		}
	} else if (navigator.plugins){//NP
		var plugin = (navigator.mimeTypes && navigator.mimeTypes[UDCAPTURE_MIME_TYPE]) ? navigator.mimeTypes[UDCAPTURE_MIME_TYPE].enabledPlugin : 0;
		if (plugin) {
			var pluginVersion = "v1.0.0";
			var words = plugin.description.split(" ");
			if (words[words.length - 1].substring(0, 1) == "v")
				pluginVersion = words[words.length - 1];

			if (f_hasNewVer(pluginVersion)) {
				if (confirm("优道在线屏幕截图插件有新版本，升级后才能使用！\r\n点确定进行升级...")) {
					f_startSetup();
				}
				return false;
			} else {
				document.getElementById("captureBtn").innerHTML = "<embed id=\"udCapturePlugin\" width=\"0\" height=\"0\" type=\""
						+ UDCAPTURE_MIME_TYPE + "\"></embed>";
				udCapCtl = document.getElementById("udCapturePlugin");
				udCapCtl.PostUrl = YYIMChat.getServletPath().FILE_UPLOAD_SERVLET;
				udCapCtl.License = UDCAPTURE_LICENSE;
				//事件处理
				udCapCtl.OnBeforeCapture = "f_onBeforeCapture";
				udCapCtl.OnCaptureCanceled = "f_onCaptureCanceled";
				udCapCtl.OnCaptureCompleted = "f_onCaptureCompleted";
				udCapCtl.OnBeforeUpload = "f_onBeforeUpload";
				udCapCtl.OnUploadCompleted = "f_onUploadCompleted";
				udCapCtl.OnUploadFailed = "f_onUploadFailed";
				return true;
			}
		}
		if (confirm("您尚未安装优道在线屏幕截图插件，点确定进行安装")) {
			f_startSetup();
		}
	}
	return false;
}

//开始安装插件
function f_startSetup() {
	document.getElementById("setupFrame").setAttribute("src", UDCAPTURE_SETUP); //下载文件用的隐藏iframe
}

//重新加载插件
function f_loadPlugin() {
	if (navigator.plugins) {
		navigator.plugins.refresh(false);
	}
}

//开始屏幕截图
function f_capture() {
	if (navigator.plugins) {
		navigator.plugins.refresh(false);
	}
	if (f_installCheck()) {
		udCapCtl.AutoMinimize = false;
		if (supportActiveX || controlLoaded || !udCapCtl.AutoMinimize) {
			udCapCtl.StartCapture();
		} else {
			//最小化后截图有些情况需要延迟启动才有效,主要是Google Chrome
			setTimeout(function() {
				udCapCtl.StartCapture();
			}, 300);
		}
	}
}

//事件处理函数
function f_onBeforeCapture() {
	YYIMChat.log("开始截图...", 3);
}
function f_onCaptureCanceled() {
	YYIMChat.log("已取消截图。", 3);
}
function f_onCaptureCompleted(file) {
	YYIMChat.log("截图完成:" + file, 3);
}
function f_onBeforeUpload(file, size) {
	var fromUser, toUser, token;
	if(YYIMChat.isAnonymous()){
		fromUser = YYIMChat.getUserID() + "/ANONYMOUS";
		token = "anonymous";
	}else{
		fromUser = YYIMChat.getUserNode();
		token = YYIMChat.getToken();
	}
	
	var activeRoster = SNSIMWindow.getInstance().getChatWindow().getActiveRoster();
	if(activeRoster.resource && activeRoster.resource.toLowerCase() == "anonymous"){
		toUser = activeRoster.getID() + "/ANONYMOUS";
	}else{
		toUser = YYIMChat.getJIDUtil().getNode(activeRoster.getID());
	}
	
	udCapCtl.PostUrl = YYIMChat.getServletPath().FILE_UPLOAD_SERVLET
	+ "?token=" + token + "&fromUser=" + fromUser + "&toUser=" + toUser
	+ "&fileName=" + file.substr(file.lastIndexOf("\\") + 1) + "&fileSize=" + size + "&uploadedSize=0&muc=1";
	YYIMChat.log("正在上传截图...", 3);
}
function f_onUploadCompleted(responseText) {
	var filePath = JSON.parse(responseText).result.attachId;
	if(filePath){
		if(SNSIMWindow.getInstance().getChatWindow().getActiveRoster()){
			SNSIMWindow.getInstance().getChatWindow().getSendBox().insertHtmlContent("##{{" + filePath + "}}");
		}
		YYIMChat.log("图片上传完成， 路径 ： " + responseText, 3);
	}
}
function f_onUploadFailed(errorCode) {
	YYIMChat.log("图片上传失败,错误代码:" + errorCode, 3);
}

var SNSChatRoomSettignsWindow = function() {
	this.selector = "#chatroom_settings_window";
	this.avatarEditarPreviewSelector = "#snsim_chatroom_avatar_uploader_preview";
	this.headIconSelector = ".head_icon .chatroom_head_icon";
//	this.changeChatroomPhotoBtnSelector = ".change_head_icon";
//	this.changeChatroomPhotoBtnId = "chatroom_change_head_icon";
	// 默认的头像图标
	this.avatarDefaultPreviewSelector = ".avatar_default_preview";
	this.avatarCropperSelector = "bgDiv";//id
	this.avatarCropperWidth = 160;
	this.avatarCropperHeight = 160;
	
	this.chatroomNameInputSelector = ".chatroom_name_input";
	this.chatroomDescInputSelector = ".chatroom_desc_input";
	
	this.submitBtnSelector = ".snsim_btn_a";
	this.cancelBtnSelector = ".snsim_btn_b";

	this.closeBtnSelector = ".chatroom_settings_close_btn";
	
	this.avatarUploader;
	this.avatarCropper;
	this.chatroom;
	this.photoUrl;
};

SNSChatRoomSettignsWindow.prototype = new SNSFloatPanel();

SNSChatRoomSettignsWindow.prototype._init = function(){
	SNSFloatPanel.prototype._init.call(this);
	this._bindDomEvent();
	this.initAvatarUpload();
};

SNSChatRoomSettignsWindow.prototype._bindDomEvent = function() {
	// input
	this.getDom().find(this.chatroomNameInputSelector).bind("focus", function(){
		jQuery(this).removeClass("error_input");
	});
	
	// 保存
	this.getDom().find(this.submitBtnSelector).bind("click", jQuery.proxy(function(){
		if(this.checkInput()){
			this.save();
		}
	},this));
	
	// 取消
	this.getDom().find(this.cancelBtnSelector).bind("click", jQuery.proxy(function(){
		this.getDom().find(this.closeBtnSelector).trigger("click");
	},this));
	
//	jQuery("#"+this.changeChatroomPhotoBtnId).bind("click",jQuery.proxy(function(){
//		jQuery(this.avatarEditarPreviewSelector).css("display","none");
//	},this));
	
	// 关闭
	SNSFloatPanel.prototype._bindDomEvent.call(this);
};

SNSChatRoomSettignsWindow.prototype.show = function(){
	if(!this.chatroom.infoQueryed){
		jQuery.when(this.chatroom.queryInfo()).done(jQuery.proxy(this.show,this));
		return;
	}
	this.getDom().find("#" + this.avatarCropperSelector).hide();
	this.getDom().find(this.avatarDefaultPreviewSelector).show();
	
	var offset = SNSIMWindow.getInstance().getChatroomMembersPanel().getDom().offset();
	this.getDom().css("top", offset.top);
	this.getDom().css("left", offset.left);
	jQuery(this.avatarEditarPreviewSelector).css("display","block");
	
	this.updatePhotoUrl();
	this.getDom().find(this.chatroomNameInputSelector).val(this.chatroom.name);
	this.getDom().find(this.chatroomDescInputSelector).text(this.chatroom.desc);
	
	SNSFloatPanel.prototype.show.call(this);
};

SNSChatRoomSettignsWindow.prototype.updatePhotoUrl = function(url){
	if(url){
		this.photoUrl = url;
		this.getDom().find(this.headIconSelector).attr("src", YYIMChat.getFileUrl(url));
	}else{
		this.getDom().find(this.headIconSelector).attr("src", this.chatroom.getPhotoUrl());
	}
};

SNSChatRoomSettignsWindow.prototype.save = function(){
	if(this.getDom().find(this.avatarDefaultPreviewSelector).is(":visible")){
		this.update();
		return;
	}
	var position = this.avatarCropper.getPos();
	var requestUrl = YYIMChat.getServletPath().AVATAR_SERVLET + "?attachId=" + this.photoUrl + "&width=" + this.avatarCropperWidth 
		+ "&height=" + this.avatarCropperHeight + "&startX=" + position.startX + "&startY=" + position.startY + "&endX=" + position.endX + "&endY=" + position.endY
		+ "&fromUser=" + YYIMChat.getUserNode() + "&token=" + YYIMChat.getToken();
	
	jQuery.ajax({
		url: requestUrl,
		success: jQuery.proxy(this.update, this),
		error:function(XMLHttpRequest, textStatus, errorThrown){  
			YYIMChat.log("ajax error", 3, XMLHttpRequest.status+XMLHttpRequest.readyState+XMLHttpRequest.responseText);
		}
	});
};

SNSChatRoomSettignsWindow.prototype.update = function(pathObj){
	var path;
	if(pathObj) {
		path = pathObj.result.attachId;
	}
	this.photoUrl = path? path : this.chatroom.photoUrl;
	jQuery.when(this.chatroom.update({//oArg {name, desc, photoUrl}
		name: this.getDom().find(this.chatroomNameInputSelector).val(),
		photoUrl: this.photoUrl
	})).done(jQuery.proxy(function(){
		var chatwindow = SNSIMWindow.getInstance().getChatWindow();
		// 聊天框
		if(this.chatroom.getID() == chatwindow.getActiveRoster().getID()){
			chatwindow.getDom().find(chatwindow.currentChatPhotoSelector).attr("src", this.chatroom.getPhotoUrl());
		}
		chatwindow.getTab(this.chatroom.getID()).getHeadDom().find(".snsim_username").text(this.chatroom.name);
		// 群列表
		var chatroomtab = SNSIMWindow.getInstance().getWideWindow().getTab("chatroom");
		chatroomtab.getContentDom().find("#" + chatroomtab.roomItemIdPrefix + this.chatroom.getID() + " .head_pic img").attr("src", this.chatroom.getPhotoUrl());
		chatroomtab.getContentDom().find("#" + chatroomtab.roomItemIdPrefix + this.chatroom.getID() + " .user_name").attr("title",this.chatroom.name).text(this.chatroom.name);
		this.getDom().hide();
	},this));
};
/**
 * 提交之前检查
 */
SNSChatRoomSettignsWindow.prototype.checkInput = function(){
	var chatroomNameDom = this.getDom().find(this.chatroomNameInputSelector);
	var chatroomDescDom = this.getDom().find(this.chatroomDescInputSelector);
	
	if(!chatroomNameDom.val()){
		chatroomNameDom.addClass("error_input");
		return false;
	}
	return true;
};

/**
 * 头像裁剪
 * @param url
 */
SNSChatRoomSettignsWindow.prototype.cropAvatar = function(url){
	this.getDom().find(this.avatarDefaultPreviewSelector).hide();
	this.getDom().find("#" + this.avatarCropperSelector).show();
	this.photoUrl = url;
	if(this.avatarCropper){
		this.avatarCropper.Url = YYIMChat.getFileUrl(url);
		this.avatarCropper.init();
	}else{
		this.avatarCropper = new SNSAvatarCropper(this.avatarCropperSelector,"dragDiv",YYIMChat.getFileUrl(url),{
			Width : this.avatarCropperWidth,
			Height : this.avatarCropperHeight,
			Color : "#000",
			Resize : true,
			Right : "rRight",
			Left : "rLeft",
			Up : "rUp",
			Down : "rDown",
			RightDown : "rRightDown",
			LeftDown : "rLeftDown",
			RightUp : "rRightUp",
			LeftUp : "rLeftUp",
			//Preview : "viewDiv",
			viewWidth : 100,
			viewHeight : 100
		});
	}
};

SNSChatRoomSettignsWindow.prototype.initAvatarUpload = function(){
	var that = this;
	if(isSupportHtml5Upload === true) {
		jQuery('#chatroom_change_head_icon').bind("click",{_self:this}, function(e){
			jQuery("#room_avatar_upload_input").trigger("click");
		});
		jQuery("#room_avatar_upload_input").bind("change", {_self:this},function(e){
			var arg = {
				fileInputId: this.id,
				to: YYIMChat.getUserBareJID(),
				success: function(arg){
					e.data._self.photoUrl = arg.attachId;
					e.data._self.cropAvatar(arg.attachId);
				},
				error: function(){
					alert("头像上传失败");
				}
			};
			YYIMChat.uploadAvatar(arg);
		});
	}
	else {
		YYIMChat.initUpload({
			button_placeholder_id:"chatroom_change_head_icon",
			flash_url: "res/js/swfupload.swf",
			contentType: "avatar",
			button_text : "<span class='room_change_head'>更改头像</span>",
			button_text_style : ".room_change_head { margin-left: 13px; color: #ffffff;}",
			button_width : 80,
			button_height : 22,
			button_cursor : SWFUpload.CURSOR.HAND,
			button_window_mode : SWFUpload.WINDOW_MODE.TRANSPARENT,
			success: function(attachId){
				that.photoUrl = attachId;
				that.cropAvatar(attachId);
			},
			error: function(){
				alert("头像上传失败");
			}
			
		});
	}
};
var SNSChatRoomSettingsPlugin = function() {
	
	this.name="chatroomSettingsPlugin";
	this.chatRooomSettingsWindow = new SNSChatRoomSettignsWindow();
	this.chatroomSettingsSelector = "#chatroom_settings";
	
	this.enable = true;
	
	this.loadPeriod = SNS_EVENT_SUBJECT.AFTER_CONNECT;
	
};

SNSChatRoomSettingsPlugin.prototype = new SNSPlugin();

SNSChatRoomSettingsPlugin.prototype._init = function() {
	SNSChatRoomSettingsPlugin._instance = this;
	
	this.chatRooomSettingsWindow._init();
	this._bindDomEvent();
	
	SNSPlugin.prototype._init.call(this);
};
SNSChatRoomSettingsPlugin.prototype._bindDomEvent = function(){
	// 群资料修改
	jQuery(this.chatroomSettingsSelector).bind("click", jQuery.proxy(function(){
		this.chatRooomSettingsWindow.chatroom = SNSIMWindow.getInstance().getChatWindow().getActiveRoster();
		// 判断是否管理员
		//if(this.chatRooomSettingsWindow.chatroom.getMe().affiliation == SNS_AFFILIATION_TYPE.OWNER){
			this.chatRooomSettingsWindow.show();
			SNSIMWindow.getInstance().getChatroomMembersPanel().hide();
		//}
	},this));
};
SNSChatRoomSettingsPlugin.getInstance = function(){
	return SNSChatRoomSettingsPlugin._instance;
};
new SNSChatRoomSettingsPlugin().start();

/*! Copyright (c) 2013 Brandon Aaron (http://brandon.aaron.sh)
 * Licensed under the MIT License (LICENSE.txt).
 *
 * Version: 3.1.12
 *
 * Requires: jQuery 1.2.2+
 */
!function(a){"function"==typeof define&&define.amd?define(["jquery"],a):"object"==typeof exports?module.exports=a:a(jQuery)}(function(a){function b(b){var g=b||window.event,h=i.call(arguments,1),j=0,l=0,m=0,n=0,o=0,p=0;if(b=a.event.fix(g),b.type="mousewheel","detail"in g&&(m=-1*g.detail),"wheelDelta"in g&&(m=g.wheelDelta),"wheelDeltaY"in g&&(m=g.wheelDeltaY),"wheelDeltaX"in g&&(l=-1*g.wheelDeltaX),"axis"in g&&g.axis===g.HORIZONTAL_AXIS&&(l=-1*m,m=0),j=0===m?l:m,"deltaY"in g&&(m=-1*g.deltaY,j=m),"deltaX"in g&&(l=g.deltaX,0===m&&(j=-1*l)),0!==m||0!==l){if(1===g.deltaMode){var q=a.data(this,"mousewheel-line-height");j*=q,m*=q,l*=q}else if(2===g.deltaMode){var r=a.data(this,"mousewheel-page-height");j*=r,m*=r,l*=r}if(n=Math.max(Math.abs(m),Math.abs(l)),(!f||f>n)&&(f=n,d(g,n)&&(f/=40)),d(g,n)&&(j/=40,l/=40,m/=40),j=Math[j>=1?"floor":"ceil"](j/f),l=Math[l>=1?"floor":"ceil"](l/f),m=Math[m>=1?"floor":"ceil"](m/f),k.settings.normalizeOffset&&this.getBoundingClientRect){var s=this.getBoundingClientRect();o=b.clientX-s.left,p=b.clientY-s.top}return b.deltaX=l,b.deltaY=m,b.deltaFactor=f,b.offsetX=o,b.offsetY=p,b.deltaMode=0,h.unshift(b,j,l,m),e&&clearTimeout(e),e=setTimeout(c,200),(a.event.dispatch||a.event.handle).apply(this,h)}}function c(){f=null}function d(a,b){return k.settings.adjustOldDeltas&&"mousewheel"===a.type&&b%120===0}var e,f,g=["wheel","mousewheel","DOMMouseScroll","MozMousePixelScroll"],h="onwheel"in document||document.documentMode>=9?["wheel"]:["mousewheel","DomMouseScroll","MozMousePixelScroll"],i=Array.prototype.slice;if(a.event.fixHooks)for(var j=g.length;j;)a.event.fixHooks[g[--j]]=a.event.mouseHooks;var k=a.event.special.mousewheel={version:"3.1.12",setup:function(){if(this.addEventListener)for(var c=h.length;c;)this.addEventListener(h[--c],b,!1);else this.onmousewheel=b;a.data(this,"mousewheel-line-height",k.getLineHeight(this)),a.data(this,"mousewheel-page-height",k.getPageHeight(this))},teardown:function(){if(this.removeEventListener)for(var c=h.length;c;)this.removeEventListener(h[--c],b,!1);else this.onmousewheel=null;a.removeData(this,"mousewheel-line-height"),a.removeData(this,"mousewheel-page-height")},getLineHeight:function(b){var c=a(b),d=c["offsetParent"in a.fn?"offsetParent":"parent"]();return d.length||(d=a("body")),parseInt(d.css("fontSize"),10)||parseInt(c.css("fontSize"),10)||16},getPageHeight:function(b){return a(b).height()},settings:{adjustOldDeltas:!0,normalizeOffset:!0}};a.fn.extend({mousewheel:function(a){return a?this.bind("mousewheel",a):this.trigger("mousewheel")},unmousewheel:function(a){return this.unbind("mousewheel",a)}})});
var SNSHistoryMessage = function(){
	this.id;
	this.to;
	this.from;
	this.member;
	this.type; // send or receive
	this.scrollToBottom = 'hide';
};

SNSHistoryMessage.prototype = new SNSMessage();

SNSHistoryMessage.prototype.show = function(rosterOrChatroom, msgContainer){
	//var msgContainer = SNSIMWindow.getInstance().getChatWindow().getTab(rosterOrChatroom).getContentDom().find(".snsim_message_box_container");
	if(jQuery('#' + SNSReceivedMessageBox.ID_PREFIX + this.id).length <= 0){
		if(this.from.getID() == rosterOrChatroom.getID() || this.to.getID() == rosterOrChatroom.getID())
			msgContainer.prepend(this.getMsgHtml());
	}
};

SNSHistoryMessage.prototype.getMsgHtml = function(){
	if(this.body.content && typeof this.body.content == "string")
		this.body.content = SNSExpressionRenderFilter.decode(this.body.content);
	if(this.type == SNS_FILTER_TYPE.SEND){
		SNSApplication.getInstance().getMessageOutBox().getFilter().doFilter(this);
		return TemplateUtil.genHtml(SNSSentMessageBox.template, this);
	}
	else{
		SNSApplication.getInstance().getMessageInBox().getFilter().doFilter(this);
		return TemplateUtil.genHtml(SNSReceivedMessageBox.template, this);
	}
};

SNSHistoryMessage.prototype.getBodyHtml = function() {
	if (!this.html || this.html.isEmpty()) {
		return this.body.content;
	}
	return this.html;
};

SNSHistoryMessage.prototype.getRoster = function() {
	if (this.from && this.from instanceof SNSRoster) {
		return this.from;
	}
	if (this.from && this.from instanceof SNSChatRoom) {
		var _nameArr = this.member.name.split(".")
		if (_nameArr.length == 3) {
			this.member.name = _nameArr[0];
		}
		return this.member;
	}
};

/**
 * 设置要发送的图片
 * @param file @see SNSFile
 */
SNSHistoryMessage.prototype.setImage = function(image){
	if(image && image instanceof SNSFile){
		this.body.content = image;
		this.body.contentType = SNS_MESSAGE_CONTENT_TYPE.IMAGE;
	}
};

SNSHistoryMessage.prototype.getRosterOrChatRoom = function() {
	if(this.type == SNS_FILTER_TYPE.SEND){
		return this.to;
	}else {
		return this.from;
	}
};
var SNSHistoryMessageArray = function() {
	this.count = -1;
	this.currentCount = 0;
	this.messages = new Array();
	this.msgInfoTemplate = 
		'<div id="'+ SNSHistoryMessageArray.msgInfoIdPrefix +'##{{node}}" style="text-align: center; margin-top: 10px;">'
			+'<a onclick="SNSHistoryMessagePlugin.getInstance().historyMessageList.showHistoryMessage(\'##{{id}}\')" class="snsim_msg_info_content">##{{msgInfo}}</a>'
		+'</div>';
	
	this.scrollToBottom = false;
};

SNSHistoryMessageArray.prototype = new Array();

SNSHistoryMessageArray.msgInfoIdPrefix = "snsim_msg_info_";

SNSHistoryMessageArray.prototype.show = function(rosterOrChatroom){
	var defer = jQuery.Deferred();
	var msgContainer = SNSIMWindow.getInstance().getChatWindow().getTab(rosterOrChatroom).getContentDom().find(".snsim_message_box_container");
	
	for(var i = 0; i < this.messages.length; i++){
		if(this.scrollToBottom){
			this.messages[i].scrollToBottom = 'show';
		}else {
			this.messages[i].scrollToBottom = 'hide';
		}
		this.messages[i].show(rosterOrChatroom, msgContainer);
	}
	
	// 顶部的查看更多
	var msgInfoDom = jQuery("#" + SNSHistoryMessageArray.msgInfoIdPrefix + rosterOrChatroom.getID());
	if(msgInfoDom.length < 1){
		msgContainer.prepend(this.getMsgInfoHtml(rosterOrChatroom));
	}else{
		msgInfoDom.insertBefore(msgContainer.children(":first"));
	}
	if(this.count >= 0 && this.currentCount >= this.count){
		this.showNoMsgInfoHtml(rosterOrChatroom);
	}
	
	this.clear();
	if(this.scrollToBottom){
		this.scrollToBottom = false;
		SNSIMWindow.getInstance().getChatWindow().getTab(rosterOrChatroom).scrollToBottom();
	}
	defer.resolve();
	return defer.promise();
};

SNSHistoryMessageArray.prototype.clear = function(){
	this.messages = [];
};

/**
 * 查看更多|没有更多消息了 之类的提示
 * @param rosterOrChatroom
 */
SNSHistoryMessageArray.prototype.getMsgInfoHtml = function(rosterOrChatroom){
	var messageInfo = "查看更多";
	return TemplateUtil.genHtml(this.msgInfoTemplate, {node: rosterOrChatroom.getID(), msgInfo: messageInfo, id: rosterOrChatroom.getID()});
};

SNSHistoryMessageArray.prototype.showNoMsgInfoHtml = function(rosterOrChatroom){
	// 顶部的查看更多
	var msgInfoDom = jQuery("#" + SNSHistoryMessageArray.msgInfoIdPrefix + rosterOrChatroom.getID());
	
	msgInfoDom.find(".snsim_msg_info_content").text("没有更多消息了");
	msgInfoDom.find(".snsim_msg_info_content").css("cursor","default");
};

/**
 * 存放历史消息列表，key为chatroom或roster的jid
 */
var SNSHistoryMessageList = function(){
	this.pageSize = 5;
	this.currentRosterOrChatroom;
	this.requesting = false;
	this._init();
};

SNSHistoryMessageList.prototype = new SNSBaseList();

SNSHistoryMessageList.prototype._init = function(){
	SNSApplication.getInstance().getGlobalEventManager().registerEventHandler(SNS_EVENT_SUBJECT.ON_CURRENT_CHAT_CHANGE, true, function(e, data) {
		if(data && data.newValue){
			var newTab = data.newValue;
			var id = newTab.getTarget().getID();
			if(!id)
				return;
			//if(!this.get(id) || !this.get(id).messages || this.get(id).messages.length <= 0){
				var hisMsgArray = new SNSHistoryMessageArray();
				this.add(id,hisMsgArray);
				hisMsgArray.scrollToBottom = true;
				this.showHistoryMessage(SNSApplication.getInstance().getUser().getRosterOrChatRoom(id));
//				SNSIMWindow.getInstance().getChatWindow().getTab(jid).scrollToBottom();
			//}
		}
	}, this);

	SNSApplication.getInstance().getGlobalEventManager().registerEventHandler(SNS_EVENT_SUBJECT.TAB_CLOSED, true, function(e, tab) {
		var bareJid;
		if(!tab)
			return;
		if(tab.chatroom)
			bareJid = YYIMChat.getJIDUtil().getBareJID(tab.chatroom);
		if(tab.roster)
			bareJid = YYIMChat.getJIDUtil().getBareJID(tab.roster);
		this.get(bareJid) && this.get(bareJid).messages? this.get(bareJid).messages = new Array():null;
	}, this);
};

/**
 * 显示历史消息后，请求下次即将显示的历史消息
 * @param rosterOrChatroom
 */
SNSHistoryMessageList.prototype.showHistoryMessage = function(rosterOrChatroom){
	if(typeof rosterOrChatroom == "string"){
		this.currentRosterOrChatroom = SNSApplication.getInstance().getUser().getRosterOrChatRoom(rosterOrChatroom);
	}else{
		this.currentRosterOrChatroom = rosterOrChatroom;
	}
	var curId;
	if(this.currentRosterOrChatroom)
		curId = this.currentRosterOrChatroom.getID();
	if(!curId)
		return;
	if(!this.get(curId)){
		var hisMsgArray = new SNSHistoryMessageArray();
		this.add(curId,hisMsgArray);
	}
	
	var _self = this;
	// 没有预请求的消息
	if(this.get(curId).messages.length <= 0){
		this.requestHistoryMessage(this.currentRosterOrChatroom, function(msgArr){
			_self.get(_self.currentRosterOrChatroom.getID()).show(_self.currentRosterOrChatroom);
			_self.requestHistoryMessage(_self.currentRosterOrChatroom);
		});
	} else {
		// 显示
		jQuery.when(this.get(this.currentRosterOrChatroom.getID()).show(this.currentRosterOrChatroom))
		// 预请求
		.done(jQuery.proxy(function(){
			this.requestHistoryMessage(this.currentRosterOrChatroom);
		},this));
	}
};

SNSHistoryMessageList.prototype.requestHistoryMessage = function(rosterOrChatroom, successFunc){
	this.get(rosterOrChatroom.getID()).currentCount = this.getStart();
	
	var hisMsgArr = this.get(rosterOrChatroom.getID());
	if(hisMsgArr && hisMsgArr.count > 0 && this.getStart() >= hisMsgArr.count){
		hisMsgArr.showNoMsgInfoHtml(rosterOrChatroom);
		return;
	}
	if(this.requesting)
		return;
	this.requesting = true;

	var _self = this;
	var arg = {
		id: rosterOrChatroom.getID(),
		start: this.getStart(),
		num: this.pageSize,
		success: function(data) {
			_self.requesting = false;
			var hisMsgArray = _self.get(_self.currentRosterOrChatroom.getID());
			hisMsgArray.count = data.count;
			var user = SNSApplication.getInstance().getUser();
			for(var i = 0; i < data.result.length; i++){
				var msgItem = data.result[i];
				var hisMsg = new SNSHistoryMessage();
				hisMsg.id = msgItem.msgId;
				
				if(msgItem.fromId == user.getID()){
					hisMsg.type = SNS_FILTER_TYPE.SEND;
					hisMsg.from = user;
					hisMsg.to = user.getRosterOrChatRoom(msgItem.toId);
				}else{
					hisMsg.type = SNS_FILTER_TYPE.RECEIVED;
					hisMsg.from = user.getRosterOrChatRoom(msgItem.fromId);
					
					if(hisMsg.from instanceof SNSChatRoom){
						hisMsg.member = new SNSRoster(msgItem.memberId);
					}
					
					hisMsg.to = user;
				}
				hisMsg.body = Object.clone(msgItem.body);
				if(hisMsg.body){
					if(hisMsg.body.style)
						hisMsg.body.style = jQuery.extend(new SNSMessageStyle(), hisMsg.body.style);
					hisMsgArray.messages.push(hisMsg);
				}
			}
			
			if(SNSCommonUtil.isFunction(successFunc))
				successFunc(hisMsgArray);
		}
	}
	if(rosterOrChatroom instanceof SNSRoster){
		arg.chatType = 'chat';
	}else{
		arg.chatType = 'groupchat';
	}
	
	YYIMChat.getHistoryMessage(arg);
	
};

/**
 * 已经显示的消息条数
 */
SNSHistoryMessageList.prototype.getStart = function(){
	var msgContainer = SNSIMWindow.getInstance().getChatWindow().getTab(this.currentRosterOrChatroom).getContentDom().find(".snsim_message_box_container");
	var start = msgContainer.children().length;
	
	var msgInfoDom = jQuery("#" + SNSHistoryMessageArray.msgInfoIdPrefix + this.currentRosterOrChatroom.getID());
	if(msgInfoDom.length > 0){
		start -= msgInfoDom.length;
	}
	
	return start? start : 0;
};

var SNSHistoryMessagePlugin = function() {
	
	this.name="historyMessagePlugin";
	
	this.enable = true;

	this.historyMessageList;
	
	this.showHistoryMessageBtnSelector = "#history_message";
	
	this.loadPeriod = SNS_EVENT_SUBJECT.AFTER_CONNECT;
	
};

SNSHistoryMessagePlugin.prototype = new SNSPlugin();

SNSHistoryMessagePlugin.prototype._init = function() {
	SNSHistoryMessagePlugin._instance = this;
	this.historyMessageList = new SNSHistoryMessageList();
	this._bindDomEvent();
	
	SNSPlugin.prototype._init.call(this);
};

SNSHistoryMessagePlugin.prototype._bindDomEvent = function(){
	jQuery(this.showHistoryMessageBtnSelector).bind("click", jQuery.proxy(function(){
		var activeRoster = SNSIMWindow.getInstance().getChatWindow().getActiveRoster();
		this.historyMessageList.showHistoryMessage(activeRoster);
	},this));
	// 鼠标向上滑显示历史消息
	/*jQuery("#snsim_chat_window_tab_content").bind("mousewheel", jQuery.proxy(function(event, delta, deltaX, deltaY){
		// 向下滑
		if(deltaY <= 0)
			return;
		var firstMsgDom = SNSIMWindow.getInstance().getChatWindow().getCurrentTab().getContentDom().find(".snsim_message_box_container").children(":first");
		if(firstMsgDom.length > 0){
			var firstMsgDomOffsetTop = firstMsgDom.offset().top;
			// 聊天框右边头部
			var chatRtTitleOffsetTop = jQuery("#snsim_chat_rt_title").offset().top;
			// 50为右边头部的大致高度
			if(firstMsgDomOffsetTop > chatRtTitleOffsetTop + 40){
				var activeRoster = SNSIMWindow.getInstance().getChatWindow().getActiveRoster();
				this.historyMessageList.showHistoryMessage(activeRoster);
			}
		}else{
			var activeRoster = SNSIMWindow.getInstance().getChatWindow().getActiveRoster();
			this.historyMessageList.showHistoryMessage(activeRoster);
		}
	},this));*/
};

SNSHistoryMessagePlugin.getInstance = function(){
	return SNSHistoryMessagePlugin._instance;
}
new SNSHistoryMessagePlugin().start();
/**
 * 消息的字数filter, 若超出字数，则抛出异常，终止发送
 * @Class SNSCharacterCountFilter
 */
var SNSCharacterCountFilter = function(){
	
	this.name = "characterCountFilter";
	
	this.priority = 40;
	
	this.contentType = SNS_MESSAGE_CONTENT_TYPE.TEXT;
	
	this.type = SNS_FILTER_TYPE.SEND;
	
	this._doFilter = function(msg) {
		var content = msg.body.content;
		if(content){
			if(typeof content == "string" && content.notEmpty()){
				if(content.length>SNSConfig.MESSAGE.MAX_CHARACTER){
					throw SNS_I18N.message_character_exceed;
				}
			}
		}
	}
};
SNSCharacterCountFilter.prototype = new SNSMessageFilter();
new SNSCharacterCountFilter().start();
/**
 * 对输入框内的表情进行编码，减少发送字节数，并适配移动端等
 */
var SNSExpressionOutFilter = function(){
	
	this.name = "expressionoutFilter";
	
	this.priority = 10;
	
	this.contentType = SNS_MESSAGE_CONTENT_TYPE.TEXT;
	
	this.type = SNS_FILTER_TYPE.SEND;
	
	SNSExpressionOutFilter.pattern = /<img[\w\W]+?node-type=\"expression\"[\w\W]+?>/ig;
	
	this._doFilter_ = function(message) {
		var content = message.body.content;
		var matchs = content.match(SNSExpressionOutFilter.pattern);
		if(!matchs) return;
		for(var m = 0; m<matchs.length;m++){
			var match = matchs[m];
			match = match.match(/([\w_]+?\.png)/ig);
			var expressions = SNSExpressionData.DEFAULT.data;
			for(var i  = 0; i< expressions.length; i++){
				var item = expressions[i];
				if(item.url == match ){
					content = content.replace(matchs[m], item.actionData);
					message.body.expression++;//更改expression字段值， 减少消息中的字符误判
					break;
				}
			}
		}
		message.body.content = content;
	}
}
SNSExpressionOutFilter.prototype = new SNSMessageFilter();
//new SNSExpressionOutFilter().start();
//SNSMessageFilterChain.registerFilter(new SNSExpressionOutFilter());

SNSExpressionOutFilter.genContent = function(content){
	var pattern = /<img[\w\W]+?node-type=\"expression\"[\w\W]+?>/ig;
	var matchs = content.match(pattern);
	if(!matchs) return content;
	for(var m = 0; m<matchs.length;m++){
		var match = matchs[m];
		match = match.match(/([\w_]+?\.png)/ig);
		var expressions = SNSExpressionData.DEFAULT.data;
		for(var i  = 0; i< expressions.length; i++){
			var item = expressions[i];
			if(item.url == match ){
				content = content.replace(matchs[m], item.actionData);
			}
		}
	}
	return content;
};
/**
 * 对消息中的截图进行处理， 
 * 消息的类型为IMAGE
 */
var ScreenCaptureFilter = function() {

	this.priority = 150;
	
	this.contentType = SNS_MESSAGE_CONTENT_TYPE.TEXT;
	
	this.type = SNS_FILTER_TYPE.RECEIVED | SNS_FILTER_TYPE.SEND;
	
	this.template = 
		'<p>'
			+'<span style="white-space: nowrap">'
				+'<img src="##{{path}}" onclick="SNSIMWindow.getInstance().getImgPreviewPanel().updateImg(\'##{{path}}\')" style="max-width: 200px; cursor: pointer;" target="_blank"></a>'
			+'</span>'
	  +'</p>',
	
	this._doFilter = function(msg) {
		var content = msg.body.content;
		var pattern = /##\{\{([\w()_.\/-]+)\}\}/ig;
		if (pattern.test(content)) {
			var path = content.replace(pattern, '$1');
			msg.html = TemplateUtil.genHtml(this.template, {path:YYIMChat.getFileUrl(path)});
		}
	};
};
ScreenCaptureFilter.prototype = new SNSMessageFilter();
new ScreenCaptureFilter().start();

var SNSSystemMessageFilter = function() {

	this.name = "systemMessageFilter";
	
	this.priority = 100;
	
	this.contentType = SNS_MESSAGE_CONTENT_TYPE.SYSTEM;
	
	this.type = SNS_FILTER_TYPE.RECEIVED;
	
	this.acceptBtnSelector = ".accept_btn";
	this.ignoreBtnSelector = ".ignore_btn";
	
	this.invitationTemplate = 
		'<div class="snsim_system_message">'
			+ '<img src="##{{roster.getPhotoUrl()}}"/>'
			+ '<div class="snsim_system_message_info">'
				+ '<div style="display: inline-block;">'
					+ '<span>##{{roster.name}}</span>'
					+ '<span style="display: block; color: #A19F9F;">##{{SNS_I18N.chatRoom_invitation}}##{{chatroom.name}}</span>'
				+ '</div>'
				+ '<div class="snsim_system_message_confirm">'
					+ '<a class="accept_btn">接受</a>'
					+ '<a class="ignore_btn">忽略</a>'
				+ '</div>'
			+ '</div>'
		+ '</div>';
	this.requestSubscribeTemplate = 
		'<div class="snsim_system_message">'
			+ '<img src="##{{roster.getPhotoUrl()}}"/>'
			+ '<div class="snsim_system_message_info">'
				+ '<div style="display: inline-block;">'
					+ '<span>##{{roster.name}}</span>'
					+ '<span style="display: block; color: #A19F9F;">##{{SNS_I18N.subscribe_request}}</span>'
				+ '</div>'
				+ '<div class="snsim_system_message_confirm">'
					+ '<a class="accept_btn">接受</a>'
					+ '<a class="ignore_btn">忽略</a>'
				+ '</div>'
			+ '</div>'
		+ '</div>';

	this._doFilter = function(msg) {
		if(msg.type == SNS_MESSAGE_TYPE.INVITE){
			msg.html = TemplateUtil.genHtml(this.invitationTemplate, msg);
		}else if(msg.type == SNS_MESSAGE_TYPE.SUBSCRIBE){
			msg.html = TemplateUtil.genHtml(this.requestSubscribeTemplate, msg);
		}
	};
};
SNSSystemMessageFilter.prototype = new SNSMessageFilter();
SNSSystemMessageFilter.prototype._init = function(){
	SNSApplication.getInstance().getGlobalEventManager().registerEventHandler(SNS_EVENT_SUBJECT.AFTER_MESSAGE_SHOW, true, this.bindDomEvent, this);
//	SNSApplication.getInstance().getGlobalEventManager().registerEventHandler(SNS_EVENT_SUBJECT.ON_ADD_CHATROOM, true, this.renderAddChatRoom, this);
	SNSMessageFilter.prototype._init.call(this);
}

SNSSystemMessageFilter.prototype.bindDomEvent = function(event,msg){
	jQuery("#" + SNSReceivedMessageBox.ID_PREFIX + msg.id).find(this.acceptBtnSelector).bind("click", {_msg:msg, _self:this}, function(event){
		var msgContainer = jQuery("#" + SNSReceivedMessageBox.ID_PREFIX + event.data._msg.id);
		var obj = {
			systemFilter: event.data._self, 
			message: event.data._msg,
			container: msgContainer
		};
		if(obj.message.type == SNS_MESSAGE_TYPE.INVITE){
			obj.systemFilter.processInvitation(obj, true);
		}else if (obj.message.type == SNS_MESSAGE_TYPE.SUBSCRIBE){
			obj.systemFilter.processSubscription(obj, true);
		}
		
		obj.systemFilter.renderProcessResult(obj, true);
	});
	jQuery("#" + SNSReceivedMessageBox.ID_PREFIX + msg.id).find(this.ignoreBtnSelector).bind("click", {_msg:msg, _self:this}, function(event){
		var msgContainer = jQuery("#" + SNSReceivedMessageBox.ID_PREFIX + event.data._msg.id);
		
		var obj = {
			systemFilter: event.data._self, 
			message: event.data._msg,
			container: msgContainer
		};
		if(obj.message.type == SNS_MESSAGE_TYPE.INVITE){
			obj.systemFilter.processInvitation(obj, false);
		}else if (obj.message.type == SNS_MESSAGE_TYPE.SUBSCRIBE){
			obj.systemFilter.processSubscription(obj, false);
		}
		
		obj.systemFilter.renderProcessResult(obj, false);
	});
};

/**
 * 接受群邀请
 * @param obj [systemFilter, message, container]
 */
SNSSystemMessageFilter.prototype.processInvitation = function(obj, isAccept){
	if(isAccept){
		jQuery.when(obj.message.chatroom.join()).done(function(thisObj){
			SNSApplication.getInstance().getUser().chatRoomList.addChatRoom(thisObj.message.chatroom);
//			SNSIMWindow.getInstance().getWideWindow().getTab("chatroom").addChatRoom(thisObj.message.chatroom);
			SNSIMWindow.getInstance().getChatWindow().openChatWith(thisObj.message.chatroom);
		}(obj));
	}else{
		return;
	}
};

/**
 * 接受好友请求
 * @param obj [systemFilter, message, container]
 */
SNSSystemMessageFilter.prototype.processSubscription = function(obj, isAccept){
	if(isAccept){
		//SNSApplication.getInstance().getUser().subscribe.approveSubscribe(obj.message.roster.getID());
		YYIMChat.approveSubscribe(obj.message.roster.getID());
	}else{
		YYIMChat.rejectSubscribe(obj.message.roster.getID());
	}
};

/**
 * 渲染处理结果
 * @param isAccept boolean
 */
SNSSystemMessageFilter.prototype.renderProcessResult = function(obj, isAccept){
	obj.container.find(obj.systemFilter.acceptBtnSelector).addClass("unuse");
	if(isAccept)
		obj.container.find(obj.systemFilter.acceptBtnSelector).text("已接受");
	else
		obj.container.find(obj.systemFilter.acceptBtnSelector).text("已忽略");
		
	obj.container.find(obj.systemFilter.acceptBtnSelector).unbind();
	obj.container.find(obj.systemFilter.ignoreBtnSelector).remove();
};

new SNSSystemMessageFilter().start();
/**
 * 对消息中的url字符串进行处理, 为url形式的字符串添加链接
 * 消息的类型为text
 * @Class SNSURLFilter
 */
var SNSURLFilter = function() {

	this.name="urlFilter";
	
	this.priority = 20;
	this.contentType = SNS_MESSAGE_CONTENT_TYPE.TEXT;
	
	this.type = SNS_FILTER_TYPE.RECEIVED | SNS_FILTER_TYPE.SEND;
	
	this.pattern = /(http|https|ftp)\:\/\/([a-zA-Z0-9\.\-]+(\:[a-zA-Z0-9\.&%\$\-]+)*@)*((25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[1-9])\.(25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[1-9]|0)\.(25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[1-9]|0)\.(25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[0-9])|localhost|([a-zA-Z0-9\-]+\.)*[a-zA-Z0-9\-]+\.(com|edu|gov|int|mil|net|org|biz|arpa|info|name|pro|aero|coop|museum|[a-zA-Z]{2}))(\:[0-9]+)*(\/($|[a-zA-Z0-9\.\,\?\'\\\+&%\$#\=~_\-]+))*/g

	this._doFilter = function(msg) {
		var content = msg.body.content;
		if(!content){
			return;
		}
		var matchs = content.match(this.pattern);
		for ( var m in matchs) {
			content = content.replace(matchs[m], "<a target='_blank' href='" + matchs[m] + "'>"+matchs[m]+"</a>")
		}
		msg.body.content = content;
	};
};
SNSURLFilter.prototype = new SNSMessageFilter();
//new SNSURLFilter().start();

/**
 * 对接收到的消息中表情进行html元素替换， 保证渲染效果
 * 消息的类型为text
 */
var SNSExpressionRenderFilter = function() {

	this.name = "expressionInFilter";
	
	this.priority = 30;
	
	this.contentType = SNS_MESSAGE_CONTENT_TYPE.TEXT;
	
	this.type = SNS_FILTER_TYPE.RECEIVED | SNS_FILTER_TYPE.SEND;
	
	SNSExpressionRenderFilter.pattern = /\[\:[\u4e00-\u9fa5_a-zA-Z0-9]+?\]/g;

	this._doFilter = function(msg) {
		var source = msg.body.content;
		//if(msg.body.expression>0){//对expression字段进行检测，尽量减少误判
			msg.body.content = SNSExpressionRenderFilter.decode(source);
		//}
	};
	
	SNSExpressionRenderFilter.decode = function(source){
		if (typeof source == 'number') {
			source = source + '';
		}
		if(!source){	
			return null;
		}
		var matchs = source.match(SNSExpressionRenderFilter.pattern);
		if(matchs && matchs.length > 0){
			matchs = YYIMChat.getArrayUtil().unique(matchs);
		}
		for ( var m in matchs) {
			var img = jQuery("a[action-data='" + matchs[m] + "'] img");
			if (img.length > 0) {
				source = source.replace(new RegExp(matchs[m].replace("[","\\[").replace("]","\\]"),"g"), "<img node-type=\"expression\" width=\"25\" src=\"" + img.attr('src') + "\"/>")
			}
		}
		return source;
	}
};
SNSExpressionRenderFilter.prototype = new SNSMessageFilter();
new SNSExpressionRenderFilter().start();
//SNSMessageFilterChain.registerFilter(new SNSExpressionInFilter());

var SNSFileContentRenderFilter = function() {

	this.priority = 99;
	
	this.contentType = SNS_MESSAGE_CONTENT_TYPE.FILE;
	
	this.type = SNS_FILTER_TYPE.RECEIVED | SNS_FILTER_TYPE.SEND;
	
	this.inTemplate = 
		'<p>'
			+'<img src="##{{getSNSBasePath()}}res/skin/default/icons/filetype/##{{type}}.png" border="0" class="vm sns_msg_file_icon">'
			+'<span class="sns_msg_file_info">'
				+'<a href="##{{path}}" target="_blank">##{{name}}</a>'
				+'<em class="xg1" style="display:none;">(##{{size}})</em>'
			+'</span>'
	  +'</p>';
	
	this.outTemplate = 
		'<p>'
			+'<img src="##{{getSNSBasePath()}}res/skin/default/icons/filetype/##{{type}}.png" border="0" class="vm sns_msg_file_icon">'
			+'<span class="sns_msg_file_info">'
				+'<a href="##{{path}}" target="_blank" style="color:#ffffff;">##{{name}}</a>'
				+'<em class="xg1" style="display:none;">(##{{renderSize()}})</em>'
			+'</span>'
	  +'</p>';
	 
	this._doFilter = function(msg) {
		if(msg instanceof SNSInMessage || (msg.type && msg.type == SNS_FILTER_TYPE.RECEIVED)){
			msg.body.content.size = SNSFile.renderSize(msg.body.content.size);
			msg.html = TemplateUtil.genHtml(this.inTemplate, msg.body.content);
		} else {
			msg.html = TemplateUtil.genHtml(this.outTemplate, msg.body.content);
		}
	};
	
};
SNSFileContentRenderFilter.prototype = new SNSMessageFilter();
new SNSFileContentRenderFilter().start();
var SNSFontContentRenderFilter = function() {

	this.priority = 100;
	
	this.contentType = SNS_MESSAGE_CONTENT_TYPE.TEXT;
	
	this.type = SNS_FILTER_TYPE.RECEIVED | SNS_FILTER_TYPE.SEND;
	this._doFilter = function(msg) {
		if(msg.body.style && msg.body.style instanceof SNSMessageStyle)
			msg.html = '<div style="' + msg.body.style.getStyleStr() + '">' + msg.body.content + '</div>';
		else
			msg.html = msg.body.content;
	};
	
};
SNSFontContentRenderFilter.prototype = new SNSMessageFilter();
new SNSFontContentRenderFilter().start();
var SNSImageContentRenderFilter = function() {

	this.priority = 99;
	
	this.contentType = SNS_MESSAGE_CONTENT_TYPE.IMAGE;
	
	this.type = SNS_FILTER_TYPE.RECEIVED | SNS_FILTER_TYPE.SEND;
	
	this.template = 
		'<p>'
			+'<span style="white-space: nowrap">'
				+'<img src="##{{body.content.path}}" onload="SNSImageContentRenderFilter.imgOnload(\'##{{rosterId}}\', \'##{{scrollToBottom}}\')" onclick="SNSIMWindow.getInstance().getImgPreviewPanel().updateImg(\'##{{body.content.path}}\')" style="max-width: 200px; cursor: pointer;" target="_blank"></a>'
			+'</span>'
	  +'</p>',
	 
	this._doFilter = function(msg) {
		if(msg.getRosterOrChatRoom()){
			msg.rosterId = msg.getRosterOrChatRoom().getID();
			if(msg instanceof SNSInMessage || msg instanceof SNSOutMessage)
				msg.scrollToBottom = 'show';
		}
		msg.html = TemplateUtil.genHtml(this.template, msg);
	};
	
};
SNSImageContentRenderFilter.prototype = new SNSMessageFilter();
new SNSImageContentRenderFilter().start();

SNSImageContentRenderFilter.imgOnload = function(id, scrollToBottom){
	
	if(scrollToBottom == 'show'){
		SNSIMWindow.getInstance().getChatWindow().getTab(id).scrollToBottom();
	}
};
var SNSPublicContentRenderFilter = function() {

	this.priority = 99;
	
	this.contentType = SNS_MESSAGE_CONTENT_TYPE.PUBLIC;
	
	this.type = SNS_FILTER_TYPE.RECEIVED | SNS_FILTER_TYPE.SEND;
	
	this.template = ['<ul class="publicmsg">',
	                 '<li><a target="_blank" href="##{{contentSourceUrl}}" class="publicitem relative first"><img src="##{{thumbUrl}}" class="publicimg"><span class="publicbanner">##{{title}}</span></a></li>',
	                 '<li><a target="_blank" href="##{{contentSourceUrl}}" class="publicitem cl"><div class="as-center"><img src="##{{thumbUrl}}" class="publicimg y"><div class="publictitle">##{{title}}</div></div></a></li>',
	                 '</ul>'];
	 
	this._doFilter = function(msg) {
		if(msg.getRosterOrChatRoom()){
			msg.rosterId = msg.getRosterOrChatRoom().getID();
			if(msg instanceof SNSInMessage || msg instanceof SNSOutMessage)
				msg.scrollToBottom = 'show';
		}
		var content = msg.body.content;
		msg.html = TemplateUtil.genHtml(this.template[0]);
		
		if(content.length){
			for(var x in content){
				var template = this.template[2];
				if(x==0){
					template = this.template[1];
				}
				if(content[x].thumbId){
					content[x].thumbUrl = YYIMChat.getFileUrl(content[x].thumbId);
				}
				msg.html += TemplateUtil.genHtml(template, content[x]);
			}
		}
		msg.html += TemplateUtil.genHtml(this.template[3]);
	};
	
};
SNSPublicContentRenderFilter.prototype = new SNSMessageFilter();
new SNSPublicContentRenderFilter().start();

SNSPublicContentRenderFilter.imgOnload = function(id, scrollToBottom){
	if(scrollToBottom == 'show'){
		SNSIMWindow.getInstance().getChatWindow().getTab(id).scrollToBottom();
	}
};
var SNSShareContentRenderFilter = function() {

	this.priority = 99;
	
	this.contentType = SNS_MESSAGE_CONTENT_TYPE.SHARE;
	
	this.type = SNS_FILTER_TYPE.RECEIVED | SNS_FILTER_TYPE.SEND;
	
	this.template = '<a class="share_title" style="font-size:14px;line-height:18px;max-height:36px;overflow:hidden;display:block;margin-bottom:5px;" href="##{{shareUrl}}">##{{shareTitle}}</a>'
		+ '<a style="float:left;" href="##{{shareUrl}}"><img src="##{{shareImageUrl}}" style="width:60px;display:block;" class="share_img"></a>'
		+ '<div style="margin-left:65px;color:#666666;" class="share_content">'
	    + '##{{shareDesc}}'
	    + '</div>';
	 
	this._doFilter = function(msg) {
		if(msg.getRosterOrChatRoom()){
			msg.rosterId = msg.getRosterOrChatRoom().getID();
			if(msg instanceof SNSInMessage || msg instanceof SNSOutMessage)
				msg.scrollToBottom = 'show';
		}
		msg.html = TemplateUtil.genHtml(this.template, msg.body.content);
	};
	
};
SNSShareContentRenderFilter.prototype = new SNSMessageFilter();
new SNSShareContentRenderFilter().start();

SNSShareContentRenderFilter.imgOnload = function(id, scrollToBottom){
	if(scrollToBottom == 'show'){
		SNSIMWindow.getInstance().getChatWindow().getTab(id).scrollToBottom();
	}
};
var SNSSinglePublicContentRenderFilter = function() {

	this.priority = 99;
	
	this.contentType = SNS_MESSAGE_CONTENT_TYPE.SYSTEM;
	
	this.type = SNS_FILTER_TYPE.RECEIVED | SNS_FILTER_TYPE.SEND;
	
	this.template = '<div class="singlemsg">'
		            +'<a href="##{{contentSourceUrl}}" class="title" target="_blank">##{{title}}</a>'
		            +'<span class="timer">##{{persontime}}</span>'
		            +'<a href="##{{contentSourceUrl}}" class="content" target="_blank">'
		            +'<img src="##{{thumbUrl}}" class="singlepic">'
		            +'<span class="summery">##{{title}}</span>'
		            +'<span class="getmore">查看全文</span>'
		            +'</a>'
					+'</div>';
	 
	this._doFilter = function(msg) {
		if(msg.getRosterOrChatRoom()){
			msg.rosterId = msg.getRosterOrChatRoom().getID();
			if(msg instanceof SNSInMessage || msg instanceof SNSOutMessage)
				msg.scrollToBottom = 'show';
		}		
		
		if(msg.body && msg.body.content && msg.body.content.thumbId){
			msg.body.content.thumbUrl = YYIMChat.getFileUrl(msg.body.content.thumbId);
		}
		
		if(msg.body && msg.body.dateline){
			msg.body.content.persontime = getPersonalTime(msg.body.dateline);
		}
		
		msg.html = TemplateUtil.genHtml(this.template, msg.body.content);
	};
	
};
SNSSinglePublicContentRenderFilter.prototype = new SNSMessageFilter();
new SNSSinglePublicContentRenderFilter().start();

SNSSinglePublicContentRenderFilter.imgOnload = function(id, scrollToBottom){
	if(scrollToBottom == 'show'){
		SNSIMWindow.getInstance().getChatWindow().getTab(id).scrollToBottom();
	}
};

function getPersonalTime(dateline){ //用于获取人性化的时间格式
		var daytimes = 1000 * 3600 * 24;//一天的毫秒数 
		var messdate = new Date(dateline);
		var messtime = messdate.getHours()+ ':' + messdate.getMinutes();
		
		for(var i=0;i<5;i++){
			var day = new Date(Date.now() - daytimes*i);
			var min = new Date(day.getFullYear(),day.getMonth(),day.getDate(),0,0,0);
			var max = new Date(day.getFullYear(),day.getMonth(),day.getDate(),23,59,59);
			if(dateline >= min.getTime() && dateline <= max.getTime()){
				switch(i){
					case 0: return '今日  ' + messtime;
					case 1: return '昨天  ' + messtime;
					case 2: return '前天  ' + messtime;
					case 3: 
					case 4: return i + '天前  ' + messtime;
				}
			}
		}
		
		return  (messdate.getMonth()+1) + '月' + messdate.getDate() + '日  ' + messtime; //messdate.getFullYear() + '年' 
}
var SNSTextContentRenderFilter = function() {

	this.priority = 99;
	
	this.contentType = SNS_MESSAGE_CONTENT_TYPE.TEXT;
	
	this.type = SNS_FILTER_TYPE.RECEIVED | SNS_FILTER_TYPE.SEND;
	
	this._doFilter = function(msg) {
		msg.html = msg.body.content;
	};
	
};
SNSTextContentRenderFilter.prototype = new SNSMessageFilter();
new SNSTextContentRenderFilter().start();
var SNSExpressionData = {
		DEFAULT:{
			name:SNS_I18N.Default,
			priority:0,
			folder:"res/skin/default/icons/expression/default",
			data:[{actionData:"[:愉快]",url:"smile_1f60a.png"},
					{actionData:"[:调皮]",url:"smile_1f60b.png"},
					{actionData:"[:傲娇]",url:"smile_1f60c.png"},
					{actionData:"[:色]",url:"smile_1f60d.png"},
					{actionData:"[:酷]",url:"smile_1f60e.png"},
					{actionData:"[:阴险]",url:"smile_1f60f.png"},
					{actionData:"[:亲吻]",url:"smile_1f61a.png"},
					{actionData:"[:吐舌]",url:"smile_1f61b.png"},
					{actionData:"[:鬼脸]",url:"smile_1f61c.png"},
					{actionData:"[:淘气]",url:"smile_1f61d.png"},
					{actionData:"[:难过]",url:"smile_1f61e.png"},
					{actionData:"[:囧]",url:"smile_1f61f.png"},
					{actionData:"[:叹气]",url:"smile_1f62a.png"},
					{actionData:"[:抓狂]",url:"smile_1f62b.png"},
					{actionData:"[:呵呵]",url:"smile_1f62c.png"},
					{actionData:"[:大哭]",url:"smile_1f62d.png"},
					{actionData:"[:惊讶]",url:"smile_1f62e.png"},
					{actionData:"[:诧异]",url:"smile_1f62f.png"},
					{actionData:"[:哈哈]",url:"smile_1f600.png"},
					{actionData:"[:嘻嘻]",url:"smile_1f601.png"},
					{actionData:"[:笑哭]",url:"smile_1f602.png"},
					{actionData:"[:高兴]",url:"smile_1f603.png"},
					{actionData:"[:开心]",url:"smile_1f604.png"},
					{actionData:"[:汗]",url:"smile_1f605.png"},
					{actionData:"[:大笑]",url:"smile_1f606.png"},
					{actionData:"[:天使]",url:"smile_1f607.png"},
					{actionData:"[:恶魔]",url:"smile_1f608.png"},
					{actionData:"[:眨眼]",url:"smile_1f609.png"},
					{actionData:"[:抿嘴]",url:"smile_1f610.png"},
					{actionData:"[:无视]",url:"smile_1f611.png"},
					{actionData:"[:鄙视]",url:"smile_1f612.png"},
					{actionData:"[:无语]",url:"smile_1f613.png"},
					{actionData:"[:无奈]",url:"smile_1f614.png"},
					{actionData:"[:撅嘴]",url:"smile_1f615.png"},
					{actionData:"[:难受]",url:"smile_1f616.png"},
					{actionData:"[:亲]",url:"smile_1f617.png"},
					{actionData:"[:爱]",url:"smile_1f618.png"},
					{actionData:"[:亲亲]",url:"smile_1f619.png"},
					{actionData:"[:愤怒]",url:"smile_1f620.png"},
					{actionData:"[:狂怒]",url:"smile_1f621.png"},
					{actionData:"[:委屈]",url:"smile_1f622.png"},
					{actionData:"[:痛苦]",url:"smile_1f623.png"},
					{actionData:"[:怒气]",url:"smile_1f624.png"},
					{actionData:"[:心塞]",url:"smile_1f625.png"},
					{actionData:"[:不开心]",url:"smile_1f626.png"},
					{actionData:"[:郁闷]",url:"smile_1f627.png"},
					{actionData:"[:生病]",url:"smile_1f628.png"},
					{actionData:"[:伤心]",url:"smile_1f629.png"},
					{actionData:"[:重病]",url:"smile_1f630.png"},
					{actionData:"[:惊恐]",url:"smile_1f631.png"},
					{actionData:"[:晕]",url:"smile_1f632.png"},
					{actionData:"[:尴尬]",url:"smile_1f633.png"},
					{actionData:"[:睡觉]",url:"smile_1f634.png"},
					{actionData:"[:晕菜]",url:"smile_1f635.png"},
					{actionData:"[:萌]",url:"smile_1f636.png"},
					{actionData:"[:害羞]",url:"smile_263a.png"}
			]
		}
}
var SNSExpressionPanel = function(data){
	
	this.data = data;
	
	this.selector = "#snsim_expression_panel";
	
	this.hideFloat = SNSComponent.HIDE_TYPE.HIDE_IGNORE_SELF;
	
//	this.tabs = new SNSTabContainer();
	
	this.template = 
		'<div id="snsim_expression_panel" class="snsim_layer">'
	          +'<div>'
		          +'<table border="0" cellspacing="0" cellpadding="0">'
			          +'<tbody>'
				          +'<tr>'
					          +' <td>'
						          +'<div class="content snsim_layer_faces clearfix">'
							          +'<a class="snsim_icon_close snsim_layer_close"  href="javascript:void(0);"></a>'
							          +'<div class="detail">'
							          	+'<ul class="faces_list clearfix">##{{_getExpressionHtml()}}</ul>'
							          +'</div>'
						          +'</div>'
					          +'</td>'
				          +'</tr>'
			          +' </tbody>'
		          +' </table>'
	          +' </div>'
          +'</div>';
	
	this.expressionContainer = "#snsim_expression_panel .faces_list";
	
	this.expressionSelector = "ul.faces_list li";
	
	this.closeBtnSelector = "#snsim_expression_panel .snsim_icon_close";
	
	this.attachDom = "#expressionBtn";
	
	this.expressionTemplate = 
			'<li><a action-data="##{{actionData}}" href="javascript:void(0);" title="">'
			+ '<img node-type="expression" width="25" action-data="##{{actionData}}" src="##{{getSNSBasePath()}}##{{folder}}/##{{url}}"></a></li>';
		
};

SNSExpressionPanel.prototype = new SNSFloatPanel();

SNSExpressionPanel.prototype._init = function(){
	if (this.getDom().length == 0) {
		var html = this.buildHtml();
		jQuery("body").append(html);
		this._bindDomEvent();
		this._bindExpressionDomEvent();
	}
	
	 jQuery(this.attachDom).bind("click", jQuery.proxy(function(event){
		 if(this.getDom().length>0){
			 this.afterShow();
			 this.toggle();
		 }else{//表情窗口还没有初始化
			 this.show();
			 this.afterShow();
			 this._bindExpressionDomEvent();
		 };
		 event.stopPropagation();
	 },this));
	 
	SNSFloatPanel.prototype._init.call(this);
};

SNSExpressionPanel.prototype._getExpressionHtml = function(){
	var html = "";
	for(var i in this.data.DEFAULT.data){
		var item = this.data.DEFAULT.data[i];
		if(item && item.url){
			html+= TemplateUtil.genHtml(this.expressionTemplate, [item,{folder:this.data.DEFAULT.folder}]);
		}
	}
	return html;
};

SNSExpressionPanel.prototype.afterShow = function(){
	var offset = jQuery(this.attachDom).offset();
	this.getDom().css("top", offset.top-274);
	this.getDom().css("left", offset.left - 10);
};

SNSExpressionPanel.prototype._bindExpressionDomEvent = function(){
	var that = this;
	this.getDom().find(this.expressionSelector).bind("click", function() {
		// 将表情插入鼠标所在位置
		var html = jQuery(this).find("img")[0].outerHTML;
		SNSIMWindow.getInstance().getChatWindow().getSendBox().insertHtmlContent(html);
		that.hide();
	});
	jQuery(this.closeBtnSelector).bind("click", jQuery.proxy(this.hide, this));
};

SNSExpressionPanel.prototype.getTemplate = function(){
	return this.template;
}

var SNSExpressionPlugin = function(){
	this.name = "exrepssion";
	
	this.panel = new SNSExpressionPanel(SNSExpressionData);
};

SNSExpressionPlugin.prototype = new SNSPlugin();

SNSExpressionPlugin.prototype._init = function(){
	this.panel._init();
	SNSPlugin.prototype._init.call(this);
};

new SNSExpressionPlugin().start();
var SNSExpressionTab = function(expressionItem){
	this.data = expressionItem;
};

/**
 * Tab头部使用的模板
 * @static
 */
SNSExpressionTab.headTemplate;

/**
 * Tab内容部分使用的模板
 * @static
 */
SNSExpressionTab.contentTemplate;

SNSExpressionTab.prototype = new SNSTab();


/**
 * 返回头部模板，用于屏蔽不同Tab的模板声明的不同
 * @returns {String}
 * @Abstract
 */
SNSExpressionTab.prototype.getHeadTemplate = function(){
	return SNSExpressionTab.headTemplate;
};

/**
 * 返回内容模板，用于屏蔽不同Tab的模板声明的不同
 * @returns {String}
 * @Abstract
 */
SNSExpressionTab.prototype.getContentTemplate = function(){
	return SNSExpressionTab.contentTemplate;
};
var SNSFontPanel = function(){
	
	this.selector = "#snsim_font_panel";
	this.setFontFamilyBtnSelector = ".set_font_family";
	this.setFontSizeBtnSelector = ".set_font_size";
	this.setFontBoldBtnSelector = ".set_font_bold";
	this.setFontItalicBtnSelector = ".set_font_italic";
	this.setFontUnderLineBtnSelector = ".set_font_underline";
	this.insertDom = '#snsim_chat_sendbox_toolbar';
	
	this.hideFloat = SNSComponent.HIDE_TYPE.HIDE_IGNORE_SELF;
	this.template = 
		'<div id="snsim_font_panel" class="set_font_panel">'
          +'<select class="set_font_family"></select> <select class="set_font_size"></select>'
          +'<a class="set_font_bold" title="粗体"></a>'
          +'<a class="set_font_italic" title="斜体"></a>'
          +'<a class="set_font_underline" title="下划线"></a>'
          +'<input type="text" id="fontColorSelector" style="display: none;" />'
      +'</div>';
	
	this.attachDom = "#fontBtn";
};

SNSFontPanel.prototype = new SNSFloatPanel();
SNSFontPanel.prototype._init = function(){
	jQuery(this.attachDom).bind("click", jQuery.proxy(function(event){
		 if(this.getDom().length>0){
			 this.afterShow();
			 this.toggle();
		 }else{//表情窗口还没有初始化
			 this.show();
			 this.initFontStyles();
			 this.afterShow();
			 this._bindFontDomEvent();
		 };
		 event.stopPropagation();
	 },this));
	 
	SNSFloatPanel.prototype._init.call(this);
};

/**
 * 初始化字体和大小列表
 */
SNSFontPanel.prototype.initFontStyles = function(){
	for(var fontFamily in SNSMessageStyle.FONT_FAMILYS){
		this.getDom().find(this.setFontFamilyBtnSelector).append("<option value ='" + fontFamily + "'>" + SNSMessageStyle.FONT_FAMILYS[fontFamily] + "</option>");
	}
	
	for(var i = 12; i <= 30; i+=2){
		this.getDom().find(this.setFontSizeBtnSelector).append("<option value ='" + i + "'>" + i + "</option>");
	}
	
	if(jQuery("#snsim_font_panel .sp-replacer").length < 1){
		jQuery("#fontColorSelector").spectrum({
		    showPaletteOnly: true,
		    togglePaletteOnly: true,
		    togglePaletteMoreText: '更多',
		    togglePaletteLessText: '常用',
		    color: 'blanchedalmond',
		    palette: [
		        ["#000","#444","#666","#999","#ccc","#eee","#f3f3f3","#fff"],
		        ["#f00","#f90","#ff0","#0f0","#0ff","#00f","#90f","#f0f"],
		        ["#f4cccc","#fce5cd","#fff2cc","#d9ead3","#d0e0e3","#cfe2f3","#d9d2e9","#ead1dc"],
		        ["#ea9999","#f9cb9c","#ffe599","#b6d7a8","#a2c4c9","#9fc5e8","#b4a7d6","#d5a6bd"],
		        ["#e06666","#f6b26b","#ffd966","#93c47d","#76a5af","#6fa8dc","#8e7cc3","#c27ba0"],
		        ["#c00","#e69138","#f1c232","#6aa84f","#45818e","#3d85c6","#674ea7","#a64d79"],
		        ["#900","#b45f06","#bf9000","#38761d","#134f5c","#0b5394","#351c75","#741b47"],
		        ["#600","#783f04","#7f6000","#274e13","#0c343d","#073763","#20124d","#4c1130"]
		    ],
			move: function(color) {
				SNSIMWindow.getInstance().getChatWindow().getSendBox().getContentDom().css("color", color.toHexString());
				SNSMessageStyle.getInstance().color = color.toHexString();
			}
		});
		jQuery("#fontColorSelector").spectrum("show");
		jQuery("#fontColorSelector").spectrum("hide");
	}
};

SNSFontPanel.prototype.afterShow = function(){
	var offset = jQuery(this.attachDom).offset();
	this.getDom().css("top", offset.top-33);
	this.getDom().css("left", offset.left-12);
};

/**
 * 字体样式（family,size,bold,italic,underline）
 */
SNSFontPanel.prototype._bindFontDomEvent = function(){
	this.getDom().find(this.setFontFamilyBtnSelector).bind("change", function() {
		SNSIMWindow.getInstance().getChatWindow().getSendBox().getContentDom().css("font-family", SNSMessageStyle.FONT_FAMILYS[this.value]);
		SNSMessageStyle.getInstance().font = this.value;
	});
	this.getDom().find(this.setFontSizeBtnSelector).bind("change", function() {
		SNSIMWindow.getInstance().getChatWindow().getSendBox().getContentDom().css("font-size", this.value + "px");
		SNSMessageStyle.getInstance().size = this.value;
	});
	this.getDom().find(this.setFontBoldBtnSelector).bind("click", function() {
		var sendBoxContentDom = SNSIMWindow.getInstance().getChatWindow().getSendBox().getContentDom();
		if(sendBoxContentDom.hasClass("font_bold")){
			sendBoxContentDom.removeClass("font_bold");
			SNSMessageStyle.getInstance().biu -= SNSMessageStyle.BIU_TYPE.BOLD;
		}else{
			sendBoxContentDom.addClass("font_bold");
			SNSMessageStyle.getInstance().biu = SNSMessageStyle.BIU_TYPE.BOLD | SNSMessageStyle.getInstance().biu;
		}
	});
	this.getDom().find(this.setFontItalicBtnSelector).bind("click", function() {
		var sendBoxContentDom = SNSIMWindow.getInstance().getChatWindow().getSendBox().getContentDom();
		if(sendBoxContentDom.hasClass("font_italic")){
			sendBoxContentDom.removeClass("font_italic");
			SNSMessageStyle.getInstance().biu -= SNSMessageStyle.BIU_TYPE.ITALIC;
		}else{
			sendBoxContentDom.addClass("font_italic");
			SNSMessageStyle.getInstance().biu = SNSMessageStyle.BIU_TYPE.ITALIC | SNSMessageStyle.getInstance().biu;
		}
	});
	this.getDom().find(this.setFontUnderLineBtnSelector).bind("click", function() {
		var sendBoxContentDom = SNSIMWindow.getInstance().getChatWindow().getSendBox().getContentDom();
		if(sendBoxContentDom.hasClass("font_underline")){
			sendBoxContentDom.removeClass("font_underline");
			SNSMessageStyle.getInstance().biu -= SNSMessageStyle.BIU_TYPE.UNDERLINE;
		}else{
			sendBoxContentDom.addClass("font_underline");
			SNSMessageStyle.getInstance().biu = SNSMessageStyle.BIU_TYPE.UNDERLINE | SNSMessageStyle.getInstance().biu;
		}
	});
};

SNSFontPanel.prototype.getTemplate = function(){
	return this.template;
}
SNSFontPanel.prototype.getInsertDom = function() {
	return this.insertDom;
}

var SNSFontPlugin = function(){
	this.name = "font";
	
	this.panel = new SNSFontPanel();
};

SNSFontPlugin.prototype = new SNSPlugin();

SNSFontPlugin.prototype._init = function(){
	this.panel._init();
	SNSPlugin.prototype._init.call(this);
};

new SNSFontPlugin().start();
var SNSMyDevicePlugin = function() {

	this.name = "myDevice";

	this.loadPeriod = SNS_EVENT_SUBJECT.AFTER_CONNECT;
	this.enable = true;

	this.myDeviceGroup;
	this.myDeviceRoster;
};

SNSMyDevicePlugin.prototype = new SNSPlugin();

SNSMyDevicePlugin.prototype._init = function() {
	if(!SNSMyDevicePlugin._instance)
		SNSMyDevicePlugin._instance = this;
	
	this.myDeviceGroup = new SNSDeviceGroup();
	this.renderDeviceGroup();
	var myAndroid = new SNSDeviceRoster("android-v2.0","我的设备");
	myAndroid.groups = [SNSDeviceGroup.getInstance()];
	this.addDevice(myAndroid);
	
	SNSPlugin.prototype._init.call(this);
};

SNSMyDevicePlugin.prototype.renderDeviceGroup = function(){
	// render
	var rosterTab = SNSIMWindow.getInstance().getWideWindow().getTab("roster");
	var groupDom = rosterTab.getGroupDom(this.myDeviceGroup);
	if (!groupDom) {
		var html = TemplateUtil.genHtml(rosterTab.groupTempalte, [ this.myDeviceGroup ]);
		var container = rosterTab.getDom().find(rosterTab.groupContainerSelector);
		container.prepend(html);
		rosterTab._bindGroupFoldEvent(this.myDeviceGroup);
	}
};

/**
 * core中的addRoster会根据bareJID进行过滤，不能添加多个设备
 * @param device
 */
SNSMyDevicePlugin.prototype.addDevice = function(device){
	var rosterTab = SNSIMWindow.getInstance().getWideWindow().getTab("roster");
	SNSApplication.getInstance().getUser().deviceList.add(device);
	if (device.groups.length > 0) {
		for (var i = 0; i < device.groups.length; i++) {
			var group = device.groups[i];
			var groupDom = rosterTab.addGroup(group);

			var html = TemplateUtil.genHtml(rosterTab.rosterTemplate, [ device, {
				groupname : group.name
			} ]);

			var container = jQuery("#list_content_" + group.name);
			container.append(html);
			
			rosterTab._bindRosterEvent(device, group);
		}
	}
};

SNSMyDevicePlugin.getInstance = function(){
	return SNSMyDevicePlugin._instance;
};
new SNSMyDevicePlugin().start();
var SNSOrganizationPlugin = function(){
	this.name="organization";
	this.loadPeriod = SNS_EVENT_SUBJECT.AFTER_CONNECT;
	this.organizationTab;
	this.enable=true;
};

SNSOrganizationPlugin.prototype = new SNSPlugin();

SNSOrganizationPlugin.prototype._init = function(){
	if(!SNSOrganizationPlugin._instance){
		SNSOrganizationPlugin._instance = this;
	}
	this.organizationTab = new SNSOrganizationTab();
	SNSIMWindow.getInstance().getWideWindow().addTab(this.organizationTab);
	SNSPlugin.prototype._init.call(this);
};

SNSOrganizationPlugin.getInstance = function(){
	return SNSOrganizationPlugin._instance;
};
//new SNSOrganizationPlugin().start();
var SNSOrganizationTab = function(){
	
	this.name="organization";
	this.headSelector = "#snsim_tab_head_organization";
	this.contentSelector = "#snsim_tab_content_organization";
	this.ztreeSelector = "#orgTree";
	
	this.ztree;
	
	this.zTreeSetting = {
			data : {
				simpleData : {
					enable : true
				}
			},
			view : {
				nameIsHTML : true,
				showLine : false,
				showTitle : false
			},
			callback : {
				onExpand : jQuery.proxy(this.onNodeExpand, this)
			}
		};
	
	this.operationMenuTemplate = 
		'##{{name}} <span jid="##{{jid}}" class="organization_list_opt" hidefloat="true" style="display:none;"></span>';
	
};

SNSOrganizationTab.headTemplate = 
	' <li id="snsim_tab_head_organization" title="组织结构" class="snsim_tab_head clearfix">'
		+' <a href="javascript:void(0);">'
			+'<span class="snsim_icon_tab snsim_icontab_organization"></span>'
		+'</a>'
    +'</li>';

SNSOrganizationTab.contentTemplate = 
	 '<div id="snsim_tab_content_organization" class="snsim_tab_content snsOrganizationScroll">'
		+'<div class="snsim_list_con">'
			+'<div class="zTreeDemoBackground left">'
				+'<ul id="orgTree" class="ztree"></ul>'
			+'</div>'
		+'</div>'
	+'</div>'

SNSOrganizationTab.prototype = new SNSTab();
SNSOrganizationTab.prototype._init = function(){
	// 添加滚动条
	jQuery("#snsim_tab_content_organization").perfectScrollbar();
	SNSTab.prototype._init.call(this);
};
SNSOrganizationTab.prototype.getHeadTemplate = function(){
	return SNSOrganizationTab.headTemplate;
};

SNSOrganizationTab.prototype.getContentTemplate = function(){
	return SNSOrganizationTab.contentTemplate;
};

SNSOrganizationTab.prototype.beforeSelect = function(){
	if(!this.ztree){
		this.loadRootNode();
	};
};

SNSOrganizationTab.prototype.loadRootNode = function() {
	var iq = new JSJaCIQ();
	iq.setType(SNS_TYPE.GET);
	iq.setTo("1@org." + SNSApplication.getInstance().getDomain());
	var query = iq.buildNode("query", {
		xmlns : NS_ORGANIZATION
	});
	iq.appendNode(query);
	YYIMChat.send(iq, jQuery.proxy(function(packet) {
		if (packet.isError()) {
			YYIMChat.log("SNSOrganizationTab.prototype.loadNodeByParent ", 0);
			return;
		}
		
		var zRootNode =[];
		
		var json = new Array();
		var xml = packet.doc.xml;
		var items = jQuery(xml).find("item[id]");
		for (var i = 0; i < items.length; i++) {
			var item = jQuery(items[i]);
			var node = new Object();
			node.id = item.attr("id");
			node.name = item.attr("name");
			var isUser = item.attr("isUser");
			var isLeaf = item.attr("isLeaf");
			if (isLeaf == "false" ) {
				node.isParent = true;
				node.iconSkin = "department"
			} else {
				node.isParent = false;
			}
			if( isUser =="true"){
				node.iconSkin = "person";
				node.name = this.getOperationHtml(node);
				node.click = "SNSOrganizationPlugin.getInstance().organizationTab.chatWithRoster('"+ item.attr("id") + "','" + item.attr("name") +"\')";
			}
			json.push(node);
			zRootNode.push({
				id:node.id,
				name:node.name,
				open:false,
				isParent:node.isParent,
				iconSkin:node.iconSkin
			});
		}
		this.ztree =  jQuery.fn.zTree.init(jQuery(this.ztreeSelector), this.zTreeSetting, zRootNode);
	}, this));
};

/**
 * 加载父节点对应子节点数据
 * @param parent		父节点对象，类型为treeNode, 为ztree内置类型
 */
SNSOrganizationTab.prototype.loadNodeByParent = function(parent) {
	
	if(parent.loaded ||parent.loading) return;
	this.addLoadingNode(parent);//显示正在加载
	parent.loading = true;
	var iq = new JSJaCIQ();
	iq.setType(SNS_TYPE.GET);
	iq.setTo(parent.id + "@org." + SNSApplication.getInstance().getDomain());
	var query = iq.buildNode("query", {
		xmlns : NS_ORGANIZATION
	});
	iq.appendNode(query);
	YYIMChat.send(iq, jQuery.proxy(function(packet, data) {
		if (packet.isError()) {
			YYIMChat.log("SNSOrganizationTab.prototype.loadNodeByParent ", 0, data);
			return;
		}
		var json = new Array();
		var xml = packet.doc.xml;
		var items = jQuery(xml).find("item[id]");
		for (var i = 0; i < items.length; i++) {
			var item = jQuery(items[i]);
			var node = new Object();
			node.id = item.attr("id");
			node.name = item.attr("name");
			var isUser = item.attr("isUser");
			var isLeaf = item.attr("isLeaf");
			if (isLeaf == "false" ) {
				node.isParent = true;
				node.iconSkin = "department"
			} else {
				node.isParent = false;
			}
			if( isUser =="true"){
				node.iconSkin = "person";
				node.name = this.getOperationHtml(node);
				node.click = "SNSOrganizationPlugin.getInstance().organizationTab.chatWithRoster('"+ item.attr("id") + "','" + item.attr("name") +"\')";
			}
			json.push(node);
		}
		parent.loaded = true;
		parent.loading = false;
		this.ztree.addNodes(data.parent, json);
		this.removeLoadingNode(data.parent);//加载完成后，删除正在加载按钮
	}, this), {
		parent: parent
	});
};

/**
 * 展开父节点时被激发的事件,并显示正在加载
 */
SNSOrganizationTab.prototype.onNodeExpand = function(event, treeId, treeNode) {
	var tid = treeNode.tId;
	this.loadNodeByParent(treeNode);
};

/**
 * 添加正在加载节点
 */
SNSOrganizationTab.prototype.addLoadingNode = function(parentNode){
	var node = new Object();
	node.id = Math.round(Math.random()*1000)+1000;
	node.iconSkin="loading";
	node.name="正在加载...";
	this.ztree.addNodes(parentNode, node,false);
};

/**
 * 删除正在加载节点
 */
SNSOrganizationTab.prototype.removeLoadingNode = function(parentNode){
	var nodes = this.ztree.getNodesByParam("iconSkin","loading", parentNode);
	for(var i=0; i<nodes.length;i++){
		this.ztree.removeNode(nodes[i]);
	}
};

SNSOrganizationTab.prototype.getOperationHtml = function(node){
	return TemplateUtil.genHtml(this.operationMenuTemplate, {jid:node.id ,name:node.name});
};

SNSOrganizationTab.prototype.chatWithRoster = function(jid, name){
	var roster = new SNSRoster(jid, name);
	SNSIMWindow.getInstance().getChatWindow().openChatWith(roster);
};
var SNSWorkflowMessageFilter = function(){
	this.name = "workflowFilter";
	
	this.priority = 0;
	
	this.contentType = SNS_MESSAGE_CONTENT_TYPE.PUBLIC;
	
	this.type = SNS_FILTER_TYPE.RECEIVED;
	
	this._doFilter = function(msg) {
		if(msg.body.url){
			if(msg.from instanceof SNSWorkflowRoster){
				msg.html = '<a href="'+msg.body.url+'" target="_blank">'+msg.body.content+'</a>';
			}
		};
	};
};

SNSWorkflowMessageFilter.prototype = new SNSMessageFilter();

/**
 * 处理流程消息
 * @param message {SNSInMessage} 被处理的消息
 * @return {String} 消息对应的HTML字符串
 */
SNSWorkflowMessageFilter.prototype.genMessageHtml = function(message){
	
};
var SNSWorkflowPlugin = function() {

	this.name = "workflow";

	this.loadPeriod = SNS_EVENT_SUBJECT.AFTER_CONNECT;
	this.enable = true;

	this.workflowRoster;
	this.workflowMessageFilter;

};

SNSWorkflowPlugin.queryUrl = "http://172.20.5.212:9090/wfMessage";

SNSWorkflowPlugin.prototype = new SNSPlugin();

SNSWorkflowPlugin.prototype._init = function() {
	SNSApplication.getInstance().getGlobalEventManager().registerEventHandler(SNS_EVENT_SUBJECT.ON_CURRENT_CHAT_CHANGE, true,
			this.onCurrentChatChange, this);
	
	this.workflowMessageFilter = new SNSWorkflowMessageFilter();
	this.workflowMessageFilter.start();

	this.workflowRoster = new SNSWorkflowRoster();
	SNSApplication.getInstance().getUser().addRoster(this.workflowRoster);

	SNSPlugin.prototype._init.call(this);
};

SNSWorkflowPlugin.prototype.onCurrentChatChange = function(event, data){
	var oldValue = data.oldValue;
	var newValue = data.newValue;
	if(newValue.getTarget() instanceof SNSWorkflowRoster){
		
		var messageTab = newValue.tabContainer.getTab("todo");
		if(!messageTab){
			newValue.tabContainer.addTab(new SNSInnerMessageTab(newValue.getTarget()));
		}
		
		var todoTab = newValue.tabContainer.getTab("todo");
		if(!todoTab){
			newValue.tabContainer.addTab(new SNSWorkflowTodoTab(newValue.getTarget()));
		}
	}
	
};

SNSWorkflowPlugin.prototype.openIframeWindow = function(event) {
	var url = event.data.url;
	var id = event.data.id;
	var iframePanel = new SNSIFrameFloatPanel(url, id, 600, 400);
	iframePanel.show();
};

//new SNSWorkflowPlugin().start();
var SNSWorkflowRoster = function(){
	this.jid = new JSJaCJID("workflow@"+SNSApplication.getInstance().getDomain());
	this.name = "我的任务";
	// 不查询vcard，因此先设非空值
	this.vcard = new SNSVCard();
	SNSPublicServiceGroup.getInstance().addRoster(this);
};

SNSWorkflowRoster.prototype = new SNSPublicServiceRoster();


var SNSWorkflowTodoTab = function(roster){
	this.name="todo";
	this.headSelector = "#snsim_tab_head_workflow_todo";
	this.contentSelector = "#snsim_tab_content_workflow_todo";
	this.containerSelector = "#snsim_tab_content_workflow_todo .snsim_workflow_todo_container";
	
	this.workflowTemplate = 
		'<li id="snsim_workflow_item_##{{workflowId}}" class="snsim_workflow_item"><a href="##{{url}}" target="_blank">##{{name}}</a><span class="W_fr">##{{creator}}</span><span class="W_fr">##{{createdate}}</span></li>';
	
	//{"result":[{"createdate":"2014-09-24 14:17:13","creator":"000113100000000008I3","messageId":"2madej7kmaecj2q43pld","name":"费用","url":"http:\/\/172.20.5.212:8090\/portal\/app\/cp_docnode\/cp_docformnode?pk_doc=000113100000000009O2&model=uap.lfw.dbl.cpdoc.base.DefaultCpDocPageModel&taskPk=00001310000000001UD2&pk_freeform=00001310000000001UCY&makeuser=000113100000000008I3&nodecode=dbl_money&$pa_0_appid=cp_docnode&$pa_1_windowid=cp_docformnode&$pa_2_busiid=000113100000000009OS&$pa_3_pk_prodef=00001510000000000AT3&$pa_4_port_id=4&$pa_5_pk_funcnode=000113100000000009OQ","usercode":"000113100000000008IB","workflowId":"00001310000000001UCY"},{"createdate":"2014-09-24 14:17:32","creator":"000113100000000008I3","messageId":"yvtj2ri28jr8y2rtebpf","name":"费用","url":"http:\/\/172.20.5.212:8090\/portal\/app\/cp_docnode\/cp_docformnode?pk_doc=000113100000000009O2&model=uap.lfw.dbl.cpdoc.base.DefaultCpDocPageModel&taskPk=00001310000000001UD9&pk_freeform=00001310000000001UD5&makeuser=000113100000000008I3&nodecode=dbl_money&$pa_0_appid=cp_docnode&$pa_1_windowid=cp_docformnode&$pa_2_busiid=000113100000000009OS&$pa_3_pk_prodef=00001510000000000AT3&$pa_4_port_id=4&$pa_5_pk_funcnode=000113100000000009OQ","usercode":"000113100000000008IB","workflowId":"00001310000000001UD5"}]}
	this.workflowData;
	
	this.publicRoster = roster;
};

SNSWorkflowTodoTab.headTemplate = 
	' <li id="snsim_tab_head_workflow_todo" title="待办" class="snsim_tab_head clearfix">'
		+' <a href="javascript:void(0);" class="process_tab">'
		+'<span class="snsim_icon_tab  ">待办</span>'
		+'</a>'
    +'</li>';

SNSWorkflowTodoTab.contentTemplate = 
	'<div id="snsim_tab_content_workflow_todo" class=" snsim_tab_content snsim_tab_content_roster sns_share_container snsRostersScroll">'
		+'<div style="height: 22px; margin-top: 10px; border-bottom: 1px solid #d6d6d6;display:none;">'
			+'<a class="snsim_workflow_todo_refresh_btn" style="margin-left: 20px;">刷新</a>'
		+'</div>'
		+'<div class="snsim_workflow_todo_container workflow_container  snsim_list_con">'
		+'</div>'
	+'</div>';

SNSWorkflowTodoTab.prototype = new SNSTab();

SNSWorkflowTodoTab.prototype._init = function(){
	this.getContainerDom().find(".snsim_workflow_todo_refresh_btn").bind("click", jQuery.proxy(this.queryWorkflowData, this));
};

SNSWorkflowTodoTab.prototype.getHeadTemplate = function(){
	return SNSWorkflowTodoTab.headTemplate;
};

SNSWorkflowTodoTab.prototype.getContentTemplate = function(){
	return SNSWorkflowTodoTab.contentTemplate;
};

SNSWorkflowTodoTab.prototype.beforeSelect = function(){
	if(this.getContainerDom().html().isEmpty()){
		if(!this.workflowData){
			this.queryWorkflowData();
			return;
		}
		this.showWorkflow();
	}
};

SNSWorkflowTodoTab.prototype.showWorkflow = function(){
	var container =this.getContainerDom();
	container.empty();
	for(var i =0; i< this.workflowData.length;i++){
		var item = this.workflowData[i];
		if(item){
			var html = TemplateUtil.genHtml(this.workflowTemplate , item);
			container.append(html);
		}
	}
	this._bindDomEvent();
};

SNSWorkflowTodoTab.prototype._bindDomEvent = function(){
	this.getContentDom().find(".snsim_workflow_item").bind("click",function(){
		var url = jQuery(this).find("a[url]").attr("url");
		var iframePanel = new SNSIFrameFloatPanel(url, Math.uuid(), 600, 400);
		iframePanel.show();
	});
};

SNSWorkflowTodoTab.prototype.queryWorkflowData = function(){
	var user = SNSApplication.getInstance().getUser();
	jQuery.getJSON(SNSWorkflowPlugin.queryUrl+"?usercode="+user.jid.getNode()+"&callback=?",jQuery.proxy(function(data){
		this.workflowData = data.result;
		this.showWorkflow();
	},this));
};
var SNSChatroomSearchTab = function(){
	
	this.name="chatroomSearchTab";
	
	this.headSelector = "#snsim_chatroom_search_tab_head";
	this.contentSelector = "#snsim_chatroom_search_tab_content";
	
	this.containerSelector = "#snsim_chatroom_search_tab_container";
	this.searchBtn = ".multi_search_btn";
	this.searchResultHeadSelector = ".search_result_head";
	
	this.searchInputBox = ".multi_search_input";
	
	this.chatroomTemplate =
	 	'<li>'
			+ '<div class="head_icon">'
				+ '<img src="##{{photo}}">'
			+ '</div>'
			+ '<div class="item_info">'
				+ '<span class="name" style="width: 150px;">##{{name}}</span>'
				+ '<a class="btn" style="color:##{{color}};" title="##{{title}}" onclick="##{{clickFunc}}">##{{info}}</a>'
			+ '</div>'
		+ '</li>';
};

SNSChatroomSearchTab.prototype = new SNSTab();

SNSChatroomSearchTab.prototype._init = function(){
	this.getContainerDom().parent().perfectScrollbar();
	this._bindDomEvent();
};

SNSChatroomSearchTab.prototype._bindDomEvent = function(){
	this.getContentDom().find(this.searchInputBox).bind("keydown",{self:this}, function(event){
		if (event.keyCode == SNS_KEY_CODE.ENTER) {
			event.data.self.sendSearchRequest();
		};
	});
	
	this.getContentDom().find(this.searchInputBox).bind("keyup",jQuery.proxy(function(event){
		var keyword = this.getSearchText();
		if(!keyword){
			this.getContainerDom().empty();
			this.getContentDom().find(this.searchResultHeadSelector).hide();
		}
	}, this));
	
	this.getContentDom().find(this.searchBtn).bind("click", {self:this},function(event){
		event.data.self.sendSearchRequest();
	});
};

SNSChatroomSearchTab.prototype.sendSearchRequest = function(){
	YYIMChat.queryChatGroup({
		keyword: this.getSearchText(), 
		success: jQuery.proxy(this.showSearchResult, this)
	});
};

SNSChatroomSearchTab.prototype.showSearchResult = function(resultObj){
	var result = resultObj.items;
	this.getContainerDom().empty();
	this.getContentDom().find(this.searchResultHeadSelector).show();
	var html = "";
	var friendHtml = "";
	var strangerHtml = "";
	for(var i=0; i<result.length;i++){
		var room = SNSApplication.getInstance().getUser().getRoom(result[i].id);
		if(room){
			friendHtml += TemplateUtil.genHtml(this.chatroomTemplate, 
				{
					photo: room.getPhotoUrl(),
					name: room.name? room.name : room.getID(),
					clickFunc: "SNSIMWindow.getInstance().getChatWindow().openChatWith('"+ room.getID() +"')", 
					title: "聊天", 
					info: "聊天",
					color: "#36c048"
				}
			);
		}else{
			strangerHtml += TemplateUtil.genHtml(this.chatroomTemplate, 
				{
					photo: SNSConfig.CHAT_ROOM.DEFAULT_AVATAR,
					name: result[i].name, 
					clickFunc: "SNSIMWindow.getInstance().getChatRoomController().joinChatRoom('"+ result[i].id +"', '" + result[i].name + "')", 
					title: "加入", 
					info: "加入",
					color: "#ffa00a"
				}
			);
		}
	}
	this.getContainerDom().append(friendHtml + strangerHtml);
};

SNSChatroomSearchTab.prototype.getSearchText = function(){
	return this.getContentDom().find(this.searchInputBox).val().trim();
};
var SNSLocalSearchPanel = function(){
	this.selector = "#snsim_local_search";
	
	this.localSearchBtnSelector = "#snsim_local_search_btn";
	this.localSearchInputSelector = "#snsim_local_search_input";
	this.localSearchResultSelector = ".local_search_result";
	this.localSearchResultListSelector = ".snsim_local_search_result_list";
	
	this.resultItemTemplate = 
		'<li rosterId="##{{id}}">'
			+'<img src="##{{getPhotoUrl()}}">'
			+'<span class="user_name">##{{name}}</span>'
		+'</li>';
}; 

SNSLocalSearchPanel.prototype = new SNSComponent();

SNSLocalSearchPanel.prototype._init = function(){
	this.getDom().find(this.localSearchResultSelector).perfectScrollbar();
	this._bindDomEvent();
};

SNSLocalSearchPanel.prototype._bindDomEvent = function(){
	this.getDom().find(this.localSearchBtnSelector).bind("click", function(){
		
	});
	
	this.getDom().find(this.localSearchInputSelector).bind("keyup", jQuery.proxy(function(){
		this.renderResult(this.getDom().find(this.localSearchInputSelector).val());
	},this));
	
	/*
	 	input placeholder属性
	 	
		目前浏览器的支持情况
	
		浏览器	IE6/7/8/9	IE10+	Firefox	Chrome	Safari 
		是否支持	NO	YES	YES	YES	YES
		 
	
		然而，虽然IE10+支持placeholder属性，它的表现与其它浏览器也不一致
	
		IE10+里鼠标点击时（获取焦点）placeholder文本消失
		Firefox/Chrome/Safari点击不消失，而是键盘输入时文本消失
	*/
	this.getDom().find(this.localSearchInputSelector).bind("blur", function() {
		jQuery(this).attr('placeholder','查找联系人')
	});
	this.getDom().find(this.localSearchInputSelector).bind("focus", function() {
		jQuery(this).attr('placeholder','')
	});
};

SNSLocalSearchPanel.prototype.renderResult = function(keyword){
	this.getDom().find(this.localSearchResultListSelector).html("");//rongqb 20150626
	jQuery(this.localSearchResultSelector).removeClass('cover');
	if(keyword){
		var resultList =  SNSApplication.getInstance().getUser().localSearch(keyword);
		for(var i = 0; i < resultList.length; i++){
			var html = TemplateUtil.genHtml(this.resultItemTemplate, resultList[i]);
			this.getDom().find(this.localSearchResultListSelector).append(html);
		}
		
		if(resultList.length){ //rongqb 20150626
			jQuery(this.localSearchResultSelector).addClass('cover');
		}
		
		this.getDom().find(this.localSearchResultListSelector + " li").bind("click",function(event){
			var roster = SNSApplication.getInstance().getUser().getRosterOrChatRoom(jQuery(event.currentTarget).attr("rosterId"));
			SNSIMWindow.getInstance().getChatWindow().openChatWith(roster);
		});
	}
};
var SNSPublicAccountSearchTab = function(){
	
	this.name="publicAccountSearchTab";
	
	this.headSelector = "#snsim_pulic_account_search_tab_head";
	this.contentSelector = "#snsim_public_account_search_tab_content";
	
	this.containerSelector = "#snsim_public_account_search_tab_container";
	this.searchBtn = ".multi_search_btn";
	this.searchResultHeadSelector = ".search_result_head";
	
	this.searchInputBox = ".multi_search_input";
	
	this.publicAccountTemplate =
		'<li>'
			+ '<div class="head_icon">'
				+ '<img src="##{{photo}}">'
			+ '</div>'
			+ '<div class="item_info">'
				+ '<span class="name">##{{name}}</span>'
				+ '<a class="btn" style="color:##{{color}};" title="##{{title}}" onclick="##{{clickFunc}}">##{{info}}</a>'
				+ '<div class="info">##{{name}}</div>'
			+ '</div>'
		+ '</li>';
};

SNSPublicAccountSearchTab.prototype = new SNSTab();

SNSPublicAccountSearchTab.prototype._init = function(){
	this.getContainerDom().parent().perfectScrollbar();
	this._bindDomEvent();
};

SNSPublicAccountSearchTab.prototype._bindDomEvent = function(){
	this.getContentDom().find(this.searchInputBox).bind("keydown",{self:this}, function(event){
		if (event.keyCode == SNS_KEY_CODE.ENTER) {
			event.data.self.sendSearchRequest();
		};
	});
	
	this.getContentDom().find(this.searchInputBox).bind("keyup",jQuery.proxy(function(event){
		var keyword = this.getSearchText();
		if(!keyword){
			this.getContainerDom().empty();
			this.getContentDom().find(this.searchResultHeadSelector).hide();
		}
	}, this));
	
	this.getContentDom().find(this.searchBtn).bind("click", {self:this},function(event){
		event.data.self.sendSearchRequest();
	});
};

SNSPublicAccountSearchTab.prototype.sendSearchRequest = function(){
	YYIMChat.queryPubaccount({
		keyword: this.getSearchText(), 
		success: jQuery.proxy(this.showSearchResult, this)
	});
};

SNSPublicAccountSearchTab.prototype.showSearchResult = function(resultObj){
	var result = resultObj.items;
	this.getContainerDom().empty();
	this.getContentDom().find(this.searchResultHeadSelector).show();
	var friendHtml = "";
	var strangerHtml = "";
	for(var i=0; i<result.length;i++){
		var pubaccount = SNSApplication.getInstance().getUser().getRoster(result[i].id);
		if(pubaccount) {
			friendHtml += TemplateUtil.genHtml(this.publicAccountTemplate, 
				{
					name: pubaccount.name? pubaccount.name : pubaccount.getID(),
					photo: pubaccount.getPhotoUrl(),
					clickFunc: "SNSIMWindow.getInstance().getChatWindow().openChatWith('"+ pubaccount.getID() +"')", 
					title: "聊天", 
					info: "聊天",
					color: "#36c048"
				}
			);
		}
		else {
			strangerHtml += TemplateUtil.genHtml(this.publicAccountTemplate, 
				{
					name: result[i].name,
					photo: SNSConfig.ROSTER.PUB_ACCOUNT_DEFAULT_AVATAR,
					clickFunc: "SNSPlugin.pluginList.get('searchPlugin').searchWindow.addPublicAccount('"+ result[i].id +"', '" + result[i].name + "')", 
					title: "关注", 
					info: "关注",
					color: "#ffa00a"
				}
			);
		}
	}
	this.getContainerDom().append(friendHtml + strangerHtml);
};

SNSPublicAccountSearchTab.prototype.getSearchText = function(){
	return this.getContentDom().find(this.searchInputBox).val().trim();
};
var SNSRosterSearchTab = function(){
	this.name="rosterSearchTab";
	
	this.headSelector = "#snsim_roster_search_tab_head";
	this.contentSelector = "#snsim_roster_search_tab_content";
	
	this.containerSelector = "#snsim_roster_search_tab_container";
	
	this.searchBtn = ".multi_search_btn";
	
	this.searchResultHeadSelector = ".search_result_head";
	
	
	this.searchInputBox = ".multi_search_input";
	this.searchResultItemIdPrefix = "snsim_roster_search_item";
	
	this.rosterTemplate = 
	 	'<li id="'+ this.searchResultItemIdPrefix +'##{{roster.getID()}}">'
			+ '<div class="head_icon">'
			+ '<img src="##{{roster.getPhotoUrl()}}" onclick="SNSIMWindow.getInstance().getChatWindow().openChatWith(\'##{{roster.getID()}}\')" style="cursor:pointer" title="聊天">'
			+ '</div>'
			+ '<div class="item_info">'
				+ '<span class="name">##{{roster.name}}</span>'
				+ '<a class="btn" style="color:##{{color}};" title="##{{title}}" onclick="##{{clickFunc}}">##{{info}}</a>'
				+ '<div class="info">##{{roster.getID()}}</div>'
			+ '</div>'
		+ '</li>';
	this.askFriends = {};
};

SNSRosterSearchTab.prototype = new SNSTab();

SNSRosterSearchTab.prototype._init = function(){
	this.getContainerDom().parent().perfectScrollbar();
	this._bindDomEvent();
};

SNSRosterSearchTab.prototype._bindDomEvent = function(){
	this.getContentDom().find(this.searchInputBox).bind("keydown",{self:this}, function(event){
		if (event.keyCode == SNS_KEY_CODE.ENTER) {
			event.data.self.sendSearchRequest();
		};
	});
	
	this.getContentDom().find(this.searchInputBox).bind("keyup",jQuery.proxy(function(event){
		var keyword = this.getSearchText();
		if(!keyword){
			this.getContainerDom().empty();
			this.getContentDom().find(this.searchResultHeadSelector).hide();
		}
	}, this));
	
	this.getContentDom().find(this.searchBtn).bind("click", {self:this},function(event){
		event.data.self.sendSearchRequest();
	});
};

SNSRosterSearchTab.prototype.sendSearchRequest = function(){
	YYIMChat.queryRosterItem({
		keyword: this.getSearchText(), 
		success: jQuery.proxy(this.showSearchResult, this)
	});
};

SNSRosterSearchTab.prototype.showSearchResult = function(resultObj){
	var result = resultObj.items;
	this.getContainerDom().empty();
	this.getContentDom().find(this.searchResultHeadSelector).show();
	var friendHtml = "";
	var strangerHtml = "";
	for(var i=0; i<result.length;i++){

		result[i] = jQuery.extend(new SNSRoster(result[i].id), result[i]);
		result[i].id = result[i].id;
		result[i].photoUrl = result[i].photo;
		
		var roster = SNSApplication.getInstance().getUser().getRoster(result[i].getID());
		if(roster && roster.subscription == SNS_SUBSCRIBE.BOTH){
			friendHtml += TemplateUtil.genHtml(this.rosterTemplate, 
				{
					roster: result[i], 
					clickFunc: "SNSIMWindow.getInstance().getChatWindow().openChatWith('"+ result[i].id +"')", 
					title: "聊天", 
					info: "聊天",
					color: "#36c048"
				}
			);
		}else if(typeof(this.askFriends[result[i].id]) === 'undefined'){
			strangerHtml += TemplateUtil.genHtml(this.rosterTemplate, 
				{
					roster: result[i], 
					clickFunc: "SNSPlugin.pluginList.get('searchPlugin').searchWindow.addFriend('"+ result[i].id +"', '" + result[i].name + "');this.innerHTML='请求已发送';this.onclick=null;this.style.color='#999'", 
					title: "添加", 
					info: "添加",
					color: "#ffa00a"
				}
			);
		}else if(typeof(this.askFriends[result[i].id]) !== 'undefined'){
			strangerHtml += TemplateUtil.genHtml(this.rosterTemplate, 
					{
						roster: result[i], 
						title: "请求已发送", 
						info: "请求已发送",
						color: "#999"
					}
				);
		}
	}
	var _html = friendHtml + strangerHtml;
	if(_html.length === 0){
		_html = '<li>没有符合条件的用户...</li>';
	}
	this.getContainerDom().append(_html);
};

SNSRosterSearchTab.prototype.getSearchText = function(){
	return this.getContentDom().find(this.searchInputBox).val().trim();
};
var SNSSearchPlugin = function() {
	
	this.name="searchPlugin";
	
	this.enable = true;

	this.searchWindow;
	this.localSearchPanel;

	this.triggerBtn;
	
	this.loadPeriod = SNS_EVENT_SUBJECT.AFTER_CONNECT;
	
};

SNSSearchPlugin.prototype = new SNSPlugin();

SNSSearchPlugin.prototype._init = function() {
	SNSSearchPlugin._instance = this;
	
	this.searchWindow = new SNSSearchWindow();
	this.localSearchPanel = new SNSLocalSearchPanel();

	this.triggerBtn = new SNSTriggerBtn();
	this.triggerBtn.selector = "#snsim_multi_search_trigger_btn";
	this.triggerBtn.html = '<a id="snsim_multi_search_trigger_btn" class="multi_search" title="查找"  onclick="setTimeout(function(){jQuery(\'#search_roster\').focus();},0);"> </a>';
	this.triggerBtn.containerSelector = "#snsim_wide_window_bottom_container";
	this.triggerBtn.target = this.searchWindow;
	this.searchWindow._init();
	this.localSearchPanel._init();
	this.triggerBtn._init();
	
	SNSPlugin.prototype._init.call(this);
};

SNSSearchPlugin.getInstance = function(){
	return SNSSearchPlugin._instance;
}
new SNSSearchPlugin().start();


var SNSSearchWindow = function() {
	this.selector = "#snsim_multi_search_window";

	this.closeBtnSelector = ".multi_search_window_close";
	
	// 鼠标可拖动部分
	this.dragComponentSelector = '.multi_search_window_menu';

	this.tabs = new SNSTabContainer();

	this.headContainerSelector = this.selector + " .snsim_tab_head_container";
	this.contentContainerSelector = this.selector + ".snsim_tab_content_container";
	
	this.rosterSearchTab;
	this.chatroomSearchTab;
	this.publicAccountSearchTab;
	
	// 打开时其他窗口禁止操作
	this.maskOthers = true;
};

SNSSearchWindow.prototype = new SNSFloatPanel();

SNSSearchWindow.prototype._init = function() {
	SNSFloatPanel.prototype._init.call(this);
	
	this.tabs.selector = this.selector;
	this.tabs.headContainerSelector = this.headContainerSelector;
	this.tabs.contentContainerSelector = this.contentContainerSelector;

	this.tabs._init();
	
	this.rosterSearchTab = new SNSRosterSearchTab();
	this.tabs.addTab(this.rosterSearchTab);

	this.chatroomSearchTab = new SNSChatroomSearchTab();
	this.tabs.addTab(this.chatroomSearchTab);
	
	this.publicAccountSearchTab = new SNSPublicAccountSearchTab();
	this.tabs.addTab(this.publicAccountSearchTab);
	
	this.enableMove();
	this._bindDomEvent();
};

/**
 * 添加好友
 * @param id
 */
SNSSearchWindow.prototype.addFriend = function(id){
	this.rosterSearchTab.askFriends[id] = id;
	YYIMChat.addRosterItem(id);
	SNSIMWindow.getInstance().getDialog().set(DIALOG_TYPE.ALERT, SNS_I18N.confirm_add_friend, function(){
		SNSIMWindow.getInstance().getDialog().hide();
	});
	SNSIMWindow.getInstance().getDialog().show();
};

/**
 * 关注公共号
 * @param id
 */
SNSSearchWindow.prototype.addPublicAccount = function(id, name){
	YYIMChat.addPubaccount({
		id : id,
		success : function() {
			SNSApplication.getInstance().getUser().addRoster(new SNSPublicAccountRoster(id, name));
		}
	});
	SNSIMWindow.getInstance().getDialog().set(DIALOG_TYPE.ALERT, SNS_I18N.confirm_subscribe_pubaccount, function(){
		SNSIMWindow.getInstance().getDialog().hide();
	});
	SNSIMWindow.getInstance().getDialog().show();
};

/**
 * @Override
 */
SNSSearchWindow.prototype.show = function() {
	/**
		left: 50%;
		top: 50%;
		margin-left: -300px;
		margin-top: -200px;
	 */
	var dom = this.getDom(),
		top = document.body.clientHeight / 2 - jQuery('#snsim_multi_search_window').height() / 2,
		left = document.body.clientWidth / 2 - jQuery('#snsim_multi_search_window').width() / 2;
	
	dom.css('left', left);
	dom.css('top', top);
	
	SNSFloatPanel.prototype.show.call(this);
};


/**
 * @Override
 */
SNSSearchWindow.prototype.hide = function(){
	jQuery(this.selector).hide(function() {
		$(this).find('#snsim_roster_search_tab_container').empty();
	});
}

/**
 * @Override
 * 
 * 当前鼠标点击位置是否触发拖动
 * @param event
 * @returns {Boolean}
 */
SNSSearchWindow.prototype.validateMovability = function(event){
	var idSelector;
	if(!!event && event.target) {
		idSelector = "#" + jQuery(event.target).attr("id");
	} else {
		idSelector = "#" + jQuery(window.event.srcElement).attr("id");
	}
	
	if(idSelector == this.closeBtnSelector){
		return false;
	}
	return true;
};

/**
 * @Override
 * 
 * 拖动的部分
 */
SNSSearchWindow.prototype.getDragComponentSelector = function(){
	return this.selector + ' ' + this.dragComponentSelector;
};

/**
 * @Override
 * 
 * 移动的部分
 */
SNSSearchWindow.prototype.getMoveComponentSelector = function(){
	return this.selector;
};
var SNSSkinPlugin = function(){
	this.name = "skin";
	this.enable = true;

	this.loadPeriod = SNS_EVENT_SUBJECT.AFTER_CONNECT;
	
	this._skinFolder = 'res/skin/';
	this.skins = {
		'dark': this._skinFolder + 'dark/css/extend_common.css'
	};
	this._nodeType = 'snsim_css';
};

SNSSkinPlugin.prototype = new SNSPlugin();

SNSSkinPlugin.prototype._init = function(){
	if(SNSSkinPlugin.getInstance())
		return;
	SNSSkinPlugin._instance = this;
	
};

SNSSkinPlugin.getInstance = function(){
	return SNSSkinPlugin._instance;
};

new SNSSkinPlugin().start();

SNSSkinPlugin.prototype.changeSkin = function(name) {
	// 如果已经应用皮肤, 则恢复默认, 仅适于两套皮肤
	var linkNodes = jQuery('link[node-type="' + this._nodeType + '"]');
	if(linkNodes && linkNodes.length > 0){
		linkNodes.remove();
		return;
	}
	if(name && this.skins[name]){
		var cssPath = this.skins[name];
		var node = document.createElement("link");
		node.setAttribute("rel", "stylesheet");
		node.setAttribute("type", "text/css");
		node.setAttribute("node-type", this._nodeType);
		node.setAttribute("href", cssPath);
		document.getElementsByTagName("body")[0].appendChild(node);
	}
};
var SNSStorePlugin = function(){
	this.name = "store";
	this.enable = true;
	this.loadPeriod = SNS_EVENT_SUBJECT.AFTER_CONNECT;
	
	this.chatTabNames = [];
};

SNSStorePlugin.prototype = new SNSPlugin();

SNSStorePlugin.prototype.getChatTabsKey = function(){
	return "chatTabs#" + YYIMChat.getUserBareJID();
};
SNSStorePlugin.prototype.getActiveChatTabKey = function(){
	return "activeChatTab#" + YYIMChat.getUserBareJID();
};

SNSStorePlugin.prototype._init = function(){
	// 打开聊天框时存入LocalStorage
	//SNSApplication.getInstance().getGlobalEventManager().registerEventHandler(SNS_EVENT_SUBJECT.TAB_OPENED, true, this.onTabOpened, this);
	
	// 切换聊天框时存入LocalStorage
	SNSApplication.getInstance().getGlobalEventManager().registerEventHandler(SNS_EVENT_SUBJECT.ON_CURRENT_CHAT_CHANGE, true, this.onTabChange, this);
	
	// 重新登录成功后还原上次状态
	SNSApplication.getInstance().getGlobalEventManager().registerEventHandler(SNS_EVENT_SUBJECT.AFTER_LOAD_ROSTER, true, this.recover, this);
};

//SNSStorePlugin.prototype.onTabOpened = function(e, jid) {
//	if(!jid)
//		return;
//	SNSStorage.setLocal(this.getActiveChatTabKey(), jid);
//	if(!SNSArrayUtil.contains(this.chatTabNames, jid)){
//		this.chatTabNames.push(jid);
//		var jsonValue;
//		try{
//			jsonValue = JSON.stringify(this.chatTabNames);
//		}catch (e) {
//			YYIMChat.log("json parse error", 3, e);
//		}
//		if(jsonValue)
//			SNSStorage.setLocal(this.getChatTabsKey(), jsonValue);
//	}
//};

SNSStorePlugin.prototype.onTabChange = function(e, data) {
	if(data && data.newValue){
		var newTab = data.newValue;
		var jid = YYIMChat.getJIDUtil().getBareJID(newTab.getTarget().jid);
		if(!jid)
			return;
		SNSStorage.setLocal(this.getActiveChatTabKey(), jid);
		if(!SNSArrayUtil.contains(this.chatTabNames, jid)){
			this.chatTabNames.push(jid);
			var jsonValue;
			try{
				jsonValue = JSON.stringify(this.chatTabNames);
			}catch (e) {
				YYIMChat.log("json parse error", 3, e);
			}
			if(jsonValue)
				SNSStorage.setLocal(this.getChatTabsKey(), jsonValue);
		}
	}
};


SNSStorePlugin.prototype.recover = function() {
	// 上次活动的聊天框, 临时保存, 以免openChatWith()的时候被覆盖
	var tmpLastActiveChatTab = SNSStorage.getLocalVal(this.getActiveChatTabKey());
	// 上次打开的聊天框
	var chatTabsValue = SNSStorage.getLocalVal(this.getChatTabsKey());
	var chatTabNames = chatTabsValue? JSON.parse(chatTabsValue) : null;
	if(SNSArrayUtil.isArray(chatTabNames)){
		for(var i = 0; i < chatTabNames.length; i++){
			SNSIMWindow.getInstance().getChatWindow().openChatWith(chatTabNames[i]);
		}
	}
	// 上次活动的聊天框
	if(tmpLastActiveChatTab){
		SNSIMWindow.getInstance().getChatWindow().openChatWith(tmpLastActiveChatTab);
	}
};

SNSStorePlugin.getInstance = function(){
	return SNSStorePlugin._instance;
}
// new SNSStorePlugin().start();
var SNSToGroupChatPlugin = function(){
	this.name = "toGroupChat";
	this.enable = true;

	this.searchWindow;
	this.localSearchPanel;

	this.triggerBtn;
	
	this.loadPeriod = SNS_EVENT_SUBJECT.AFTER_CONNECT;
};

SNSToGroupChatPlugin.prototype = new SNSPlugin();

SNSToGroupChatPlugin.prototype._init = function(){
	// 转为群聊
	jQuery("#transToMUC").bind("click", jQuery.proxy(function() {
		var curRoster = SNSIMWindow.getInstance().getChatWindow().getActiveRoster();
		if (curRoster instanceof SNSRoster) {
			var uuid = Math.uuid().replace(/\-/g, "").toLowerCase().substr(0, 8);
			var name = (curRoster.name + "、" +SNSApplication.getInstance().getUser().name + "_" + uuid).substr(0, 8);
			YYIMChat.addChatGroup({
				name: name,
				node: uuid,
				//nickName: SNSApplication.getInstance().getUser().getID(),
				success: jQuery.proxy(function(arg) {
					var room = SNSApplication.getInstance().getUser().chatRoomList.createRoomHandler(arg);
					YYIMChat.addGroupMember({roomId:room.getID(), ids:[this.getID()]});
					SNSIMWindow.getInstance().getChatWindow().openChatWith(room);
					SNSIMWindow.getInstance().getInvitationWindow().show(room.getID());
				}, curRoster)
			});
		}
	}, this));
	
	SNSApplication.getInstance().getGlobalEventManager().registerEventHandler(SNS_EVENT_SUBJECT.ON_CURRENT_CHAT_CHANGE, true, function(e, data){
		if(data && data.newValue){
			var roster = data.newValue.getTarget();
			
			if(roster instanceof SNSRoster && !(roster instanceof SNSDeviceRoster)){
				jQuery("#transToMUC").show();
			}else{
				jQuery("#transToMUC").hide();
			}
		}
	}, this);
};

SNSToGroupChatPlugin.getInstance = function(){
	return SNSToGroupChatPlugin._instance;
}
new SNSToGroupChatPlugin().start();
var SNSUploadPlugin = function() {
	
	this.name="uploadPlugin";
	
	this.imageUpload;
	this.breakPointUpload;
	this.imageUploadId = "image_upload_input";
	this.breakPointId = "file_upload_input";
		
	this.enable = true;
	
	this.loadPeriod = SNS_EVENT_SUBJECT.AFTER_CONNECT;
	
};

SNSUploadPlugin.prototype = new SNSPlugin();

SNSUploadPlugin.prototype._init = function() {
	SNSUploadPlugin._instance = this;
	
	if(isSupportHtml5Upload === true) {
		this.initImageUpload();
		this.initBreakPointUpload();
	}
	else {
		YYIMChat.initUpload(
				{
					button_placeholder_id:"upload",
					button_image_url: SNS_REST_SERVER.UPLOADSWFURL+ "res/skin/default/icons/file_upload.png",
					flash_url: SNS_REST_SERVER.UPLOADSWFURL+ "res/js/swfupload.swf",
					contentType: "file",
					getChatInfo: function() {
						var activeRoster = SNSIMWindow.getInstance().getChatWindow().getActiveRoster(),
						type = SNS_CHAT_TYPE.CHAT, 
						resource;
						if(activeRoster instanceof SNSChatRoom)
							type = SNS_CHAT_TYPE.GROUP_CHAT;
						if(activeRoster.resource){
							resource = activeRoster.resource;
						}
						return {
							to: activeRoster.getID(),
							type: type,
							resource: resource
						};
					},
					success: function(msg){
						var msgOut = new SNSOutMessage(msg);
						msgOut.setFile(msg.body.content);
						SNSIMWindow.getInstance().getChatWindow().afterSendMessage(msgOut);
					},
					error: function(){
						alert("文件发送失败");
					}
				},
				{
					button_placeholder_id:"auploadImage",
					button_image_url: SNS_REST_SERVER.UPLOADSWFURL+ "res/skin/default/icons/image_upload.png",
					flash_url: SNS_REST_SERVER.UPLOADSWFURL+ "res/js/swfupload.swf",
					contentType: "image",
					getChatInfo: function() {
						var activeRoster = SNSIMWindow.getInstance().getChatWindow().getActiveRoster(),
						type = SNS_CHAT_TYPE.CHAT, 
						resource;
						if(activeRoster instanceof SNSChatRoom)
							type = SNS_CHAT_TYPE.GROUP_CHAT;
						if(activeRoster.resource){
							resource = activeRoster.resource;
						}
						return {
							to: activeRoster.getID(),
							type: type,
							resource: resource
						};
					},
					success: function(msg){
						var msgOut = new SNSOutMessage(msg);
						msgOut.setImage(msg.body.content);
						SNSIMWindow.getInstance().getChatWindow().afterSendMessage(msgOut);
					},
					error: function(){
						alert("图片发送失败");
					}
					
				}
		);
	}
	
	SNSPlugin.prototype._init.call(this);
};

SNSUploadPlugin.prototype.initImageUpload = function(){
	jQuery('#auploadImage').bind("click",{_self:this}, function(e){
		jQuery(e.target).find("#"+e.data._self.imageUploadId).trigger("click");
	});
	jQuery("#" + this.imageUploadId).bind("change", {_slef:this},function(e){
		var activeRoster = SNSIMWindow.getInstance().getChatWindow().getActiveRoster();
		var type = SNS_CHAT_TYPE.CHAT;
		if(activeRoster instanceof SNSChatRoom)
			type = SNS_CHAT_TYPE.GROUP_CHAT;
		var arg = {
			fileInputId: this.id,
			to: activeRoster.getID(),
			type: type,
			success: function(msg){
				if(msg.type == 'groupchat'){
					return;
				}
				
				var msgOut = new SNSOutMessage(msg);
				msgOut.setImage(msg.body.content);
				SNSIMWindow.getInstance().getChatWindow().afterSendMessage(msgOut);
			},
			error: function(){
				alert("图片发送失败");
			}
		};
		if(activeRoster.resource){
			arg.resource = activeRoster.resource;
		}
		YYIMChat.sendPic(arg);
	});
};

SNSUploadPlugin.prototype.initBreakPointUpload = function(){
	jQuery('#upload').bind("click",{_self:this}, function(e){
		jQuery(e.target).find("#"+e.data._self.breakPointId).trigger("click");
	});
	jQuery("#" + this.breakPointId).bind("change", {_slef:this},function(e){
		var activeRoster = SNSIMWindow.getInstance().getChatWindow().getActiveRoster();
		var type = SNS_CHAT_TYPE.CHAT;
		if(activeRoster instanceof SNSChatRoom)
			type = SNS_CHAT_TYPE.GROUP_CHAT;
		var arg = {
			fileInputId: this.id,
			to: activeRoster.getID(),
			type: type,
			success: function(msg){
				if(msg.type == 'groupchat'){
					return;
				}
				
				var msgOut = new SNSOutMessage(msg);
				msgOut.setFile(msg.body.content);
				SNSIMWindow.getInstance().getChatWindow().afterSendMessage(msgOut);
			},
			error: function(){
				alert("文件发送失败");
			},
			progress: function(arg){
				
			}
		};
		if(activeRoster.resource){
			arg.resource = activeRoster.resource;
		}
		YYIMChat.sendFile(arg);
	});
};

SNSUploadPlugin.getInstance = function(){
	return SNSUploadPlugin._instance;
}
new SNSUploadPlugin().start();





/*YYIMChat.initUpload({
	// 被替换的元素id
	button_placeholder_id : "upload",
	// 替换后的按钮图标
	button_image_url : "res/skin/default/icons/file_upload.png",
	// flash文件所在路径
	flash_url : "res/js/swfupload.swf",
	// 当前发送文件类型 "file" || "image"
	contentType : "file",
	// 获取消息接收方的函数, 需返回: {to: 接收方id, type: "chat" or "groupchat", 默认"chat", resource: 所在端, 可为空} 
	getChatInfo : function() {
		return {
			to : activeRoster.getID(),
			type : type,
			resource : resource
		};
	},
	success : function(msg) {
	},
	error : function() {
	}
}, 
// 第二个可上传附件的按钮
{
	...
}
	...
);*/

var SNSChangePasswordTab = function(){
	this.name="changePasswordTab";
	
	this.headSelector = "#snsim_change_pasword_head";
	this.contentSelector = "#snsim_change_pasword_content";
	
	// input
	this.oldPswInputSelector = "#oldpassword";
	this.newPswInputSelector = "#newpassword";
	this.newPsw2InputSelector = "#newpassword2";
	
	this.errorMessageSpanSelector = ".sns_psw_change_error_msg";
	
	this.submitChangePsdSelector = ".sns_psw_change_btn";
	this.cancelChangePsdSelector = ".sns_psw_change_btn_cancel";
};

SNSChangePasswordTab.prototype = new SNSTab();

SNSChangePasswordTab.prototype._init = function(){
	this._bindDomEvent();
	SNSTab.prototype._init.call(this);
};

SNSChangePasswordTab.prototype._bindDomEvent = function(){
	this.getContentDom().find(this.submitChangePsdSelector).bind("click", jQuery.proxy(function(){
		var newPsw = jQuery(this.newPswInputSelector).val();
		var newPsw2 = jQuery(this.newPsw2InputSelector).val();
		var old = jQuery(this.oldPswInputSelector).val();
		if(old && old.notEmpty() && newPsw && newPsw.notEmpty() && newPsw == newPsw2 && old !=newPsw){
			this.changePassword({oldPsw:old,newPsw:newPsw});
		}
	},this));
	
	this.getContentDom().find(this.cancelChangePsdSelector).bind("click", function(){
		var settingsWindow = SNSSettingsPlugin.getInstance().settingsWindow;
		settingsWindow.getDom().find(settingsWindow.closeBtnSelector).trigger("click");
	});
};

SNSChangePasswordTab.prototype.clearPswChangeInput = function() {
	jQuery(this.oldPswInputSelector).val("");
	jQuery(this.newPswInputSelector).val("");
	jQuery(this.newPsw2InputSelector).val("");
};

SNSChangePasswordTab.prototype.showPswChangeError = function(message) {
	this.getContentDom().find(this.errorMessageSpanSelector).html(message);
};

SNSChangePasswordTab.prototype.changePassword = function(oArg){
	var packet = new JSJaCIQ();
	packet.setType(SNS_TYPE.SET);
	var query  = packet.buildNode("query",{xmlns:NS_REGISTER});
	var username = packet.buildNode("username",{},{value:SNSApplication.getInstance().getUser().name});
	var password = packet.buildNode("password",{},{value:oArg.newPsw});
	query.appendChild(username);
	query.appendChild(password);
	packet.appendNode(query);
	YYIMChat.send(packet, jQuery.proxy(this.onChangePasswordForm, this), oArg);
};

SNSChangePasswordTab.prototype.onChangePasswordForm = function(packet){
	if(packet.isError()){
		this.showPswChangeError("error");
	}else{
		this.clearPswChangeInput();
	}
};
var SNSSettingsPlugin = function() {
	
	this.name="settingsPlugin";
	
	this.enable = true;

	this.settingsWindow;

	this.triggerBtn;
	
	this.loadPeriod = SNS_EVENT_SUBJECT.AFTER_CONNECT;
	
};

SNSSettingsPlugin.prototype = new SNSPlugin();

SNSSettingsPlugin.prototype._init = function() {
	SNSSettingsPlugin._instance = this;
	

	this.triggerBtn = new SNSTriggerBtn();
	this.settingsWindow = new SNSSettingsWindow();
	this.triggerBtn.selector = "#snsim_settings_trigger_btn";
	this.triggerBtn.html = '<a id="snsim_settings_trigger_btn" class="system_config" title="设置"> </a>';
	this.triggerBtn.containerSelector = "#snsim_wide_window_bottom_container";
	this.triggerBtn.target = this.settingsWindow;

	this.triggerBtn._init();
	this.settingsWindow._init();
	
	SNSPlugin.prototype._init.call(this);
};

SNSSettingsPlugin.getInstance = function(){
	return SNSSettingsPlugin._instance;
}
new SNSSettingsPlugin().start();


var SNSSettingsWindow = function() {
	this.selector = "#snsim_settings_window";

	this.closeBtnSelector = ".snsim_settings_window_close";

	this.tabs = new SNSTabContainer();

	this.headContainerSelector = this.selector + " .snsim_tab_head_container";
	this.contentContainerSelector = this.selector + ".snsim_tab_content_container";
	
	this.triggerBtnSelector = "#snsim_settings_trigger_btn";
	
	this.userInfoTab;
	this.systemConfigTab;
	this.changePasswordTab;
	
};

SNSSettingsWindow.prototype = new SNSWindow();

SNSSettingsWindow.prototype._init = function() {
	
	this.tabs.selector = this.selector;
	this.tabs.headContainerSelector = this.headContainerSelector;
	this.tabs.contentContainerSelector = this.contentContainerSelector;

	this.tabs._init();
	
	this.userInfoTab = new SNSUserInfoTab();
	this.tabs.addTab(this.userInfoTab);
	
	this.systemConfigTab = new SNSSystemConfigTab();
	this.tabs.addTab(this.systemConfigTab);
	
	this.changePasswordTab = new SNSChangePasswordTab();
	this.tabs.addTab(this.changePasswordTab);

	this._bindDomEvent();
};

SNSSettingsWindow.prototype._bindDomEvent = function(){
	jQuery(this.triggerBtnSelector).bind("click",jQuery.proxy(function(){
		this.userInfoTab.renderUserInfo();
	},this));
	SNSWindow.prototype._bindDomEvent.call(this);
};
var SNSSystemConfigTab = function(){
	this.name="systemConfigTab";
	
	this.headSelector = "#snsim_system_config_head";
	this.contentSelector = "#snsim_system_config_content";
};

SNSSystemConfigTab.prototype = new SNSTab();

SNSSystemConfigTab.prototype._init = function(){
	// TODO
	SNSTab.prototype._init.call(this);
};
var SNSUserInfoTab = function(){
	this.name="userInfoTab";
	this.selector = "#snsim_user_info_content";
	
	this.headSelector = "#snsim_user_info_head";
	this.contentSelector = "#snsim_user_info_content";
	
	 // flash替换
	this.changeUserPhotoBtnId = "user_change_head_icon";
	
	// 头像设置区域
	this.avatarUploaderSelector = "#snsim_user_avatar_uploader_preview";
	this.avatarUploaderVisiable = false;
	// 个人资料区域
	this.vcardContainerSelector = ".snsim_vcard_container";
	this.vcardContainerVisiable = false;
	
	// 当前头像
	this.headIconSelector = ".user_settings_head_icon";
	
	
	// 编辑资料
	this.vcardEditBtnSelector = ".edit_vcard_content_btn";
	
	// 提交/取消按钮
	this.submitBtnSelector = ".sns_vcard_change_btn";
	this.cancelBtnSelector = ".sns_vcard_change_btn_cancel";
	
	// 头像裁剪
	this.avatarUploader;
	this.avatarCropper;
	this.avatarCropperSelector = "bgDiv_user";//id
	this.avatarCropperWidth = 160;
	this.avatarCropperHeight = 160;
	this.photoUrl;

	this.isUserInfoAcquired = false;
	this.vcardTpl =  (function (){
		var vcard_field = [ "nickname", "email", "telephone", "mobile" ];
		var editBtn = '<a class="edit_vcard_content_btn">修改资料</a><br>'
    	var container_start = '<ul action-data="##{{getID()}}" class="snsim_vcard_info_list">';
		
		container_start += '<li node-type="vcardContentItem" class="snsim_vcard_content_item"><span class="snsim_vcard_content_item_label">帐号:</span>'
		+ '<span class="snsim_vcard_content_item_value">##{{SNSApplication.getInstance().getUser().getID()}}<span/></li>';
		
    	var container_end = '</ul>';
    	var sparate_line = '<li class="snsim_vcard_separate_line"></li>';
    	
    	var html = editBtn + container_start;
    	
    	for(var i=0; i<vcard_field.length; i++){
    		if(vcard_field[i]=="_"){
    			html+=sparate_line;
    			continue;
    		}
			html+='<li node-type="vcardContentItem" class="snsim_vcard_content_item"><span class="snsim_vcard_content_item_label">'+SNS_LANG_TEMPLATE["vcard_" + vcard_field[i].replace(".","_")]+':</span>'
			+ '<input type="text" disabled="disable" name="' + vcard_field[i] + '" class="snsim_vcard_content_item_value" value="##{{vcard.'+vcard_field[i]+'}}"/></li>';
    	}
        	
    	html+= container_end;
    	return html;
	})();
};

SNSUserInfoTab.prototype = new SNSTab();

SNSUserInfoTab.prototype._init = function(){
	var user = SNSApplication.getInstance().getUser();
	if(!user.vcard){
		user.requestVCard();
	}
	this.initAvatarUpload();
	//this.initAvatarCropper();
	//jQuery("#snsim_user_info_settings").perfectScrollbar({suppressScrollX:true});
	SNSTab.prototype._init.call(this);
};

SNSUserInfoTab.prototype.renderUserInfo = function(){
	jQuery(this.avatarUploaderSelector).hide();
	this.avatarUploaderVisiable = false;
	this.getDom().find(this.vcardContainerSelector).show();
	this.vcardContainerVisiable = true;
	
	if(!this.isUserInfoAcquired){
		var html = TemplateUtil.genHtml(this.vcardTpl, SNSApplication.getInstance().getUser());
//		this.getDom().find(this.vcardContainerSelector).append(html);
		this.getDom().find(this.vcardContainerSelector).html(html); //rongqb 20150626
		this.getDom().find(this.headIconSelector).attr("src", SNSApplication.getInstance().getUser().getPhotoUrl());
		this.isUserInfoAcquired = true;
		
		this._bindDomEvent();
	}
};

SNSUserInfoTab.prototype._bindVcardEditBtn = function(){
	jQuery(this.vcardEditBtnSelector).css("cursor","pointer");
	jQuery(this.vcardEditBtnSelector).bind("click",{_self : this},function(event){
		jQuery(this).css("cursor","not-allowed");
		var inputObj = event.data._self.getDom().find("input");
		inputObj.each(function(index,item){
			jQuery(item).attr('temp',item.value).removeAttr("disabled");
		});
		event.data._self.getDom().find("input[name='org.unit']").attr("disabled", "disable");
		event.data._self.getDom().find("input").addClass("vcard_input_edit");
		event.data._self.getDom().find("input[name='org.unit']").removeClass("vcard_input_edit");
	});
};
SNSUserInfoTab.prototype._bindDomEvent = function(){
	this._bindVcardEditBtn();
	
	// submit
	this.getDom().find(this.submitBtnSelector).bind("click", jQuery.proxy(this.submit ,this));
	
	//cancel
	this.getDom().find(this.cancelBtnSelector).bind("click",{_self : this}, jQuery.proxy(function(event){
		jQuery(event.data._self.vcardEditBtnSelector).css("cursor","pointer");
		var inputObj = event.data._self.getDom().find("input");
		inputObj.each(function(index,item){
			jQuery(item).val(jQuery(item).attr('temp')).attr("disabled","disabled");
		});
		
		event.data._self.getDom().find("input[name='org.unit']").removeAttr("disabled", "disable");
		event.data._self.getDom().find("input").removeClass("vcard_input_edit");
		event.data._self.getDom().find("input[name='org.unit']").addClass("vcard_input_edit");
		
		if(this.avatarUploaderVisiable){
			jQuery(this.avatarUploaderSelector).hide();
			this.avatarUploaderVisiable = false;
			this.getDom().find(this.vcardContainerSelector).show();
			this.vcardContainerVisiable = true;
			return;
		}
//		
//		var settingsWindow = SNSSettingsPlugin.getInstance().settingsWindow;
//		settingsWindow.getDom().find(settingsWindow.closeBtnSelector).trigger("click");
	}, this));
};

SNSUserInfoTab.prototype.initAvatarCropper = function(url){
	this.avatarCropper = new SNSAvatarCropper(this.avatarCropperSelector,"dragDiv_user",YYIMChat.getFileUrl(url),{
		Width : this.avatarCropperWidth,
		Height : this.avatarCropperHeight,
		Color : "#000",
		Resize : true,
		Right : "rRight_user",
		Left : "rLeft_user",
		Up : "rUp_user",
		Down : "rDown_user",
		RightDown : "rRightDown_user",
		LeftDown : "rLeftDown_user",
		RightUp : "rRightUp_user",
		LeftUp : "rLeftUp_user",
		//Preview : "viewDiv",
		viewWidth : 100,
		viewHeight : 100
	});
};

SNSUserInfoTab.prototype.initAvatarUpload = function(){
	var that = this;
	if(isSupportHtml5Upload === true) {
		jQuery('#user_change_head_icon').bind("click",{_self:this}, function(e){
			jQuery("#user_avatar_upload_input").trigger("click");
			var inputObj = event.data._self.getDom().find("input");
			inputObj.each(function(index,item){
				jQuery(item).attr('temp',item.value).removeAttr("disabled");
			});
		});
		jQuery("#user_avatar_upload_input").bind("change", {_self:this},function(e){
			var arg = {
					fileInputId: this.id,
					to: YYIMChat.getUserBareJID(),
					success: function(arg){
						e.data._self.photoUrl = arg.attachId;
						e.data._self.cropAvatar(arg.attachId);
					},
					error: function(){
						alert("头像上传失败");
					}
			};
			YYIMChat.uploadAvatar(arg);
		});
	}
	else {
		YYIMChat.initUpload({
			button_placeholder_id:"user_change_head_icon",
			//button_image_url: "res/skin/default/icons/image_upload.png",
			flash_url: "res/js/swfupload.swf",
			contentType: "avatar",
			button_text : "<span class='user_change_head'>更改头像</span>",
			button_text_style : ".user_change_head { margin-left: 13px; color: #ffffff;}",
			button_width : 80,
			button_height : 22,
			button_cursor : SWFUpload.CURSOR.HAND,
			button_window_mode : SWFUpload.WINDOW_MODE.TRANSPARENT,
			success: function(attachId){
				that.photoUrl = attachId;
				that.cropAvatar(attachId);
			},
			error: function(){
				alert("头像上传失败");
			}
			
		});
	}
};

/**
 * 头像裁剪
 * @param url
 */
SNSUserInfoTab.prototype.cropAvatar = function(url){
	jQuery(this.avatarUploaderSelector).show();
	this.avatarUploaderVisiable = true;
	this.getDom().find(this.vcardContainerSelector).hide();
	this.vcardContainerVisiable = false;
	
	this.photoUrl = url;
	if(this.avatarCropper){
		this.avatarCropper.Url = YYIMChat.getFileUrl(url);
		this.avatarCropper.init();
	}else{
		this.initAvatarCropper(url);
	}
};

/**
 * 上传头像
 */
SNSUserInfoTab.prototype.submitPhoto = function(){
	var position = this.avatarCropper.getPos();
	var requestUrl = YYIMChat.getServletPath().AVATAR_SERVLET + "?attachId=" + this.photoUrl + "&width=" + this.avatarCropperWidth 
		+ "&height=" + this.avatarCropperHeight + "&startX=" + position.startX + "&startY=" + position.startY + "&endX=" + position.endX + "&endY=" + position.endY
		+ "&fromUser=" + YYIMChat.getUserNode() + "&token=" + YYIMChat.getToken();
	
	jQuery.ajax({
		url: requestUrl,
		// 头像上传成功
		success: jQuery.proxy(function(pathObj){
			var path = pathObj.result.attachId;
			this.photoUrl = path;
			var vcardCopy = Object.clone(SNSApplication.getInstance().getUser().vcard);
			
			vcardCopy.updateUserPhotoUrl(path, {
				// vcard更新成功
				success: jQuery.proxy(function(){
					this.getDom().find(this.headIconSelector).attr("src", YYIMChat.getFileUrl(path));
					SNSApplication.getInstance().getUser().vcard.photo.binval = path;
				}, this)
			});
		}, this),
		error:function(XMLHttpRequest, textStatus, errorThrown){  
			YYIMChat.log("ajax error", 3, XMLHttpRequest.status+XMLHttpRequest.readyState+XMLHttpRequest.responseText);
		}
	});
};

SNSUserInfoTab.prototype.submitUserInfo = function(){
	this.getDom().find("input").attr("disabled", "disable");
	this.getDom().find("input").removeClass("vcard_input_edit");
	this._bindVcardEditBtn();
	
	var propList = this.getDom().find("input");
	var vcardCopy = Object.clone(SNSApplication.getInstance().getUser().vcard);
	for (var i = 0; i < propList.length; i++) {
		var splitIndex = propList[i].name.indexOf(".");
		if (splitIndex != -1) {
			vcardCopy[propList[i].name.substr(0, splitIndex)][propList[i].name.substr(splitIndex + 1)] = propList[i].value;
		} else {
			vcardCopy[propList[i].name] = propList[i].value;
		}
	}
	vcardCopy.update({success: jQuery.proxy(function(){
		SNSApplication.getInstance().getUser().vcard = vcardCopy;
		alert('修改成功！');
		var settingsWindow = SNSSettingsPlugin.getInstance().settingsWindow;
		settingsWindow.getDom().find(settingsWindow.closeBtnSelector).trigger("click");
	},this)});
};

SNSUserInfoTab.prototype.submit = function(){
	if(this.vcardContainerVisiable){
		this.submitUserInfo();
	}else{
		this.submitPhoto();
		jQuery(this.avatarUploaderSelector).hide();
		this.avatarUploaderVisiable = false;
		this.getDom().find(this.vcardContainerSelector).show();
		this.vcardContainerVisiable = true;
	}
};
var SNSSpaceChatGroupMemberProvider = function(){
	
};

/**
 * 获取指定群的群成员
 * @param arg {id: string, success: function, error: function,complete: function}
 */
SNSSpaceChatGroupMemberProvider.prototype.getGroupMembers = function(arg){
	if(!arg)
		return;
	var url = SNSSpaceApplication.REST_BASE + 'group/person/mid/' + YYIMChat.getUserBareNode() + '/group/' + arg.id;
	jQuery.ajax({
		url: url,
		dataType: 'jsonp',
		type: "get",
		success: jQuery.proxy(function(data, status, obj){
			YYIMChat.log("get member list success", 3, arguments); 
			this._memberListHandler(data, arg);
		}, this),
		error: function(data){
			YYIMChat.log("get member list error", 2, arguments); 
		}
	});
};

/**
 * 发送邀请报文给联系人，邀请其加入聊天室
 * @param roomId
 * @param ids {Array<String>}
 */
SNSSpaceChatGroupMemberProvider.prototype.addGroupMember = function(roomId, ids) {
	
};

SNSSpaceChatGroupMemberProvider.prototype._memberListHandler = function(list, arg){
	if(SNSCommonUtil.isFunction(arg.complete)) {
		arg.complete();
	}

	var fmtList = [];
	for(var key in list){
		var item = list[key];
		fmtList.push({
			id: String(item.member_id),
			name: String(item.username)
		});
	}
	if(SNSCommonUtil.isFunction(arg.success)){
		arg.success(JSON.stringify(fmtList));
	}
};
var SNSSpaceChatGroupProvider = function(){
	
};

/**
 * 查询自己所在的群组
 * @param arg {success: function, error: function, complete:function}
 */
SNSSpaceChatGroupProvider.prototype.getChatGroups = function(arg){
	if(!arg)
		return;
	var url = SNSSpaceApplication.REST_BASE + 'group/list/mid/'+ YYIMChat.getUserBareNode();
	jQuery.ajax({
		url: url,
		dataType: 'jsonp',
		type: "get",
		success: jQuery.proxy(function(data, status, obj){
			YYIMChat.log("get group list success", 3, arguments); 
			this._roomListHandler(data, arg);
		}, this),
		error: function(data){
			YYIMChat.log("get group list error", 2, arguments); 
		}
	});
};

/**
 * 创建群组
 * @param arg {name, node, desc, success: function, error: function, complete:function}
 */
SNSSpaceChatGroupProvider.prototype.addChatGroup = function(arg){
	if(!arg)
		return;
	var url = SNSSpaceApplication.REST_BASE + 'group/info/mid/'+ YYIMChat.getUserBareNode();
	jQuery.ajax({
		url: url,
		dataType: 'jsonp',
		type: "POST",
		data:{
			gname: arg.name,
			description: arg.desc? arg.desc : arg.name
		},
		success: jQuery.proxy(function(data, status, obj){
			YYIMChat.log("create group success", 3, arguments); 
			if(SNSCommonUtil.isFunction(arg.success)){
				arg.success(arg);
			}
		}, this),
		error: function(data){
			YYIMChat.log("get group list error", 2, arguments); 
		}
	});
};

/**
 * 退出一个群
 * @param roomId
 */
SNSSpaceChatGroupProvider.prototype.deleteChatGroup = function(roomId){};

/**
 * @param arg 搜索相关设置 {keyword, success, error}
 */
SNSSpaceChatGroupProvider.prototype.queryChatGroup = function(arg) {};

SNSSpaceChatGroupProvider.prototype._roomListHandler = function(list, arg){
	if(SNSCommonUtil.isFunction(arg.complete)) {
		arg.complete();
	}

	var fmtList = [];
	for(var key in list){
		var item = list[key];
		fmtList.push({
			id: String(item.gid),
			name: item.group_name
		});
	}
	YYIMChat.syncRoom(fmtList);
	
	if(SNSCommonUtil.isFunction(arg.success)){
		arg.success(JSON.stringify(fmtList));
	}
};
var SNSSpaceRosterProvider = function(){};

/**
 * 请求好友列表[required]
 * @param arg {success: function, error: function, complete:function}
 */
SNSSpaceRosterProvider.prototype.getRosterItems = function(arg){
	if(!arg)
		return;
	var url = SNSSpaceApplication.REST_BASE + 'member/follow/mid/' + YYIMChat.getUserBareNode();// + arg.username;
	jQuery.ajax({
		url: url,
		dataType: 'jsonp',
		type: "get",
		success: jQuery.proxy(function(data, status, obj){
			YYIMChat.log("get roster list success", 3, arguments); 
			this._rosterListHandler(data, arg);
		}, this),
		error: function(data){
			YYIMChat.log("get roster list error", 2, arguments); 
		}
	});
};

/**
 * 请求加好友 [required]
 * @param id id或者node
 */
SNSSpaceRosterProvider.prototype.addRosterItem = function(id){};

/**
 * 解除好友关系 [required]
 * @param arg {id: string, success: function, error: function,complete: function}
 */
SNSSpaceRosterProvider.prototype.deleteRosterItem = function(arg){};

/**
 * 从服务器搜索用户 [required]
 * @param arg 搜索相关设置 {keyword, success, error}
 */
SNSSpaceRosterProvider.prototype.queryRosterItem = function(arg) {
	if(!arg)
		return;
	var url = SNSSpaceApplication.REST_BASE + 'member/search/mid/' + YYIMChat.getUserBareNode() + '/key/' + arg.keyword;
	jQuery.ajax({
		url: url,
		dataType: 'jsonp',
		type: "get",
		success: jQuery.proxy(function(list, status, obj){
			YYIMChat.log("search roster results", 3, list); 
			var fmtList = [];
			for(var key in list){
				var item = list[key];
				fmtList.push({
					id: String(item.value),
					name: item.name
				});
			}
			if(SNSCommonUtil.isFunction(arg.success)){
				arg.success(JSON.stringify(fmtList));
			}
		}, this),
		error: function(data){
			YYIMChat.log("get roster list error", 2, arguments); 
		}
	});
};

SNSSpaceRosterProvider.prototype._rosterListHandler = function(list, arg){
	if(SNSCommonUtil.isFunction(arg.complete)) {
		arg.complete();
	}
	
	var fmtList = [];
	for(var key in list){
		var item = list[key];
		fmtList.push({
			id: String(item.id),
			name: item.name,
			photo: item.avatar,
			subscription: "both",
			group: []
		});
	}
	YYIMChat.syncRoster(fmtList);
	if(SNSCommonUtil.isFunction(arg.success)){
		arg.success(JSON.stringify(fmtList));
	}
};
var SNSSpaceApplication = {
	SERVLET: getSNSBasePath() + 'space',
	REST_BASE: 'http://172.20.5.201:94/service/'
};

SNSSpaceApplication.initProvider = function(){
	YYIMChat.setRosterProvider(new SNSSpaceRosterProvider());
	YYIMChat.setChatGroupProvider(new SNSSpaceChatGroupProvider());
	YYIMChat.setChatGroupMemberProvider(new SNSSpaceChatGroupMemberProvider());
};

// 登录方法重写, ajax请求, 在获取到token后使用YYIMChat.login进行登录
if(0){
	SNSSpaceApplication.initProvider();
	SNSApplication.prototype.getToken = function(username, password){
		jQuery.ajax({
			url: SNSSpaceApplication.REST_BASE + "im/login/user/" + username + "/pwd/" + password,
			dataType: 'jsonp',
			type: "get",
			success: function(data, status, obj){
				if(data.code == false){
					SNSApplication.getInstance().tokenErrorHandler({
						errorCode: 401,
						message: data.message
					});
				}
				YYIMChat.log("get token success", 3, arguments);
				YYIMChat.login(data.id, data.token, data.expiration);
			},
			error: function(data){
				SNSApplication.getInstance().tokenErrorHandler(JSON.parse(data));
			}
		});
	};
}

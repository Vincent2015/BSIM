var emptyFn = function(){};
var _logger = new YYIMConsoleLogger(YYIMConfiguration.LOG.FILTER_LEVEL);
var YYIMManager = function(){
	this._user;
	this.init();
	this._token = {};
	this._anonymousUser = false;
	this.appkey;
	this.version = '2.0';
};

YYIMManager.getInstance = function(){
	if (!YYIMManager._instance) {
		YYIMManager._instance = new YYIMManager();
	}
	return YYIMManager._instance;
};

YYIMManager.prototype.log = function(groupname, level, obj1, obj2){
	_logger.log(groupname, level, obj1, obj2);
};

/**
 * [INIT] 初始化，回调方法的设置
 * @param options
 */
YYIMManager.prototype.init = function(options){
	options = options || new Object();
	this.onOpened = options.onOpened || emptyFn;
	this.onClosed = options.onClosed || emptyFn;
	this.onAuthError = options.onAuthError || emptyFn;
	this.onStatusChanged = options.onStatusChanged || emptyFn;
	this.onConnectError = options.onConnectError || emptyFn;
	this.onUserBind = options.onUserBind || emptyFn;
	this.onPresence = options.onPresence || emptyFn;
	// 对方请求加好友
	this.onSubscribe = options.onSubscribe || emptyFn;
	// 自己删除好友成功或对方进行了删除操作 added @ 2015/04/27
	this.onRosterDeleted = options.onRosterDeleted || emptyFn;
	// 好友信息更新 added @ 2015/04/27
	this.onRosterUpdateded = options.onRosterUpdateded || emptyFn;
	
	this.onRoomMemerPresence = options.onRoomMemerPresence || emptyFn;
	this.onMessage = options.onMessage || emptyFn;
	this.onReceipts = options.onReceipts || emptyFn;
	this.onTextMessage = options.onTextMessage || emptyFn;
	this.onPictureMessage = options.onPictureMessage || emptyFn;
	this.onFileMessage = options.onFileMessage || emptyFn;
	this.onShareMessage = options.onShareMessage || emptyFn;
	this.onDeviceMessage = options.onDeviceMessage || emptyFn;
	this.onMessageOut = options.onMessageout || emptyFn;
	//logout = logout || emptyFn;
};

/**
 * 文件上传初始化, YYIMChat.initUpload({id, style},{id, style}...);
 */
YYIMManager.prototype.initUpload = function() {
	if(arguments && SNSIMUploadUseFlash && typeof SNSIMUploadUseFlash.prototype.addUploader == "function") {
		for(i = 0; i < arguments.length; i++) {
			var arg = arguments[i];
			if(typeof arg.button_placeholder_id == "string") {
				SNSIMUploadUseFlash.getInstance().addUploader(arg);
			}
		}
	}
};

/**
 * [INIT] 设置多租户参数, 非多租户环境可不设置
 * @param app
 * @param etp
 */
YYIMManager.prototype.initSDK = function(app, etp){
	var conf = YYIMConfiguration.MULTI_TENANCY;
	conf.ENABLE = true;
	conf.APP_KEY = app;
	conf.ETP_KEY = etp;
	this.appkey = conf.SEPARATOR + conf.APP_KEY + conf.SEPARATOR + conf.ETP_KEY;
};

YYIMManager.prototype.getTenancy = function(){
	return YYIMConfiguration.MULTI_TENANCY;
};

/**
 * 获取appKey 
 * @returns '.app.etp'
 */
YYIMManager.prototype.getAppkey = function(){
	return this.appkey;
};

/**
 * [INIT] 
 * @param provider
 */
YYIMManager.prototype.setRosterProvider = function(provider){
	YYIMRosterManager.getInstance().init({provider:provider || new YYIMRosterProvider()});
};

/**
 * [INIT] 
 * @param provider
 */
YYIMManager.prototype.setChatGroupProvider = function(provider){
	YYIMChatGroupManager.getInstance().init({provider:provider || new YYIMChatGroupProvider()});
};

/**
 * [INIT] 
 * @param provider
 */
YYIMManager.prototype.setChatGroupMemberProvider = function(provider){
	YYIMChatGroupMemberManager.getInstance().init({provider:provider || new YYIMChatGroupMemberProvider()});
};

/**
 * 设置连接服务器的地址
 * @param hostName IM服务器的域名或机器名，需要和IM服务器内HostName相同
 * @param IP [optional] 能访问的IP地址或者域名
 */
YYIMManager.prototype.setServer = function(hostName, IP){
	YYIMConfiguration.CONNECTION.SERVER_NAME = hostName;
	if(IP){
		YYIMConfiguration.CONNECTION.HTTP_BASE = IP;
	}else{
		YYIMConfiguration.CONNECTION.HTTP_BASE = hostName;
	}
};

//
//YYIMManager.prototype.setServer = function(hostName, WSPORT, HBPORT){
//	if(hostName){
//		YYIMConfiguration.CONNECTION.HTTP_BASE = IP;
//	}
//	if(WSPORT){
//		YYIMConfiguration.CONNECTION.WS_PORT = WSPORT;
//	}
//	if(HBPORT){
//		YYIMConfiguration.CONNECTION.HTTP_BIND_PORT = HBPORT;
//	}
//};


/**
 * 主动断开连接
 */
YYIMManager.prototype.disConnect = function() {
	YYIMConnection.getInstance().disconnect();
};

/**
 * 根据之前的连接参数进行连接
 */
YYIMManager.prototype.connect = function() {
	YYIMConnection.getInstance().connect();
};

/**
 * 获取当前用户的Token
 * @returns
 */
YYIMManager.prototype.getToken = function(){
	return this._token.token;
};

/**
 * 获取当前用户的token过期时间
 * @returns
 */
YYIMManager.prototype.getTokenExpiration = function(){
	return this._token.expiration;
};

/**
 * 登录
 * @param name
 * @param password
 */
YYIMManager.prototype.login = function(username, tokenOrPsd, expiration) {
	this._token = {
		token: tokenOrPsd,
		expiration: expiration
	};
	// username空且允许匿名
	if(!YYIMCommonUtil.isStringAndNotEmpty(username) && YYIMConfiguration.IS_ANONYMOUS){
		this._anonymousUser = true;
	}
		
	if(!(this.isAnonymous()) && YYIMConfiguration.MULTI_TENANCY.ENABLE){
		username = YYIMJIDUtil.getNode(username);
	}
	YYIMConnection.getInstance().connect(username, tokenOrPsd);
};

/**
 * 退出登录, 仅负责断开连接
 */
YYIMManager.prototype.logout = function(){
	YYIMConnection.getInstance().disconnect();
};

/**
 * 获取当前登录用户的bareJid
 */
YYIMManager.prototype.getUserBareJID = function(){
	return this._user.jid.getBareJID();
};

/**
 * 获取当前登录用户的全jid
 */
YYIMManager.prototype.getUserFullJID = function(){
	return this._user.jid.toString();
};

/**
 * 获取当前用户登录的node
 */
YYIMManager.prototype.getUserNode = function(){
	return YYIMJIDUtil.getNode(this.getUserBareJID());
};

/**
 * 获取当前登录用户的id
 */
YYIMManager.prototype.getUserID = function(){
	return YYIMJIDUtil.getID(this.getUserBareJID());
};

/**
 * 全量同步好友列表到IMServer
 * @param list [{id1, name1}, {id2, name2}, ...]
 */
YYIMManager.prototype.fullSyncRoster = function(list) {
	if(YYIMArrayUtil.isArray(list)){
		var i = list.length, tmpList = [];
		while(i--) {
			if(YYIMCommonUtil.isStringAndNotEmpty(list[i].id)) {
				tmpList.push({
					jid : YYIMJIDUtil.buildUserJID(YYIMJIDUtil.getNode(list[i].id)),
					name : list[i].name ? list[i].name : list[i].id
				});
			}
		}
		YYIMIQ.fullSyncRoster(tmpList);
	}
};

/**
 * 增量同步好友列表到IMServer
 * @param removeList [id1, id2]
 * @param addList [{id3, name3}, {id4, name4}, ...]
 */
YYIMManager.prototype.deltaSyncRoster = function(removeList, addList) {
	var q = -2, k = -2, tmpRemoveList = [], tmpAddList = [];
	if(YYIMArrayUtil.isArray(removeList)){
		q = removeList.length;
		while(q--) {
			if(YYIMCommonUtil.isStringAndNotEmpty(removeList[q])) {
				tmpRemoveList.push(YYIMJIDUtil.buildUserJID(YYIMJIDUtil.getNode(removeList[q])));
			}
		}
	}
	if(YYIMArrayUtil.isArray(addList)){
		k = addList.length;
		while(k--) {
			if(YYIMCommonUtil.isStringAndNotEmpty(addList[k].id)) {
				tmpAddList.push({
					jid : YYIMJIDUtil.buildUserJID(YYIMJIDUtil.getNode(addList[k].id)),
					name : addList[k].name ? addList[k].name : addList[k].id
				});
			}
		}
	}
	if(q !== -2 || k !== -2) {
		YYIMIQ.deltaSyncRoster(tmpRemoveList, tmpAddList);
	}
};

/**
 * 全量同步群列表到IMServer
 * @param list [{id1, name1}, {id2, name2}, ...]
 */
YYIMManager.prototype.fullSyncChatGroup = function(list) {
	if(YYIMArrayUtil.isArray(list)){
		var i = list.length, tmpList = [];
		while(i--) {
			if(YYIMCommonUtil.isStringAndNotEmpty(list[i].id)) {
				tmpList.push({
					id : YYIMJIDUtil.getID(list[i].id),
					name : list[i].name ? list[i].name : list[i].id
				});
			}
		}
		YYIMIQ.fullSyncChatGroup(tmpList);
	}
};

/**
 * 增量同步群组列表到IMServer
 * @param removeList [id1, id2]
 * @param addList [{id3, name3}, {id4, name4}, ...]
 */
YYIMManager.prototype.deltaSyncChatGroup = function(removeList, addList) {
	var q = -2, k = -2, tmpRemoveList = [], tmpAddList = [];
	if(YYIMArrayUtil.isArray(removeList)){
		q = removeList.length;
		while(q--) {
			if(YYIMCommonUtil.isStringAndNotEmpty(removeList[q])) {
				tmpRemoveList.push(YYIMJIDUtil.getID(removeList[q]));
			}
		}
	}
	if(YYIMArrayUtil.isArray(addList)){
		k = addList.length;
		while(k--) {
			if(YYIMCommonUtil.isStringAndNotEmpty(addList[k].id)) {
				tmpAddList.push({
					id : YYIMJIDUtil.getID(addList[k].id),
					name : addList[k].name ? addList[k].name : addList[k].id
				});
			}
		}
	}
	if(q !== -2 || k !== -2) {
		YYIMIQ.deltaSyncChatGroup(tmpRemoveList, tmpAddList);
	}
};

/**
 * 设置上线状态
 * 
 * @param arg{show, status, priority} 空则为在线
 */
YYIMManager.prototype.setPresence = function(arg){
	if(!arg){
		arg = {
			status: STATUS.AVAILABLE
		};
	}
	YYIMPresence.setPresence(arg);
};

/**
 * 获取自己或好友的VCard
 * @param arg {
 * 		id : 如果没有则获取自己的VCard,
 * 		success : function,
 * 		error : function
 * }
 */
YYIMManager.prototype.getVCard = function(arg) {
	var _arg = {
		success : arg.success,
		error : arg.error,
		complete : arg.complete
	}
	if(YYIMCommonUtil.isStringAndNotEmpty(arg.id))
		_arg.jid = YYIMJIDUtil.buildUserJID(YYIMJIDUtil.getNode(arg.id));
	YYIMIQ.getVCard(_arg);
};

/**
 * 获取所有好友的VCard
 * 
 * @param arg {
 * 		success : function,
 * 		error : function
 * }
 */
YYIMManager.prototype.getVCards = function(arg) {
	YYIMIQ.getVCards({
		success : arg.success,
		error : arg.error,
		complete : arg.complete
	});
};

/**
 * 修改当前用户的头像
 * @param arg {
 * 		vcard : {
 * 			nickname,
 * 			photo,
 * 			email,
 * 			mobile,
 * 			telephone
 * 		},
 * 		success : function,
 * 		error : fcuntion
 * }
 */
YYIMManager.prototype.setVCard = function(arg) {
	YYIMIQ.setVCard({
		vcard : {
			nickname : arg.vcard.nickname,
			photo : arg.vcard.photo,
			email : arg.vcard.email,
			mobile : arg.vcard.mobile,
			telephone : arg.vcard.telephone
		},
		success : arg.success,
		error : arg.error
	});
};

/**
 * 获取好友列表[roster]
 * @param arg {success: function, error: function,complete: function}
 */
YYIMManager.prototype.getRosterItems = function(arg){
	YYIMRosterManager.getInstance().getRosterItems(arg);
};

/**
 * 添加好友[roster]
 * @param id
 */
YYIMManager.prototype.addRosterItem = function(id){
	if(YYIMCommonUtil.isStringAndNotEmpty(id)) {
		YYIMRosterManager.getInstance().addRosterItem(YYIMJIDUtil.buildUserJID(YYIMJIDUtil.getNode(id)));
	}
};

/**
 * 同意联系人的订阅请求
 * @param id 请求订阅的联系人的ID
 */
YYIMManager.prototype.approveSubscribe = function(id) {
	if(YYIMCommonUtil.isStringAndNotEmpty(id)) {
		YYIMPresence.approveSubscribe(YYIMJIDUtil.buildUserJID(YYIMJIDUtil.getNode(id)));
	}
};

/**
 * 拒绝联系人的订阅请求
 * @param id 请求订阅的联系人的ID
 */
YYIMManager.prototype.rejectSubscribe = function(id) {
	if(YYIMCommonUtil.isStringAndNotEmpty(id)) {
		YYIMPresence.rejectSubscribe(YYIMJIDUtil.buildUserJID(YYIMJIDUtil.getNode(id)));
	}
};

/**
 * 删除好友[roster]
 * @param arg {id: string, success: function, error: function,complete: function}
 */
YYIMManager.prototype.deleteRosterItem = function(arg){
	if(YYIMCommonUtil.isStringAndNotEmpty(arg.id)) {
		YYIMRosterManager.getInstance().deleteRosterItem({
			jid : YYIMJIDUtil.buildUserJID(YYIMJIDUtil.getNode(arg.id)),
			success : arg.success,
			error : arg.error,
			complete : arg.complete
		});
	}
};

/**
 * 查找好友[roster][包括好友和非好友]，查询字段：userName, name
 * @param arg {keyword, success: function, error: function,complete: function}
 */
YYIMManager.prototype.queryRosterItem = function(arg){
	if(YYIMCommonUtil.isStringAndNotEmpty(arg.keyword)){
		YYIMRosterManager.getInstance().queryRosterItem(arg);
	}
};

/**
 * 更新好友
 * @param arg {
 * 		roster : {
 * 			id : 好友id,
 * 			name : 好友昵称,
 * 			groups : ["group1","group2"] // 好友所在分组
 * 		},
 * 		success : function,
 * 		error : function
 * }
 */
YYIMManager.prototype.updateRosterItem = function(arg) {
	if(arg && arg.roster && YYIMCommonUtil.isStringAndNotEmpty(arg.roster.id)) {
		YYIMIQ.updateRosterItem({
			roster : {
				jid : YYIMJIDUtil.buildUserJID(YYIMJIDUtil.getNode(arg.roster.id)),
				name : arg.roster.name,
				groups : arg.roster.groups
			},
			success : arg.success,
			error : arg.error
		});
	}
};

/**
 * 查找群
 * @param arg {keyword, start, size, success: function, error: function,complete: function}
 */
YYIMManager.prototype.queryChatGroup = function(arg){
	if(YYIMCommonUtil.isStringAndNotEmpty(arg.keyword)) {
		YYIMChatGroupManager.getInstance().queryChatGroup(arg);
	}
};

/**
 * 退出群
 * @param id
 */
YYIMManager.prototype.quitChatGroup = function(id) {
	if(YYIMCommonUtil.isStringAndNotEmpty(id)) {
		YYIMChatGroupManager.getInstance().quitChatGroup(YYIMJIDUtil.buildChatGroupJID(YYIMJIDUtil.getNode(id)));
	}
};

YYIMManager.prototype.delGroupMember = function(roomId, delId) {
	if(YYIMCommonUtil.isStringAndNotEmpty(delId)){
		YYIMChatGroupManager.getInstance().delGroupMember(
				YYIMJIDUtil.buildChatGroupJID(YYIMJIDUtil.getNode(roomId)), 
				YYIMJIDUtil.buildUserJID(YYIMJIDUtil.getNode(delId))
				);
	}
}; 

/**
 * 加入群
 * @param arg {jid: roomJid, success:function, error:function}
 */
YYIMManager.prototype.joinChatGroup = function(arg){
	if(YYIMCommonUtil.isStringAndNotEmpty(arg.id)) {
		YYIMChatGroupManager.getInstance().joinChatGroup({
			jid : YYIMJIDUtil.buildChatGroupJID(YYIMJIDUtil.getNode(arg.id)),
			success : arg.success,
			error : arg.error
		});
	}
};

/**
 * 获取群组信息
 * @param arg {id : chatGroupId, success : function, error : function}
 */
YYIMManager.prototype.getChatGroupInfo = function(arg) {
	if(YYIMCommonUtil.isStringAndNotEmpty(arg.id)) {
		YYIMIQ.getChatGroupInfo({
			jid : YYIMJIDUtil.buildChatGroupJID(YYIMJIDUtil.getNode(arg.id)),
			success : arg.success,
			error : arg.error
		});
	}
};

/**
 * 获取指定群组的共享文件
 * 
 * @param arg {id: 群组id, start: int, size: int, success: function, error: function, complete: function}
 */
YYIMManager.prototype.getSharedFiles = function(arg) {
	if(YYIMCommonUtil.isStringAndNotEmpty(arg.id)) {
		var start = 0, size = 20;
		if(!isNaN(arg.start) && Number(arg.start) > 0) {
			start = Number(arg.start);
		}
		if(!isNaN(arg.size) && Number(arg.size) > 0) {
			size = Number(arg.size);
		}
		
		YYIMIQ.getSharedFiles({
			jid : YYIMJIDUtil.buildChatGroupJID(YYIMJIDUtil.getNode(arg.id)),
			start : start,
			size : size,
			success : arg.success,
			error : arg.error
		});
	}
};

/**
 * 获取公共号列表[pubaccount]
 * @param arg {success: function, error: function,complete: function}
 */
YYIMManager.prototype.getPubAccount = function(arg){
	YYIMIQ.getPubAccountItems(arg);
};

/**
 * 关注公共账号
 * @param arg {
 * 		id : 公共号id,
 * 		success : function,
 * 		error : function
 * }
 */
YYIMManager.prototype.addPubaccount = function(arg){
	if(YYIMCommonUtil.isStringAndNotEmpty(arg.id)) {
		YYIMPresence.addPubAccount({
			jid : YYIMJIDUtil.buildPubAccountJID(YYIMJIDUtil.getNode(arg.id)),
			success : arg.success,
			error : arg.error
		});
	}
};

/**
 * 查找公共号
 * @param arg {keyword, success: function, error: function,complete: function}
 */
YYIMManager.prototype.queryPubaccount = function(arg){
	YYIMIQ.queryPubaccount(arg);
};

/**
 * 获取群列表[chatroom]
 * @param arg {success: function, error: function,complete: function}
 */
YYIMManager.prototype.getChatGroups = function(arg){
	YYIMChatGroupManager.getInstance().getChatGroups(arg);
};

/**
 * 群邀请[chatroom]
 * @param arg{
 * 	roomId 目标群组jid或者chatroom对象
 * 	ids 邀请的成员jid数组
 * }
 */
YYIMManager.prototype.addGroupMember = function(arg){
	if(YYIMCommonUtil.isStringAndNotEmpty(arg.roomId) && YYIMArrayUtil.isArray(arg.ids)) {
		var roomJid = YYIMJIDUtil.buildChatGroupJID(YYIMJIDUtil.getNode(arg.roomId)),
			jids = arg.ids.slice(),
			i = 0,
			length = jids.length;
		for(; i < length; i++)
			jids[i] = YYIMJIDUtil.buildUserJID(YYIMJIDUtil.getNode(jids[i]));
		
		YYIMChatGroupMemberManager.getInstance().addGroupMember(roomJid, jids);
	}
};

/**
 * 创建房间
 * @param arg {name, node, desc, nickName, success: function, error: function, complete:function}
 */
YYIMManager.prototype.addChatGroup = function(arg){
	if(YYIMCommonUtil.isStringAndNotEmpty(arg.node))
		YYIMChatGroupManager.getInstance().addChatGroup(arg);
};

/**
 * 更新群组
 * @param arg {id, name, desc, photo, success: function, error: function, complete:function}
 */
YYIMManager.prototype.updateChatGroup = function(arg) {
	if(YYIMCommonUtil.isStringAndNotEmpty(arg.id))
		YYIMChatGroupManager.getInstance().updateChatGroup({
			jid : YYIMJIDUtil.buildChatGroupJID(YYIMJIDUtil.getNode(arg.id)),
			name : arg.name,
			desc : arg.desc,
			photo : arg.photo,
			error : arg.error,
			success : arg.success,
			complete : arg.complete 
		});
	
};

/**
 * 获取指定群的群成员[chatroom]
 * @param arg {id: string, success: function, error: function,complete: function}
 */
YYIMManager.prototype.getGroupMembers = function(arg){
	if(YYIMCommonUtil.isStringAndNotEmpty(arg.id)) {
		YYIMChatGroupMemberManager.getInstance().getGroupMembers({
			jid : YYIMJIDUtil.buildChatGroupJID(YYIMJIDUtil.getNode(arg.id)),
			success : arg.success,
			error : arg.error,
			complete : arg.complete
		});
	}
};

/**
 * 获取历史记录 
 * @param arg {id: 对方ID, start: number, num: number}
 */
YYIMManager.prototype.getHistoryMessage = function(arg){
	YYIMMessage.getHistoryMessage(arg);
};

/**
 * 获取离线消息 rongqb 20150806
 * @param arg {id: 当前登录人ID,version: 客户端当前的版本号, 客户端首次安装可以设置为-1，服务端自动判断版本号, start: 消息列表的分页参数，起始值，默认0, size: 消息列表的分页参数，分页参数，默认100}
 */
YYIMManager.prototype.getOfflineMessage = function(){
	var arg = {};
	arg.id = this.getUserID();
	
	YYIMMessage.getVersion(arg);
	
//	var offline_version = YYIMCookieUtil.getcookie('offline_version_'+arg.id);
//	if(offline_version && offline_version != -1){
//		arg.version = offline_version;
//		YYIMMessage.getOfflineMessage(arg);
//	}else{
//		YYIMMessage.getVersion(arg);
//	}
};

/**
 * 发送回执报文
 * @param arg {
 *  	from:,	//报文的来源
 * 		id: 	//报文id
 * }
 */
YYIMManager.prototype.sendReceiptsPacket = function(arg){
	YYIMMessage.sendReceiptsPacket(arg);
};

/**
 * 发送已读回执报文
 *  @param arg {
 *  	from:,	//报文的来源
 * 		id: 	//报文id
 * }
 */
YYIMManager.prototype.sendReadedReceiptsPacket = function(arg){
	YYIMMessage.sendReadedReceiptsPacket(arg);
};

YYIMManager.prototype.sendMessage = function(arg){
	YYIMMessage.sendMessage(arg);
};


/**
 * 发送分享消息[分享消息]
 * @param arg {to: id, to:jid ,type: "groupchat"|"chat", style,  success:function, error:function,extend: string,
 * sharebody:{
 * 		shareImageUrl:string, //分享中图片的url
 * 		shareUrl:string, //分享的url
 * 		shareDesc:string, //分享的内容描述
 * 		shareTitle:string //分享的标题
 * 	}
 * }
 */
YYIMManager.prototype.sendShareMessage = function(arg){
	arg.id = Math.uuid();
	arg.body = {
			extend:arg.extend,
			content: arg.sharebody,
			contentType: MESSAGE_CONTENT_TYPE.SHARE,
			dateline: new Date().getTime()
		};
	
	if(arg.style && typeof arg.style != 'string'){
		arg.body.style = JSON.stringify(arg.style);
	}
	this.sendMessage(arg);
};



/**
 * 发送文本消息[文本,表情]
 * @param arg {to: id, type: "groupchat"|"chat",msg:text, style, extend: string,  success:function, error:function}
 */
YYIMManager.prototype.sendTextMessage = function(arg){
	arg.id = Math.uuid();
	arg.body = {
		extend:arg.extend,
		content: arg.msg,
		contentType: MESSAGE_CONTENT_TYPE.TEXT,
		dateline: new Date().getTime()
	};
	
	// 所有样式以串形式发, 兼容所有端
	if(arg.style && typeof arg.style != 'string'){
		arg.body.style = JSON.stringify(arg.style);
	}
	this.sendMessage(arg);
};

/**
 * 发送图片
 * @param arg{fileInputId, to:jid, success:function, error:function}
 */
YYIMManager.prototype.sendPic = function(arg){
	var toJid = YYIMJIDUtil.getNode(arg.to);
	if(arg.type == CHAT_TYPE.GROUP_CHAT)
		toJid = YYIMJIDUtil.buildChatGroupJID(toJid);
	else
		toJid = YYIMJIDUtil.buildUserJID(toJid);
	
	var opts = {
		fileTypeExts:'jpg;jpeg;png;bmp;gif',
		fileSizeLimit:5*1024,
		breakPoints:false,
		saveInfoLocal:false,
		removeTimeout:100,
		uploader:YYIMConfiguration.SERVLET.FILE_UPLOAD_SERVLET,
		uploadIdPrefix:"image_upload_",
		inputId:arg.fileInputId,
		to: toJid,
		type: MESSAGE_CONTENT_TYPE.IMAGE,
		chatType: arg.type,
		onUploadSuccess: arg.success,
		onUploadError: arg.error,
		showProcess: false,
		processId: "udnProcessBar"
	};
	
	if(arg.resource){
		opts.resource = arg.resource;
	}
	FileUpload.getInstance(arg.fileInputId, opts);
	FileUpload.getInstance(arg.fileInputId).sendFile(document.getElementById(arg.fileInputId));
};

/**
 * 发送文件
 * @param arg{fileInputId, to:jid, success:function, error:function}
 */
YYIMManager.prototype.sendFile = function(arg){
	var toJid = YYIMJIDUtil.getNode(arg.to);
	if(arg.type == CHAT_TYPE.GROUP_CHAT)
		toJid = YYIMJIDUtil.buildChatGroupJID(toJid);
	else
		toJid = YYIMJIDUtil.buildUserJID(toJid);
	var opts = {
		fileTypeExts:'*',
		fileSizeLimit:99999999,
		breakPoints:true,
		saveInfoLocal:true,
		removeTimeout:100,
		uploader:YYIMConfiguration.SERVLET.FILE_UPLOAD_SERVLET,
		uploadIdPrefix:"bp_upload_",
		inputId:arg.fileInputId,
		to: toJid,
		type: MESSAGE_CONTENT_TYPE.FILE,
		chatType: arg.type,
		onUploadSuccess: arg.success,
		onUploadError: arg.error,
		showProcess: true,
		processId: "udnProcessBar"
	};
	if(arg.resource){
		opts.resource = arg.resource;
	}
	FileUpload.getInstance(arg.fileInputId, opts);
	FileUpload.getInstance(arg.fileInputId).sendFile(document.getElementById(arg.fileInputId));
};

/**
 * 上传头像
 * @param arg{fileInputId, to:jid, success:function, error:function}
 */
YYIMManager.prototype.uploadAvatar = function(arg){
	var toJid = YYIMJIDUtil.getNode(arg.to);
	if(arg.type == CHAT_TYPE.GROUP_CHAT)
		toJid = YYIMJIDUtil.buildChatGroupJID(toJid);
	else
		toJid = YYIMJIDUtil.buildUserJID(toJid);
	FileUpload.getInstance(arg.fileInputId,{
		fileTypeExts:'jpg;jpeg;png;bmp;gif',
		fileSizeLimit:5*1024,
		breakPoints:false,
		saveInfoLocal:false,
		removeTimeout:100,
		uploader:YYIMConfiguration.SERVLET.FILE_UPLOAD_SERVLET,
		uploadIdPrefix:"user_avatar_upload_",
		inputId:arg.fileInputId,
		to: toJid,
		type: UPLOAD_AVATAR,
		onUploadSuccess: arg.success,
		onUploadError: arg.error,
		showProcess: false,
		processId: "udnProcessBar"
	});
	FileUpload.getInstance(arg.fileInputId).sendFile(document.getElementById(arg.fileInputId));
};

// get config

YYIMManager.prototype.getServerName = function(){
	return YYIMConfiguration.CONNECTION.SERVER_NAME;
};

/**
 * 根据附件id获取附件的下载路径
 * @param attachId
 * @returns {String}
 */
YYIMManager.prototype.getFileUrl = function(attachId){
	var fromUser, token;
	if(this.isAnonymous()){
		fromUser = this.getUserFullJID();
		token = "anonymous";
	}else{
		fromUser = this.getUserNode();
		token = this.getToken();
	}
	return YYIMConfiguration.SERVLET.FILE_DOWNLOAD_SERVLET + "?attachId=" + attachId + "&fromUser=" + fromUser + "&token=" + token;
};

YYIMManager.prototype.getServletPath = function() {
	return YYIMConfiguration.SERVLET;
};

YYIMManager.prototype.getJIDUtil = function(){
	return YYIMJIDUtil;
};

YYIMManager.prototype.getArrayUtil = function(){
	return YYIMArrayUtil;
};

YYIMManager.prototype.isAnonymous = function(){
	return this._anonymousUser;
};

YYIMManager.prototype.enableAnonymous = function(){
	return YYIMConfiguration.IS_ANONYMOUS;
};

YYIMManager.prototype.getBrowser = function() {
	return YYIMConfiguration.BROWSER;
};

/**
 * 指定id是否在线
 * 
 * @param id
 * @returns {Boolean}
 */
YYIMManager.prototype.isOnline = function(id) {
	return YYIMRosterManager.getInstance()._onlineList.get(id) == true;
};

YYIMManager.prototype.defaultImg = function(dom){
	var _src = dom.src;
	dom.src = 'res/skin/default/icons/avatar.gif';
	dom.setAttribute('data-url', _src);
}
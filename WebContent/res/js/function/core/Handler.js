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
							YYIMChat.getOfflineMessage(); //离线消息
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
	if (from == user.id && arg.resource == user.resource) {
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
		if(arg.from.roster == SNSApplication.getInstance().getUser().id){
			return;
		}
		message.initRoomMessage(arg);
	}else if(arg.type == SNS_CHAT_TYPE.CHAT){
		message.initRosterMessage(arg);
	}else if(arg.type = SNS_CHAT_TYPE.DEVICE){
		message.initDeviceMessage(arg);
	}
	
	msgInBox.filter.doFilter(message);
	msgInBox.addToUnreadMessage(message);

	if(SNSHandler.getInstance().afterInitialized) {
		var recentList = SNSApplication.getInstance().getUser().recentList;
		recentList.addNew(message);
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
SNSHandler.prototype.onReceipts = function(id){
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


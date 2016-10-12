var YYIMPresence = (function(){
	/**
	 * 监控presence包
	 */
	function monitor() {
		var _conn = YYIMConnection.getInstance();
		
		// 可能会收到订阅或上线包
		_conn.registerHandler(OPCODE.PRESENCE.KEY, function(packet) {
			// 订阅， 此处不做处理
			if(packet.type && packet.type != TYPE.UNAVAILABLE) {
				YYIMManager.getInstance().onSubscribe({
					from: YYIMJIDUtil.getID(packet.from),
					type: packet.type
				});
				return;
			}
			// 上线包
			var ps = {
				from: YYIMJIDUtil.getID(packet.from),
				resource: YYIMJIDUtil.getResource(packet.from),
				type: packet.type,
				show: packet.show,
				status: packet.status
			};
			YYIMRosterManager.getInstance().addToOnline(ps.from);
			if(packet.type && packet.type == TYPE.UNAVAILABLE){
				ps.show = STATUS.UNAVAILABLE;
				ps.status = STATUS.UNAVAILABLE;
				YYIMRosterManager.getInstance().removeFromOnline(ps.from);
			}
			
			if (!YYIMCommonUtil.isStringAndNotEmpty(ps.status)) {
				ps.show = STATUS.CHAT;
				ps.status = STATUS.CHAT;
			};
			YYIMManager.getInstance().onPresence(ps);
			//console.info(ps);
		});
		
		// 群组相关的包, 群成员加入、退出
		_conn.registerHandler(OPCODE.CHATGROUP.KEY, function(packet) {
			// 退出
			if(packet.type == PRESENCE_TYPE.UNAVAILABLE){
				YYIMManager.getInstance().onRoomMemerPresence({
					room: YYIMJIDUtil.getID(packet.from),
					member: {
						id: YYIMJIDUtil.getID(packet.jid)
					},
					type: CHATROOM_MEMBER_UPDATE.QUIT
				});
			}
			// 加入
			else{
				YYIMManager.getInstance().onRoomMemerPresence({
					room: YYIMJIDUtil.getID(packet.from),
					member: {
						id: YYIMJIDUtil.getID(packet.jid),
						nick: packet.name ? packet.name : YYIMJIDUtil.getID(packet.jid),
						affiliation: packet.affiliation,
						role: packet.role
					},
					type: CHATROOM_MEMBER_UPDATE.JOIN
				});
			}
		});
	};
	
	/**
	 * 设置上线状态
	 * @param arg{show, status, priority}
	 */
	function setPresence(arg) {
		var presenceBody = {};
		if(YYIMCommonUtil.isStringAndNotEmpty(arg.show)) 	presenceBody.show = arg.show;
		if(YYIMCommonUtil.isStringAndNotEmpty(arg.status)) 	presenceBody.status = arg.status;
		if(YYIMCommonUtil.isStringAndNotEmpty(arg.priority)) presenceBody.priority = arg.priority;
		if(YYIMCommonUtil.isStringAndNotEmpty(arg.type))		presenceBody.type = arg.type;
		
		YYIMConnection.getInstance().send(new JumpPacket(presenceBody, OPCODE.PRESENCE.SEND));
	}

	/**
	 * 添加好友
	 * @param jid
	 */
	function addRosterItem(jid) {
		YYIMConnection.getInstance().send(new JumpPacket({
			type : PRESENCE_TYPE.SUBSCRIBE,
			to : jid
		}, OPCODE.PRESENCE.SEND));
	}
	
	/**
	 * 同意联系人的订阅请求
	 * @param jid
	 */
	function approveSubscribe(jid) {
		YYIMConnection.getInstance().send(new JumpPacket({
			type : PRESENCE_TYPE.SUBSCRIBED,
			to : jid
		}, OPCODE.PRESENCE.SEND));
	}
	/**
	 * 拒绝联系人的订阅请求
	 * @param jid
	 */
	function rejectSubscribe(jid) {
		YYIMConncetion.getInstance().send(new JumpPacket({
			type : PRESENCE_TYPE.UNSUBSCRIBED,
			to : jid
		}, OPCODE.PRESENCE.SEND));
	}
	
	/**
	 * 关注公共号，只能根据返回的subscribed来判断是否关注成功，返回的iq set both需忽略
	 * @param arg{jid , success, error}
	 */
	function addPubAccount(arg) {
		YYIMConnection.getInstance().send(new JumpPacket({
			type : PRESENCE_TYPE.SUBSCRIBE,
			to : arg.jid
		}, OPCODE.PRESENCE.SEND), function(addResult, _arg){
			_arg.complete && _arg.complete();
			_arg.success && _arg.success();
		}, arg);
	}
	
	/**
	 * 加入群组, 需要合法的jid
	 * @param arg {jid: roomJid, success:function, error:function}
	 * @returns
	 */
	function joinChatGroup(arg) {
		var presenceBody = {
			to : arg.jid + "/" + YYIMManager.getInstance().getUserNode()
		};
		
		YYIMConnection.getInstance().send(new JumpPacket(presenceBody, OPCODE.CHATGROUP.SEND), function(joinResult, _arg) {
			arg.complete && arg.complete();
			
			arg.success && arg.success({
				id : YYIMJIDUtil.getID(joinResult.from),
				affiliation : joinResult.affiliation,
				role : joinResult.role
			});
			
		}, arg);
	}
	
	/**
	 * 群主删除群成员
	 */
	function delGroupMember(roomJid, delid, callbackFn) {
		var id = parseInt(100000 + Math.random()*100000);
		//var to = roomJid + "/" + YYIMManager.getInstance().getUserNode();
		var to = roomJid;
		if(delid.indexOf("@")>0){
			delid = delid.split("@")[0];
		}
		YYIMConnection.getInstance().send(new JumpPacket({
			id: id,
			to : to,
			nick : delid,
			role : 'none'
		}, OPCODE.DEL_GROUPMEMBER.SEND), function(data) {
			if (callbackFn && typeof callbackFn == 'function') {
				callbackFn(data);
			}
		});
	}
	
	/**
	 * 退出群
	 * @param jid
	 */
	function quitChatGroup(jid) {
		YYIMConnection.getInstance().send(new JumpPacket({
			type : PRESENCE_TYPE.UNAVAILABLE,
			to : jid + '/' + YYIMManager.getInstance().getUserNode()
		}, OPCODE.CHATGROUP.SEND), function() {
			// 发的包和回来的包id不同，不能在回调中使用
			// 退出后返回unavailable包，但是销毁群后先回来unavailable再回来result
		});
	}

	
	return {
		monitor : monitor,
		addRosterItem : addRosterItem,
		approveSubscribe : approveSubscribe,
		rejectSubscribe : rejectSubscribe,
		setPresence : setPresence,
		addPubAccount : addPubAccount,
		joinChatGroup : joinChatGroup,
		delGroupMember : delGroupMember,
		quitChatGroup : quitChatGroup
	};
})();
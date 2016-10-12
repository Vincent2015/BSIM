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
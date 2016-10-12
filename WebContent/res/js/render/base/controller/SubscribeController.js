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
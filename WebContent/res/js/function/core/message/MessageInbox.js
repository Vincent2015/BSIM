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
}

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
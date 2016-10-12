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

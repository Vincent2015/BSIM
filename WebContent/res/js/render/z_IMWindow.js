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

SNSIMWindow.prototype._toggleNarrowWideWindow = function() {
	if (this._narrowWindow.visible()) {
//		jQuery(this.chatBoxSelector).css("margin-right", "44px");
//		jQuery(this.chatBoxSelector).css("margin-top", "70px");
		this._wideWindow.show();
		this._narrowWindow.hide();
		this._chatWindow.transPosition(true);
	} else {
//		jQuery(this.chatBoxSelector).css("margin-right", "96px");
//		jQuery(this.chatBoxSelector).css("margin-bottom", "49px");
		jQuery(this._narrowWindow.rosterContainerSelector).parent().css("height",jQuery(window).height() - 80);// 80为窄板上部和底部的高度和 
		this._wideWindow.hide();
		this._narrowWindow.show();
		this._chatWindow.transPosition(false);
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

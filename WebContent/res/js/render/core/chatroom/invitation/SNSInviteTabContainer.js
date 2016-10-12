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
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
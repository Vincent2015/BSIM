var SNSRosterChatTab = function(roster) {

	this.roster = roster;
	this.name = roster ? roster.id : "";

	this.closeable = true;

	this.lastMessageDateline = 0;

	this.headSelector = roster ? "#" + SNSRosterChatTab.headIdPrefix + roster.getID() : "";
	this.contentSelector = roster ? "#" + SNSRosterChatTab.contentIdPrefix + roster.getID() : "";

	/**
	 * 闪动的消息提醒的interval ID
	 * @type {Number}
	 */
	this.headTwinkleId;
	this.twinkling = false;

};

SNSRosterChatTab.headIdPrefix = "snsim_chat_window_roster_tab_head_";
SNSRosterChatTab.contentIdPrefix = "snsim_chat_window_roster_tab_content_";

SNSRosterChatTab.headTemplate = 
	'<li id="'+SNSRosterChatTab.headIdPrefix+'##{{roster.getID()}}" title="##{{roster.name}}" class="snsim_tab_head">'
	+'<div class="list_head_item">'
		+ '<div class="list_head_state">'
			+ '<span class="snsim_roster_presence W_chat_stat snsim_##{{roster.presence.status}}"></span>'
		+ '</div>'
		+ '<div class="snsim_username">##{{roster.name}}'
			+ '<span class="wbim_icon_vf"></span>'
		+ '</div>'
		+ '<a hidefloat="true" class="snsim_chat_window_tab_close_btn"></a>'
		+ '<span class="unread_msg_num">0</span>'
	+'</div>'
+ '</li>';

SNSRosterChatTab.contentTemplate = 
	'<div id="'+SNSRosterChatTab.contentIdPrefix+'##{{roster.getID()}}" class="snsim_tab_content snsim_dia_list">'
		+'<div class="sns_message_container cur">'
			+'<div class="snsim_message_box_container sns_message_panel"></div>'
		+'</div>'
	+ '</div>';

SNSRosterChatTab.prototype = new SNSTab();

SNSRosterChatTab.prototype._init = function(roster) {

};

/**
 * 消息框的滚动
 */
SNSRosterChatTab.prototype.scrollToTop = function(){
	this.getMessageContainer().scrollTop(0);
};

SNSRosterChatTab.prototype.scrollToBottom = function(){
	this.getMessageContainer().scrollTop(this.getMessageContainer()[0].scrollHeight + 300);
};

SNSRosterChatTab.prototype.scrollContent = function(){
	this.getMessageContainer().perfectScrollbar({suppressScrollX:true,wheelPropagation: true});
};

// 未区分子类的css选择器，都为sns_message_container
SNSRosterChatTab.prototype.getMessageContainer = function(){
	return this.getContentDom().find(".sns_message_container");
};

SNSRosterChatTab.prototype.getHeadTemplate = function() {
	return SNSRosterChatTab.headTemplate;
};

SNSRosterChatTab.prototype.getContentTemplate = function() {
	return SNSRosterChatTab.contentTemplate;
};

SNSRosterChatTab.prototype.getCloseBtnDom = function() {
	var btn = this.getHeadDom().find(".snsim_chat_window_tab_close_btn");
	if (btn.length > 0) {
		return btn;
	}
};

SNSRosterChatTab.prototype.addMsgRemind = function() {
	this.getHeadDom().find(".unread_msg_num").text(parseInt(this.getHeadDom().find(".unread_msg_num").text()) + 1);
	this.getHeadDom().addClass("snsim_active");
};

SNSRosterChatTab.prototype.removeMsgRemind = function() {
	this.getHeadDom().find(".unread_msg_num").text(0);
	this.getHeadDom().removeClass("snsim_active");
};

SNSRosterChatTab.prototype.addMessage = function(message) {
	var messageBox;
	if (message instanceof SNSOutMessage) {
		messageBox = new SNSSentMessageBox(message);
	} else {
		messageBox = new SNSReceivedMessageBox(message);
	}
	var html = messageBox.getHtml();

	var container = this.getContentDom().find(".snsim_message_box_container");
	container.append(html);

	var dateline = message.body.dateline;

	if (dateline - this.lastMessageDateline < 1000 * 45) {
		messageBox.getDom().find(".dia_info").css("display", "none");
	}
	messageBox.show();
	this.scrollToBottom();
	
	this.lastMessageDateline = message.body.dateline;
};

SNSRosterChatTab.prototype.getTarget = function(){
	return this.roster;
};
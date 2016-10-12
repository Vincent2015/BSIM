var SNSHistoryMessageArray = function() {
	this.count = -1;
	this.currentCount = 0;
	this.messages = new Array();
	this.msgInfoTemplate = 
		'<div id="'+ SNSHistoryMessageArray.msgInfoIdPrefix +'##{{node}}" style="text-align: center; margin-top: 10px;">'
			+'<a onclick="SNSHistoryMessagePlugin.getInstance().historyMessageList.showHistoryMessage(\'##{{id}}\')" class="snsim_msg_info_content">##{{msgInfo}}</a>'
		+'</div>';
	
	this.scrollToBottom = false;
};

SNSHistoryMessageArray.prototype = new Array();

SNSHistoryMessageArray.msgInfoIdPrefix = "snsim_msg_info_";

SNSHistoryMessageArray.prototype.show = function(rosterOrChatroom){
	var defer = jQuery.Deferred();
	var msgContainer = SNSIMWindow.getInstance().getChatWindow().getTab(rosterOrChatroom).getContentDom().find(".snsim_message_box_container");
	
	for(var i = 0; i < this.messages.length; i++){
		if(this.scrollToBottom){
			this.messages[i].scrollToBottom = 'show';
		}else {
			this.messages[i].scrollToBottom = 'hide';
		}
		this.messages[i].show(rosterOrChatroom, msgContainer);
	}
	
	// 顶部的查看更多
	var msgInfoDom = jQuery("#" + SNSHistoryMessageArray.msgInfoIdPrefix + rosterOrChatroom.getID());
	if(msgInfoDom.length < 1){
		msgContainer.prepend(this.getMsgInfoHtml(rosterOrChatroom));
	}else{
		msgInfoDom.insertBefore(msgContainer.children(":first"));
	}
	if(this.count >= 0 && this.currentCount >= this.count){
		this.showNoMsgInfoHtml(rosterOrChatroom);
	}
	
	this.clear();
	if(this.scrollToBottom){
		this.scrollToBottom = false;
		SNSIMWindow.getInstance().getChatWindow().getTab(rosterOrChatroom).scrollToBottom();
	}
	defer.resolve();
	return defer.promise();
};

SNSHistoryMessageArray.prototype.clear = function(){
	this.messages = [];
};

/**
 * 查看更多|没有更多消息了 之类的提示
 * @param rosterOrChatroom
 */
SNSHistoryMessageArray.prototype.getMsgInfoHtml = function(rosterOrChatroom){
	var messageInfo = "查看更多";
	return TemplateUtil.genHtml(this.msgInfoTemplate, {node: rosterOrChatroom.getID(), msgInfo: messageInfo, id: rosterOrChatroom.getID()});
};

SNSHistoryMessageArray.prototype.showNoMsgInfoHtml = function(rosterOrChatroom){
	// 顶部的查看更多
	var msgInfoDom = jQuery("#" + SNSHistoryMessageArray.msgInfoIdPrefix + rosterOrChatroom.getID());
	
	msgInfoDom.find(".snsim_msg_info_content").text("没有更多消息了");
	msgInfoDom.find(".snsim_msg_info_content").css("cursor","default");
};

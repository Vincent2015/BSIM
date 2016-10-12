var SNSHistoryMessage = function(){
	this.id;
	this.to;
	this.from;
	this.member;
	this.type; // send or receive
	this.scrollToBottom = 'hide';
};

SNSHistoryMessage.prototype = new SNSMessage();

SNSHistoryMessage.prototype.show = function(rosterOrChatroom, msgContainer){
	//var msgContainer = SNSIMWindow.getInstance().getChatWindow().getTab(rosterOrChatroom).getContentDom().find(".snsim_message_box_container");
	if(jQuery('#' + SNSReceivedMessageBox.ID_PREFIX + this.id).length <= 0){
		if(this.from.getID() == rosterOrChatroom.getID() || this.to.getID() == rosterOrChatroom.getID())
			msgContainer.prepend(this.getMsgHtml());
	}
};

SNSHistoryMessage.prototype.getMsgHtml = function(){
	if(this.body.content && typeof this.body.content == "string")
		this.body.content = SNSExpressionRenderFilter.decode(this.body.content);
	if(this.type == SNS_FILTER_TYPE.SEND){
		SNSApplication.getInstance().getMessageOutBox().getFilter().doFilter(this);
		return TemplateUtil.genHtml(SNSSentMessageBox.template, this);
	}
	else{
		SNSApplication.getInstance().getMessageInBox().getFilter().doFilter(this);
		return TemplateUtil.genHtml(SNSReceivedMessageBox.template, this);
	}
};

SNSHistoryMessage.prototype.getBodyHtml = function() {
	if (!this.html || this.html.isEmpty()) {
		return this.body.content;
	}
	return this.html;
};

SNSHistoryMessage.prototype.getRoster = function() {
	if (this.from && this.from instanceof SNSRoster) {
		return this.from;
	}
	if (this.from && this.from instanceof SNSChatRoom) {
		var _nameArr = this.member.name.split(".")
		if (_nameArr.length == 3) {
			this.member.name = _nameArr[0];
		}
		return this.member;
	}
};

/**
 * 设置要发送的图片
 * @param file @see SNSFile
 */
SNSHistoryMessage.prototype.setImage = function(image){
	if(image && image instanceof SNSFile){
		this.body.content = image;
		this.body.contentType = SNS_MESSAGE_CONTENT_TYPE.IMAGE;
	}
};

SNSHistoryMessage.prototype.getRosterOrChatRoom = function() {
	if(this.type == SNS_FILTER_TYPE.SEND){
		return this.to;
	}else {
		return this.from;
	}
};
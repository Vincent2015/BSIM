var SNSShareContentRenderFilter = function() {

	this.priority = 99;
	
	this.contentType = SNS_MESSAGE_CONTENT_TYPE.SHARE;
	
	this.type = SNS_FILTER_TYPE.RECEIVED | SNS_FILTER_TYPE.SEND;
	
	this.template = '<a class="share_title" style="font-size:14px;line-height:18px;max-height:36px;overflow:hidden;display:block;margin-bottom:5px;" href="##{{shareUrl}}">##{{shareTitle}}</a>'
		+ '<a style="float:left;" href="##{{shareUrl}}"><img src="##{{shareImageUrl}}" style="width:60px;display:block;" class="share_img"></a>'
		+ '<div style="margin-left:65px;color:#666666;" class="share_content">'
	    + '##{{shareDesc}}'
	    + '</div>';
	 
	this._doFilter = function(msg) {
		if(msg.getRosterOrChatRoom()){
			msg.rosterId = msg.getRosterOrChatRoom().getID();
			if(msg instanceof SNSInMessage || msg instanceof SNSOutMessage)
				msg.scrollToBottom = 'show';
		}
		msg.html = TemplateUtil.genHtml(this.template, msg.body.content);
	};
	
};
SNSShareContentRenderFilter.prototype = new SNSMessageFilter();
new SNSShareContentRenderFilter().start();

SNSShareContentRenderFilter.imgOnload = function(id, scrollToBottom){
	if(scrollToBottom == 'show'){
		SNSIMWindow.getInstance().getChatWindow().getTab(id).scrollToBottom();
	}
};
var SNSImageContentRenderFilter = function() {

	this.priority = 99;
	
	this.contentType = SNS_MESSAGE_CONTENT_TYPE.IMAGE;
	
	this.type = SNS_FILTER_TYPE.RECEIVED | SNS_FILTER_TYPE.SEND;
	
	this.template = 
		'<p>'
			+'<span style="white-space: nowrap">'
				+'<img src="##{{body.content.path}}" onload="SNSImageContentRenderFilter.imgOnload(\'##{{rosterId}}\', \'##{{scrollToBottom}}\')" onclick="SNSIMWindow.getInstance().getImgPreviewPanel().updateImg(\'##{{body.content.path}}\')" style="max-width: 200px; cursor: pointer;" target="_blank"></a>'
			+'</span>'
	  +'</p>',
	 
	this._doFilter = function(msg) {
		if(msg.getRosterOrChatRoom()){
			msg.rosterId = msg.getRosterOrChatRoom().getID();
			if(msg instanceof SNSInMessage || msg instanceof SNSOutMessage)
				msg.scrollToBottom = 'show';
		}
		msg.html = TemplateUtil.genHtml(this.template, msg);
	};
	
};
SNSImageContentRenderFilter.prototype = new SNSMessageFilter();
new SNSImageContentRenderFilter().start();

SNSImageContentRenderFilter.imgOnload = function(id, scrollToBottom){
	
	if(scrollToBottom == 'show'){
		SNSIMWindow.getInstance().getChatWindow().getTab(id).scrollToBottom();
	}
};
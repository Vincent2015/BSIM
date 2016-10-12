var SNSFontContentRenderFilter = function() {

	this.priority = 100;
	
	this.contentType = SNS_MESSAGE_CONTENT_TYPE.TEXT;
	
	this.type = SNS_FILTER_TYPE.RECEIVED | SNS_FILTER_TYPE.SEND;
	this._doFilter = function(msg) {
		if(msg.body.style && msg.body.style instanceof SNSMessageStyle)
			msg.html = '<div style="' + msg.body.style.getStyleStr() + '">' + msg.body.content + '</div>';
		else
			msg.html = msg.body.content;
	};
	
};
SNSFontContentRenderFilter.prototype = new SNSMessageFilter();
new SNSFontContentRenderFilter().start();
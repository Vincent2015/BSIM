var SNSTextContentRenderFilter = function() {

	this.priority = 99;
	
	this.contentType = SNS_MESSAGE_CONTENT_TYPE.TEXT;
	
	this.type = SNS_FILTER_TYPE.RECEIVED | SNS_FILTER_TYPE.SEND;
	
	this._doFilter = function(msg) {
		msg.html = msg.body.content;
	};
	
};
SNSTextContentRenderFilter.prototype = new SNSMessageFilter();
new SNSTextContentRenderFilter().start();
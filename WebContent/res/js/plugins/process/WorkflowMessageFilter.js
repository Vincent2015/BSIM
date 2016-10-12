var SNSWorkflowMessageFilter = function(){
	this.name = "workflowFilter";
	
	this.priority = 0;
	
	this.contentType = SNS_MESSAGE_CONTENT_TYPE.PUBLIC;
	
	this.type = SNS_FILTER_TYPE.RECEIVED;
	
	this._doFilter = function(msg) {
		if(msg.body.url){
			if(msg.from instanceof SNSWorkflowRoster){
				msg.html = '<a href="'+msg.body.url+'" target="_blank">'+msg.body.content+'</a>';
			}
		};
	};
};

SNSWorkflowMessageFilter.prototype = new SNSMessageFilter();

/**
 * 处理流程消息
 * @param message {SNSInMessage} 被处理的消息
 * @return {String} 消息对应的HTML字符串
 */
SNSWorkflowMessageFilter.prototype.genMessageHtml = function(message){
	
};
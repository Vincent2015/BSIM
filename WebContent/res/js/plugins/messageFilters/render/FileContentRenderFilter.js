var SNSFileContentRenderFilter = function() {

	this.priority = 99;
	
	this.contentType = SNS_MESSAGE_CONTENT_TYPE.FILE;
	
	this.type = SNS_FILTER_TYPE.RECEIVED | SNS_FILTER_TYPE.SEND;
	
	this.inTemplate = 
		'<p>'
			+'<img src="##{{getSNSBasePath()}}res/skin/default/icons/filetype/##{{type}}.png" border="0" class="vm sns_msg_file_icon">'
			+'<span class="sns_msg_file_info">'
				+'<a href="##{{path}}" target="_blank">##{{name}}</a>'
				+'<em class="xg1" style="display:none;">(##{{size}})</em>'
			+'</span>'
	  +'</p>';
	
	this.outTemplate = 
		'<p>'
			+'<img src="##{{getSNSBasePath()}}res/skin/default/icons/filetype/##{{type}}.png" border="0" class="vm sns_msg_file_icon">'
			+'<span class="sns_msg_file_info">'
				+'<a href="##{{path}}" target="_blank" style="color:#ffffff;">##{{name}}</a>'
				+'<em class="xg1" style="display:none;">(##{{renderSize()}})</em>'
			+'</span>'
	  +'</p>';
	 
	this._doFilter = function(msg) {
		if(msg instanceof SNSInMessage || (msg.type && msg.type == SNS_FILTER_TYPE.RECEIVED)){
			msg.body.content.size = SNSFile.renderSize(msg.body.content.size);
			msg.html = TemplateUtil.genHtml(this.inTemplate, msg.body.content);
		} else {
			msg.html = TemplateUtil.genHtml(this.outTemplate, msg.body.content);
		}
	};
	
};
SNSFileContentRenderFilter.prototype = new SNSMessageFilter();
new SNSFileContentRenderFilter().start();
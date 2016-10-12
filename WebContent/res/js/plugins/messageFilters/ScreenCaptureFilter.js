/**
 * 对消息中的截图进行处理， 
 * 消息的类型为IMAGE
 */
var ScreenCaptureFilter = function() {

	this.priority = 150;
	
	this.contentType = SNS_MESSAGE_CONTENT_TYPE.TEXT;
	
	this.type = SNS_FILTER_TYPE.RECEIVED | SNS_FILTER_TYPE.SEND;
	
	this.template = 
		'<p>'
			+'<span style="white-space: nowrap">'
				+'<img src="##{{path}}" onclick="SNSIMWindow.getInstance().getImgPreviewPanel().updateImg(\'##{{path}}\')" style="max-width: 200px; cursor: pointer;" target="_blank"></a>'
			+'</span>'
	  +'</p>',
	
	this._doFilter = function(msg) {
		var content = msg.body.content;
		var pattern = /##\{\{([\w()_.\/-]+)\}\}/ig;
		if (pattern.test(content)) {
			var path = content.replace(pattern, '$1');
			msg.html = TemplateUtil.genHtml(this.template, {path:YYIMChat.getFileUrl(path)});
		}
	};
};
ScreenCaptureFilter.prototype = new SNSMessageFilter();
new ScreenCaptureFilter().start();

var SNSMessageBox = function(){
	this.message;
	this.selector;
};

SNSMessageBox.prototype = new SNSComponent();


SNSMessageBox.prototype.showSendFailed = function(){
	
};

SNSMessageBox.prototype.getHtml = function(){
	return TemplateUtil.genHtml(this.getTemplate(), this.message);
}

SNSMessageBox.prototype.getTemplate = function(){
	return "";
};

/**
 * 显示此节点
 * @param isInline {boolean} display是否为inline
 */
SNSMessageBox.prototype.show = function() {
	if (this.visible()) {
		this.afterShow();
		return;
	}
	var dom = this.getDom();

	this.beforeShow();

	dom.show("fast");

	this.afterShow();

};

SNSMessageBox.prototype.afterShow = function(){
	SNSApplication.getInstance().getGlobalEventManager().trigger(SNS_EVENT_SUBJECT.AFTER_MESSAGE_SHOW,[this.message]);
	YYIMChat.log("trigger", SNS_EVENT_SUBJECT.AFTER_MESSAGE_SHOW);
};
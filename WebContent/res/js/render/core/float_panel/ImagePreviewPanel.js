var SNSImagePreviewPanel = function(){
	this.selector = "#snsim_img_preview_window";
	this.imgSelector = "img";
	this.closeBtnSelector = ".snsim_img_preview_close";
};

SNSImagePreviewPanel.prototype = new SNSFloatPanel();

SNSImagePreviewPanel.prototype._init = function() {
	SNSFloatPanel.prototype._init.call(this);
	this._bindDomEvent();
};

SNSImagePreviewPanel.prototype._bindDomEvent = function() {
	this.getDom().find(this.imgSelector).bind("click", {_self: this}, function(event){
		event.data._self.hide();
	});
	SNSFloatPanel.prototype._bindDomEvent.call(this);
};

SNSImagePreviewPanel.prototype.updateImg = function(url){
	this.show();
	this.getDom().find(this.imgSelector).attr("src", url);
};
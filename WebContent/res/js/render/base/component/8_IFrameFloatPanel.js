var SNSIFrameFloatPanel = function(url, id, width, height) {
	this.id = id || Math.uuid();
	this.url = url;

	this.width = width || 500;
	this.height = height || 300;

	this.selector = "#" + id;
	this.containerSelector = "";

	this.closeBtnSelector = ".snsim_float_window_close_btn";
};

SNSIFrameFloatPanel.template = '<div id="##{{id}}" class="snsim_float_window">' + '<span class="snsim_float_window_head>'
		+ '<span class="snsim_float_window_head_title"></span>' + ' <a title="关闭" class="snsim_float_window_close_btn"></a>' + '</span>'
		+ '<iframe src="##{{url}}" frameborder="0" scrolling="no" width="##{{width}}" height="##{{height}}"></iframe>' + '</div>';

SNSIFrameFloatPanel.prototype = new SNSFloatPanel();

SNSIFrameFloatPanel.prototype._init = function() {

};

SNSIFrameFloatPanel.prototype.getTemplate = function() {
	return SNSIFrameFloatPanel.template;
};

SNSIFrameFloatPanel.prototype._bindDomEvent = function() {
	this.getDom().find(this.closeBtnSelector).bind("click", jQuery.proxy(function() {
		this.remove();
	}, this));
}

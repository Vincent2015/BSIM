/**
 * 该类封装了浮动窗口的属性和操作，根据panel的内容不同可以实现不同
 * @Class SNSFloatPanel
 * @Constructor title 浮动窗口的标题
 */
var SNSFloatPanel = function(title) {
	this.uuid = Math.uuid();

	this.title = title;

	this.selector = "#snsim_float_window_" + this.uuid;

	this.triggerSelector = "";

	this.closeBtnSelector = ".snsim_float_window_head_close_btn";

	this.headSelector = ".snsim_float_window_head";

	this.footSelector = ".snsim_float_window_foot";

	this.contentSelector = ".snsim_float_window_content";

	this.hideFloat = SNSComponent.HIDE_TYPE.IGNORE;
};

SNSFloatPanel.template = '<div id="snsim_float_window_##{{uuid}}" class="snsim_float_window">' + '<div class="snsim_float_window_head">'
		+ '<span class="snsim_float_window_head_title">##{{title}}</span>' + '<span class="snsim_float_window_head_close_btn">'
		+ '<a title="关闭"></a>' + '  </span>' + '</div>' + '<div class="snsim_float_window_content"></div>'
		+ '<div class="snsim_float_window_foot"></div>' + '</div>';

SNSFloatPanel.prototype = new SNSComponent();

SNSFloatPanel.prototype._init = function() {
	
	SNSComponent.prototype._init.call(this);
};

/**
 * 绑定浮动窗口的事件，关闭按钮
 */
SNSFloatPanel.prototype._bindDomEvent = function() {
	if (this.closeBtnSelector) {
		var node = this.getDom().find(this.closeBtnSelector);
		if (node.length == 0) {
			node = jQuery(this.closeBtnSelector);
			if (!node) {
				throw "invalid close button selector";
			}
		}
		node.bind("click", jQuery.proxy(this.hide, this));
	}
};

/**
 * 显示该浮动窗口，若该窗口没有被初始化则初始化该窗口
 */
SNSFloatPanel.prototype.show = function() {

	if (this.getDom().length == 0) {
		var html = this.buildHtml();
		if(this.getInsertDom && typeof this.getInsertDom == 'function'){
			jQuery(this.getInsertDom()).prepend(html);
		}else {
			jQuery("body").append(html);
		}
		this._bindDomEvent();
	}

	SNSComponent.prototype.show.call(this);
	return this;
}

/**
 * 生成Panel对应的HTML字符串并返回
 * @returns {String} 该Panel对应的HTML字符串
 */
SNSFloatPanel.prototype.buildHtml = function() {
	return TemplateUtil.genHtml(this.getTemplate(), this);
};

SNSFloatPanel.prototype.getTemplate = function() {
	return SNSFloatPanel.template;
};

/**
 * 界面中Tab页抽象出来的类
 * @Class SNSTab 继承自
 * @See SNSComponent
 * @author aviator
 */
var SNSTab = function() {

	this.index;

	/**
	 * Tab的名称， 同一个tabContainer中的name不能一样，否则会被覆盖
	 * @Type {String}
	 * @field
	 */
	this.name = Math.uuid();

	this.type = "tab";

	/**
	 * Tab标签头部的选择器
	 * @Type {String}
	 * @Field
	 */
	this.headSelector;

	/**
	 * Tab内容的选择器
	 * @Type {String}
	 * @Field
	 */
	this.contentSelector;

	/**
	 * 缓存头部的jQueryDom对象
	 * @Type {jQueryDom}
	 * @Private
	 */
	this._headDom;

	/**
	 * 缓存Tab内容的jQueryDom对象
	 * @Type {jQueryDom}
	 * @Private
	 */
	this._contentDom;

	this.closeable = false;
};

/**
 * Tab头部使用的模板
 * @static
 */
SNSTab.headTemplate;

/**
 * Tab内容部分使用的模板
 * @static
 */
SNSTab.contentTemplate;

SNSTab.prototype = new SNSComponent();

/**
 * 当添加到TabContainer中被调用
 */
SNSTab.prototype._init = function() {

};

/**
 * 判断节点是否可见
 * @returns {Boolean}
 */
SNSTab.prototype.visible = function() {
	return this.isContentVisible();
};

SNSTab.prototype.isHeadVisible = function() {
	var dom = this.getHeadDom();
	if (dom.is(":visible")) {
		return true;
	}
};

SNSTab.prototype.isContentVisible = function() {
	var dom = this.getContentDom();
	if (dom.is(":visible")) {
		return true;
	}
};

/**
 * 返回Tab头部的Dom节点，
 * @returns{jQueryDom} Array, 若返回值的length为0, 则说明头节点不存在
 */
SNSTab.prototype.getHeadDom = function() {
	if (!this._headDom || this._headDom.length == 0) {
		this._headDom = jQuery(this.headSelector);
	}
	return this._headDom;
};

/**
 * 返回Tab内容的Dom节点，
 * @returns{jQueryDom} Array, 若返回值的length为0, 则说明内容节点不存在
 */
SNSTab.prototype.getContentDom = function() {
	if (!this._contentDom || this._contentDom.length == 0) {
		this._contentDom = jQuery(this.contentSelector);
	}
	return this._contentDom;
};

/**
 * 返回根据头部模板填充数据后的HTML字符串
 * @returns {String}
 */
SNSTab.prototype.getHeadHtml = function() {
	return TemplateUtil.genHtml(this.getHeadTemplate(), this);
};

/**
 * 返回根据Tab内容模板填充数据后的HTML字符串
 * @returns {String}
 */
SNSTab.prototype.getContentHtml = function() {
	return TemplateUtil.genHtml(this.getContentTemplate(), this);
};

/**
 * 返回头部模板，用于屏蔽不同Tab的模板声明的不同
 * @returns {String}
 * @Abstract
 */
SNSTab.prototype.getHeadTemplate = function() {
	if (this.headTemplate){
		return this.headTemplate;
	}
	return SNSTab.headTemplate;
};

/**
 * 返回内容模板，用于屏蔽不同Tab的模板声明的不同
 * @returns {String}
 * @Abstract
 */
SNSTab.prototype.getContentTemplate = function() {
	if (this.contentTemplate){
		return this.contentTemplate;
	}
	return SNSTab.contentTemplate;
};

/**
 * 点击选中时，并且未执行选中操作时触发
 * @Event
 */
SNSTab.prototype.beforeSelect = function() {

};

/**
 * 本Tab 页被选中， 添加css class:cur
 */
SNSTab.prototype.select = function() {

	var head = this.getHeadDom();
	if (head.hasClass("cur")) {
		return;
	}
	var content = this.getContentDom();

	this.beforeSelect();

	head.addClass("cur");
	content.addClass("cur");

	this.afterSelect();
};

/**
 * 点击选中时，并且执行完选中操作时触发
 * @Event
 */
SNSTab.prototype.afterSelect = function() {

};

/**
 * 未执行取消选中操作时触发
 * @Event
 */
SNSTab.prototype.beforeUnselect = function() {

};

/**
 * 取消选中本tab
 */
SNSTab.prototype.unselect = function() {
	var head = this.getHeadDom();
	if (head.hasClass("cur")) {
		var content = this.getContentDom();

		this.beforeUnselect();

		head.removeClass("cur");
		content.removeClass("cur");
	}

};

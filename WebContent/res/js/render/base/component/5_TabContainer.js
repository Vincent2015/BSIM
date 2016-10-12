/**
 * tab容器的抽象类， 包装了对tab的各种操作
 * @Class SNSTabContainer
 * @see SNSWindow
 */
var SNSTabContainer = function() {
	this.selector;
	
	this.headContainerSelector;
	
	this.contentContainerSelector;
	
	/**
	 * 包含tab的集合类
	 * @Type SNSTabList
	 * @field
	 */
	this.tabs = new SNSTabList();
	
	this._headContainer;
	this._contentContainer;
}

SNSTabContainer.prototype = new SNSComponent();

SNSTabContainer.prototype._init = function() {
	YYIMChat.log("SNSTabContainer.prototype._init",3);
};

/**
 * 添加tab页, 如果Tab有模板存在，则会进行渲染操作
 * @param tab {SNSTab}
 */
SNSTabContainer.prototype.addTab = function(tab) {

	YYIMChat.log("addTab:", 3, this.tabs, tab);
	if(tab.getHeadTemplate()){
		this.getHeadContainer().append(tab.getHeadHtml());
	}
	if(tab.getContentTemplate()){
		this.getContentContainer().append(tab.getContentHtml());
	}
	this.tabs.add(tab);
	tab._init();
	this._bindDomEvent(tab);
};

/**
 * 获取tab头部的存放容器的DOM节点
 * @returns
 */
SNSTabContainer.prototype.getHeadContainer = function(){
	if(!this._headContainer || this._headContainer.length==0){
		this._headContainer = jQuery(this.headContainerSelector);
	}
	return this._headContainer;
};

/**
 * 获取tab的内容容器的DOM节点
 * @returns
 */
SNSTabContainer.prototype.getContentContainer = function(){
	if(!this._contentContainer || this._contentContainer.length==0){
		this._contentContainer = jQuery(this.contentContainerSelector);
	}
	return this._contentContainer;
};

/**
 * 
 */
SNSTabContainer.prototype._bindDomEvent = function(tab){
	var _self = this;
	tab.getHeadDom().bind("click", function() {
		_self.changeTabTo(tab);
	});
}

/**
 * 根据参数获取Tab对象
 * @param tab {SNSTab|string} tab对象或者jid字符串
 * @returns {SNSTab}
 */
SNSTabContainer.prototype.getTab = function(tab) {
	return this.tabs.get(tab);
};

/**
 * 返回当前集合中Tab对象的个数
 * @returns {Number}
 */
SNSTabContainer.prototype.size = function(){
	return this.tabs.size();
};

/**
 * 删除指定的tab页，若指定删除的tab为当前打开的tab页，且被关闭后tablist不为空，则随机返回一个存在的tab
 * @param tab {SNSTab|String} tab对象或者JID字符串
 * @returns {SNSTab} 若指定删除的tab为当前打开的tab页，且被关闭后tablist不为空，则随机返回一个存在的tab
 */
SNSTabContainer.prototype.removeTab = function(tab) {
	var cur = this.getCurrentTab();
	this.tabs.remove(tab);
	if (cur.name == tab.name) {
		this.tabs.tabCurName = null;
		if(this.size()!=0){
			return this.tabs.toArray()[0];
		}
	}
};

/**
 * 当tab页切换的时候触发
 * @event
 */
SNSTabContainer.prototype.onTabChange = function(oldTab, newTab) {
	
};

/**
 * 将指定的tab切换到当前， 触发onTabChange事件
 * @param tab {SNSTab | String}  指定的tab对象或者JID字符串
 */
SNSTabContainer.prototype.changeTabTo = function(tab) {
	this.onTabChange(this.getCurrentTab(),tab);
	if(this.getCurrentTab() != this.tabs.get(tab)){
		this.tabs.changeCurrentTo(tab);
		var list = this.tabs.toArray();
		for (var i = 0; i < list.length; i++) {
			if (list[i] == tab) {
				list[i].select();
			} else {
				list[i].unselect();
			}
		}
	}
};

/**
 * 返回当前选中的Tab对象
 * @returns {SNSTab}
 */
SNSTabContainer.prototype.getCurrentTab = function() {
	return this.tabs.getCurrentTab();
}
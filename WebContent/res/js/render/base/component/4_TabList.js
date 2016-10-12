/**
 * 包含对Tab的属性和方法的集合类，类似于Map
 * @Class SNSTabList
 * @See SNSBaseList
 */
var SNSTabList = function() {

	/**
	 * 当前选中的Tab的名称
	 * @field
	 * @type {String}
	 */
	this.tabCurName;
};

SNSTabList.prototype = new SNSBaseList();

/**
 * 以tab的name为key, 将tab对象到集合中，重复添加相同的name的tab, 之前添加的会被替换
 * @param tab {SNSTab}
 */
SNSTabList.prototype.add = function(tab) {
	if (tab && tab instanceof SNSTab)
		SNSBaseList.prototype.add.call(this, tab.name, tab);
};

/**
 * 返回指定的tab对象
 * @param tab {SNSTab |String} tab对象或jid字符串
 * @returns {SNSTab}
 */
SNSTabList.prototype.get = function(tab) {
	if (tab) {
		if (typeof tab == "string" && tab.notEmpty()) {
			return SNSBaseList.prototype.get.call(this, tab);
		} else if (tab instanceof SNSTab) {
			return SNSBaseList.prototype.get.call(this, tab.name);
		}
	}
};

/**
 * 从集合中删除指定的tab
 * @param tab {SNSTab |String} tab对象或jid字符串
 * @returns {Boolean}  true如果操作成功， false如果没有对象可以被删除
 */
SNSTabList.prototype.remove = function(tab) {
	if (tab) {
		if (typeof tab == "string" && tab.notEmpty()) {
			return SNSBaseList.prototype.remove.call(this, tab);
		} else if (tab instanceof SNSTab) {
			return SNSBaseList.prototype.remove.call(this, tab.name);
		}
	}
};

/**
 * 返回向前选中的tab对象
 * @returns {SNSTab}
 */
SNSTabList.prototype.getCurrentTab = function() {
	return this.get(this.tabCurName);
};

/**
 * 切换指定tab页到当前选中， 只对集合进行操作， 和界面无关
 * @param tab {SNSTab |String} tab对象或jid字符串
 */
SNSTabList.prototype.changeCurrentTo = function(tab) {
	var cur = this.get(tab);
	this.tabCurName = cur.name;
};
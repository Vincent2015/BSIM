var SNSGlobalEventManager = function() {
	this.BIND_DOM = jQuery(document);

	/**
	 * @description {Object} 存储自定义的全局事件监听器，结构为{name1:[listener1,listener2],name2:[listener3]...}
	 * @field
	 */
	this.events = new Object();
};

SNSGlobalEventManager.getInstance = function() {
	if (!SNSGlobalEventManager._instance) {
		SNSGlobalEventManager._instance = new SNSGlobalEventManager();
		if (SNSGlobalEventManager._instance && SNSGlobalEventManager._instance._init && typeof SNSGlobalEventManager._instance._init == "function") {
			SNSGlobalEventManager._instance._init();
		}
	}
	return SNSGlobalEventManager._instance;
};

/**
 * 触发监听事件
 * @param {string} subject
 * @param {Array} data
 */
SNSGlobalEventManager.prototype.trigger = function(subject, data) {
	YYIMChat.log("SNSGlobalEventManager.prototype.trigger: ", 3, subject);
	// 触发异步监听事件
	this.BIND_DOM.trigger(subject, data);

	// 触发同步监听事件
	if (this.events[subject] && this.events[subject] instanceof Array) {
		var eventList = this.events[subject];
		for (var i = 0; i < eventList.length; i++) {
			var listener = eventList[i];
			try{
				listener.callback.apply(listener.thisObj, data);
			}catch(e){
				YYIMChat.log("SNSGlobalEventManager.prototype.trigger :exception", 0, e, subject, data);
				break;
			}
			
		}
	}

};

/**
 * 注册全局事件监听函数
 * @param {Object} subject 监听的事件名称
 * @param {boolean} async true表示异步监听，false表示同步监听
 * @param {method} callback 事件处理器
 * @param {Object} thisObj optional callback的执行上下文
 * @return Whether register was successful
 * @type boolean
 */
SNSGlobalEventManager.prototype.registerEventHandler = function(subject, async, callback, thisObj) {
	
	if (async) {// 绑定异步监听器
		this.BIND_DOM.bind(subject, jQuery.proxy(callback, thisObj));
	} else {// 绑定同步监听器
		if (!this.events[subject]) {
			this.events[subject] = new Array();
		}
		this.events[subject].push(new SNSGlobalEventListener(subject, async, callback, thisObj));
	}
};
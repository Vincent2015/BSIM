/**
 * 全局事件监听对象
 * 
 * @param {Object} subject 监听的事件名称
 * @param {boolean} async true表示同步监听，false表示异步监听
 * @param {method} callback 事件处理器
 * @param {Object} thisObj optional, callback的执行上下文，仅对async==false起作用
 * @param {Number} thisObj callback延迟执行的时间，仅对async==false起作用
 */
var SNSGlobalEventListener = function(subject, async, callback, thisObj, timeout){
	
	/**
	 * @description {string} 所订阅的主题，即全局事件的名称
	 * @field
	 */
	this.subject = subject;
	
	/**
	 * @description {boolean} true表示异步执行，false表示同步执行
	 * @field
	 */
	this.async = async;
	
	/**
	 * @description {object} optional, callback的执行上下文，仅对async==false起作用
	 * @field
	 */
	this.thisObj = thisObj;
	
	/**
	 * @description {method} 执行的函数
	 * @field
	 */
	this.callback = callback || function(event, data){
		_logger.log("default global event callback");
	};
}
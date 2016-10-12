//消息的收发类型
var SNS_FILTER_TYPE = {
		RECEIVED:1,//接收到的消息或发送之后须在本地渲染显示的消息
		SEND:2//将要发送的消息
}

/**
 * 消息的过滤器的管理器，负责过滤器的注册和分配
 */
var SNSMessageFilterChain = function(){

	/**
	 * 保存注册的过滤器
	 * 
	 * @Type {Array}
	 */
	this.filters = new Array();
	
}

/**
 * 注册消息过滤器，过滤器须继承SNSMessageFilter, 并实现_doFilter方法
 * 
 * @param {SNSMessageFilter}
 */
SNSMessageFilterChain.prototype.registerFilter = function(contentFilter) {
	if (contentFilter instanceof SNSMessageFilter) {
		YYIMChat.getArrayUtil().insert(this.filters, contentFilter.priority, contentFilter);
		this.filters.sort(function(a, b) {
			return a.priority - b.priority;
		});
	}
};

/**
 * 对消息进行链状处理（采用for循环，降低实现难度）
 * 
 * @param {SNSMessage} msg 被处理的消息对象
 * @param {Number} filterType 采用的处理器类型
 * @See SNS_FILTER_TYPE
 */
SNSMessageFilterChain.prototype.doFilter = function(msg) {
	if (msg && msg instanceof SNSMessage) {
		for ( var i in this.filters) {
			var filter = this.filters[i];
			if(filter && filter instanceof SNSMessageFilter){
				filter.doFilter(msg);
			}
		}
	}
}
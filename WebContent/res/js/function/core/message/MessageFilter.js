/**
 * 消息过滤器的父类，实现了过滤器是否处理消息的判断方法
 */
var SNSMessageFilter = function() {

	/**
	 * 过滤器的优先级， 数字越小越先被处理
	 * 	 * @Type {Number}
	 */
	this.priority = 99;

	this.type = SNS_FILTER_TYPE.RECEIVED | SNS_FILTER_TYPE.SEND;
	
	/**
	 * 声明过滤器对哪些内容类型的消息进行处理
	 * 
	 * @Type {Number}
	 */
	this.contentType = SNS_MESSAGE_CONTENT_TYPE.TEXT;

	/**
	 * 判断是否对消息进行处理， 有消息的内容类型和收发类型决定
	 * 
	 * @param {SNSMessage} msg 被处理的消息对象
	 * @param {Number} filterType 采用的处理器类型
	 * @See SNS_FILTER_TYPE
	 */
	this.doFilter = function(msg) {
		if (this.contentType & msg.body.contentType | 0) {
			this._doFilter(msg);
		}
	};
	/**
	 * 消息的真正处理方法， 子类需要实现此方法
	 * 
	 * @param {SNSMessage} msg 被处理的消息对象
	 */
	this._doFilter = function(msg) {
	};
};

SNSMessageFilter.prototype = new SNSPlugin();

/**
 * 初始化插件，注册全局事件
 */
SNSMessageFilter.prototype._init = function(){
	
	if((this.type &  SNS_FILTER_TYPE.RECEIVED)!=0){
		SNSApplication.getInstance().registerMessgeInFilter(this);
	}
	
	if((this.type &  SNS_FILTER_TYPE.SEND)!=0){
		SNSApplication.getInstance().registerMessgeOutFilter(this);
	}
	
	SNSPlugin.prototype._init.call(this);
}
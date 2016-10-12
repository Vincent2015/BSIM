/**
 * 所有插件的父类， 一般通过注册到相关接口作为入口， 如全局事件
 * @Class SNSPlugin
 * @Abstract
 * @Construtor
 */
var SNSPlugin = function() {

	this.name;

	/**
	 * @description {boolean} 插件是否启用
	 * @field
	 */
	this.enable = true;

	/**
	 * @description {boolean} 插件是否已经载入
	 * @field
	 */
	this.loaded = false;

	/**
	 * @description {Number} 插件的载入时期
	 * @field
	 */
	this.loadPeriod = SNS_EVENT_SUBJECT.AFTER_CONNECT;

};

/**
 * 初始化插件，注册全局事件
 */
SNSPlugin.prototype._init = function() {
	this.loaded = true;
}

SNSPlugin.pluginList = new SNSBaseList();

/**
 * 启动该插件
 */
SNSPlugin.prototype.start = function() {
	/*if (SNSPlugin.pluginList.get(this.name)) {
		return;
	}*/
	// 如果插件未启用，或者已经载入，直接退出
	if (!this.enable || this.loaded)
		return;
	SNSApplication.getInstance().getGlobalEventManager().registerEventHandler(this.loadPeriod, true, function() {
		if(this.loaded){
			return;
		}
		this._init();
	}, this);
	SNSPlugin.pluginList.add(this.name, this);

};
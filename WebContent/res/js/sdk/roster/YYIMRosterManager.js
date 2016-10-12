var YYIMRosterManager = function(){
	this._provider;
	this._onlineList = new SNSBaseList();
};

YYIMRosterManager.getInstance = function(){
	if(!YYIMRosterManager._instance){
		YYIMRosterManager._instance = new YYIMRosterManager();
	}
	return YYIMRosterManager._instance;
};


YYIMRosterManager.prototype.addToOnline = function(id) {
	this._onlineList.add(id, true);
};

YYIMRosterManager.prototype.removeFromOnline = function(id) {
	this._onlineList.remove(id);
};

/**
 * 现在主要初始化provider
 * @param arg {provider: YYIMRosterProvider}
 */
YYIMRosterManager.prototype.init = function(arg) {
	if(arg && arg.provider)
		this._provider = arg.provider;
	else
		this._provider = new YYIMRosterProvider();
};

YYIMRosterManager.prototype.getProvider = function() {
	if(!this._provider)
		this._provider = new YYIMRosterProvider();
	return this._provider;
};

/**
 * 请求好友列表
 * @param arg {success: function, error: function, complete:function}
 */
YYIMRosterManager.prototype.getRosterItems = function(arg) {
	if(this.getProvider() && YYIMCommonUtil.isFunction(this.getProvider().getRosterItems))
		this.getProvider().getRosterItems(arg);
};

/**
 * 添加好友, 先去IM Server上进行发包, 再去调用Provider
 * @param jid
 */
YYIMRosterManager.prototype.addRosterItem = function(jid) {
	YYIMPresence.addRosterItem(jid);
	if(this.getProvider() && YYIMCommonUtil.isFunction(this.getProvider().addRosterItem))
		this.getProvider().addRosterItem(jid);
};

/**
 * 删除好友, 先去IM Server上进行删除, 再去调用Provider
 * @param arg {jid: string, success: function, error: function,complete: function}
 */
YYIMRosterManager.prototype.deleteRosterItem = function(arg) {
	// 需要服务器的推送, 因此须在Provider之外发送
	YYIMIQ.deleteRosterItem(arg);
	if(this.getProvider() && YYIMCommonUtil.isFunction(this.getProvider().deleteRosterItem))
		this.getProvider().deleteRosterItem(arg);
};

/**
 * 查找好友[roster][包括好友和非好友]，查询字段：userName, name
 * @param arg {keyword, success: function, error: function,complete: function}
 */
YYIMRosterManager.prototype.queryRosterItem = function(arg) {
	if(this.getProvider()&& YYIMCommonUtil.isFunction(this.getProvider().queryRosterItem))
		this.getProvider().queryRosterItem(arg);
};
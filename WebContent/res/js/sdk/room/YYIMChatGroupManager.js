var YYIMChatGroupManager = function(){
	this._provider;
};

YYIMChatGroupManager.getInstance = function(){
	if(!YYIMChatGroupManager._instance){
		YYIMChatGroupManager._instance = new YYIMChatGroupManager();
	}
	return YYIMChatGroupManager._instance;
};

/**
 * 现在主要初始化provider
 * @param arg {provider: YYIMChatGroupProvider}
 */
YYIMChatGroupManager.prototype.init = function(arg) {
	if(arg && arg.provider)
		this._provider = arg.provider;
	else
		this._provider = new YYIMChatGroupProvider();
};

YYIMChatGroupManager.prototype.getProvider = function() {
	if(!this._provider)
		this._provider = new YYIMChatGroupProvider();
	return this._provider;
};

/**
 * 获取群组列表
 * @param arg
 */
YYIMChatGroupManager.prototype.getChatGroups = function(arg) {
	if(this.getProvider() && YYIMCommonUtil.isFunction(this.getProvider().getChatGroups))
		this.getProvider().getChatGroups(arg);
};

/**
 * 创建一个群组, 先去IM Server创建后再去Provider　
 * @param arg {name, node, desc, nickName, success: function, error: function, complete:function}
 */
YYIMChatGroupManager.prototype.addChatGroup = function(arg) {
	// 请求加入群
	YYIMPresence.joinChatGroup({
		jid : YYIMJIDUtil.buildChatGroupJID(YYIMJIDUtil.getNode(arg.node)),
		success : function() {
			// 发送配置表单
			YYIMIQ.configChatGroup({
				jid : this.jid,
				name : arg.name,
				desc : arg.desc,
				error : arg.error,
				success : function() {
					arg.success && arg.success({
						name : arg.name,
						node : arg.node,
						id : arg.id,
						nickname : YYIMManager.getInstance().getUserID()
					});
				},
				complete : arg.complete 
			});
			
		},
		error : function() {
			arg.error && arg.error();
		}
	});
	
	if(this.getProvider() && YYIMCommonUtil.isFunction(this.getProvider().addChatGroup))
		this.getProvider().addChatGroup(arg);
};

/**
 * 退出群, 先发包到IM Server
 * @param jid
 */
YYIMChatGroupManager.prototype.delGroupMember = function(roomid, delid, callbackFn) {
	YYIMPresence.delGroupMember(roomid, delid, callbackFn);
};

/**
 * 删除群成员, 先发包到IM Server
 * @param jid
 */
YYIMChatGroupManager.prototype.quitChatGroup = function(jid) {
	YYIMPresence.quitChatGroup(jid);
	if(this.getProvider() && YYIMCommonUtil.isFunction(this.getProvider().quitChatGroup))
		this.getProvider().quitChatGroup(jid);
};

/**
 * 查找群
 * @param arg {keyword, start, size, success: function, error: function,complete: function}
 */
YYIMChatGroupManager.prototype.queryChatGroup = function(arg) {
	if(this.getProvider() && YYIMCommonUtil.isFunction(this.getProvider().queryChatGroup))
		this.getProvider().queryChatGroup(arg);
};

/**
 * 加入群组，发包至IM Server, 暂时Provider中无此接口
 * @param arg
 */
YYIMChatGroupManager.prototype.joinChatGroup = function(arg) {
	YYIMPresence.joinChatGroup(arg);
};

/**
 * 更新群组信息
 * @param arg {jid, name, desc, success: function, error: function, complete:function}
 */
YYIMChatGroupManager.prototype.updateChatGroup = function(arg) {
	// 发送配置表单
	YYIMIQ.configChatGroup(arg);
};
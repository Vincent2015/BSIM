var YYIMChatGroupMemberManager = function(){
	this._provider;
};

YYIMChatGroupMemberManager.getInstance = function(){
	if(!YYIMChatGroupMemberManager._instance){
		YYIMChatGroupMemberManager._instance = new YYIMChatGroupMemberManager();
	}
	return YYIMChatGroupMemberManager._instance;
};

/**
 * 现在主要初始化provider
 * @param arg {provider: YYIMChatGroupMemberProvider}
 */
YYIMChatGroupMemberManager.prototype.init = function(arg) {
	if(arg && arg.provider)
		this._provider = arg.provider;
	else
		this._provider = new YYIMChatGroupMemberProvider();
};

YYIMChatGroupMemberManager.prototype.getProvider = function() {
	if(!this._provider)
		this._provider = new YYIMChatGroupMemberProvider();
	return this._provider;
};

/**
 * 获取指定群的群成员[chatroom]
 * @param arg {jid: string, success: function, error: function,complete: function}
 */
YYIMChatGroupMemberManager.prototype.getGroupMembers = function(arg) {
	if(this.getProvider() && YYIMCommonUtil.isFunction(this.getProvider().getGroupMembers))
		this.getProvider().getGroupMembers(arg);
};

/**
 * 发送邀请报文给联系人，邀请其加入聊天室, 先发包至IM Server
 * @param roomJid
 * @param jids {Array<String>}
 */
YYIMChatGroupMemberManager.prototype.addGroupMember = function(roomJid, jids) {
	YYIMMessage.addGroupMember(roomJid, jids);
	if(this.getProvider() && YYIMCommonUtil.isFunction(this.getProvider().addGroupMember))
		this.getProvider().addGroupMember(roomJid, jids);
};
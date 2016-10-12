var YYIMChatGroupMemberProvider = function(){
	
};

/**
 * 获取指定群的群成员
 * @param arg {jid: string, success: function, error: function,complete: function}
 */
YYIMChatGroupMemberProvider.prototype.getGroupMembers = function(arg){
	YYIMIQ.getGroupMembers(arg);
};

/**
 * 发送邀请报文给联系人，邀请其加入聊天室
 * @param roomJid
 * @param jids {Array<String>}
 */
YYIMChatGroupMemberProvider.prototype.addGroupMember = function(roomJid, jids) {
	// do nothing
};
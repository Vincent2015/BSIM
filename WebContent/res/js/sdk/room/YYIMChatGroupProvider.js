var YYIMChatGroupProvider = function(){
	
};

/**
 * 查询自己所在的群组
 * @param arg {success: function, error: function, complete:function}
 */
YYIMChatGroupProvider.prototype.getChatGroups = function(arg){
	YYIMIQ.getChatGroups(arg);
};

/**
 * 创建房间
 * @param arg {name, node, desc, success: function, error: function, complete:function}
 */
YYIMChatGroupProvider.prototype.addChatGroup = function(arg){
	// do nothing
};

/**
 * 退出一个房间
 * 发送一个类型为"unavailable"的出席信息节给正在使用这个房间的 <room@service/nick>.
 */
YYIMChatGroupProvider.prototype.quitChatGroup = function(roomJid){
	// do nothing
};

/**
 * 查找群
 * @param arg {keyword, start, size, success: function, error: function,complete: function}
 */
YYIMChatGroupProvider.prototype.queryChatGroup = function(arg) {
	YYIMIQ.queryChatGroup(arg);
};
var YYIMRosterProvider = function(){
	
};

/**
 * 请求好友列表
 * @param arg {success: function, error: function, complete:function}
 */
YYIMRosterProvider.prototype.getRosterItems = function(arg){
	YYIMIQ.getRosterItems(arg);
};

/**
 * 添加好友请求
 * @param jid
 */
YYIMRosterProvider.prototype.addRosterItem = function(jid){
	// do nothing
};

/**
 * 删除好友
 * TODO 根据订阅关系的改变判断删除结果 deleteRosterItem(username)
 * @param arg {jid: string, success: function, error: function,complete: function}
 */
YYIMRosterProvider.prototype.deleteRosterItem = function(arg){
	// do nothing
};

/**
 * @param arg 搜索相关设置 {keyword, success, error}
 */
YYIMRosterProvider.prototype.queryRosterItem = function(arg) {
	YYIMIQ.queryRosterItem(arg);
};
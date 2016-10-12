var SNSSpaceChatGroupProvider = function(){
	
};

/**
 * 查询自己所在的群组
 * @param arg {success: function, error: function, complete:function}
 */
SNSSpaceChatGroupProvider.prototype.getChatGroups = function(arg){
	if(!arg)
		return;
	var url = SNSSpaceApplication.REST_BASE + 'group/list/mid/'+ YYIMChat.getUserBareNode();
	jQuery.ajax({
		url: url,
		dataType: 'jsonp',
		type: "get",
		success: jQuery.proxy(function(data, status, obj){
			YYIMChat.log("get group list success", 3, arguments); 
			this._roomListHandler(data, arg);
		}, this),
		error: function(data){
			YYIMChat.log("get group list error", 2, arguments); 
		}
	});
};

/**
 * 创建群组
 * @param arg {name, node, desc, success: function, error: function, complete:function}
 */
SNSSpaceChatGroupProvider.prototype.addChatGroup = function(arg){
	if(!arg)
		return;
	var url = SNSSpaceApplication.REST_BASE + 'group/info/mid/'+ YYIMChat.getUserBareNode();
	jQuery.ajax({
		url: url,
		dataType: 'jsonp',
		type: "POST",
		data:{
			gname: arg.name,
			description: arg.desc? arg.desc : arg.name
		},
		success: jQuery.proxy(function(data, status, obj){
			YYIMChat.log("create group success", 3, arguments); 
			if(SNSCommonUtil.isFunction(arg.success)){
				arg.success(arg);
			}
		}, this),
		error: function(data){
			YYIMChat.log("get group list error", 2, arguments); 
		}
	});
};

/**
 * 退出一个群
 * @param roomId
 */
SNSSpaceChatGroupProvider.prototype.deleteChatGroup = function(roomId){};

/**
 * @param arg 搜索相关设置 {keyword, success, error}
 */
SNSSpaceChatGroupProvider.prototype.queryChatGroup = function(arg) {};

SNSSpaceChatGroupProvider.prototype._roomListHandler = function(list, arg){
	if(SNSCommonUtil.isFunction(arg.complete)) {
		arg.complete();
	}

	var fmtList = [];
	for(var key in list){
		var item = list[key];
		fmtList.push({
			id: String(item.gid),
			name: item.group_name
		});
	}
	YYIMChat.syncRoom(fmtList);
	
	if(SNSCommonUtil.isFunction(arg.success)){
		arg.success(JSON.stringify(fmtList));
	}
};
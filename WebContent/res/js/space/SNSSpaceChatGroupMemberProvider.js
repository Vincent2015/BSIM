var SNSSpaceChatGroupMemberProvider = function(){
	
};

/**
 * 获取指定群的群成员
 * @param arg {id: string, success: function, error: function,complete: function}
 */
SNSSpaceChatGroupMemberProvider.prototype.getGroupMembers = function(arg){
	if(!arg)
		return;
	var url = SNSSpaceApplication.REST_BASE + 'group/person/mid/' + YYIMChat.getUserBareNode() + '/group/' + arg.id;
	jQuery.ajax({
		url: url,
		dataType: 'jsonp',
		type: "get",
		success: jQuery.proxy(function(data, status, obj){
			YYIMChat.log("get member list success", 3, arguments); 
			this._memberListHandler(data, arg);
		}, this),
		error: function(data){
			YYIMChat.log("get member list error", 2, arguments); 
		}
	});
};

/**
 * 发送邀请报文给联系人，邀请其加入聊天室
 * @param roomId
 * @param ids {Array<String>}
 */
SNSSpaceChatGroupMemberProvider.prototype.addGroupMember = function(roomId, ids) {
	
};

SNSSpaceChatGroupMemberProvider.prototype._memberListHandler = function(list, arg){
	if(SNSCommonUtil.isFunction(arg.complete)) {
		arg.complete();
	}

	var fmtList = [];
	for(var key in list){
		var item = list[key];
		fmtList.push({
			id: String(item.member_id),
			name: String(item.username)
		});
	}
	if(SNSCommonUtil.isFunction(arg.success)){
		arg.success(JSON.stringify(fmtList));
	}
};
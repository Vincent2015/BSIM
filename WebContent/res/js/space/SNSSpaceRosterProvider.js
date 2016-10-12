var SNSSpaceRosterProvider = function(){};

/**
 * 请求好友列表[required]
 * @param arg {success: function, error: function, complete:function}
 */
SNSSpaceRosterProvider.prototype.getRosterItems = function(arg){
	if(!arg)
		return;
	var url = SNSSpaceApplication.REST_BASE + 'member/follow/mid/' + YYIMChat.getUserBareNode();// + arg.username;
	jQuery.ajax({
		url: url,
		dataType: 'jsonp',
		type: "get",
		success: jQuery.proxy(function(data, status, obj){
			YYIMChat.log("get roster list success", 3, arguments); 
			this._rosterListHandler(data, arg);
		}, this),
		error: function(data){
			YYIMChat.log("get roster list error", 2, arguments); 
		}
	});
};

/**
 * 请求加好友 [required]
 * @param id id或者node
 */
SNSSpaceRosterProvider.prototype.addRosterItem = function(id){};

/**
 * 解除好友关系 [required]
 * @param arg {id: string, success: function, error: function,complete: function}
 */
SNSSpaceRosterProvider.prototype.deleteRosterItem = function(arg){};

/**
 * 从服务器搜索用户 [required]
 * @param arg 搜索相关设置 {keyword, success, error}
 */
SNSSpaceRosterProvider.prototype.queryRosterItem = function(arg) {
	if(!arg)
		return;
	var url = SNSSpaceApplication.REST_BASE + 'member/search/mid/' + YYIMChat.getUserBareNode() + '/key/' + arg.keyword;
	jQuery.ajax({
		url: url,
		dataType: 'jsonp',
		type: "get",
		success: jQuery.proxy(function(list, status, obj){
			YYIMChat.log("search roster results", 3, list); 
			var fmtList = [];
			for(var key in list){
				var item = list[key];
				fmtList.push({
					id: String(item.value),
					name: item.name
				});
			}
			if(SNSCommonUtil.isFunction(arg.success)){
				arg.success(JSON.stringify(fmtList));
			}
		}, this),
		error: function(data){
			YYIMChat.log("get roster list error", 2, arguments); 
		}
	});
};

SNSSpaceRosterProvider.prototype._rosterListHandler = function(list, arg){
	if(SNSCommonUtil.isFunction(arg.complete)) {
		arg.complete();
	}
	
	var fmtList = [];
	for(var key in list){
		var item = list[key];
		fmtList.push({
			id: String(item.id),
			name: item.name,
			photo: item.avatar,
			subscription: "both",
			group: []
		});
	}
	YYIMChat.syncRoster(fmtList);
	if(SNSCommonUtil.isFunction(arg.success)){
		arg.success(JSON.stringify(fmtList));
	}
};
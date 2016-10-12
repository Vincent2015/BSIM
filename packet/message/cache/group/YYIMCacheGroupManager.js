function YYIMCacheGroupManager(){
}

YYIMCacheGroupManager.prototype = new YYIMCacheList();

YYIMCacheGroupManager.getInstance = function(){
	if(!this._instance){
		this._instance = new YYIMCacheGroupManager();
	}
	return this._instance;
};

/**
 * 更新群组缓存
 * @param {Object} 
 * arg {
 * 	id,name,numberOfMembers,superLarge,collected,creater,members,photo
 * }
 */
YYIMCacheGroupManager.prototype.updateCache = function(arg){
	if(!!arg && arg.id){
		var group = this.get(arg.id);
		if(!!group){
			group.build(arg);
		}else{
			group = new YYIMCacheGroup(arg);
			this.set(group.id,group);	
		}
		return group;
	}
};

/**
 * 创建群组
 * @param arg {name:,members:[],success:function,complete:function}
 */
YYIMCacheGroupManager.prototype.createChatGroup = function(arg){
	var that = this;
	YYIMChat.createChatGroup({
		name:arg.name,
		members:arg.members || [],
		success:function(data){
			that.updateCache(data);
			arg.success && arg.success(data);
		},
		complete:function(){
			arg.complete && arg.complete();
		}
	});
};

/**
 * 转让群主
 * @param {Object} arg 
 * {to:群组,newOwner:string,success:function,error:function,complete:function}
 */
YYIMCacheGroupManager.prototype.transferChatGroup = function(arg){
	var group = this.get(arg.to);
	if(group.owner && group.owner.id === YYIMChat.getUserID()){
		var newOwner = group.get(arg.newOwner);
		if(newOwner){
			var that = this;
			YYIMChat.transferChatGroup({
				to:	arg.to || arg.id,
				newOwner: arg.newOwner,
				success: function(data){
					that.transferOwner(arg.to,arg.newOwner);
					arg.success && arg.success(data);
				},
				complete:function(){
					arg.complete && arg.complete();
				}
			});
		}
	}
};

/**
 * 转换群组
 * @param {Object} arg
 * {to:群组,newOwner:string}
 */
YYIMCacheGroupManager.prototype.transferOwner = function(arg){
	if(arg.to){
		var group = this.get(arg.to);
		if(group && arg.newOwner){
			group.transferOwner(arg.newOwner); 
		}
	}
};

/**
 * 邀请群成员
 * @param {Object} arg 
 * {to:群组,members:[],success:function,error:function,complete:function}
 */
YYIMCacheGroupManager.prototype.inviteGroupMember = function(arg){
	var that = this;
	YYIMChat.inviteGroupMember({
		to:arg.to || arg.id,
		members:arg.members || [],
		success:function(data){
			that.updateCache(data);
			arg.success && arg.success(data);
		},
		complete:function(){
			arg.complete && arg.complete();
		}
	});
};

/**
 * 更改群名称
 * @param {Object} arg 
 * {to:群组,name:string, success: function,complete: function}
 */
YYIMCacheGroupManager.prototype.modifyChatGroupInfo = function(arg){
	if(this.get(arg.to).owner.id === YYIMChat.getUserID()){
		var that = this;
		YYIMChat.modifyChatGroupInfo({
			to:arg.to || arg.id,
			name:arg.name,
			success:function(data){
				that.updateCache(data);
				arg.success && arg.success(data);
			},
			complete:function(){
				arg.complete && arg.complete();
			}
		});
	}
};

/**
 * 被群组踢出
 * @param {Object} arg
 */
YYIMCacheGroupManager.prototype.KickedOutByGroup = function(arg){
	if(arg.to === YYIMChat.getUserID()){
		this.remove(arg.from);
	}
};

/**
 * 退出群组
 * {to:群组,success: function,complete: function}
 */
YYIMCacheGroupManager.prototype.exitChatGroup = function(arg){
	var that = this;
	YYIMChat.exitChatGroup({
		to:arg.to,
		success:function(data){
			that.remove(data.from);
		},
		complete:function(){
			arg.complete && arg.complete();
		}
	});
};

/**
 * 收藏群组
 * @param {Object} arg
 *  {to:群组id, success: function, error: function,complete: function}
 */
YYIMCacheGroupManager.prototype.collectGroup = function(arg){
	var that = this;
	YYIMChat.collectGroup({
		to:arg.to,
		success:function(data){
			that.updateCache({id:data.from,collected:1});
		},
		complete:function(){
			arg.complete && arg.complete();
		}
	});
};

/**
 * 取消收藏群组
 * @param {Object} arg
 *  {to:群组id, success: function, error: function,complete: function}
 */
YYIMCacheGroupManager.prototype.removeCollectGroup = function(arg){
	var that = this;
	YYIMChat.removeCollectGroup({
		to:arg.to,
		success:function(data){
			that.updateCache({id:data.from,collected:0});
		},
		complete:function(){
			arg.complete && arg.complete();
		}
	});
};




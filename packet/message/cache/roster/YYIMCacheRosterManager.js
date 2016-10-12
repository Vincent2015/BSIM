function YYIMCacheRosterManager(){
	this.init();
	this.enableVCardFields = [];
}

YYIMCacheRosterManager.prototype = new YYIMCacheList();

YYIMCacheRosterManager.getInstance = function(){
	if(!this._instance){
		this._instance = new YYIMCacheRosterManager();
	}
	return this._instance;
};

YYIMCacheRosterManager.prototype.init = function(){
	this.updateCache({
		id:YYIMChat.getUserID()
	});
	
	this.getRostersPresence();
};

/**
 * 创建、更新联系人信息
 * arg {	
 * 		id,name,ask,recv,resource,subscription,group,photo,
 *	}
 */
YYIMCacheRosterManager.prototype.updateCache = function(arg){
	if(!!arg && arg.id){
		var roster = this.get(arg.id);
		if(!!roster){
			roster.build(arg);
		}else{
			roster = new YYIMCacheRoster(arg);
			this.set(roster.id,roster);	
		}
		return roster;
	}
};

/**
 * 发送添加好友请求
 * @param {Object} id
 */
YYIMCacheRosterManager.prototype.addRoster = function(id){
	if(!!id){
		var roster = this.get(id);
		if(!roster || this.getRostersList('none').indexOf(roster) !== -1){
			YYIMChat.addRosterItem(id);
			this.updateCache({
				id:id,
				ask:1,
				recv:-1,
				subscription:YYIMCacheConfig.ROSTER_SUBSCRIPTION_TYPE.NONE
			});
		}
	}
};

/**
 * 发送删除好友请求
 * @param {Object} 
 * arg {
 * 	id:,
 *  success:function,
 *  complete:function
 * }
 */
YYIMCacheRosterManager.prototype.deleteRoster = function(arg){
	if(!!arg && this.getRostersList('friend').indexOf(this.get(arg.id)) !== -1){
		var that = this;
		YYIMChat.deleteRosterItem({
			id:arg.id,
			success:function(){
				that.updateCache({
					id:arg.id,
					ask:-1,
					recv:-1,
					subscription:YYIMCacheConfig.ROSTER_SUBSCRIPTION_TYPE.NONE
				});
				arg.success && arg.success();
			},
			complete:function(){
				arg.complete && arg.complete();
			}
		});
	}
};

/**
 * 同意添加好友请求
 */
YYIMCacheRosterManager.prototype.approveRoster = function(id){
	if(!!id && this.getRostersList('recv').indexOf(this.get(id)) !== -1){
		YYIMChat.approveSubscribe(id);
		this.updateCache({
			id:id,
			ask:-1,
			recv:-1,
			subscription:YYIMCacheConfig.ROSTER_SUBSCRIPTION_TYPE.BOTH
		});
	}
};

/**
 * 删除联系人 (暂时用不到)
 * @param {Object} id
 */
YYIMCacheRosterManager.prototype.removeRoster = function(id){
	this.remove(id);
};

/**
 * 更新联系人在线状态
 * @param {Object} 
 * arg {
 * 	from:,
 *  resource:,
 *  show:
 * }
 */
YYIMCacheRosterManager.prototype.updatePresence = function(arg){
	if(!!arg && (arg.from || arg.id)){
		var roster = this.get(arg.from || arg.id);
		if(!!roster){
			roster.updatePresence(arg);
		}
	}
};

/**
 * 批量获取联系人的在线状态
 */
YYIMCacheRosterManager.prototype.getRostersPresence = function(){
	var that = this;
    setTimeout(function(){
    	var keys = Object.keys(that.list)
		YYIMChat.getRostersPresence({
			username: keys,
			success:function(data){
				for(var x in data){
					var presence = data[x].presence;
					for(var y in presence){
						if(presence[y].available){
							that.updatePresence({
								id:data[x].userid,
								resource: presence[y].device,
								show: presence[y].show
							});
						}
					}
				}
			}
		});
    },500);
};

/**
 * 修改本人vcard
 * @param {Object} 
 * arg {
 * 		vcard : {
 * 			nickname,
 * 			photo,
 * 			email,
 * 			mobile,
 * 			telephone
 * 		},
 * 		success : function,
 * 		error : fcuntion
 * }
 */
YYIMCacheRosterManager.prototype.setVCard = function(arg){
	var roster = this.get(YYIMChat.getUserID());
	if(!!roster){
		roster.setVCard(arg);	
	}
};


/**
 * 修改好友备注
 * @param {Object} 
 * arg {
 * 	roster:{
 *		id:String, //联系人id
 * 		name:String,//新的备注姓名
 * 		group:[] //新的分组(数组)
 *  },
 *  success:function,
 *  error:function 
 * }
 */
YYIMCacheRosterManager.prototype.setRemark = function(arg){
	if(!!arg && arg.roster && arg.roster.id){
		var roster = this.get(arg.roster.id);
		if(!!roster){
			roster.setRemark(arg);	
		}
	}
};

/**
 * 获取联系人(自己，好友，请求的，被请求的，陌生人)列表
 * @param {Object} 
 * key 空：全部列表，myself：自己，friend：好友，ask：发送请求的，recv：被请求的，none：陌生人
 */
YYIMCacheRosterManager.prototype.getRostersList = function(key){
	var list = this.get();
	var tempList = [];
	for(var x in list){
		if(typeof key === 'undefined'){
			tempList.push(list[x]);
			continue;
		}
		if(list[x].rosterType === key){
			tempList.push(list[x]);
	    }
	}
	return tempList;	
};


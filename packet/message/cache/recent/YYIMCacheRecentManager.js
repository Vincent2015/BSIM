function YYIMCacheRecentManager(){
	this.recentTopList = [];
	this.recentNormalList = [];
	this.recentList = [];
}

YYIMCacheRecentManager.prototype = new YYIMCacheList();

YYIMCacheRecentManager.getInstance = function(){
	if(!this._instance){
		this._instance = new YYIMCacheRecentManager();
	}
	return this._instance;
};

YYIMCacheRecentManager.prototype.init = function(){
	if(!this.id){
		this.id = YYIMChat.getUserNode();
	}
	
	if(!!this.id){
		var list = null;
		try{
			list = JSON.parse(this.getItem(this.id));
		}catch(e){
		}
		
		if(!!list && list.length){
			for(var x in list){
				this.updateCache(list[x]);
			}
		}
	}
};


YYIMCacheRecentManager.prototype.updateCache = function(arg){
	if(!this.id){
		this.id = YYIMChat.getUserID();
	}
	
	if(!!arg && arg.id){
		var recent = this.get(arg.id);
		
		if(!!recent && typeof arg.stick == 'boolean' && arg.stick !== recent.stick){ //设置 置顶
			recent.stick = arg.stick;
			arg = recent;
			this.remove(arg.id);
			recent = null;
		}
		
		if(!!recent){
			recent.build(arg);
			
			var targetList = this.recentNormalList;
			if(recent.stick){
				targetList = this.recentTopList;
			}
			
			if(arg.sort){
				if(targetList.indexOf(recent)>-1){
					if(targetList.indexOf(recent)!=0){
						targetList.splice(targetList.indexOf(recent),1);
						targetList.unshift(recent);
					}
				}
			}
		}else{
			recent = new YYIMCacheRecent(arg);
			
			var manager = YYIMCacheRosterManager.getInstance();
			if(recent.type === YYIMCacheConfig.CHAT_TYPE.GROUP_CHAT){
				manager = YYIMCacheGroupManager.getInstance();
			}else if(recent.type === YYIMCacheConfig.CHAT_TYPE.PUB_ACCOUNT){
				manager = YYIMCachePubAccountManager.getInstance();
			}
			
			if(!manager.get(recent.id)){
				return;
			}
			
			this.set(recent.id,recent);
			
			var targetList = this.recentNormalList;
			if(recent.stick){
				targetList = this.recentTopList;
			}
			targetList.unshift(recent);
		}
		
		this.recentList = this.recentTopList.concat(this.recentNormalList);
		
		this.save();
		
		return recent;
	}
};

YYIMCacheRecentManager.prototype.remove = function(key){
	if(!!key){
		var recent = this.get(key);
		if(!!recent){
			delete this.list[key];
			if(this.recentTopList.indexOf(recent) > -1){
				this.recentTopList.splice(this.recentTopList.indexOf(recent),1);
			}
			
			if(this.recentNormalList.indexOf(recent) > -1){
				this.recentNormalList.splice(this.recentNormalList.indexOf(recent),1);
			}
			this.recentList = this.recentTopList.concat(this.recentNormalList);
			this.save();
		}
	}
};

YYIMCacheRecentManager.prototype.getRecentList = function(){
	this.recentList = this.recentTopList.concat(this.recentNormalList);
	return this.recentList;
};

YYIMCacheRecentManager.prototype.save = function(){
	if(this.recentList.length){
		var temp = [];
		for(var x in this.recentList){
			if(!!this.recentList[x].id){
				var obj = {
					id: this.recentList[x].id,
					name: this.recentList[x].name,
					dateline: this.recentList[x].dateline,
					latestState : this.recentList[x].latestState,
					type: this.recentList[x].type,
					contentType: this.recentList[x].contentType,
					stick: this.recentList[x].stick
				};
				temp.unshift(obj);
			}
		}
		
		if(!!this.id){
			this.setItem(this.id,JSON.stringify(temp));
		}
	}
};

YYIMCacheRecentManager.prototype.setItem = function(key,value){
	if(!!key && !!value){
		try{
			window.localStorage.setItem(key,value);
		}catch(e){
			YYIMChat.log('浏览器不支持localStroage',0);
		}
	}
};

YYIMCacheRecentManager.prototype.getItem = function(key){
	if(!!key){
		try{
			return window.localStorage.getItem(key);
		}catch(e){
			YYIMChat.log('浏览器不支持localStroage',0);
		}
	}
};

/**
 * 分类获取最近联系人列表
 * @param {Object} type 'chat'/'groupchat'/'pubaccount'
 */
YYIMCacheRecentManager.prototype.getListByChatType = function(type){
	var list = [];
	for(var x in this.recentList){
		if(!!this.recentList[x].id){
			if(!type || this.recentList[x].type == type){
				list.push(this.recentList[x]);
			} 
		}
	}
	return list;
};

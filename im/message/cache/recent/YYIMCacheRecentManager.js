function YYIMCacheRecentManager(){
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
		this.id = YYIMChat.getUserID();
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
		if(!!recent){
			recent.build(arg);
			
			if(arg.sort){
				if(this.recentList.indexOf(recent)>-1){
					if(this.recentList.indexOf(recent)!=0){
						this.recentList.splice(this.recentList.indexOf(recent),1);
						this.recentList.unshift(recent);
					}
				}
			}
		}else{
			recent = new YYIMCacheRecent(arg);
			this.set(recent.id,recent);	
			this.recentList.unshift(recent);
		}
		
		this.save();
		
		return recent;
	}
};

YYIMCacheRecentManager.prototype.remove = function(key){
	if(!!key){
		var recent = this.get(key);
		if(!!recent){
			delete this.list[key];
			this.recentList.splice(this.recentList.indexOf(recent),1);
			this.save();
		}
	}
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
					contentType: this.recentList[x].contentType
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

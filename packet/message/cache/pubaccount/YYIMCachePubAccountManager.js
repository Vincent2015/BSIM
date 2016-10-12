function YYIMCachePubAccountManager(){
	
}

YYIMCachePubAccountManager.prototype = new YYIMCacheList();

YYIMCachePubAccountManager.getInstance = function(){
	if(!this._instance){
		this._instance = new YYIMCachePubAccountManager();
	}
	return this._instance;
};

/**
 * 更新公众号
 * @param {Object} arg {
 * 	 id:,name:,type:,photo
 * }
 */
YYIMCachePubAccountManager.prototype.updateCache = function(arg){
	if(!!arg && arg.id){
		var pubaccount = this.get(arg.id);
		if(!!pubaccount){
			pubaccount.build(arg);
		}else{
			pubaccount = new YYIMCachePubAccount(arg);
			this.set(pubaccount.id,pubaccount);	
		}
		return pubaccount;
	}
};

/**
 * 查找广播号/订阅号
 * @param arg {
 * keyword, 
 * success: function, 
 * error: function,
 * complete: function
 * }
 */
YYIMCachePubAccountManager.prototype.queryPubaccount = function(arg){
	YYIMChat.queryPubaccount(arg);
};

/**
 * 关注订阅号
 * @param {Object} arg {
 * 	id,
 *  success:function,
 *  error:function
 * }
 */
YYIMCachePubAccountManager.prototype.addPubaccount = function(arg){
	if(!!arg && arg.id){
		var pubaccount = this.get(arg.id); 
		if(!pubaccount){
			YYIMChat.addPubaccount(arg);
		}
	}
};

/**
 * 取消公众订阅号
 * @param {Object} arg {
 * 	id,
 *  success:function,
 *  error:function
 * }
 */
YYIMCachePubAccountManager.prototype.removePubaccount = function(arg){
	if(!!arg && arg.id){
		var pubaccount = this.get(arg.id); 
		if(!!pubaccount){
			var that = this;
			YYIMChat.removePubaccount({
				id:arg.id,
				success:function(data){
					that.remove(data.from);					
					arg.success && arg.success(data);
				},
				error:function(){
					arg.error && arg.error();
				},
				complete:function(){
					arg.complete && arg.complete();
				}
			});
		}
	}
};

/**
 * 获取公众号(订阅号，广播号)列表
 * @param {Object} 
 * key 空：全部列表，broadcase：广播号，subscribe：订阅号
 */
YYIMCachePubAccountManager.prototype.getPubaccountList = function(key){
    var list = this.get();
	var tempList = [];
	for(var x in list){
		if(typeof key === 'undefined'){
			tempList.push(list[x]);
			continue;
		}
		if(list[x].pubaccountType === key){
			tempList.push(list[x]);
	    }
	}
	return tempList;
};

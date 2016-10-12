function YYIMCacheList(){
	this.list = {};
}

YYIMCacheList.prototype.set = function(key,val){
	if(key && val){
		this.list[key] = val;
	}
};

YYIMCacheList.prototype.get = function(key){
	if(key){
		return this.list[key];
	}
	return this.list;
};

YYIMCacheList.prototype.remove = function(key){
	if(key){
		delete this.list[key];
	}
};

YYIMCacheList.prototype.update = function(key,val){
	this.set.apply(this,arguments);
};

YYIMCacheList.prototype.clear = function(){
	this.list = {};
};

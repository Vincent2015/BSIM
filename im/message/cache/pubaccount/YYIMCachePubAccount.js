function YYIMCachePubAccount(arg){
	this.build(arg);
}

YYIMCachePubAccount.prototype.init = function(){
	this.syncInfo();
	this.getPubaccountType();
};

YYIMCachePubAccount.prototype.build = function(arg){
	this.id = arg.id || this.id;
	this.name = arg.name || this.name;
	this.type = arg.type || this.type || YYIMCacheConfig.PUBACCOUNT_TYPE.BROADCASE.TYPE;
	this.photo = arg.photo || this.photo;
	
	this.init();
};

YYIMCachePubAccount.prototype.syncInfo = function(){
    if(!this.photo){
		this.photo = YYIMCacheConfig.DEFAULT_PHOTO.PUBACCOUNT;
	}
};

YYIMCachePubAccount.prototype.getPhotoUrl = function(){
	return YYIMChat.getFileUrl(this.photo);
};

YYIMCachePubAccount.prototype.getPubaccountType = function(){
	if(!this.pubaccountType){
		switch(this.type){
			case YYIMCacheConfig.PUBACCOUNT_TYPE.BROADCASE.TYPE:
				this.pubaccountType = YYIMCacheConfig.PUBACCOUNT_TYPE.BROADCASE.NAME;
				break;
			case YYIMCacheConfig.PUBACCOUNT_TYPE.SUBSCRIBED.TYPE:;	
			case YYIMCacheConfig.PUBACCOUNT_TYPE.SUBSCRIBE.TYPE:
				this.pubaccountType = YYIMCacheConfig.PUBACCOUNT_TYPE.SUBSCRIBE.NAME;
				break;
			default:break;
		}
	}
	return this.pubaccountType;
};



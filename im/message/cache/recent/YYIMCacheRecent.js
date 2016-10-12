function YYIMCacheRecent(arg){
	this.build(arg);
}

YYIMCacheRecent.prototype.build = function(arg){
	this.id = arg.id || this.id;
	this.name =  arg.name || this.name || this.id;
	this.dateline = arg.dateline || this.dateline;
	this.type = arg.type || this.type;
	this.latestState  = arg.latestState || this.latestState;
	this.contentType = arg.contentType || this.contentType;
	
	this.syncInfo();
};

YYIMCacheRecent.prototype.syncInfo = function(){
	if(this.id){
		for(var x in BusinessConfig['TYPEPREFIX']){
			if(this.id.toString().indexOf(x) > -1){
				this.businessType = {key:x,value:BusinessConfig['TYPEPREFIX'][x]};
				break;
			}
		}
	}
	
	if(this.id && !this.from){
		switch(this.type){
			case YYIMCacheConfig.CHAT_TYPE.CHAT: this.from = YYIMCacheRosterManager.getInstance().updateCache({id:this.id});break;
			case YYIMCacheConfig.CHAT_TYPE.GROUP_CHAT: this.from = YYIMCacheGroupManager.getInstance().get(this.id);break;
			case YYIMCacheConfig.CHAT_TYPE.PUB_ACCOUNT: this.from = YYIMCachePubAccountManager.getInstance().get(this.id);break;
			default:break;
		}
	}
	
	if(!!this.from && this.from.name !== this.from.id){
		this.name = this.from.name;
	}
	
	if(!!this.latestState){
		switch(this.contentType){
			case YYIMCacheConfig.MESSAGE_CONTENT_TYPE.FILE: this.latestState = '[文件]'; break;
			case YYIMCacheConfig.MESSAGE_CONTENT_TYPE.IMAGE: this.latestState = '[图片]'; break;
			case YYIMCacheConfig.MESSAGE_CONTENT_TYPE.SYSTEM: this.latestState = '[单图文]'; break;
			case YYIMCacheConfig.MESSAGE_CONTENT_TYPE.PUBLIC: this.latestState = '[多图文]'; break;
			case YYIMCacheConfig.MESSAGE_CONTENT_TYPE.AUDO: this.latestState = '[音频]'; break;
			case YYIMCacheConfig.MESSAGE_CONTENT_TYPE.LOCATION: this.latestState = '[位置]'; break;
			case YYIMCacheConfig.MESSAGE_CONTENT_TYPE.SHARE: this.latestState = '[分享]'; break;
			case YYIMCacheConfig.MESSAGE_CONTENT_TYPE.WHITEBOARD: this.latestState = '[白板]'; break;
			default: this.latestState = this.latestState.messageText || this.latestState; break;
		}
	}
	
};

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
	this.stick = (arg.stick === true || arg.stick === false)? arg.stick: !!this.stick;
	this.isHaveAt = (arg.isHaveAt === true || arg.isHaveAt === false)? arg.isHaveAt: !!this.isHaveAt; 
	
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
			case YYIMCacheConfig.MESSAGE_CONTENT_TYPE.FILE: this.showState = '[文件]'; break;
			case YYIMCacheConfig.MESSAGE_CONTENT_TYPE.IMAGE: this.showState = '[图片]'; break;
			case YYIMCacheConfig.MESSAGE_CONTENT_TYPE.SYSTEM: this.showState = '[单图文]'; break;
			case YYIMCacheConfig.MESSAGE_CONTENT_TYPE.PUBLIC: this.showState = '[多图文]'; break;
			case YYIMCacheConfig.MESSAGE_CONTENT_TYPE.AUDO: this.showState = '[音频]'; break;
			case YYIMCacheConfig.MESSAGE_CONTENT_TYPE.LOCATION: this.showState = '[位置]'; break;
			case YYIMCacheConfig.MESSAGE_CONTENT_TYPE.SHARE: this.showState = '[分享]'; break;
			case YYIMCacheConfig.MESSAGE_CONTENT_TYPE.WHITEBOARD: this.showState = '[白板]'; break;
			default: 
				if(!!this.latestState){
					this.showState = null;
					if(typeof this.latestState != 'string'){
						if(!!this.latestState.atContent){
							this.showState = this.latestState.atContent;
						}
						this.latestState = this.latestState.content;
						this.showState = this.showState || this.latestState;
						break;
				    }
					this.showState = this.latestState;
				}
		}
	}
	
};

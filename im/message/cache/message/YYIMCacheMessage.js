function YYIMCacheMessage(arg){
	this.build(arg);
}

YYIMCacheMessage.prototype.init = function(){
	this.syncInfo();
};

YYIMCacheMessage.prototype.build = function(arg){
	this.id = arg.msgId || arg.packetId || arg.id || this.id;
	this.type = arg.type || arg.chatType || this.type || YYIMCacheConfig.CHAT_TYPE.CHAT;
	this.data = arg.body || arg.data || this.data;
	this.resource = arg.resource || this.resource;
	this.readed = !!arg.readed || this.readed || false; //本人是否已读
	this.received = !!this.received || false; //是否本人收到的消息
	this.dateline = arg.dateline || this.data.dateline; 
	
	if(!this.received && this.sendState !== YYIMCacheConfig.SEND_STATE.READED && this.type === YYIMCacheConfig.CHAT_TYPE.CHAT){
		this.sendState = arg.sendState || this.sendState || YYIMCacheConfig.SEND_STATE.NONE;
	}

	if(!this.from){
		this.fromId = arg.from || arg.fromId;
	}
	
	if(!this.to){
		this.toId = arg.to || arg.toId;
	}
	
	this.init();
};

/**
 * 获取历史记录
 */
YYIMCacheMessage.prototype.syncInfo = function(){
	this.data.dateline = this.dateline;
	
	var fromManager,toManager,fromRosterManager;

	fromRosterManager = toManager = fromManager = YYIMCacheRosterManager.getInstance();
	
	if(this.toId === YYIMChat.getUserID()){ //收到的
		this.received = true;
	}

	if(this.type === YYIMCacheConfig.CHAT_TYPE.PUB_ACCOUNT){
		if(this.received){
			fromManager = YYIMCachePubAccountManager.getInstance();
		}else{
			toManager = YYIMCachePubAccountManager.getInstance();
		}
	}else if(this.type === YYIMCacheConfig.CHAT_TYPE.GROUP_CHAT){
		if(this.received){
			fromManager = YYIMCacheGroupManager.getInstance();
		}else{
			toManager = YYIMCacheGroupManager.getInstance();
		}
		
		if(!!this.fromId){
			this.fromRosterId = this.fromId.roster;
			var room = this.fromId.room;
			this.fromId = room;
			
			if(this.fromRosterId === YYIMChat.getUserID()){
				this.received = false;
			}
		}
		
		if(!!this.fromRoster && this.fromRoster.id === YYIMChat.getUserID()){
			this.received = false;
		}
		
	} 
	
	if(!!this.fromId){
		var from = (this.type === YYIMCacheConfig.CHAT_TYPE.CHAT )? fromManager.updateCache({id:this.fromId}): fromManager.get(this.fromId);
		if(from){
			this.from = from;
			delete this.fromId;
		}
	}
	
	if(!!this.toId){
		var to = (this.type === YYIMCacheConfig.CHAT_TYPE.CHAT )? toManager.updateCache({id:this.toId}): toManager.get(this.toId);
		if(to){
			this.to = to;
			delete this.toId;
		}
	}
	
	if(!!this.fromRosterId){
		var fromRoster = fromRosterManager.updateCache({id:this.fromRosterId});
		if(fromRoster){
			this.fromRoster = fromRoster;
			delete this.fromRosterId;
		}
	}
	
	this.opposite = this.fromId || this.from.id;
	var temp = this.toId || this.to.id;
	
	if(YYIMChat.getUserID() !== temp){
		this.opposite = temp;
	}
	
	this.getTemplateCode();
	this.analysisBusiness();
};

/**
 * 获取模板编码 
 */
YYIMCacheMessage.prototype.getTemplateCode = function(){
	if(!this.templateCode && this.data){
		this.templateCode = this.data.contentType;
	}
};

/**
 * 扩展业务
 */
YYIMCacheMessage.prototype.analysisBusiness = function(){
	if(!!this.data && !this.business){
		if(YYIMCacheConfig.BUSINESS.indexOf(this.data.extend) > -1){
				this.business = true;
				try{
					this.data.content = JSON.parse(this.data.content);
				}catch(e){	
				}
				this.data.content.businessType = BusinessConfig['TYPE'][this.data.content.businessType || ''] || this.data.content.businessType;
		}
	}
};


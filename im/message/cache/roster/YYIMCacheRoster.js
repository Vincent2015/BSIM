function YYIMCacheRoster(arg){
	this.build(arg);
}

/**
 * 构建roster
 * @param {Object} arg
 */
YYIMCacheRoster.prototype.build = function(arg){
	this.id = arg.id || this.id;
	this.name = arg.name || arg.nickname || this.name;
	this.ask = arg.ask || this.ask;
	this.recv = arg.recv || this.recv;
	this.resource = arg.resource || this.resource;
	this.subscription = arg.subscription || this.subscription;
	this.group = arg.group || this.group;
	this.photo = arg.photo || this.photo;
	
	this.init();
};

/**
 * 初始化roster
 */
YYIMCacheRoster.prototype.init = function(){
	this.initVCard();
	this.getRosterType();
	this.syncInfo();
	this.updatePresence();
};

/**
 * 为自己设置上线presence，和改变其他联系人presence
 * @param {Object} arg
 */
YYIMCacheRoster.prototype.updatePresence = function(arg){
	arg = arg || {};
	
	arg.id = this.id;
	arg.resource = arg.resource || this.resource;
	arg.show = arg.show || YYIMCacheConfig.PRESENCE_SHOW.UNAVAILABLE;
	
	if(!this.presence){
		this.presence = new YYIMCachePresence(arg);
	}else{
		this.presence.build(arg);
	}
};

/**
 * 获得联系人的在线状态
 * @param {Object} terminalType
 */
YYIMCacheRoster.prototype.getPresence = function(terminalType){
	var presenceTemp = this.presence['presence'][terminalType || YYIMCacheConfig.TERMINAL_TYPE.WEB];
	if(presenceTemp){
		return presenceTemp['show'];
	}
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
YYIMCacheRoster.prototype.setVCard = function(arg){
	if(this.rosterType === YYIMCacheConfig.ROSTER_TYPE.MYSELF){
		if(arg.vcard){
			var that = this;
			YYIMChat.setVCard({
				vcard:arg.vcard,
				success:function(){
					that.vcard.build(arg.vcard);
					that.syncInfo();
					arg.success && arg.success();	
				},
				error:function(){
					arg.error && arg.error();	
				}
			});
		}
	}
};

/**
 * 修改好友备注
 * @param {Object} 
 * arg {
 * 	roster:{
 * 		name:String,//新的备注姓名
 * 		group:[] //新的分组(数组)
 *  },
 *  success:function,
 *  error:function 
 * }
 */
YYIMCacheRoster.prototype.setRemark = function(arg){
	if(this.rosterType === YYIMCacheConfig.ROSTER_TYPE.FRIEND){
		if(arg && arg.roster && (arg.roster.name !== this.name || arg.roster.group !== this.group)){
			var that = this;
			YYIMChat.updateRosterItem({
				roster:{
					id:this.id,
					name:arg.roster.name,
					groups:arg.roster.group
				},
				suceess:function(){
					that.build({
						name:arg.roster.name,
						group:arg.roster.group
					});
					arg.success && arg.success();	
				},
				error:function(){
					arg.error && arg.error();	
				}
			});
		}
	}
};

/**
 * 初始化vcard
 */
YYIMCacheRoster.prototype.initVCard = function(){
	var that = this;
	if(!this.vcard && this.id){
		
		this.vcard = new YYIMCacheVCard({
			id:this.id,
			name:this.name || this.id,
			photo:this.photo
		});
		
		if(!!YYIMCacheConfig.REST_SERVLET && !YYIMCacheConfig.REST_SERVLET.VCARD){
			YYIMChat.getVCard({ //默认的拿取 vcard 信息
				id: this.id,
				success :function(data){
					that.vcard.build(data);
					that.syncInfo();
				}
			});
		}else{
			jQuery.ajax({   //扩展的获取接口
				url: YYIMCacheConfig.SERVICE_ADDRESS + YYIMCacheConfig.REST_SERVLET.VCARD + this.id,
				type:'get',
				dataType:'json',
				cache:false,
				async:false,
				headers:{
					'Authorization':YYIMUtil['cookie']['get']('authToken')
				},
				success:function(data){
					if(!!data && !!data.success && !!data.data){
						data.data.id = that.id;
						that.vcard.build(data.data);
						that.syncInfo();
					}
				}
			});
		}
		
	}
};

/**
 * 信息同步
 */
YYIMCacheRoster.prototype.syncInfo = function(){
	if((!this.name || this.name == this.id || this.rosterType === YYIMCacheConfig.ROSTER_TYPE.MYSELF) && this.vcard && this.vcard.name){
    	this.name = this.vcard.name;
    }
	
    if(this.vcard && this.vcard.photo){
    	this.photo = this.vcard.photo;
    }
    
    if(!this.resource){
    	this.resource = YYIMChat.getUserResource();
    }
    
    if(!this.photo){
		this.photo = YYIMCacheConfig.DEFAULT_PHOTO.ROSTER;
	}
};

/**
 * 获取头像地址
 */
YYIMCacheRoster.prototype.getPhotoUrl = function(){
	return YYIMChat.getFileUrl(this.photo);
};

/**
 * 判断roster的类型
 */
YYIMCacheRoster.prototype.getRosterType = function(){
	if(this.id ===  YYIMChat.getUserID()){
		this.rosterType = YYIMCacheConfig.ROSTER_TYPE.MYSELF;

	}else if(this.subscription === YYIMCacheConfig.ROSTER_SUBSCRIPTION_TYPE.BOTH){
		this.rosterType = YYIMCacheConfig.ROSTER_TYPE.FRIEND;
		
	}else if(this.subscription === YYIMCacheConfig.ROSTER_SUBSCRIPTION_TYPE.NONE && this.ask === 1){
		this.rosterType = YYIMCacheConfig.ROSTER_TYPE.ASK;
		
	}else if(this.subscription === YYIMCacheConfig.ROSTER_SUBSCRIPTION_TYPE.NONE && this.recv === 1){
		this.rosterType = YYIMCacheConfig.ROSTER_TYPE.RECV;
		
	}else{
		this.rosterType = YYIMCacheConfig.ROSTER_TYPE.NONE;
	}
	return this.rosterType;
};

var YYIMCacheConfig = {
	/**
	 * 业务系统配置 
	 * rongqb 20160412
	 */
	SERVICE_ADDRESS:'',
	BUSINESS:['business.worktime.yonyou','im.yyuap.com'],
	REST_SERVLET:{
//		VCARD:'service/member/interex/', //自定义的获取联系人 vcard 接口
//		SEARCH:'service/member/inters/param/',
//		DEPARTMENT:'service/organization/getsub/',
//		DEPARTPERSON:'service/member/org/',
//		COMPANY:'service/organization/corporation/',
//		SERVICEPROJECT:'service/project/',
//		SERVICEGROUP:'service/group/'
	},
	/**
	 * IM 系统通用配置 
	 * rongqb 20160412
	 */
	PRE_HISTORY_LENGTH:10,
	CHAT_TYPE : {
		CHAT: 'chat',
		GROUP_CHAT: 'groupchat',
		PUB_ACCOUNT: 'pubaccount'
	},
	SEND_STATE:{
		NONE:'none',
		UNREADED:'unreaded',
		READED:'readed'
	},	
	ROSTER_TYPE:{
		MYSELF:'myself',
		FRIEND:'friend',
		ASK:'ask',
		RECV:'recv',
		NONE:'none'
	},
	ROSTER_SUBSCRIPTION_TYPE:{
		BOTH:'both',
		NONE:'none'
	},
	PUBACCOUNT_TYPE:{
		SUBSCRIBED:{
			TYPE: 1,
			NAME: 'subscribed' //同意订阅
		},		
		SUBSCRIBE:{
			TYPE: 1,
			NAME: 'subscribe' //订阅号
		},
		BROADCASE:{
			TYPE: 2,
			NAME: 'broadcase' //广播号
		}
	},
	MESSAGE_CONTENT_TYPE:{
		MIXED : 'mixed',
		SIMPLE : 'simple',
		TEXT : 2,
		FILE : 4,
		IMAGE : 8,
		SYSTEM : 16,
		PUBLIC : 32,
		AUDO : 64,
		LOCATION : 128,
		SHARE : 256,
		WHITEBOARD : 1024
	},
	DEFAULT_PHOTO:{
		DEFAULT:'',
		ROSTER:'',
		GROUP:'',
		GROUPMEMEBER:'',
		PUBACCOUNT:''
	},
	PRESENCE_SHOW:{
		CHAT : "chat",
		AWAY : "away",
		XA : "xa",
		DND : "dnd",
		UNAVAILABLE : "unavailable"
	},
	TERMINAL_TYPE:{
		WEB:'web',
		ANDROID:'android',
		IOS:'ios',
		PC:'pc'
	},
	MESSAGE_READ_TYPE:{
		READED:'readed',
		UNREADED:'unreaded',
		ALL:'all'
	}
};


var BusinessConfig = {
	TYPE:{
		'approval': '审批',
		'agenda':'日程',
		'project': '项目',
		'task': '任务',
		'conference': '会议'
	},
	TYPEPREFIX:{
		'_approval_': '审批',
		'_agenda_':'日程',
		'_project_': '项目',
		'_task_': '任务',
		'_conference_': '会议'
	}
};


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

function YYIMCacheGroup(arg){
	this.build(arg);
}

YYIMCacheGroup.prototype = new YYIMCacheList();

YYIMCacheGroup.prototype.init = function(){
	this.syncInfo();
	this.updateMemberList();
};

YYIMCacheGroup.prototype.build = function(arg){
	this.id = arg.id || this.id;
	this.name = arg.name || this.name;
	this.numberOfMembers = arg.numberOfMembers || this.numberOfMembers;
	this.superLarge = arg.superLarge || this.superLarge;
	this.collected = arg.collected > 0 ? arg.collected:0;
	this.creater = arg.creater || this.creater;
	this.photo = arg.photo || this.photo;
	this.members = arg.members || this.members;
	
	this.init();
};

YYIMCacheGroup.prototype.syncInfo = function(){
    if(!this.photo){
		this.photo = YYIMCacheConfig.DEFAULT_PHOTO.GROUP;
	}
};

YYIMCacheGroup.prototype.getPhotoUrl = function(){
	return YYIMChat.getFileUrl(this.photo);
};

YYIMCacheGroup.prototype.updateMemberList = function(){
	if(this.members instanceof Array && this.members.length){
		this.clear();
		
		var temp = [];
		for(var i = 0;i < this.members.length;i++){
			var member = this.get(this.members[i].id);
			if(!member){
				member = new YYIMCacheGroupMember(this.members[i]);
				this.set(member.id,member);
			}else{
				try{
					member.build(this.members[i]);
				}catch(e){
					console.error(member,this.members[i]);
				}
			}
			
			temp.push(member);
			
			if(member.affiliation === 'owner'){
				this.owner = member;
			}
		}
		this.numberOfMembers = this.members.length;
		this.members = temp;
	}
};

YYIMCacheGroup.prototype.removeMember = function(key){
	var member = this.get(key);
	if(!!member){
		this.remove(key);
		var t = this.numberOfMembers - 1;
		this.numberOfMembers = t >= 0? t:0;
	}
};

YYIMCacheGroup.prototype.transferOwner = function(key){
	var newOwner = this.get(key);
	if(newOwner){
		this.owner.affiliation = 'member';
		this.owner = newOwner;
		this.owner.affiliation = 'owner';
	}
};

function YYIMCacheGroupManager(){
}

YYIMCacheGroupManager.prototype = new YYIMCacheList();

YYIMCacheGroupManager.getInstance = function(){
	if(!this._instance){
		this._instance = new YYIMCacheGroupManager();
	}
	return this._instance;
};

/**
 * 更新群组缓存
 * @param {Object} 
 * arg {
 * 	id,name,numberOfMembers,superLarge,collected,creater,members,photo
 * }
 */
YYIMCacheGroupManager.prototype.updateCache = function(arg){
	if(!!arg && arg.id){
		var group = this.get(arg.id);
		if(!!group){
			group.build(arg);
		}else{
			group = new YYIMCacheGroup(arg);
			this.set(group.id,group);	
		}
		return group;
	}
};

/**
 * 创建群组
 * @param arg {name:,members:[],success:function,complete:function}
 */
YYIMCacheGroupManager.prototype.createChatGroup = function(arg){
	var that = this;
	YYIMChat.createChatGroup({
		name:arg.name,
		members:arg.members || [],
		success:function(data){
			that.updateCache(data);
			arg.success && arg.success(data);
		},
		complete:function(){
			arg.complete && arg.complete();
		}
	});
};

/**
 * 转让群主
 * @param {Object} arg 
 * {to:群组,newOwner:string,success:function,error:function,complete:function}
 */
YYIMCacheGroupManager.prototype.transferChatGroup = function(arg){
	var group = this.get(arg.to);
	if(group.owner && group.owner.id === YYIMChat.getUserID()){
		var newOwner = group.get(arg.newOwner);
		if(newOwner){
			var that = this;
			YYIMChat.transferChatGroup({
				to:	arg.to || arg.id,
				newOwner: arg.newOwner,
				success: function(data){
					that.transferOwner(arg.to,arg.newOwner);
					arg.success && arg.success(data);
				},
				complete:function(){
					arg.complete && arg.complete();
				}
			});
		}
	}
};

/**
 * 转换群组
 * @param {Object} arg
 * {to:群组,newOwner:string}
 */
YYIMCacheGroupManager.prototype.transferOwner = function(arg){
	if(arg.to){
		var group = this.get(arg.to);
		if(group && arg.newOwner){
			group.transferOwner(arg.newOwner); 
		}
	}
};

/**
 * 邀请群成员
 * @param {Object} arg 
 * {to:群组,members:[],success:function,error:function,complete:function}
 */
YYIMCacheGroupManager.prototype.inviteGroupMember = function(arg){
	var that = this;
	YYIMChat.inviteGroupMember({
		to:arg.to || arg.id,
		members:arg.members || [],
		success:function(data){
			that.updateCache(data);
			arg.success && arg.success(data);
		},
		complete:function(){
			arg.complete && arg.complete();
		}
	});
};

/**
 * 更改群名称
 * @param {Object} arg 
 * {to:群组,name:string, success: function,complete: function}
 */
YYIMCacheGroupManager.prototype.modifyChatGroupInfo = function(arg){
	if(this.get(arg.to).owner.id === YYIMChat.getUserID()){
		var that = this;
		YYIMChat.modifyChatGroupInfo({
			to:arg.to || arg.id,
			name:arg.name,
			success:function(data){
				that.updateCache(data);
				arg.success && arg.success(data);
			},
			complete:function(){
				arg.complete && arg.complete();
			}
		});
	}
};

/**
 * 被群组踢出
 * @param {Object} arg
 */
YYIMCacheGroupManager.prototype.KickedOutByGroup = function(arg){
	if(arg.to === YYIMChat.getUserID()){
		this.remove(arg.from);
	}
};

/**
 * 退出群组
 * {to:群组,success: function,complete: function}
 */
YYIMCacheGroupManager.prototype.exitChatGroup = function(arg){
	var that = this;
	YYIMChat.exitChatGroup({
		to:arg.to,
		success:function(data){
			that.remove(data.from);
		},
		complete:function(){
			arg.complete && arg.complete();
		}
	});
};

/**
 * 收藏群组
 * @param {Object} arg
 *  {to:群组id, success: function, error: function,complete: function}
 */
YYIMCacheGroupManager.prototype.collectGroup = function(arg){
	var that = this;
	YYIMChat.collectGroup({
		to:arg.to,
		success:function(data){
			that.updateCache({id:data.from,collected:1});
		},
		complete:function(){
			arg.complete && arg.complete();
		}
	});
};

/**
 * 取消收藏群组
 * @param {Object} arg
 *  {to:群组id, success: function, error: function,complete: function}
 */
YYIMCacheGroupManager.prototype.removeCollectGroup = function(arg){
	var that = this;
	YYIMChat.removeCollectGroup({
		to:arg.to,
		success:function(data){
			that.updateCache({id:data.from,collected:0});
		},
		complete:function(){
			arg.complete && arg.complete();
		}
	});
};




function YYIMCacheGroupMember(arg){
	this.build(arg);
}

YYIMCacheGroupMember.prototype.build = function(arg){
	this.id = arg.id || this.id;
	this.name = arg.name || this.name || this.id;
	this.photo = arg.photo || this.photo;
	this.affiliation = arg.affiliation || this.affiliation;
	this.role = arg.role || this.role;
	
	this.init();
};

YYIMCacheGroupMember.prototype.init = function(){
	this.syncInfo();
};

YYIMCacheGroupMember.prototype.syncInfo = function(){
    if(!this.photo){
		this.photo =  YYIMCacheConfig.DEFAULT_PHOTO.GROUPMEMEBER;
	}
};

YYIMCacheGroupMember.prototype.getPhotoUrl = function(){
	return YYIMChat.getFileUrl(this.photo);
};

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
	this.analysisAtmsg();
};

/**
 * 获取模板编码 
 */
YYIMCacheMessage.prototype.getTemplateCode = function(){
	if(!this.templateCode && this.data){
		this.templateCode = this.data.contentType;
	}
};

YYIMCacheMessage.prototype.analysisAtmsg = function(){
	if(this.type == YYIMCacheConfig.CHAT_TYPE.GROUP_CHAT 
		&& !!this.data 
		&& this.data.contentType == YYIMCacheConfig.MESSAGE_CONTENT_TYPE.TEXT 
		&& typeof this.data.content === 'string'){
			
		if(this.data.atuser instanceof Array && !!this.data.receipt){
			if(this.data.atuser.indexOf(YYIMChat.getUserID()) > -1){
				this.data.isHaveAt = true;
			}
		}
	}
};


function YYIMCacheMessageManager(){
	this.messList = {};	
	this.atUserList = [];
}

YYIMCacheMessageManager.prototype = new YYIMCacheList();

YYIMCacheMessageManager.getInstance = function(){
	if(!this._instance){
		this._instance = new YYIMCacheMessageManager();
	}
	return this._instance;
};

/**
 * 跟新消息缓存
 * @param {Object} arg
 */
YYIMCacheMessageManager.prototype.updateCache = function(arg){
	if(!arg) return;

	var id = arg.msgId || arg.packetId || arg.id;
	
	if(id){
		var message = this.get(id),
		isNew = false;
		if(!!message){
			message.build(arg);
		}else{
			message = new YYIMCacheMessage(arg);
			if(!message.data) return;			
			this.set(id,message);
			isNew = true;
		}	
		
		try{
			var uid = message.fromId || message.from.id;
			var to = message.toId || message.to.id;
		}catch(e){
			return;
		}
		
		if(YYIMChat.getUserID() !== to){
			uid = to;
		}
		
		
		if(uid){
			if(!this.messList[uid]){
				this.messList[uid] = {};
				this.messList[uid]['readed'] = [];
				this.messList[uid]['unreaded'] = [];
				this.messList[uid]['all'] = [];
			}
			
			this.unReadedNum = this.unReadedNum || 0;
			this.readedNum = this.readedNum || 0;
			
			if(isNew){
				this.messList[uid]['all'].push(message);
				
				if(message.readed){
					this.readedNum++;
				}else{
					this.unReadedNum++;
				}
			}
			
			this.messList[uid]['readed'].length = 0;
			this.messList[uid]['unreaded'].length = 0;
			
			for(var x in this.messList[uid]['all']){
				var mess = this.messList[uid]['all'][x];
				if(!!mess && mess.readed === true){
					this.messList[uid]['readed'].push(mess);
				}else if(!!mess && mess.readed === false){
					this.messList[uid]['unreaded'].push(mess);
				}
			}
			
			this.messList[uid]['readed'] = this.messList[uid]['readed'].sort(YYIMUtil['array']['comparisonAsc']('dateline'));
			this.messList[uid]['unreaded'] = this.messList[uid]['unreaded'].sort(YYIMUtil['array']['comparisonAsc']('dateline'));
			this.messList[uid]['all'] = this.messList[uid]['all'].sort(YYIMUtil['array']['comparisonAsc']('dateline'));
		}
		
//		this.listen();
		
		return message;
	}
};

/**
 * 获取历史消息
 * @param {Object} arg {
 * id: //对话人id
 * chatType: "groupchat/chat/pubaccount",  //chat:单聊，groupcgat:群聊,pubaccount:公众号
 * contentType:int, //代表希望拿到的消息类型，不填则为全部消息类型 
 * start: number,   //消息列表的分页参数，起始值，默认0,
 * num: number   //消息列表的分页参数，分页参数，默认100
 * }
 */
YYIMCacheMessageManager.prototype.getHistoryMessage = function(arg){
	var user = arg.id || arg.to;
	if(!user) return;
	
	var that = this;
	
	that.history = that.history || {};
	that.history[user] = that.history[user] || {};
	
	that.history[user]['start'] = that.history[user]['start'] || 0;
	that.history[user]['present'] = arg.present || that.history[user]['present'] || 0;
	
	if(that.history[user]['isEnd']){
		arg.success && arg.success({
			count: 0,
			isEnd: true
		});
		return;
	}
	
	YYIMChat.getHistoryMessage({
		id: user,
		chatType: arg.chatType || arg.type || YYIMCacheConfig.CHAT_TYPE.CHAT,
		contentType: arg.contentType,
		start: that.history[user]['start'] || 0,
		num: YYIMCacheConfig.PRE_HISTORY_LENGTH,
		success:function(data){
			var isEnd = data.result.length <= (YYIMCacheConfig.PRE_HISTORY_LENGTH - that.history[user]['present']) && data.result.length < YYIMCacheConfig.PRE_HISTORY_LENGTH; //没有历史记录了
			var isFull = false;
			var lastestMessage = null;
			
			for(var x in data.result){
				var result = data.result[x];
				var msgId = result.msgId || result.packetId || result.id;
				var message = that.get(msgId);
				
				if(!message){
					result.readed = true;
					lastestMessage = that.updateCache(result);
					that.history[user]['present'] += 1;
				}
				
				that.history[user]['start'] += 1;
				
				if(that.history[user]['present'] >= YYIMCacheConfig.PRE_HISTORY_LENGTH){
					isFull = true; //本次拉取固定条数完成
					break;
				}
				
				if(!!lastestMessage){
					var list = that.messList[user]['readed'];
					var lastestTime = 0;
					if(!!list && list.length){
						lastestTime = list[list.length-1].dateline;
					}
					
					if(lastestMessage.dateline >= lastestTime){
						YYIMCacheRecentManager.getInstance().updateCache({
							id: user,
							dateline: lastestMessage.dateline,
							latestState: lastestMessage.data,
							contentType: lastestMessage.data.contentType,
							type: lastestMessage.type,
							sort: false
						});
					}
				}
			}
			
			if(isEnd || isFull){
				var temp = that.history[user]['present'];
				that.history[user]['present'] = 0;
				
				if(isEnd){
					that.history[user]['isEnd'] = true;
				}
				
				arg.success && arg.success({
					count:temp,
					isEnd:isEnd,
					isFull:isFull
				});
			}else{
				that.getHistoryMessage(arg);
			}
			
		},
		error:function(){
			arg.error && arg.error();
		},
		complete:function(){
			arg.complete && arg.complete();
		}
	});
};

/**
 * 获取历史消息
 */
YYIMCacheMessageManager.prototype.getOfflineMessage = function(){
	YYIMChat.getOfflineMessage();
};

/**
 * 获取消息列表
 * @param {Object}
 *  arg {
 * 	id:,//对话人id
 *  condition: // readed(已读)/unreaded(未读)/all(全部)
 * }
 *  
 */
YYIMCacheMessageManager.prototype.getMessageList = function(arg){
	try{
		return this.messList[arg.id][arg.condition || 'all'];
	}catch(e){
		return [];
	}
};

/**
 * 展示消息列表
 * @param {Object}
 *  arg {
 * 	id:,//对话人id
 *  condition: // readed(已读)/unreaded(未读)/all(全部)
 * }
 *  
 */
YYIMCacheMessageManager.prototype.showMessageList = function(arg){
	var list = this.getMessageList(arg);
	if(arg.condition === 'all'){
		for(var x in list){
			if(list[x].data && !list[x].readed){
				this.sendReceipts(list[x].data.receipt);
			}
		}
	}
	return list;
};

/**
 * 发送回执
 * @param {Object} arg {
 *  id:,
 * 	to:
 * }
 */
YYIMCacheMessageManager.prototype.sendReceipts = function(arg){
	if(!!arg && arg.id && arg.to){
		var message = this.get(arg.id);
		if(message){
			this.unReadedNum--;
			this.readedNum++;
			this.updateCache({id:arg.id,readed:true});
		}
		
		YYIMChat.sendReceiptsPacket(arg);
		YYIMChat.sendReadedReceiptsPacket(arg);
	}
};


/**
 * 发送文本消息[文本,表情]
 * @param arg {
 * to: id,  //对话人id
 * type: "groupchat/chat/pubaccount",  //chat:单聊，groupcgat:群聊,pubaccount:公众号
 * msg:text, //消息文本
 * style：{
 *    font: "16", //字体
 *    size: "30", //大小
 *    color: "#000", //颜色
 *    biu: 7 //加粗、斜体、下划线
 * }, 
 * extend: string,  //扩展字段 
 * success:function //成功回调函数
 * }
 */
YYIMCacheMessageManager.prototype.sendTextMessage = function(arg){
	var type = arg.type || YYIMCacheConfig.CHAT_TYPE.CHAT;
	var to = arg.to || arg.id;
	var that = this;
	
	var atUserId;
	if(this.atUserList.length){
		atUserId = [];
		for(var x in this.atUserList){
			atUserId.push(this.atUserList[x].id);
		}
	}
	var param = {
		to: to,
		type: type,
		msg: arg.msg,
		atuser: atUserId,
		style: arg.style,
		extend: JSON.stringify(this.atUserList),
		success:function(data){
			data.type = type;
			data.readed = true;
			data.sendState = YYIMCacheConfig.SEND_STATE.UNREADED;
			var message = that.updateCache(data);
			arg.success && arg.success(message); 
		}
	};
	
	this.atUserList.length = 0;
	YYIMChat.sendTextMessage(param);
};

/**
 * 发送分享消息[分享消息]
 * @param arg {
 * to: id, //对话人id
 * type: "groupchat/chat/pubaccount",  //chat:单聊，groupcgat:群聊,pubaccount:公众号
 * extend: string,  //扩展字段 
 * sharebody:{
 * 		shareImageUrl:string, //分享中图片的url
 * 		shareUrl:string, //分享的url
 * 		shareDesc:string, //分享的内容描述
 * 		shareTitle:string //分享的标题
 * 	},
 * success:function //成功回调函数
 * }
 */  
YYIMCacheMessageManager.prototype.sendShareMessage  = function(arg){
	var that = this;
	var type = arg.type || YYIMCacheConfig.CHAT_TYPE.CHAT;
	var to = arg.to || arg.id;
	YYIMChat.sendShareMessage({
		to: arg.to || arg.id,
		type: type,
		sharebody: arg.sharebody,
		extend: arg.extend,
		success:function(data){
			data.type = type;
			data.readed = true;
			data.sendState = YYIMCacheConfig.SEND_STATE.UNREADED;
			
			var message = that.updateCache(data);
			arg.success && arg.success(message); 
		}
	});
	
};


/**
 * 发送图片消息
 * @param arg{
 * fileInputId：, //文件域id 
 * to:jid,        //对话人id
 * type: "groupchat/chat/pubaccount",  //chat:单聊，groupcgat:群聊,pubaccount:公众号
 * success:function //成功回调函数
 * }
 */
YYIMCacheMessageManager.prototype.sendPicMessage  = function(arg){
	var that = this;
	var type = arg.type || YYIMCacheConfig.CHAT_TYPE.CHAT;
	var to = arg.to || arg.id;
	YYIMChat.sendPic({
		to:arg.to || arg.id,
		fileInputId:arg.fileInputId,
		type:type,
		success:function(data){
			data.type = type;
			data.readed = true;
			data.sendState = YYIMCacheConfig.SEND_STATE.UNREADED;
			var message = that.updateCache(data);
			arg.success && arg.success(message); 
		}
	});
};

/**
 * 发送文件消息
 * @param arg{
 * fileInputId：, //文件域id 
 * to:jid,        //对话人id
 * type: "groupchat/chat/pubaccount",  //chat:单聊，groupcgat:群聊,pubaccount:公众号
 * success:function //成功回调函数
 * }
 */
YYIMCacheMessageManager.prototype.sendFileMessage  = function(arg){
	var that = this;
	var type = arg.type || YYIMCacheConfig.CHAT_TYPE.CHAT;
	var to = arg.to || arg.id;
	YYIMChat.sendFile({
		to: arg.to || arg.id,
		fileInputId: arg.fileInputId,
		type: type,
		transform: arg.transform,
		success:function(data){
			data.type = type;
			data.readed = true;
			data.sendState = YYIMCacheConfig.SEND_STATE.UNREADED;
			
			var message = that.updateCache(data);
			arg.success && arg.success(message); 
		}
	});
};

/**
 * 发送白板消息
 * @param arg {
 * to: id,  //对话人id
 * type: "groupchat/chat/pubaccount",  //chat:单聊，groupcgat:群聊,pubaccount:公众号
 * extend: string,  //扩展字段 
 * content:{
 * 	id:, //白板id
 * }, 
 * success:function //成功回调函数
 * }
 */
YYIMCacheMessageManager.prototype.sendWhiteBoardMessage = function(arg){
	var that = this;
	var type = arg.type || YYIMCacheConfig.CHAT_TYPE.CHAT;
	var to = arg.to || arg.id;
	YYIMChat.sendWhiteBoardMessage({
		to: to,
		type: type,
		extend: arg.extend,
		content: arg.content,
		success:function(data){
			data.type = type;
			data.readed = true;
			data.sendState = YYIMCacheConfig.SEND_STATE.UNREADED;
			
			var message = that.updateCache(data);
			arg.success && arg.success(message); 
		}
	});
};


/**
 * 用于注册数据变化执行的方法
 */
YYIMCacheMessageManager.prototype.listen = function(key,fun){
	if(arguments.length){
		if(!!key && typeof fun === 'function'){
			this.listenList = this.listenList || {};
			this.listenList[key] = fun;
		}
	}else{
		if(this.listenList){
			for(var x in this.listenList){
				var listenFun = this.listenList[x];
				try{
					listenFun();
				}catch(e){
					delete this.listenList[x];
				}
			}
		}
	}
};



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

function YYIMCachePresence(arg){
	this.id = arg.id || arg.from || this.id;
	this.presence = {};
	this.build(arg);
}

/**
 * 构造roster Presence
 * @param {Object} arg {
 * 	  id,resource,show
 * }
 */
YYIMCachePresence.prototype.build = function(arg){
	if(arg.show && arg.resource){
		for(var x in YYIMCacheConfig.TERMINAL_TYPE){
			if(arg.resource.toLowerCase().indexOf(YYIMCacheConfig.TERMINAL_TYPE[x]) !== -1){
				this.presence[YYIMCacheConfig.TERMINAL_TYPE[x]] = {
					show:arg.show,
					resource:arg.resource
				};
				break;
			}
		}
	}
};

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
					if(data.enableFields){
						YYIMCacheRosterManager.getInstance().enableVCardFields = data.enableFields;
					}
					
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


function YYIMCacheVCard(arg){
	this.build(arg);
}

YYIMCacheVCard.prototype.build = function(arg){
	this.id = arg.id || arg.userId || this.id;
	this.name = arg.name || arg.nickname || this.name;
	this.nickname = this.name;
	this.photo = arg.photo || this.photo;
	this.organization = arg.organization || this.organization;
	this.mobile = arg.mobile || this.mobile;
	this.telephone = arg.telephone || this.telephone;
	this.email = arg.email || this.email;
	this.gender = arg.gender || this.gender;
	this.number = arg.number || this.number;
	this.remarks = arg.remarks || this.remarks;
	this.location = arg.location || this.location;
	this.position = arg.position || this.position;
	this.six = arg.six || this.six;
	this.office = arg.office || this.office;
	this.officePhone = arg.officePhone || this.officePhone;
	this.phoneticName = arg.phoneticName || this.phoneticName;
};

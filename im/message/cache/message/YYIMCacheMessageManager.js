function YYIMCacheMessageManager(){
	this.messList = {};	
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
			}
			
			if(isEnd || isFull){
				var temp = that.history[user]['present'];
				that.history[user]['present'] = 0;
				
				if(isEnd){
					that.history[user]['isEnd'] = true;
				}
				
				if(!!lastestMessage){
					var list = that.messList[user]['readed'];
					var lastestTime = 0;
					if(!!list && list.length){
						lastestTime = list[list.length-1].dateline;
					}
					
					if(lastestMessage.dateline > lastestTime){
						YYIMCacheRecentManager.getInstance().updateCache({
							id: user,
							dateline: lastestMessage.dateline,
							latestState: lastestMessage.data.content,
							contentType: lastestMessage.data.contentType,
							type: lastestMessage.type,
							sort: false
						});
					}
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
YYIMCacheMessageManager.prototype.sendTextMessage  = function(arg){
	var that = this;
	var type = arg.type || YYIMCacheConfig.CHAT_TYPE.CHAT;
	var to = arg.to || arg.id;
	YYIMChat.sendTextMessage({
		to: to,
		type: type,
		msg: arg.msg,
		style: arg.style,
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



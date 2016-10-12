/**
 * 处理消息的发送和接收
 */
function IMChatHandler(){
	this._historyCounter = {};
	this._historyIsOver = {};
}

IMChatHandler.getInstance = function (){
	if(!this._instance){
		this._instance = new IMChatHandler();
	}
	return this._instance;
}

/**
 * 用于处理收到的在线和离线消息
 * @param {Object} 
 * arg = {
			id: 消息id,
			type: 消息类型,
			from: 发消息的人,
			data: 消息内容
		}
 */
IMChatHandler.prototype.analysisReceiveMessage = function(arg){
	if(arg.type == constant.CHAT_TYPE.GROUP_CHAT){// 群聊时 服务反射消息给所有房客，自己也会收到发送的消息，需排除
		if(arg.from.roster == YYIMChat.getUserID()){
			return;
		}
	}
	
	var message = new IMChatMessage(arg);
	message._to = YYIMChat.getUserID();
	message._toVcard = IMChatUser.getInstance().getVCard();
	
	jQuery.when(IMChatUser.getInstance().getEntityVcard(message._from))
	.done(function(){
		message._fromVcard = IMChatUser.getInstance().getVCard(message._from);
		IMChatMessageCache.getInstance().pushUnreadedMessage(message._from,message);
	});
	
	
	if(message && message._type){
		switch(message._type){
			case  constant.CHAT_TYPE.CHAT:
				//IMChatMessageCache.getInstance().getAllMessage(message.from); 全部消息缓存
				//IMChatMessageCache.getInstance().getUnreadedMessage(message.from); 全部未读消息缓存
				
			
                console.log(message);
				  break;      //普通消息
			case  constant.CHAT_TYPE.GROUP_CHAT:
				  break;	  //群聊消息
			case  constant.CHAT_TYPE.DEVICE:
				  break;      //设备消息
			case  constant.CHAT_TYPE.PUB_ACCOUNT:
				  break;      //公众号消息	  
			default:YYIMChat.log("未处理消息类型", 3, arg.type);break;//漏掉的消息类型
		}
	}
}

/**
 * 登陆成功后调用
 */
IMChatHandler.prototype.init = function(){
	
	YYIMChat.getRosterItems({
		
		success:function(rosterList){
			rosterList = JSON.parse(rosterList);
			if(rosterList && rosterList.length){
				for(var x in rosterList){
					var roster = new IMChatRoster(rosterList[x]);
					IMChatUser.getInstance().push('roster',roster._id,roster);
					
					if(roster._subscription == IMChat_SUBSCRIBE.BOTH){ //存储好友关系
						IMChatUser.getInstance().push('relation','friend',roster._id);
					}else if(roster._subscription == IMChat_SUBSCRIBE.NONE){
						IMChatUser.getInstance().push('relation','stranger',roster._id);
					}
					
					if(roster._group && roster._group.length){ //存储分组关系
						for(var n in roster._group){
							IMChatUser.getInstance().push('grouprelation',roster._group[n],roster._id)
						}
					}else{
						IMChatUser.getInstance().push('grouprelation','default',roster._id)
					}
				}
			}
		},
		error:function(){
			
		},
		complete:function(){
			
			YYIMChat.getChatGroups({
				
				success:function(chatRoomList){
					chatRoomList = JSON.parse(chatRoomList);
					if(chatRoomList && chatRoomList.length){
						for(var y in chatRoomList){
							var chatroom = new IMChatRoom(chatRoomList[y]);
							IMChatUser.getInstance().push('chatroom',chatroom._id,chatroom);
						}
					}
				},
				error:function(){
					
				},
				complete:function(){
					
					YYIMChat.getPubAccount({
						success:function(pubAccountList){
							pubAccountList = JSON.parse(pubAccountList);
							if(pubAccountList && pubAccountList.length){
								for(var z in pubAccountList){
									var pubaccount = new IMChatPubAccount(pubAccountList[z]);
									IMChatUser.getInstance().push('pubaccount',pubaccount._id,pubaccount);
								}
							}
						},
						error:function(){
							
						},
						complete:function(){
							
							IMChatUser.getInstance().initVCards(); //获取联系人Vcard
							
						//获取本地存储的上次在线状态
//							var presenceStatus = IMChatUtil.getCookie('presence.status');
//							if(presenceStatus){
//								var presenceObj = JSON.parse(presenceStatus);
//								//设置当前用户默认的在线状态
//								if(YYIMChat.getUserID() == presenceObj.user && presenceObj.status) {
//									YYIMChat.setPresence({status:presenceObj.status});
//								} else {
//									YYIMChat.setPresence();
//								}
//							}else{
//								YYIMChat.setPresence();
//							}
							
							
							setTimeout(function(){
								
								
								YYIMChat.setPresence();
							},1000);
							
							//获取离线消息
							YYIMChat.getOfflineMessage();
						}
					});
				}
			});
		}
	});
}

/**
 * 发送文字信息
 * arg{
 * 		to:'yinjie', //必须
 *  	msg:'4545',
 *  	type:'chat/groupchat/pubaccount', //必须
 *  	style:{
 * 			font:'',
 *      	color:'',
 * 			size:'',
 * 			biu:''
 *  	},
 *  	success:function,
 *  	error:function
 * }
 */
IMChatHandler.prototype.sendTextMessage = function(arg){
	arg.type = arg.type?arg.type:constant.CHAT_TYPE.CHAT;
	jQuery.when(IMChatUser.getInstance().getEntityVcard(arg.to))
	.done(function(){
		YYIMChat.sendTextMessage({
			to:arg.to,
			msg:arg.msg,
			type:arg.type,
			style:arg.style,
			success:function(result){
				result.data = result.body;
				result.sendType = constant.SEND_TYPE.SEND;
				result.type = arg.type;
				result.from = YYIMChat.getUserID();
			    result.to = arg.to;
				if(arg.type == constant.CHAT_TYPE.GROUP_CHAT){
					result.from = arg.to;
					result.to = YYIMChat.getUserID();
					result.fromRoster = result.to;
				}
				var message = new IMChatMessage(result);
				message._fromVcard = IMChatUser.getInstance().getVCard(message._from);
			    message._toVcard = IMChatUser.getInstance().getVCard(message._to);
			    if(message._type == constant.CHAT_TYPE.CHAT){
			    	message._isReaded = constant.MESSAGE_READ_TYPE.UNREADED;
			    }
				IMChatMessageCache.getInstance().pushReadedMessage(arg.to,message);
				arg.success && arg.success(message);
			},
			error:function(result){
				arg.error && arg.error(result);
			}
		});
	});
}

/**
 * 发送图片
 * @param arg{fileInputId, 
 * 	to:id, //必须
 * 	type:'chat/groupchat',//必须
 *  success:function, error:function}
 */
IMChatHandler.prototype.sendPicMessage = function(arg){
	arg.type = arg.type?arg.type:constant.CHAT_TYPE.CHAT;
	jQuery.when(IMChatUser.getInstance().getEntityVcard(arg.to))
	.done(function(){
		YYIMChat.sendPic({
			to:arg.to,
			fileInputId:arg.fileInputId,
			type:arg.type,
			success:function(result){
				result.data = result.body;
				result.sendType = constant.SEND_TYPE.SEND;
				result.type = arg.type;
				result.from = YYIMChat.getUserID();
			    result.to = arg.to;
				if(arg.type == constant.CHAT_TYPE.GROUP_CHAT){
					result.from = arg.to;
					result.to = YYIMChat.getUserID();
					result.fromRoster = result.to;
				}
				var message = new IMChatMessage(result);
				message._fromVcard = IMChatUser.getInstance().getVCard(message._from);
			    message._toVcard = IMChatUser.getInstance().getVCard(message._to);
			    if(message._type == constant.CHAT_TYPE.CHAT){
			    	message._isReaded = constant.MESSAGE_READ_TYPE.UNREADED;
			    }
				IMChatMessageCache.getInstance().pushReadedMessage(arg.to,message);
				arg.success && arg.success(message);
			},
			error:function(result){
				arg.error && arg.error(result);
			}
		});
	});
}

/**
 * 发送文件
 * @param arg{fileInputId, 
 * 	to:id, //必须
 * 	type:'chat/groupchat',//必须
 *  success:function, 
 *  error:function
 * }
 */
IMChatHandler.prototype.sendFileMessage = function(arg){
	arg.type = arg.type?arg.type:constant.CHAT_TYPE.CHAT;
	jQuery.when(IMChatUser.getInstance().getEntityVcard(arg.to))
	.done(function(){
		YYIMChat.sendFile({
			to:arg.to,
			fileInputId:arg.fileInputId,
			type:arg.type,
			success:function(result){
				result.data = result.body;
				result.sendType = constant.SEND_TYPE.SEND;
				result.type = arg.type;
				result.from = YYIMChat.getUserID();
			    result.to = arg.to;
				if(arg.type == constant.CHAT_TYPE.GROUP_CHAT){
					result.from = arg.to;
					result.to = YYIMChat.getUserID();
					result.fromRoster = result.to;
				}
				var message = new IMChatMessage(result);
				message._fromVcard = IMChatUser.getInstance().getVCard(message._from);
			    message._toVcard = IMChatUser.getInstance().getVCard(message._to);
			    if(message._type == constant.CHAT_TYPE.CHAT){
			    	message._isReaded = constant.MESSAGE_READ_TYPE.UNREADED;
			    }
				IMChatMessageCache.getInstance().pushReadedMessage(arg.to,message);
				arg.success && arg.success(message);
			},
			error:function(result){
				arg.error && arg.error(result);
			}
		});
	});
}


/**
 * 异步发送form表单
 * arg {
 * 	  to:,
 *    file:{
 *       name:,
 *       size:
 *    },
 *    data:,
 *    mediaType:, //1:图片，2：附件
 * 
 *   contentType
 *    type: "groupchatat/pubaccount",  /at:单聊，groupcgat:群聊,pubaccount:公众号
 *    success:function,
 *    error:function,
 *    complete:function
 * }
 */
IMChatHandler.prototype.sendFormMessage = function(arg){
	arg.type = arg.type?arg.type:constant.CHAT_TYPE.CHAT;
	jQuery.when(IMChatUser.getInstance().getEntityVcard(arg.to))
	.done(function(){
		 YYIMChat.sendFormMessage({
	   		to:arg.to,
	   		file:{
	   			name:arg.file.name,
	   			size:arg.file.size
	   		},
	   		mediaType:arg.mediaType,
	   		type:arg.type,
	   		data:arg.data,
	   		success:function(result){
	   		 
				console.log('------result-------',result);
				result.data = result.body;
				result.sendType = constant.SEND_TYPE.SEND;
				result.type = arg.type;
				result.from = YYIMChat.getUserID();
			    result.to = arg.to;
			    
				if(arg.type == constant.CHAT_TYPE.GROUP_CHAT){
					result.from = arg.to;
					result.to = YYIMChat.getUserID();
					result.fromRoster = result.to;
				}
				var message = new IMChatMessage(result);
				
			 
				message._fromVcard = IMChatUser.getInstance().getVCard(message._from);
			    message._toVcard = IMChatUser.getInstance().getVCard(message._to);
			    if(message._type == constant.CHAT_TYPE.CHAT){
			    	message._isReaded = constant.MESSAGE_READ_TYPE.UNREADED;
			    }
				IMChatMessageCache.getInstance().pushReadedMessage(arg.to,message);
				
				console.log('--------message----------',message);
				arg.success && arg.success(message);
				 
			},
			error:function(result){
				arg.error && arg.error(result);
			}
	   });
		
		
		
		 
	});
}



/**
 * 获取历史记录 
 * @param arg {
 * 	id: 对方ID, //必须
 * 	chatType:chat/groupchat,//必须
 *  success:function
 * }
 */
IMChatHandler.prototype.getHistoryMessage = function(arg){
	var that = this;
	arg.myVcard = IMChatUser.getInstance().getVCard();
	
	jQuery.when(IMChatUser.getInstance().getEntityVcard(arg.id))
	.done(jQuery.proxy(function(){
		arg.otherVcard = IMChatUser.getInstance().getVCard(arg.id);
		
		if(!arg.id) return;	
		if(!this._historyCounter[arg.id]){
			this._historyCounter[arg.id] = 0;
		}
		arg.start = this._historyCounter[arg.id];
		arg.num = config.HISTORY_DEFAULT_SIZE;
		
		console.log('start:',arg.start,'num:',arg.num);
		var that = this;
		if(this._historyIsOver[arg.id]){
			if(arg.success && (typeof arg.success == 'function')){
				arg.success([],this._historyIsOver[arg.id]);
			}
			return;
		}
		
		arg.chatType = arg.chatType?arg.chatType:constant.CHAT_TYPE.CHAT;
		YYIMChat.getHistoryMessage({
			id:arg.id,
			start:arg.start,
			num:arg.num,
			chatType:arg.chatType,
			success:function(data){
				var msgList = [];
				
				if(data.result && data.result.length){
					for(var x in data.result){
						var repeat = false;
						
						var messlist = IMChatMessageCache.getInstance().getReadedMessage(arg.id);
						if(messlist && messlist.length){
							var msgId = data.result[x].msgId;
							
							var w = messlist.length;
							while(w--){
								if(messlist[w]._id == msgId){
									repeat = true;
									break;
								}
							}
						}
						
						messlist = IMChatMessageCache.getInstance().getUnreadedMessage(arg.id);
						if(messlist && messlist.length){
							var msgId = data.result[x].msgId;
							
							var w = messlist.length;
							while(w--){
								if(messlist[w]._id == msgId){
									repeat = true;
									break;
								}
							}
						}
						
						if(repeat){continue;}
						
						var msg = {
							id:data.result[x].msgId,
							from:data.result[x].fromId,
							fromRoster:data.result[x].fromRoster,
							to:data.result[x].toId?data.result[x].toId:YYIMChat.getUserID(),
							sendType:((data.result[x].fromRoster || data.result[x].fromId) == YYIMChat.getUserID())? constant.SEND_TYPE.SEND:constant.SEND_TYPE.RECEIVED,
							data:data.result[x].body,
							type:data.result[x].type
						}
						
						var message = new IMChatMessage(msg);
						msgList.push(message);
					}
				}
				
				if(data.result.length < config.HISTORY_DEFAULT_SIZE){
					IMChatHandler.getInstance()._historyIsOver[arg.id] = true;
				}
				
				if(msgList.length){
					msgList.sort(IMChatUtil.objDesc('dateline'));
				
					for(var y in msgList){
						
						if(msgList[y]._from == YYIMChat.getUserID()){
							var key = msgList[y]._to;
							msgList[y]._toVcard = arg.otherVcard;
							msgList[y]._fromVcard = arg.myVcard;
						}else{
							var key = msgList[y]._from;
							msgList[y]._fromVcard = arg.otherVcard;
							msgList[y]._toVcard = arg.myVcard;
						}
						
						IMChatMessageCache.getInstance().unshiftReadedMessage(key,msgList[y]);
					}
				}
//					that._historyCounter[arg.id] += config.HISTORY_DEFAULT_SIZE;
					that._historyCounter[arg.id] += data.result.length;
				
				if(arg.success && (typeof arg.success == 'function')){
					arg.success(msgList,that._historyIsOver[arg.id]);
				}
			}
		});
		},this))
	.fail(function(){
		console.log('获取vcard失败',arg.id);
	});
}

/**
 * 获取离线消息，（断开重连之后或者登陆之后调用）
 */
IMChatHandler.prototype.getOfflineMessage = function(){
	YYIMChat.getOfflineMessage();
}

/**
 * 订阅的处理(请求订阅subscribe|同意订阅subscribed)
 * @param arg { from: node@domain/resource,	type: "subscribe", name, ask , group: Array<String>}
 * 
 * 
 * 操作人 加好友--发送请求/onRosterDeleted(确认删除联系人)-->
 * ------------------------------------------------>
 * 
 * --------------------------------------------> 操作人 ( onSubscribe type=subscribed（没走onMessage：模拟一条消息）)
 * 被加人 同意( onSubscribe type=subscribed)		  被加人 ( onSubscribe type=subscribed（没走onMessage：模拟一条消息）)	
 * 
 * 操作人 删除好友--发送请求/onRosterDeleted(删除联系人)
 * -------------------------------------------------->被加人（onRosterDeleted）
 */
IMChatHandler.prototype.handleSubscribe = function(arg){
	YYIMChat.log(arg.from + " " + arg.type, 3, arg);
	if(arg.type == IMChat_PRESENCE_TYPE.SUBSCRIBE){ //请求订阅 subscribe
		
		//过滤重复添加好友
		var fiends = IMChatUser.getInstance().get('relation','friend');
		if(fiends && fiends.indexOf(arg.from) > -1){
			return;
		}
		
		//1.产生一条订阅消息
		var subMessage = new IMChatMessage({
			id:IMCHat_SYSTEM.name + Date.now(),
			type:constant.CHAT_TYPE.CHAT,
			from:{
				room:IMCHat_SYSTEM.name,
				roster:arg.from
			},
			to:YYIMChat.getUserID(),
			data:{
				contentType:IMChat_PRESENCE_TYPE.SUBSCRIBE,
				content:IMChat_TEXTINFO.SUBSCRIBE,
				dateline:Date.now(),
			}  
		});
		subMessage._toVcard = IMChatUser.getInstance().getVCard();
		
		//2.放入缓存
		IMChatMessageCache.getInstance().pushUnreadedMessage(subMessage._from,subMessage);
			
		//3.处理订阅消息
		if(config.INVITE_FRIEND_AUTO){ 		// 自动同意添加好友请求
			YYIMChat.approveSubscribe(arg.from);
		}else{ 
			//..
		}
	}else if(arg.type == IMChat_PRESENCE_TYPE.SUBSCRIBED){ //本人同意或对方同意都会收到
		//..
		IMChatUser.getInstance().addRosterCache(arg.from);
	}else{ //取消订阅 unsubscribe
		//..
	}
}

/**
 * 删除联系人
 * @param {string} rosterId
 */
IMChatHandler.prototype.handleRosterDeleted = function(rosterId){
	IMChatUser.getInstance().removeRosterCache(rosterId);
}

/**
 * 同意订阅
 */
IMChatHandler.prototype.approveSubscribe = function(rosterId){
	YYIMChat.approveSubscribe(rosterId);
}




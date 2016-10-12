function IMChatUser(){
	this._id = YYIMChat.getUserID();
	this._vcard;
	this._queryingVcard = {
		//rosterid:vcard;
	};
	
	this._userCache = {
		roster:{},
		chatroom:{},
		pubaccount:{},
		grouprelation:{},
		relation:{
			'friend':[],
			'stranger':[]
		}
	};
	
}

IMChatUser.getInstance = function(){
	if(!this._instance){
		this._instance = new IMChatUser();
	}
	return this._instance;
}

/**
 * 获取好友和自己的VCard
 */
IMChatUser.prototype.initVCards = function(){
	var that = this;
	YYIMChat.getVCard({
		success:function(vcard){
			that._vcard = new IMChatUserVCard(vcard);
		},
		error:function(){
			
		},
		complete:function(){
			YYIMChat.getVCards({
				success:function(vcards){
					for(var x in vcards){
						var userId = vcards[x].userId;
						var roster = that.get('roster',userId);
						if(roster){
							roster.setRosterVcard(new IMChatUserVCard(vcards[x]));
						}
					}
				}
			});
		}
	});
};

/**
 * 把联系人/群组/公众号实体法放入缓存
 * @param {Object} type
 * @param {Object} key
 * @param {Object} value
 */
IMChatUser.prototype.push = function(type,key,value){
	if(type && key && value){
		switch(type){
			case 'roster':;
			case 'chatroom':;
			case 'pubaccount':
				  	this._userCache[type][key] = value;
				  	break;
			case 'grouprelation':;
			case 'relation':
					if(!this._userCache[type][key]){
						this._userCache[type][key] = [];
					}
					this._userCache[type][key].push(value);
					break;
			case 'userinfo':
				  this[key] = value;
				  break;
			default:break;
		}
	}
}

/**
 * 获取相应的实体缓存
 * @param {Object} type
 * @param {Object} key
 */
IMChatUser.prototype.get = function(type,key){
	if(type){
		switch(type){
			case 'roster':;
			case 'chatroom':;
			case 'pubaccount':;
			case 'grouprelation':;
			case 'relation':
				  return key? this._userCache[type][key]:this._userCache[type];
			case 'userinfo':
				  return key? this[key]:null;
			default: return null;
		}
	}
};

/**
 * 获取当前用户信息
 */
IMChatUser.prototype.getUserId = function(){
	return this._id;
};

/**
 * 获取联系人vcard
 * @param {String} id
 */
IMChatUser.prototype.getEntityVcard = function(id){
	var dtd = jQuery.Deferred();

	if(this._queryingVcard[id]){//正在查询
		dtd.resolve();
	}else{
		var identity = this.getIdentity(id);
		if(identity == 'roster'){
			if(id == this._id || !id){
				this._queryingVcard[id] = this.get('userinfo','_vcard');
				dtd.resolve();
			}else{
				var roster = this.get('roster',id);
				if(roster){
					vcard = roster.getRosterVcard();
					if(!vcard){
						this._queryingVcard[id] = new IMChatUserVCard({userId:id});
						roster._vcard = this._queryingVcard[id];
						
						YYIMChat.getVCard({
							id:id,
							success:jQuery.proxy(function(data){
								if(data){
									this._queryingVcard[id].construct(data);
								}
								dtd.resolve();
							},this),
							error:function(){
								dtd.reject();
							}
						});
					}else{
						this._queryingVcard[id] = vcard;
						dtd.resolve();
					}
				}else{
					var strangerIdList = this.get('relation','stranger');	
					strangerIdList.push(id);
					roster = new IMChatRoster({id:id});
					this.push('roster',roster._id,roster);
					
					this._queryingVcard[id] = new IMChatUserVCard({userId:id});
					roster._vcard = this._queryingVcard[id];
					
					YYIMChat.getVCard({
						id:id,
						success:jQuery.proxy(function(data){
							if(data){
								this._queryingVcard[id].construct(data);
							}
							dtd.resolve();
						},this),
						error:function(){
							dtd.reject();
						}
					});
				}
			}
		}else if(identity == 'chatroom' || identity == 'pubaccount'){
			dtd.resolve();
		}
	}
	return dtd.promise();
};

/**
 * 获取人员vcard
 * @param {Object} id
 */
IMChatUser.prototype.getVCard = function(id){
	var vcard;
	var identity = this.getIdentity(id);
	if(identity == 'chatroom'){
		vcard = this.getChatRoom(id);
	}else if(identity == 'pubaccount'){
		vcard = this.getPubAccount(id);
	}else if(identity == 'roster'){
		if(id == this._id || !id){
			vcard = this.get('userinfo','_vcard');
		}else{
			var roster = this.get('roster',id);
			vcard = roster.getRosterVcard();
		}
	}
	return vcard;
}

/**
 * 获取好友列表 
 */
IMChatUser.prototype.getFriendList = function(){
	var friendIdList = this.get('relation','friend'); 
	var friendsList = {};
	if(friendIdList && friendIdList.length){
		for(var x in friendIdList){
			var friendid = friendIdList[x];
			friendsList[friendid] = this.get('roster',friendid);
		}
	}
	return friendsList;
};

/**
 * 添加联系人
 * @param {Object} rosterId
 */
IMChatUser.prototype.addRosterCache = function(rosterId){
	var friendIdList = this.get('relation','friend');
	var strangerIdList = this.get('relation','stranger');
	var position = strangerIdList.indexOf(rosterId);
	if(position > -1){//在陌生人列表中
		
		var result = strangerIdList.splice(position,1);
		friendIdList.push(rosterId);
		var roster = this.get('roster',rosterId);
		if(roster){
			roster._subscription = IMChat_SUBSCRIBE.BOTH;
			if(!roster._vcard){
				YYIMChat.getVCard({
					id:roster._id,
					success:jQuery.proxy(function(vcard){
						if(vcard){
							roster._vcard = new IMChatUserVCard(vcard);
						}
					},this)
				});
			}
		}
		
	}else{//不在陌生人列表中
		
		friendIdList.push(rosterId);
		var roster = new IMChatRoster({id:rosterId});
		YYIMChat.getVCard({
			id:rosterId,
			success:jQuery.proxy(function(vcard){
				if(vcard){
					roster._vcard = new IMChatUserVCard(vcard);
				}
				this.push('roster',roster._id,roster);
			},this)
		});
	}
};


/**
 * 发送添加联系人请求
 * @param {string} rosterId
 */
IMChatUser.prototype.addRoster = function(rosterId){
	YYIMChat.addRosterItem(rosterId);
};


/**
 * 删除联系人
 * @param {string} rosterId
 */
IMChatUser.prototype.removeRosterCache = function(rosterId){
	var friendIdList = this.get('relation','friend');
	var strangerIdList = this.get('relation','stranger');
	var position = friendIdList.indexOf(rosterId);
	if(position > -1){
		var result = friendIdList.splice(position,1);
		strangerIdList.push(rosterId);
		var roster = this.get('roster',rosterId);
		if(roster){
			roster._subscription = IMChat_SUBSCRIBE.NONE;
		}
	}
};

/**
 *	发送删除联系人请求
	  arg {
	  	rosterId:string,
	  	success:function,
	  	error:function
	  }
 */
IMChatUser.prototype.removeRoster = function(arg){
	YYIMChat.deleteRosterItem({
		id: arg.rosterId,
		success: jQuery.proxy(function(){
			arg.success && arg.success();
		},this)
	});
};

/**
 * 更新联系人信息
 * @param {Object} arg
 */
IMChatUser.prototype.updateRoster = function(arg){
	
};



/*-------------------------群操作 start------------------------------*/
/**
 * 获取群组列表 chatroomid 为空则获取全部群列表
 * @param {Object} chatroomid
 */
IMChatUser.prototype.getChatRoom = function(chatroomid){
	var chatroom = this.get('chatroom',chatroomid);
	return chatroom;
}

/**
 * 创建群组
   arg {
   	name:,//群组名称
   	members:[], //初始化群成员
   	success:function,
   	complete:function,
   	error:function
   }
 */
IMChatUser.prototype.createChatRoom = function(arg){
	YYIMChat.createChatGroup({
		name:arg.name,
		members:arg.members,
		success:jQuery.proxy(function(data){
			this.updateChatRoom(data);
			arg.success && arg.success(data); 
		},this),
		error:function(){
			arg.error && arg.error(); 
		},
		complete:function(){
			arg.complete && arg.complete(); 
		}
	});
};

/**
 * 更新群组
 * @param {Object} arg
 */
IMChatUser.prototype.updateChatRoom = function(arg){
	var chatRoom = this.getChatRoom(arg.id);
	if(chatRoom){
		chatRoom.construct(arg);		
	}else{
	    this.push('chatroom',arg.id,new IMChatRoom(arg));
	}
};

/**
 * 更新群组
 * @param {String} chatroomid
 */
IMChatUser.prototype.removeChatRoomCache = function(chatroomid){
	var chatRoom = this.getChatRoom(chatroomid);
	if(chatRoom){
		delete this._userCache['chatroom'][chatroomid];
	}
};

/**
 * 邀请好友
   arg {
   	id:,//群组id
   	members:[], //邀请群成员
   	success:function,
   	complete:function,
   	error:function
   }
 * @param {Object} arg
 */
IMChatUser.prototype.inviteGroupMember = function(arg){
	var chatRoom = this.getChatRoom(arg.id);
	if(chatRoom){
		YYIMChat.inviteGroupMember({
			to:arg.id,
			members:arg.members,
			success:jQuery.proxy(function(data){
				this.updateChatRoom(data);
				arg.success && arg.success(data); 
			},this),
			complete:function(){
				arg.complete && arg.complete(); 
			},
			error:function(){
				arg.error && arg.error(); 
			}
		});
	}
};

/**
 * 修改群名称
   arg {
   	id:,//群组id
   	name:string, //群组新名称
   	success:function,
   	complete:function,
   	error:function
   }
 * @param {Object} arg
 */
IMChatUser.prototype.modifyChatGroupInfo = function(arg){
	var chatRoom = this.getChatRoom(arg.id);
	if(chatRoom){
		YYIMChat.modifyChatGroupInfo({
			to:arg.id,
			name:arg.name,
			success:jQuery.proxy(function(data){
				this.updateChatRoom(data);
				arg.success && arg.success(data); 
			},this),
			complete:function(){
				arg.complete && arg.complete(); 
			},
			error:function(){
				arg.error && arg.error(); 
			}
		});
	}
};

/**
 * 群主踢人
    arg {
   	id:,//群组id
   	member:string, //踢人id
   	success:function,
   	complete:function,
   	error:function
   }
 * @param {Object} arg
 */
IMChatUser.prototype.kickGroupMember = function(arg){
	var chatRoom = this.getChatRoom(arg.id);
	if(chatRoom){
		var member = chatRoom.getMember(arg.member);
		if(member){
			YYIMChat.kickGroupMember({
				to: arg.id,
				member: arg.member,
				success:jQuery.proxy(function(data){
					this.updateChatRoom(data);
					arg.success && arg.success(data); 
				},this),
				complete:function(){
					arg.complete && arg.complete(); 
				},
				error:function(){
					arg.error && arg.error(); 
				}
			});
		}
	}
};

/**
 * 被群组踢掉了
 * @param {Object} chatroomid
 */
IMChatUser.prototype.kickedByGroup = function(chatroomid){
	this.removeChatRoomCache(chatroomid);	
}

/**
 * 退出群组
    arg {
   	id:,//群组id
   	success:function,
   	complete:function,
   	error:function
   }
 * @param {Object} arg
 */
IMChatUser.prototype.exitChatGroup = function(arg){
	var chatRoom = this.getChatRoom(arg.id);
	if(chatRoom){
		YYIMChat.exitChatGroup({
			to: arg.id,
			success:jQuery.proxy(function(data){
				this.removeChatRoomCache(arg.id);				
				arg.success && arg.success(data); 
			},this),
			complete:function(){
				arg.complete && arg.complete(); 
			},
			error:function(){
				arg.error && arg.error(); 
			}
		});
	}
};

/*-------------------------群操作 end------------------------------*/

/**
 * 获取公众号 pubaccountid 为空则获取全部公众号列表
 * @param {Object} pubaccountid
 */
IMChatUser.prototype.getPubAccount = function(pubaccountid){
	var pubaccount = this.get('pubaccount',pubaccountid)
	return pubaccount;
}

/**
 *  更新公众号信息
 * @param arg {
 *   id:,
 *   name:,
 *   type://1:订阅号 2:广播号
 * }
 */
IMChatUser.prototype.updatePubAccount = function(arg){
	if(arg.id){
		var pubaccount = this.getPubAccount(arg.id);
		if(typeof pubaccount !== 'undefined'){
			pubaccount.construct(arg);
		}
	}
};

/**
 * 取消关注公众号
 * @param arg{
 * 	id:,
 *  success:function
 * }
 */
IMChatUser.prototype.removePubAccount = function(arg){
	if(arg && arg.id){
		var that = this;
		YYIMChat.removePubaccount({
			id:arg.id,
			success:function(data){
				delete that._userCache['pubaccount'][arg.id];			
				arg.success && arg.success(data);
			},
			error:function(){
				arg.error && arg.error();
			}
		});
	}
};


/**
 * 获取实体的身份
 * @param {Object} id
 */
IMChatUser.prototype.getIdentity = function(id){
	if(id && this.getChatRoom(id)){
		return 'chatroom';
	}
	
	if(id && this.getPubAccount(id)){
		return 'pubaccount';
	}
	return 'roster';
}






/**
 * 消息缓存类
 */
function IMChatMessageCache(){
	this._readedList = {};
	this._unreadedList = {};
}

/**
 * 获取消息缓存类的单例对象
 */
IMChatMessageCache.getInstance = function (){
	if(!this._instance){
		this._instance = new IMChatMessageCache();
	}
	return this._instance;
}

/**
 * 将已读消息添加到已读消息缓存
 * @param {string} id
 * @param {Object} message
 */
IMChatMessageCache.prototype.unshiftReadedMessage = function(rosterid,message){
	if(!this._readedList[rosterid]){
		this._readedList[rosterid] = [];
	}
	this._readedList[rosterid].unshift(message);
	this._readedList[rosterid].sort(IMChatUtil.objAsc('dateline'));
	return this._readedList[rosterid];
}

/**
 * 将已读消息正序添加到已读消息缓存，一般用于正在聊天的消息
 * @param {string} id
 * @param {Object} message
 */  
IMChatMessageCache.prototype.pushReadedMessage = function(rosterid,message){
	if(!this._readedList[rosterid]){
		this._readedList[rosterid] = [];
	}
	
	if(!this._unreadedList[rosterid]){
		this._unreadedList[rosterid] = [];
	}

this._readedList[rosterid] = this._readedList[rosterid].concat(this._unreadedList[rosterid]);
	this._unreadedList[rosterid] = [];
	
	this._readedList[rosterid].push(message);
	
	//this._readedList[rosterid].sort(IMChatUtil.objAsc('dateline'));
	
	return this._readedList[rosterid];
}

/**
 * 将未读消息正序添加到未读消息缓存
 * @param {string} id
 * @param {Object} message
 */
IMChatMessageCache.prototype.pushUnreadedMessage = function(rosterid,message){
	if(!this._unreadedList[rosterid]){
		this._unreadedList[rosterid] = [];
	}
	this._unreadedList[rosterid].push(message);
	
	this._unreadedList[rosterid].sort(IMChatUtil.objAsc('dateline'));
	
	return this._unreadedList[rosterid];
}

/**
 * 获取某人的全部消息缓存
 * @param {string} id
 */
IMChatMessageCache.prototype.getAllMessage = function(rosterid){
	if(!this._readedList[rosterid]){
		this._readedList[rosterid] = [];
	}
	
	if(!this._unreadedList[rosterid]){
		this._unreadedList[rosterid] = [];
	}
	
	this._readedList[rosterid] = this._readedList[rosterid].concat(this._unreadedList[rosterid]);
	this._unreadedList[rosterid] = [];
	//this._readedList[rosterid].sort(IMChatUtil.objAsc('dateline'));
	
	/**
	 * 收到消息的最后一条发送已读回执
	 */
	var length = this._readedList[rosterid].length;
	if(length){
	    var message = this._readedList[rosterid][length-1];
		var receiptsbody = message._data.receiptsbody;
		if (receiptsbody && !receiptsbody.sendreceipts && receiptsbody.type == PACKET_TYPE.LONG_CONNECT && receiptsbody.receipts === true) {
		    var arg = receiptsbody.arg;
			YYIMChat.sendReceiptsPacket(arg);
			YYIMChat.sendReadedReceiptsPacket(arg);
			receiptsbody.sendreceipts = true;
		}
	}
	
//	for(var x in this._readedList[rosterid]){
//		var message = this._readedList[rosterid][x];
//		var receiptsbody = message._data.receiptsbody;
//		if (receiptsbody && !receiptsbody.sendreceipts && receiptsbody.type == PACKET_TYPE.LONG_CONNECT && receiptsbody.receipts === true) {
//		    var arg = receiptsbody.arg;
//			YYIMChat.sendReceiptsPacket(arg);
//			YYIMChat.sendReadedReceiptsPacket(arg);
//			receiptsbody.sendreceipts = true;
//		}
//	}
	
	return this._readedList[rosterid];
}

/**
 * 获取某人的未读消息
 * @param {string} id
 */
IMChatMessageCache.prototype.getUnreadedMessage = function(rosterid){
	return this._unreadedList[rosterid]? this._unreadedList[rosterid]:0;
}

/**
* 获取所有的未读消息数目
* @param   目前使用循环遍历的方式
*/


IMChatMessageCache.prototype.getAllUnreadedMessageLendth = function () {
    var count = 0;
    for (var item in this._unreadedList) {
        count += this._unreadedList[item].length;
    }
    return count;
}


/**
 * 获取某人的未读消息数目
 * @param {string} id
 */
IMChatMessageCache.prototype.getUnreadedMessageLendth = function(rosterid){
	return this._unreadedList[rosterid]? this._unreadedList[rosterid].length:0;
}

/**
 * 设置某人的未读消息数目为空  目的 对于直接关闭历史信息的进行处理   rongfl  2015-11-20
 * @param {string} id
 */
IMChatMessageCache.prototype.setUnreadedMessageToNull = function(rosterid){
	
	  if(!this._readedList[rosterid]){
		this._readedList[rosterid] = [];
	}
	
	if(!this._unreadedList[rosterid]){
		this._unreadedList[rosterid] = [];
	}
	
	this._readedList[rosterid] = this._readedList[rosterid].concat(this._unreadedList[rosterid]);
	this._unreadedList[rosterid] = [];
}


/**
 * 获取某人的已读消息
 * @param {string} id
 */
IMChatMessageCache.prototype.getReadedMessage = function(rosterid){
	return this._readedList[rosterid]? this._readedList[rosterid]:0;
}


/**
 * 获取某人一条的消息
 * @param {Object} 
 * arg {
 * 	 rosterid:string, //联系人id
 *   messageid:string //消息id
 * }
 */
IMChatMessageCache.prototype.getOneRosterMessage = function(arg){
	if(arg && arg.rosterid && arg.messageid){
		var messages = this.getReadedMessage(arg.rosterid);
		if(messages){
			for(var x in messages){
				if(messages[x]._id == arg.messageid){
					return messages[x];
				}
			}
		}
	    messages = this.getUnreadedMessage(arg.rosterid);
		if(messages){
			for(var x in messages){
				if(messages[x]._id == arg.messageid){
					return messages[x];
				}
			}
		}
	}
	return;
};



/**
 * 获取一条消息
 * @param {Object} 
 * arg {
 * 	 rosterid:string, //联系人id
 *   messageid:string //消息id
 * }
 */
IMChatMessageCache.prototype.getOneMessage = function(arg){
	var message;
	if(arg && arg.rosterid && arg.messageid){
		message = this.getOneRosterMessage(arg);
	}else if(arg && arg.messageid){
		var messlist = this._readedList;
		for(var x in messlist){
			arg.rosterid = x;
			message = this.getOneRosterMessage(arg);
		}
		
		if(!message){
			messlist = this._unreadedList;
			for(var x in messlist){
				arg.rosterid = x;
				message = this.getOneRosterMessage(arg);
				if(message){break;};
			}
		}
	}
	return message;
};

 

/**
 * 批量标记已读
 *   arg {
 * 	 rosterid:string, //联系人id
 *   messageid:string //消息id
 * }
 */
IMChatMessageCache.prototype.batchMarkReaded = function(arg){
	var message = this.getOneMessage(arg);
	for(var x in this._readedList[arg.rosterid]){
		var messTemp = this._readedList[arg.rosterid][x];
		messTemp.turnToReaded();
		if(messTemp._id == message._id){
			break;
		}
	}
};

 

/**
 * 消息实体类
 */
function IMChatMessage(arg){
	this._id = arg.id;
	this._type = arg.type;
	this._from = arg.from;
	this._fromRoster = arg.fromRoster;
	this._to = arg.to;
	this._data = arg.data?arg.data:{};
	this.dateline = arg.data?arg.data.dateline:0;
	this._resource = arg.resource;
	this._sendType = arg.sendType? arg.sendType:constant.SEND_TYPE.RECEIVED; //默认收到的消息
	this._init();
}

/**
 * 初始化
 */
IMChatMessage.prototype._init = function(){
	if(this._from && !(typeof(this._from) == 'string')){
		var from = this._from;
		this._from = from.room;
		this._fromRoster = from.roster;
	}
	
	if(this._fromRoster && this._type == constant.CHAT_TYPE.GROUP_CHAT){
		var chatroomid = (this._from == YYIMChat.getUserID()) ? this._to:this._from;
		var chatroom = IMChatUser.getInstance().getChatRoom(chatroomid);
		if(chatroom){
			this._fromRosterVcard = chatroom.getMember(this._fromRoster);
			if(!this._fromRosterVcard){
				jQuery.when(IMChatUser.getInstance().getEntityVcard(this._fromRoster))
				.done(jQuery.proxy(function(){
					this._fromRosterVcard = IMChatUser.getInstance().getVCard(this._fromRoster);
				},this));
			}
		}else{
			jQuery.when(IMChatUser.getInstance().getEntityVcard(this._fromRoster))
			.done(jQuery.proxy(function(){
				this._fromRosterVcard = IMChatUser.getInstance().getVCard(this._fromRoster);
			},this));
		}
	}
	
	this._templateCode = 'imchat' + this._data.contentType + ((this._sendType == constant.SEND_TYPE.SEND)?'01':'02');
}
/**
 * 转换成已读消息
 */
IMChatMessage.prototype.turnToReaded = function(){
	if(this._isReaded){
		this._isReaded = constant.MESSAGE_READ_TYPE.READED;
	}
}

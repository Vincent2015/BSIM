function IMChatRoom(arg){
	this._id = arg.id;
	this._name = arg.name;
	this._photo = arg.photo;
	this._members = arg.members;
	this._membersList = {};
	this._collected = arg.collected;
	this.init();
}

/**
 * 重新构建群组
 * @param {Object} arg
 */
IMChatRoom.prototype.construct = function(arg){
	this._name = arg.name? arg.name:this._name;
	this._photo = arg.photo? arg.photo:this._photo;
	this._members = arg.members? arg.members:this._members;
	this._membersList = {};
	this._collected = arg.collected? arg.collected:this._collected;
	this.init();
}

/**
 * 初始化群组
 */
IMChatRoom.prototype.init = function(){
	for(var x in this._members){
		var memberid = this._members[x].id;
		this._membersList[memberid] = new IMChatRoomMVcard(this._members[x]);
	}
}

/**
 * 获取去成员
 * @param {Object} id
 */
IMChatRoom.prototype.getMember = function(id){
	return this._membersList[id];
}

/**
 * 获取群成员个数
 */
IMChatRoom.prototype.getMemberLength = function(){
	return this._members? this._members.length:0;
}

/**
 * 获取群头像
 */
IMChatRoom.prototype.getRoomPhotoUrl = function(){
	return this._photo ? YYIMChat.getFileUrl(this._photo) : SNSConfig.CHAT_ROOM.DEFAULT_AVATAR;
};



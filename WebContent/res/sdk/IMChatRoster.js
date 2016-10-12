/**
 * roster
 */
function IMChatRoster(arg){
	this._id = arg.id;
//	this._name = arg.name;
//	this._photo = arg.photo;
	this._vcard;
	
	this._ask = arg.ask;
	this._resource = arg.resource;
	this._subscription = arg.subscription;
	this._group = arg.group;
}

/**
 * 获取VCard
 */
IMChatRoster.prototype.getRosterVcard = function(){
	return this._vcard;
};

/**
 * 加载头像地址
 */
IMChatRoster.prototype.getPhotoUrl = function(){
	return this._photo? YYIMChat.getFileUrl(this._photo):SNSConfig.USER.DEFAULT_AVATAR;
};


/**
 * 设置VCard
 */
IMChatRoster.prototype.setRosterVcard = function(vcard){
	this._vcard = vcard;
}




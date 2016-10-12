function IMChatRoomMVcard(arg){
	this.affiliation = arg.affiliation;
	this.userId = arg.id;
	this.nickname = arg.name; //昵称
	this.photo = arg.photo;    //头像
	this.role = arg.role;    //邮箱
}

/**
 * 加载头像地址
 */
IMChatRoomMVcard.prototype.getPhotoUrl = function(){
	return this.photo ? YYIMChat.getFileUrl(this.photo) : SNSConfig.USER.DEFAULT_AVATAR;
};
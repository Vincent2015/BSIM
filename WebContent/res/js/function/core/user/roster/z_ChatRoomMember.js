var SNSChatRoomMemberRoster = function(id, name){
	this.affiliation = SNS_CHATROOM_MEMBER_AFFILIATION.NONE;
	this.role = SNS_CHATROOM_MEMBER_ROLE.PARTICIPANT;
	
	if (id) {
		this.id = id;
		this.name = name? name : id;
	}
};

SNSChatRoomMemberRoster.prototype = new SNSRoster();

SNSChatRoomMemberRoster.prototype.getPhotoUrl = function(){
	return this.photoUrl ? YYIMChat.getFileUrl(this.photoUrl) : SNSConfig.USER.DEFAULT_AVATAR;
};
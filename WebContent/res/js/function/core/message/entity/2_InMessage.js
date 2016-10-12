var SNSInMessage = function() {
	this.id = Math.uuid();
}

SNSInMessage.prototype = new SNSMessage();

SNSInMessage.prototype.initRoomMessage = function(arg){
	var user = SNSApplication.getInstance().getUser();
	this.id = arg.id||this.id;
	this.type = SNS_CHAT_TYPE.GROUP_CHAT;
	this.from = user.getOrCreateRoster(arg.from.roster);
	this.chatroom = user.chatRoomList.getChatRoom(arg.from.room);
	this.body = Object.clone(arg.data);
	this.body.style = this.decodeMessageStyle(arg.data.style);
};

SNSInMessage.prototype.initRosterMessage = function(arg){
	this.id = arg.id||this.id;
	this.type = SNS_CHAT_TYPE.CHAT;
	this.from = SNSApplication.getInstance().getUser().getOrCreateRoster(arg.from, arg.resource);
	if(arg.resource)
		this.resource = arg.resource;
	this.body = Object.clone(arg.data);
	this.body.style = this.decodeMessageStyle(arg.data.style);
};

SNSInMessage.prototype.initDeviceMessage = function(arg){
	var user = SNSApplication.getInstance().getUser();
	this.id = arg.id||this.id;
	this.type = SNS_CHAT_TYPE.CHAT;
	this.from = user.deviceList.get(user.getID() + "/" + arg.from);
	this.body = Object.clone(arg.data);
	this.body.style = this.decodeMessageStyle(arg.data.style);
};
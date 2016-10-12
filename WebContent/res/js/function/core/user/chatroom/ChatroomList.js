var SNSChatRoomList = function() {

}

SNSChatRoomList.prototype = new SNSBaseRosterList();

SNSChatRoomList.prototype.setChatRoomList = function(list){
	for(var i = 0; i < list.length; i++){
		this.add(list[i]);
	}
	SNSApplication.getInstance().getGlobalEventManager().trigger(SNS_EVENT_SUBJECT.AFTER_LOAD_CHATROOM, []);
};
/**
 * 返回房间列表的回调函数
 * @param list {JSON}
 */
SNSChatRoomList.prototype.chatRoomListHandler = function(list) {
	var chatRoomList = JSON.parse(list);
	if(!chatRoomList || chatRoomList.length <= 0)
		return;
	
	var chatrooms = [];
	for(var i = 0; i < chatRoomList.length; i++){
		var chatRoom = new SNSChatRoom(chatRoomList[i].id);
		chatRoom.name = chatRoomList[i].name? chatRoomList[i].name.substr(0,8): 'noname';
		if(chatRoomList[i].photo){
			chatRoom.photoUrl = chatRoomList[i].photo;
		}
		// nickname?
		chatRoom.nickname = SNSApplication.getInstance().getUser().id;
		chatRoom.type = SNS_CHAT_ROOM_TYPE.RESERVED;
		chatrooms.push(chatRoom);
	}
	this.setChatRoomList(chatrooms);
};

SNSChatRoomList.prototype.addChatRoom  = function(chatroom){
	if(this.add(chatroom)){
		SNSApplication.getInstance().getGlobalEventManager().trigger(SNS_EVENT_SUBJECT.ON_ADD_CHATROOM,[chatroom]);
	}
};

SNSChatRoomList.prototype.getChatRoom = function(chatRoom) {
	return this.get(chatRoom);
};

/**
 * 创建房间结果的处理方法
 * @param arg {name, node, desc, nickName, success: function, error: function, complete:function}
 * 
 * @returns room
 */
SNSChatRoomList.prototype.createRoomHandler = function(arg){
	var room = new SNSChatRoom(arg.node);
	room.name = arg.name;
	room.desc = arg.desc;
	room.nickname = arg.nickname;
	this.addChatRoom(room);
	return room;
};
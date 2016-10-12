/**
 * 表示聊天室, 包含聊天室的邀请， 成员管理等方法
 * @Class SNSChatRoom
 */
var SNSChatRoom = function(id) {
	/**
	 * 聊天室的JID
	 * @Type {JSJaCJID}
	 */
	this.id = id;

	/**
	 * 聊天室的名称
	 * @Type {string}
	 */
	this.name;
	this.desc;
	this.creationData;
	// 我在该房间的昵称
	this.nickname;
	this.show = "chatroom";
	this.type = SNS_CHAT_ROOM_TYPE.RESERVED;
	this.photoUrl; // = SNSConfig.CHAT_ROOM.DEFAULT_AVATAR;

	/**
	 * 聊天室的成员列表
	 * @Type {SNSRosterList}
	 */
	this.rosterList = new SNSRosterList();

	/**
	 * 聊天室的文件列表
	 * @Type {SNSChatRoomFileList}
	 */
	this.fileList = new SNSChatRoomFileList(this.id);
	
	this.infoQueryed = false;
	this.memberListQueryed = false;
};

SNSChatRoom.prototype.getPhotoUrl = function(){
	return this.photoUrl ? YYIMChat.getFileUrl(this.photoUrl) : SNSConfig.CHAT_ROOM.DEFAULT_AVATAR;
};

/**
 * 向聊天室中增加成员
 * @param roster SNSRoster
 * @returns {SNSRoster} 被添加的联系人对象
 */
SNSChatRoom.prototype.addMember = function(roster) {
	if(!roster)
		return;
	// update
	if (this.rosterList.contains(roster)) {
		this.updateMemberPhoto(roster);
		return;
	}
	this.rosterList.add(roster);
	return roster;
};

/**
 * 更新成员头像
 * @param roster
 */
SNSChatRoom.prototype.updateMemberPhoto = function(newRoster) {
	if(!this.rosterList.get(newRoster.id))
		return;
	if(newRoster.photoUrl){
		this.rosterList.get(newRoster.id).photoUrl = newRoster.photoUrl;
	}
};

/**
 * 成员列表的回调方法
 * @param list
 */
SNSChatRoom.prototype.queryMembersHandler = function(list) {
	var memberList = JSON.parse(list);
	if(!memberList || memberList.length <= 0)
		return;
	this.memberListQueryed = true;
	for(var i = 0; i < memberList.length; i++){
		var roster = new SNSChatRoomMemberRoster(memberList[i].id, memberList[i].name);
		roster.photoUrl = memberList[i].photo;
		if(memberList[i].affiliation){
			roster.affiliation = memberList[i].affiliation;
		}
		this.addMember(roster);
	}
};

/**
 * 房间的成员列表
 * @param list
 */
SNSChatRoom.prototype.setMemberList = function(list){
	for (var i = 0; i < list.length; i++) {
		this.addMember(list[i]);
	}
};

/**
 * 查询房间信息,这里先主要获取房间名
 */
SNSChatRoom.prototype.queryInfo = function(){
	var defer = jQuery.Deferred();
	var that = this;
	YYIMChat.getChatGroupInfo({
		id : this.getID(),
		success : function(info) {
			that.infoQueryed = true;
			that.name = info.name;
			that.desc = info.desc;
			defer.resolve();
		},
		error : function() {
			defer.reject();
		}
	});
	return defer.promise();
};

/**
 * 更新名字，描述，头像
 * @param oArg {name, desc, photoUrl}
 */
SNSChatRoom.prototype.update = function(oArg){
	if(!oArg)
		return;
	
	// 是否需要发送表单
	var notChanged = true, that = this;
	if((oArg.name && oArg.name != this.name)
			|| (oArg.desc && oArg.desc != this.desc)
			|| (oArg.photoUrl && oArg.photoUrl != this.photoUrl)){
		
		var defer = jQuery.Deferred();
		YYIMChat.updateChatGroup({
			id : this.getID(),
			name : oArg.name,
			desc : oArg.desc,
			photo : oArg.photoUrl,
			success : function() {
				that.name = oArg.name || oArg.name;
				that.desc = oArg.desc || that.desc;
				that.photoUrl = oArg.photoUrl || that.photoUrl;
				defer.resolve();
			},
			error : function() {
				defer.reject();
			}
		});
		return defer.promise();
	}
};

SNSChatRoom.prototype.getMe = function(){
	return this.rosterList.get(SNSApplication.getInstance().getUser().id);
};

/**
 * 获取没有app key和etp key的node
 */
SNSChatRoom.prototype.getID = function(){
	return this.id;
};

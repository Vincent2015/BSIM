var SNSUser = function() {
	this.name;

	/**
	 * @description {JSJaCJID} 用户jid
	 * @field
	 */
	this.id;
	
	this.resource;

	/**
	 * @description {SNSVCard} 电子名片
	 * @field
	 */
	this.vcard;

	/**
	 * @description {SNSPresence} 用户的出席信息
	 * @field
	 */
	this.presence = new SNSPresence();

	/**
	 * @description {SNSRosterList} 联系人列表
	 * @field
	 */
	this.rosterList = new SNSRosterList();

	/**
	 * @description {SNSGroupList} 分组列表
	 * @field
	 */
	this.groupList = new SNSGroupList();

	/**
	 * @description {SNSRecentList} 最近联系人列表
	 * @field
	 */
	this.recentList = new SNSRecentList();

	/**
	 * @description {SNSChatRoomList} 房间列表
	 * @field
	 */
	this.chatRoomList = new SNSChatRoomList();

	/**
	 * @description {SNSSystemRoster} 系统提醒
	 * @field
	 */
	this.systemRoster = new SNSSystemRoster();

	/**
	 * 我的设备列表
	 */
	this.deviceList = new SNSDeviceList();
	
	this._queryingVCard = false;
	
	this._localSearchResult = [];
};

SNSUser.prototype._init = function() {
	YYIMChat.log("SNSUser.prototype.init", 3);
}
/**
 * 更改用户的在线状态, 并通知服务器
 * @param presence {string | JSJaCPresence} 将要改变的presence
 * @param updateServer {boolean} 是否通知服务器状态改变，默认为否.[optional]
 * @return jQuery.Deferred对象，使用方式如下： jQuery.when(snsUser.setPresence()).done(function(){ //do something });
 */
SNSUser.prototype.setPresence = function(presence, updateServer) {
	var old = Object.clone(this.presence);
	if (presence) {
		if (typeof presence == "string") {
			this.presence.setStatus(presence);
		} else if (presence instanceof SNSPresence) {
			this.presence = presence;
		}
		
		// 通知服务器返回的包不走回调，监听方法内调setPresence来渲染
		if(!updateServer){
			SNSApplication.getInstance().getGlobalEventManager().trigger(SNS_EVENT_SUBJECT.ON_USER_PRESENCE_CHANGE, []);
		}
		
		if (old.equals(this.presence)) {
			return;
		}

		if (updateServer) {
			YYIMChat.setPresence({
				status: this.presence.status,
				type: this.presence.type
			});
		}
	}
};

/**
 * 得到自己的头像路径
 */
SNSUser.prototype.getPhotoUrl = function() {
	if (this.vcard) {
		if (this.vcard.getPhotoUrl().notEmpty()) {
			return this.vcard.getPhotoUrl();
		}
	} else {
		this.requestVCard();
	}
	return SNSConfig.USER.DEFAULT_AVATAR;
}

/**
 * 请求自己的VCard
 */
SNSUser.prototype.requestVCard = function(){
	if (this._queryingVCard) {
		return this._vcardDefer;
	}
	this._queryingVCard = true;

	this._vcardDefer = jQuery.Deferred();
	var that = this;
	YYIMChat.getVCard({
		success : function(vcardResult) {
			that.setVCard(new SNSVCard(vcardResult));
			that._vcardDefer.resolve();
			that._queryingVCard = false;
		},
		error : function() {
			that._vcardDefer.reject();
			that._queryingVCard = false;
		}
	});
	return this._vcardDefer.promise();
};

/**
 * 请求所有好友的VCard
 */
SNSUser.prototype.requestRosterVCards = function() {
	var that = this;
	YYIMChat.getVCards({
		success : function(vcards) {
			var i = vcards.length;
			while(i--) {
				var vcard = vcards[i],
					roster = that.getRoster(vcard.userId);
				roster.setVCard(new SNSVCard(vcard));
				roster.changePhoto && roster.changePhoto(vcard.photo);
			}
		}
	});
};

SNSUser.prototype.setVCard = function(vcard) {
	this.vcard = vcard;
};

/**
 * 请求好友列表的回调函数
 * @param list {JSON}
 */
SNSUser.prototype.rosterListHandler = function(list) {
	var rosterList = JSON.parse(list);
	if(!rosterList || rosterList.length <= 0)
		return;
	
	for(var i = 0; i < rosterList.length; i++){
		var roster = new SNSRoster(rosterList[i].id);
		roster.name = rosterList[i].name;
		roster.ask = rosterList[i].ask;
		roster.photoUrl = rosterList[i].photo;// ? rosterList[i].photo : SNSConfig.USER.DEFAULT_AVATAR;
		roster.subscription = rosterList[i].subscription;

		if(roster.subscription != SNS_SUBSCRIBE.BOTH)
			continue;
		
		var groupNames = rosterList[i].group;
		if(!groupNames || groupNames.length == 0){
			roster.addToGroup(this.groupList.getGroup(SNSConfig.GROUP.GROUP_NONE), true);
		}else{
			for (var j = 0; j < groupNames.length; j++) {
				var group = this.groupList.getGroup(groupNames[j]);
				if(!group){
					group = this.groupList.addGroup(groupNames[j]);
				}
				roster.addToGroup(group, true);
			}
		}
		this.addRoster(roster);
	}
	
	this.requestRosterVCards();
};

/**
 * 添加联系人到user的rosterList中，如果包含group，则会放到相应的group中。 若已经存在，则完全覆盖之前的roster对象，包括group.recent 添加成功后激发全局事件ON_ADD_ROSTER，事件的参数包括新旧roster
 * @param roster {SNSSRoster} 被添加的联系人
 */
SNSUser.prototype.addRoster = function(roster, ignoreCompare) {
	var old = this.getRoster(roster);

	if (!ignoreCompare && old == roster)
		return;

	this.rosterList.add(roster);

	SNSApplication.getInstance().getGlobalEventManager().trigger(SNS_EVENT_SUBJECT.ON_ADD_ROSTER, [ {
		newValue : roster,
		oldValue : old
	} ]);

};

/**
 * 如果已存在，则直接返回roster对象；不存在则新建并返回roster
 * @param id
 * @param resource
 * @return {SNSRoster}
 */
SNSUser.prototype.getOrCreateRoster = function(id, resource) {
	var roster = this.getRoster(id);
	if (!roster) {
		roster = new SNSRoster(id);
		if(resource)
			roster.resource = resource;
		this.addRoster(roster);
	}
	return roster;
};

/**
 * 返回对应jid的联系人
 * @param oArg {JSJaCJID | string }
 * @returns
 */
SNSUser.prototype.getRoster = function(id) {
	var roster = this.deviceList.get(id);
	if(roster)
		return roster;
	if(this.systemRoster.getID() == id)
		return this.systemRoster;
	return this.rosterList.get(id);
};

/**
 * 返回对应jid的联系人或聊天室
 * @param jid 可以为完整JID或者不包含resource的jid, 或者roster对象或者chatRoom对象
 * @returns
 */
SNSUser.prototype.getRosterOrChatRoom = function(oArg) {
	if (this.getRoster(oArg)) {
		return this.getRoster(oArg);
	}
	return this.chatRoomList.getChatRoom(oArg);
};

SNSUser.prototype.getRoom = function(id){
	return this.chatRoomList.getChatRoom(id);
};
/**
 * 好友关系更新，如果为both则为新增加好友
 * @param arg { from: node@domain/resource,	type: "subscribe", name, ask , group: Array<String>}
 */
SNSUser.prototype.rosterUpdateHandler = function(arg){
	var rosterId = arg.from;
	
	var roster = this.getRoster(rosterId);

	if(!roster){
		roster = new SNSRoster(rosterId);
		if(!arg.group || arg.group.length == 0){
			roster.addToGroup(this.groupList.getGroup(SNSConfig.GROUP.GROUP_NONE), true);
		}else{
			for (var i = 0; i < arg.group.length; i++) {
				var group = this.groupList.getGroup(arg.group[i]);
				if(!group){
					group = this.groupList.addGroup(arg.group[i]);
				}
				roster.addToGroup(group, true);
			}
		}
	}
	// 之前就已经是好友了，有可能是备注或者组的变化收到该包
	if(roster.subscription == SNS_SUBSCRIBE.TO || roster.subscription == SNS_SUBSCRIBE.BOTH){
		// 被好友删除
		if(arg.type == SNS_SUBSCRIBE.NONE){
			roster.subscription = arg.type;
			SNSApplication.getInstance().getGlobalEventManager().trigger(SNS_EVENT_SUBJECT.ON_REMOVE_ROSTER, [ {roster:roster} ]);
		}
		return;
	}
	
	roster.ask = arg.ask;
	roster.name = arg.name ? arg.name : roster.getID();
	roster.subscription = arg.type;
	if(roster.subscription == SNS_SUBSCRIBE.TO || roster.subscription == SNS_SUBSCRIBE.BOTH){
		this.addRoster(roster, true);
		// 新增加好友
		SNSApplication.getInstance().getGlobalEventManager().trigger(SNS_EVENT_SUBJECT.ON_APPROVE_SUBSCRIBED, [roster]);
	}
};

SNSUser.prototype.getGroupList = function(){
	return this.groupList;
};

SNSUser.prototype.getRosterListByGroup = function(group){
	return this.groupList.getGroup(group);
};

/**
 * 从本地删除好友
 * @param roster
 */
SNSUser.prototype.removeRosterFromLocal = function(roster){
	this.rosterList.remove(roster.id);
	for(var groupName in this.groupList._list){
		this.groupList._list[groupName].remove(roster.id);
	}
};

/**
 * 请求公共号列表的回调函数
 * @param list {JSON}
 */
SNSUser.prototype.pubAccountListHandler = function(list){
	var pubAccountList = JSON.parse(list);
	if(!pubAccountList || pubAccountList.length <= 0)
		return;
	
	for(var i = 0; i < pubAccountList.length; i++){
		var pubAccount = new SNSPublicAccountRoster(pubAccountList[i].id);
		pubAccount.name = pubAccountList[i].name;
		this.addRoster(pubAccount);
	}
};

/**
 * 获取没有app key和etp key的node
 */
SNSUser.prototype.getID = function(){
	return this.id;
};

/**
 * 本地搜索，如果searchRoster和searchChatRoom均为空，则都搜索
 * @param keyword
 * @param searchRoster boolean 是否搜索本地好友
 * @param searchChatRoom boolean 是否搜索本地群组
 */
SNSUser.prototype.localSearch = function(keyword, searchRoster, searchChatRoom) {
	this._localSearchResult = [];
	if(!keyword)
		return null;
	if(searchRoster == undefined && searchChatRoom == undefined){
		return this.localSearch(keyword, true, true);
	}
	if(searchRoster || searchChatRoom){
		if(searchRoster){
			match(this.rosterList._list);
		}
		if(searchChatRoom){
			match(this.chatRoomList._list);
		}
		return this._localSearchResult;
	}
	return this._localSearchResult;
	
	function match(list){
		for(var jid in list){
			var name = list[jid].name;
			if(name.indexOf(keyword, 0) >= 0){
				SNSApplication.getInstance().getUser()._localSearchResult.push(list[jid]);
			}
		}
	}
};
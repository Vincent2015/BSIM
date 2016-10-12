var SNSRoster = function(id, name) {

	/**
	 * @description {string} 联系人的备注名，若没有备注名，则和jid中的Node相同
	 * @field
	 */
	this.name;

	/**
	 * @description {JSJaCJID} 联系人身份标识
	 * @field
	 */
	this.id;

	// 好友列表中直接返回头像url，无需请求vcard
	this.photoUrl;
	
	/**
	 * @description {SNSVCard} 联系人电子名片
	 * @field
	 */
	this.vcard;

	/**
	 * @description {SNSPresence} 联系人在线状态信息
	 * @field
	 */
	this.presence = new SNSPresence();

	/**
	 * @description {SNSGroup[]} 联系人所在用户的分组列表
	 * @field
	 */
	this.groups = new Array();

	/**
	 * @description {string} 联系人和用户的订阅关系，默认为NONE
	 * @field
	 */
	this.subscription = SNS_SUBSCRIBE.NONE;
	
	this.resource;

	/**
	 * @description {string} 若该联系人接收到用户的订阅请求且未答复，该属性的值为subscribe,否则为空字符串
	 * @field
	 */
	this.ask = '';

	if (id) {
		this.id = id;
		this.name = name? name : id;
	}

	this._queryingVCard = false;
	this._vcardDefer;
};

SNSRoster.prototype.getPhotoUrl = function() {
	return this.photoUrl ? YYIMChat.getFileUrl(this.photoUrl) : SNSConfig.USER.DEFAULT_AVATAR;
}

/**
 * 修改联系人备注，并提交到服务器
 * @param {string} name, 新的备注名
 * @throws 如果更改失败将抛出异常
 * @returns {jQuery.Deferred} 延迟对象，方便获取返回信息
 */
SNSRoster.prototype.rename = function(name) {
	SNSRoster.checkName(name);
	this.name = name;
	return this.update();
};

/**
 * 将联系人添加的指定的分组， 并提交到服务器
 * @param group
 * @returns {jQuery.Deferred} 延迟对象，方便获取返回信息
 */
SNSRoster.prototype.addToGroup = function(group, ignoreUpdate) {
	if (group && group instanceof SNSGroup) {
		for (var i = 0; i < this.groups.length; i++) {
			if (this.groups[i].name == group.name) {
				return;
			}
		}
		this.groups.push(group);
		group.add(this);
		if(ignoreUpdate)
			return;
		return this.update();
	}
};

/**
 * 将联系人添加的指定的分组， 并提交到服务器
 * @param group {SNSGroup}
 * @returns {jQuery.Deferred} 延迟对象，方便获取返回信息
 */
SNSRoster.prototype.removeFromGroup = function(group) {
	if (group && group instanceof SNSGroup) {
		for (var i = 0; i < this.groups.length; i++) {
			if (this.groups[i].name == group.name) {
				group.remove(this);
				this.groups.splice(i, 1);
				return;
			}
		}
		return this.update();
	}
};

/**
 * 将联系人添加的指定的分组， 并提交到服务器
 * @param group {SNSGroup}
 * @returns {jQuery.Deferred} 延迟对象，方便获取返回信息
 */
SNSRoster.prototype.moveBetweenGroups = function(srcGroup, targetGroup) {
	for (var i = 0; i < this.groups.length; i++) {
		if (this.groups[i].name == srcGroup.name) {
			this.groups.splice(i, 1);
			srcGroup.remove(this.getID());
		}
	}
	this.groups.push(targetGroup);
	targetGroup.add(this);
	return this.update();
};

/**
 * 提交联系人信息到服务器，包括备注名改变，分组改变
 */
SNSRoster.prototype.update = function() {
	var defer = jQuery.Deferred(),
		_groups = [],
		i = this.groups.length;
	while(i--) 
		_groups.push(this.groups[i].name)

	YYIMChat.updateRosterItem({
		roster : {
			id : this.getID(),
			name : this.name,
			groups : _groups
		},
		success : function() {
			defer.resolve();
		},
		error : function() {
			defer.reject();
		}
	});

	return defer.promise();
};

/**
 * 改变roster的在线状态信息， 同时发送全局事件通知ON_ROSTER_PRESENCE_CHANGE
 * @param {SNSPresence} presence 出席信息对象
 */
SNSRoster.prototype.setPresence = function(presence) {
	if (presence && presence instanceof SNSPresence && presence != this.presence) {
		var old = this.presence;
		this.presence = presence;

		SNSApplication.getInstance().getGlobalEventManager().trigger(SNS_EVENT_SUBJECT.ON_ROSTER_PRESENCE_CHANGE, [ {
			target : this,
			newValue : this.presence,
			oldValue : old
		} ]);

	}
};

SNSRoster.prototype.changePhoto = function(photo) {
	this.photoUrl = photo;
	
	SNSApplication.getInstance().getGlobalEventManager().trigger(SNS_EVENT_SUBJECT.ON_ROSTER_PHOTO_CHANGE, [{
		photo : photo,
		rosterId : this.getID()
	}]);
};

SNSRoster.prototype.getVCard = function() {
	if (this.vcard) {
		return this.vcard;
	}
};

/**
 * 当vcard加载完毕后执行操作
 * @param {object} scope 执行callback的上下文环境
 * @param {function} callback 被执行的函数
 * @param {arguments|array} 数组或者arguments对象
 */
SNSRoster.prototype.whenVCardDone = function(scope, callback, arg) {
	if (this.vcard) {
		callback.apply(scope, arg);
		return;
	}
	jQuery.when(this.queryVCard()).done(function() {
		callback.apply(scope, arg);
	}).fail(function() {
		throw "execute error";
	});
}

/**
 * 使用jQuery的延迟对象Deferred();
 * @Param
 * @returns jQuery.Deferred对象，使用方式如下： jQuery.when(roster.queryVCard()).done(function(){ //do something });
 * @throws 如果查询失败将抛出异常或jQuery.deferred.reject对象
 */
SNSRoster.prototype.queryVCard = function() {
	if (this._queryingVCard) {
		return this._vcardDefer;
	}
	this._queryingVCard = true;

	this._vcardDefer = jQuery.Deferred();
	var that = this;
	YYIMChat.getVCard({
		id : that.getID(),
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
}

/**
 * 设置联系人的vcard属性，同时发送触发全局事件通知,包括before_vcard_change和after_vcard_change
 * @param {SNSVCard} vcard
 */
SNSRoster.prototype.setVCard = function(vcard) {
	this.vcard = vcard;
};

/**
 * 检查用户设置的备注名， 如果不符合规范则抛出异常，特殊字符配置
 * @See SNSConfig.ROSTER.NAME_FORBIDDEN
 * @param {string} name 被检查的备注名
 * @Throws 名称不符合规范时
 */
SNSRoster.checkName = function(name) {
	if (!name || name === '')
		throw "rostername cannot be empty ";
	for (var i = 0; i < SNSConfig.ROSTER.NAME_FORBIDDEN.length; i++) {
		if (name.indexOf(SNSConfig.ROSTER.NAME_FORBIDDEN[i]) != -1) {
			throw "forbidden char in rostername: " + SNSConfig.ROSTER.NAME_FORBIDDEN[i];
		}
	}
};

/**
 * 对比两个联系人对象是否相同
 * @param roster 要比较的对象
 */
SNSRoster.prototype.equals = function(roster) {
	if (roster && roster instanceof SNSRoster) {
		if (!this.jid.isEntity(roster.jid) || this.name != roster.name || this.subscription != roster.subscription
				|| this.presence.show != roster.presence.show) {
			return false;
		}
		var matchNum = 0;
		if (this.groups.length == roster.groups.length) {
			for (var i = 0; i < this.groups.length; i++) {
				for (var m = 0; m < roster.groups.length; m++) {
					if (this.groups[i].name == roster.groups[m].name) {
						matchNum++;
						break;
					}
				}
			}
			if (matchNum == roster.groups.length) {
				return true;
			}
			return false;
		}
		return false;
	}
	return false;
};

/**
 * 获取没有app key和etp key的node
 */
SNSRoster.prototype.getID = function(){
	return this.id;
};

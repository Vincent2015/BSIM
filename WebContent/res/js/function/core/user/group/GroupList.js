/**
 * 保存联系人的分组信息
 * @class SNSGroupList
 */
var SNSGroupList = function() {
	this.groupNone = new SNSGroup(SNSConfig.GROUP.GROUP_NONE);
	this.publicServiceGroup = SNSPublicServiceGroup.getInstance();
	this.deviceGroup = new SNSDeviceGroup();
	this.addGroup(this.groupNone);
	this.addGroup(this.publicServiceGroup);
	this.addGroup(this.deviceGroup);
}

SNSGroupList.prototype = new SNSBaseList();

/**
 * @param group {string|SNSGroup}
 * @returns {SNSGroup}
 */
SNSGroupList.prototype.getGroup = function(group) {
	if (group) {
		if (typeof group == "string") {
			return this.get(group);
		} else if (group instanceof SNSGroup) {
			return this.get(group.name);
		}
	}
};

/**
 * 判断是否存在指定名称的分组
 * @param groupName 指定的分组名称
 * @returns {boolean} 是否已存在分组
 */
SNSGroupList.prototype.contains = function(group) {
	if (group) {
		if (typeof group == "string") {
			return SNSBaseList.prototype.contains.call(this, group);
		} else if (group instanceof SNSGroup) {
			return SNSBaseList.prototype.contains.call(this, group.name);
		}
	}
};

/**
 * 添加指定名称的分组，若分组以存在则直接返回
 * @param group {SNSGroup|String} 被添加的Group的名称
 * @returns {SNSGroup}
 */
SNSGroupList.prototype.addGroup = function(group) {

	if (this.contains(group))
		return this.get[group];

	if (group) {
		if (typeof group == "string") {
			SNSGroupList.checkGroupName(group);
			var group = new SNSGroup(group);
			this.add(group.name, group);
			return group;
		} else if (group instanceof SNSGroup) {
			this.add(group.name, group);
			return group;
		}
	}

};

/**
 * 添加联系人，并且根据联系人中的分组信息，将用户添加到相应的group的rosterList中
 * @param roster 被添加的联系人
 */
SNSGroupList.prototype.addRoster = function(roster) {
	if (roster && roster instanceof SNSRoster) {
		for (var i = 0; i < roster.groups.length; i++) {
			var group = this.getGroup(roster.groups[i]);
			if (!group) {
				group = this.addGroup(roster.groups[i]);
			}
			group.add(roster);
		}
	}
};

/**
 * 返回分组的数组形式
 * @returns {SNSGroup[]}
 */
SNSGroupList.prototype.toArray = function() {
	var groups = [];
	for ( var group in this._list) {
		if (this._list[group] && this._list[group] instanceof SNSGroup) {
			groups.push(this._list[group]);
		}
	}
	return groups;
};

/**
 * 检查用户设置的备注名， 如果不符合规范则抛出异常，特殊字符配置
 * @See SNSConfig.GROUP.NAME_FORBIDDEN
 * @param {string} name 被检查的备注名
 * @Throws 分组名称不符合规范时
 */
SNSGroupList.checkGroupName = function(name) {
	if (!name || name === '')
		throw "groupname cannot be empty ";
	for (var i = 0; i < SNSConfig.GROUP.NAME_FORBIDDEN.length; i++) {
		if (name.indexOf(SNSConfig.GROUP.NAME_FORBIDDEN[i]) != -1) {
			throw "forbidden char in groupname: " + SNSConfig.GROUP.NAME_FORBIDDEN[i];
		}
	}
}

/**
 * 移动或复制好友
 * @param oArg jid srcGroupName dstGroupName type
 * @returns 可用组名列表
 */
SNSGroupList.prototype.moveRoster = function(roster, operation, srcGroup, targetGroup) {

	if (operation == SNS_MOVE_ROSTER_TYPE.MOVE) {
		roster.moveBetweenGroups(srcGroup, targetGroup);
	} else if (operation == SNS_MOVE_ROSTER_TYPE.COPY) {
		this.getGroup(targetGroup).addRoster(roster);
	}
};

/**
 * 获取不包含id所属用户的组名, 用户可被移动和复制到的组，不包含“未分组”
 * @param rosterId
 * @returns 可用组名列表
 */
SNSGroupList.prototype.availableGroups = function(rosterId) {

	var avaGroups = new Array();
	for ( var group in this._list) {
		if (this._list[group].editable && !this._list[group].contains(rosterId) && group !== SNSConfig.GROUP.GROUP_NONE) {
			avaGroups.push(this._list[group]);
		}
	}
	return avaGroups;
};

/**
 * 用户的联系人分组
 * @Class SNSGroup
 * @constructor {string} name 分组的名称
 */
var SNSGroup = function(name) {
	/**
	 * 分组的名称
	 * @Param {string}
	 */
	this.name = name;
	this.editable = true; // 可以移动和复制好友至该分组
};

SNSGroup.prototype = new SNSBaseRosterList();

/**
 * 获取该分组中在线总人数
 * @return {Number}
 */
SNSGroup.prototype.getOnlineNumber = function(){
	var num = 0;
	for(var roster in this._list){
		if(this._list[roster] && this._list[roster] instanceof SNSRoster){
			var status  = this._list[roster].presence.status;
			if (status != SNS_STATUS.UNAVAILABLE){
				num++;
			}
		}
	}
	return num;
};

/**
 * 获取该分组中在线的联系人列表
 * @returns {SNSRoster[]}
 */
SNSGroup.prototype.getOnlineRosters = function(){
	var rosters = [];
	for(var roster in this._list){
		if(roster && roster instanceof SNSRoster){
			var status  = roster.presence.status;
			if (status != SNS_STATUS.UNAVAILABLE){
				rosters.push(roster);
			}
		}
	}
	return rosters;   
};

/**
 * 向该分组中添加联系人
 * @param roster {SNSRoster} 被添加的联系人对象
 */
SNSGroup.prototype.addRoster = function(roster){
	roster.addToGroup(this);
};

/**
 * 从该分组中删除联系人
 * @param roster {SNSRoster} 被添加的联系人对象
 */
SNSGroup.prototype.removeRoster = function(roster){
	if(roster && roster instanceof SNSRoster){
		roster.removeFromGroup(this);
	}
};


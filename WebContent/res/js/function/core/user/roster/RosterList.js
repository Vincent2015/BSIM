/**
 * 存储用户的联系人列表，提供CRUD方法，和其他过滤方法。
 * 
 * @Class SNSRosterList
 */
var SNSRosterList = function() {
};

SNSRosterList.prototype = new SNSBaseRosterList();

/**
 * 返回在线的联系人，出席状态show可以为available, away, dnd, xa
 * 
 * @return {SNSRoster[]} 按照SHOW_PRIORITY中的权重值从小到大排序好的在线联系人列表
 */
SNSRosterList.prototype.getOnlineRosters = function() {
	var rosters = [];
	for ( var roster in this.list) {
		var status = roster.presence.status;
		if (status != SNS_STATUS.UNAVAILABLE) {
			rosters.push(roster);
		}
	}
	
	return this.sortByStatus(rosters);
};

SNSRosterList.prototype.sortByStatus = function(array){
	if(!array){
		var list = this.toArray().sort(sort);
		return list;
	}
	if(array && array instanceof Array ){
		var result = array.sort(sort);
		return result;
	}
	
	function sort(r1, r2){
		return SNS_SHOW_PRIORITY[r1.presence.status.toUpperCase()] - SNS_SHOW_PRIORITY[r2.presence.status.toUpperCase()];
	}
}

/**
 * 返回出席状态为available的联系人
 * 
 * @return {SNSRoster[]}
 */
SNSRosterList.prototype.getAvailableRosters = function() {
	var rosters = [];
	for ( var roster in this.list) {
		var status = roster.presence.status;
		if (status == SNS_STATUS.AVAILABLE) {
			rosters.push(roster);
		}
	}
	return rosters;
};

/**
 * 获取指定订阅关系的联系人
 * 
 * @param {string...} 指定的订阅关系，可以为多个，使用不定参数
 * @See SNS_SUBSCRIBE
 * @return {SNSRoster[]}
 */
SNSRosterList.prototype.getRostersBySubscription = function(sub1, sub2, sub3) {
	var rosters = [];
	for ( var roster in this.list) {
		var sub = roster.subscription;
		for (var i = 0; i < arguments.length; i++) {
			if (argumetns[i] == sub) {
				rosters.push(roster);
			}
		}
	}
	return rosters;
};
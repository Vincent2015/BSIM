var SNSPublicServiceGroup = function(){
	this.name=SNSConfig.GROUP.GROUP_PUB_ACCOUNT;
	this.editable = false; // 主要用于不能移动和复制好友至该分组
};

SNSPublicServiceGroup.prototype = new SNSGroup();

SNSPublicServiceGroup.getInstance = function(){
	if(!SNSPublicServiceGroup._instance){
		SNSPublicServiceGroup._instance = new SNSPublicServiceGroup();
	}
	return SNSPublicServiceGroup._instance;
};

/**
 * 向该分组中添加联系人
 * @param roster {SNSRoster} 被添加的联系人对象
 */
SNSPublicServiceGroup.prototype.addRoster = function(roster){
	this.add(roster);
};
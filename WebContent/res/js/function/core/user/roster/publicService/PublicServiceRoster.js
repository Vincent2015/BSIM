var SNSPublicServiceRoster = function(){
	this.jid;
	this.name;
	this.groups = [SNSPublicServiceGroup.getInstance()];
	// 无需显示状态
	this.presence.show = "none";
	this.subscription = SNS_SUBSCRIBE.BOTH;
};

SNSPublicServiceRoster.prototype = new SNSRoster();

SNSPublicServiceRoster.prototype.getPhotoUrl = function(){
	return SNSConfig.ROSTER.MY_TASK_DEFAULT_AVATAR;
};
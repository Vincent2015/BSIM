var SNSPublicAccountRoster = function(id, name){
	this.id = id;
	this.name = name? name : "公共号";
	this.accountName;
	// 无需显示状态
	this.presence.show = "none";
	this.groups = [SNSPublicServiceGroup.getInstance()];
	this.subscription = SNS_SUBSCRIBE.BOTH;
	this.photoUrl;
	SNSPublicServiceGroup.getInstance().addRoster(this);
};

SNSPublicAccountRoster.prototype = new SNSRoster();

SNSPublicAccountRoster.prototype.getPhotoUrl = function(){
	return this.photoUrl ? YYIMChat.getFileUrl(this.photoUrl) : SNSConfig.ROSTER.PUB_ACCOUNT_DEFAULT_AVATAR;
};

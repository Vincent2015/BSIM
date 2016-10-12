var SNSWorkflowRoster = function(){
	this.jid = new JSJaCJID("workflow@"+SNSApplication.getInstance().getDomain());
	this.name = "我的任务";
	// 不查询vcard，因此先设非空值
	this.vcard = new SNSVCard();
	SNSPublicServiceGroup.getInstance().addRoster(this);
};

SNSWorkflowRoster.prototype = new SNSPublicServiceRoster();


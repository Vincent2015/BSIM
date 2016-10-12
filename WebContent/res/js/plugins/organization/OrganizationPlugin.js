var SNSOrganizationPlugin = function(){
	this.name="organization";
	this.loadPeriod = SNS_EVENT_SUBJECT.AFTER_CONNECT;
	this.organizationTab;
	this.enable=true;
};

SNSOrganizationPlugin.prototype = new SNSPlugin();

SNSOrganizationPlugin.prototype._init = function(){
	if(!SNSOrganizationPlugin._instance){
		SNSOrganizationPlugin._instance = this;
	}
	this.organizationTab = new SNSOrganizationTab();
	SNSIMWindow.getInstance().getWideWindow().addTab(this.organizationTab);
	SNSPlugin.prototype._init.call(this);
};

SNSOrganizationPlugin.getInstance = function(){
	return SNSOrganizationPlugin._instance;
};
//new SNSOrganizationPlugin().start();
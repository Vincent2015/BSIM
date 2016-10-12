var SNSSystemConfigTab = function(){
	this.name="systemConfigTab";
	
	this.headSelector = "#snsim_system_config_head";
	this.contentSelector = "#snsim_system_config_content";
};

SNSSystemConfigTab.prototype = new SNSTab();

SNSSystemConfigTab.prototype._init = function(){
	// TODO
	SNSTab.prototype._init.call(this);
};
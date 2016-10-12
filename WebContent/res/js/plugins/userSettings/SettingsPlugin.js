var SNSSettingsPlugin = function() {
	
	this.name="settingsPlugin";
	
	this.enable = true;

	this.settingsWindow;

	this.triggerBtn;
	
	this.loadPeriod = SNS_EVENT_SUBJECT.AFTER_CONNECT;
	
};

SNSSettingsPlugin.prototype = new SNSPlugin();

SNSSettingsPlugin.prototype._init = function() {
	SNSSettingsPlugin._instance = this;
	

	this.triggerBtn = new SNSTriggerBtn();
	this.settingsWindow = new SNSSettingsWindow();
	this.triggerBtn.selector = "#snsim_settings_trigger_btn";
	this.triggerBtn.html = '<a id="snsim_settings_trigger_btn" class="system_config" title="设置"> </a>';
	this.triggerBtn.containerSelector = "#snsim_wide_window_bottom_container";
	this.triggerBtn.target = this.settingsWindow;

	this.triggerBtn._init();
	this.settingsWindow._init();
	
	SNSPlugin.prototype._init.call(this);
};

SNSSettingsPlugin.getInstance = function(){
	return SNSSettingsPlugin._instance;
}
new SNSSettingsPlugin().start();


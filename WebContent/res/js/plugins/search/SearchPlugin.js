var SNSSearchPlugin = function() {
	
	this.name="searchPlugin";
	
	this.enable = true;

	this.searchWindow;
	this.localSearchPanel;

	this.triggerBtn;
	
	this.loadPeriod = SNS_EVENT_SUBJECT.AFTER_CONNECT;
	
};

SNSSearchPlugin.prototype = new SNSPlugin();

SNSSearchPlugin.prototype._init = function() {
	SNSSearchPlugin._instance = this;
	
	this.searchWindow = new SNSSearchWindow();
	this.localSearchPanel = new SNSLocalSearchPanel();

	this.triggerBtn = new SNSTriggerBtn();
	this.triggerBtn.selector = "#snsim_multi_search_trigger_btn";
	this.triggerBtn.html = '<a id="snsim_multi_search_trigger_btn" class="multi_search" title="查找"> </a>';
	this.triggerBtn.containerSelector = "#snsim_wide_window_bottom_container";
	this.triggerBtn.target = this.searchWindow;
	this.searchWindow._init();
	this.localSearchPanel._init();
	this.triggerBtn._init();
	
	SNSPlugin.prototype._init.call(this);
};

SNSSearchPlugin.getInstance = function(){
	return SNSSearchPlugin._instance;
}
new SNSSearchPlugin().start();


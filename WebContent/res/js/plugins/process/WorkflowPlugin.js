var SNSWorkflowPlugin = function() {

	this.name = "workflow";

	this.loadPeriod = SNS_EVENT_SUBJECT.AFTER_CONNECT;
	this.enable = true;

	this.workflowRoster;
	this.workflowMessageFilter;

};

SNSWorkflowPlugin.queryUrl = "http://172.20.5.212:9090/wfMessage";

SNSWorkflowPlugin.prototype = new SNSPlugin();

SNSWorkflowPlugin.prototype._init = function() {
	SNSApplication.getInstance().getGlobalEventManager().registerEventHandler(SNS_EVENT_SUBJECT.ON_CURRENT_CHAT_CHANGE, true,
			this.onCurrentChatChange, this);
	
	this.workflowMessageFilter = new SNSWorkflowMessageFilter();
	this.workflowMessageFilter.start();

	this.workflowRoster = new SNSWorkflowRoster();
	SNSApplication.getInstance().getUser().addRoster(this.workflowRoster);

	SNSPlugin.prototype._init.call(this);
};

SNSWorkflowPlugin.prototype.onCurrentChatChange = function(event, data){
	var oldValue = data.oldValue;
	var newValue = data.newValue;
	if(newValue.getTarget() instanceof SNSWorkflowRoster){
		
		var messageTab = newValue.tabContainer.getTab("todo");
		if(!messageTab){
			newValue.tabContainer.addTab(new SNSInnerMessageTab(newValue.getTarget()));
		}
		
		var todoTab = newValue.tabContainer.getTab("todo");
		if(!todoTab){
			newValue.tabContainer.addTab(new SNSWorkflowTodoTab(newValue.getTarget()));
		}
	}
	
};

SNSWorkflowPlugin.prototype.openIframeWindow = function(event) {
	var url = event.data.url;
	var id = event.data.id;
	var iframePanel = new SNSIFrameFloatPanel(url, id, 600, 400);
	iframePanel.show();
};

//new SNSWorkflowPlugin().start();
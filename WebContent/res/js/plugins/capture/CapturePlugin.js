var SNSCapturePlugin = function() {
	
	this.name="capturePlugin";
	
	this.enable = true;

	this.triggerBtn;
	
	this.loadPeriod = SNS_EVENT_SUBJECT.AFTER_CONNECT;
	
};

SNSCapturePlugin.prototype = new SNSPlugin();

SNSCapturePlugin.prototype._init = function() {
};

SNSCapturePlugin.getInstance = function(){
	return SNSCapturePlugin._instance;
}
new SNSCapturePlugin().start();


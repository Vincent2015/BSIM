var SNSWindow = function(opt) {
	this.type = "window";
	this.mask = (opt && opt.mask) ? opt.mask : false;
};

SNSWindow.prototype = new SNSFloatPanel();
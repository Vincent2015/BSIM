var SNSSkinPlugin = function(){
	this.name = "skin";
	this.enable = true;

	this.loadPeriod = SNS_EVENT_SUBJECT.AFTER_CONNECT;
	
	this._skinFolder = 'res/skin/';
	this.skins = {
		'dark': this._skinFolder + 'dark/css/extend_common.css'
	};
	this._nodeType = 'snsim_css';
};

SNSSkinPlugin.prototype = new SNSPlugin();

SNSSkinPlugin.prototype._init = function(){
	if(SNSSkinPlugin.getInstance())
		return;
	SNSSkinPlugin._instance = this;
	
};

SNSSkinPlugin.getInstance = function(){
	return SNSSkinPlugin._instance;
};

new SNSSkinPlugin().start();

SNSSkinPlugin.prototype.changeSkin = function(name) {
	// 如果已经应用皮肤, 则恢复默认, 仅适于两套皮肤
	var linkNodes = jQuery('link[node-type="' + this._nodeType + '"]');
	if(linkNodes && linkNodes.length > 0){
		linkNodes.remove();
		return;
	}
	if(name && this.skins[name]){
		var cssPath = this.skins[name];
		var node = document.createElement("link");
		node.setAttribute("rel", "stylesheet");
		node.setAttribute("type", "text/css");
		node.setAttribute("node-type", this._nodeType);
		node.setAttribute("href", cssPath);
		document.getElementsByTagName("body")[0].appendChild(node);
	}
};
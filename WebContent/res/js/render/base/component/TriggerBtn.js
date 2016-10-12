var SNSTriggerBtn = function(){
	
	this.selector;
	
	this.containerSelector;
	
	this.html;
	
	this.target;
	
};

SNSTriggerBtn.prototype = new SNSComponent();

SNSTriggerBtn.prototype._init = function(){
	this.getContainerDom().append(this.html);
	this.getDom().on("click", jQuery.proxy(this.onclick, this));
};

SNSTriggerBtn.prototype.onclick = function(event){
	this.target.show();
};


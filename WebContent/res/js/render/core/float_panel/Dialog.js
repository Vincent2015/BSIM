var SNSDialog = function(){
	this.selector = "#snsim_dialog";	
	this.titleSelector = "";
	this.iconSelector = ".snsim_cfmicon_stat";
	this.textSelector = ".txt";
	this.inputSelector = "input";
	this.btnOkSelector = ".snsim_btn_a";
	this.btnCancelSelector = ".snsim_btn_b";
	this.type = DIALOG_TYPE.ALERT;
	this._init();
};

var DIALOG_TYPE = {
	ALERT : 0,
	CONFIRM : 1,
	PROMPT : 2
};

SNSDialog.prototype = new SNSWindow({mask: true});

SNSDialog.prototype._init = function(){

	this.getDom().find(this.btnOkSelector).unbind();
	this.getDom().find(this.btnCancelSelector).unbind();
	this.getDom().find(this.btnCancelSelector).show();
	this.getDom().find(this.inputSelector).show();
	this.getDom().find(this.inputSelector).val("");
	
	this.getDom().find(this.btnCancelSelector).bind("click", jQuery.proxy(function(){
		this.hide();
	},this));
	this.hide();
};

//SNSDialog.prototype.hide = function(){
//	SNSWindow.prototype.hide.call(this);
//	this.getDom().find(this.btnOkSelector).unbind();
//	this.getDom().find(this.btnCancelSelector).unbind();
//	this.getDom().find(this.btnCancelSelector).show();
//	this.getDom().find(this.inputSelector).show();
//};

SNSDialog.prototype.set = function(type, text, cb, context){
	this._init();
	this.setText(text);
	this.setType(type);
	this.setCallback(cb, context);
	
	this.getDom().find(this.btnCancelSelector).bind("click", jQuery.proxy(function(){
		this.hide();
		SNSIMWindow.getInstance().cover.hide();
	},this));
};

SNSDialog.prototype.setType = function(type){
	this.type = type;
	switch(type){
	case DIALOG_TYPE.ALERT:
		this.getDom().find(this.btnCancelSelector).hide();
	case DIALOG_TYPE.CONFIRM:
		this.getDom().find(this.inputSelector).hide();
	case DIALOG_TYPE.PROMPT:
		break;
	default:
		break;
	}
};

SNSDialog.prototype.setText = function(text){
	this.getDom().find(this.textSelector).text(text);
};

SNSDialog.prototype.setCallback = function(cb, context){
	this.getDom().find(this.btnOkSelector).off("click").on("click", function(){
		cb.apply(context);
		SNSIMWindow.getInstance().cover.hide();
	});
};

// 取消事件
/*SNSDialog.prototype.setCancelCallback = function(cb, context){
	this.getDom().find(this.btnCancelSelector).off("click").on("click", function(){
		cb.apply(context);
		SNSIMWindow.getInstance().cover.hide();
	});
};*/

SNSDialog.prototype.getInput = function(){
	return this.getDom().find(this.inputSelector).val();
};
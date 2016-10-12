var SNSExpressionPanel = function(data){
	
	this.data = data;
	
	this.selector = "#snsim_expression_panel";
	
	this.hideFloat = SNSComponent.HIDE_TYPE.HIDE_IGNORE_SELF;
	
//	this.tabs = new SNSTabContainer();
	
	this.template = 
		'<div id="snsim_expression_panel" class="snsim_layer">'
	          +'<div>'
		          +'<table border="0" cellspacing="0" cellpadding="0">'
			          +'<tbody>'
				          +'<tr>'
					          +' <td>'
						          +'<div class="content snsim_layer_faces clearfix">'
							          +'<a class="snsim_icon_close snsim_layer_close"  href="javascript:void(0);"></a>'
							          +'<div class="detail">'
							          	+'<ul class="faces_list clearfix">##{{_getExpressionHtml()}}</ul>'
							          +'</div>'
						          +'</div>'
					          +'</td>'
				          +'</tr>'
			          +' </tbody>'
		          +' </table>'
	          +' </div>'
          +'</div>';
	
	this.expressionContainer = "#snsim_expression_panel .faces_list";
	
	this.expressionSelector = "ul.faces_list li";
	
	this.closeBtnSelector = "#snsim_expression_panel .snsim_icon_close";
	
	this.attachDom = "#expressionBtn";
	
	this.expressionTemplate = 
			'<li><a action-data="##{{actionData}}" href="javascript:void(0);" title="">'
			+ '<img node-type="expression" action-data="##{{actionData}}" src="##{{getSNSBasePath()}}##{{folder}}/##{{url}}"></a></li>';
		
};

SNSExpressionPanel.prototype = new SNSFloatPanel();

SNSExpressionPanel.prototype._init = function(){
	if (this.getDom().length == 0) {
		var html = this.buildHtml();
		jQuery("body").append(html);
		this._bindDomEvent();
		this._bindExpressionDomEvent();
	}
	
	 jQuery(this.attachDom).bind("click", jQuery.proxy(function(event){
		 if(this.getDom().length>0){
			 this.afterShow();
			 this.toggle();
		 }else{//表情窗口还没有初始化
			 this.show();
			 this.afterShow();
			 this._bindExpressionDomEvent();
		 };
		 event.stopPropagation();
	 },this));
	 
	SNSFloatPanel.prototype._init.call(this);
};

SNSExpressionPanel.prototype._getExpressionHtml = function(){
	var html = "";
	for(var i in this.data.DEFAULT.data){
		var item = this.data.DEFAULT.data[i];
		if(item && item.url){
			html+= TemplateUtil.genHtml(this.expressionTemplate, [item,{folder:this.data.DEFAULT.folder}]);
		}
	}
	return html;
};

SNSExpressionPanel.prototype.afterShow = function(){
	var offset = jQuery(this.attachDom).offset();
	this.getDom().css("top", offset.top-274);
	this.getDom().css("left", offset.left - 10);
};

SNSExpressionPanel.prototype._bindExpressionDomEvent = function(){
	var that = this;
	this.getDom().find(this.expressionSelector).bind("click", function() {
		// 将表情插入鼠标所在位置
		var html = jQuery(this).find("img")[0].outerHTML;
		SNSIMWindow.getInstance().getChatWindow().getSendBox().insertHtmlContent(html);
		that.hide();
	});
	jQuery(this.closeBtnSelector).bind("click", jQuery.proxy(this.hide, this));
};

SNSExpressionPanel.prototype.getTemplate = function(){
	return this.template;
}

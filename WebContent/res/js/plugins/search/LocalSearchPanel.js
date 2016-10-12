var SNSLocalSearchPanel = function(){
	this.selector = "#snsim_local_search";
	
	this.localSearchBtnSelector = "#snsim_local_search_btn";
	this.localSearchInputSelector = "#snsim_local_search_input";
	this.localSearchResultSelector = ".local_search_result";
	this.localSearchResultListSelector = ".snsim_local_search_result_list";
	
	this.resultItemTemplate = 
		'<li rosterId="##{{id}}">'
			+'<img src="##{{getPhotoUrl()}}">'
			+'<span class="user_name">##{{name}}</span>'
		+'</li>';
}; 

SNSLocalSearchPanel.prototype = new SNSComponent();

SNSLocalSearchPanel.prototype._init = function(){
	this.getDom().find(this.localSearchResultSelector).perfectScrollbar();
	this._bindDomEvent();
};

SNSLocalSearchPanel.prototype._bindDomEvent = function(){
	this.getDom().find(this.localSearchBtnSelector).bind("click", function(){
		
	});
	
	this.getDom().find(this.localSearchInputSelector).bind("keyup", jQuery.proxy(function(){
		this.renderResult(this.getDom().find(this.localSearchInputSelector).val());
	},this));
	
	/*
	 	input placeholder属性
	 	
		目前浏览器的支持情况
	
		浏览器	IE6/7/8/9	IE10+	Firefox	Chrome	Safari 
		是否支持	NO	YES	YES	YES	YES
		 
	
		然而，虽然IE10+支持placeholder属性，它的表现与其它浏览器也不一致
	
		IE10+里鼠标点击时（获取焦点）placeholder文本消失
		Firefox/Chrome/Safari点击不消失，而是键盘输入时文本消失
	*/
	this.getDom().find(this.localSearchInputSelector).bind("blur", function() {
		jQuery(this).attr('placeholder','查找联系人')
	});
	this.getDom().find(this.localSearchInputSelector).bind("focus", function() {
		jQuery(this).attr('placeholder','')
	});
};

SNSLocalSearchPanel.prototype.renderResult = function(keyword){
	this.getDom().find(this.localSearchResultListSelector).html("");//rongqb 20150626
	jQuery(this.localSearchResultSelector).removeClass('cover');
	if(keyword){
		var resultList =  SNSApplication.getInstance().getUser().localSearch(keyword);
		for(var i = 0; i < resultList.length; i++){
			var html = TemplateUtil.genHtml(this.resultItemTemplate, resultList[i]);
			this.getDom().find(this.localSearchResultListSelector).append(html);
		}
		
		if(resultList.length){ //rongqb 20150626
			jQuery(this.localSearchResultSelector).addClass('cover');
		}
		
		this.getDom().find(this.localSearchResultListSelector + " li").bind("click",function(event){
			var roster = SNSApplication.getInstance().getUser().getRosterOrChatRoom(jQuery(event.currentTarget).attr("rosterId"));
			SNSIMWindow.getInstance().getChatWindow().openChatWith(roster);
		});
	}
};
/**
 * 联系人的VCard展示面板
 * @Class SNSVCardPanel
 */
var SNSVCardPanel = function(roster) {
	this.roster = roster;
	this.selector = "#snsim_float_panel_vcard_"+roster.getID();
	SNSVCardPanel.panelList._add(this.roster.getID(), this);
	this.mouseover = false;
};

SNSVCardPanel.idPrefix = "snsim_float_panel_vcard_";
/**
 * vcard的浮动面板的模板
 * @static 
 */
SNSVCardPanel.template = 
	'<div id="'+ SNSVCardPanel.idPrefix +'##{{roster.getID()}}" class="roster_info" style="display:none;">'
		+ '<div class="snsim_list_head snsim_head_30 roster_info_head" >'
			+ '<img width="36" height="36" src="##{{roster.getPhotoUrl()}}" class="snsim_user_item_img">'
			+ '<div style="height: 39px; margin: -24px 0 -29px 60px;"><span class="user_name">##{{roster.name}}</span></div>' 
		+ '</div>'
		+ '<div class="snsim_vcard_info">'
			+'<ul class="snsim_vcard_info_basic">##{{buildInfoListHtml()}}' 
			+ '</ul>' 
		+ '</div>' 
	+ '</div>';

SNSVCardPanel.prototype = new SNSFloatPanel();
/**
 * 保存已经创建的浮动面板
 * @Type {SNSBaseList}
 */
SNSVCardPanel.panelList = new SNSBaseList();

/**
 * 根据联系人获取对应的VCard浮动面板，若不存在则新建一个
 * @param roster {SNSRoster|JSJaCJID|String}
 * @returns {SNSVCardPanel} 
 */
SNSVCardPanel.getInstance = function(roster){
	var rosterId = roster.id? roster.id: roster;
	var panel =  SNSVCardPanel.panelList._get(rosterId);
	if(!panel){
		if(!(roster instanceof SNSRoster)){
			roster = SNSApplication.getInstance().getUser().getRoster(rosterId);
		}
		return new SNSVCardPanel(roster);
	}
	return panel;
}

/**
 * 根据指定DOM对象的位置， 显示浮动面板, 显示之前触发BEFORE_VCARD_SHOW全局事件
 * @param dom {jQueryDom} 指定的DOM，面板出现的位置根据此DOM计算
 * @return {SNSVCardPanel}
 */
SNSVCardPanel.prototype.show = function(target) {
	if(this.roster instanceof SNSPublicAccountRoster || this.roster instanceof SNSPublicServiceRoster){
		return;
	}
	var that = this;
	if(!this.roster.vcard){
		jQuery.when(this.roster.queryVCard()).done(jQuery.proxy(function(){
			buildDom();
		},this));
	}else{
		buildDom();
		this.showWhenVcardRequest(target);
	}
	
	function buildDom() {
		if (that.getDom().length == 0) {
			var html = that.buildHtml();
			jQuery("body").append(html);
			that._bindDomEvent();
			if(that.mouseover){
				that.showWhenVcardRequest(target);
			}
		}
	}
};

SNSVCardPanel.prototype.showWhenVcardRequest = function(target){
	if(target){
		var offset = jQuery(target).offset();
		
		this.getDom().css("top",offset.top - 10);
		this.getDom().css("left",offset.left-230);
	}
	
	SNSComponent.prototype.show.call(this);
	//this.showing = false;
	return this;
};

/**
 * 为Dom绑定事件， 如mouseover  mouseout
 */
SNSVCardPanel.prototype._bindDomEvent = function(){
	//鼠标移到vcardPanel上， 展示VCard
	this.getDom().bind("mouseenter",{roster:this.roster}, function(event){
		var roster = event.data.roster;
		var vcardPanel = SNSVCardPanel.getInstance(roster);
		vcardPanel.mouseover = true;
		vcardPanel.show();
	});
	
	//鼠标移到vcardPanel外, 隐藏VCard
	this.getDom().bind("mouseleave",{roster:this.roster}, function(event){
		var roster = event.data.roster;
		var vcardPanel = SNSVCardPanel.getInstance(roster);
		vcardPanel.mouseover = false;
		vcardPanel.hide();
	});
};

/**
 * 根据用户的VCard中的信息拼接对应的HTML
 */
SNSVCardPanel.prototype.buildInfoListHtml = function() {
	
	var tpl = "";
	for (var i = 0; i < this.roster.vcard.showpropList.length; i++) {
		var prop = this.roster.vcard.showpropList[i];
		var propName = SNS_LANG_TEMPLATE["vcard_" + prop.replace(".", "_")];
		var propValue = this.roster.vcard[prop];
		var splitIndex = prop.indexOf(".");
		if (splitIndex != -1) {
			propValue = this.roster.vcard[prop.substr(0, splitIndex)][prop.substr(splitIndex + 1)];
		}
		
		propValue = propValue ? propValue : "";
		
		tpl += "<li><span style=\"color: #9fa5a7;\">" + propName + "</span><span style=\"color:rgb(80, 80, 80);margin-left: 22px;\">" + propValue + "</span></li>";
	}
	return tpl;
}

/**
 * 生成Panel对应的HTML字符串并返回
 * @returns {String} 该Panel对应的HTML字符串
 */
SNSFloatPanel.prototype.buildHtml = function() {
	return TemplateUtil.genHtml(this.getTemplate(), this);
};

SNSVCardPanel.prototype.getTemplate = function() {
	return SNSVCardPanel.template;
};
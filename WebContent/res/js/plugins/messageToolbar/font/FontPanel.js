var SNSFontPanel = function(){
	
	this.selector = "#snsim_font_panel";
	this.setFontFamilyBtnSelector = ".set_font_family";
	this.setFontSizeBtnSelector = ".set_font_size";
	this.setFontBoldBtnSelector = ".set_font_bold";
	this.setFontItalicBtnSelector = ".set_font_italic";
	this.setFontUnderLineBtnSelector = ".set_font_underline";
	this.insertDom = '#snsim_chat_sendbox_toolbar';
	
	this.hideFloat = SNSComponent.HIDE_TYPE.HIDE_IGNORE_SELF;
	this.template = 
		'<div id="snsim_font_panel" class="set_font_panel">'
          +'<select class="set_font_family"></select> <select class="set_font_size"></select>'
          +'<a class="set_font_bold" title="粗体"></a>'
          +'<a class="set_font_italic" title="斜体"></a>'
          +'<a class="set_font_underline" title="下划线"></a>'
          +'<input type="text" id="fontColorSelector" style="display: none;" />'
      +'</div>';
	
	this.attachDom = "#fontBtn";
};

SNSFontPanel.prototype = new SNSFloatPanel();
SNSFontPanel.prototype._init = function(){
	jQuery(this.attachDom).bind("click", jQuery.proxy(function(event){
		 if(this.getDom().length>0){
			 this.afterShow();
			 this.toggle();
		 }else{//表情窗口还没有初始化
			 this.show();
			 this.initFontStyles();
			 this.afterShow();
			 this._bindFontDomEvent();
		 };
		 event.stopPropagation();
	 },this));
	 
	SNSFloatPanel.prototype._init.call(this);
};

/**
 * 初始化字体和大小列表
 */
SNSFontPanel.prototype.initFontStyles = function(){
	for(var fontFamily in SNSMessageStyle.FONT_FAMILYS){
		this.getDom().find(this.setFontFamilyBtnSelector).append("<option value ='" + fontFamily + "'>" + SNSMessageStyle.FONT_FAMILYS[fontFamily] + "</option>");
	}
	
	for(var i = 12; i <= 30; i+=2){
		this.getDom().find(this.setFontSizeBtnSelector).append("<option value ='" + i + "'>" + i + "</option>");
	}
	
	if(jQuery("#snsim_font_panel .sp-replacer").length < 1){
		jQuery("#fontColorSelector").spectrum({
		    showPaletteOnly: true,
		    togglePaletteOnly: true,
		    togglePaletteMoreText: '更多',
		    togglePaletteLessText: '常用',
		    color: 'blanchedalmond',
		    palette: [
		        ["#000","#444","#666","#999","#ccc","#eee","#f3f3f3","#fff"],
		        ["#f00","#f90","#ff0","#0f0","#0ff","#00f","#90f","#f0f"],
		        ["#f4cccc","#fce5cd","#fff2cc","#d9ead3","#d0e0e3","#cfe2f3","#d9d2e9","#ead1dc"],
		        ["#ea9999","#f9cb9c","#ffe599","#b6d7a8","#a2c4c9","#9fc5e8","#b4a7d6","#d5a6bd"],
		        ["#e06666","#f6b26b","#ffd966","#93c47d","#76a5af","#6fa8dc","#8e7cc3","#c27ba0"],
		        ["#c00","#e69138","#f1c232","#6aa84f","#45818e","#3d85c6","#674ea7","#a64d79"],
		        ["#900","#b45f06","#bf9000","#38761d","#134f5c","#0b5394","#351c75","#741b47"],
		        ["#600","#783f04","#7f6000","#274e13","#0c343d","#073763","#20124d","#4c1130"]
		    ],
			move: function(color) {
				SNSIMWindow.getInstance().getChatWindow().getSendBox().getContentDom().css("color", color.toHexString());
				SNSMessageStyle.getInstance().color = color.toHexString();
			}
		});
		jQuery("#fontColorSelector").spectrum("show");
		jQuery("#fontColorSelector").spectrum("hide");
	}
};

SNSFontPanel.prototype.afterShow = function(){
	var offset = jQuery(this.attachDom).offset();
	this.getDom().css("top", offset.top-33);
	this.getDom().css("left", offset.left-12);
};

/**
 * 字体样式（family,size,bold,italic,underline）
 */
SNSFontPanel.prototype._bindFontDomEvent = function(){
	this.getDom().find(this.setFontFamilyBtnSelector).bind("change", function() {
		SNSIMWindow.getInstance().getChatWindow().getSendBox().getContentDom().css("font-family", SNSMessageStyle.FONT_FAMILYS[this.value]);
		SNSMessageStyle.getInstance().font = this.value;
	});
	this.getDom().find(this.setFontSizeBtnSelector).bind("change", function() {
		SNSIMWindow.getInstance().getChatWindow().getSendBox().getContentDom().css("font-size", this.value + "px");
		SNSMessageStyle.getInstance().size = this.value;
	});
	this.getDom().find(this.setFontBoldBtnSelector).bind("click", function() {
		var sendBoxContentDom = SNSIMWindow.getInstance().getChatWindow().getSendBox().getContentDom();
		if(sendBoxContentDom.hasClass("font_bold")){
			sendBoxContentDom.removeClass("font_bold");
			SNSMessageStyle.getInstance().biu -= SNSMessageStyle.BIU_TYPE.BOLD;
		}else{
			sendBoxContentDom.addClass("font_bold");
			SNSMessageStyle.getInstance().biu = SNSMessageStyle.BIU_TYPE.BOLD | SNSMessageStyle.getInstance().biu;
		}
	});
	this.getDom().find(this.setFontItalicBtnSelector).bind("click", function() {
		var sendBoxContentDom = SNSIMWindow.getInstance().getChatWindow().getSendBox().getContentDom();
		if(sendBoxContentDom.hasClass("font_italic")){
			sendBoxContentDom.removeClass("font_italic");
			SNSMessageStyle.getInstance().biu -= SNSMessageStyle.BIU_TYPE.ITALIC;
		}else{
			sendBoxContentDom.addClass("font_italic");
			SNSMessageStyle.getInstance().biu = SNSMessageStyle.BIU_TYPE.ITALIC | SNSMessageStyle.getInstance().biu;
		}
	});
	this.getDom().find(this.setFontUnderLineBtnSelector).bind("click", function() {
		var sendBoxContentDom = SNSIMWindow.getInstance().getChatWindow().getSendBox().getContentDom();
		if(sendBoxContentDom.hasClass("font_underline")){
			sendBoxContentDom.removeClass("font_underline");
			SNSMessageStyle.getInstance().biu -= SNSMessageStyle.BIU_TYPE.UNDERLINE;
		}else{
			sendBoxContentDom.addClass("font_underline");
			SNSMessageStyle.getInstance().biu = SNSMessageStyle.BIU_TYPE.UNDERLINE | SNSMessageStyle.getInstance().biu;
		}
	});
};

SNSFontPanel.prototype.getTemplate = function(){
	return this.template;
}
SNSFontPanel.prototype.getInsertDom = function() {
	return this.insertDom;
}

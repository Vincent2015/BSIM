/**
 * 所有组件类的基类 ,包含公共的属性声明和方法
 * @Class SNSComponent
 */
var SNSComponent = function() {
	this.type = "component";
	this.id;
	this.selector;
	this._jQueryDom;

	this.containerSelector;
	this._containerDom;

	this.triggerSelector;
	this._triggerDom;

	this.hideFloat = SNSComponent.HIDE_TYPE.IGNORE;
	
	// 透明div，拖动时防止鼠标选中其他元素
	this.transparentPanelSelector = "#snsim_coverlayer";
	// 当前是否在移动
	this.dragging = false;
	// 是否使用默认坐标
	this.useDefaultPosition = true;
	
	// 蒙板层
	this.maskLayerSelector = '#snsim_coverlayer';
	// 打开时是否屏蔽其他窗口
	this.maskOthers = false;
	this.oldZIndex = 0;
	// 新的z-index值在蒙板层z-index之上
	this.newZIndex = parseInt(jQuery(this.maskLayerSelector).css('z-index')) + 1;
};

SNSComponent.HIDE_TYPE = {
	HIDE : 0,
	IGNORE : 1,
	HIDE_IGNORE_SELF : 2
}

SNSComponent.prototype._init = function() {
	if (this.hideFloat == SNSComponent.HIDE_TYPE.HIDE) {
		SNSApplication.getInstance().getGlobalEventManager().registerEventHandler(SNS_EVENT_SUBJECT.HIDE_FLOAT, true,
				function(event, data) {
					if (!this.visible()) {
						return;
					}
					var target = jQuery(data.event.target);
					if (target === this.getTriggerDom() || target[0] === this.getTriggerDom()[0] || this.getTriggerDom().find(target).length > 0) {
						return;
					}
					this.hide();
				}, this);
	} else if (this.hideFloat == SNSComponent.HIDE_TYPE.HIDE_IGNORE_SELF) {
		SNSApplication.getInstance().getGlobalEventManager().registerEventHandler(SNS_EVENT_SUBJECT.HIDE_FLOAT, true,
				function(event, data) {
					if (!this.visible()) {
						return;
					}
					var target = jQuery(data.event.target);
					if (target === this.getTriggerDom() || target[0] === this.getTriggerDom()[0] || this.getTriggerDom().find(target).length > 0 || this.getDom().find(target).length > 0) {
						return;
					}
					this.hide();
				}, this);
	}
	
	if(this.mask) {
		this.oldZIndex = parseInt(this.getDom().css('z-index'));
		this.getDom().css('z-index', ++this.newZIndex);
	}
};

/**
 * 返回属性中selector对象的jQueryDom对象
 * @returns {jQueryDom}
 */
SNSComponent.prototype.getDom = function() {
	if (!this._jQueryDom || this._jQueryDom.length == 0) {
		this._jQueryDom = jQuery(this.selector);
	}
	return this._jQueryDom;
};

/**
 * 返回属性中selector对象的jQueryDom对象
 * @returns {jQueryDom}
 */
SNSComponent.prototype.getContainerDom = function() {
	if (!this._containerDom || this._containerDom.length == 0) {
		this._containerDom = jQuery(this.containerSelector);
	}
	return this._containerDom;
};

/**
 * 返回属性中selector对象的jQueryDom对象
 * @returns {jQueryDom}
 */
SNSComponent.prototype.getTriggerDom = function() {
	if (!this._triggerDom || this._triggerDom.length == 0) {
		this._triggerDom = jQuery(this.triggerSelector);
	}
	return this._triggerDom;
};

/**
 * 切换隐藏或者显示
 */
SNSComponent.prototype.toggle = function() {
	if (this.visible()) {
		this.hide();
	} else {
		this.show();
	}
};

/**
 * 判断节点是否可见
 * @returns {Boolean}
 */
SNSComponent.prototype.visible = function() {
	var dom = this.getDom();
	if (dom.is(":visible")) {
		return true;
	}
};

SNSComponent.prototype.beforeShow = function() {

};

/**
 * 显示此节点
 * @param isInline {boolean} display是否为inline
 */
SNSComponent.prototype.show = function() {
	if(this.maskOthers || this.mask) {
		this.getDom().css('z-index', ++this.newZIndex);
		jQuery(this.maskLayerSelector).show();
	}
	if (this.visible()) {
		return;
	}
	var dom = this.getDom();

	this.beforeShow();

	dom.show("fast");

	this.afterShow();

};

SNSComponent.prototype.afterShow = function() {

};

SNSComponent.prototype.hide = function() {
	var dom = this.getDom();
	if(this.maskOthers === true) {
		dom.css('z-index', this.oldZIndex);
		jQuery(this.maskLayerSelector).hide();
	}
	dom.hide("fast");
};

SNSComponent.prototype.remove = function(){
	this.getDom().remove();
};

/**
 * 开启拖动功能
 */
SNSComponent.prototype.enableMove = function() {
	if(YYIMCommonUtil.isStringAndNotEmpty(this.getDragComponentSelector())
			&& YYIMCommonUtil.isStringAndNotEmpty(this.getMoveComponentSelector())) {
		var that = this;
		jQuery(this.getDragComponentSelector()).bind("mouseenter", function () {
			// this is event element
			SNSComponent.prototype.move.call(that, this);
		});
	}
};

/**
 * 拖动的部分
 */
SNSComponent.prototype.getDragComponentSelector = function(){};

/**
 * 移动的部分
 */
SNSComponent.prototype.getMoveComponentSelector = function(){};

/**
 * 拖动前检测是否可移动，排除某些位置点击不可拖动
 */
SNSComponent.prototype.validateMovability = function(){
	return false;
};

/**
 * 窗口移动
 * @param element 事件源
 */
SNSComponent.prototype.move = function(element){
	var that = this;
	
	var x,y;
	element.onmousedown = function(e){
		if(!that.validateMovability(e)){
			return;
		}
		jQuery(that.transparentPanelSelector).show();
		if(!!e === false) {
			e = window.event;
		}
		e.preventDefault ? e.preventDefault() : e.returnValue = false;
		that.dragging = true;
		//console.info("mouse down : dragging = true");
		x = e.clientX;
		y = e.clientY;
		document.onmousemove = function(e){
			//console.info("document.onmousemove " + e);
			that.useDefaultPosition = false;
			if(!!e === false) {
				e = window.event;
			}
			var deltaX = e.clientX - x;
			var deltaY = e.clientY - y;
			//console.info("mouse move : dragging = " + that.dragging);
			if(!that.dragging){
				deltaX = deltaY = 0;
				jQuery(that.transparentPanelSelector).hide();
				return;
			}
			
			var chatBox = jQuery(that.getMoveComponentSelector());
			// 到达左（右）边界并继续左（右）移
			if((chatBox.offset().left <= 0 && deltaX < 0) || (jQuery(window).width() - chatBox.width() <= chatBox.offset().left && deltaX > 0)){
				deltaX = 0;
			}else{
				x = e.clientX;
			}
			// 到达上边界并继续上移
			if(chatBox.offset().top <= 0 && deltaY < 0 || (jQuery(window).height() - chatBox.height() <= chatBox.offset().top && deltaY > 0)){
				deltaY = 0;
			}else{
				y = e.clientY;
			}
			chatBox.css("left", Math.max(chatBox.offset().left + deltaX, 0));
			chatBox.css("top", Math.max(chatBox.offset().top + deltaY, 0));
		};
	};
	document.onmouseup = function(){
		var chatBox = jQuery(that.getMoveComponentSelector());
		var left = chatBox.offset().left,top = chatBox.offset().top;
		// 到达左（右）边界并继续左（右）移
		if( chatBox.offset().left < 0){
			left = 0;
		}else if(jQuery(window).width() - chatBox.width() < chatBox.offset().left){
			left = jQuery(window).width() - chatBox.width();
		}
		// 到达上边界并继续上移
		if(chatBox.offset().top < 0){
			top = 0;
		}else if( jQuery(window).height() - chatBox.height() < chatBox.offset().top){
			top = jQuery(window).height() - chatBox.height();
		}
		chatBox.css("left", left);
		chatBox.css("top", top);
		that.dragging = false;
		//console.info("mouse up : dragging = false");
		jQuery(that.transparentPanelSelector).hide();
	};
};
SNSComponent.prototype.shadeShow = function () {
	jQuery(this.transparentPanelSelector).show();
	
}
SNSComponent.prototype.shadeHide = function () {
	jQuery(this.transparentPanelSelector).hide();
	
}
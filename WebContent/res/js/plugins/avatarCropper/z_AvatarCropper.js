var isIE = (document.all) ? true : false;

//var isIE6 = isIE && ([ /MSIE (\d)\.0/i.exec(navigator.userAgent) ][0][1] == 6);
var SNSAvatarCropper = function(container, handle, url, options) {
	this.initialize(container, handle, url, options);
};
SNSAvatarCropper.getInstance = function(){
	return SNSAvatarCropper._instance;
};

SNSAvatarCropper.prototype.getElement = function(id) {
	return "string" == typeof id ? document.getElementById(id) : id;
};

SNSAvatarCropper.prototype.extend = function(destination, source) {
	for ( var property in source) {
		destination[property] = source[property];
	}
};

SNSAvatarCropper.prototype.bind = function(object, fun) {
	return function() {
		return fun.apply(object, arguments);
	}
};

SNSAvatarCropper.prototype.bindAsEventListener = function(object, fun) {
	var args = Array.prototype.slice.call(arguments).slice(2);
	return function(event) {
		return fun.apply(object, [ event || window.event ].concat(args));
	}
};

SNSAvatarCropper.prototype.currentStyle = function(element) {
	return element.currentStyle || document.defaultView.getComputedStyle(element, null);
};

SNSAvatarCropper.prototype.addEventHandler = function(oTarget, sEventType, fnHandler) {
	if (oTarget.addEventListener) {
		oTarget.addEventListener(sEventType, fnHandler, false);
	} else if (oTarget.attachEvent) {
		oTarget.attachEvent("on" + sEventType, fnHandler);
	} else {
		oTarget["on" + sEventType] = fnHandler;
	}
};

SNSAvatarCropper.prototype.removeEventHandler = function(oTarget, sEventType, fnHandler) {
	if (oTarget.removeEventListener) {
		oTarget.removeEventListener(sEventType, fnHandler, false);
	} else if (oTarget.detachEvent) {
		oTarget.detachEvent("on" + sEventType, fnHandler);
	} else {
		oTarget["on" + sEventType] = null;
	}
};

// 容器对象,控制层,图片地址
SNSAvatarCropper.prototype.initialize = function(container, handle, url, options) {
	SNSAvatarCropper._instance = this;
	this._Container = this.getElement(container);// 容器对象
	this._layHandle = this.getElement(handle);// 控制层
	this.Url = url;// 图片地址

	this._layBase = this._Container.appendChild(document.createElement("img"));// 底层
	this._layCropper = this._Container.appendChild(document
			.createElement("img"));// 切割层
	this._layCropper.onload = this.bind(this, this.setPos);
	// 用来设置大小
	this._tempImg = document.createElement("img");
	this._tempImg.onload = this.bind(this, this.setSize);

	this.setOptions(options);

	this.Opacity = Math.round(this.options.Opacity);
	this.Color = this.options.Color;
	this.Scale = !!this.options.Scale;
	this.Ratio = Math.max(this.options.Ratio, 0);
	this.Width = Math.round(this.options.Width);
	this.Height = Math.round(this.options.Height);

	// 设置预览对象
	var oPreview = this.getElement(this.options.Preview);// 预览对象
	if (oPreview) {
		oPreview.style.position = "relative";
		oPreview.style.overflow = "hidden";
		this.viewWidth = Math.round(this.options.viewWidth);
		this.viewHeight = Math.round(this.options.viewHeight);
		// 预览图片对象
		this._view = oPreview.appendChild(document.createElement("img"));
		this._view.style.position = "absolute";
		this._view.onload = this.bind(this, this.setPreview);
	}
	// 设置拖放
	this._drag = new Drag(this._layHandle, {
		Limit : true,
		onMove : this.bind(this, this.setPos),
		Transparent : true
	});
	// 设置缩放
	this.Resize = !!this.options.Resize;
	if (this.Resize) {
		var op = this.options, _resize = new Resize(this._layHandle, {
			Max : true,
			onResize : this.bind(this, this.setPos)
		});
		// 设置缩放触发对象
		op.RightDown && (_resize.Set(op.RightDown, "right-down"));
		op.LeftDown && (_resize.Set(op.LeftDown, "left-down"));
		op.RightUp && (_resize.Set(op.RightUp, "right-up"));
		op.LeftUp && (_resize.Set(op.LeftUp, "left-up"));
		op.Right && (_resize.Set(op.Right, "right"));
		op.Left && (_resize.Set(op.Left, "left"));
		op.Down && (_resize.Set(op.Down, "down"));
		op.Up && (_resize.Set(op.Up, "up"));
		// 最小范围限制
		this.Min = !!this.options.Min;
		this.minWidth = Math.round(this.options.minWidth);
		this.minHeight = Math.round(this.options.minHeight);
		// 设置缩放对象
		this._resize = _resize;
	}
	// 设置样式
	this._Container.style.position = "relative";
	this._Container.style.overflow = "hidden";
	this._layHandle.style.zIndex = 200;
	this._layCropper.style.zIndex = 100;
	this._layBase.style.position = this._layCropper.style.position = "absolute";
	this._layBase.style.top = this._layBase.style.left = this._layCropper.style.top = this._layCropper.style.left = 0;// 对齐
	// 初始化设置
	this.init();
};
// 设置默认属性
SNSAvatarCropper.prototype.setOptions = function(options) {
	this.options = {// 默认值
		Opacity : 50,// 透明度(0到100)
		Color : "",// 背景色
		Width : 0,// 图片高度
		Height : 0,// 图片高度
		// 缩放触发对象
		Resize : false,// 是否设置缩放
		Right : "",// 右边缩放对象
		Left : "",// 左边缩放对象
		Up : "",// 上边缩放对象
		Down : "",// 下边缩放对象
		RightDown : "",// 右下缩放对象
		LeftDown : "",// 左下缩放对象
		RightUp : "",// 右上缩放对象
		LeftUp : "",// 左上缩放对象
		Min : true,// 是否最小宽高限制(为true时下面min参数有用)
		minWidth : 50,// 最小宽度
		minHeight : 50,// 最小高度
		Scale : true,// 是否按比例缩放
		Ratio : 1,// 缩放比例(宽/高)
		// 预览对象设置
		Preview : "",// 预览对象
		viewWidth : 0,// 预览宽度
		viewHeight : 0
	// 预览高度
	};
	this.extend(this.options, options || {});
};
// 初始化对象
SNSAvatarCropper.prototype.init = function() {
	// 设置背景色
	this.Color && (this._Container.style.backgroundColor = this.Color);
	// 设置图片
	this._tempImg.src = this._layBase.src = this._layCropper.src = this.Url;
	// 设置透明
	if (isIE) {
		this._layBase.style.filter = "alpha(opacity:" + this.Opacity + ")";
	} else {
		this._layBase.style.opacity = this.Opacity / 100;
	}
	// 设置预览对象
	this._view && (this._view.src = this.Url);
	// 设置缩放
	if (this.Resize) {
		with (this._resize) {
			Scale = this.Scale;
			Ratio = this.Ratio;
			Min = this.Min;
			minWidth = this.minWidth;
			minHeight = this.minHeight;
		}
	}
};
// 设置切割样式
SNSAvatarCropper.prototype.setPos = function() {
	// ie6渲染bug
	/*if (isIE6) {
		with (this._layHandle.style) {
			zoom = .9;
			zoom = 1;
		}
	}*/
	// 获取位置参数
	var p = this.getPos();
	// 按拖放对象的参数进行切割
	this._layCropper.style.clip = "rect(" + p.Top + "px " + (p.Left + p.Width)
			+ "px " + (p.Top + p.Height) + "px " + p.Left + "px)";
	// 设置预览
	this.setPreview();
};
// 设置预览效果
SNSAvatarCropper.prototype.setPreview = function() {
	if (this._view) {
		// 预览显示的宽和高
		var p = this.getPos(), s = this.getSize(p.Width, p.Height,
				this.viewWidth, this.viewHeight), scale = s.Height / p.Height;
		// 按比例设置参数
		var pHeight = this._layBase.height * scale, pWidth = this._layBase.width
				* scale, pTop = p.Top * scale, pLeft = p.Left * scale;
		// 设置预览对象
		// 设置样式
		this._view.style.width = pWidth + "px";
		this._view.style.height = pHeight + "px";
		this._view.style.top = -pTop + "px ";
		this._view.style.left = -pLeft + "px";
		// 切割预览图
		this._view.style.clip = "rect(" + pTop + "px " + (pLeft + s.Width) + "px "
				+ (pTop + s.Height) + "px " + pLeft + "px)";
	}
};
// 设置图片大小
SNSAvatarCropper.prototype.setSize = function() {
	var s = this.getSize(this._tempImg.width, this._tempImg.height, this.Width,
			this.Height);
	// 设置底图和切割图
	this._layBase.style.width = this._layCropper.style.width = s.Width + "px";
	this._layBase.style.height = this._layCropper.style.height = s.Height
			+ "px";
	// 设置拖放范围
	this._drag.mxRight = s.Width;
	this._drag.mxBottom = s.Height;
	// 设置缩放范围
	if (this.Resize) {
		this._resize.mxRight = s.Width;
		this._resize.mxBottom = s.Height;
	}
};
// 获取当前样式
SNSAvatarCropper.prototype.getPos = function() {
	with (this._layHandle) {
		return {
			startX : offsetLeft,
			startY : offsetTop,
			endX : offsetLeft + offsetWidth,
			endY : offsetTop + offsetHeight
		}
	}
};
// 获取尺寸
SNSAvatarCropper.prototype.getSize = function(nowWidth, nowHeight, fixWidth,fixHeight) {
	var iWidth = nowWidth, iHeight = nowHeight, scale = iWidth / iHeight;
	// 按比例设置
	if (fixHeight) {
		iWidth = (iHeight = fixHeight) * scale;
	}
	if (fixWidth && (!fixHeight || iWidth > fixWidth)) {
		iHeight = (iWidth = fixWidth) / scale;
	}
	// 返回尺寸对象
	return {
		Width : iWidth,
		Height : iHeight
	}
};
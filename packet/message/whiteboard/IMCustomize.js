$(window).on('resize',function(){
	resizeHandler();
});
var wh_ratio = 980/800;
function resizeHandler(){
		var _height = $(window).height()-46;
		var _width = $(window).width();
		if(_height*wh_ratio>_width){
			$('#svgroot').height(_width/wh_ratio);
			$('#svgroot').width(_width);
			$('#svgcanvas').css('top',(_height-(_width/wh_ratio))/2+'px');
		}else{
			$('#svgcanvas').css('top',0);
			$('#svgroot').height(_height);
			$('#svgroot').width(_height*wh_ratio);
		}
}
$(window).on('load',resizeHandler);
var zoomIndex = 0;
$(document).on('click touchend','#tool_zoom_in,.im-zoom-in',zoomIn);
$(document).on('click touchend','#tool_zoom_out,.im-zoom-out',zoomOut);
/*
 画板放大
 * */
function zoomIn(){
	if(zoomIndex>=5){return false;}
	var _height = $(window).height()-46;
	var _width = $(window).width();
	zoomIndex++;
	$('#svgroot').height($('#svgroot').height()*1.25);
	$('#svgroot').width($('#svgroot').width()*1.25);
	if(zoomIndex<0){
		$('#svgcanvas').css('top',(_height-($('#svgroot').height()))/2+'px');	
	}
	if(zoomIndex==0){
		$('#svgcanvas').css('top',0);	
		
	}
}
/*
 缩小画板
 * 
 * */
function zoomOut(){
	if(zoomIndex<=-5){return false;}
	var _height = $(window).height()-46;
	var _width = $(window).width();
	zoomIndex--;
	$('#svgroot').height($('#svgroot').height()*0.8);
	$('#svgroot').width($('#svgroot').width()*0.8);
	if(zoomIndex<0){
		$('#svgcanvas').css('top',(_height-($('#svgroot').height()))/2+'px');	
	}
}
/*
 控制白板全屏
 * 
 * */
function fullScreen() {
	var el = document.documentElement;
	var rfs = el.requestFullScreen || el.webkitRequestFullScreen || el.mozRequestFullScreen || el.msRequestFullScreen;

	if (typeof rfs != "undefined" && rfs) {
		rfs.call(el);
	} else if (typeof window.ActiveXObject != "undefined") {
		// for Internet Explorer 
		var wscript = new ActiveXObject("WScript.Shell");
		if (wscript != null) {
			wscript.SendKeys("{F11}");
		}
	}

}
$(function(){
	
	/*
	 白板底部按钮折叠、展开
	 * 
	 * */
	var ani_flag = true;
	$(document).on('click','.fold-btn',function(e){
		if(!ani_flag) return false;
		var $target = $(e.target);
		$target.parent().siblings('.main-tool').animate({left:$target.hasClass('act')?"0":"100%"},500,function(){ani_flag=true;});
		ani_flag=false;
		$target.toggleClass('act');
	});
	/*
	 画笔粗细设置
	 * 
	 * */
	$(document).on('click','.stroke-width-opts>li',function(e){
		var opts = [1,3,5,7,9,11],
			index = $('.stroke-width-opts>li').index($(e.target));
		svgCanvas.setStrokeWidth(opts[index]);
		$('#new_tools_bottom .main-tool .im-stroke-btn span').css('border-top-width',opts[index]+'px');
		window.strokeWidth = opts[index];
	})
	/*
	 画笔颜色设置
	 * 
	 * */
	$(document).on('click','.stroke-color-opts>li',function(e){
		var attr = svgCanvas.selectorManager.selectors[0]&&svgCanvas.selectorManager.selectors[0].selectedElement&&svgCanvas.selectorManager.selectors[0].selectedElement.getAttribute('class'),
			curMode = svgCanvas.getMode(),
			curTag = svgCanvas.selectorManager.selectors[0]&&svgCanvas.selectorManager.selectors[0].selectedElement&&svgCanvas.selectorManager.selectors[0].selectedElement.tagName,
			color = $(e.target).attr('data-color');
		if(curMode=="arrow"||(attr&&attr.indexOf("arrow")>=0)){
			window.arrowFill = color;
			setFill('arrow');
		}else if(curMode=="text"||(curTag=="text")){
			window.textFill = color;
			setFill('text');
		}else{
			svgCanvas.setPaint("stroke", {alpha:100,type:"solidColor",solidColor:color,linearGradient:null,radialGradient:null});
		}
		setColorGuide(color);
	});
	/*
	 字体
	 * */
	$(document).on('click','.fontfamily-opts>li,.fontsize-opts>li',function(e){
		var target = $(e.target),
		    val = target.attr('data-val');
		if(target.closest('.fontfamily-opts').length){
			svgCanvas.setFontFamily(val);
			$('.ff-guide').html(val);
		}else{
			svgCanvas.setFontSize(val);
			$('.fz-guide').html(val+'px');
		}
	});
	
	
	
	$(document).on('click','.tools-folded>li',function(e){
		$(e.target).closest('.tools-folded').addClass('hidden');
	});
	$(document).on('mouseup',function(e){
		setTimeout(function(){
				var $target = $(e.target),
					curMode = svgCanvas.getMode(),
					curTag = svgCanvas.selectorManager.selectors[0]&&svgCanvas.selectorManager.selectors[0].selectedElement&&svgCanvas.selectorManager.selectors[0].selectedElement.tagName,
					showFontTools = curMode=="text"||curTag=="text"	;
				$('.tools-folded').addClass('hidden');
				if($target.is('.tools-folded-trigger,.tools-folded-trigger span')){
					$target.closest('.tools-folded-trigger').find('.tools-folded').removeClass('hidden');
				}
				if(showFontTools){
					$('.im-fontfamily-btn,.im-fontsize-btn').removeClass('hidden');
					$('.im-stroke-btn').addClass('hidden');
				}else{
					$('.im-fontfamily-btn,.im-fontsize-btn').addClass('hidden');
					$('.im-stroke-btn').removeClass('hidden');
				}
				if($(e.target).is('.im-tool-pencil')||curMode=="fhpath"){
					$('#svgcanvas').css('cursor','crosshair');
				}else{
					$('#svgcanvas').css('cursor','');
				}
		},0)
	});
	
	/*顶部标题显示隐藏*/
	$('#svgcanvas').hover(
		function(){$('#tool_title').removeClass('hidden')},
		function(){$('#tool_title').addClass('hidden')}
	);
	
	/*评论*/
	$(document).on("keyup","#comment_area input",function(e){
			var target = $(e.target);
		if(e.keyCode === 13&&target.val().trim().length>0){
			var	dom = $('#comment_area .comment-item').eq(0).clone();
			dom.find('.comment-cont').html(target.val());
			dom.find('.avator,.usr').html('我');
			$('.comments-container').append(dom);
			target.val('');
			dom.remove();
		}
		
	})
	$('.comment-btn').on('click',function(){
			var domToHandle = $('#comment_area'),
				flag = domToHandle.hasClass('hidden');
			if(flag){
				domToHandle.find('input').focus();
				domToHandle.removeClass('hidden');
				setTimeout(function(){
					domToHandle.addClass('act');
				},50)
			}else{
				domToHandle.removeClass('act');
				setTimeout(function(){
					domToHandle.addClass('hidden');
				},500)
			}
	})
	
	$(document).on('click','#new_tools_bottom .main-tool',function(e){
		var parentLi = $(e.target).closest('li');
		if(!$(e.target).closest('.tools-folded-trigger').length){
			svgCanvas.clearSelection();
		}
		if(!(parentLi.is('.im-tool-arrow')||$(e.target).closest('ul').is('.stroke-width-opts'))){
			var tag=getSelectedTag();
			if(tag&&
				(tag.getAttribute('class')&&tag.getAttribute('class').indexOf('arrow')>=0||tag.tagName=="text")
			){
				if(tag.getAttribute('class')&&tag.getAttribute('class').indexOf('arrow')>=0&&!$(e.target).closest('.im-color-btn').length){
					svgCanvas.clearSelection();
					svgCanvas.setStrokeWidth(window.strokeWidth?window.strokeWidth:5);
				}
			}else{
				svgCanvas.setStrokeWidth(window.strokeWidth?window.strokeWidth:5);
			}
			
		}
	});
	
	$(document).on('click','.im-tool-pencil,.im-tool-shape,.im-tool-baloon',function(){
			setColorGuide(svgCanvas.getStyle().stroke.split('#')[1]);
	});
	
	/*
	 生成调色板
	 * */
	!function(){
		var color_container = $('.stroke-color-opts'),
			temStr = "",
			total = ["000000", "993300", "333300", "003300", "003366", "000080", "333399", "333333", "800000", "FF6600", "808000", "008000", "008080", "0000FF", "666699", "808080", "FF0000", "FF9900", "99CC00", "339966", "33CCCC", "0066de", "800080", "969696", "FF00FF", "FFCC00", "FFFF00", "00FF00", "00FFFF", "00CCFF", "993366", "C0C0C0", "FF99CC", "FFCC99", "FFFF99", "CCFFCC", "CCFFFF", "99CCFF", "CC99FF", "FFFFFF"];
		
		for(var i in total){
			temStr+='<li style="background-color:#'+ total[i] +'" data-color="'+total[i]+'"></li>'
		}
		color_container.append(temStr);
	}();
	tooltip();
	
});
function setFill(type){
	switch(type){
		case "arrow":
			if(!window.arrowFill){
				window.arrowFill = "ff0000";	
			}
			svgCanvas.setPaint("fill", {alpha: 100, type: "solidColor", solidColor: window.arrowFill});
			setColorGuide(window.arrowFill);
			break;
		case "text":
			if(!window.textFill){
				window.textFill = "ff0000";	
			}
			svgCanvas.setPaint("fill", {alpha: 100, type: "solidColor", solidColor: window.textFill});
			setColorGuide(window.textFill);
			break;
	}		
}
function getSelectedTag(){
	return svgCanvas.selectorManager.selectors[0]&&svgCanvas.selectorManager.selectors[0].selectedElement&&svgCanvas.selectorManager.selectors[0].selectedElement;
}
function tooltip() {
	$("[data-title]").hover(function(e) {
			var _target = $(e.target);
			if(_target.attr('data-title')){
					var positionObj = _target[0].getBoundingClientRect();
					$("body").append("<div id='tooltip'>" + _target.attr('data-title') + "</div>");
					$("#tooltip")
						.css("left", (positionObj.left-positionObj.width/2+5) + "px")
						.css("top", (positionObj.top-positionObj.height-5) + "px")
						.fadeIn("fast");
			}
		},
		function() {
			$("#tooltip").remove();
		});
};
function setColorGuide(color){
	$('.im-color-btn span:first-child').css('background','#'+color);
}
Math.getRotateDeg = function(x1,y1,x2,y2){
	var dis = Math.sqrt(Math.pow(y2-y1,2)+Math.pow(x2-x1,2)),
		sinDelta = (y2-y1)/dis,
		deg = Math.asin(sinDelta)*180/Math.PI;
	return deg;
}
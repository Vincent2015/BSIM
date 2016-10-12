$(window).on('resize',function(){
	resizeHandler();
});
$(window).on('mouseup',function(e){
	if(!!svgCanvas&&svgCanvas.latestMouseEvt&&!$(e.target).closest('#svgcanvas').length){
		$('#svgcanvas').trigger('mouseup',svgCanvas.latestMouseEvt);
	}
});
var wh_ratio = 1.33;//980/800;
function resizeHandler(_w,_h){
		var container = $('#workarea');
		if(_w){
			var cssObj = {
				height:_h,
				width:_w,
				top:_h>container.height()?0:'50%',
				marginTop:_h>container.height()?0:-_h/2
			}
			if(_w<=container.width()&&_h<=container.height()){
			}else{
				if(_w==Math.max(_w,_h)&&_h*container.width()/_w<=container.height()){
					cssObj.width=container.width();
					cssObj.height=_h*container.width()/_w;
					cssObj.marginTop = -cssObj.height/2;
					cssObj.top = '50%';
				}else{
					cssObj.height=container.height();
					cssObj.width=_w*container.height()/_h;
				}
			}
			$('#whbd_container').css(cssObj);
			$('#file_bac img').css({width:'100%',height:'100%'});
		}else{
			$('#whbd_container').css({marginTop:0});
			var _height = $(window).height()-46;
			var _width = $(window).width();
			if(_height*wh_ratio>_width){
				$('#whbd_container').height(_width/wh_ratio);
				$('#whbd_container').width(_width);
				$('#whbd_container').css('top',(_height-(_width/wh_ratio))/2+'px');
			}else{
				$('#whbd_container').css('top',0);
				$('#whbd_container').height(_height);
				$('#whbd_container').width(_height*wh_ratio);
			}
		}
//		$('#svgroot').css({
//			width:$('#svgcanvas').width(),
//			height:$('#svgcanvas').height(),
//			left:'50%',
//			top:'50%',
//			marginLeft:-$('#svgcanvas').width()/2,
//			marginTop:-$('#svgcanvas').height()/2
//		});
//		$('#svgroot').attr({viewBox:'0 0 '+ $('#svgcanvas').width()+' '+$('#svgcanvas').height()});
//		$('#svgcontent').attr({width:$('#svgcanvas').width(),height:$('#svgcanvas').height()});
//		$('#svgroot').height($('#svgcanvas').height());
//		$('#svgroot').width($('#svgcanvas').width());
		svgCanvas.zoomRatio = $('#svgroot').width()/1067;
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
	var _height = $('#workarea').height();
	var _width = $('#workarea').width();
	zoomIndex++;
	$('#svgcanvas').height($('#svgcanvas').height()*1.25);
	$('#svgcanvas').width($('#svgcanvas').width()*1.25);
	
	$('#svgroot').height($('#svgroot').height()*1.25);
	$('#svgroot').width($('#svgroot').width()*1.25);
	$('#svgroot').css('margin-top',parseInt($('#svgroot').css('margin-top').replace('px',''),10)*1.25);
	$('#svgroot').css('margin-left',parseInt($('#svgroot').css('margin-left').replace('px',''),10)*1.25);
	
	
	$('#whbd_container').height($('#whbd_container').height()*1.25);
	$('#whbd_container').width($('#whbd_container').width()*1.25);
//	$('#svgroot').height($('#svgroot').height()*1.25);
//	$('#svgroot').width($('#svgroot').width()*1.25);
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
	
	
	$('#svgcanvas').height($('#svgcanvas').height()/1.25);
	$('#svgcanvas').width($('#svgcanvas').width()/1.25);
	
	$('#svgroot').height($('#svgroot').height()/1.25);
	$('#svgroot').width($('#svgroot').width()/1.25);
	$('#svgroot').css('margin-top',parseInt($('#svgroot').css('margin-top').replace('px',''),10)/1.25);
	$('#svgroot').css('margin-left',parseInt($('#svgroot').css('margin-left').replace('px',''),10)/1.25);
	
	
	$('#whbd_container').height($('#whbd_container').height()/1.25);
	$('#whbd_container').width($('#whbd_container').width()/1.25);
	
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
	$(document).on('click touchend','.stroke-width-opts>li',function(e){
		var opts = [1,3,5,7,9,11],
			index = $('.stroke-width-opts>li').index($(e.target));
		var selectedElems = svgCanvas.getSelectedElems();
			var i;
			for(i=0;i<selectedElems.length;i++){//debugger;
				if($(selectedElems[i]).is('.arrow,text')){
						svgCanvas.removeFromSelection([selectedElems[i]]);
					}
			}
		svgCanvas.setStrokeWidth(opts[index]);
		$('#new_tools_bottom .main-tool .im-stroke-btn span').css('border-top-width',opts[index]+'px');
		svgCanvas.strokeWidth = opts[index];
	})
	/*
	 画笔颜色设置
	 * 
	 * */
	$(document).on('click touchend','.stroke-color-opts>li',function(e){
		var attr = svgCanvas.selectorManager.selectors[0]&&svgCanvas.selectorManager.selectors[0].selectedElement&&svgCanvas.selectorManager.selectors[0].selectedElement.getAttribute('class'),
			curMode = svgCanvas.getMode(),
			curTag = svgCanvas.selectorManager.selectors[0]&&svgCanvas.selectorManager.selectors[0].selectedElement&&svgCanvas.selectorManager.selectors[0].selectedElement.tagName,
			color = $(e.target).attr('data-color'),
			selected = svgCanvas.getSelectedElems();
		if(curMode=='select'&&selected.length>1&&selected[1]!=null){return;}
		if(curMode=="arrow"||$(selected[0]).is('.arrow')){
			svgCanvas.arrowFill = color;
			setFill('arrow');
		}else if(curMode=="textarea"||curMode=="textareaedit"||(curTag=="text")){
			svgCanvas.textFill = color;
			setFill('textarea');
		}else{
			svgCanvas.setPaint("stroke", {alpha:100,type:"solidColor",solidColor:color,linearGradient:null,radialGradient:null});
		}
		svgCanvas.setColorGuide(color);
	});
	/*
	 字体
	 * */
	$(document).on('click touchend','.fontfamily-opts>li,.fontsize-opts>li',function(e){
		var target = $(e.target),
		    val = target.attr('data-val');
		if(target.closest('.fontfamily-opts').length){
			//svgCanvas.setFontFamily(val);
			svgCanvas.textareaActions.setFontFamily(val);
			$('.ff-guide').html(target.html());
		}else{
			//svgCanvas.setFontSize(val);
			svgCanvas.textareaActions.setFontSize(val);
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
					showFontTools = ("text textarea textareaedit".indexOf(curMode)>=0);
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
				},50);
			}else{
				domToHandle.removeClass('act');
				setTimeout(function(){
					domToHandle.addClass('hidden');
				},500);
			}
	})
	
	$(document).on('click','#new_tools_bottom .main-tool',function(e){
		if($(svgCanvas.getSelectedElems()[0]).find('textarea').length>0&&$(e.target).closest('.im-fontsize-btn,.im-fontfamily-btn,.im-color-btn').length==0){
			svgCanvas.textareaActions.mouseUp();
		}
		if(!$(e.target).is('.im-tool-arrow,.im-color-btn,.im-color-btn *'))svgCanvas.arrMode = false;
		if(!$(e.target).is('.im-tool-focus')){$('.focus-cir').hide();}
		var parentLi = $(e.target).closest('li');
		if(!$(e.target).closest('.tools-folded-trigger').length&&!$(e.target).is('.im-tool-select')){
			svgCanvas.clearSelection();
		}
		if(!(parentLi.is('.im-tool-arrow')||$(e.target).closest('li').is('.im-color-btn')||$(e.target).closest('ul').is('.stroke-color-opts')||$(e.target).is('.im-tool-select'))){
				var selectedElems = svgCanvas.getSelectedElems();
				var i;
				for(i=0;i<selectedElems.length;i++){//debugger;
					if($(selectedElems[i]).is('.arrow,text')){
							svgCanvas.removeFromSelection([selectedElems[i]]);
						}
				}
				svgCanvas.setStrokeWidth(svgCanvas.strokeWidth?svgCanvas.strokeWidth:5);
			
		}
//		if(!(parentLi.is('.im-tool-arrow')||$(e.target).closest('ul').is('.stroke-width-opts')||$(e.target).is('.im-tool-select'))){
//			var selectedElems = svgCanvas.getSelectedElems();
//			var i;
//			for(i=0;i<selectedElems.length;i++){//debugger;
//				if($(selectedElems[i]).is('.arrow,text')){
//					svgCanvas.removeFromSelection([selectedElems[i]]);
//				}
//			}
//			svgCanvas.setStrokeWidth(svgCanvas.strokeWidth?svgCanvas.strokeWidth:5);
//			
//		}
		if($(e.target).is('.im-tool-pencil,.im-tool-textarea.tool_button,.im-tool-arrow')){
			$(e.target).addClass('tool_button_current');
		}
	});
	
	$(document).on('click','.im-tool-pencil,.im-shape-btn,.im-tool-baloon,.im-baloons-btn,.im-tool-textarea',function(e){
		if($(e.target).is('.im-baloons-btn,.im-tool-textarea')){
			svgCanvas.setColorGuide(svgCanvas.textFill||'f00');
		}else{
			svgCanvas.setColorGuide(svgCanvas.getStyle().stroke.split('#')[1]);
		}	
	});
	$(document).on('click','.tools-folded-trigger *',function(){
			$('.tool_button_current').removeClass('tool_button_current');
			$(this).closest('.tools-folded-trigger').addClass('tool_button_current');
	});
	$(document).on('click','.show-snapshots',function(){
		//if($('#related_whbd_list .wrapper>ul>li').length==0)
//		svgEditor.loadSnapshots();
//		$('#related_whbd_list').toggleClass('hidden');
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
			if(!svgCanvas.arrowFill){
				svgCanvas.arrowFill = "ff0000";	
			}
			svgCanvas.setPaint("fill", {alpha: 100, type: "solidColor", solidColor: svgCanvas.arrowFill});
			svgCanvas.setColorGuide(svgCanvas.arrowFill);
			break;
		case "textareaedit":
		case "textarea":
			if(!svgCanvas.textFill){
				svgCanvas.textFill = "ff0000";	
			}
//			svgCanvas.setPaint("fill", {alpha: 100, type: "solidColor", solidColor: svgCanvas.textFill});
			svgCanvas.textareaActions.setFontColor(svgCanvas.textFill);
			svgCanvas.setColorGuide(svgCanvas.textFill);
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
//						.css("top", (positionObj.top-positionObj.height-5) + "px")
						.css("top", $(window).width()>800?(positionObj.top-positionObj.height-5) + "px":(positionObj.top+5) + "px")
						.fadeIn("fast");
			}
		},
		function() {
			$("#tooltip").remove();
		});
};

Math.getRotateDeg = function(x1,y1,x2,y2){
	return Math.atan2(y2-y1,x2-x1);
};
Math.getCurDis = function(x1,y1,x2,y2){
	return Math.sqrt(Math.pow(x2-x1,2)+Math.pow(y2-y1,2));
};
Math.getRotatedPoint = function(point0,point1,angle){
	return{
		'x':(point1['x']-point0['x'])*Math.cos(angle)-(point1['y']-point0['y'])*Math.sin(angle)+point0['x'],
		'y':(point1['x']-point0['x'])*Math.sin(angle)+(point1['y']-point0['y'])*Math.cos(angle)+point0['y']
	};
};
//$(document).on('mouseup','path.arrow',function(){alert()})
$(document).on('mouseup','#close_cur_whbd',function(){
	$('#textarea_proxy').hide();
	$('#file_bac').empty();
	$('.tool_button_current').removeClass('tool_button_current');
	svgCanvas.setMode('select');
	$('.im-tool-select').addClass('tool_button_current');
	svgCanvas.arrMode = false;
	$('#related_whbd_list').addClass('hidden');
	$('#close_cur_whbd_twin').trigger('click');
	$('#svgroot').css({width:'100%',height:'100%'})
})
$(document).on('click','#whbd-options',function(){
	$('#whbd-options>ul').toggleClass('hidden')
})

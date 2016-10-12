function changeState(b,isUndo){
	var nodeId = b.elem?b.elem.id:b.stack[0].elem?b.stack[0].elem.id:b.stack[0].stack[0].elem.id;
	if(nodeId=="svgcontent") return false;
	if(b instanceof svgedit.history.BatchCommand){
		var i;
		for(i in b.stack){
			sendDeltaData(b.stack[i],isUndo);
		}
	}else{
			sendDeltaData(b,isUndo);
	}
}
function sendDeltaData(b,isUndo){
	console.log(b);
	var isdel = delOrNot(b.text,isUndo);
	if(isdel){
		if(svgCanvas.getMode()=='textareaedit'){
			$('.tool_button_current').removeClass('tool_button_current');
			svgCanvas.setMode('select');
			$('.im-tool-select').addClass('tool_button_current');
		};
		if(b.stack&&b.stack[0]&&$(b.stack[0].elem.outerHTML).is('text')&&$(b.stack[0].elem.outerHTML).html().length==0){
			return false;
		}
	}
	
	if(b.stack&&$(b.stack[0].elem.outerHTML).attr('id').indexOf('arr_selector_')>=0){return false;}
	var temStr=nodeContent=nodeId=nodeText="";
	if(isdel){
		nodeId = b.elem?b.elem.id:b.stack[0].elem?b.stack[0].elem.id:b.stack[0].stack[0].elem.id;
		if($('#textarea_proxy').attr('dataLink')==nodeId){$('#textarea_proxy').hide()}
		if($('[data-tar="'+nodeId+'"]').length>0)$('[data-tar="'+nodeId+'"]').remove();
	}else{
		nodeId = b.elem?b.elem.id:b.stack[0].elem?b.stack[0].elem.id:b.stack[0].stack[0].elem.id;
		if(nodeId=="svgcontent") return false;
		temStr = $('#'+nodeId).prop('outerHTML');//b.elem?b.elem.outerHTML:b.stack[0].elem.outerHTML;
		var temNode = $(temStr),
			proxy = $('[data-tar="'+temNode.attr('id')+'"]');
		if(temNode.is('.focus-cir'))temStr = temStr.replace('\#f00','none');
		if(proxy.length){
			if(proxy.find('textarea').val().length==0){
				return false;//if textarea is empty in IE;	
			}
			
			var transferedNode = foreignObjTransfer.toForeignObj(temNode);
			nodeText =encodeURIComponent(transferedNode.children()[0].outerHTML);
			temStr = transferedNode.empty().prop('outerHTML');
		}
		
		temNode .find('*').show();
		if(temNode.html()){
			nodeText =encodeURIComponent(temNode.html());
			temNode.html('');
			temStr = temNode[0].outerHTML;
			temNode = null;
		}
	}
	
	if(temStr){
		nodeContent = formatSvgStr(temStr);
	}
//	var fileName = location.search.split('?')[1].split('fileId=')[1].split('&')[0];
	// svg 保存
//	var save_svg_action = '../whiteboard?fileName='+fileName;
//	$.ajax({
//		type:"post",
//		url:save_svg_action,
//		data:{
//			nodeContent:nodeContent,
//			isDel:isdel,
//			nodeId:nodeId,
//			nodeText:nodeText,
//			clientId:window.clientId
//		},
//		async:true,
//		success:function(data){
//			console.log("img saved successfully!");
//		}
//	});
	YYIMChat.updateWhiteBoard({
		 wid:window.currentWhiteBoard.wid, // whiteboard id
		 nodeId: nodeId, // edited svg node id
		 nodeContent: nodeContent, // edited svg node content
		 nodeText: nodeText, // edited svg node text
		 operation: isdel?"delete":"update", //could be update delete,update default
		 success:function(){},
		 error:function(){},
		 complete:function(){},
	})
}
/*
 foreignObjTransfer
 * */
foreignObjTransfer = {
	toForeignObj:function(originNode){
		var foreignObj = document.createElementNS('http://www.w3.org/2000/svg','foreignObject'),
			attrObj = {
				'width':originNode.attr('width'),
				'height':originNode.attr('height'),
				'x':originNode.attr('x'),
				'y':originNode.attr('y'),
				'id':originNode.attr('id'),
				"requiredFeatures": "http://www.w3.org/TR/SVG11/feature#Extensibility"
			
			},
			proxy = $('[data-tar="'+originNode.attr('id')+'"]'),
			textarea_proxy = proxy.find('textarea');
		if(originNode.attr('data-eletype'))	attrObj['data-eletype']=originNode.attr('data-eletype');
		$(foreignObj).attr(attrObj);
		var textarea = $('<textarea>'),
			cssObj = {
				fontSize:textarea_proxy.css('font-size')/svgCanvas.zoomRatio,
				fontFamily:textarea_proxy.css('font-family'),
				color:textarea_proxy.css('color'),
				display:'inline-block',
				width:originNode.attr('width'),
				height:originNode.attr('height')
				
			}
		textarea.css(cssObj).html(textarea_proxy.val());
		textarea.attr({'xmlns':"http://www.w3.org/1999/xhtml",'class':'text-entity'});
		var nodeShell = $('<div xmlns="http://www.w3.org/1999/xhtml" class="clearfix" style="display: block; color: rgb(255, 0, 0);"></div>')
		nodeShell.append(textarea);
//		if(originNode.is('.baloon')){
		if(!!originNode.attr('data-eletype')&&originNode.attr('data-eletype')>=0){
				nodeShell.append('<span xmlns="http://www.w3.org/1999/xhtml" class="nth1" style="display: inline-block; color: rgb(255, 0, 0);"></span><span xmlns="http://www.w3.org/1999/xhtml" class="nth2" style="display: inline-block; color: rgb(255, 0, 0);"></span>');
		}
		$(foreignObj).append(nodeShell)
		return $(foreignObj);
	},
	toHtml:function(outerNode,innerNode){
		var outerHtmlELe = $('<div>'),
			innerHtmlEle = $('<textarea>'),
			proxy = $('[data-tar="'+outerNode.attr('id')+'"]'),
			node_r = $('#svgcanvas')[0],
			ldis_r = node_r.getBoundingClientRect().left,
			tdis_r = node_r.getBoundingClientRect().top,
			outerCssObj = {'left':outerNode.attr('x')*svgCanvas.zoomRatio,'top':outerNode.attr('y')*svgCanvas.zoomRatio+tdis_r,'width':outerNode.attr('width')*svgCanvas.zoomRatio,'height':outerNode.attr('height')*svgCanvas.zoomRatio},
			innerCssObj = {'font-size':innerNode.find('textarea').css('font-size'),'font-family':innerNode.find('textarea').css('font-family'),'color':innerNode.find('textarea').css('color')};
		innerHtmlEle.css(innerCssObj).val(innerNode.find('textarea').html());
		outerHtmlELe.css(outerCssObj).append(innerHtmlEle);
		if(!!outerNode.attr('data-eletype')&&outerNode.attr('data-eletype')>=0){
			outerHtmlELe.addClass('baloon baloon'+outerNode.attr('data-eletype'))
		}
		outerHtmlELe.attr('data-tar',outerNode.attr('id'));
		$('#fix_cover').find($('[data-tar="'+outerNode.attr('id')+'"]')).length>0?proxy.replaceWith(outerHtmlELe):$('#fix_cover').append(outerHtmlELe)
	}
}
//function polling(url){console.log(window.clientId)
// $.ajax({
// 	url:url,
// 	type:"get",
// 	success:function(data){
//	    handleUpdateData(data);
//	    console.log("ajax returned!",data);
//	    polling(url);
// 	},
// 	error:function(){
// 		polling(url);
// 	}
// });
//};
//// 获取svg更新
//polling("../whiteboard?fileName="+location.search.split('?')[1].split('fileId=')[1].split('&')[0]+"&clientId="+window.clientId);
function delOrNot(commandStr,flag){
	var Str = commandStr.toLowerCase();
	if((Str.indexOf("delete")>=0&&flag==0)||(Str.indexOf('create')>=0&&flag==1)){
		return true;	
	}
	return false;
}
function formatSvgStr(str){
	var res = str.replace(/\/\w{1,}>/g,'').replace(/\/>/g,'').replace(/[<>]/g,'').replace(/\+/g, '%2B').replace(/foreignobject/g, 'foreignObject');
	var index0;
	if((index0 = res.indexOf("style=\""))>=0){
		res = res.substr(0,index0).concat(res.substr((res.indexOf("\"",(index0+7))+1),res.length))
	}
	if((index1 = res.indexOf("xmlns:xlink=\""))>=0){
		res = res.substr(0,index1).concat(res.substr((res.indexOf("\"",(index1+13))+1),res.length))
	}
	if(res.indexOf("href")>=0&&res.indexOf("xlink:href")<0){
		res = res.replace(/href/g,"xlink:href");
	}
	return res;
}
function handleUpdateData(data){
	var updateNode = null;
	var ns = 'http://www.w3.org/2000/svg';
	var selectedElems = svgCanvas.getSelectedElems();
	var i;
	for(i=0;i<selectedElems.length;i++){//debugger;
		if($(selectedElems[i]).is('#'+data.nodeId)){
				svgCanvas.removeFromSelection([selectedElems[i]]);
			}
	}
	if(data.operation=="delete"){
		$("#svgcontent #"+data.nodeId).remove();
		if($('[data-tar="'+data.nodeId+'"]').length>0)$('[data-tar="'+data.nodeId+'"]').remove();
	}else{
		var temNode = "<"+data.nodeContent.replace(/\\/g,"")+"/>";
		updateNode = document.createElementNS(ns,data.nodeContent.split(' ')[0])
		if(svgCanvas.isIE&&$(updateNode).is('foreignObject')){
			updateNode = document.createElementNS(ns,'rect');
		}
		var attrs = $(temNode)[0].attributes;
		for(var k=0;k<attrs.length;k++){
			if(attrs[k].name=='xlink:href'){updateNode.href.baseVal = attrs[k].value;continue;}
			updateNode.setAttribute(attrs[k].name=="preserveaspectratio"?"preserveAspectRatio":attrs[k].name,attrs[k].value);
		}
		if($(updateNode).is('.focus-cir'))$(updateNode).attr('fill','#f00');
		if(data.nodeText&&data.nodeText!="null"){
//			updateNode.innerHTML = decodeURIComponent(data.nodeText);
			var innerNode = $(decodeURIComponent(data.nodeText));
			if(!svgCanvas.isIE){
				$(updateNode).append(innerNode);
			}else{
				$(updateNode).attr({'fill':'none','class':"text-holder"})
				foreignObjTransfer.toHtml($(updateNode),innerNode)
			}
		}
		$("#svgcontent #"+data.nodeId).length>0?$("#"+data.nodeId).replaceWith(updateNode):$('#svgcontent g').append(updateNode);
	}
}
$(document).on('change','#text',function(){
	var targetText = $('#'+window.curTxtId).clone();
//	window.curTxtId = null;
	targetText.html('');
	var fixTextObj = {
		elem:{
			id:targetText.attr('id'),
			outerHTML:targetText[0].outerHTML.replace(/text-anchor=\"middle\"/,""),
			nodeText:$(this).val(),
		},
		text:"create textNode"
	}
	changeState(fixTextObj,0);
	targetText = null;
	console.log(fixTextObj);
})
//solution to that outerHTML of SVGElement is undefined in most browsers
Object.defineProperty(SVGElement.prototype, 'outerHTML', {
    get: function () {
        var $node, $temp;
        $temp = document.createElement('div');
        $node = this.cloneNode(true);
        $temp.appendChild($node);
        return $temp.innerHTML;
    },
    enumerable: false,
    configurable: true
});
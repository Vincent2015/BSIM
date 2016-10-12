function changeState(b,isUndo){
	console.log(b);
	var isdel = delOrNot(b.text,isUndo);
	if(isdel&&b.stack&&b.stack[0]&&$(b.stack[0].elem.outerHTML).is('text')&&$(b.stack[0].elem.outerHTML).html().length==0){
		return false;
	}
	if(b.text.toLowerCase()=='create text'&&$(b.elem.outerHTML).html().length==0){
		return;
	}
	var temStr=nodeContent=nodeId=nodeText="";
		if(isdel){
			nodeId = b.elem?b.elem.id:b.stack[0].elem?b.stack[0].elem.id:b.stack[0].stack[0].elem.id;
		}else{//debugger;
			nodeId = b.elem?b.elem.id:b.stack[0].elem?b.stack[0].elem.id:b.stack[0].stack[0].elem.id;
			if(nodeId=="svgcontent") return false;
			temStr = $('#'+nodeId).prop('outerHTML');//b.elem?b.elem.outerHTML:b.stack[0].elem.outerHTML;
//								temStr = b.stack[0].elem?b.stack[0].elem.outerHTML:b.stack[0].stack[0].elem.outerHTML;
			var temNode = $(temStr);
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
	var res = str.replace(/\/\w{1,}>/g,'').replace(/\/>/g,'').replace(/[<>]/g,'').replace(/\+/g, '%2B');
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
	/*if("nodeAdd_nodeModify".indexOf(data.operation)>=0){
	}debugger;*/
	if(data.operation=="delete"){
		$("#svgcontent #"+data.nodeId).remove();
	}else{
		var temNode = "<"+data.nodeContent.replace(/\\/g,"")+"/>";
		updateNode = document.createElementNS(ns,data.nodeContent.split(' ')[0])
		var attrs = $(temNode)[0].attributes;
		for(var k=0;k<attrs.length;k++){
			if(attrs[k].name=='xlink:href'){updateNode.href.baseVal = attrs[k].value;continue;}
			updateNode.setAttribute(attrs[k].name,attrs[k].value)
		}
		if(data.nodeText&&data.nodeText!="null"){
			updateNode.innerHTML = decodeURIComponent(data.nodeText);
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
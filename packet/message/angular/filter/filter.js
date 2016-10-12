angular.module("IMChat.cutStringFilter", [])
.filter('cutString',function(){
	return function(input,direction,length){
		if(!input)return '';
		if(direction){
			return input.substr(input.length-length,length);
		}else{
			return input.substr(0,length);
		}
	}
});

///  消息表情过滤器  rongfl  2015-10-28  方便进行文本消息包含表情的展示处理
///  使用方法如下： <p  ng-bind-html="demoapp  | expressionFilter"> {{demoapp}} </p>
angular.module("IMChat.ExpressionFilter", ["IMChat.ThirdPlug"])
.filter("expressionFilter", function (_) {
    var filterfun = function (inputstr) {
        /// 数据为空的处理  
        if (inputstr) {
            _.each(SNSExpressionData.DEFAULT.data, function (element, index, list) {
				var temReg = element.actionData.replace(/\[/,'\/\\[').replace(/\]/,'\\]\/g');
                inputstr = inputstr.replace(eval(temReg), '<img  class="expression" src=' + '"' + SNSExpressionData.DEFAULT.folder + SNSExpressionData.DEFAULT.data[index].url + '"' + '/>');
            })
        }
    
        return inputstr;
    };
    return filterfun;
});

angular.module("IMChat.atMsgFilter", ["IMChat.ThirdPlug"])
.filter('atMsgFilter',function(_){
	 var filterfun = function (data) {
	 	inputstr = data.content;
	 	
	 	try{
	 		var obj = JSON.parse(data.extend);
		 	if(!!obj){
		 		for(var x in obj){
					var atuser = obj[x];
		 			if(!!atuser.id && atuser.id == YYIMChat.getUserID()){
		 				var temp = '';
		 				var atByBofore = '<span class="atByColor">';
		 				var atByAfter = '</span>';
		 				temp += inputstr.slice(0,atuser.start);
				 		temp += atByBofore + inputstr.slice(atuser.start,atuser.end) + atByAfter;
				 		temp += inputstr.slice(atuser.end);
				 		
				 		var appendLength = atByBofore.length + atByAfter.length;
				 		
				 		for(var y in obj){
			 				var item = obj[y];
				 			if(!!item.id && item.id != atuser.id){
					 			if(item.start >= atuser.end){
					 				item.start += appendLength;
					 				item.end += appendLength;
					 			}
					 		}
				 		}
				 		atuser.start += atByBofore.length;
				 		atuser.end += appendLength;
				 		inputstr = temp;
		 			}
		 		}
		 	};
	 	}catch(e){
	 		
	 	}
	 	
        /// 数据为空的处理  
        if (inputstr) {
            _.each(SNSExpressionData.DEFAULT.data, function (element, index, list) {
				var temReg = element.actionData.replace(/\[/,'\/\\[').replace(/\]/,'\\]\/g');
                inputstr = inputstr.replace(eval(temReg), '<img  class="expression" src=' + '"' + SNSExpressionData.DEFAULT.folder + SNSExpressionData.DEFAULT.data[index].url + '"' + '/>');
            })
        }
    	
        return inputstr;
    };
    return filterfun;
});
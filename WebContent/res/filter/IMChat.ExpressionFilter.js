﻿



/// <reference path="../../angular/angular.js" />
/// <reference path="../../angular/angular.min.js.map" />




///  消息表情过滤器  rongfl  2015-10-28  方便进行文本消息包含表情的展示处理

///  使用方法如下： <p  ng-bind-html="demoapp  | expressionFilter"> {{demoapp}} </p>

angular.module("IMChat.ExpressionFilter", ["IMChat.ThirdPlug", "IMChatExpressionService"])


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
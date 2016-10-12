/// <reference path="../../../angular/angular.min.js.map" />
/// <reference path="../../../angular/angular.min.js" />



///  聊天历史列表   rongfl


///  默认获取的就是当前用户的数据



///  chatlist  的数据模型应该为如下：

///    {
//           id："groupid   personid  subid"

//           name:"groupname  person name  subname"

//           type："group person subname"
//       }
///
///
///
///
///


angular.module("IMChat.ChatHistory.Service", ["IMChatUrl.Service", "ngStorage", "IMChat.ThirdPlug"])


.factory("IMChathistoryService", ["$localStorage", "urlParseService", "_", function ($localStorage, urlParseService, _) {




    if (urlParseService.pid !== undefined || urlParseService.tk != undefined) {


        if (!$localStorage["chatlist" + urlParseService.pid]) {
            $localStorage["chatlist" + urlParseService.pid] = [];
        }

    }




    var historyChatinfo = {


        ///  数据列表
        chatlist: $localStorage["chatlist" + urlParseService.pid],

        ///  头部添加
        addfirst: function (id, type, name) {
            $localStorage["chatlist" + urlParseService.pid] = _.filter($localStorage["chatlist" + urlParseService.pid], function (obj) { return obj.id != id; });
            $localStorage["chatlist" + urlParseService.pid].unshift({ id: id, type: type, name: name });
            this.chatlist = $localStorage["chatlist" + urlParseService.pid]
        },

        ///  末尾添加
        addlast: function (id, type, name) {
            $localStorage["chatlist" + urlParseService.pid] = _.filter($localStorage["chatlist" + urlParseService.pid], function (obj) { return obj.id != id; });
            $localStorage["chatlist" + urlParseService.pid].push({ id: id, type: type, name: name });
            this.chatlist = $localStorage["chatlist" + urlParseService.pid];
        }
    };

    return historyChatinfo;



} ])
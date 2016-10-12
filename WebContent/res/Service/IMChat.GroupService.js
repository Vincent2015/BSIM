
/// <reference path="../../../angular/angular.js" />
/// <reference path="../../../angular/angular.min.js.map" />



///   群组人员信息获取   


angular.module("IMChat.groupService",[])

.factory("groupService", function () {


    var groupList = [];
    YYIMChat.getChatGroups({
        success: function (roomList) {

            var list = JSON.parse(roomList);

           groupList = list;
        },
        error: function (errorInfo) {


        }
    });

    return groupList;


})
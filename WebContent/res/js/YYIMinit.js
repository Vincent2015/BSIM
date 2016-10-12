$(document).ready(function () {
    SNS_BASE_BATH = window.getSNSBasePath();
    YYIMChat.initSDK("mim", "im");
    /* 初始化SDK */
    YYIMChat.init({
        onOpened: onOpened,
        onClosed: SNSHandler.getInstance().onClosed,
        onAuthError: SNSHandler.getInstance().onAuthError,
        onStatusChanged: SNSHandler.getInstance().onStatusChanged,
        onConnectError: SNSHandler.getInstance().onConnectError,
        onUserBind: SNSHandler.getInstance().onUserBind,
        onPresence: SNSHandler.getInstance().onPresence,
        onSubscribe: SNSHandler.getInstance().onSubscribe,
        onRosterUpdateded: SNSHandler.getInstance().onRosterUpdateded,
        onRosterDeleted: SNSHandler.getInstance().onRosterDeleted,
        onRoomMemerPresence: SNSHandler.getInstance().onRoomMemerPresence,
        onReceipts: SNSHandler.getInstance().onReceipts,
        onTextMessage: SNSHandler.getInstance().onTextMessage,
        onPictureMessage: SNSHandler.getInstance().onPictureMessage,
        onFileMessage: SNSHandler.getInstance().onFileMessage,
        onShareMessage: SNSHandler.getInstance().onShareMessage,
        onMessageout: SNSHandler.getInstance().onMessageout
    });

    //YYIMChat.login('rongfl','23de9da0-fe6c-4fc9-90a4-7355299938e9');
    DemoLogin();
    function onOpened() {

        snsLoginConflict = false; // 连接后, 不冲突, 自动登录

        YYIMChat.getRosterItems({
            success: function (rosterList) {
                // 好友列表为如下JSON格式

                console.log("info is:");
                console.log(rosterList);
            },
            error: function (errorInfo) {
            }
        });
    }
});

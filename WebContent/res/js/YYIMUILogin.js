 
     function DemoLogin(){
	   
	    var  usermodel={
		   
		   username:"rongfl",
		   token:"111"
		   
	      };

		//SNSApplication.getInstance().login(usermodel.username, usermodel.token);
	   
	    var user = SNSApplication.getCookie('username');

        var expiration = SNSApplication.getCookie('expiration');

		if (user == null || expiration - new Date().getTime() <= 10000)
		{
			 SNSApplication.getInstance().login(usermodel.username, usermodel.token);
		}
		var token = SNSApplication.getCookie('token');
		if (user && token && !snsLoginConflict) {

			//afterLogin();

			SNSApplication.getInstance().login(usermodel.username, usermodel.token, true);

		}

}
SNSApplication.getInstance()
   $(".IMChat-send-btn").on("click", SendMessage);
   function SendMessage(text)
   {



       var text = text;


       var ob = {
        to: "0000060669",
        msg: text, // "[:]"中内容为表情
        type: "chat", // 群消息则为"groupchat"
        success: function () {
            alert("ok")
        },
        error: function (errorInfo) {
            //alert("error")
			
			console.log(errorInfo);
        }
    };
    YYIMChat.sendTextMessage(ob);
			
		 
	   
   }

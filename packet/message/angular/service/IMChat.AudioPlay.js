///  支持消息提示播放声音
angular.module("IMChat.AudioPlay",[])
.factory("audioPlayService",[function(){
 var myAudioWin = new Audio();
 myAudioWin.setAttribute("src", "message/angular/audio/4228.mp3");

  return  {
  	play:function(){
      myAudioWin.play();//播放
  	}
  }
}])




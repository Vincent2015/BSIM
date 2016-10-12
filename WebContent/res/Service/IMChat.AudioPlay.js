

///  支持消息提示播放声音

///  rongfl 


angular.module("IMChat.AudioPlay",[])
.factory("audioPlayService",[function(){
//var audioel=jQuery("#messsageaudio")[0];
//
//var audioel=jQuery('<audio id="messsageaudio" src="WebContent/res/audio/4228.mp3" autoplay="autoplay"></audio>')''

 var myAudioWin = new Audio();
 myAudioWin.setAttribute("src", "WebContent/res/audio/4228.mp3");

  return  {
  	
  	play:function(){
//		console.log("play");
//		console.log(audioel);
//		audioel.pause();  
//    audioel.play(); 
      myAudioWin.play();//播放
  	}
  	
  }
	
	
}])




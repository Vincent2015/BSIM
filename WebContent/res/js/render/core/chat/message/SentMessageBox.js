var SNSSentMessageBox = function(message){
	this.message;
	if(message && message instanceof SNSMessage){
		this.message = message;
	}else{
		throw "SNSReceivedMessageBox: Constructor: invalid param: message:"+message;
	}
	
	this.selector = "#snsim_message_box_sent_"+message.id;
};

SNSSentMessageBox.prototype = new SNSMessageBox();

SNSSentMessageBox.template = 
	'<div id="snsim_message_box_sent_##{{id}}" style="margin:10px 0 0 0" class="nsim_message_box_sent snsim_dia_box snsim_dia_r clearfix">'
	+'<div class="dia_info">'
		+'<span class="info_date" action-data="##{{body.dateline}}">##{{getHumanizeDateString()}}</span>'
	+'</div>'
//	+'<div style="float:right; margin:18px 0 0 12px;">'
//		+'<img height="36px" style="border-radius:30px" src="##{{SNSApplication.getInstance().getUser().vcard.getPhotoUrl()}}"/>'
//	+'</div>'
	+'<div class="snsim_dia_bg W_fr">'
		+'<div class="dia_con">'
			+'<div class="dia_txt">##{{getBodyHtml()}}</div>'
		+'</div>'
		+'<div class="msg_arr"></div>'
	+'</div>'
	+'<div class="sns_message_status W_fr" style="top: 26px; position: relative;"></div>'
+'</div>';

SNSSentMessageBox.prototype.getTemplate = function(){
	return SNSSentMessageBox.template;
}
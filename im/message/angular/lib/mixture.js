var isShowWindow = true;
var ismax = false;
window.ctrlpress = false;
window.shiftpress = false;
window.ismaxmac = false;
window.newversion = "0.0.2";
var ismac = window.navigator.userAgent.indexOf('Mac') > -1 ? true : false;
var iswin = window.navigator.userAgent.indexOf('Windows') > -1 ? true : false;
var isnw = window.navigator.userAgent.toLowerCase().indexOf('nw') > -1 ? true : false;
var islinux = window.navigator.userAgent.toLowerCase().indexOf('linux') > -1 ? true : false;

var snsLoginConflict = false;

function getSNSBasePath() {
	return location.href.replace('index.html', '');
};

function imgErr(target) {
	target.attr('src', 'message/angular/style/images/filetype/file_default.jpg');
}

$(document).on('click', function(e) {
	var _target = jQuery(e.target);
	if (!_target.closest('.trigger').length) {
		jQuery('.fold-menu').addClass('hidden');
		if (_target.closest('.setting-item').length) {
			_target.closest('.setting-item').find('.fold-menu').removeClass('hidden');
		}
		if (!_target.closest('.IMChat-model-bd,input.ui-select-search,.ui-select-choices-group,.ui-select-match,.ui-select-match-close').length) {
			jQuery('.IMChat-model-cover,.IMChat-model-bd').addClass('hidden');
		}
	}
	if (_target.parent().hasClass('IMChat-menu-items')) {
		jQuery('.IMChat-menu-items>li').removeClass('cur');
		_target.addClass('cur');
	}
	if (_target.closest('.list-item').length) {
		jQuery('.list-item').removeClass('cur');
		_target.closest('.list-item').addClass('cur');
	}
});

$(document).on('click', '.screenshot-tool span', function(e) {
	e.preventDefault();
	e.stopPropagation();
	jQuery(e.target).siblings('ul').toggleClass('hidden');
});
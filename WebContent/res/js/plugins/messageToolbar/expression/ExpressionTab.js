var SNSExpressionTab = function(expressionItem){
	this.data = expressionItem;
};

/**
 * Tab头部使用的模板
 * @static
 */
SNSExpressionTab.headTemplate;

/**
 * Tab内容部分使用的模板
 * @static
 */
SNSExpressionTab.contentTemplate;

SNSExpressionTab.prototype = new SNSTab();


/**
 * 返回头部模板，用于屏蔽不同Tab的模板声明的不同
 * @returns {String}
 * @Abstract
 */
SNSExpressionTab.prototype.getHeadTemplate = function(){
	return SNSExpressionTab.headTemplate;
};

/**
 * 返回内容模板，用于屏蔽不同Tab的模板声明的不同
 * @returns {String}
 * @Abstract
 */
SNSExpressionTab.prototype.getContentTemplate = function(){
	return SNSExpressionTab.contentTemplate;
};
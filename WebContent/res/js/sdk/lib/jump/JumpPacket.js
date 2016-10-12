function shallowClone(o){
    function F(){}
    F.prototype = o;
    return new F();
}

function inheritPrototype(subType, superType){
    var prototype = shallowClone(superType.prototype);
    prototype.constructor = subType;
    subType.prototype = prototype;
}

function JumpPacket(content, opcode) {
	this.sFrame = 0; // 控制帧
	this.version = 0x0100;
	this.seqId = 0;
	this.packetLen = 0;
	this.content = content;
	this.opcode = opcode;
}
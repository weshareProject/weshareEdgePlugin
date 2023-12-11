
let HighlightTools=(()=>{
	
	
	
	
	
	
	//init
	function init(){
		document.body.normalize();
	}
	
	return {
		init:init		
	}
})();
HighlightTools.init();

//高亮
function Highlight(){
	let sel=window.getSelection();
	if(sel.rangeCount<=0){
		console.log('no range');
		return;
	}
	
	let range=sel.getRangeAt(0);
	
	if(range.collapsed){
		console.log('range collapsed');
		return;
	}
	
	sel.empty();
	sel.addRange(range);
	
	let uid=NoteManager.createUID();
	
	let hlentity=HighlightFactory(uid,range);
	
	
	
}




//高亮工厂
function HighlightFactory(uid,range=new Range()){
	/*
	高亮基本格式:	
	{uid:{
		"uid":uid,
		"content":内容,
		position位置:{
			top:top坐标,
			left:left坐标,
			type:类型},
		"permission":private/public,
		"ownerId":创建者,
		"ownerName":创建者昵称,
		status:状态,
	    url:所在网页url,
		webtitle:所在网页title,
		createtime:创建时间
	}...};
	*/
	let nodes=[];//所有包含的高亮节点
	let createtime=Date.now();
	
	//滚动至位置
	function scrollToNote(){
		let rect=range.getBoundingClientRect();
		let left_=react.x;
		let top_=react.y;
		
		let ht=document.documentElement.clientHeight || document.body.clientHeight;
		window.scrollTo({left:left_,top:top_-ht/4,behavior:'smooth'});
	}
	
	//闪烁
	function blink(){
		for(let i=0;i<nodes.length;i++){
			let nownode=nodes[i];
			nownode.animate({
				opacity: [ 0,1 ]
			},{
				duration: 500,
				iterations: 4,
			});
		}
	}
	
	//设置位置
	function setPosition(pos){
		if(pos.startContainer&&pos.startOffset&&pos.endContainer&&pos.endOffset){
			range.setStart(pos.startContainer,pos.startOffset);
			range.setEnd(pos.endContainer,pos.endOffset);
			return true;
		}
		return false;
	}
	
	//设置obj
	function setObj(obj){
		setPosition(obj.position);
		createtime=obj.createtime;
		
	}
	
	//获取obj
	function getObj(){
		let wbObj=NoteManager.getWebObj();
		let url=wbObj.url;
		let webtitle=wbObj.title;
		let obj={
			uid:uid,
			pos:{
				//startContainer:range.startContainer,
				startOffset:range.startOffset,
				//endContainer:range.endContainer,
				endOffset:range.endOffset
			},
			content:range.toString(),
			url:url,
			webtitle:webtitle,
			createtime:createtime
		}
		
		return obj;
	}
	
	//初始化
	function init(){
		
	}
	
	return {
		init:init,
		blink:blink,
		scrollToNote:scrollToNote,
		setPosition:setPosition,
		getObj:getObj,
		setObj:setObj
	}
}






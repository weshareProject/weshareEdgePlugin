
//节点处理者
let NodeProcessor=(()=>{
	
	let nodes=[];//存储所有节点
	
	//获取所有节点
	async function getAllNodes(){
		nodes = [];
		
		/*
		let walker=document.createTreeWalker(document.body);
		for(;walker.nextNode();){
			nodes.push(walker.currentNode);
		}
		*/
		
		nodes=await document.querySelectorAll('*');
	}
	
	//寻找特点节点在所有节点中的index
	function findIndex(node){
		let res = -1;
		for(let i=0;i<nodes.length;i++){
			if(nodes[i]===node){
				res=i;
				break;
			}
		}
		return res;
	}
	
	//根据index确认节点
	function getNodeByIndex(index){
		return nodes[index];
	}
	
	//返回范围内的type类型节点
	function getNodeByFragment(fragment,type,isRecursed=false){
		let res=[];
		
		let childNodes=fragment.childNodes;
		for(let i=0;i<childNodes.length;i++){
			let nownode=childNodes[i];
			if(!nownode){
				continue;
			}
			if(nownode.nodeType==type){
				res.push(nownode);
				console.log(nownode.nodeValue);
			}else if(isRecursed){
				let txtnodes=getTextNodeByFragment(nownode);//递归获取子节点
				if(txtnodes.length>0){
					for(let j=0;j<txtnodes.length;j++){
						res.push(txtnodes[j]);
						console.log(txtnodes[j].nodeValue);
					}
				}
			}
		}
		return res;
	}
	
	
	//获取startIndex至endIndex间类型为type的node
	function getNodeByType(startIndex,endIndex,type){
		let res=[];
		
		for(let i=startIndex;i<=endIndex;i++){
			let node=getNodeByIndex(i);
			let tres=getNodeByFragment(node,Node.TEXT_NODE);
			if(tres.length>0){
				tres.forEach((item)=>{
					res.push(item);
				});
			}
		}
		

		return res;
	}
	
	//初始化
	async function init(){
		document.body.normalize();
		await NodeProcessor.getAllNodes();
	}
	
	return {
		init:init,
		getAllNodes:getAllNodes,
		findIndex:findIndex,
		getNodeByIndex:getNodeByIndex,
		getNodeByFragment:getNodeByFragment,
		getNodeByType:getNodeByType
		
	}
})();



//高亮管理员
let HighlightManager=(()=>{
	
	//高亮实体
	let HighlightEntities={};
	
	//生成uid
	function createUID(){
		let prefix="temp";
		let timestamp=Date.now();//时间戳
		let postfix=(()=>{
			return Math.random().toString(36).slice(-8) || "nufix";//随机后缀
		})();
		let uid=prefix+timestamp.toString(36)+postfix;
		return uid;
	}
	
	//new
	function newHighlight(){
		let sel=window.getSelection();
		if(sel.rangeCount&&sel.getRangeAt){
			range=sel.getRangeAt(0);
			sel.empty();
			if(!range.collapsed){
				let uid=createUID();
				let newHighlight=HighlightFactory(uid,range);
				newHighlight.init();
				let hlObj=newHighlight.getObj();
				console.log(hlObj);
				if(hlObj){
					HighlightEntities[uid]=newHighlight;
					save();
				}
			}
		}
	}
	
	//remove
	function removeHighlight(uid){
		if(HighlightEntities[uid]){
			delete HighlightEntities[uid];
		}
		save();
	}
	
	//save
	function save(){
		let hls={};
		for(let i in HighlightEntities){
			let item=HighlightEntities[i];
			let hlObj=item.getObj();
			let uid=hlObj.uid;
			hls[uid]=hlObj;
		}
		console.log(hls);
		localStorage.setItem('weshareHighlight-'+window.location.pathname,JSON.stringify(hls));
		
	}
	
	//load
	function load(){
		let hls={};
		let tp=localStorage.getItem(('weshareHighlight-'+window.location.pathname));
		if(tp){
			hls=JSON.parse(tp);
		}
		console.log(hls);
		
		for(let i in hls){
			let item=hls[i];
			let hl=HighlightFactory(i,new Range());
			hl.setRange(item.position);
			hl.highlight();
		}
	}
	
	//init
	function init(){
		load();
	}
	
	
	
	return {
		init:init,
		newHighlight:newHighlight,
		removeHighlight:removeHighlight,
		load:load,
		save:save
	}
	
})();


(async ()=>{
	await NodeProcessor.init();
	HighlightManager.init();
})();



//高亮工厂
function HighlightFactory(uid,range){
	//内容
	let content=null;
	//包含的节点
	let nodes=[];
	//是否成功
	let success=false;
	//颜色
	let hlcolor='yellow';
	
	//range相关
	let startContainer=null;
	let startOffset=null;
	let endContainer=null;
	let endOffset=null;
	let startContainerIndex=null;
	let endContainerIndex=null;
		
	//高亮范围
	function highlight(){
	
		if(startContainerIndex<0||endContainerIndex<0){
			alert('选区获取失败');
			success=false;
			return;
		}
		
		
		let textnodes=NodeProcessor.getNodeByType(startContainerIndex,endContainerIndex,Node.TEXT_NODE);
		
		if(textnodes.length<=0){
			alert('选区内无可高亮文字');
			success=false;
			return;
		}
		
		if(textnodes.length==1){
			let tsplt=textnodes[0].splitText(startOffset);
			console.log(tsplt);
			tsplt=tsplt.splitText(endOffset-startOffset);
			console.log(tsplt);
			let parnode=tsplt.parentNode;
			let handlenode=parnode.childNodes[1];
			
			
			let hlnode=document.createElement('span');
			hlnode.classList.add('highlight');
			hlnode.style.setProperty('--hlcolor',hlcolor);
			hlnode.dataset.uid=uid;
			hlnode.appendChild(handlenode.cloneNode());
			handlenode.parentNode.replaceChild(hlnode,handlenode);
			nodes.push(hlnode);
			hlnode.addEventListener('dblclick',()=>{
				removeHighlight();
			});
		}else{
			let hlnode=null;
			let tsplt=textnodes[0].splitText(startOffset);
			let fstnode=tsplt.parentNode.childNodes[1];
			
			
			hlnode=document.createElement('span');
			hlnode.classList.add('highlight');
			hlnode.style.setProperty('--hlcolor',hlcolor);
			hlnode.dataset.uid=uid;
			hlnode.appendChild(fstnode.cloneNode());
			fstnode.parentNode.replaceChild(hlnode,fstnode);
			nodes.push(hlnode);
			hlnode.addEventListener('dblclick',()=>{
				removeHighlight();
			});
			
			for(let i=1;i<textnodes.length-1;i++){
				handlenode=textnodes[i];
				
				hlnode=document.createElement('span');
				hlnode.classList.add('highlight');
				hlnode.style.setProperty('--hlcolor',hlcolor);
				hlnode.dataset.uid=uid;
				hlnode.appendChild(handlenode.cloneNode());
				
				handlenode.parentNode.replaceChild(hlnode,handlenode);
				nodes.push(hlnode);
			
				hlnode.addEventListener('dblclick',()=>{
					removeHighlight();
				});
			}
			
			console.log(textnodes[textnodes.length-1].nodeValue);
			tsplt=textnodes[textnodes.length-1].splitText(endOffset);
			let lstnode=tsplt.parentNode.firstChild;
			hlnode=document.createElement('span');
			hlnode.classList.add('highlight');
			hlnode.style.setProperty('--hlcolor',hlcolor);
			hlnode.dataset.uid=uid;
			hlnode.appendChild(lstnode.cloneNode());
			lstnode.parentNode.replaceChild(hlnode,lstnode);
			nodes.push(hlnode);
			hlnode.addEventListener('dblclick',()=>{
				removeHighlight();
			});
		}
		
		success=true;
	}
	
	//移除高亮
	function removeHighlight(){
		for(let i=0;i<nodes.length;i++){
			let nownode=nodes[i];
			let cnode=nownode.firstChild;
			let parNode=nownode.parentNode;
			parNode.replaceChild(cnode,nownode);
			parNode.normalize();
		}
		notes=[];
		HighlightManager.removeHighlight(uid);
	}
	
	//获取obj
	function getObj(){
		if(!success){
			return null;
		}
		
		let position={'startContainerIndex':startContainerIndex,'endContainerIndex':endContainerIndex,'startOffset':startOffset,'endOffset':endOffset};

		return {uid:uid,position:position,content:content};
	}
	
	//设置range
	function setRange(position){
		if(!position.startContainerIndex||!position.endContainerIndex||!position.startOffset||!position.endOffset){
			return;
		}
		
		startContainerIndex=position.startContainerIndex;
		startOffset=position.startOffset;
		endContainerIndex=position.endContainerIndex;
		endOffset=position.endOffset;
		
		startContainer=NodeProcessor.getNodeByIndex(startContainerIndex);
		endContainer=NodeProcessor.getNodeByIndex(endContainerIndex);
		
		range=new Range();
		range.setStart(startContainer,0);
		range.setEnd(endContainer,0);
	}
	
	//设置颜色
	function setHLcolor(color){
		hlcolor=color;
		for(let i=0;i<nodes.length;i++){
			hlnode=textnodes[i];
			hlnode.style.setProperty('--hlcolor',hlcolor);
		}
		
	}
	
	
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
		for(let i=0;i<notes.length;i++){
			let nownode=notes[i];
			nownode.animate({
				opacity: [ 0,1 ]
			},{
				duration: 500,
				iterations: 4,
			});
		}
	}
	
	
	//初始化
	function init(){
		if(range){
			
			content=range.toString();
			
			startContainer=range.startContainer;
			startOffset=range.startOffset;
			endContainer=range.endContainer;
			endOffset=range.endOffset;
			
			range.setStartBefore(startContainer);
			range.setEndAfter(endContainer);
			
			startContainer=range.startContainer;
			endContainer=range.endContainer;
		
			startContainerIndex=NodeProcessor.findIndex(startContainer);
			endContainerIndex=NodeProcessor.findIndex(endContainer);
			
			console.log({'startContainerIndex':startContainerIndex,'endContainerIndex':endContainerIndex,'startOffset':startOffset,'endOffset':endOffset});
			
			highlight(range);
		}
	}
	
	return {
		init:init,
		highlight:highlight,
		getObj:getObj,
		setRange:setRange,
		removeHighlight:removeHighlight,
		blink:blink,
		scrollToNote:scrollToNote
	}
}






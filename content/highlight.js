
//节点处理者
let NodeProcessor=(()=>{
	
	let nodes=[];//存储所有节点
	
	//获取所有节点
	function getAllNodes(){
		nodes = [];
		/*
		let walker=document.createTreeWalker(document.body);
		for(;walker.nextNode();){
			nodes.push(walker.currentNode);
		}
		*/
		nodes=document.body.querySelectorAll('*');
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
	
	//返回范围内的textNode节点
	function getTextNodeByFragment(fragment){
		let res=[];
		
		let childNodes=fragment.childNodes;
		for(let i=0;i<childNodes.length;i++){
			let nownode=childNodes[i];
			if(!nownode){
				continue;
			}
			if(nownode.nodeType==Node.TEXT_NODE){
				res.push(nownode);
			}else{
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
	
	//初始化
	function init(){
		document.body.normalize();
		NodeProcessor.getAllNodes();
	}
	
	return {
		init:init,
		getAllNodes:getAllNodes,
		findIndex:findIndex,
		getNodeByIndex:getNodeByIndex,
		getTextNodeByFragment:getTextNodeByFragment
		
	}
})();
NodeProcessor.init();

function Highlight(uid,range){
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
	function highlight(range){
		console.log(range);
		
		if(!range){
			alert('选区获取失败');
			success=false;
			return;
		}
		
		if(startContainerIndex<0||endContainerIndex<0){
			alert('选区获取失败');
			success=false;
			return;
		}
		
		
		let fragment=range.extractContents();
		let textnodes=NodeProcessor.getTextNodeByFragment(fragment);
		
		if(textnodes.length<=0){
			range.insertNode(fragment);
			alert('选区内无可高亮文字');
			success=false;
			return;
		}
		
		
		if(startContainer===endContainer&&endOffset<=textnodes[0].nodeValue.length){
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
		
		range.insertNode(fragment);
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
		}
		highlight(range);
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







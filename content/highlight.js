
//获取所有节点
let allNode={
	nodes:[],
	//获取所有节点
	getAllNodes:function(){
		let res = [];
		let walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
		for(;walker.nextNode();){
			res.push(walker.currentNode);
		}
		allNode.nodes=res;
	},
	//寻找特点节点在所有节点中的index
	findIndex:function(node){
		let res = -1;
		let nodes=allNode.nodes;
		for(let i=0;i<nodes.length;i++){
			if(nodes[i]==node){
				res=i;
				break;
			}
		}
		return res;
	},
	//初始化
	init:function(){
		allNode.getAllNodes();
	}
};
allNode.init();

let Highlight={
	//标记颜色
	color:"yellow",
	highlights:{},
	//初始化
	init:function(){
		Highlight.load.auto();
	},
	//生成高亮uid
	makeUid:function(){
		return Date.now();
	},
	//保存
	save:{
		//本地
		local:function(){
			console.log(Highlight.highlights);
			console.log(JSON.stringify(Highlight.highlights));
			localStorage.setItem("weshareHighlight-"+window.location.pathname,JSON.stringify(Highlight.highlights));
			localStorage.setItem("weshareHighlight-LastSave",Date.now());
		},
		//云端
		cloud:function(){
			//TODO
				
		},
		//自动判断
		auto:function(){
			Highlight.save.local();
		}
	},
	
	//载入
	load:{
		//本地
		local:function(){
			let hl=localStorage.getItem("weshareHighlight-"+window.location.pathname);
			if(hl)Highlight.highlights=JSON.parse(hl);
		
			console.log(Highlight.highlights);
			let hls=Highlight.highlights;
			for(let h in hls){
				let id=h;
				let startContainerIndex=hls[h]['startContainerIndex'];
				let endContainerIndex=hls[h]['endContainerIndex'];
				let startOffset=hls[h]['startOffset'];
				let endOffset=hls[h]['endOffset'];
				let range=new Range();
				
				range.setStart(allNode.nodes[startContainerIndex],startOffset);
				range.setEnd(allNode.nodes[endContainerIndex],endOffset);
				
				Highlight.dohighlight(id,range);
			}
			
		},
		//云端
		cloud:function(){
			//TODO
		},
		//自动判断
		auto:function(){
			Highlight.load.local();
		}
	},
	//判断结点是否相等
	makeFilter:function(node1){
		return function(node2){
			return (node1==node2);
		}
	},
	//高亮处理函数
	highlight:async function(){
		let range=null;
		const sel=window.getSelection();
		
		if(sel.rangeCount&&sel.getRangeAt){
			range=sel.getRangeAt(0);
			sel.removeAllRanges();
			sel.addRange(range);
			
			let startContainer=range.startContainer;
			let startOffset=range.startOffset;
			let endContainer=range.endContainer;
			let endOffset=range.endOffset;
			
			let id=Highlight.makeUid();
			
			let startContainerIndex=allNode.findIndex(startContainer);
			let endContainerIndex=allNode.findIndex(endContainer);
		
			let position={'startContainerIndex':startContainerIndex,'endContainerIndex':endContainerIndex,'startOffset':startOffset,'endOffset':endOffset};
			console.log(position);
			console.log(JSON.stringify(position));
			Highlight.highlights[id]=position;
			Highlight.save.auto();
			Highlight.dohighlight(id,range);
		}
	},
	//对给定range高亮
	dohighlight(id,range){
		let color=Highlight.color;
		let spannode=document.createElement("span");
		spannode.id=id;
		spannode.style.backgroundColor=color;
		spannode.style.display="inline";
		spannode.appendChild(range.extractContents());
		
		spannode.addEventListener("dblclick",()=>{Highlight.removehighlight(spannode);});
		
		range.insertNode(spannode);
	},
	//去除高亮
	removehighlight(node){
		
		let id=node.id;
		delete Highlight.highlights[id];
		Highlight.save.auto();
		let ib=document.createTextNode(node.textContent);
		
		node.parentNode.insertBefore(ib,node);
		node.parentNode.removeChild(node);
	}
};

Highlight.init();







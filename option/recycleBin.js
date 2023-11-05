function $(id){
	return document.getElementById(id);
}

//与background交互的操作码
const OPERATION_CODE_RECYCLEBIN={
	//操作码固定3位
	NO_ACTION:100,
	
	//8xx为回收站相关
	GET_RECYCLE_BIN:801,
	RECYCLE_NOTE:802,
	CLEAR_RECYCLE_NOTE:803
	
};


//回收站对象
let NoteRecycleBin=(()=>{
	
	let recycleBinDiv=$('recycleBin');
	
	//载入
	async function load(){
		recycleBinDiv.innerHTML="";
		await chrome.runtime.sendMessage({op:OPERATION_CODE_RECYCLEBIN.NO_ACTION});
		let resp=await chrome.runtime.sendMessage({op:OPERATION_CODE_RECYCLEBIN.GET_RECYCLE_BIN});
		if(resp=="{}"){
			recycleBinDiv.innerHTML="<div style='color:red;font-size:1.5rem;'>空</div>";
		}else{
			resp=JSON.parse(resp);
			for(let uid in resp){
				NoteRecycleItemFactory(resp[uid]);
			}
		}	
	}
	
	//点击清空回收站
	$('clearRecycleBin').onclick=async()=>{
		let check=window.confirm("警告：该操作无法还原！确认清空回收站么？")
		if(check){
			await chrome.runtime.sendMessage({op:OPERATION_CODE_RECYCLEBIN.NO_ACTION});
			await chrome.runtime.sendMessage({op:OPERATION_CODE_RECYCLEBIN.CLEAR_RECYCLE_NOTE});
			await load();
		}
	};
	
	
	return {
		load:load
	}
})();
NoteRecycleBin.load();




//回收条目生成
function NoteRecycleItemFactory(noteObj){
	//生成项目
	let dv=document.createElement('div');
	dv.classList.add("webitem");
	
	//还原按钮
	let rebtn=document.createElement('a');
	rebtn.innerHTML="[还原]";
	//还原功能
	rebtn.onclick=async()=>{
		await chrome.runtime.sendMessage({op:OPERATION_CODE_RECYCLEBIN.NO_ACTION});
		await chrome.runtime.sendMessage({op:OPERATION_CODE_RECYCLEBIN.RECYCLE_NOTE,noteObj:noteObj});
		await NoteRecycleBin.load();
	};
	
	dv.appendChild(rebtn);
	
	let content=noteObj.content;
	let url=noteObj.url;
	let webtitle=noteObj.webtitle;
	dv.title=webtitle+":"+url;
	let tp=document.createElement('div');
	tp.innerHTML=content;
	content=tp.innerText;
	dv.appendChild(document.createTextNode(content));
	
	$('recycleBin').appendChild(dv);
}



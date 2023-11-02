function $(id){
	return document.getElementById(id);
}

(async ()=>{
	await chrome.runtime.sendMessage({op:"noaction"});//唤醒background
})();



//回收站对象
let NoteRecycleBin=(()=>{
	
	let recycleBinDiv=$('recycleBin');
	
	//载入
	async function load(){
		recycleBinDiv.innerHTML="";
		let resp=await chrome.runtime.sendMessage({op:"getRecycleBin"});
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
			await chrome.runtime.sendMessage({op:"clearRecycleBin"});
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
		await chrome.runtime.sendMessage({op:"recycleNote",noteObj:noteObj});
		await NoteRecycleBin.load();
	};
	
	dv.appendChild(rebtn);
	
	let content=noteObj.content;
	let url=noteObj.url;
	let webtitle=noteObj.webtitle;
	dv.title=webtitle+":"+url;
	dv.appendChild(document.createTextNode(content));
	
	$('recycleBin').appendChild(dv);
}



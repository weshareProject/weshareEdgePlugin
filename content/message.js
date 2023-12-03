
//记录右键鼠标坐标
let clickpoint={x:0,y:0};
document.body.addEventListener("contextmenu",(event)=>{
	clickpoint.x=event.clientX;
	clickpoint.y=event.clientY;
	//console.log(clickpoint);
});


//消息处理器
let MessagerHandler=(()=>{
	let handlers={};
	
	//增加笔记
	handlers['addNote']=function(message){
		if(message.position=='clickpoint')NoteManager.newNote(clickpoint);
		else NoteManager.newNote();
	};
	
	//高亮
	handlers['highlight']=function(message){
		Highlight.highlight();
	};
	
	//公开笔记
	handlers['highlight']=function(message){
		PublicNoteManager.changeParentDivVisible();
	};
	
	//定位笔记
	handlers['locateNote']=function(message){
		NoteManager.locateNote();
	};
	
	return handlers
})();






//接收处理
chrome.runtime.onMessage.addListener((request,sender,response)=>{
		if(request.op){
			let handler=MessagerHandler[request.op];
			if(handler){
				handler(request);
			}
		}
});



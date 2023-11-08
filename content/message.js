
//记录右键鼠标坐标
let clickpoint={x:0,y:0};
document.body.addEventListener("contextmenu",(event)=>{
	clickpoint.x=event.clientX;
	clickpoint.y=event.clientY;
	//console.log(clickpoint);
});

//接收处理
chrome.runtime.onMessage.addListener((request,sender,response)=>{
		if(request.op)if(request.op=="addNote"){
			if(request.position=='clickpoint')NoteManager.newNote(clickpoint);
			else NoteManager.newNote();
		}else if(request.op=="highlight"){
			Highlight.highlight();
		}else if(request.op=="publicNoteSwitch"){
			PublicNoteManager.changeParentDivVisible();
		}
});



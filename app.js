var Client = (function() {
	var socket = null,								
		id = "",
		_items = new Map(),
		scrollTop = 0,
		ticking = false;		
		
	var button_connect,
		tableContainer,
		table,	
		container_input,
		container_wait,
		container_ae2;		
		
	var ITEM = {
			ADD: 0,
			REMOVE: 1,
			UPDATE: 2
		}
		
	function getComputerID() {
		var input = document.getElementById('opencomputer-id-input');
		input.addEventListener("focusout", (e) => {		
			id = input.value.substring(0, 16);				
		})		
	}	
	function validateID() {
		if(!id || id == "") {
			var input = document.getElementById('opencomputer-id-input');
			id = input.value.substring(0, 16);
		}		
		if (id.length > 0 && id.length <= 16) {
			return true;
		}	
		return false;
	}
	
	function safelyParseJSON (json) { 
 	 	try {
    		return JSON.parse(json);
  		} catch (e) {
			console.error(e);
    		return {};
  		}  
	}
	
	function closeSocket() {		
		if(socket) {
			socket.onclose = function () {}; 
    		socket.close();
		}		
	}
	
	function sendJSON(msg) {
		if(socket && socket.readyState == socket.OPEN){									
			socket.send(JSON.stringify(msg));
		}	
	}
	
	function clearSession() {
		scrollTop = 0;
		_items.clear();
	}
	
	function tryToConnect(callback) {	
		if(socket && socket.readyState == socket.OPEN) {
			closeSocket();
		}
	
		socket = new WebSocket("ws://localhost:8080/ws");
		//socket = new WebSocket("wss://remote-ae2.herokuapp.com/ws");
		
		socket.onopen = function (event) {
			console.log("connect");	
			callback();
		};
		socket.onclose = function(event) {
  			console.log("close");	
			clearSession();
			//showInputContainer(); //TODO добавить после теста
		};		
		socket.onmessage = function (event) {
			//console.log(event.data);
  			onNetworkMessage(safelyParseJSON(event.data));
		}	
		socket.onerror = function(error) {
  			//console.log(error);
		};		
	}
	
	function onNetworkMessage(msg) {		
		if(!msg.type) return; 
		
		try {						
			switch(msg.type){
				case "SessionStart":
					showAE2Container();
					break;
				case "Waiting":
					showWaitContainer(); 
					break;
				case "Items":
					//console.log(msg.items);					
					if(msg.items.update) {
						updateItems(msg.items);
					} else {
						newItemsArray(msg.items);
					}
					break;
				default:
					console.log("Undefined type: " + msg.type);
					break;
			}
		} catch(e) {
			console.error(e);
		}
	}
	
	function DOMContentLoaded() {
		if (!window.WebSocket) { 		
			alert("WebSocket not support!");
			return;
		}		
		getComputerID();
		
		container_input = document.getElementById('container-input');
		container_wait = document.getElementById('container-wait');
		container_ae2 = document.getElementById('container-ae2');
	
		button_connect = document.getElementById('btn-connect');				
		button_connect.addEventListener("click", connect);
		
		tableContainer = document.getElementById('tableContainer');
		tableContainer.addEventListener("scroll", scroll);	
		
		table = document.getElementById('table');
	}
	
	function connect() {
		//showAE2Container();	//TEST
		
		if(!socket || socket.readyState != socket.OPEN) {
			tryToConnect(sendComputerID);		
			return;		
		}			
		sendComputerID();
	}
		
	function sendComputerID() {			
		console.log(id);
		if (validateID()) {
			sendJSON({ type:"CompID", id:id });	
			hide(button_connect);					
		} else {
			alert("Неправильный ID");
		}	
	}
	
	//TABLE_HEIGHT = 400
	//ROW_HEIGHT = 18px + 1(border-top) + 5(padding top & bottom)
	
	function addItemToRow(index, label, size, craft) {
			
			let row = table.insertRow(index); //deleteRow(index)
			if(index % 2 == 0) {
				row.className = "normalRow";
				row.height = 10;
			} else {
				row.className = "alternateRow";
			}		
					
			row.insertCell(0).innerHTML = label; // label
			row.insertCell(1).innerHTML = words[1]; // size
			if(words[2]) row.insertCell(2).innerHTML = "craftable"; 
		
	}	
	function removeItemFromRow(index, label, size, craft) {
			
			let row = table.insertRow(index); //deleteRow(index)
			if(index % 2 == 0) {
				row.className = "normalRow";
				row.height = 10;
			} else {
				row.className = "alternateRow";
			}		
					
			row.insertCell(0).innerHTML = label; // label
			row.insertCell(1).innerHTML = words[1]; // size
			if(words[2]) row.insertCell(2).innerHTML = "craftable"; 
		
	}
	
	
	function updateItems(items) {
		for (const item of items) {			
			const words = item.l.split(':');
			if(words) {				
				var size  = words[1],
					craft = words[2],
					label_words = words[0].split('#');
				
				switch(label_words[1]) {					
					case ITEM.REMOVE:
						removeItemFromRow();
						break;
					case ITEM.UPDATE:
						break;						
					case ITEM.ADD: 
					default: //null?
						addItemToRow(count, label_words[0], size, craft);
						break;
				}
			}		
		}		
	}
	
	function newItemsArray(items) {						
		var count = 0;
		for (const item of items) {			
			const words = item.l.split(':');
			if(words) {				
				var label = words[0],
					size  = words[1],
					craft = words[2];
					
				_items.set(label, { label: label, size: size, craft: craft ,
									index: count });	
				
				addItemToRow(count, label, size, craft);								
				count++;
			}		
		}			
	}
	
	function scrollItemList(scrollTop) {
		console.log(scrollTop);
	}
	
	function scroll(e) {
		scrollTop = tableContainer.scrollTop;
		
		if(!ticking) {
			window.requestAnimationFrame(function(){
				scrollItemList(scrollTop);
				ticking = false;
			});
		}
		ticking = true;
	}	
	
	function showInputContainer() {
		show(button_connect);
		show(container_input);
		hide(container_wait);
		hide(container_ae2);		
	}
	function showAE2Container() {
		show(container_ae2);
		hide(container_input);
		hide(container_wait);
	}
	function showWaitContainer() {
		show(container_wait);
		hide(container_input);
		hide(container_ae2);
	}
	
	function show(e){ e.style.display = "block"; }
	function hide(e){ e.style.display = "none"; }

	return {
		DOMContentLoaded: DOMContentLoaded		
	}		

})();

document.addEventListener("DOMContentLoaded", Client.DOMContentLoaded);
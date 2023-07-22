function hideInfoMessageWindow(){
    document.getElementById("info-message-window").classList.add("info-message-window-hidden");
}
function showInfoMessageWindow(msg){
    document.getElementById("info-message-window").classList.remove("info-message-window-hidden");
    document.getElementById("info-message-window").innerText=msg;
}
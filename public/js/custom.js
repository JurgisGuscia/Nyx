function check() {
    var password = document.getElementById('password1');
    var vpassword = document.getElementById('password2');
  
    if(password.value != vpassword.value){
      document.getElementById("register-button").disabled = true;
    }else{
      document.getElementById("register-button").disabled = false;
    }
  }
  

  $("#add-new-item-button").on("click", ()=>{
    $("#back-drop").toggleClass("hidden");
    $("#add-new-item-form-container").toggleClass("hidden");
  });

  $("#cancel-new-item-addition").on("click", ()=>{
    document.getElementById("add-new-item-form").reset();
    $("#back-drop").toggleClass("hidden");
    $("#add-new-item-form-container").toggleClass("hidden");
    
  });

  

  

  $("#active-returns").on("click", ()=>{
    window.location.replace("/activeReturns");
  });

  $("#awaiting-export").on("click", ()=>{
    window.location.replace("/awaitingExport");
  });

  $("#awaiting-return").on("click", ()=>{
    window.location.replace("/awaitingReturn");
  });

  $("#completed-returns").on("click", ()=>{
    window.location.replace("/completedReturns");
  });

  $("#edit-user-form-cancel").on("click", ()=>{
    window.location.replace("/users");
  });
  
  $("#edit-item-form-cancel").on("click", ()=>{
    if($("#item-is-finished")[0].innerText == "Taip"){
      window.location.replace("/completedReturns");
    }else if($("#item-has-resolve")[0].innerText === "Išvežti"){
      window.location.replace("/awaitingExport");
    }else if($("#item-has-resolve")[0].innerText === "Grąžinti į skyrių"){
      window.location.replace("/awaitingReturn");
    }else{
      window.location.replace("/activeReturns");
    }
       
  });

  $("#user-control").on("click", ()=>{
    window.location.replace("/users");
  });

  const activeItemList = document.querySelectorAll(".single-item-container");
  activeItemList.forEach(item =>{
    item.addEventListener("click", function(){
      window.location.replace("/editItem/" + item.id);
    })
  });

  const activeUserList = document.querySelectorAll(".single-user-container");
  activeUserList.forEach(user =>{
    user.addEventListener("click", function(){
      window.location.replace("/editUser/" + user.id);
    })
  });


  
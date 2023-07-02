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
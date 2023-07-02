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
    //shot add new item form
  });
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
  var rows = $('.item-line-container');
  for (var i = 0; i < rows.length; i++){
    var button = rows[i].querySelector('button');
    
    button.addEventListener('click', function(e){
      var link = e.target.closest('div').getElementsByTagName('div')[2].innerText;
      var tempText = document.createElement('textarea');
      tempText.value = link;
      document.body.appendChild(tempText);
      tempText.select();
      document.execCommand('copy');
      document.body.removeChild(tempText);
    });
  }

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
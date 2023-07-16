var rows = $('.edit-item-line-container');
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
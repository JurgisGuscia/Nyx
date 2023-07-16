
function actionWithSelectedItems(){
    var rows = $('.select-item-row-for-action');
    var item;
    var code;
    var name;
    var ammount;
    var selectedItems = [];
    for (var i = 0; i < rows.length; i++){
        if(rows[i].checked){
            code = rows[i].closest('div').getElementsByTagName('div')[2].innerText; // gets the code of selected row 
            name = rows[i].closest('div').getElementsByTagName('div')[1].innerText; // gets the code of selected row 
            ammount = rows[i].closest('div').getElementsByTagName('div')[3].innerText; // gets the code of selected row 
            item = {code: code, name: name, ammount: ammount};
            selectedItems.push(item);
        }   
    }
    return selectedItems;
}

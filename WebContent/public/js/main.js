/**
 * Created by Mathew on 4/24/2018.
 */

var data = {};


function updateOptions(){
    var selection = $('#category').val();
    var list = data[selection];
    var i;
    var result = '';
    for(i=0;i<list.length;i++){
            result += '<option value="' + list[i] + '">' + list[i] +'</option>';
    }

    $('#filter').html(result);
}



$.get('/list/professions', (professions_data) => {
    $.get('/list/types', (types_data) => {
        data.Names = JSON.parse(professions_data).list.split(',');
        data.Titles = JSON.parse(types_data).list.split(',');
        $('#category').change(updateOptions);
        updateOptions();
    });
});


function swapToSpinner(e){
    e.innerHTML = '<div class="spinner"></div>';
}







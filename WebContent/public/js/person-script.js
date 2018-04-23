/**
 * Created by Mathew on 4/23/2018.
 */


function init(){
    var e = $('#poster');
    $.get('/poster/Names/' + e.attr('name'), function( data ) {
        data = JSON.parse(data);
        if(data.src) {
            e.attr('src', data.src);
        }
    });
}

function startEdit(){
    var editButton      = $('#edit-button');
    var cancelButton    = $('#cancel-button');

    cancelButton.css('visibility', 'visible');
    editButton.html('Save');
    editButton.removeClass('btn-default');
    editButton.addClass('btn-success');
    editButton.attr("onclick","saveEdit()");
}

function saveEdit(){
    //todo
    console.log('save');
    var name = 'test';
    var professions = 'test';
    var birth_year = 'test';
    var death_year = 'test';
    var d = 'name=' + name + '&professions=' + professions + '&birth_year=' + birth_year + '&death_year=' + death_year;
        $.ajax({
        url: '/Names/' + $('#poster').attr('name'),
        type: 'PUT',
        data: d,
        success: (result) => {
            console.log('test');
        }
    });
    

    exitEdit();
}


function cancelEdit(){
    exitEdit();
}

function exitEdit(){
    var editButton      = $('#edit-button');
    var cancelButton    = $('#cancel-button');

    cancelButton.css('visibility', 'hidden');


    editButton.html('Edit');
    editButton.removeClass('btn-success');
    editButton.addClass('btn-default');
    editButton.attr("onclick","startEdit()");

    location.reload(true);
}







init();
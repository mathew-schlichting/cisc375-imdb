/**
 * Created by Mathew on 4/23/2018.
 */
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

function openEdit(){
    var editButton      = $('#edit-button');
    var cancelButton    = $('#cancel-button');

    //change button
    cancelButton.css('visibility', 'visible');
    editButton.html('Save');
    editButton.removeClass('btn-default');
    editButton.addClass('btn-success');
    editButton.attr("onclick","saveEdit()");
}


function cancelEdit(){
    exitEdit();
}

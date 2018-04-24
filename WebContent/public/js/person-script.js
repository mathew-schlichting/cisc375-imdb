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

    var list = $('img');
    for(var i=0;i<list.length;i++){
        if(list[i].id !== 'poster'){
            loadPoster(list[i].id);
        }
    }
}

function loadPoster(id){
    $.get('/poster/Titles/' + id.split('-')[1], function( data ) {
        data = JSON.parse(data);
        if(data.src) {
            $('#'+id).attr('src', data.src);
        }
    });
}

function startEdit(){
    $.get('/list/professions', function( data ) {
        openEdit();

        var profession      = $('#profession');
        var year            = $('#year');
        var i;
        var temp;

        //change year
        temp = year.html().trim().split('-');
        var birth_year = temp[0].substring(1);
        var death_year = temp[1].substring(0, temp[1].length - 1);
        year.html('(<input id="birth-year" class="year-input" type="text" value="' + birth_year + '"/>-<input id="death-year" class="year-input" type="text" value="' + death_year + '"/>)');



        var professionList;
        var list = JSON.parse(data).list.split(',');

        temp = $('#profession-list').html().split('/');

        /* chnage to multiple select */
        profession.removeClass('col-9');
        profession.addClass('info');
        professionList = '';
        professionList += '<div class="row"><div class="col-3" style="margin-top: 2em;">Profession(s):</div>';

        professionList += '<div class="col-5"><select id="profession-select" class="profession-select" multiple>';
        for(i=0; i<list.length; i++){
            professionList += '<option id="' + list[i] + '" value="' + list[i] + '"' + '>' + list[i] + '</option>';
        }
        professionList += '</select></div></div>';
        profession.html(professionList);

        for(i=0; i<temp.length; i++) {
            $('#profession-select option[value="' + temp[i].trim().toLowerCase() + '"]').prop("selected", true);
        }
    });
}

function saveEdit(){
    var birth_year      = $('#birth-year');
    var death_year      = $('#death-year');
    var professions = [];

    $('#profession-select  option:selected').each(function() {
        professions.push($(this).val());
    });

    data = {};
    data.professions = professions;
    data.birth_year = birth_year.val();
    data.death_year = death_year.val();

        $.ajax({
            url: '/Names/' + $('#poster').attr('name'),
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(data),
        success: (result) => {
            console.log('test');
        }
    });
    

    exitEdit();
}










init();
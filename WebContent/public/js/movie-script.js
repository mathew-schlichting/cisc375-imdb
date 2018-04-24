/**
 * Created by Mathew on 4/23/2018.
 */


function init(){
    var e = $('#poster');
    $.get('/poster/Titles/' + e.attr('name'), function( data ) {
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
    $.get('/poster/Names/' + id.split('-')[1], function( data ) {
        data = JSON.parse(data);
        if(data.src) {
            $('#'+id).attr('src', data.src);
        }
    });
}

function startEdit(){
    $.get('/list/genres', (genres_data) => {
    $.get('/list/types', (types_data) => {
        openEdit();

        var i;

        // set genres
        var genres      = $('#genres');
        var fullGenreList = JSON.parse(genres_data).list.split(',');
        var oldGenreList  = genres.html().split(', ');
        var newGenreListHtml = '';
        newGenreListHtml += '<select id="genre-select" multiple>';
        for(i=0;i<fullGenreList.length; i++){
            newGenreListHtml += '<option value="' +fullGenreList[i].trim().toLowerCase()+ '">' +fullGenreList[i].trim().toLowerCase()+ '</option>'
        }
        newGenreListHtml += '</select>';
        genres.html(newGenreListHtml);
        for(i=0; i<oldGenreList.length; i++) {
            $('#genre-select option[value="' + oldGenreList[i].trim().toLowerCase() + '"]').prop("selected", true);
        }

        //set type
        var type      = $('#type');
        var fullTypeList = JSON.parse(types_data).list.split(',');
        var oldTypeList  = type.html().split(', ');
        var newTypeListHtml = '';
        newTypeListHtml += '<select id="type-select">';
        for(i=0;i<fullTypeList.length; i++){
            newTypeListHtml += '<option value="' +fullTypeList[i].trim().toLowerCase()+ '">' +fullTypeList[i].trim().toLowerCase()+ '</option>'
        }
        newTypeListHtml += '</select>';
        type.html(newTypeListHtml);
        for(i=0; i<oldTypeList.length; i++) {
            $('#type-select option[value="' + oldTypeList[i].trim().toLowerCase() + '"]').prop("selected", true);
        }


        
    });});
}

function saveEdit(){
    var type      = $('#type');
    var genres = [];

    $('#genre-select  option:selected').each(function() {
        genres.push($(this).val());
    });

    data = {};
    data.genres = genres;
    data.type = type.find(':selected').val();

        $.ajax({
            url: '/Titles/' + $('#poster').attr('name'),
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
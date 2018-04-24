/**
 * Created by Mathew on 4/24/2018.
 */

var list = $('img');
for(var i=0;i<list.length;i++){
    if(list[i].id.includes('image')){
        loadPoster(list[i].id);
    }
}

function loadPoster(id){
    var s = id.split('-');
    $.get('/poster/' + s[1] + '/' + s[2], function( data ) {
        data = JSON.parse(data);
        if(data.src) {
            $('#'+id).attr('src', data.src);
        }
    });
}
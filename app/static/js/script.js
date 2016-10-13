$('#modal').on('shown.bs.modal', function () {
  $('#myInput').focus()
})

$(document).ready(function() {
    var navlist_height = $(window).height() - 110;
    $('.adventure-nav .adventure-content').height(navlist_height);
    
    var body_height = $(window).height() - 150;
    $('.adventure-body .adventure-content').height(body_height);
    
    var sidebar_height = $(window).height() - 150;
    $('.adventure-sidebar .adventure-content').height(sidebar_height);
    
    $('.editable').blur(function(){
        var data = { id : parseInt( $(".nav-list .active").data('id') ), 
                     title : $("#adventure-body-title").text(), 
                     body : String( $(".adventure-body .adventure-content").html() ) };
        $.ajax({
            type: "POST", 
            url: "/save/plotpoint/", 
            contentType: "application/json; charset=utf-8", 
            data: JSON.stringify(data, null, '\t'), 
            success: function(data) {
                $('#adventure-link-' + String(data.id) + ' a .nav-title-link').text( data.title );
            }
        });
    });
    
    $( ".tag-autocomplete" ).autocomplete({ 
        source: function (request, response) {
            $.getJSON("/search/tags/", {
                search: request.term, 
                campaign: $CAMPAIGN, 
            }, function(data) {
                response(data.results);
            });
        }
    });
});

$(window).resize(function() {
    var navlist_height = $(window).height() - 110;
    $('.adventure-nav .adventure-content').height(navlist_height);
    
    var body_height = $(window).height() - 150;
    $('.adventure-body .adventure-content').height(body_height);
    
    var sidebar_height = $(window).height() - 150;
    $('.adventure-sidebar .adventure-content').height(sidebar_height);
    
    var tag_height = $(window).height() - (71 + 74 + 50);
    $('#search-tag-list').height(tag_height);
});

// LEFTHAND LINKBAR 

// Home
$(document).on('click', '#link-home', function(e) {
    e.preventDefault()
    var data = { campaign : parseInt($CAMPAIGN) };
    $.ajax({
        type: "POST", 
        url: "/home/", 
        contentType: "application/json; charset=utf-8", 
        data: JSON.stringify(data), 
        success: function(data) {
            $('.nav-list ul').empty();
            jQuery.each( data.plot_points, function( i, val ) {
                $('.nav-list ul').append(
                    '<li id="adventure-link-' + val['id'] + '"><a class="adventure-link" data-id="' + val['id'] + '"><span class="nav-title-link">' + val['title'] + '</span><br><span class="nav-description">Short Description goes here...</span></a></li>' );
            });
            $('.nav-list ul li:first-child a').addClass('active');
            $("#adventure-body-title").text(data.plot_points[0]['title']);
            $("#adventure-body-title").data('id', data.plot_points[0]['id'] );
            $(".adventure-body .adventure-content").html(data.plot_points[0]['body']);
            if ( data.plot_points[0]['bookmark'] === true ) {
                $('#adventure-bookmark').addClass('active');
            } else {
                $('#adventure-bookmark').removeClass('active');
            }
            if ( data.plot_points[0]['shortcut'] === true ) {
                $('#adventure-favorite').addClass('active');
                $('#adventure-favorite span').removeClass('glyphicon-star-empty');
                $('#adventure-favorite span').addClass('glyphicon-star');
            } else {
                $('#adventure-favorite').removeClass('active');
                $('#adventure-favorite span').removeClass('glyphicon-star');
                $('#adventure-favorite span').addClass('glyphicon-star-empty');
            }
        }
    });
});

// Bookmark
$(document).on('click', '#link-bookmark', function(e) {
    e.preventDefault()
    var data = { campaign : parseInt($CAMPAIGN) };
    $.ajax({
        type: "POST", 
        url: "/bookmark/", 
        contentType: "application/json; charset=utf-8", 
        data: JSON.stringify(data), 
        success: function(data) {
            if ( data.has_bookmark ) {
                $('.nav-list ul').empty();
                jQuery.each( data.plot_points, function( i, val ) {
                    $('.nav-list ul').append(
                        '<li id="adventure-link-' + val['id'] + '"><a class="adventure-link" data-id="' + val['id'] + '"><span class="nav-title-link">' + val['title'] + '</span><br><span class="nav-description">Short Description goes here...</span></a></li>' );
                });
                $('.adventure-link[data-id="' + data.bookmark['id'] + '"]').addClass('active');
                $("#adventure-body-title").text(data.bookmark['title']);
                $("#adventure-body-title").data('id', data.bookmark['id'] );
                $(".adventure-body .adventure-content").html(data.bookmark['body']);
                $("#adventure-bookmark").addClass('active');
                if ( data.bookmark['shortcut'] === true ) {
                    $('#adventure-favorite').addClass('active');
                    $('#adventure-favorite span').removeClass('glyphicon-star-empty');
                    $('#adventure-favorite span').addClass('glyphicon-star');
                } else {
                    $('#adventure-favorite').removeClass('active');
                    $('#adventure-favorite span').removeClass('glyphicon-star');
                    $('#adventure-favorite span').addClass('glyphicon-star-empty');
                }
            }
        }
    });
});

// Shortcuts
$(document).on('click', '#link-shortcuts', function(e) {
    e.preventDefault()
    var data = { campaign : parseInt($CAMPAIGN) };
    $.ajax({
        type: "POST", 
        url: "/shortcuts/", 
        contentType: "application/json; charset=utf-8", 
        data: JSON.stringify(data), 
        success: function(data) {
            if ( data.shortcuts.length > 0 ) {
                $('.nav-list ul').empty();
                jQuery.each( data.shortcuts, function( i, val ) {
                    $('.nav-list ul').append(
                        '<li id="adventure-link-' + val['id'] + '"><a class="adventure-link" data-id="' + val['id'] + '"><span class="nav-title-link">' + val['title'] + '</span><br><span class="nav-description">Short Description goes here...</span></a></li>' );
                });
                $('.nav-list ul li:first-child a').addClass('active');
                $("#adventure-body-title").text(data.shortcuts[0]['title']);
                $("#adventure-body-title").data('id', data.shortcuts[0]['id'] );
                $(".adventure-body .adventure-content").html(data.shortcuts[0]['body']);
                if ( data.shortcuts[0]['bookmark'] === true ) {
                    $('#adventure-bookmark').addClass('active');
                } else {
                    $('#adventure-bookmark').removeClass('active');
                }
                $('#adventure-favorite').addClass('active');
                $('#adventure-favorite span').removeClass('glyphicon-star-empty');
                $('#adventure-favorite span').addClass('glyphicon-star');
            }
        }
    });
});

// Tags
$(document).on('click', '#adventure-tag-list', function(e) {
    e.preventDefault()
    $('#overlay').show();
    $('#overlay-message').show();
    
    var data = { campaign : parseInt($CAMPAIGN) };
    $.ajax({
        type: "POST", 
        url: "/tags/", 
        contentType: "application/json; charset=utf-8", 
        data: JSON.stringify(data), 
        success: function(data) { 
            $('#overlay-message').append( 
                '<div id="search-by-tag"><form><h2>Tags</h2><input type="text" class="form-control tag-autocomplete" id="tag-search" placeholder="Search for Tag..."></form><ul id="search-tag-list" class="list-unstyled"></ul></div>' );
            var height = $(window).height() - (71 + 74 + 50);
            $('#search-tag-list').height(height);
            jQuery.each( data.results, function( i, val ) {
                $('#search-tag-list').append( 
                    '<li><a href="" class="plotpoint-tag"><b>' + val + '</b> <span class="tag-post-num">1</span></a></li>' );
            });
        }
    });
});

$(document).on('keyup', '#search-by-tag', function() {
    var search = $('#tag-search').val().toLowerCase();
    $('#search-tag-list>li').each(function () {
        var text = $(this).text().toLowerCase();
        ( text.indexOf(search) == 0) ? $(this).show() : $(this).hide();
    });
});

// Shows items in trash
$('#link-trashbin').click(function(e) {
    e.preventDefault()
    var data = { campaign : parseInt($CAMPAIGN) };
    $.ajax({
        type: "POST", 
        url: "/trash/", 
        contentType: "application/json; charset=utf-8", 
        data: JSON.stringify(data, null, '\t'), 
        success: function(data) {
            $('.nav-list ul').empty();
            jQuery.each( data.plot_points, function( i, val ) {
                $('.nav-list ul').append(
                    '<li id="adventure-link-' + val['id'] + '"><a class="adventure-link" data-id="' + val['id'] + '"><span class="nav-title-link">' + val['title'] + '</span><br><span class="nav-description">Short Description goes here...</span></a></li>' );
            });
            $('.nav-list ul li:first-child a').addClass('active');
            $("#adventure-body-title").text(data.plot_points[0]['title']);
            $("#adventure-body-title").data('id', data.plot_points[0]['id'] );
            $(".adventure-body .adventure-content").html(data.plot_points[0]['body']);
        }
    });
});

// NAVIGATION

// View change - List
$(document).on('click', '#view-as-list', function(e) {
    e.preventDefault()
    $('.campaign-container').load('/adventure/list/', { 
        campaign: $CAMPAIGN, 
        active: parseInt( $("#adventure-body-title").data('id') ) 
        }, function(data) {
            
        });
});

// View change - Map
$(document).on('click', '#view-as-map', function(e) {
    e.preventDefault()
    $('.campaign-container').load('/adventure/map/', { 
        campaign: $CAMPAIGN, 
        active: parseInt( $("#adventure-body-title").data('id') ) 
        }, function(data) {
            
        });
});

// Handles updating the sort of the list of items
var $sortables = $(".sortable").sortable({ stop: function() {
    var sortedItems = $sortables.sortable("toArray");
    // Update some form in the DOM or use AJAX to invoke a server-side update
    var data = { list : sortedItems };
    $.ajax({
        type: "POST", 
        url: "/reorder/plotpoint/", 
        contentType: "application/json; charset=utf-8", 
        data: JSON.stringify(data, null, '\t'), 
        success: function(data) {
            console.log( data.message );
        }
    });
  }
});

$(document).on('click', '.adventure-link', function(e)  {
    e.preventDefault()
    $(".active").removeClass('active');
    $(this).addClass('active');
    $.ajax({
        type: "POST", 
        url: "/plotpoint/", 
        contentType: "application/json; charset=utf-8", 
        data: JSON.stringify( { id : $(this).data('id') } ), 
        success: function(data) {
            $("#adventure-body-title").text(data.title);
            $("#adventure-body-title").data('id', data.id );
            $(".adventure-body .adventure-content").html(data.body);
            if ( data.bookmark === true ) {
                $('#adventure-bookmark').addClass('active');
            } else {
                $('#adventure-bookmark').removeClass('active');
            }
            if ( data.shortcut === true ) {
                $('#adventure-favorite').addClass('active');
                $('#adventure-favorite span').removeClass('glyphicon-star-empty');
                $('#adventure-favorite span').addClass('glyphicon-star');
            } else {
                $('#adventure-favorite').removeClass('active');
                $('#adventure-favorite span').removeClass('glyphicon-star');
                $('#adventure-favorite span').addClass('glyphicon-star-empty');
            }
            $("#tag-list").empty();
            jQuery.each( data.tags, function( i, tag ) {
                $("#tag-list").append(
                    '<li><span class="plotpoint-tag saved-tag">' + tag + '</span></li>&#10;' );
            })
        }
    });
});

$('.adventure-link').bind("contextmenu", function (e) {
    e.preventDefault()
    $('.adventure-select-options').finish().toggle(100).
        css({ top: e.pageY + 'px', left: e.pageX + 'px' });
});

// If the document is clicked somewhere
$(document).bind("mousedown", function (e) {
    // If the clicked element is not the menu
    if (!$(e.target).parents(".adventure-select-options").length > 0) {
        $(".adventure-select-options").hide(100); // Hide it
    }
});

// If the menu element is clicked
$(".adventure-select-options li").click(function(){
    
    // This is the triggered action name
    switch($(this).attr("data-action")) {
        
        // A case for each action. Your actions here
        case "subplot": alert("Subplot"); break;
        case "move":  
            $('#overlay').show();
            $('#overlay-message').show();
            $('#overlay-message').append( '<div id="choose-parent" class="fullpage-message"><h1>Choose Subplot</h1><form></form></div>' );
            $.getJSON( '/adventure/hierarchy/', {
                campaign: parseInt( $CAMPAIGN )
            }, function(data) {
                jQuery.each( data.plotpoints, function( i, val ) {
                    $('#choose-parent form').append( 
                        '<input type="radio" name="parent" value="' + val['id'] + '"> ' + val['title'] + '<br>' );
                });
                $('#choose-parent form').append( '<button>Submit</button>' );
            });
            break;
        case "bookmark": alert("Bookmark"); break;
        case "favorite": alert("Shortcut"); break;
        case "trash": alert("Trash"); break;
        case "edit": alert("Edit"); break;
    }
  
    // Hide it AFTER the action was triggered
    $(".adventure-select-options").hide(100);
  });

$('#new-plotpoint').click(function(e) {
    e.preventDefault()
    var data = { title : "Untitled", campaign : parseInt($CAMPAIGN), body : "" }
    $.ajax({
        type: "POST", 
        url: "/new/plotpoint/", 
        contentType: "application/json; charset=utf-8", 
        data: JSON.stringify(data, null, '\t'), 
        success: function(data) {
            console.log( data );
            $(".active").removeClass('active');
            $('.nav-list ul').append( '<li id="adventure-link-' + String(data.id) + '"><a class="adventure-link active" data-id="' + String(data.id) + '"><span class="nav-title-link">' + data.title + '</span><br><span class="nav-description">Short Description goes here...</span></a></li>' );
            
            $("#adventure-body-title").text(data.title);
            $("#adventure-body-title").data('id', data.id );
            $(".adventure-body .adventure-content").html(data.body);
        }
    });
});

// Shows a confirmation page before deleting an item
$(document).on('click', '#adventure-trash', function(e) {
    e.preventDefault()
    $('#overlay').show();
    $('#overlay-message').show();
    $('#overlay-message').append( '<div id="trash-message" class="fullpage-message"><h1>Are you sure?</h1><p><button id="trash-cancel" type="button" class="btn btn-default">Cancel</button> <button id="trash-confirm" type="button" class="btn btn-primary">Confirm</button></p></div>' );
});

// Cancels deleting an item
$(document).on('click', '#trash-cancel', function() {
    $('#trash-message').remove();
    $('#overlay').hide();
    $('#overlay-message').hide();
});

// Also cancels deleting an item
$(document).on('click', '#overlay-close a', function(e)  {
    e.preventDefault()
    $('#overlay').hide();
    $('#overlay-message').hide();
    $('#overlay-message div').remove();
});

// Confirms sending an item to trash
$(document).on('click', '#trash-confirm', function()  {
    var active_li = $(".nav-list .active").parent()
    if ( active_li.is(':first-child') ) {
        next_link = active_li.next().children('a');
    } else {
        next_link = active_li.prev().children('a');
    }
    var data = { id : parseInt( $(".nav-list .active").data('id') ), 
             next_id : parseInt($(next_link).data('id')), 
             list : $(".sortable").sortable("toArray") };
    $.ajax({
        type: "POST", 
        url: "/trash/plotpoint/", 
        contentType: "application/json; charset=utf-8", 
        data: JSON.stringify(data, null, '\t'), 
        success: function(data) {
            console.log( data.message );
            $(".nav-list .active").remove();
            // Show next article
            $(next_link).addClass("active");
            $("#adventure-body-title").text(data.title);
            $("#adventure-body-title").data('id', data.id );
            $(".adventure-body .adventure-content").html(data.body);
            // Remove Overlay
            $('#trash-message').remove();
            $('#overlay').remove();
        }
    });
});

// ARTICLE OPTIONS

// Bookmark
$(document).on('click', '#adventure-bookmark', function(e) {
    e.preventDefault()
    var data = { id : parseInt( $("#adventure-body-title").data('id') ) };
    $.ajax({
        type: "POST", 
        url: "/bookmark/plotpoint/", 
        contentType: "application/json; charset=utf-8", 
        data: JSON.stringify(data, null, '\t'), 
        success: function(data) {
            if (data.active === true) {
                $('#adventure-bookmark').addClass('active');
            } else {
                $('#adventure-bookmark').removeClass('active');
            }
        }
    });
});

// Shortcut
$(document).on('click', '#adventure-favorite', function(e) {
    e.preventDefault()
    var data = { id : parseInt( $("#adventure-body-title").data('id') ) };
    $.ajax({
        type: "POST", 
        url: "/shortcut/plotpoint/", 
        contentType: "application/json; charset=utf-8", 
        data: JSON.stringify(data, null, '\t'), 
        success: function(data) {
            if (data.active === true) {
                $('#adventure-favorite').addClass('active');
                $('#adventure-favorite span').removeClass('glyphicon-star-empty');
                $('#adventure-favorite span').addClass('glyphicon-star');
            } else {
                $('#adventure-favorite').removeClass('active');
                $('#adventure-favorite span').removeClass('glyphicon-star');
                $('#adventure-favorite span').addClass('glyphicon-star-empty');
            }
        }
    });
});

// Toggle TinyMCE editor capability
$(document).on('click', '#edit-toggle', function(e) {
    e.preventDefault()
    if( $(this).hasClass("editable-yes") ) {
        $(this).removeClass("editable-yes");
        $('#new-plotpoint-tag').hide();
        tinymce.EditorManager.execCommand('mceRemoveEditor',true, 'adventure-text');
        tinymce.EditorManager.execCommand('mceRemoveEditor',true, 'adventure-body-title');
        $('#new-plotpoint-tag').attr('contenteditable', 'false');
    } else {
        $(this).addClass("editable-yes");
        $('#new-plotpoint-tag').css('display', 'inline-block');
        tinymce.init({ 
            selector: '#adventure-body-title', 
            inline: true, 
            toolbar: false, 
            menubar: false
        });
        tinymce.init({ 
            selector: '#adventure-text', 
            inline: true, 
            menubar: false, 
            plugins: 'code, link, image, textcolor, colorpicker', 
            toolbar: 'undo redo | styleselect | bold italic forecolor | alignleft aligncenter alignright | bullist numlist outdent indent | link image | code', 
            default_link_target: "_blank" 
        });
        $('#new-plotpoint-tag').attr('contenteditable', 'true');
    }
});

$(document).on('click', '.saved-tag', function() {
    $('#active-tag').removeAttr('id');
    $(this).attr('id', 'active-tag');
});

$('#new-plotpoint-tag').blur(function() {
    new_tag = $(this).text();
    // Ajax send tag to views.py
    // Add tag to plot point
    // Update adventure tags master list
    // Makes sure the string is not empty or only spaces
    if ( !/\S/.test(new_tag) ) {
        $(this).empty();
        return;
    }
    var data = { id : parseInt( $(".nav-list .active").data('id') ), 
             tag : new_tag };
    $.ajax({
        type: "POST", 
        url: "/add/tag/", 
        contentType: "application/json; charset=utf-8", 
        data: JSON.stringify(data, null, '\t'), 
        success: function(data) {
            console.log( data.message );
            // Add the new tag to the list of saved tags
            if ( data.new ) {
                $('#tag-list').append( 
                    '<li><span class="plotpoint-tag saved-tag">' + data.name + '</span></li>');
            }
            // Empty the new tag input
            $('#new-plotpoint-tag').empty();
        }
    });
});
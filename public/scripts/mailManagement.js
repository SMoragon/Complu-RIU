"use strict"

var receiver_value;
var subject_value;
var content_value;

// If the user submits the form, a request is made to the server.
$('#send_email_submit_button').on('click', function (event) {

    closePopups();

    receiver_value= String($("#sent_email_receiver").val()).trim();
    subject_value=String($("#sent_email_subject").val()).trim();
    content_value=String($("#sent_email_content").val()).trim();

    // If the information submitted is not valid, submission is cancelled.
    if (!validate()) {
        event.preventDefault();
    }
    // Else, an AJAX request is made to the server to insert the message in the databse.
    else{
        console.log(receiver_value, subject_value, content_value)
        $.ajax({
            method:"POST",
            url: "/correo/write_mail/",
            contentType: "application/json",
            data: JSON.stringify({
                "receptor":receiver_value,
                "asunto": subject_value,
                "mensaje": content_value,
            }),
            // If all goes fine, the current modal is closed and another one telling the user that the operation was successful is shown.
            success:function(data, textStatus, jqHXR){
                $('#write_email').modal('hide')
                $('#write_email_ok').modal('show').slideDown(700)
            },
            // If there's an error, depending on what type of error it is, the user would see one alert or another. (Email does not exist in
            // the database, receiver faculty is not the same as emitter one and so on.)
            error: function(jqHXR, textStatus, errorThrown){
                console.log(jqHXR.responseText)
                if(jqHXR.responseText==="No receiver found"){
                    $("#send_mail_error").text("El email introducido no corresponde a ningún usuario.").show();
                }
                else if(jqHXR.responseText==="Faculty does not match"){
                    $("#send_mail_error").text("El destinatario no puede pertenecer a otra facultad.").show();
                }
                else{
                    alert(errorThrown)
                }
            }
        })
    }
});
    
// Function that checks that all fields are non empty and correct.
function validate() {
    
    if(receiver_value==="" || subject_value==="" || content_value===""){
        $("#send_mail_empty_error").show();
        return false;
    }
    else if(!receiver_value.endsWith("@ucm.es")){
        $("#send_mail_email_error").show(); 
        return false;
    }

    return true;
}

// Changes the popups to not be visible.
function closePopups() {
    $(".mail_form_error").each(function() {
      $(this).hide() ;
    });
  }

 // It does not matter the part in which the user clicks; the event will be triggered to the parent (the div that contains everything).
 $('.mail_card div').on('click', function (event){
    event.stopPropagation();
    $(event.target).parent().trigger('click')
 })

 // When the div receives the click event, all the mail content is displayed in the middle of the screen, in a more detailed way.
 // Also, the message the user clicks on is marked aas read, so that the popup showing the user the amount of messages that have not
 // been reading yet can be updated.
 $('.mail_card').on('click', function (event){
    var id=$(event.target).prop("id");
    var user_full_name=String($(event.target).children(".user_info").children(".remitent_text").text()).trimStart();
    var mail_subject=String($(event.target).children(".email_subject").text()).trimStart().substring(8);
    var sent_date=$(event.target).children(".hidden_sent_date").val()
    var emitter_mail=String($(event.target).children(".hidden_emitter_mail").val()).trimStart();
    var mail_content=String($(event.target).children(".hidden_mail_content").val()).trimStart();
    console.log(emitter_mail)
  
    var m_body=$('#message_body_container');
    m_body.children('#focused_email_subject').text(mail_subject)
    m_body.children('#focused_email_info').text(`${user_full_name} (${emitter_mail}) escribió ${sent_date}:`)
    m_body.children('#focused_email_content').text(mail_content)
    $("#mock_text").hide()

    $.ajax({
        method:"PATCH",
        url: "/correo/marcar_leido/"+id,
        // If successful, we do not do anything, because it's only marking it up as read.
        success: function(data, textStatus, jqHXR){
        },
        // However, if there's an error, an alert with it is shown to the user.
        error: function (jqHXR, textStatus, errorThrown) {  
            alert(errorThrown, textStatus)
        }
    })
 })
"use strict";

function validate() {
  // Function to validate the booking form.
  const MAX_KB_FILE_SIZE = 2048;
  const allowedFormats = ["image/jpg", "image/jpeg", "image/png"];
console.log("usssususs")
  var user_name = $("#user_name");
  var user_surname =$("#user_surname");
  var user_email = $("#user_email");
  var user_password =$("#user_password");
  var user_password_again =$("#user_password_again");
  var user_faculty =$("#user_faculty");
  var user_course = $("#user_course");
  var user_group = $("#user_group");
  var user_profile = $("#user_profile");


  var variables = [
    user_name,
    user_surname,
    user_email,
    user_password,
    user_password_again,
    user_faculty,
    user_course,
    user_group,
  ];

  var any_empty = checkEmptyFields(variables);
  var passwords_ok = user_password.prop("value") === user_password_again.prop("value");

  var file = user_profile[0] ?
   user_profile[0].files[0] :
    undefined;
  console.log("fileeee ",file.name, file.size, file.type)
  var file_size_ok = file ? file.size / 1024 < MAX_KB_FILE_SIZE : true;
  var file_type_ok = file ? allowedFormats.includes(file.type) : true;

  //console.log("type: ",file.type, " size: ",file.size)
  // Before showing anything, we close the popups just in case there were any visible.
  closePopups();

  // We check the possible errors, so that popups that match with them are showed.
  if (any_empty) {
    $("#empty_error").show();
  } else {
    var email_ok = validateEmail(user_email);

    if (!email_ok) {
      $("#mail_error").show();
    } else if (!passwords_ok) {
      $("#password_error").show();
    } else if (!file_size_ok || !file_type_ok) {
      console.log("aaaaa")
      $("#profile_error").text( file_size_ok ? `El formato ${file.type} noa está permitido.`:
      `El tamaño máximo de archivo es de ${MAX_KB_FILE_SIZE / 1024}MB.`).show() 
    }
  }
  return file_size_ok && file_type_ok && !any_empty && email_ok && passwords_ok;
}

// Returns true if there is any empty field, or false otherwise.
function checkEmptyFields(vars) {
  var empty = false;
  vars.forEach((v) => {
    if (v.prop("value") === "") empty = true;
  });
  console.log("Empty fields:", empty);
  return empty;
}

// Returns true if mail matches the regex expression for an email, or false otherwise.
function validateEmail(client_email) {
  var email_regex = new RegExp(/\w+@\w+\.\w+/);
  return client_email.prop("value") && client_email.prop("value").toLocaleLowerCase().match(email_regex) !== null;
}

// Changes the popups to not be visible.
function closePopups() {
  $(".popup_form_error").each(function() {
    $(this).hide() ;
  });
}

// Hids all popups and redirect the user to the given page.
function closeAndRedirect(newSite) {
  $(".popup_form_error").each(function() {
    $(this).hide() ;
  });
  window.location.href = newSite;
}

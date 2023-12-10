"use strict";

// Function to validate the booking form.
function validate() {
  var user_email = $("#user_email");
  var user_password = $("#user_password");

  var any_empty = checkEmptyFields(user_email, user_password);

  
  // Before showing anything, we close the popups just in case there were any visible.
  closePopups();

   // We check the possible errors, so that popups that match with them are showed.
  if (any_empty) {
    $("#empty_error").show();
  } else {
    var email_ok = validateEmail(user_email);

    if (!email_ok) {
      $("#mail_error").show();
    }
  }
  
  return !any_empty && email_ok;
}

// Returns true if there is any empty field, or false otherwise.
function checkEmptyFields(user_email, user_password) {
  return user_email.val() === "" || user_password.val() === "";
}

// Returns true if mail matches the regex expression for an email, or false otherwise.
function validateEmail(user_email) {
  var email_regex = new RegExp(/\w+@\w+\.\w+/);
  return user_email.val() && user_email.val().toLocaleLowerCase().match(email_regex) !== null;
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

// Toggles password's visibility so that the user could watch it if wanted to.
function showPasswd() {
  console.log("a")
  var pass = $("#user_password");
  if (pass.attr("type") === "password") {
    pass.attr("type", "text");
  } else {
    pass.attr("type", "password");
  }
}
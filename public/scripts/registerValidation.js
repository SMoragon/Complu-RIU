"use strict";

function validate() {
  // Function to validate the booking form.
console.log("He entradooooo")
  var user_name = document.querySelector("#user_name");
  var user_surname = document.querySelector("#user_name");
  var user_email = document.querySelector("#user_email");
  var user_password = document.querySelector("#user_password");
  var user_password_again = document.querySelector("#user_password_again");
  var user_faculty = document.querySelector("#user_faculty");
  var user_course = document.querySelector("#user_course");
  var user_group = document.querySelector("#user_group");

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

  var passwords_ok = user_password.value === user_password_again.value;

  // Before showing anything, we close the popups just in case there were any visible.
  closePopups();

  // We check the possible errors, so that popups that match with them are showed.
  if (any_empty) {
    var empty_error = document.querySelector("#empty_error");
    empty_error.style.display = "inline-block";
  } else {
    var email_ok = validateEmail(user_email);

    if (!email_ok) {
      var mail_error = document.querySelector("#mail_error");
      mail_error.style.display = "inline-block";
    } else if (!passwords_ok) {
      var mail_error = document.querySelector("#password_error");
      mail_error.style.display = "inline-block";
    }
  }
  return !any_empty && email_ok && passwords_ok;
}

// Returns true if there is any empty field, or false otherwise.
function checkEmptyFields(vars) {
  var empty = false;
  vars.forEach((v) => {
    if (v.value === "") empty = true;
  });
  console.log("Empty fields:",empty)
  return empty;
}

// Returns true if mail matches the regex expression for an email, or false otherwise.
function validateEmail(client_email) {
  var email_regex = new RegExp(/\w+@\w+\.\w+/);
  return client_email.value.toLocaleLowerCase().match(email_regex) !== null;
}

// Changes the popups to not be visible.
function closePopups() {
  var popups = document.querySelectorAll(".popup_form_error");
  popups.forEach((popup) => {
    popup.style.display = "none";
  });
}

// Hids all popups and redirect the user to the given page.
function closeAndRedirect(newSite) {
  var popups = document.querySelectorAll(".popup_form_error");
  popups.forEach((popup) => {
    popup.style.display = "none";
  });
  window.location.href = newSite;
}

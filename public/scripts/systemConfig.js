"use strict";
$(document).ready((e) => {
    // ajax put request to update system configuration
    $("#config_form").on('submit',(event)=>{
        event.preventDefault();
        var formData=new FormData($("#config_form")[0]);
        // check if each field it´s fill correctly
        var ok = validationSystemForm();
        var image = have_image();
        if(ok){
            $.ajax({
                type: 'PUT',
                url: '/system/update_system/'+image,
                data: formData,
                contentType: false,
                cache: false,
                processData: false,
                beforeSend: () => {
                    $("#org_submit_button").attr("disabled", "disabled");
                },
                success: (message) => {
                    alert(message['msg'])
                    // reload the page
                    location.reload();
                    $("#org_submit_button").removeAttr("disabled");
                },
                error: (jqXHR, textStatus, errorThrown) => {
                    alert("Se ha producido un error: Intentelo mas tarde."+ errorThrown)
                }
            });
        }
    })
});

// validate each field of the form it´s fill correctly
function validationSystemForm(){
    closeErrMsg()
    var nombre = $("#org_name").prop("value")
    var dir = $("#org_dir").prop("value")
    var ig = $("#org_ig").prop("value")
    var mail = $("#org_mail").prop("value")
    var icono = $("#org_img").prop('files')[0]
    var any_empty = checkEmptyFields(nombre, dir, ig, mail)
    var image_select = checkSelectImage(icono)
    var image_prop = true
    if (image_select) {
        image_prop = checkImageProp(icono)
    }
    addErrMsg(any_empty, image_select, image_prop)
    return !any_empty && image_prop;
}

// add an error message to the form
function addErrMsg(any_empty, image_select, image_prop) {
    var msg_error_init = "<div class='form-group row justify-content-center msg_error'><div class='col-10'><span class='text-danger popup_form_error d-inline-block'>"
    var msg_error_end = "</span></div></div>"
    if (any_empty) {
        $("#config_form_body").prepend(msg_error_init + "Los campos deben estar rellenos." + msg_error_end)
    }
    if (image_select && !image_prop) {
        $("#put_org_img").append(msg_error_init + "La imagen seleccionada debe ser del tipo '*.jpg, *.jpeg, *.png', con tamaño maximo de 2mbs" + msg_error_end)
    }
}

// delete the error message to the form
function closeErrMsg() {
    $("#config_form_body .msg_error").remove()
}

// check if the user have put some image
function have_image(){
    var imagen = $("#org_img").prop('files')[0]
    var image_select = checkSelectImage(imagen)
    return image_select;
}

// check if there are some field empty
function checkEmptyFields(nombre, dir, ig, mail) {
    return nombre === "" || dir === "" || ig === "" || mail === "";
}

// check if the user select some image
function checkSelectImage(image) {
    return image !== undefined;
}

// check the selected image have the correct property
function checkImageProp(image) {
    var match = ["image/jpeg", "image/png", "image/jpg"];
    var img_type = image['type']
    var img_type_correct = (match[0] == img_type || match[1] == img_type || match[2] == img_type)
    var img_size = image['size']
    var img_size_correct = img_size < 2097152
    
    return img_type_correct && img_size_correct;
}
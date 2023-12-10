"use strict";
function add_instalacion() {
    closeErrMsg()
    var nombre = $("#instalacion_nombre").prop("value")
    var apertura = $("#horario_apertura").prop("value")
    var cierre = $("#horario_cierre").prop("value")
    var tipo = $("#tipo_reserva").prop("value")
    var aforo = $("#aforo").prop("value")
    var imagen = $("#instalacion_imagen").prop('files')[0]
    var any_empty = checkEmptyFields(nombre, apertura, cierre, aforo)
    var correct_time = checkTime(apertura, cierre)
    var checkType = checkTypeSelect(tipo)
    var checkAforoCorrect = checkAforo(aforo)
    var image_select = checkSelectImage(imagen)
    var image_prop = true
    if (image_select) {
        image_prop = checkImageProp(imagen)
    }
    addErrMsg(any_empty, correct_time, checkType, checkAforoCorrect, image_select, image_prop)
    return !any_empty && correct_time && checkType && checkAforoCorrect && image_select && image_prop;
}

function mod_instalacion(id) {
    modCloseErrMsg(id)
    var nombre = $("#m_instalacion_nombre_"+id).prop("value")
    var apertura = $("#m_horario_apertura_"+id).prop("value")
    var cierre = $("#m_horario_cierre_"+id).prop("value")
    var aforo = $("#m_aforo_"+id).prop("value")
    var imagen = $("#m_instalacion_imagen_"+id).prop('files')[0]
    var any_empty = checkEmptyFields(nombre, apertura, cierre, aforo)
    var correct_time = checkTime(apertura, cierre)
    var checkAforoCorrect = checkAforo(aforo)
    var image_select = checkSelectImage(imagen)
    var image_prop = true
    if (image_select) {
        image_prop = checkImageProp(imagen)
    }
    modAddErrMsg(id, any_empty, correct_time, checkAforoCorrect, image_select, image_prop)
    return !any_empty && correct_time && checkAforoCorrect && image_prop;
}

function putImage(id){
    var imagen = $("#m_instalacion_imagen_"+id).prop('files')[0]
    var image_select = checkSelectImage(imagen)
    return image_select;
}

function closeErrMsg() {
    $("#add_instalacion_body .msg_error").remove()
}

function addErrMsg(any_empty, correct_time, checkType, checkAforoCorrect, image_select, image_prop) {
    var msg_error_init = "<div class='form-group row justify-content-center msg_error'><div class='col-10'><span class='text-danger popup_form_error d-inline-block'>"
    var msg_error_end = "</span></div></div>"
    if (any_empty) {
        $("#add_instalacion_body").prepend(msg_error_init + "Los campos deben estar rellenos." + msg_error_end)
    }
    if (!correct_time) {
        $("#add_instalacion_close_time").append(msg_error_init + "El horario de cierre debe ser posterior al de la apertura." + msg_error_end)
    }
    if (!checkType) {
        $("#add_instalacion_type").append(msg_error_init + "Seleccione un tipo de reserva." + msg_error_end)
    }
    if(!checkAforoCorrect){
        $("#add_instalacion_aforo").append(msg_error_init + "El minimo aforo permitido debe ser mayor o igual a '1'." + msg_error_end)
    }
    if (!image_select) {
        $("#add_instalacion_image").append(msg_error_init + "Seleccione una imagen para la instalación." + msg_error_end)
    }
    if (!image_prop) {
        $("#add_instalacion_image").append(msg_error_init + "La imagen seleccionada debe ser del tipo '*.jpg, *.jpeg, *.png', con tamaño maximo de 2mbs" + msg_error_end)
    }
}

function modAddErrMsg(id, any_empty, correct_time, checkAforoCorrect, image_select, image_prop) {
    var msg_error_init = "<div class='form-group row justify-content-center msg_error'><div class='col-10'><span class='text-danger popup_form_error d-inline-block'>"
    var msg_error_end = "</span></div></div>"
    if (any_empty) {
        $("#modificar_instalacion_form_"+id+" .mod_instalacion_body").prepend(msg_error_init + "Los campos deben estar rellenos." + msg_error_end)
    }
    if (!correct_time) {
        $("#modificar_instalacion_form_"+id+" .mod_instalacion_close_time").append(msg_error_init + "El horario de cierre debe ser posteriol al de la apertura." + msg_error_end)
    }
    if(!checkAforoCorrect){
        $("#modificar_instalacion_form_"+id+" .mod_instalacion_aforo").append(msg_error_init + "El minimo aforo permitido debe ser mayor o igual a '1'." + msg_error_end)
    }
    if (image_select && !image_prop) {
        $("#modificar_instalacion_form_"+id+" .modinstalacion_image").append(msg_error_init + "La imagen seleccionada debe ser del tipo '*.jpg, *.jpeg, *.png', con tamaño maximo de 2mbs" + msg_error_end)
    }
}

function modCloseErrMsg(id) {
    $("#modificar_instalacion_form_"+id+" .msg_error").remove()
}

function checkEmptyFields(nombre, apertura, cierre, aforo) {
    return nombre === "" || apertura === "" || cierre === "" || aforo === "";
}

function checkTypeSelect(tipo) {
    return tipo !== "None";
}

function checkTime(apertura, cierre) {
    var apertura_value = apertura.split(":")
    var cierre_value = cierre.split(":")

    return (!(apertura === "" || cierre === "")
        && (apertura_value[0] < cierre_value[0] 
            || apertura_value[0] === cierre_value[0] && apertura_value[1] < cierre_value[1]));
}

function checkSelectImage(image) {
    return image !== undefined;
}

function checkImageProp(image) {
    var match = ["image/jpeg", "image/png", "image/jpg"];
    var img_type = image['type']
    var img_type_correct = (match[0] == img_type || match[1] == img_type || match[2] == img_type)
    var img_size = image['size']
    var img_size_correct = img_size < 2097152
    
    return img_type_correct && img_size_correct;
}

function checkAforo(aforo){
    var aforo_val = aforo
    return aforo_val=== "" ? false : aforo_val>0;
}

"use strict";
$(document).ready((e) => {
    // ajax patch request to update an non-validate user to validate user
    $("#instalacion_list button.validar_usuario").on('click', (event) => {
        event.preventDefault();
        var id = event.target.id.split("_")[2]
        $.ajax({
            type: 'PATCH',
            url: '/admin/validar_registro/' + id,
            contentType: false,
            cache: false,
            processData: false,
            beforeSend: () => {
                $("#"+event.target.id).attr("disabled", "disabled");
            },
            success: (message) => {
                showMessage(message['msg'])
                $("#"+event.target.id).removeAttr("disabled");
                // update the view to remove the user validate
                $("#validar_registro_" + id).remove()
                $("#usuario_detalles_" + id).remove()
            },
            error: (jqXHR, textStatus, errorThrown) => {
                showMessage("Se ha producido un error: Intentelo mas tarde. " + errorThrown)
                $("#"+event.target.id).removeAttr("disabled");
            }
        });

    })
    // ajax delete request to delete the non-validate user.
    $("#instalacion_list button.eliminar_usuario").on('click', (event) => {
        var id = event.target.id.split("_")[2]
        console.log(id)
        $.ajax({
            type: 'DELETE',
            url: '/admin/eliminar_registro/' + id,
            contentType: false,
            cache: false,
            processData: false,
            beforeSend: () => {
                $("#"+event.target.id).attr("disabled", "disabled");
            },
            success: (message) => {
                showMessage(message['msg'])
                $("#"+event.target.id).removeAttr("disabled");
                // update the view, to delete the user in the view.
                $("#validar_registro_"+id).remove()
                $("#usuario_detalles_"+id).remove()
            },
            error: (jqXHR, textStatus, errorThrown) => {
                showMessage("Se ha producido un error: Intentelo mas tarde." + errorThrown)
                $("#"+event.target.id).removeAttr("disabled");
            }
        });
    })
});

function showMessage(msg){
    setMessage(msg);
    $("#modal_message").modal('show').slideDown(700);
}

function setMessage(msg){
    $(".modal_message").html(msg);
}
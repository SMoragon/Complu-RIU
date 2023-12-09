"use strict";
$(document).ready((e) => {
    $("#instalacion_list button.validar_usuario").on('click', (event) => {
        event.preventDefault();
        var id = event.target.id.split("_")[2]
        $.ajax({
            type: 'PATCH',
            url: '/validar_registro/' + id,
            contentType: false,
            cache: false,
            processData: false,
            beforeSend: () => {
                $("#"+event.target.id).attr("disabled", "disabled");
            },
            success: (message) => {
                $("#"+event.target.id).removeAttr("disabled");
                $("#validar_registro_" + id).remove()
                $("#usuario_detalles_" + id).remove()
            },
            error: (jqXHR, textStatus, errorThrown) => {
                alert("Se ha producido un error: Intentelo mas tarde." + errorThrown)
                $("#"+event.target.id).removeAttr("disabled");
            }
        });

    })
    $("#instalacion_list button.eliminar_usuario").on('click', (event) => {
        var id = event.target.id.split("_")[2]
        console.log(id)
        $.ajax({
            type: 'DELETE',
            url: '/eliminar_registro/' + id,
            contentType: false,
            cache: false,
            processData: false,
            beforeSend: () => {
                $("#"+event.target.id).attr("disabled", "disabled");
            },
            success: (message) => {
                $("#"+event.target.id).removeAttr("disabled");
                $("#validar_registro_"+id).remove()
                $("#usuario_detalles_"+id).remove()
            },
            error: (jqXHR, textStatus, errorThrown) => {
                alert("Se ha producido un error: Intentelo mas tarde.")
                $("#"+event.target.id).removeAttr("disabled");
            }
        });
    })
});
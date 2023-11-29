"use strict";
$(document).ready((e) => {
    $("#instalacion_form").on('submit', (e) => {
        e.preventDefault();
        var correct = add_instalacion();
        if (correct) {
            var datos = $("#instalacion_form")[0]
            $.ajax({
                type: 'POST',
                url: '/add_instalacion',
                data: new FormData(datos),
                contentType: false,
                cache: false,
                processData: false,
                beforeSend: () => {
                    $("#add_instalacion_submit_button").attr("disabled", "disabled");
                },
                success: (message) => {
                    alert(message['msg'])
                    $("#add_instalacion_submit_button").removeAttr("disabled");
                    var modal = $("#add_instalaciones")
                    modal.modal("hide")
                    datos.reset()
                },
                error: (jqXHR, textStatus, errorThrown) => {
                    alert("Se ha producido un error: Intentelo mas tarde.")
                    $("#add_instalacion_submit_button").removeAttr("disabled");
                }
            });
        }
    });
    $("#instalacion_list form").on('submit',(event)=>{
        event.preventDefault();
        var id = event.target.id.split("_")[3]
        var correct = mod_instalacion(id)
        var imagen = putImage(id)

        if(correct){
            var formData=new FormData($("#modificar_instalacion_form_"+id)[0]);
            console.log(formData)
            $.ajax({
                type: 'PUT',
                url: '/modificar_instalacion/'+imagen,
                data: formData,
                contentType: false,
                cache: false,
                processData: false,
                beforeSend: () => {
                    $("#modificar_instalacion_form_"+id+" .mod_instalacion_submit_button").attr("disabled", "disabled");
                },
                success: (message) => {
                    alert(message['msg'])
                    $("#modificar_instalacion_form_"+id+" .mod_instalacion_submit_button").removeAttr("disabled");
                    var modal = $("#instalaciones_modificar_"+id)
                    modal.modal("hide")
                    event.target.reset()
                },
                error: (jqXHR, textStatus, errorThrown) => {
                    alert("Se ha producido un error: Intentelo mas tarde."+ errorThrown)
                    $("#add_instalacion_submit_button").removeAttr("disabled");
                }
            });
        }
    })
    $("#instalacion_list button.eliminar_instalacion").on('click',(event)=>{
        var id = event.target.id.split("_")[2]
        $.ajax({
            type: 'DELETE',
            url: '/delete_instalacion/'+id,
            contentType: false,
            cache: false,
            processData: false,
            success: (message) => {
                alert(message['msg'])
                $("#instalacion_"+id).remove()
                $("#instalacion_detalles_"+id).remove()
                $("#instalaciones_modificar_"+id).remove()
            },
            error: (jqXHR, textStatus, errorThrown) => {
                alert("Se ha producido un error: Intentelo mas tarde.")
                $("#add_instalacion_submit_button").removeAttr("disabled");
            }
        });
    })
});
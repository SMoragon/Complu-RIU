"use strict";
$(document).ready((e) => {
    // ajax post request to add an new installation
    $("#instalacion_form").on('submit', (e) => {
        e.preventDefault();
        // check if all field it´s correctly fill
        var correct = add_instalacion();
        if (correct) {
            var datos = $("#instalacion_form")[0]
            $.ajax({
                type: 'POST',
                url: '/instalaciones/add_instalacion',
                data: new FormData(datos),
                contentType: false,
                cache: false,
                processData: false,
                beforeSend: () => {
                    // disabled submit button
                    $("#add_instalacion_submit_button").attr("disabled", "disabled");
                },
                success: (message) => {
                    // remove disabled option to the submit button and close the modal
                    alert(message['msg'])
                    $("#add_instalacion_submit_button").removeAttr("disabled");
                    var modal = $("#add_instalaciones")
                    modal.modal("hide")
                    datos.reset()
                },
                error: (jqXHR, textStatus, errorThrown) => {
                    // remove disabled option to the submit button and show the error alert
                    alert("Se ha producido un error: Intentelo mas tarde.")
                    $("#add_instalacion_submit_button").removeAttr("disabled");
                }
            });
        }
    });

    // ajax put request to update the installation
    $("#instalacion_list form").on('submit',(event)=>{
        event.preventDefault();
        var id = event.target.id.split("_")[3]
        // check if each field it´s correctly fill
        var correct = mod_instalacion(id)
        var imagen = putImage(id)

        if(correct){
            var formData=new FormData($("#modificar_instalacion_form_"+id)[0]);
            console.log(formData)
            $.ajax({
                type: 'PUT',
                url: '/instalaciones/modificar_instalacion/'+imagen,
                data: formData,
                contentType: false,
                cache: false,
                processData: false,
                beforeSend: () => {
                    // disabled the submit button
                    $("#modificar_instalacion_form_"+id+" .mod_instalacion_submit_button").attr("disabled", "disabled");
                },
                success: (message) => {
                    // remove the disabled option to submit button and show an correct message
                    alert(message['msg'])
                    $("#modificar_instalacion_form_"+id+" .mod_instalacion_submit_button").removeAttr("disabled");
                    var modal = $("#instalaciones_modificar_"+id)
                    modal.modal("hide")
                    event.target.reset()
                },
                error: (jqXHR, textStatus, errorThrown) => {
                    // remove the disabled option to submit button and show an error message
                    alert("Se ha producido un error: Intentelo mas tarde."+ errorThrown)
                    $("#modificar_instalacion_form_"+id+" .mod_instalacion_submit_button").removeAttr("disabled");
                }
            });
        }
    })

    // ajax delete request to delete the instalation
    $("#instalacion_list button.eliminar_instalacion").on('click',(event)=>{
        var id = event.target.id.split("_")[2]
        $.ajax({
            type: 'DELETE',
            url: '/instalaciones/delete_instalacion/'+id,
            contentType: false,
            cache: false,
            processData: false,
            success: (message) => {
                // show success alert and remove the installation to the view
                alert(message['msg'])
                $("#instalacion_"+id).remove()
                $("#instalacion_detalles_"+id).remove()
                $("#instalaciones_modificar_"+id).remove()
            },
            error: (jqXHR, textStatus, errorThrown) => {
                // show the error alert
                alert("Se ha producido un error: Intentelo mas tarde.")
            }
        });
    })
});
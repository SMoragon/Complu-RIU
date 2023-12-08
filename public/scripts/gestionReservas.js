"use strict"

var target,inst_date, inst_from, inst_to,how_many, open_date, close_date, now,inst_id;

$(".res_inst_form").on("submit", function (event) {

    closePopups();
    event.preventDefault();
    target = $(event.target);

    inst_date = (target.find((".inst_date")).val());
    inst_date=String(inst_date).replaceAll("-",":",);
    inst_from = (target.find((".inst_from")).val());
    inst_to = (target.find((".inst_to")).val());
    inst_id=(target.find((".inst_id")).val());
    how_many=(target.find((".inst_how_many")).val());

    now=getActualDate(); 
    
   
    var when_opens=String((target.find((".when_opens")).val())).trimStart();
    open_date=strToDate(when_opens);

    var when_closes=String((target.find((".when_closes")).val())).trimStart();
    close_date=strToDate(when_closes);

    if (!validate()) {
        event.preventDefault();
    }
    else {
        $.ajax({
            method:"POST",
            url:"/reservar_instalacion/",
            contentType:"application/json",
            data:JSON.stringify({
                "inst_id":inst_id,
                "book_inst_date":inst_date,
                "book_inst_from":inst_from,
                "book_inst_to":inst_to,
                "book_inst_how_many":how_many,
            }),
            success: function(data, textStatus, jqHXR){
                target.closest(".book_inst_modal").modal('hide');
                $("#book_inst_ok").modal('show').slideDown(700);
                target[0].reset();
            },
            error: function(jqHXR, textStatus, errorThrown){
                target.closest(".book_inst_modal").modal('hide');
                target[0].reset();
                if(jqHXR.responseText==="Solape"){
                    $("#book_inst_ko").modal('show').slideDown(700);
                }
                else{
                    alert(errorThrown);
                }
            }
        })
    }
});

$("#wait_list_ok_but").on('click',function(event){
    $.ajax({
        method:"POST",
        url:"/lista_espera/",
        contentType:"application/json",
        data:JSON.stringify({
            "inst_id":inst_id,
            "book_inst_date":inst_date,
            "book_inst_from":inst_from,
            "book_inst_to":inst_to,
            "book_inst_how_many":how_many,
        }),
        success: function(data, textStatus, jqHXR){
            $("#book_inst_ko").modal('hide');
            $("#add_wait_list_ok").modal('show').slideDown(700);
        },
        error: function(jqHXR, textStatus, errorThrown){
            $("#book_inst_ko").modal('hide');
            alert(errorThrown, textStatus, jqHXR.responseText);
        }
    })
});

$(".cancel_but").on("click", function(event){
    closePopups();
});

$("#list_all_books_but").on("click", function(event){
    $.ajax({
        method:"GET",
        url: "/obtener_reservas/",
        success: function(data, textStatus, jqHXR){
            var reservas= data.reservas;
            $("#booking_cards_container").replaceWith($("<div>").prop("id","booking_cards_container"))

            if(reservas.length===0){
                $("#no_books_msg").show();
            }
            else{
              $("#no_books_msg").hide();
              reservas.forEach(inst => {
                var card_book=$("<div>").addClass("card_book my-4");

                    var inst_name_cont=$("<div>").addClass("card_book_inst_name text-center my-2");
                        var inst_name=$("<h3>").text(inst.nombre);
                    
                    var cards_body=$("<div>").addClass("booking_cards_body d-flex flex-row flex-wrap");
                        
                    var inst_img_cont=$("<div>").addClass("d-flex justify-content-center card_book_inst_img col-md-5 col-11 mx-md-3 mx-auto my-2");
                        var inst_img=$("<img>").addClass("img-fluid rounded-4").attr("src", `data:image/*;base64,${inst.imagen}`);
                    
                    var inst_info_cont=$("<div>").addClass("card_book_inst_info col-md-auto col-10");
                        var inst_date=$("<div>").addClass("card_book_inst_date my-md-2 my-1").text(`Fecha: ${inst.fecha_reserva}`);
                        var inst_from=$("<div>").addClass("card_book_inst_from my-md-2 my-1").text(`Hora de inicio: ${inst.hora_inicio}`);
                        var inst_to=$("<div>").addClass("card_book_inst_to my-md-2 my-1").text(`Hora de fin: ${inst.hora_fin}`);
                        var inst_how_many=$("<div>").addClass("card_book_inst_how_many my-md-2 my-1").text(`Asistentes: ${inst.asistentes}`);;;

                    var inst_cancel_but_cont=$("<div>").addClass("card_book_inst_but mx-auto my-3");
                        var inst_cancel_but=$("<button>").addClass("btn btn-warning cancel_book_but ").prop("type", "button").text("Cancelar reserva");
                            inst_cancel_but.on("click", function(event){
                                $("#book_inst_list_modal").modal('hide');
                                $("#del_res_modal").attr("id_res",inst.id_reserva).modal('show').slideDown(700);
                            });
                            
                    inst_name_cont.append(inst_name)
                    inst_img_cont.append(inst_img);
                    inst_info_cont.append(inst_date).append(inst_from).append(inst_to).append(inst_how_many);  
                    inst_cancel_but_cont.append(inst_cancel_but);
                    
                    cards_body.append(inst_img_cont).append(inst_info_cont).append(inst_cancel_but_cont);
                    card_book.append(inst_name_cont).append(cards_body);

                    $("#booking_cards_container").append(card_book)
              });
            }
        },
        error: function(jqHXR, textStatus, errorThrown ){
            alert(jqHXR.responseText)
        }

    })
});


$("#confirm_del_res_but").on("click", function(event){

    var id_res=$("#del_res_modal").attr("id_res")

   $.ajax({
    method:"DELETE",
    url: "/eliminar_reserva/"+id_res,
    success: function(data, textStatus, jqHXR){
        $("#del_res_ok_modal").modal('show').slideDown(700);
    },
    error: function(jqHXR, textStatus, errorThrown){
        alert(errorThrown)
    }
   })
});

function validate() {
    if(anyEmpty()){
        target.find(".empty_error").show();
        return false;
    }
    else if (inst_date < now) {
        target.find(".date_error").show();
        return false;
    }
    else if(strToDate(inst_from)<open_date) {
        target.find(".start_time_error").show();
        return false;
    }
    else if(strToDate(inst_to)>close_date) {
        target.find(".end_time_error").show();
        return false;
    }
    else if(strToDate(inst_from)>strToDate(inst_to)) {
        target.find(".total_time_error").show();
        return false;
    }
    return true;

}

function strToDate(str){
    var date=new Date();
    var hours, mins, seconds;
    [hours, mins, seconds]=str.split(":");

    date.setHours(+hours);
    date.setMinutes(mins);
    date.setSeconds("00");

    return date;
}

function getActualDate(){
    var d= new Date();
    var year =d.getFullYear();
    var month=String(Number(d.getMonth())+1);
    if(d.getMonth()+1<10) month=`0${month}`;
    var day=String(d.getDate());
    if(d.getDate()<10) day=`0${day}`;

    return year+":"+month+":"+day;
}

function anyEmpty(){
   return (inst_date===""||inst_from===""|| inst_to===""|| how_many==="");

}

function closePopups() {
    $(".book_form_error").each(function() {
      $(this).hide() ;
    });
  }


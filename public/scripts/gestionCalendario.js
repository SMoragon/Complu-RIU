"use strict";

var calendarEl, calendar, instalaciones, inst_id, date, start, end, how_many, now, inst_opt, open_time, close_time;
var bg_colours=["lightblue","lightcoral","lightgreen", "lightsalmon", "orange","lightpink", "burlywood", "cian", "purple"];

$("#watch_calendar_but").on("click", function (event) {
  $.ajax({
    method: "GET",
    url: "/obtener_reservas_inst/",
    success: function (data, textStatus, jqHXR) {
    
      reservas = data.reservas;
      instalaciones=data.instalaciones;

      rellenarOpciones();

      calendarEl = document.getElementById("res_calendar");
      setTimeout(inicializarCalendario, 300);
    },
    error: function (data, textStatus, jqHXR) {
      alert(errorThrown);
    },
  });
});


function inicializarCalendario() {
  calendar = new FullCalendar.Calendar(calendarEl, {
    locale: "en",
    initialView: "dayGridMonth",
    stickyHeaderDates: true,
    dayMaxEventRows: true,

    eventTimeFormat: {
      hour: "2-digit",
      minute: "2-digit",
      hour24: true,
    },
    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth,timeGridWeek,timeGridDay",
    },
    selectable: true,
    selectMinDistance: 10,

    dateClick: function (info) {
      var startDate;

      if (info.view.type === "dayGridMonth") {
        startDate = info.dateStr;
      } else {
        startDate = info.dateStr.substr(0, 10);
        var startTime = info.dateStr.substr(11).substr(0, 5);

        $("#book_inst_cal_from").val(startTime);
      }

      $("#book_inst_cal_date").val(startDate);
      $("#reservar_instalacion_calendario").modal("show");
    },
    select: function (info) {
      var startDate = info.startStr.substr(0, 10),
        endDate = info.endStr.substr(0, 10);
      var startTime = info.startStr.substr(11).substr(0, 5),
        endTime = info.endStr.substr(11).substr(0, 5);

      if (startDate !== endDate) {
        alert(
          "No se pueden realizar reservas que empiecen en un día y terminen en otro."
        );
        calendar.unselect();
      } else if (info.view.type !== "dayGridMonth") {
        $("#book_inst_cal_date").val(startDate);
        $("#book_inst_cal_from").val(startTime);
        $("#book_inst_cal_to").val(endTime);

        $("#reservar_instalacion_calendario").modal("show");
      }
    },
  });

  reservas.forEach((res) => {
    calendar.addEvent({
      title: `${res.nombre}`,
      start: `${res.fecha_reserva}T${res.hora_inicio}`,
      end: `${res.fecha_reserva}T${res.hora_fin}`,
      backgroundColor: bg_colours[res.id_instalacion % bg_colours.length],
    });
  });

  calendar.render();
}

$("#book_inst_cal_name").on('change', function(event){

    for(var i=0;i<instalaciones.length;i++){

        if($(event.target).val()==instalaciones[i].id){
            inst_opt=instalaciones[i];
            if(inst_opt.tipo_reserva=="colectivo"){
               $("#book_inst_cal_how_many").attr("max",inst_opt.aforo).val(1)
            }
            else{
                $("#book_inst_cal_how_many").attr("max",1).val(1)
            }
           break;
        }
    }


})

function rellenarOpciones(){
    $("#book_inst_cal_name").find('.inst_opt').remove();
    $("#book_inst_cal_name").append($("<option>").val(0).text("Selecciona una instalación...").addClass("inst_opt"))

    instalaciones.forEach((inst)=>{
      $("#book_inst_cal_name").append($("<option>").val(inst.id).text(inst.nombre).addClass("inst_opt"))
    });

}


$("#reservar_instalacion_calendario").on("submit", function (event) {

    closePopups();

    event.preventDefault();
    now=getActualDate();

    inst_id =$("#book_inst_cal_name").val();
    date=$("#book_inst_cal_date").val().replaceAll("-", ":");
    start=$("#book_inst_cal_from").val();
    end=$("#book_inst_cal_to").val();
    how_many=$("#book_inst_cal_how_many").val();


    if (!validateInput()) {
        event.preventDefault();
    }
    else {
        $.ajax({
            method:"POST",
            url:"/reservar_instalacion/",
            contentType:"application/json",
            data:JSON.stringify({
                "inst_id":inst_id,
                "book_inst_date":date,
                "book_inst_from":start,
                "book_inst_to":end,
                "book_inst_how_many":how_many,
            }),
            success: function(data, textStatus, jqHXR){
                $("#reservar_instalacion_calendario").modal('hide');
                $("#book_inst_ok").modal('show').slideDown(700);
                $(event.target)[0].reset();
            },
            error: function(jqHXR, textStatus, errorThrown){
                $("#reservar_instalacion_calendario").modal('hide');
                $("#reservar_instalacion_calendario").reset();
                if(jqHXR.responseText==="Solape"){
                    $("#book_inst_ko").modal('show').slideDown(700);
                }
                else{
                    alert(errorThrown);
                }
            }
        })
    }
  
})


function validateInput() {

    var aux_date= new Date();
    var act_time =aux_date.getHours()+ ":"+aux_date.getMinutes();

    if(inst_opt){
        open_time=inst_opt.horario_apertura,close_time=inst_opt.horario_cierre;
    }
    if(anyFieldEmpty()){
        $(".empty_cal_error").show();
        return false;
    }
    else if(inst_id === "0"){
        $(".inst_cal_error").show();
        return false;
    }
    else if (date < now) {
        $(".date_cal_error").show();
        return false;
    }
    else if(date===now && act_time>start){
        $(".start_act_cal_error").show();
        return false;
    }
    else if(start+":00"<open_time) {
        $(".start_time_cal_error").text(`La instalación no abre hasta las ${open_time}.`).show();
        return false;
    }
    else if(end+":00">close_time) {
        $(".end_time_cal_error").text(`La instalación cierra a las ${close_time}.`).show();
        return false;
    }
    else if(start>end) {
        $(".total_time_cal_error").show();
        return false;
    }
    return true;

}

function anyFieldEmpty(){
    return (inst_id===""|| date==="" ||start===""|| end===""|| how_many==="");
 
 }

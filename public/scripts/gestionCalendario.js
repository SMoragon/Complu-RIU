"use strict";

var calendarEl, calendar, instalaciones, inst_id, date, start, end, how_many, now, inst_opt, open_time, close_time;

// Colours to show when a installation is displayed in the calendar, so that they are different and more visible.
var bg_colours=["lightblue","lightcoral","lightgreen", "lightsalmon", "orange","lightpink", "burlywood", "cian", "purple"];

// Whenever the user wants to watch the calendar, an asynchronous call is made to bring the bookings and instalations (the last just in case the user wants to book)
$("#watch_calendar_but").on("click", function (event) {
  $.ajax({
    method: "GET",
    url: "/reservas/obtener_reservas_inst/",
    success: function (data, textStatus, jqHXR) {
    
      // If successful, we get the bookings and the installations information for future purposes.
      reservas = data.reservas;
      instalaciones=data.instalaciones;

      rellenarOpciones();

      calendarEl = document.getElementById("res_calendar");

      // We gotta set a timeout for this to let the modal initialize before charging and rendering the calendar on it.
      setTimeout(inicializarCalendario, 300);
    },
    error: function (data, textStatus, jqHXR) {
      if(jqHXR.responseText==="No logged"){
        closePopups();
        window.location.href = "/no_logged";
      }
      else alert(errorThrown);
    },
  });
});

// Initializes and fills the calendar with the events. Also, prepares the calendar to react in a different way while holding the button or just clicking it.
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

    // Simple click in the calendar event.
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
    }, // Holding the button in the calendar event.
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
 // Display style of the calendar.
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


 // Dynamically changes the maximum capacity in function of the installation selected.
$("#book_inst_cal_name").on('change', function(event){

    for(var i=0;i<instalaciones.length;i++){

        if($(event.target).val()==instalaciones[i].id){
            inst_opt=instalaciones[i];
            if(inst_opt.tipo_reserva=="colectivo"){
               $("#book_inst_cal_how_many").attr("max",inst_opt.aforo).val(1)
            }
            else{$("#book_inst_cal_how_many").attr("max",1).val(1)}
           break;
        }
    }
})


 // Whenever the user clicks the watch calendar button, installation select options are dynamically filled.
function rellenarOpciones(){
    $("#book_inst_cal_name").find('.inst_opt').remove();
    $("#book_inst_cal_name").append($("<option>").val(0).text("Selecciona una instalación...").addClass("inst_opt"))

    instalaciones.forEach((inst)=>{
      $("#book_inst_cal_name").append($("<option>").val(inst.id).text(inst.nombre).addClass("inst_opt"))
    });

}

 // If the user submits the form, it is validated to check that every field is correct before sending it.
$("#reservar_instalacion_calendario").on("submit", function (event) {

    closePopups();

    event.preventDefault();
    now=getActualDate();

    inst_id =$("#book_inst_cal_name").val();
    date=$("#book_inst_cal_date").val().replaceAll("-", ":");
    start=$("#book_inst_cal_from").val();
    end=$("#book_inst_cal_to").val();
    how_many=$("#book_inst_cal_how_many").val();

    // If it is not valid, the request is not done to the server.
    if (!validateInput()) {
        event.preventDefault();
    }
     // Else, if all is fine, the server manages the request and, depending how it goes, shows the user the
     // all fine moda, the one that states there's already a booking that overlaps or just an alert if it fails.
    else {
        $.ajax({
            method:"POST",
            url:"/reservas/reservar_instalacion/",
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
                $("#reservar_instalacion_calendario_form")[0].reset();
            },
            error: function(jqHXR, textStatus, errorThrown){
                $("#reservar_instalacion_calendario").modal('hide');
                $("#reservar_instalacion_calendario_form")[0].reset();
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

// Function that checks that all fields are non empty and correct.
function validateInput() {

    var aux_date= new Date();
    var act_time =aux_date.getHours()+ ":"+aux_date.getMinutes();

    // If the request ahs been made via calendar, the information must be picked from the another script.
    if(inst_opt){
        open_time=inst_opt.horario_apertura,close_time=inst_opt.horario_cierre;
    }
    if(anyFieldEmpty()){
        $(".empty_cal_error").show();
        return false;
    }
    // The user has selected the default option, which is not a valid one.
    else if(inst_id === "0"){
        $(".inst_cal_error").show();
        return false;
    }
    // The user has selected a day that has passed.
    else if (date < now) {
        $(".date_cal_error").show();
        return false;
    }
    // The user wants to book today, but in an hour that has passed.
    else if(date===now && act_time>start){
        $(".start_act_cal_error").show();
        return false;
    }
    // The user wants to book before the installation opens.
    else if(start+":00"<open_time) {
        $(".start_time_cal_error").text(`La instalación no abre hasta las ${open_time}.`).show();
        return false;
    }
    // The user wants to book after the installation closes.
    else if(end+":00">close_time) {
        $(".end_time_cal_error").text(`La instalación cierra a las ${close_time}.`).show();
        return false;
    }
    // Booking end time is previous that start one.
    else if(start>end) {
        $(".total_time_cal_error").show();
        return false;
    }
    return true;

}

 // Function that checks that all fields are non empty
function anyFieldEmpty(){
    return (inst_id===""|| date==="" ||start===""|| end===""|| how_many==="");
 }

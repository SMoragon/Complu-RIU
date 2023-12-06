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
    open_date=strToDate(when_opens)

    var when_closes=String((target.find((".when_closes")).val())).trimStart();
    close_date=strToDate(when_closes);

    if (!validate()) {
        event.preventDefault()
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
})

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
            alert(errorThrown);
        }
    })
})

$(".cancel_but").on("click", function(event){
    closePopups();
})


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
   return (inst_date===""||inst_from===""|| inst_to==="");

}

function closePopups() {
    $(".book_form_error").each(function() {
      $(this).hide() ;
    });
  }


"use strict"

var target,inst_date, inst_from, inst_to, open_date, close_date;

$(".res_inst_form").on("submit", function (event) {

    closePopups();
    event.preventDefault()
    target = $(event.target)

    inst_date = (target.find((".inst_date")).val())
    inst_date=String(inst_date).replaceAll("-",":",);
    inst_from = (target.find((".inst_from")).val())
    inst_to = (target.find((".inst_to")).val())
  
    
   
    var when_opens=String((target.find((".when_opens")).val())).trimStart();
    open_date=strToDate(when_opens)

    var when_closes=String((target.find((".when_closes")).val())).trimStart();
    close_date=strToDate(when_closes);

    if (!validate()) {
        event.preventDefault()
    }
    else {
        alert("Piola")
    }
})

$(".cancel_but").on("click", function(event){
    closePopups();
})

function validate() {
    if(anyEmpty()){
        console.log("Empty")
        target.find(".empty_error").show();
        return false;
    }
    else if (Date.parse(inst_date) < new Date()) {
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

function anyEmpty(){
   return (inst_date===""||inst_from===""|| inst_to==="");

}

function closePopups() {
    $(".book_form_error").each(function() {
      $(this).hide() ;
    });
  }
"use strict";

$(document).ready((e) => {
    var charts = {}
    var previosSelect = "None"
    // on change type of search, change the search options
    $("#tipo_busqueda").on('change', (e) => {
        var optionDict = {
            "None": [],
            "Instalacion": ["Nombre"],
            "Usuario": ["Nombre", "Apellido", "Correo", "Facultad"],
            "Reserva": ["Nombre Usuario", "Apellido Usuario", "Nombre Facultad", "Nombre Instalacion", "Fecha Inicio - Fecha Fin"],
            "Facultad": ["Nombre Facultad", "Nombre Usuario", "Apellido Usuario"]
        };
        deleteTempOption();
        optionDict[e.target.value].forEach(element => {
            createOption(element)
        });
        if (previosSelect === "Fecha Inicio - Fecha Fin") {
            changeToSearchInput()
        }
        previosSelect = "None"
    });
    $("#filtrar_por").on('change', (e) => {
        if (e.target.value === "Fecha Inicio - Fecha Fin") {
            changeToDateInput()
        } else if (previosSelect === "Fecha Inicio - Fecha Fin") {
            changeToSearchInput()
        }
        previosSelect = e.target.value
    });

    // on submit the form of advanced search
    $("#busqueda_avanzada").on('submit', (event) => {
        // delete err msg
        deleteErrMsg();
        // get form values
        var formDatos = new FormData(event.target)
        var buscar = $("#tipo_busqueda").prop("value")
        var filtrar = $("#filtrar_por").prop("value")
        var dato;
        // checking
        if (filtrar === "Fecha Inicio - Fecha Fin") {
            dato = [$("#date_init").prop("value"), $("#date_end").prop("value")];
        } else {
            dato = [$("#search_input").prop("value")]
        }
        var checkTime = correctTimeSelect(dato);
        // if there are some error like incorrect time or empty field, then prevent the submit event
        if (!checkTime) {
            event.preventDefault();
            addErrMsg("Por favor introduzca las fechas en el orden correcto, el de inicio debe de ser anteriol o igual al del fin.");
        } else if (!(notEmpty(buscar) && notEmpty(filtrar) && checkTime)) {
            event.preventDefault();
            addErrMsg("Por favor, seleccione lo que quiere buscar y el filtro a aplicar.")
        }
    });

    // ajax get request to get an list of users belongs to the faculty and update the table, lazy implementation
    $("#facultad_container .user_list_button").on('click', (event) => {
        var id = event.target.id.split("_")[3]
        $.ajax({
            type: 'GET',
            url: '/busqueda/facultad_usuarios/' + id,
            contentType: false,
            cache: false,
            processData: false,
            success: (json) => {
                var datos = json['usuarios'];
                updateRowToTableUserList(id, datos);
            },
            error: (jqXHR, textStatus, errorThrown) => {
                showMessage("Se ha producido un error: Intentelo mas tarde. " + errorThrown)
            }
        });
    });

    // ajax get request to get an user history and update the table to showing the user, lazy implementation
    $("#usuario_list .historial_usuario").on('click', (event) => {
        var id = event.target.id.split("_")[3]
        $.ajax({
            type: 'GET',
            url: '/busqueda/historial_usuario/' + id,
            contentType: false,
            cache: false,
            processData: false,
            success: (json) => {
                var datos = json['historial'];
                updateRowToTableHistory(id, datos);
            },
            error: (jqXHR, textStatus, errorThrown) => {
                showMessage("Se ha producido un error: Intentelo mas tarde. " + errorThrown);
            }
        });
    });

    // ajax get request to get an installation history and update the table to showing the user, lazy implementation
    $("#instalacion_list .historial_instalacion").on('click', (event) => {
        var id = event.target.id.split("_")[3]
        $.ajax({
            type: 'GET',
            url: '/busqueda/historial_instalacion/' + id,
            contentType: false,
            cache: false,
            processData: false,
            success: (json) => {
                var datos = json['historial'];
                updateRowToTableHistory(id, datos);
            },
            error: (jqXHR, textStatus, errorThrown) => {
                showMessage("Se ha producido un error: Intentelo mas tarde. " + errorThrown);
            }
        });
    });

    // ajax patch request to update the user to admin
    $("#usuario_list button.hacer_admin_button").on('click', (event) => {
        event.preventDefault();
        var id = event.target.id.split("_")[3]
        $.ajax({
            type: 'PATCH',
            url: '/admin/hacer_admin/' + id,
            contentType: false,
            cache: false,
            processData: false,
            success: (message) => {
                showMessage(message['msg']);
                location.reload();
            },
            error: (jqXHR, textStatus, errorThrown) => {
                showMessage("Se ha producido un error: Intentelo mas tarde. " + errorThrown)
            }
        });

    })

    // ajax get request to get an user books installation statistic and update the charts to showing the user, lazy implementation
    $("#usuario_list .estadistica_usuario").on('click', (event) => {
        var id = event.target.id.split("_")[3]
        $.ajax({
            type: 'GET',
            url: '/busqueda/estadistica_usuario/' + id,
            contentType: false,
            cache: false,
            processData: false,
            success: (json) => {
                var datos = json['estadistica'];
                if(charts[id]){
                    charts[id].destroy();
                }
                charts[id]=paintChart(id, datos, "Frecuencia de uso por instalacion");
            },
            error: (jqXHR, textStatus, errorThrown) => {
                showMessage("Se ha producido un error: Intentelo mas tarde. " + errorThrown);
            }
        });
    });

    // ajax get request to get an faculty statistic and update the cahrts to showing the user, lazy implementation
    $("#facultad_container .estadistica_facultad").on('click', (event) => {
        var id = event.target.id.split("_")[3]
        $.ajax({
            type: 'GET',
            url: '/busqueda/estadistica_facultad/' + id,
            contentType: false,
            cache: false,
            processData: false,
            success: (json) => {
                var datos = json['estadistica'];
                if(charts[id]){
                    charts[id].destroy();
                }
                charts[id]=paintChart(id, datos, "Frecuencia de uso por instalacion");
            },
            error: (jqXHR, textStatus, errorThrown) => {
                showMessage("Se ha producido un error: Intentelo mas tarde. " + errorThrown);
            }
        });
    });
});

// add error message to the page
function addErrMsg(msg) {
    var message = `<div class="row justify-content-center" id="err_msg"><div class="col-auto"><span class="h4 text-danger">${msg}</span></div></div>`;
    $("#form_container").prepend(message);
}

// delete error message
function deleteErrMsg() {
    $("#form_container #err_msg").remove();
}

// check if the data it´s not empty
function notEmpty(dato) {
    return dato !== "None" && dato !== ""
}

// check the range of date it´s in correct order
function correctTimeSelect(dato) {
    var check = true;
    if (dato.length === 2) {
        check = check && notEmpty(dato[0]) && notEmpty(dato[1]);
        check = check && dato[0] <= dato[1]
    }
    return check;
}

// delete date input
function deleteTempOption() {
    $("#filtrar_por .tempOption").remove()
}

// create an option to the search option
function createOption(value) {
    $("#filtrar_por").append(`<option value="${value}" class="tempOption">${value}</option>`)
}

// change the search input to text input
function changeToSearchInput() {
    deleteDateInput();
    createSearchInput();
}

// change the search input to date input
function changeToDateInput() {
    deleteSearchInput();
    createDateInput();
}

// create a search text input
function createSearchInput() {
    var searchInput = '<input class="search_text rounded-3 search_text_mine" type="text" placeholder="Search.." name="search" id="search_input">';
    $("#search_box").prepend(searchInput)
}

// delete a search text input
function deleteSearchInput() {
    $("#search_box .search_text").remove()
}

// create a date input
function createDateInput() {
    var today = new Date();
    var day = today.getDate();
    var month = today.getMonth() + 1;
    var year = today.getFullYear();
    if (day < 10) {
        day = "0" + day;
    }
    if (month < 10) {
        month = "0" + month;
    }
    var minDate = `${year - 10}-${month}-${day}`;
    var maxDate = `${year + 10}-${month}-${day}`;
    var firstDateInput = `<div class="col-4 d-inline-block"><input type="date" id="date_init" name="date_init" onkeydown="return false" min="${minDate}" max="${maxDate}" class="form-control form-control-sm rounded-4 text-truncate"></div>`
    var toText = '<span>To</span>'
    var secondDateInput = `<div class="col-4 d-inline-block"><input type="date" id="date_end" name="date_end" onkeydown="return false" min="${minDate}" max="${maxDate}" class="form-control form-control-sm rounded-4 text-truncate"></div>`
    var search_box = $("#search_box")
    search_box.prepend(secondDateInput);
    search_box.prepend(toText);
    search_box.prepend(firstDateInput);
}

// delete date input
function deleteDateInput() {
    $("#search_box div").remove();
    $("#search_box span").remove();
}

// update the table that contains an lists of users
function updateRowToTableUserList(id, usuarios) {
    deleteRowToTable(id);
    var row_container = $(`#table_row_${id}`);
    usuarios.forEach(element => {
        row_container.append(addRowToTableTextUserList(element));
    });
}

// return a text to create one row to append to the table user list
function addRowToTableTextUserList(data) {
    return `<tr>
        <th scope="row">${data.id}</th>
        <td>${data.nombre}</td>
        <td>${data.apellidos}</td>
        <td>${data.correo}</td>
        <td>${data.curso}</td>
        <td>${data.grupo}</td>
    </tr>`
}

// update the table that contains history
function updateRowToTableHistory(id, historiales) {
    deleteRowToTable(id);
    var row_container = $(`#table_row_${id}`);
    historiales.forEach(element => {
        row_container.append(addRowToTableTextHistory(element));
    });
}

// return the text that´s contains one row to append to the table history 
function addRowToTableTextHistory(data) {
    return `<tr>
        <th scope="row">${data.nombre}</th>
        <td>${new Date(data.fecha_reserva).toLocaleDateString()}</td>
        <td>${data.hora_inicio}</td>
        <td>${data.hora_fin}</td>
        <td>${data.asistentes}</td>
    </tr>`
}

// delete table
function deleteRowToTable(id) {
    $(`#table_row_${id} tr`).remove()
}

// paint chart with the datasets and return the new chart that´s create
function paintChart(id, datasets, title) {
    var ctx = $(`#chart_${id}`);
    var tam = datasets.length;
    var labels = [];
    var datas = [];
    datasets.forEach(element => {
        labels.push(element.label)
        datas.push(element.counter)

    });
    const data = {
        labels: labels,
        datasets: [{
            label: title,
            data: datas,
            backgroundColor: getListColor(tam),
            hoverOffset: tam + 1
        }]
    };
    return new Chart(ctx, {
        type: 'pie',
        data: data,
        options: {
            plugins: {
                title: {
                    display: true,
                    text: title,
                    color: 'rgb(188, 180, 231)'
                }
            },
            responsive: true,
            maintainAspectRatio: false,
            showScale: false
        }
    });
}

// get a list of color providing the list length
function getListColor(length) {
    var color_list = [];
    if (length < 6) {
        var aux_color_list = ["rgb(255, 0, 0)", "rgb(0, 255, 0)", "rgb(0, 0, 255)", "rgb(128, 128, 0)", "rgb(0, 128, 128)"];
        for (var i = 0; i < length; i++) {
            color_list.push(aux_color_list[i]);
        }
    } else {
        var color = ["rb", "rg", "gr", "gb", "bg", "br"];
        var red, green, blue;
        var mod = length % color.length;
        var divided = length / color.length;
        var max_j;
        for (var i = 0; i < color.length; i++) {
            red = 0;
            green = 0;
            blue = 0;
            if (mod > 0) {
                max_j = divided + 2;
                mod -= 1;
            } else {
                max_j = divided + 1;
            }
            switch (color[i][0]) {
                case "r":
                    red = 255;
                    break;
                case "g":
                    green = 255;
                    break;
                case "b":
                    blue = 255;
                    break;
            }
            var step = Math.floor(256 / max_j);
            for (var j = 1; j < max_j; j++) {
                switch (color[i][1]) {
                    case "r":
                        red = j * step;
                        break;
                    case "g":
                        green = j * step;
                        break;
                    case "b":
                        blue = j * step;
                        break;
                }
                color_list.push(`rgb(${red}, ${green}, ${blue})`);
            }
        }
    }
    return color_list;
}

function showMessage(msg){
    setMessage(msg);
    $("#modal_message").modal('show').slideDown(700);
}

function setMessage(msg){
    $(".modal_message").html(msg);
}
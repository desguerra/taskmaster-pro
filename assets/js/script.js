var tasks = {};

var createTask = function(taskText, taskDate, taskList) {
    // create elements that make up a task item
    var taskLi = $("<li>").addClass("list-group-item");
    var taskSpan = $("<span>")
        .addClass("badge badge-primary badge-pill")
        .text(taskDate);
    var taskP = $("<p>")
        .addClass("m-1")
        .text(taskText);

    // append span and p element to parent li
    taskLi.append(taskSpan, taskP);

    // check due date
    auditTask(taskLi);

    // append to ul list on the page
    $("#list-" + taskList).append(taskLi);
};

var loadTasks = function() {
    tasks = JSON.parse(localStorage.getItem("tasks"));

    // if nothing in localStorage, create a new object to track all task status arrays
    if (!tasks) {
        tasks = {
        toDo: [],
        inProgress: [],
        inReview: [],
        done: []
        };
    }

    // loop over object properties
    $.each(tasks, function(list, arr) {
        // then loop over sub-array
        arr.forEach(function(task) {
        createTask(task.text, task.date, list);
        });
    });
};

var saveTasks = function() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
};

$(".list-group").on("click", "p", function() {
    var text = $(this)
        .text()
        .trim();

    var textInput = $("<textarea>")
        .addClass("form-control")
        .val(text);

    // replace <p> element with <textarea> element created above
    $(this).replaceWith(textInput);
    // auto focus textInput
    textInput.trigger("focus");

    console.log(text);
});

// blur event will trigger as soon as the user interacts with 
// anything other than the <textarea> element
$(".list-group").on("blur", "textarea", function() {
    // get the textarea's current value/text
    var text = $(this)
        .val()
        .trim();

    // get the parent ul's id attribute
    var status = $(this)
        .closest(".list-group")
        .attr("id")
        .replace("list-", "");

    // get the task's position in the list of other li elements
    var index = $(this)
        .closest(".list-group-item")
        // .index() points out that child elements are indexed starting at zero
        .index();

    tasks[status][index].text = text;
    saveTasks();

    // recreate p element to convert back to p element
    var taskP = $("<p>")
    .addClass("m-1")
    .text(text);

    // replace textarea with p element
    $(this).replaceWith(taskP);
});

// due date was clicked
$(".list-group").on("click", "span", function() {
    // get current text
    var date = $(this)
        .text()
        .trim();
  
    // create new input element
    var dateInput = $("<input>")
        .attr("type", "text")
        .addClass("form-control")
        .val(date);
  
    // swap out elements
    $(this).replaceWith(dateInput);

    // enable jquery ui datepicker
    dateInput.datepicker({
        minDate: 1,
        onClose: function() {
            // when calendar is closed, force a "change" event on the `dateInput`
            $(this).trigger("change");
        }
    });
  
    // automatically bring up calendar
    dateInput.trigger("focus");
});

// editing task's due date
var auditTask = function(taskEl) {
    // get date from task element
    var date = $(taskEl).find("span").text().trim();

    // convert to moment object at 5:00pm
    var time = moment(date, "L").set("hour", 17);

    // remove any old classes from element
    $(taskEl).removeClass("list-group-item-warning list-group-item-danger");

    // apply new class if task is near/over due date
    if (moment().isAfter(time)) {
        $(taskEl).addClass("list-group-item-danger");
    }

    // apply new class if task is near/over due date
    if (moment().isAfter(time)) {
        $(taskEl).addClass("list-group-item-danger");
    } 
    else if (Math.abs(moment().diff(time, "days")) <= 2) {
        $(taskEl).addClass("list-group-item-warning");
    }
};

// value of due date was changed
$(".list-group").on("change", "input[type='text']", function() {
    // get current text
    var date = $(this)
        .val()
        .trim();
  
    // get the parent ul's id attribute
    var status = $(this)
        .closest(".list-group")
        .attr("id")
        .replace("list-", "");
  
    // get the task's position in the list of other li elements
    var index = $(this)
        .closest(".list-group-item")
        .index();
  
    // update task in array and re-save to localstorage
    tasks[status][index].date = date;
    saveTasks();
  
    // recreate span element with bootstrap classes
    var taskSpan = $("<span>")
        .addClass("badge badge-primary badge-pill")
        .text(date);
  
    // replace input with span element
    $(this).replaceWith(taskSpan);

    // Pass task's <li> element into auditTask() to check new due date
    auditTask($(taskSpan).closest(".list-group-item"));
});

// convert .card .list-group into a sortable
$(".card .list-group").sortable({
    connectWith: $(".card .list-group"),
    scroll: false,
    tolerance: "pointer",
    // create a copy of the dragged element and move the 
    // copy instead of the original. This is necessary to 
    // prevent click events from accidentally triggering on 
    // the original element.
    helper: "clone",
    // trigger once for all connected lists as soon as 
    // dragging starts and stops
    activate: function(event) {
        $(this).addClass("dropover");
        $(".bottom-trash").addClass("bottom-trash-drag");
;    },
    deactivate: function(event) {
        $(this).removeClass("dropover");
        $(".bottom-trash").removeClass("bottom-trash-drag");
    },
    // when a dragged item enters or leaves a connected list
    over: function(event) {
        $(event.target).addClass("dropover-active");
    },
    out: function(event) {
        $(event.target).removeClass("dropover-active");
    },
    // triggers when the contents of a list have changed
    update: function(event) {
        // array to store the task data in
        var tempArr = [];
        // loop over current set of children in sortable list
        $(this).children().each(function() {
            var text = $(this)
                .find("p")
                .text()
                .trim();

            var date = $(this)
                .find("span")
                .text()
                .trim();

            // add task data to the temp array as an object
            tempArr.push({
                text: text,
                date: date
            });
        });

        // trim down list's ID to match object property
        var arrName = $(this)
        .attr("id")
        .replace("list-", "");

        // update array on tasks object and save
        tasks[arrName] = tempArr;
        saveTasks();
    }
});

// convert trash into droppable
$("#trash").droppable({
    accept: ".card .list-group-item",
    tolerance: "touch",
    drop: function(event, ui) {
        ui.draggable.remove();
        $(".bottom-trash").removeClass("bottom-trash-active");
    },
    over: function(event, ui) {
        console.log("over");
        $(".bottom-trash").addClass("bottom-trash-active");
    },
    out: function(event, ui) {
        console.log("out");
        $(".bottom-trash").removeClass("bottom-trash-active");
    }
});

// add date picker 
$("#modalDueDate").datepicker({
    minDate: 1
});


// modal was triggered
$("#task-form-modal").on("show.bs.modal", function() {
    // clear values
    $("#modalTaskDescription, #modalDueDate").val("");
});

// modal is fully visible
$("#task-form-modal").on("shown.bs.modal", function() {
    // highlight textarea
    $("#modalTaskDescription").trigger("focus");
});

// save button in modal was clicked
$("#task-form-modal .btn-save").click(function() {
    // get form values
    var taskText = $("#modalTaskDescription").val();
    var taskDate = $("#modalDueDate").val();

    if (taskText && taskDate) {
        createTask(taskText, taskDate, "toDo");

        // close modal
        $("#task-form-modal").modal("hide");

        // save in tasks array
        tasks.toDo.push({
        text: taskText,
        date: taskDate
        });

        saveTasks();
    }
});

// remove all tasks
$("#remove-tasks").on("click", function() {
    for (var key in tasks) {
        tasks[key].length = 0;
        $("#list-" + key).empty();
    }
    saveTasks();
});

// load tasks for the first time
loadTasks();

// audit tasks every 30 mins
setInterval(function () {
    $(".card .list-group-item").each(function(index, el) {
      auditTask(el);
    });
}, 1800000);
const inputBox = document.getElementById("input-box");
const listContainer = document.getElementById("list-container");
const filtersBox = document.getElementById("filters-box");
const searchInput = document.getElementById("search-input");
const clearButton = document.getElementById("clearOrCancel");

let todoListManager = {
  tasks: [],
  vars: {
    currentFilterSlug: "all",
    renderMode: "list",
    editedTaskID: "111",
    searchFieldContent: "",
  },
};

// functions ---------------------------------------------------------------

//called by `Add` button onclick
function addTask() {
  if (inputBox.value === "") {
    alert("you must write something");
  } else {
    // create task
    let newTask = {
      id: `f${(+new Date()).toString(16)}-${todoListManager.tasks.length}`,
      text: inputBox.value,
      completed: false,
    };
    todoListManager.tasks.push(newTask);

    renderTasks();
  }
  inputBox.value = "";
  saveData();
}

// render list of tasks or 'edit task' state, depends on todoListManager.vars.renderMode value
function renderTasks() {
  listContainer.innerHTML = ""; // Clear any existing content

  // list state of application
  if (todoListManager.vars.renderMode == "list") {
    clearButton.innerHTML = "clear all"; //change back text of clearOrCancel button

    let filteredlist = filteredTasks(); // filter tasks before render

    filteredlist.forEach((task) => {
      const li = document.createElement("li"); //li element for task
      li.textContent = task.text;
      li.id = `list-${task.id}`;
      if (task.completed) {
        li.className = `checked`;
      }

      const editSpan = document.createElement("span");
      editSpan.className = `edit`;
      editSpan.id = `edit-${task.id}`;
      editSpan.innerHTML = "\u270E"; // Edit icon

      const span = document.createElement("span");
      span.id = task.id;
      span.innerHTML = "\u00d7"; // delete button

      li.appendChild(span);
      li.appendChild(editSpan);
      listContainer.appendChild(li);
    });

    // 'edit' state of application
  } else if (todoListManager.vars.renderMode == "edit") {
    todoListManager.tasks.forEach((task) => {
      if (task.id == todoListManager.vars.editedTaskID) {
        const li = document.createElement("li"); //li element for task with editedTaskID
        li.id = `list-${task.id}`;
        if (task.completed) {
          li.className = `checked`;
        }

        const editInput = document.createElement("input"); // input element for editing
        editInput.type = "text";
        editInput.value = task.text;
        editInput.contentEditable = "true";
        editInput.className = "edit-input";

        const saveButton = document.createElement("button"); // save button
        saveButton.id = `${task.id}`;
        saveButton.textContent = "Save";
        saveButton.className = "save-button";

        li.appendChild(editInput);
        li.appendChild(saveButton);
        listContainer.appendChild(li);

        clearButton.innerHTML = "cancel"; //changing text of clearOrCancel button

        // keeping focus on edit-input field
        window.addEventListener("click", function (event) {
          if (todoListManager.vars.renderMode == "edit") {
            const editInput = document.querySelector(".edit-input");
            editInput.focus();
          }
        });

        // save button Enter activation
        editInput.addEventListener("keydown", function (event) {
          if (event.key === "Enter") {
            saveEditedTask(todoListManager.vars.editedTaskID);
            renderTasks();
          }
        });
      }
    });
  }
}

function saveData() {
  const state = JSON.stringify(todoListManager);
  localStorage.setItem("todoListState", state);
}

function restoreData() {
  const storedState = localStorage.getItem("todoListState");
  if (storedState) {
    todoListManager = JSON.parse(storedState);
    todoListManager.vars.currentFilterSlug = "all";
  } else {
    // Initialize state with default values
    todoListManager = {
      tasks: [],
      vars: {
        currentFilterSlug: "all",
        renderMode: "list",
        editedTaskID: "111",
        searchFieldContent: "",
      },
    };
  }

  searchInput.value = "";
}

function deleteTask(e) {
  const taskId = e.target.id;
  todoListManager.tasks = todoListManager.tasks.filter(
    (task) => task.id !== taskId
  );
  saveData();
  renderTasks();
}

// active/completed task switch
function toggleChecked(taskId, state) {
  const taskIndex = todoListManager.tasks.findIndex(
    (task) => task.id === taskId
  );
  if (taskIndex !== -1) {
    if (state !== 0) {
      todoListManager.tasks[taskIndex].completed = false;
    } else {
      todoListManager.tasks[taskIndex].completed = true;
    }
  }
  saveData();
}

function saveEditedTask(taskId) {
  const taskIndex = todoListManager.tasks.findIndex(
    (task) => task.id === taskId
  );
  if (taskIndex !== -1) {
    let editInput = document.querySelector(".edit-input");
    todoListManager.tasks[taskIndex].text = editInput.value;

    todoListManager.vars.renderMode = "list";
    saveData();
  }
}

// This function just reasign `selected` class on html element and alters currentFilterSlug
// Actual filtering goes inside of filteredTasks()
function filterHandler(buttonId) {
  const buttons = document.querySelectorAll(".filters button");
  buttons.forEach((button) => {
    button.classList.remove("selected");
  });
  let selectedButton = document.getElementById(buttonId);
  selectedButton.classList.add("selected");

  todoListManager.vars.currentFilterSlug = buttonId;
  renderTasks();
}

// filter function executed inside of renderTasks() and returns filtered list of tasks
function filteredTasks() {
  let tasks = todoListManager.tasks;
  let filteredTasksList = [];

  // filtering by todoListManager.currentFilterSlug
  switch (todoListManager.vars.currentFilterSlug) {
    case "all":
      filteredTasksList = tasks; // return all tasks
      break;
    case "active":
      filteredTasksList = tasks.filter((task) => !task.completed); // return only active tasks
      break;
    case "completed":
      filteredTasksList = tasks.filter((task) => task.completed); // return only completed tasks
      break;
  }
  // post filtering by search field
  if (todoListManager.vars.searchFieldContent === "") {
    return filteredTasksList; // Return all tasks when search text is empty
  } else {
    return filteredTasksList.filter((task) => {
      const taskText = task.text.toLowerCase();
      return taskText.includes(todoListManager.vars.searchFieldContent);
    });
  }
}

// a fancy button with dual functionality depending on renderMode
function clearOrCancel() {
  if (todoListManager.vars.renderMode == "list") {
    todoListManager.tasks = [];
    saveData();
    renderTasks();
  } else if (todoListManager.vars.renderMode == "edit") {
    todoListManager.vars.renderMode = "list";
    renderTasks();
  }
}

// listeners ------------------------------------------------------------------

// checked LI
listContainer.addEventListener("click", function (e) {
  if (e.target.tagName === "LI") {
    let checkedTaskID = e.target.id.slice(5);
    let checkState = e.target.classList.length;
    toggleChecked(checkedTaskID, checkState);
    e.target.classList.toggle("checked");
  }

  // 'edit' span
  else if (e.target.tagName === "SPAN" && e.target.id.startsWith("edit")) {
    todoListManager.vars.renderMode = "edit";
    todoListManager.vars.editedTaskID = e.target.id.slice(5); // save id of clicked task to render it in edit mode
    renderTasks();
  }

  // 'delete' span
  else if (e.target.tagName === "SPAN") {
    deleteTask(e); //also re-renderTasks here
  }

  // save button
  else if (e.target.className === "save-button") {
    saveEditedTask(todoListManager.vars.editedTaskID);
    renderTasks();
  }
});

// search field
searchInput.addEventListener("input", function () {
  const searchText = searchInput.value.toLowerCase();
  todoListManager.vars.searchFieldContent = searchText;
  renderTasks();
});

// add task button Enter activation
inputBox.addEventListener("keydown", function (event) {
  if (event.key === "Enter" && inputBox.value !== "") {
    addTask();
    inputBox.value = "";
  }
});

restoreData();
renderTasks();
inputBox.focus();

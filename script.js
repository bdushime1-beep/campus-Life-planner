const $ = id => document.getElementById(id);
const load = k => JSON.parse(localStorage.getItem("clp_" + k + "s")) || [];
const data = { task: load("task"), event: load("event"), deadline: load("deadline") };
const save = () => Object.keys(data).forEach(k => localStorage.setItem("clp_" + k + "s", JSON.stringify(data[k])));


const today = new Date().toLocaleDateString("en-CA");
const days = d => Math.round((new Date(d) - new Date(today)) / 864e5);
const pretty = d => new Date(d).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", timeZone: "UTC"});
const esc = s => s.replace(/[&<>"]/g, c => "&#" + c.charCodeAt(0) + ";");


function tick() {
    const n = new Date(), h = n.getHours();
    $("clock").textContent = n.toLocateTimeString();
    $("today-date").textContent = n.toLocaleDateString(underfined, { weekday: "long", year: "numeric", month: "long", day: "numeric"});
    $("greeting").textContent = (h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening") + "! Here's your campus plan.";
}
tick();
setInterval(tick, 1000);


const li = (type, i, meta, badge) =>
    '<li class="${i.done ? "done" : ""}">' + (type == "task" ? '<input type="checkbox" ${i.done ? "checked" : ""} data-id="${i.id}">' :"") +
'<span class="text"><span class="title">${esc(i.text)}</span>${meta ? '<span class="meta">${meta}</span>' : ""}</span>' +
'${badge}<button class="delete" data-id="${i.id}" data-type="${type}">X</button></li>';

const show = (id, rows, empty) => $(id).innerHTML = rows.join("") || '<li class="empty">${empty}</li>';


function render() {
    const rank = { high: 0, medium: 1, low: 2};
    show("task-list",
        [...data.task].sort((a, b) => a.done - b.done || rank[a.priority] - rank[b.priority])
        .map(t => li("task", t, "", '<span class="badge ${t.priority}">${t.priority}</span>')), "No tasks yet. Add one above!"
    );

    const events = data.event.filter(e => days(e.date) >= 0)
    .sort((a, b) => (a.date + a.time).localCompare(b.date + b.time));
    show("event-list",
        show("event-list",
    events.map(e => {
    const d = days(e.date);
    return li("event", e, (d == 0? "Today" : d == 1 ? "Tomorrow" : pretty(e.date)) + (e.time ? " at " + e.time : ""), "");
    }),
        "No upcoming events.");

    show("deadline-list",
        [...data.deadline].sort((a, b) => a.date.localCompare(b.date)).map(x => {
            const n = days(x.date);
            const label = n < 0 ? -n + " day(s) late" : n == 0 ? "Due today!" : n + " day(s) left";
            return li("deadline", x, pretty(x.date), '<span class="bagde ${n <= 0 ? "late" : n <= 3 ? "soon" : "ok"}">${label}</span>');
        }),
        "No deadlines. Enjoy the calm!");

    $("stat-tasks").textContent = data.task.filter(t => !t.done).length;
    $("stat-events").textContent = events.length;
    $("stat-deadlines").textContent = data.deadline.filter(d => days(d.date) >= 0).length;    
}


function add(e, type, item) {
    e.preventDefault();
    data[type].push({ id: Date.now(), ...item});
    e.target.reset();
    $("event-date").value = $("deadline-date").value = today;
    save();
    render();
}


$("task-form").onsubmit = e => add(e, "task", { text: $("task-input").value, priority: $("task-priority").value, done: false});
$("event-form").onsubmit = e => add(e, "event", { text: $("event-input").value, date: $("event-date").value, time: $("event-time").value });
$("deadline-form").onsubmit = e => add(e, "deadline", { text: $("deadline-input").value, date: $("deadline-date").value });


document.onclick = e => {
    const { id, type } = e.target.dataset;
    if (!e.target.classList.contains("delete")) return;
    data[type] = data[type].filter(i => i.id != id);
    save();
    render();
};


document.onchange = e => {
    if (e.target.type != "checkbox") return;
    data.task.find(t => t.id == e.target.dataset.id).done = e.target.checked;
    save();
    render();
};

let left = 1500, timer;
const showTimer = () => $("timer-display").textContent = String(left / 60 | 0).padStart(2, "0") + ":" + String(left % 60).padStart(2, "0");
const stop = () => { clearInterval(timer); timer = null; };

$("timer-start").onclick = () => timer || (timer = setInterval(() => { 
    left--;
    if (left <= 0) { stop(); left = 1500; showTimer(); alert("Time's up! Take a short breat ");
    }
    showTimer();
}, 1000));

$("timer-pause").onclick = stop;
$("timer-reset").onclick = () => {stop(); left = 1500; showTimer(); };


$("event-date").value = $("deadline-date").value = today;
showTimer();
render();
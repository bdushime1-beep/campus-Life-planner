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
    $("greeting").text

}
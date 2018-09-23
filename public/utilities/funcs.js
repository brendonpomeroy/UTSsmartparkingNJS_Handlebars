function hideNav() {
    var menu = document.getElementById("myTopNav");
    if (menu.className === "nav") {
        menu.className += " responsive";
    } else {
        menu.className = "nav";
    }
}

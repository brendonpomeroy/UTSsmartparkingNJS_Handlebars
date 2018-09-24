function HideAndShowNav() {
    var menu = document.getElementById("myTopNav");
    if (menu.className === "nav") {
        menu.className += " responsive";
    } else {
        menu.className = "nav";
    }
}

function highLightNav(index){
  document.getElementById("myTopNav").getElementsByTagName('a')[id].classList.add('active');
}

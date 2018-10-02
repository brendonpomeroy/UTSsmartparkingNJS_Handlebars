function HideAndShowNav() {
    var menu = document.getElementById("myTopNav");
    if (menu.className === "nav") {
        menu.className += " responsive";
    } else {
        menu.className = "nav";
    }
}

// function highLightNav(id){
//   document.getElementById("myTopNav").getElementsByTagName('a')[id].classList.add('active');
// }

function highLightThis(){
  var link = document.querySelectorAll('.nav a');
  for (var i = 0; i < link.length; i++){
    if (link[i].href == document.URL)
      link[i].classList.add('active');
  }
}

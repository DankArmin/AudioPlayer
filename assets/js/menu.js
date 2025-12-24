document.addEventListener("DOMContentLoaded", () => {
    initMenu();
});

function initMenu(){
    const homeMenuButton = document.getElementById("menu-home");
    const libraryMenuButton = document.getElementById("menu-library");
    const settingsMenuButton = document.getElementById("menu-settings");
    
    homeMenuButton.addEventListener("click", () => {
        showSection("home");
    });
    libraryMenuButton.addEventListener("click", () => {
        showSection("library");
    }
    );
    settingsMenuButton.addEventListener("click", () => {
        showSection("settings");
    });
}

function showSection(sectionId){
    const sections = document.querySelectorAll(".menu");
    sections.forEach(section => {
        if(section.id === sectionId){
            section.classList.remove("hidden");
        } else {
            section.classList.add("hidden");
        }
    });
    
    const menuButtons = document.querySelectorAll("header nav ul li");
    menuButtons.forEach(button => {
        if(button.id === `menu-${sectionId}`){
            button.classList.add("current-menu");
        } else {
            button.classList.remove("current-menu");
        }
    });
}
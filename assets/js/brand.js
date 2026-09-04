const brandLogoStorageKey = "darouSalamBrandLogo";
const savedBrandLogo = localStorage.getItem(brandLogoStorageKey);

const sidebar = document.querySelector(".sidebar");
const mobileNavToggle = document.getElementById("mobileMenuBtn") || document.createElement("button");
if (!mobileNavToggle.id) {
    mobileNavToggle.className = "mobile-nav-toggle";
    mobileNavToggle.type = "button";
    document.body.appendChild(mobileNavToggle);
}
mobileNavToggle.setAttribute("aria-label", "Ouvrir le menu");
mobileNavToggle.innerHTML = '<i class="fa-solid fa-bars"></i>';

mobileNavToggle.addEventListener("click", () => {
    const ouvert = sidebar?.classList.toggle("open");
    mobileNavToggle.setAttribute("aria-label", ouvert ? "Fermer le menu" : "Ouvrir le menu");
    mobileNavToggle.innerHTML = ouvert
        ? '<i class="fa-solid fa-xmark"></i>'
        : '<i class="fa-solid fa-bars"></i>';
});

sidebar?.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => sidebar.classList.remove("open"));
});

document.querySelectorAll(".logo-icon").forEach(logo => {
    logo.setAttribute("role", "button");
    logo.setAttribute("tabindex", "0");
    logo.setAttribute("title", "Modifier le logo");
    logo.setAttribute("aria-label", "Modifier le logo");

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.hidden = true;

    const afficherLogo = photo => {
        logo.innerHTML = photo
            ? `<img src="${photo}" alt="Logo de Darou Salam">`
            : '<i class="fa-solid fa-gem"></i>';
    };

    logo.appendChild(input);
    afficherLogo(savedBrandLogo);

    const ouvrirSelection = () => input.click();
    logo.addEventListener("click", ouvrirSelection);
    logo.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            ouvrirSelection();
        }
    });

    input.addEventListener("change", () => {
        const fichier = input.files?.[0];
        if (!fichier || !fichier.type.startsWith("image/")) return;

        const lecteur = new FileReader();
        lecteur.addEventListener("load", () => {
            localStorage.setItem(brandLogoStorageKey, lecteur.result);
            afficherLogo(lecteur.result);
            logo.appendChild(input);
        });
        lecteur.readAsDataURL(fichier);
    });
});
const profileAvatar = document.getElementById("profileAvatar");
const profilePhotoInput = document.getElementById("profilePhotoInput");
const userAvatar = document.getElementById("userAvatar");
const profilePhotoStorageKey = "darouSalamProfilePhoto";

function afficherPhotoProfil(photo) {
    [profileAvatar, userAvatar].forEach(avatar => {
        if (!avatar) return;

        avatar.innerHTML = photo
            ? `<img src="${photo}" alt="Photo de profil">`
            : '<i class="fa-solid fa-user"></i>';
    });
}

profileAvatar?.addEventListener("click", () => profilePhotoInput?.click());

profilePhotoInput?.addEventListener("change", () => {
    const fichier = profilePhotoInput.files?.[0];
    if (!fichier || !fichier.type.startsWith("image/")) return;

    const lecteur = new FileReader();
    lecteur.addEventListener("load", () => {
        const photo = lecteur.result;
        localStorage.setItem(profilePhotoStorageKey, photo);
        afficherPhotoProfil(photo);
    });
    lecteur.readAsDataURL(fichier);
});

afficherPhotoProfil(localStorage.getItem(profilePhotoStorageKey));
const companyFields = {
    name: document.getElementById("companyName"),
    phone: document.getElementById("companyPhone"),
    address: document.getElementById("companyAddress"),
    currency: document.getElementById("currencySelect")
};

const stockThresholdInput = document.getElementById("defaultMinStock");
const saveSettingsBtn = document.getElementById("saveSettingsBtn");
const saveStockAlertBtn = document.getElementById("saveStockAlertBtn");

function chargerParametres() {
    const settings = JSON.parse(localStorage.getItem("darouSalamSettings") || "{}");

    companyFields.name.value = settings.name || companyFields.name.value;
    companyFields.phone.value = settings.phone || "";
    companyFields.address.value = settings.address || "";
    companyFields.currency.value = settings.currency || companyFields.currency.value;
    stockThresholdInput.value = settings.minStock || stockThresholdInput.value;
}

function enregistrerParametres() {
    const settings = JSON.parse(localStorage.getItem("darouSalamSettings") || "{}");

    localStorage.setItem("darouSalamSettings", JSON.stringify({
        ...settings,
        name: companyFields.name.value.trim(),
        phone: companyFields.phone.value.trim(),
        address: companyFields.address.value.trim(),
        currency: companyFields.currency.value
    }));

    alert("Paramètres enregistrés avec succès.");
}

function enregistrerSeuilStock() {
    const minStock = Number(stockThresholdInput.value);

    if (!Number.isInteger(minStock) || minStock < 1) {
        alert("Le seuil doit être un nombre entier supérieur ou égal à 1.");
        return;
    }

    const settings = JSON.parse(localStorage.getItem("darouSalamSettings") || "{}");
    localStorage.setItem("darouSalamSettings", JSON.stringify({ ...settings, minStock }));
    alert("Seuil de stock mis à jour.");
}

document.addEventListener("DOMContentLoaded", () => {
    chargerParametres();
    saveSettingsBtn?.addEventListener("click", enregistrerParametres);
    saveStockAlertBtn?.addEventListener("click", enregistrerSeuilStock);
});

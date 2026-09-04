/* =========================================================
   DAROU SALAM BUSINESS
   GESTION DES FOURNISSEURS - SUPABASE
========================================================= */

console.log("🔥 FOURNISSEURS.JS SUPABASE CHARGÉ !");

const suppliersTable = document.getElementById("suppliersTable");
const addSupplierBtn = document.getElementById("addSupplierBtn");

let listeFournisseurs = [];

document.addEventListener("DOMContentLoaded", () => {
    chargerFournisseurs();

    if (addSupplierBtn) {
        addSupplierBtn.addEventListener("click", ajouterFournisseur);
    }
});

// ==========================================
// 1. CHARGER LES FOURNISSEURS
// ==========================================

async function chargerFournisseurs() {
    if (!suppliersTable) return;

    try {
        const { data, error } = await supabaseClient
            .from("fournisseurs")
            .select("id, nom, telephone, adresse, created_at")
            .order("nom", { ascending: true });

        if (error) throw error;

        listeFournisseurs = data || [];
        afficherFournisseurs(listeFournisseurs);

    } catch (err) {
        console.error("Erreur chargement fournisseurs :", err);
    }
}

// ==========================================
// 2. AFFICHER LES FOURNISSEURS
// ==========================================

function afficherFournisseurs(fournisseurs) {
    const tbody = suppliersTable.querySelector("tbody") || suppliersTable;
    tbody.innerHTML = "";

    if (fournisseurs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 20px; color: #888;">Aucun fournisseur enregistré.</td></tr>`;
        return;
    }

    fournisseurs.forEach(f => {
        tbody.innerHTML += `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                <td style="padding: 12px;"><strong>${f.nom}</strong></td>
                <td style="padding: 12px;">${f.telephone || "-"}</td>
                <td style="padding: 12px;">${f.adresse || "-"}</td>
                <td style="padding: 12px; text-align: right;">
                    <button onclick="supprimerFournisseur('${f.id}')" class="icon-btn" style="color: #ff6b6b;"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `;
    });
}

// ==========================================
// 3. AJOUTER UN FOURNISSEUR
// ==========================================

async function ajouterFournisseur() {
    const nom = prompt("Nom de l'entreprise ou du fournisseur :");
    if (!nom || !nom.trim()) return;

    const telephone = prompt("Téléphone :") || "";
    const adresse = prompt("Adresse / Référence :") || "";

    try {
        const { error } = await supabaseClient
            .from("fournisseurs")
            .insert([{
                nom: nom.trim(),
                telephone: telephone.trim(),
                adresse: adresse.trim()
            }]);

        if (error) throw error;

        alert("✅ Fournisseur enregistré !");
        chargerFournisseurs();

    } catch (err) {
        console.error("Erreur ajout fournisseur :", err);
        alert("❌ Erreur lors de l'enregistrement du fournisseur.");
    }
}

// ==========================================
// 4. SUPPRIMER UN FOURNISSEUR
// ==========================================

window.supprimerFournisseur = async function(id) {
    if (!confirm("Voulez-vous supprimer ce fournisseur ?")) return;

    try {
        const { error } = await supabaseClient
            .from("fournisseurs")
            .delete()
            .eq("id", id);

        if (error) throw error;

        chargerFournisseurs();

    } catch (err) {
        console.error("Erreur suppression fournisseur :", err);
        alert("❌ Impossible de supprimer ce fournisseur (des entrées de stock y sont peut-être liées).");
    }
};
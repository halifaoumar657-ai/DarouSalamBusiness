/* =========================================================
   DAROU SALAM BUSINESS
   GESTION DES CLIENTS - SUPABASE
========================================================= */

console.log("🔥 CLIENTS.JS SUPABASE CHARGÉ !");

const clientsTable = document.getElementById("clientsTable");
const addClientBtn = document.getElementById("addClientBtn");
const clientSearchInput = document.getElementById("clientSearchInput");

let listeClients = [];

document.addEventListener("DOMContentLoaded", () => {
    chargerClients();

    if (addClientBtn) {
        addClientBtn.addEventListener("click", ajouterClient);
    }

    if (clientSearchInput) {
        clientSearchInput.addEventListener("input", (e) => filtrerClients(e.target.value));
    }
});

// ==========================================
// 1. CHARGER LA LISTE DES CLIENTS
// ==========================================

async function chargerClients() {
    if (!clientsTable) return;

    try {
        const { data, error } = await supabaseClient
            .from("clients")
            .select("id, nom, telephone, adresse, created_at")
            .order("nom", { ascending: true });

        if (error) throw error;

        listeClients = data || [];
        afficherClients(listeClients);

    } catch (err) {
        console.error("Erreur chargement clients :", err);
    }
}

// ==========================================
// 2. AFFICHER LES CLIENTS
// ==========================================

function afficherClients(clients) {
    const tbody = clientsTable.querySelector("tbody") || clientsTable;
    tbody.innerHTML = "";

    if (clients.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 20px; color: #888;">Aucun client enregistré.</td></tr>`;
        return;
    }

    clients.forEach(c => {
        const dateAjout = new Date(c.created_at).toLocaleDateString("fr-FR");

        tbody.innerHTML += `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                <td style="padding: 12px;"><strong>${c.nom}</strong></td>
                <td style="padding: 12px;">${c.telephone || "-"}</td>
                <td style="padding: 12px;">${c.adresse || "-"}</td>
                <td style="padding: 12px; color: #888;">${dateAjout}</td>
            </tr>
        `;
    });
}

// ==========================================
// 3. AJOUTER UN CLIENT
// ==========================================

async function ajouterClient() {
    const nom = prompt("Nom complet du client :");
    if (!nom || !nom.trim()) return;

    const telephone = prompt("Téléphone :") || "";
    const adresse = prompt("Adresse / Ville :") || "";

    try {
        const { error } = await supabaseClient
            .from("clients")
            .insert([{
                nom: nom.trim(),
                telephone: telephone.trim(),
                adresse: adresse.trim()
            }]);

        if (error) throw error;

        alert("✅ Client ajouté avec succès !");
        chargerClients();

    } catch (err) {
        console.error("Erreur lors de l'ajout du client :", err);
        alert("❌ Impossible d'ajouter ce client.");
    }
}

// ==========================================
// 4. RECHERCHE EN TEMPS RÉEL
// ==========================================

function filtrerClients(terme) {
    const termFiltre = terme.toLowerCase().trim();
    const resultats = listeClients.filter(c => 
        c.nom.toLowerCase().includes(termFiltre) || 
        (c.telephone && c.telephone.includes(termFiltre))
    );
    afficherClients(resultats);
}
/* =========================================================
   DAROU SALAM BUSINESS
   ENTRÉES DE STOCK & APPROVISIONNEMENT - SUPABASE
========================================================= */

console.log("🔥 ENTREES.JS SUPABASE CHARGÉ !");

// Éléments DOM
const variantSelect = document.getElementById("variantSelect");
const supplierSelect = document.getElementById("supplierSelect");
const quantityInput = document.getElementById("entryQuantity");
const costPriceInput = document.getElementById("entryCostPrice");
const saveEntryBtn = document.getElementById("saveEntryBtn");
const entriesHistoryTable = document.getElementById("entriesHistoryTable");

let listeVariantes = [];

// ==========================================
// INITIALISATION
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    chargerVariantes();
    chargerFournisseurs();
    chargerHistoriqueEntrees();
    
    if (saveEntryBtn) {
        saveEntryBtn.addEventListener("click", enregistrerEntreeStock);
    }
});

// ==========================================
// 1. CHARGEMENT DES DONNÉES DE BASE
// ==========================================

async function chargerVariantes() {
    if (!variantSelect) return;

    try {
        const { data, error } = await supabaseClient
            .from("variantes")
            .select("id, nom, quantite_stock, produits(nom)")

        if (error) throw error;

        listeVariantes = data || [];
        variantSelect.innerHTML = `<option value="">Sélectionner un produit...</option>`;

        listeVariantes.forEach(v => {
            const nomComplet = v.produits?.nom ? `${v.produits.nom} - ${v.nom}` : v.nom;
            variantSelect.innerHTML += `<option value="${v.id}">${nomComplet} (En stock: ${v.quantite_stock})</option>`;
        });

    } catch (err) {
        console.error("Erreur chargement variantes :", err);
    }
}

async function chargerFournisseurs() {
    if (!supplierSelect) return;

    try {
        const { data, error } = await supabaseClient
            .from("fournisseurs")
            .select("id, nom")
            .order("nom", { ascending: true });

        if (error) throw error;

        supplierSelect.innerHTML = `<option value="">Sélectionner un fournisseur (Optionnel)...</option>`;
        (data || []).forEach(f => {
            supplierSelect.innerHTML += `<option value="${f.id}">${f.nom}</option>`;
        });

    } catch (err) {
        console.error("Erreur chargement fournisseurs :", err);
    }
}

// ==========================================
// 2. ENREGISTRER UNE ENTRÉE DE STOCK
// ==========================================

async function enregistrerEntreeStock() {
    const varianteId = variantSelect ? variantSelect.value : null;
    const fournisseurId = supplierSelect ? (supplierSelect.value || null) : null;
    const quantite = Number(quantityInput ? quantityInput.value : 0);
    const prixAchat = Number(costPriceInput ? costPriceInput.value : 0);

    if (!varianteId) {
        alert("Veuillez choisir un produit.");
        return;
    }

    if (isNaN(quantite) || quantite <= 0) {
        alert("Veuillez saisir une quantité valide.");
        return;
    }

    if (saveEntryBtn) saveEntryBtn.disabled = true;

    try {
        // 1. Récupérer le stock actuel et l'incrémenter
        const variante = listeVariantes.find(v => v.id === varianteId);
        const stockAvant = variante ? variante.quantite_stock : 0;
        const nouveauStock = stockAvant + quantite;

        const { error: errStock } = await supabaseClient
            .from("variantes")
            .update({ quantite_stock: nouveauStock })
            .eq("id", varianteId);

        if (errStock) throw errStock;

        alert("✅ Entrée de stock enregistrée avec succès !");

        // Réinitialisation des champs
        if (quantityInput) quantityInput.value = "";
        if (costPriceInput) costPriceInput.value = "";
        
        await chargerVariantes();
        await chargerHistoriqueEntrees();

    } catch (err) {
        console.error("Erreur enregistrement entrée stock :", err);
        alert("❌ Une erreur est survenue lors de la mise à jour du stock.");
    } finally {
        if (saveEntryBtn) saveEntryBtn.disabled = false;
    }
}

// ==========================================
// 3. HISTORIQUE DES ENTRÉES
// ==========================================

async function chargerHistoriqueEntrees() {
    if (!entriesHistoryTable) return;

    try {
        const { data, error } = await supabaseClient
            .from("mouvements_stock")
            .select("*")
            .limit(10);

        if (error) throw error;

        const tbody = entriesHistoryTable.querySelector("tbody") || entriesHistoryTable;
        tbody.innerHTML = "";

        if (!data || data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 15px; color:#888;">Aucun mouvement d'entrée enregistré.</td></tr>`;
            return;
        }

        data.forEach(m => {
            const nomProduit = m.variante_id || m.produit_id || m.produit || "Produit";
            const dateStr = new Date(m.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

            tbody.innerHTML += `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 10px;">${dateStr}</td>
                    <td style="padding: 10px;"><strong>${nomProduit}</strong></td>
                    <td style="padding: 10px; color: #4cd137;">+${m.quantite}</td>
                    <td style="padding: 10px;">-</td>
                    <td style="padding: 10px;">-</td>
                </tr>
            `;
        });

    } catch (err) {
        console.error("Erreur chargement historique :", err);
    }
}
/* =========================================================
   DAROU SALAM BUSINESS
   HISTORIQUE DES VENTES - SUPABASE
========================================================= */

console.log("🔥 HISTORIQUE.JS SUPABASE CHARGÉ !");

const salesHistoryTable = document.getElementById("salesHistoryTable");
const historySearchInput = document.getElementById("historySearchInput");
const dateFilterInput = document.getElementById("dateFilterInput");

let historiqueVentes = [];

document.addEventListener("DOMContentLoaded", () => {
    chargerHistorique();

    if (historySearchInput) {
        historySearchInput.addEventListener("input", filtrerHistorique);
    }
    if (dateFilterInput) {
        dateFilterInput.addEventListener("change", filtrerHistorique);
    }
});

// ==========================================
// 1. CHARGER L'HISTORIQUE
// ==========================================

async function chargerHistorique() {
    if (!salesHistoryTable) return;

    try {
        const { data, error } = await supabaseClient
            .from("ventes")
            .select(`
                id,
                total,
                mode_paiement,
                statut,
                created_at,
                clients ( nom ),
                vente_details (
                    quantite,
                    prix_unitaire,
                    sous_total,
                    variantes (
                        nom,
                        produits ( nom )
                    )
                )
            `)
            .order("created_at", { ascending: false });

        if (error) throw error;

        historiqueVentes = data || [];
        afficherHistorique(historiqueVentes);

    } catch (err) {
        console.error("Erreur lors du chargement de l'historique :", err);
    }
}

// ==========================================
// 2. AFFICHER L'HISTORIQUE
// ==========================================

function afficherHistorique(ventes) {
    const tbody = salesHistoryTable.querySelector("tbody") || salesHistoryTable;
    tbody.innerHTML = "";

    if (ventes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 20px; color: #888;">Aucune transaction trouvée.</td></tr>`;
        return;
    }

    ventes.forEach(v => {
        const clientNom = v.clients?.nom || "Client de passage";
        const dateFormatted = new Date(v.created_at).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
        const total = Number(v.total).toLocaleString("fr-FR");

        tbody.innerHTML += `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                <td style="padding: 12px;">${dateFormatted}</td>
                <td style="padding: 12px;"><strong>${clientNom}</strong></td>
                <td style="padding: 12px;">${v.mode_paiement || "-"}</td>
                <td style="padding: 12px; color: var(--gold, #d4af37); font-weight: bold;">${total} FCFA</td>
                <td style="padding: 12px;"><span class="badge" style="background: rgba(76, 209, 55, 0.2); color: #4cd137; padding: 4px 8px; border-radius: 4px;">${v.statut || "Payé"}</span></td>
                <td style="padding: 12px; text-align: right;">
                    <button onclick="voirDetailsVente('${v.id}')" class="icon-btn" title="Détails"><i class="fa-solid fa-eye"></i></button>
                </td>
            </tr>
        `;
    });
}

// ==========================================
// 3. RECHERCHE & FILTRES
// ==========================================

function filtrerHistorique() {
    const terme = historySearchInput ? historySearchInput.value.toLowerCase().trim() : "";
    const dateSelectionnee = dateFilterInput ? dateFilterInput.value : "";

    const resultats = historiqueVentes.filter(v => {
        const clientNom = (v.clients?.nom || "client de passage").toLowerCase();
        const correspondTerme = clientNom.includes(terme);

        let correspondDate = true;
        if (dateSelectionnee) {
            const dateVente = new Date(v.created_at).toISOString().split("T")[0];
            correspondDate = dateVente === dateSelectionnee;
        }

        return correspondTerme && correspondDate;
    });

    afficherHistorique(resultats);
}

// ==========================================
// 4. DÉTAILS D'UNE VENTE
// ==========================================

window.voirDetailsVente = function(venteId) {
    const vente = historiqueVentes.find(v => v.id === venteId);
    if (!vente) return;

    let detailsStr = `Détails de la vente (${new Date(vente.created_at).toLocaleDateString("fr-FR")}) :\n\n`;
    
    vente.vente_details.forEach(l => {
        const nomArticle = l.variantes?.produits?.nom ? `${l.variantes.produits.nom} (${l.variantes.nom})` : (l.variantes?.nom || "Article");
        detailsStr += `- ${nomArticle} x${l.quantite} : ${Number(l.sous_total).toLocaleString("fr-FR")} FCFA\n`;
    });

    detailsStr += `\nTotal : ${Number(vente.total).toLocaleString("fr-FR")} FCFA`;
    detailsStr += `\nPaiement : ${vente.mode_paiement || "-"}`;

    alert(detailsStr);
};
/* =========================================================
   DAROU SALAM BUSINESS
   RAPPORTS & STATISTIQUES - SUPABASE
========================================================= */

console.log("🔥 RAPPORTS.JS SUPABASE CHARGÉ !");

const reportTotalSales = document.getElementById("reportTotalSales");
const reportTotalTransactions = document.getElementById("reportTotalTransactions");
const reportTopProduct = document.getElementById("reportTopProduct");

document.addEventListener("DOMContentLoaded", () => {
    genererRapportMois();
});

// ==========================================
// SYNTHÈSE DU MOIS EN COURS
// ==========================================

async function genererRapportMois() {
    try {
        const debutMois = new Date();
        debutMois.setDate(1);
        debutMois.setHours(0, 0, 0, 0);

        // 1. Récupérer les ventes du mois
        const { data: ventes, error: errVentes } = await supabaseClient
            .from("ventes")
            .select("id, total")
            .gte("created_at", debutMois.toISOString());

        if (errVentes) throw errVentes;

        const totalCA = ventes ? ventes.reduce((acc, v) => acc + Number(v.total || 0), 0) : 0;
        const totalNb = ventes ? ventes.length : 0;

        if (reportTotalSales) reportTotalSales.textContent = `${totalCA.toLocaleString("fr-FR")} FCFA`;
        if (reportTotalTransactions) reportTotalTransactions.textContent = totalNb;

        // 2. Produit le plus vendu
        const { data: lignes, error: errLignes } = await supabaseClient
            .from("vente_details")
            .select(`
                quantite,
                variantes (
                    nom,
                    produits ( nom )
                )
            `);

        if (errLignes) throw errLignes;

        if (lignes && lignes.length > 0) {
            const cumulProduits = {};
            lignes.forEach(l => {
                const nom = l.variantes?.produits?.nom ? `${l.variantes.produits.nom} - ${l.variantes.nom}` : (l.variantes?.nom || "Inconnu");
                cumulProduits[nom] = (cumulProduits[nom] || 0) + l.quantite;
            });

            const topArticle = Object.keys(cumulProduits).reduce((a, b) => cumulProduits[a] > cumulProduits[b] ? a : b);
            if (reportTopProduct) reportTopProduct.textContent = `${topArticle} (${cumulProduits[topArticle]} vendus)`;
        } else {
            if (reportTopProduct) reportTopProduct.textContent = "-";
        }

    } catch (err) {
        console.error("Erreur lors de la génération du rapport :", err);
    }
}
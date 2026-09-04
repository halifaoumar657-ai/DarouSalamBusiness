/* =========================================================
   DAROU SALAM BUSINESS
   TABLEAU DE BORD - SUPABASE
========================================================= */

console.log("🔥 DASHBOARD.JS SUPABASE CHARGÉ !");

// Éléments DOM - Cartes KPI
const kpiTotalProduits = document.getElementById("totalProducts");
const kpiStockFaible = document.getElementById("lowStock");
const kpiVentesAujourdhui = document.getElementById("todaySales");
const kpiChiffreAffaires = document.getElementById("todayRevenue");
const dashboardSearch = document.getElementById("dashboardSearch");

// Éléments DOM - Conteneurs de listes
const conteneurVentesRecentes = document.getElementById("ventesRecentes");
const conteneurStockFaible = document.getElementById("listeStockFaible");

// ==========================================
// INITIALISATION & SÉCURITÉ
// ==========================================

document.addEventListener("DOMContentLoaded", async () => {
    const estConnecte = await verifierAuthentification();
    if (!estConnecte) return;

    initialiserDeconnexion();
    initialiserNavigationDashboard();
    initialiserRechercheDashboard();
    ecouterChangementsAuth();
    chargerTableauDeBord();
});

function initialiserRechercheDashboard() {
    dashboardSearch?.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") return;

        const terme = dashboardSearch.value.trim();
        const destination = terme
            ? `pages/produits.html?recherche=${encodeURIComponent(terme)}`
            : "pages/produits.html";

        window.location.href = destination;
    });
}

function initialiserNavigationDashboard() {
    document.getElementById("newSaleBtn")?.addEventListener("click", () => {
        window.location.href = "pages/ventes.html";
    });

    document.getElementById("viewSalesBtn")?.addEventListener("click", () => {
        window.location.href = "pages/historique.html";
    });

    document.getElementById("viewStockBtn")?.addEventListener("click", () => {
        window.location.href = "pages/stock.html";
    });
}

async function verifierAuthentification() {
    if (typeof supabaseClient === "undefined") {
        console.error("Supabase n'est pas configuré.");
        window.location.href = "login.html";
        return false;
    }

    const { data: { session }, error } = await supabaseClient.auth.getSession();

    if (error || !session) {
        window.location.href = "login.html";
        return false;
    }

    return true;
}

// ==========================================
// GESTION DE LA DÉCONNEXION
// ==========================================

function initialiserDeconnexion() {
    const logoutBtn = document.getElementById("logoutBtn");

    if (logoutBtn) {
        logoutBtn.addEventListener("click", async (e) => {
            e.preventDefault();

            try {
                if (typeof supabaseClient !== "undefined" && supabaseClient.auth) {
                    await supabaseClient.auth.signOut();
                }

                localStorage.clear();
                sessionStorage.clear();
                window.location.href = "login.html";
            } catch (err) {
                console.error("Erreur lors de la déconnexion :", err);
                window.location.href = "login.html";
            }
        });
    }
}

function ecouterChangementsAuth() {
    if (typeof supabaseClient !== "undefined" && supabaseClient.auth) {
        supabaseClient.auth.onAuthStateChange((event) => {
            if (event === "SIGNED_OUT") {
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = "login.html";
            }
        });
    }
}

// ==========================================
// CHARGEMENT DU DASHBOARD
// ==========================================

async function chargerTableauDeBord() {
    await Promise.all([
        chargerKPIs(),
        chargerVentesRecentes(),
        chargerProduitsStockFaible()
    ]);
}

async function chargerKPIs() {
    try {
        const aujourdhuiDebut = new Date();
        aujourdhuiDebut.setHours(0, 0, 0, 0);

        const { count: totalProduits, error: errProd } = await supabaseClient
            .from("variantes")
            .select("id", { count: "exact", head: true });

        if (errProd) throw errProd;

        const { data: produitsAlerte, error: errStock } = await supabaseClient
            .from("variantes")
            .select("id, quantite_stock");

        if (errStock) throw errStock;

        const nbStockFaible = (produitsAlerte || []).filter(p => p.quantite_stock <= 5).length;

        const { data: ventesDuJour, error: errVentes } = await supabaseClient
            .from("ventes")
            .select("total")
            .gte("created_at", aujourdhuiDebut.toISOString());

        if (errVentes) throw errVentes;

        const totalVentesDuJour = ventesDuJour ? ventesDuJour.length : 0;
        const caDuJour = ventesDuJour ? ventesDuJour.reduce((acc, v) => acc + Number(v.total || 0), 0) : 0;

        mettreAJourKPI(kpiTotalProduits, totalProduits || 0);
        mettreAJourKPI(kpiStockFaible, nbStockFaible);
        mettreAJourKPI(kpiVentesAujourdhui, totalVentesDuJour);
        mettreAJourKPI(kpiChiffreAffaires, `${caDuJour.toLocaleString("fr-FR")} FCFA`);

    } catch (err) {
        console.error("Erreur lors du calcul des KPIs :", err);
    }
}

function mettreAJourKPI(element, valeur) {
    if (element) element.textContent = valeur;
}

async function chargerVentesRecentes() {
    if (!conteneurVentesRecentes) return;

    try {
        const { data: ventes, error } = await supabaseClient
            .from("ventes")
            .select(`
                id,
                total,
                created_at,
                clients ( nom )
            `)
            .order("created_at", { ascending: false })
            .limit(5);

        if (error) throw error;

        const zoneListe = conteneurVentesRecentes.querySelector(".card-body") || conteneurVentesRecentes;

        if (!ventes || ventes.length === 0) {
            zoneListe.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon"><i class="fa-solid fa-receipt"></i></div>
                    <p>Aucune vente enregistrée pour le moment.</p>
                </div>
            `;
            return;
        }

        let html = '<div class="recent-list">';
        ventes.forEach(v => {
            const clientNom = v.clients?.nom || "Client de passage";
            const dateHeure = new Date(v.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
            const montant = Number(v.total).toLocaleString("fr-FR");

            html += `
                <div class="recent-item" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <div>
                        <strong>${clientNom}</strong>
                        <div style="font-size: 0.8rem; color: #888;">Aujourd'hui à ${dateHeure}</div>
                    </div>
                    <div style="font-weight: bold; color: var(--gold, #d4af37);">
                        ${montant} FCFA
                    </div>
                </div>
            `;
        });
        html += '</div>';

        zoneListe.innerHTML = html;

    } catch (err) {
        console.error("Erreur lors du chargement des ventes récentes :", err);
    }
}

async function chargerProduitsStockFaible() {
    if (!conteneurStockFaible) return;

    try {
        const { data: produits, error } = await supabaseClient
            .from("variantes")
            .select(`
                id,
                nom,
                quantite_stock,
                produits ( nom )
            `)
            .order("quantite_stock", { ascending: true });

        if (error) throw error;

        const alerteProduits = (produits || []).filter(p => p.quantite_stock <= 5).slice(0, 5);
        const zoneListe = conteneurStockFaible.querySelector(".card-body") || conteneurStockFaible;

        if (alerteProduits.length === 0) {
            zoneListe.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon"><i class="fa-solid fa-box-open"></i></div>
                    <p>Aucun produit en alerte de stock.</p>
                </div>
            `;
            return;
        }

        let html = '<div class="recent-list">';
        alerteProduits.forEach(p => {
            const nomComplet = p.produits?.nom ? `${p.produits.nom} (${p.nom})` : p.nom;

            html += `
                <div class="recent-item" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <div>
                        <strong>${nomComplet}</strong>
                        <div style="font-size: 0.8rem; color: #ff6b6b;">Seuil min : 5</div>
                    </div>
                    <div>
                        <span class="badge" style="background: rgba(255,107,107,0.2); color: #ff6b6b; padding: 4px 8px; border-radius: 4px; font-weight: bold;">
                            Reste : ${p.quantite_stock}
                        </span>
                    </div>
                </div>
            `;
        });
        html += '</div>';

        zoneListe.innerHTML = html;

    } catch (err) {
        console.error("Erreur lors du chargement des alertes stock :", err);
    }
}
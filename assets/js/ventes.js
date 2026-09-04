/* =========================================================
   DAROU SALAM BUSINESS
   GESTION DES VENTES / CAISSE - SUPABASE
========================================================= */

console.log("🔥 VENTES.JS CHARGÉ !");

// Éléments du DOM
const productSearchInput = document.getElementById("searchProductSale");
const searchResultsContainer = document.getElementById("saleSearchResults");
const cartItemsContainer = document.getElementById("cartItems");
const totalAmountElement = document.getElementById("totalAmount");
const clientSelect = document.getElementById("clientSelect");
const paymentMethodSelect = document.getElementById("paymentMethod");
const checkoutBtn = document.getElementById("checkoutBtn");

// État local
let panier = [];
let produitsDisponibles = [];

// ==========================================
// INITIALISATION
// ==========================================

document.addEventListener("DOMContentLoaded", async () => {
    await chargerProduitsVente();
    await chargerClients();
    initialiserEvenements();
});

// ==========================================
// 1. CHARGEMENT DES PRODUITS
// ==========================================

async function chargerProduitsVente() {
    try {
        const { data, error } = await supabaseClient
            .from("variantes")
            .select("id, nom, prix_achat, prix_vente, quantite_stock")
            .gt("quantite_stock", 0);

        if (error) throw error;
        
        produitsDisponibles = data || [];
        console.log("📦 Produits chargés :", produitsDisponibles.length);

    } catch (err) {
        console.error("Erreur lors de la récupération des produits :", err);
    }
}

// ==========================================
// 2. CHARGEMENT DES CLIENTS
// ==========================================

async function chargerClients() {
    if (!clientSelect) return;

    try {
        const { data, error } = await supabaseClient
            .from("clients")
            .select("id, nom")
            .order("nom", { ascending: true });

        if (error) throw error;

        clientSelect.innerHTML = `<option value="">Client de passage</option>`;
        (data || []).forEach(c => {
            clientSelect.innerHTML += `<option value="${c.id}">${c.nom}</option>`;
        });

    } catch (err) {
        console.error("Erreur lors du chargement des clients :", err);
    }
}

// ==========================================
// 3. RECHERCHE ET SELECTION
// ==========================================

function rechercherProduits(terme) {
    if (!searchResultsContainer) return;

    const recherche = terme.toLowerCase().trim();

    if (!recherche) {
        searchResultsContainer.innerHTML = "";
        searchResultsContainer.style.display = "none";
        return;
    }

    const resultats = produitsDisponibles.filter(p => 
        (p.nom || "").toLowerCase().includes(recherche)
    );

    if (resultats.length === 0) {
        searchResultsContainer.innerHTML = `
            <div style="padding: 12px; color: #888; text-align: center;">
                Aucun produit trouvé
            </div>
        `;
    } else {
        searchResultsContainer.innerHTML = resultats.map(p => `
            <div onclick="ajouterAuPanier('${p.id}')" 
                 style="padding: 12px; cursor: pointer; border-bottom: 1px solid #333; display: flex; justify-content: space-between; align-items: center; transition: background 0.2s;"
                 onmouseover="this.style.background='#2a2a2a'" 
                 onmouseout="this.style.background='transparent'">
                <div>
                    <strong style="color: #fff; display: block;">${p.nom}</strong>
                    <span style="font-size: 0.8rem; color: #aaa;">Stock : ${p.quantite_stock}</span>
                </div>
                <span style="color: #d4af37; font-weight: bold;">
                    ${Number(p.prix_vente).toLocaleString("fr-FR")} FCFA
                </span>
            </div>
        `).join("");
    }

    searchResultsContainer.style.display = "block";
}

window.ajouterAuPanier = function(varianteId) {
    const produit = produitsDisponibles.find(p => String(p.id) === String(varianteId));
    if (!produit) return;

    const ligneExistante = panier.find(item => String(item.id) === String(varianteId));

    if (ligneExistante) {
        if (ligneExistante.quantite + 1 > produit.quantite_stock) {
            alert(`Stock insuffisant. Maximum disponible : ${produit.quantite_stock}`);
            return;
        }
        ligneExistante.quantite++;
    } else {
        panier.push({
            id: produit.id,
            nom: produit.nom,
            prix: Number(produit.prix_vente),
            prixAchat: Number(produit.prix_achat || 0),
            quantite: 1,
            stockMax: produit.quantite_stock
        });
    }

    if (productSearchInput) productSearchInput.value = "";
    if (searchResultsContainer) searchResultsContainer.style.display = "none";

    afficherPanier();
};

// ==========================================
// 4. GESTION DU PANIER
// ==========================================

function afficherPanier() {
    if (!cartItemsContainer) return;

    if (panier.length === 0) {
        cartItemsContainer.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #666;">
                Panier vide
            </div>
        `;
        if (totalAmountElement) totalAmountElement.textContent = "0 FCFA";
        return;
    }

    let total = 0;
    cartItemsContainer.innerHTML = panier.map((item, index) => {
        const sousTotal = item.prix * item.quantite;
        total += sousTotal;

        return `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #2a2a2a;">
                <div style="flex: 1;">
                    <strong style="color: #fff; font-size: 0.95rem; display: block;">${item.nom}</strong>
                    <span style="font-size: 0.8rem; color: #888;">
                        ${item.prix.toLocaleString("fr-FR")} FCFA x ${item.quantite}
                    </span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px;">
                    <button onclick="modifierQuantite(${index}, -1)" style="background: #333; color: #fff; border: none; padding: 3px 8px; border-radius: 4px; cursor: pointer;">-</button>
                    <span style="color: #fff; font-weight: bold; min-width: 18px; text-align: center;">${item.quantite}</span>
                    <button onclick="modifierQuantite(${index}, 1)" style="background: #333; color: #fff; border: none; padding: 3px 8px; border-radius: 4px; cursor: pointer;">+</button>
                    <button onclick="supprimerDuPanier(${index})" style="background: transparent; color: #ff6b6b; border: none; padding: 3px 6px; cursor: pointer; margin-left: 4px;">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join("");

    if (totalAmountElement) {
        totalAmountElement.textContent = `${total.toLocaleString("fr-FR")} FCFA`;
    }
}

window.modifierQuantite = function(index, delta) {
    const item = panier[index];
    const nouvelleQte = item.quantite + delta;

    if (nouvelleQte <= 0) {
        supprimerDuPanier(index);
        return;
    }

    if (nouvelleQte > item.stockMax) {
        alert(`Stock maximum atteint (${item.stockMax})`);
        return;
    }

    item.quantite = nouvelleQte;
    afficherPanier();
};

window.supprimerDuPanier = function(index) {
    panier.splice(index, 1);
    afficherPanier();
};

// ==========================================
// 5. VALIDATION DE LA VENTE
// ==========================================

async function validerVente() {
    if (panier.length === 0) {
        alert("Veuillez ajouter au moins un produit au panier.");
        return;
    }

    const totalCalculated = panier.reduce((acc, item) => acc + (item.prix * item.quantite), 0);
    
    // Évite l'erreur UUID sur client_id si aucun client sélectionné
    const rawClientId = clientSelect ? clientSelect.value : null;
    const clientId = (rawClientId && rawClientId.trim() !== "") ? rawClientId : null;
    
    const modePaiement = paymentMethodSelect ? paymentMethodSelect.value : "Espèces";

    if (checkoutBtn) checkoutBtn.disabled = true;

    try {
        // 1. Enregistrement de la vente
        const { data: vente, error: errVente } = await supabaseClient
            .from("ventes")
            .insert([{
                client_id: clientId,
                total: totalCalculated,
                mode_paiement: modePaiement,
                statut: "Payé"
            }])
            .select()
            .single();

        if (errVente) throw errVente;

        // 2. Préparation des lignes de détails (inclut produit_id ET variante_id)
        const lignes = panier.map(item => ({
            vente_id: vente.id,
            produit_id: item.id,
            variante_id: item.id,
            quantite: item.quantite,
            prix_unitaire: item.prix
        }));

        const { error: errLignes } = await supabaseClient
            .from("vente_details")
            .insert(lignes);

        if (errLignes) throw errLignes;

        // 3. Mise à jour du stock
        for (const item of panier) {
            const produitOriginal = produitsDisponibles.find(p => String(p.id) === String(item.id));
            if (produitOriginal) {
                const nouveauStock = produitOriginal.quantite_stock - item.quantite;

                await supabaseClient
                    .from("variantes")
                    .update({ quantite_stock: nouveauStock })
                    .eq("id", item.id);
            }
        }

        alert("✅ Vente enregistrée avec succès !");

        // Réinitialisation
        panier = [];
        afficherPanier();
        await chargerProduitsVente();

    } catch (err) {
        console.error("Erreur Supabase :", err);
        const msg = err.message || err.details || JSON.stringify(err);
        alert("❌ Erreur : " + msg);
    } finally {
        if (checkoutBtn) checkoutBtn.disabled = false;
    }
}

// ==========================================
// 6. ÉVÉNEMENTS
// ==========================================

function initialiserEvenements() {
    if (productSearchInput) {
        productSearchInput.addEventListener("input", (e) => rechercherProduits(e.target.value));
    }

    if (checkoutBtn) {
        checkoutBtn.addEventListener("click", validerVente);
    }

    document.addEventListener("click", (e) => {
        if (searchResultsContainer && !productSearchInput.contains(e.target) && !searchResultsContainer.contains(e.target)) {
            searchResultsContainer.style.display = "none";
        }
    });
}
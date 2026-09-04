// ==========================================
// DAROU SALAM BUSINESS
// GESTION DES PRODUITS - SUPABASE
// ==========================================

console.log("🔥 PRODUITS.JS EST BIEN CHARGÉ !");

// ==========================================
// DONNÉES
// ==========================================

let produits = [];

// ==========================================
// ÉLÉMENTS HTML
// ==========================================

const productsGrid = document.getElementById("productsGrid");
const addProductBtn = document.getElementById("addProductBtn");
const productSearch = document.getElementById("productSearch");
const productHeaderSearch = document.getElementById("productHeaderSearch");
const productCount = document.getElementById("productCount");
const productForm = document.getElementById("productForm");
const productModal = document.getElementById("productModal");
const closeProductModal = document.getElementById("closeProductModal");
const cancelProductBtn = document.getElementById("cancelProductBtn");

// ==========================================
// AFFICHER LES PRODUITS
// ==========================================

function afficherProduits() {
    if (!productsGrid) return;

    if (productCount) {
        productCount.textContent = `${produits.length} produit${produits.length > 1 ? "s" : ""}`;
    }

    productsGrid.innerHTML = "";

    if (produits.length === 0) {
        productsGrid.innerHTML = `
            <div class="products-empty">
                <div class="empty-icon">
                    <i class="fa-solid fa-box-open"></i>
                </div>
                <h4>Aucun produit</h4>
                <p>Commencez par ajouter votre premier produit.</p>
                <button class="primary-btn" id="emptyAddProductBtn">
                    <i class="fa-solid fa-plus"></i> Ajouter un produit
                </button>
            </div>
        `;

        document.getElementById("emptyAddProductBtn")?.addEventListener("click", () => {
            productModal?.classList.add("active");
        });

        return;
    }

    produits.forEach((produit) => {
        const card = document.createElement("div");
        card.className = "product-card";

        card.innerHTML = `
            <div class="product-card-content">
                <div class="product-icon">
                    <i class="fa-solid fa-box"></i>
                </div>
                <div class="product-info">
                    <h4>${produit.nom}</h4>
                    <span>${produit.categorie || "Sans catégorie"}</span>
                    <p>Prix : ${produit.prixVente.toLocaleString("fr-FR")} FCFA</p>
                    <p>Stock : ${produit.stock}</p>
                </div>
            </div>
            <div class="product-actions">
                <button class="icon-btn edit-product" data-id="${produit.id}" title="Modifier">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="icon-btn delete-product" data-id="${produit.id}" title="Supprimer">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;

        productsGrid.appendChild(card);
    });

    ajouterEvenementsProduits();
}

// ==========================================
// CHARGER LES PRODUITS
// ==========================================

async function chargerProduits() {
    try {
        const { data, error } = await supabaseClient
            .from("variantes")
            .select("id, nom, prix_vente, quantite_stock, produit_id, produits(nom)")
            .order("created_at", { ascending: false });

        if (error) throw error;

        produits = (data || []).map(variante => ({
            id: variante.id,
            produitId: variante.produit_id,
            nom: variante.produits?.nom || variante.nom,
            categorie: "Sans catégorie",
            prixVente: Number(variante.prix_vente || 0),
            stock: Number(variante.quantite_stock || 0)
        }));

        afficherProduits();

        const rechercheUrl = new URLSearchParams(window.location.search).get("recherche");
        if (rechercheUrl) {
            if (productSearch) productSearch.value = rechercheUrl;
            if (productHeaderSearch) productHeaderSearch.value = rechercheUrl;
            rechercherProduits();
        }
    } catch (error) {
        console.error("Erreur lors du chargement des produits :", error);
    }
}

// ==========================================
// AJOUTER UN PRODUIT
// ==========================================

async function ajouterProduit(event) {
    event?.preventDefault();

    // Récupération des données selon les IDs ou la structure du formulaire
    const nom = (document.getElementById("productName")?.value || document.querySelector("input[placeholder*='boucle']")?.value || "").trim();
    const description = (document.getElementById("productDescription")?.value || "").trim() || null;
    
    // Récupération souple des champs numériques
    const prixAchatInput = document.getElementById("productPurchasePrice")?.value || document.querySelectorAll("input[type='number']")[0]?.value;
    const prixVenteInput = document.getElementById("productSalePrice")?.value || document.querySelectorAll("input[type='number']")[1]?.value;
    const stockInput = document.getElementById("productStock")?.value || document.querySelectorAll("input[type='number']")[2]?.value;

    const prixAchat = Number(prixAchatInput);
    const prixVente = Number(prixVenteInput);
    const stock = Number(stockInput);

    if (!nom || isNaN(prixAchat) || isNaN(prixVente) || isNaN(stock)) {
        alert("Veuillez remplir correctement tous les champs requis.");
        return;
    }

    try {
        // 1. Insertion dans la table 'produits' avec 'prix_vente' inclus pour satisfaire la contrainte Supabase
        const { data: produit, error: produitError } = await supabaseClient
            .from("produits")
            .insert([{ 
                nom, 
                description,
                prix_vente: prixVente 
            }])
            .select("id")
            .single();

        if (produitError) throw produitError;

        // 2. Insertion de la variante associée
        const { error: varianteError } = await supabaseClient
            .from("variantes")
            .insert([{
                produit_id: produit.id,
                nom: nom,
                prix_achat: prixAchat,
                prix_vente: prixVente,
                quantite_stock: stock
            }]);

        if (varianteError) throw varianteError;

        // Reinitialisation du formulaire et fermeture de la modale
        productForm?.reset();
        productModal?.classList.remove("active");
        
        await chargerProduits();
        alert("Produit ajouté avec succès !");
    } catch (error) {
        console.error("Erreur lors de l'ajout du produit :", error);
        alert(`Impossible d'ajouter le produit : ${error.message || "erreur inconnue"}`);
    }
}

// ==========================================
// SUPPRIMER
// ==========================================

async function supprimerProduit(id) {
    const produit = produits.find(p => p.id === id);
    if (!produit) return;

    if (!confirm(`Voulez-vous supprimer "${produit.nom}" ?`)) return;

    try {
        const { error } = await supabaseClient
            .from("variantes")
            .delete()
            .eq("id", id);

        if (error) throw error;

        await chargerProduits();
    } catch (error) {
        console.error("Erreur lors de la suppression :", error);
        alert(`Erreur de suppression : ${error.message}`);
    }
}

// ==========================================
// MODIFIER
// ==========================================

async function modifierProduit(id) {
    const produit = produits.find(p => p.id === id);
    if (!produit) return;

    const nouveauNom = prompt("Nom du produit :", produit.nom);
    if (!nouveauNom || !nouveauNom.trim()) return;

    const nouveauPrix = Number(prompt("Prix de vente :", produit.prixVente));
    if (isNaN(nouveauPrix) || nouveauPrix < 0) {
        alert("Prix invalide.");
        return;
    }

    const nouveauStock = Number(prompt("Stock :", produit.stock));
    if (isNaN(nouveauStock) || nouveauStock < 0) {
        alert("Stock invalide.");
        return;
    }

    try {
        const { error } = await supabaseClient
            .from("variantes")
            .update({
                nom: nouveauNom.trim(),
                prix_vente: nouveauPrix,
                quantite_stock: nouveauStock
            })
            .eq("id", id);

        if (error) throw error;

        await chargerProduits();
    } catch (error) {
        console.error("Erreur lors de la modification :", error);
        alert(`Erreur de modification : ${error.message}`);
    }
}

// ==========================================
// ÉVÉNEMENTS
// ==========================================

function ajouterEvenementsProduits() {
    document.querySelectorAll(".delete-product").forEach(button => {
        button.addEventListener("click", () => {
            supprimerProduit(button.dataset.id);
        });
    });

    document.querySelectorAll(".edit-product").forEach(button => {
        button.addEventListener("click", () => {
            modifierProduit(button.dataset.id);
        });
    });
}

function rechercherProduits() {
    const recherche = productSearch.value.toLowerCase().trim();
    const cartes = document.querySelectorAll(".product-card");

    cartes.forEach((carte, index) => {
        const produit = produits[index];
        if (!produit) return;

        const correspond = produit.nom.toLowerCase().includes(recherche) ||
                           produit.categorie.toLowerCase().includes(recherche);

        carte.style.display = correspond ? "" : "none";
    });
}

// Écouteurs globaux
addProductBtn?.addEventListener("click", () => productModal?.classList.add("active"));
closeProductModal?.addEventListener("click", () => productModal?.classList.remove("active"));
cancelProductBtn?.addEventListener("click", () => productModal?.classList.remove("active"));
productForm?.addEventListener("submit", ajouterProduit);

if (productSearch) {
    productSearch.addEventListener("input", rechercherProduits);
}

if (productHeaderSearch) {
    productHeaderSearch.addEventListener("input", () => {
        if (productSearch) productSearch.value = productHeaderSearch.value;
        rechercherProduits();
    });
}

// Initialisation
chargerProduits();
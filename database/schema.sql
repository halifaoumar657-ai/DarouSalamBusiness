-- ============================================================
-- DAROU SALAM BUSINESS
-- BASE DE DONNÉES - VERSION 1
-- ============================================================


-- ============================================================
-- 1. CATEGORIES
-- ============================================================

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    nom TEXT NOT NULL,

    description TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 2. PRODUITS
-- ============================================================

CREATE TABLE produits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    nom TEXT NOT NULL,

    categorie_id UUID
        REFERENCES categories(id)
        ON DELETE SET NULL,

    description TEXT,

    image_url TEXT,

    actif BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 3. VARIANTES
-- ============================================================

CREATE TABLE variantes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    produit_id UUID NOT NULL
        REFERENCES produits(id)
        ON DELETE CASCADE,

    nom TEXT NOT NULL,

    couleur TEXT,

    taille TEXT,

    modele TEXT,

    code_produit TEXT UNIQUE,

    prix_achat NUMERIC(12,2)
        NOT NULL DEFAULT 0
        CHECK (prix_achat >= 0),

    prix_vente NUMERIC(12,2)
        NOT NULL DEFAULT 0
        CHECK (prix_vente >= 0),

    quantite_stock INTEGER
        NOT NULL DEFAULT 0
        CHECK (quantite_stock >= 0),

    stock_minimum INTEGER
        NOT NULL DEFAULT 0
        CHECK (stock_minimum >= 0),

    actif BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 4. FOURNISSEURS
-- ============================================================

CREATE TABLE fournisseurs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    nom TEXT NOT NULL,

    telephone TEXT,

    email TEXT,

    adresse TEXT,

    notes TEXT,

    actif BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 5. CLIENTS
-- ============================================================

CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    nom TEXT NOT NULL,

    telephone TEXT,

    email TEXT,

    adresse TEXT,

    notes TEXT,

    actif BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 6. UTILISATEURS
-- ============================================================

CREATE TABLE utilisateurs (
    id UUID PRIMARY KEY,

    nom TEXT NOT NULL,

    telephone TEXT,

    role TEXT NOT NULL DEFAULT 'vendeuse'
        CHECK (
            role IN (
                'administrateur',
                'vendeuse'
            )
        ),

    actif BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 7. ENTREES DE STOCK
-- ============================================================

CREATE TABLE entrees_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    fournisseur_id UUID
        REFERENCES fournisseurs(id)
        ON DELETE SET NULL,

    reference TEXT UNIQUE,

    date_entree TIMESTAMPTZ DEFAULT NOW(),

    montant_total NUMERIC(12,2)
        DEFAULT 0
        CHECK (montant_total >= 0),

    note TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 8. DETAILS DES ENTREES
-- ============================================================

CREATE TABLE details_entree (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    entree_id UUID NOT NULL
        REFERENCES entrees_stock(id)
        ON DELETE CASCADE,

    variante_id UUID NOT NULL
        REFERENCES variantes(id)
        ON DELETE RESTRICT,

    quantite INTEGER NOT NULL
        CHECK (quantite > 0),

    prix_achat_unitaire NUMERIC(12,2)
        NOT NULL
        CHECK (prix_achat_unitaire >= 0),

    sous_total NUMERIC(12,2)
        GENERATED ALWAYS AS (
            quantite * prix_achat_unitaire
        ) STORED
);


-- ============================================================
-- 9. VENTES
-- ============================================================

CREATE TABLE ventes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    client_id UUID
        REFERENCES clients(id)
        ON DELETE SET NULL,

    utilisateur_id UUID
        REFERENCES utilisateurs(id)
        ON DELETE SET NULL,

    reference TEXT UNIQUE NOT NULL,

    canal_vente TEXT NOT NULL
        CHECK (
            canal_vente IN (
                'boutique',
                'whatsapp'
            )
        ),

    montant_total NUMERIC(12,2)
        DEFAULT 0
        CHECK (montant_total >= 0),

    montant_remise NUMERIC(12,2)
        DEFAULT 0
        CHECK (montant_remise >= 0),

    statut TEXT NOT NULL DEFAULT 'terminee'
        CHECK (
            statut IN (
                'terminee',
                'annulee'
            )
        ),

    note TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 10. DETAILS DES VENTES
-- ============================================================

CREATE TABLE details_vente (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    vente_id UUID NOT NULL
        REFERENCES ventes(id)
        ON DELETE CASCADE,

    variante_id UUID NOT NULL
        REFERENCES variantes(id)
        ON DELETE RESTRICT,

    quantite INTEGER NOT NULL
        CHECK (quantite > 0),

    prix_unitaire NUMERIC(12,2)
        NOT NULL
        CHECK (prix_unitaire >= 0),

    prix_achat_unitaire NUMERIC(12,2)
        NOT NULL
        CHECK (prix_achat_unitaire >= 0),

    sous_total NUMERIC(12,2)
        GENERATED ALWAYS AS (
            quantite * prix_unitaire
        ) STORED,

    marge_estimee NUMERIC(12,2)
        GENERATED ALWAYS AS (
            quantite *
            (prix_unitaire - prix_achat_unitaire)
        ) STORED
);


-- ============================================================
-- 11. PAIEMENTS
-- ============================================================

CREATE TABLE paiements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    vente_id UUID NOT NULL
        REFERENCES ventes(id)
        ON DELETE CASCADE,

    mode_paiement TEXT NOT NULL
        CHECK (
            mode_paiement IN (
                'especes',
                'wave',
                'orange_money'
            )
        ),

    montant NUMERIC(12,2)
        NOT NULL
        CHECK (montant > 0),

    reference_paiement TEXT,

    note TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 12. MOUVEMENTS DE STOCK
-- ============================================================

CREATE TABLE mouvements_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    variante_id UUID NOT NULL
        REFERENCES variantes(id)
        ON DELETE CASCADE,

    type_mouvement TEXT NOT NULL
        CHECK (
            type_mouvement IN (
                'entree',
                'vente',
                'ajustement',
                'retour'
            )
        ),

    quantite INTEGER NOT NULL
        CHECK (quantite > 0),

    stock_avant INTEGER NOT NULL
        CHECK (stock_avant >= 0),

    stock_apres INTEGER NOT NULL
        CHECK (stock_apres >= 0),

    reference TEXT,

    note TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- INDEX - PERFORMANCES
-- ============================================================

CREATE INDEX idx_produits_nom
ON produits(nom);

CREATE INDEX idx_produits_categorie
ON produits(categorie_id);

CREATE INDEX idx_variantes_produit
ON variantes(produit_id);

CREATE INDEX idx_variantes_code
ON variantes(code_produit);

CREATE INDEX idx_mouvements_variante
ON mouvements_stock(variante_id);

CREATE INDEX idx_entrees_fournisseur
ON entrees_stock(fournisseur_id);

CREATE INDEX idx_details_entree_entree
ON details_entree(entree_id);

CREATE INDEX idx_details_entree_variante
ON details_entree(variante_id);

CREATE INDEX idx_ventes_client
ON ventes(client_id);

CREATE INDEX idx_ventes_utilisateur
ON ventes(utilisateur_id);

CREATE INDEX idx_details_vente_vente
ON details_vente(vente_id);

CREATE INDEX idx_details_vente_variante
ON details_vente(variante_id);

CREATE INDEX idx_paiements_vente
ON paiements(vente_id);
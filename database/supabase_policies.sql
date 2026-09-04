-- Policies nécessaires pour l'application Darou Salam Business.
-- À exécuter dans Supabase > SQL Editor.
-- L'application utilise la clé publique et doit donc avoir ces droits.

DO $$
DECLARE
    table_name text;
BEGIN
    FOREACH table_name IN ARRAY ARRAY['produits', 'variantes', 'clients', 'fournisseurs', 'ventes', 'vente_details', 'mouvements_stock']
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
        EXECUTE format('DROP POLICY IF EXISTS "Application lecture %1$s" ON public.%1$I', table_name);
        EXECUTE format('DROP POLICY IF EXISTS "Application écriture %1$s" ON public.%1$I', table_name);
        EXECUTE format('CREATE POLICY "Application lecture %1$s" ON public.%1$I FOR SELECT TO anon, authenticated USING (true)', table_name);
        EXECUTE format('CREATE POLICY "Application écriture %1$s" ON public.%1$I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)', table_name);
    END LOOP;
END $$;


-- ===== ROLES =====
CREATE TYPE public.app_role AS ENUM ('admin_general','admin_rh','admin_patrimoine','admin_stock','admin_archives');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role) $$;

CREATE OR REPLACE FUNCTION public.is_admin_general(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT public.has_role(_user_id,'admin_general') $$;

-- Auto-create profile + first user becomes admin_general
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE user_count INT;
BEGIN
  INSERT INTO public.profiles(id,email,full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name',''));
  SELECT COUNT(*) INTO user_count FROM auth.users;
  IF user_count = 1 THEN
    INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, 'admin_general');
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS policies for roles & profiles
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admin general view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.is_admin_general(auth.uid()));
CREATE POLICY "Admin general manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.is_admin_general(auth.uid())) WITH CHECK (public.is_admin_general(auth.uid()));

CREATE POLICY "View own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Admin general view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.is_admin_general(auth.uid()));
CREATE POLICY "Update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- ===== RH : PERSONNEL =====
CREATE TYPE public.personnel_type AS ENUM ('Consistoire','Departement','Institut theologique','Centre de Sante');
CREATE TYPE public.personnel_categorie AS ENUM ('Ecclesiastique','Non-Ecclesiastique');

CREATE TABLE public.personnel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type public.personnel_type NOT NULL,
  categorie public.personnel_categorie NOT NULL,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  date_naissance DATE,
  lieu_naissance TEXT,
  date_bapteme DATE,
  lieu_bapteme TEXT,
  niveau_etude TEXT,
  lieu_etude TEXT,
  fonction TEXT,
  lieu_service TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.personnel ENABLE ROW LEVEL SECURITY;
CREATE POLICY "RH read" ON public.personnel FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin_rh') OR public.is_admin_general(auth.uid()));
CREATE POLICY "RH write" ON public.personnel FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin_rh') OR public.is_admin_general(auth.uid())) WITH CHECK (public.has_role(auth.uid(),'admin_rh') OR public.is_admin_general(auth.uid()));

-- ===== PATRIMOINE =====
CREATE TABLE public.terrains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  valeur_type TEXT NOT NULL,           -- 'Don' ou 'Acte'
  valeur_montant NUMERIC,
  nombre INT DEFAULT 1,
  lieu TEXT NOT NULL,
  superficie TEXT,
  bati BOOLEAN DEFAULT false,
  observation TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.terrains ENABLE ROW LEVEL SECURITY;

CREATE TYPE public.batiment_type AS ENUM ('Location','Logement','Centre de Sante','Ecole','Autre');
CREATE TABLE public.batiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type public.batiment_type NOT NULL,
  nom TEXT NOT NULL,
  lieu TEXT,
  description TEXT,
  observation TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.batiments ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.vehicules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marque TEXT NOT NULL,
  modele TEXT,
  immatriculation TEXT,
  annee INT,
  type_vehicule TEXT,
  numero_chassis TEXT,
  couleur TEXT,
  affectation TEXT,
  etat TEXT,
  observation TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vehicules ENABLE ROW LEVEL SECURITY;

-- Policies patrimoine
DO $$ DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY['terrains','batiments','vehicules']) LOOP
    EXECUTE format('CREATE POLICY "Patrimoine read %1$s" ON public.%1$s FOR SELECT TO authenticated USING (public.has_role(auth.uid(),''admin_patrimoine'') OR public.is_admin_general(auth.uid()))', t);
    EXECUTE format('CREATE POLICY "Patrimoine write %1$s" ON public.%1$s FOR ALL TO authenticated USING (public.has_role(auth.uid(),''admin_patrimoine'') OR public.is_admin_general(auth.uid())) WITH CHECK (public.has_role(auth.uid(),''admin_patrimoine'') OR public.is_admin_general(auth.uid()))', t);
  END LOOP;
END $$;

-- ===== STOCK : CARTES =====
CREATE TYPE public.carte_mouvement AS ENUM ('Entree','Sortie');
CREATE TABLE public.cartes_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mouvement public.carte_mouvement NOT NULL,
  quantite INT NOT NULL CHECK (quantite > 0),
  numero_serie_debut TEXT,
  numero_serie_fin TEXT,
  beneficiaire TEXT,
  motif TEXT,
  date_mouvement DATE NOT NULL DEFAULT CURRENT_DATE,
  observation TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cartes_stock ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Stock read" ON public.cartes_stock FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin_stock') OR public.is_admin_general(auth.uid()));
CREATE POLICY "Stock write" ON public.cartes_stock FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin_stock') OR public.is_admin_general(auth.uid())) WITH CHECK (public.has_role(auth.uid(),'admin_stock') OR public.is_admin_general(auth.uid()));

-- ===== ARCHIVES (documents échangés) =====
CREATE SEQUENCE IF NOT EXISTS public.archives_numero_seq START 1;

CREATE TABLE public.archives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_enregistrement TEXT NOT NULL UNIQUE DEFAULT ('ARC-' || LPAD(nextval('public.archives_numero_seq')::TEXT, 6, '0')),
  titre TEXT NOT NULL,
  description TEXT,
  file_path TEXT,
  file_name TEXT,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  receiver_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.archives ENABLE ROW LEVEL SECURITY;

-- Admin général voit tout. Les autres : seulement les archives où ils sont sender ou receiver.
CREATE POLICY "Archives admin general all" ON public.archives FOR SELECT TO authenticated USING (public.is_admin_general(auth.uid()));
CREATE POLICY "Archives own" ON public.archives FOR SELECT TO authenticated USING (sender_id = auth.uid() OR receiver_id = auth.uid());
CREATE POLICY "Archives insert authenticated" ON public.archives FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());
CREATE POLICY "Archives admin general update" ON public.archives FOR UPDATE TO authenticated USING (public.is_admin_general(auth.uid()));
CREATE POLICY "Archives admin general delete" ON public.archives FOR DELETE TO authenticated USING (public.is_admin_general(auth.uid()));

-- ===== STORAGE bucket archives (privé) =====
INSERT INTO storage.buckets (id, name, public) VALUES ('archives','archives', false) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Archives storage read own" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'archives' AND (
  public.is_admin_general(auth.uid())
  OR EXISTS (SELECT 1 FROM public.archives a WHERE a.file_path = storage.objects.name AND (a.sender_id = auth.uid() OR a.receiver_id = auth.uid()))
));
CREATE POLICY "Archives storage upload" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'archives' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Archives storage delete admin" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'archives' AND public.is_admin_general(auth.uid()));

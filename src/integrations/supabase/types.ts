export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      archives: {
        Row: {
          created_at: string
          description: string | null
          file_name: string | null
          file_path: string | null
          id: string
          numero_enregistrement: string
          receiver_id: string
          sender_id: string
          titre: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_name?: string | null
          file_path?: string | null
          id?: string
          numero_enregistrement?: string
          receiver_id: string
          sender_id: string
          titre: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_name?: string | null
          file_path?: string | null
          id?: string
          numero_enregistrement?: string
          receiver_id?: string
          sender_id?: string
          titre?: string
        }
        Relationships: []
      }
      batiments: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          lieu: string | null
          nom: string
          observation: string | null
          type: Database["public"]["Enums"]["batiment_type"]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          lieu?: string | null
          nom: string
          observation?: string | null
          type: Database["public"]["Enums"]["batiment_type"]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          lieu?: string | null
          nom?: string
          observation?: string | null
          type?: Database["public"]["Enums"]["batiment_type"]
        }
        Relationships: []
      }
      cartes_stock: {
        Row: {
          beneficiaire: string | null
          created_at: string
          created_by: string | null
          date_mouvement: string
          id: string
          motif: string | null
          mouvement: Database["public"]["Enums"]["carte_mouvement"]
          numero_serie_debut: string | null
          numero_serie_fin: string | null
          observation: string | null
          quantite: number
        }
        Insert: {
          beneficiaire?: string | null
          created_at?: string
          created_by?: string | null
          date_mouvement?: string
          id?: string
          motif?: string | null
          mouvement: Database["public"]["Enums"]["carte_mouvement"]
          numero_serie_debut?: string | null
          numero_serie_fin?: string | null
          observation?: string | null
          quantite: number
        }
        Update: {
          beneficiaire?: string | null
          created_at?: string
          created_by?: string | null
          date_mouvement?: string
          id?: string
          motif?: string | null
          mouvement?: Database["public"]["Enums"]["carte_mouvement"]
          numero_serie_debut?: string | null
          numero_serie_fin?: string | null
          observation?: string | null
          quantite?: number
        }
        Relationships: []
      }
      personnel: {
        Row: {
          categorie: Database["public"]["Enums"]["personnel_categorie"]
          created_at: string
          created_by: string | null
          date_bapteme: string | null
          date_naissance: string | null
          fonction: string | null
          id: string
          lieu_bapteme: string | null
          lieu_etude: string | null
          lieu_naissance: string | null
          lieu_service: string | null
          niveau_etude: string | null
          nom: string
          prenom: string
          type: Database["public"]["Enums"]["personnel_type"]
        }
        Insert: {
          categorie: Database["public"]["Enums"]["personnel_categorie"]
          created_at?: string
          created_by?: string | null
          date_bapteme?: string | null
          date_naissance?: string | null
          fonction?: string | null
          id?: string
          lieu_bapteme?: string | null
          lieu_etude?: string | null
          lieu_naissance?: string | null
          lieu_service?: string | null
          niveau_etude?: string | null
          nom: string
          prenom: string
          type: Database["public"]["Enums"]["personnel_type"]
        }
        Update: {
          categorie?: Database["public"]["Enums"]["personnel_categorie"]
          created_at?: string
          created_by?: string | null
          date_bapteme?: string | null
          date_naissance?: string | null
          fonction?: string | null
          id?: string
          lieu_bapteme?: string | null
          lieu_etude?: string | null
          lieu_naissance?: string | null
          lieu_service?: string | null
          niveau_etude?: string | null
          nom?: string
          prenom?: string
          type?: Database["public"]["Enums"]["personnel_type"]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      terrains: {
        Row: {
          bati: boolean | null
          created_at: string
          created_by: string | null
          id: string
          lieu: string
          nombre: number | null
          observation: string | null
          superficie: string | null
          valeur_montant: number | null
          valeur_type: string
        }
        Insert: {
          bati?: boolean | null
          created_at?: string
          created_by?: string | null
          id?: string
          lieu: string
          nombre?: number | null
          observation?: string | null
          superficie?: string | null
          valeur_montant?: number | null
          valeur_type: string
        }
        Update: {
          bati?: boolean | null
          created_at?: string
          created_by?: string | null
          id?: string
          lieu?: string
          nombre?: number | null
          observation?: string | null
          superficie?: string | null
          valeur_montant?: number | null
          valeur_type?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicules: {
        Row: {
          affectation: string | null
          annee: number | null
          couleur: string | null
          created_at: string
          created_by: string | null
          etat: string | null
          id: string
          immatriculation: string | null
          marque: string
          modele: string | null
          numero_chassis: string | null
          observation: string | null
          type_vehicule: string | null
        }
        Insert: {
          affectation?: string | null
          annee?: number | null
          couleur?: string | null
          created_at?: string
          created_by?: string | null
          etat?: string | null
          id?: string
          immatriculation?: string | null
          marque: string
          modele?: string | null
          numero_chassis?: string | null
          observation?: string | null
          type_vehicule?: string | null
        }
        Update: {
          affectation?: string | null
          annee?: number | null
          couleur?: string | null
          created_at?: string
          created_by?: string | null
          etat?: string | null
          id?: string
          immatriculation?: string | null
          marque?: string
          modele?: string | null
          numero_chassis?: string | null
          observation?: string | null
          type_vehicule?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_general: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "admin_general"
        | "admin_rh"
        | "admin_patrimoine"
        | "admin_stock"
        | "admin_archives"
      batiment_type:
        | "Location"
        | "Logement"
        | "Centre de Sante"
        | "Ecole"
        | "Autre"
      carte_mouvement: "Entree" | "Sortie"
      personnel_categorie: "Ecclesiastique" | "Non-Ecclesiastique"
      personnel_type:
        | "Consistoire"
        | "Departement"
        | "Institut theologique"
        | "Centre de Sante"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin_general",
        "admin_rh",
        "admin_patrimoine",
        "admin_stock",
        "admin_archives",
      ],
      batiment_type: [
        "Location",
        "Logement",
        "Centre de Sante",
        "Ecole",
        "Autre",
      ],
      carte_mouvement: ["Entree", "Sortie"],
      personnel_categorie: ["Ecclesiastique", "Non-Ecclesiastique"],
      personnel_type: [
        "Consistoire",
        "Departement",
        "Institut theologique",
        "Centre de Sante",
      ],
    },
  },
} as const

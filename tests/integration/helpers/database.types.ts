/**
 * Tipos mínimos de Supabase para los smoke tests de integración.
 * No reemplazan a los tipos generados del proyecto; son un contrato local
 * reducido que permite tipar las queries de los tests sin depender del CLI
 * de Supabase en cada entorno.
 */
export type Database = {
  public: {
    Tables: {
      lots: {
        Row: {
          id: string;
          name: string;
        };
        Insert: {
          name: string;
        };
        Update: {
          name?: string;
        };
        Relationships: [];
      };
      views: {
        Row: {
          id: string;
        };
        Insert: {
          id: string;
          display_order: number;
          base_image_url: string;
          alt_image_url?: string | null;
        };
        Update: {
          id?: string;
          display_order?: number;
          base_image_url?: string;
          alt_image_url?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};

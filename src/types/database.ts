/**
 * Database types for the Supabase client.
 *
 * Mirrors the schema in `supabase/migrations/`. Follows the shape produced by
 * `supabase gen types typescript` (each table includes a `Relationships` array,
 * which postgrest-js requires). Once the Supabase CLI is linked this can be
 * regenerated with:
 *
 *   npx supabase gen types typescript --project-id <id> > src/types/database.ts
 */

export type SplitType = "equal" | "exact" | "percent" | "shares";
export type MemberRole = "member" | "admin";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          email: string | null;
          default_currency: string;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          email?: string | null;
          default_currency?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          email?: string | null;
          default_currency?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      groups: {
        Row: {
          id: string;
          name: string;
          currency: string;
          created_by: string;
          created_at: string;
          is_direct: boolean;
        };
        Insert: {
          id?: string;
          name: string;
          currency?: string;
          created_by: string;
          created_at?: string;
          is_direct?: boolean;
        };
        Update: {
          id?: string;
          name?: string;
          currency?: string;
          created_by?: string;
          created_at?: string;
          is_direct?: boolean;
        };
        Relationships: [];
      };
      group_members: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          role: MemberRole;
          joined_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          role?: MemberRole;
          joined_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          user_id?: string;
          role?: MemberRole;
          joined_at?: string;
        };
        Relationships: [];
      };
      expenses: {
        Row: {
          id: string;
          group_id: string;
          description: string;
          amount: number;
          currency: string;
          paid_by: string;
          category: string | null;
          receipt_url: string | null;
          split_type: SplitType;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          description: string;
          amount: number;
          currency: string;
          paid_by: string;
          category?: string | null;
          receipt_url?: string | null;
          split_type?: SplitType;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          description?: string;
          amount?: number;
          currency?: string;
          paid_by?: string;
          category?: string | null;
          receipt_url?: string | null;
          split_type?: SplitType;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      expense_splits: {
        Row: {
          id: string;
          expense_id: string;
          group_id: string;
          user_id: string;
          owed_amount: number;
        };
        Insert: {
          id?: string;
          expense_id: string;
          group_id: string;
          user_id: string;
          owed_amount: number;
        };
        Update: {
          id?: string;
          expense_id?: string;
          group_id?: string;
          user_id?: string;
          owed_amount?: number;
        };
        Relationships: [];
      };
      settlements: {
        Row: {
          id: string;
          group_id: string;
          from_user: string;
          to_user: string;
          amount: number;
          currency: string;
          note: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          from_user: string;
          to_user: string;
          amount: number;
          currency: string;
          note?: string | null;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          from_user?: string;
          to_user?: string;
          amount?: number;
          currency?: string;
          note?: string | null;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          kind: "expense" | "settlement";
          actor_name: string;
          group_id: string | null;
          group_name: string | null;
          title: string | null;
          amount: number | null;
          currency: string | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          kind: "expense" | "settlement";
          actor_name: string;
          group_id?: string | null;
          group_name?: string | null;
          title?: string | null;
          amount?: number | null;
          currency?: string | null;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          read?: boolean;
        };
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at?: string;
        };
        Update: {
          endpoint?: string;
          p256dh?: string;
          auth?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      is_member_of: {
        Args: { _group_id: string };
        Returns: boolean;
      };
      add_group_member: {
        Args: { _group_id: string; _email: string };
        Returns: Database["public"]["Tables"]["group_members"]["Row"];
      };
      remove_group_member: {
        Args: { _group_id: string; _user_id: string };
        Returns: undefined;
      };
      create_expense: {
        Args: {
          _group_id: string;
          _description: string;
          _amount: number;
          _currency: string;
          _paid_by: string;
          _category: string | null;
          _split_type: SplitType;
          _splits: { user_id: string; owed_amount: number }[];
          _receipt_url?: string | null;
        };
        Returns: Database["public"]["Tables"]["expenses"]["Row"];
      };
      ensure_direct_group: {
        Args: { _friend_id: string };
        Returns: string;
      };
      add_friend: {
        Args: { _email: string };
        Returns: string;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}

// Convenience row aliases used across the app.
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Group = Database["public"]["Tables"]["groups"]["Row"];
export type GroupMember = Database["public"]["Tables"]["group_members"]["Row"];
export type Expense = Database["public"]["Tables"]["expenses"]["Row"];
export type ExpenseSplit =
  Database["public"]["Tables"]["expense_splits"]["Row"];
export type Settlement = Database["public"]["Tables"]["settlements"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];

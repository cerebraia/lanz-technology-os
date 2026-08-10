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
      accounts_payable: {
        Row: {
          amount: number
          cancelled_at: string | null
          created_at: string
          created_by: string | null
          currency: string
          description: string
          due_date: string | null
          id: string
          notes: string | null
          paid_at: string | null
          purchase_order_id: string | null
          status: string
          supplier_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          cancelled_at?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description: string
          due_date?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          purchase_order_id?: string | null
          status?: string
          supplier_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          cancelled_at?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          purchase_order_id?: string | null
          status?: string
          supplier_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_payable_created_fk"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_payable_po_fk"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_payable_supplier_fk"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      accounts_receivable: {
        Row: {
          amount: number
          cancelled_at: string | null
          created_at: string
          created_by: string | null
          currency: string
          customer_id: string | null
          description: string
          due_date: string | null
          id: string
          notes: string | null
          order_id: string | null
          paid_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          cancelled_at?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_id?: string | null
          description: string
          due_date?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          paid_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          cancelled_at?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_id?: string | null
          description?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          paid_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_receivable_created_fk"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_receivable_customer_fk"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_receivable_order_fk"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_insights: {
        Row: {
          created_at: string
          description: string
          id: string
          metadata: Json | null
          priority: string
          resolved: boolean
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          metadata?: Json | null
          priority?: string
          resolved?: boolean
          title: string
          type: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          metadata?: Json | null
          priority?: string
          resolved?: boolean
          title?: string
          type?: string
        }
        Relationships: []
      }
      ai_recommendations: {
        Row: {
          category: string
          confidence: number
          created_at: string
          id: string
          is_dismissed: boolean
          metadata: Json | null
          recommendation: string
          reference_id: string | null
          reference_type: string | null
        }
        Insert: {
          category: string
          confidence?: number
          created_at?: string
          id?: string
          is_dismissed?: boolean
          metadata?: Json | null
          recommendation: string
          reference_id?: string | null
          reference_type?: string | null
        }
        Update: {
          category?: string
          confidence?: number
          created_at?: string
          id?: string
          is_dismissed?: boolean
          metadata?: Json | null
          recommendation?: string
          reference_id?: string | null
          reference_type?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json | null
          new_data: Json | null
          previous_data: Json | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
          new_data?: Json | null
          previous_data?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
          new_data?: Json | null
          previous_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_fk"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_runs: {
        Row: {
          automation_id: string
          error_message: string | null
          finished_at: string | null
          id: string
          result: Json | null
          started_at: string
          status: string
          triggered_by: string | null
        }
        Insert: {
          automation_id: string
          error_message?: string | null
          finished_at?: string | null
          id?: string
          result?: Json | null
          started_at?: string
          status?: string
          triggered_by?: string | null
        }
        Update: {
          automation_id?: string
          error_message?: string | null
          finished_at?: string | null
          id?: string
          result?: Json | null
          started_at?: string
          status?: string
          triggered_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_runs_auto_fk"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "automations"
            referencedColumns: ["id"]
          },
        ]
      }
      automations: {
        Row: {
          action_type: string
          config: Json
          created_at: string
          created_by: string | null
          description: string | null
          enabled: boolean
          id: string
          last_run_at: string | null
          name: string
          run_count: number
          trigger_type: string
          updated_at: string
        }
        Insert: {
          action_type: string
          config?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          enabled?: boolean
          id?: string
          last_run_at?: string | null
          name: string
          run_count?: number
          trigger_type: string
          updated_at?: string
        }
        Update: {
          action_type?: string
          config?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          enabled?: boolean
          id?: string
          last_run_at?: string | null
          name?: string
          run_count?: number
          trigger_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automations_user_fk"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: string
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value: string
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_settings_user_fk"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exchange_rates: {
        Row: {
          base_currency: string
          created_at:    string
          created_by:    string | null
          effective_at:  string
          fetched_at:    string
          id:            string
          is_manual:     boolean
          notes:         string | null
          quote_currency: string
          rate:          number
          source:        string
          status:        string
        }
        Insert: {
          base_currency?:  string
          created_at?:     string
          created_by?:     string | null
          effective_at?:   string
          fetched_at?:     string
          id?:             string
          is_manual?:      boolean
          notes?:          string | null
          quote_currency?: string
          rate:            number
          source:          string
          status?:         string
        }
        Update: {
          base_currency?:  string
          created_at?:     string
          created_by?:     string | null
          effective_at?:   string
          fetched_at?:     string
          id?:             string
          is_manual?:      boolean
          notes?:          string | null
          quote_currency?: string
          rate?:           number
          source?:         string
          status?:         string
        }
        Relationships: [
          {
            foreignKeyName: "exchange_rates_created_by_fk"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_customers: {
        Row: {
          campaign_id: string
          clicked_at: string | null
          converted_at: string | null
          created_at: string
          customer_id: string
          id: string
          opened_at: string | null
          sent_at: string | null
        }
        Insert: {
          campaign_id: string
          clicked_at?: string | null
          converted_at?: string | null
          created_at?: string
          customer_id: string
          id?: string
          opened_at?: string | null
          sent_at?: string | null
        }
        Update: {
          campaign_id?: string
          clicked_at?: string | null
          converted_at?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          opened_at?: string | null
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_customers_campaign_fk"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_customers_customer_fk"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          parent_id: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_fk"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_activity: {
        Row: {
          activity_type: string
          created_at: string
          created_by: string | null
          customer_id: string
          description: string
          id: string
          reference_id: string | null
          reference_type: string | null
        }
        Insert: {
          activity_type: string
          created_at?: string
          created_by?: string | null
          customer_id: string
          description: string
          id?: string
          reference_id?: string | null
          reference_type?: string | null
        }
        Update: {
          activity_type?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string
          description?: string
          id?: string
          reference_id?: string | null
          reference_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_activity_customer_fk"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_activity_user_fk"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_segments: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      customer_tag_assignments: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          tag_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_tag_assignments_customer_fk"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_tag_assignments_tag_fk"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "customer_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_tags: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          archived_at: string | null
          city: string | null
          company: string | null
          country: string | null
          created_at: string
          created_by: string | null
          email: string | null
          first_name: string
          id: string
          id_number: string | null
          last_name: string | null
          notes: string | null
          phone: string | null
          source: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          archived_at?: string | null
          city?: string | null
          company?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          first_name: string
          id?: string
          id_number?: string | null
          last_name?: string | null
          notes?: string | null
          phone?: string | null
          source?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          archived_at?: string | null
          city?: string | null
          company?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          first_name?: string
          id?: string
          id_number?: string | null
          last_name?: string | null
          notes?: string | null
          phone?: string | null
          source?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_user_fk"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_coupons: {
        Row: {
          campaign_id: string | null
          code: string
          created_at: string
          created_by: string | null
          description: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          minimum_amount: number
          type: string
          usage_limit: number | null
          used_count: number
          value: number
        }
        Insert: {
          campaign_id?: string | null
          code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          minimum_amount?: number
          type: string
          usage_limit?: number | null
          used_count?: number
          value: number
        }
        Update: {
          campaign_id?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          minimum_amount?: number
          type?: string
          usage_limit?: number | null
          used_count?: number
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "discount_coupons_campaign_fk"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_coupons_user_fk"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_accounts: {
        Row: {
          balance: number
          created_at: string
          currency: string
          id: string
          is_active: boolean
          name: string
          notes: string | null
          type: string
          updated_at: string
        }
        Insert: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      financial_transactions: {
        Row: {
          account_id: string | null
          amount: number
          category: string
          created_at: string
          created_by: string | null
          currency: string
          description: string
          id: string
          notes: string | null
          reference_id: string | null
          reference_type: string | null
          transaction_date: string
          type: string
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          category: string
          created_at?: string
          created_by?: string | null
          currency?: string
          description: string
          id?: string
          notes?: string | null
          reference_id?: string | null
          reference_type?: string | null
          transaction_date?: string
          type: string
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          category?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string
          id?: string
          notes?: string | null
          reference_id?: string | null
          reference_type?: string | null
          transaction_date?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_account_fk"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "financial_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_created_fk"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      import_cost_allocation_items: {
        Row: {
          allocated_amount: number
          allocation_id: string
          created_at: string
          final_unit_cost: number
          id: string
          product_id: string
          quantity: number
          unit_merchandise_cost: number
        }
        Insert: {
          allocated_amount?: number
          allocation_id: string
          created_at?: string
          final_unit_cost?: number
          id?: string
          product_id: string
          quantity?: number
          unit_merchandise_cost?: number
        }
        Update: {
          allocated_amount?: number
          allocation_id?: string
          created_at?: string
          final_unit_cost?: number
          id?: string
          product_id?: string
          quantity?: number
          unit_merchandise_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "import_cost_alloc_items_alloc_fk"
            columns: ["allocation_id"]
            isOneToOne: false
            referencedRelation: "import_cost_allocations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_cost_alloc_items_product_fk"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      import_cost_allocations: {
        Row: {
          allocation_method: string
          created_at: string
          created_by: string | null
          currency: string
          expense_id: string | null
          id: string
          import_id: string
          notes: string | null
          total_amount: number
        }
        Insert: {
          allocation_method: string
          created_at?: string
          created_by?: string | null
          currency?: string
          expense_id?: string | null
          id?: string
          import_id: string
          notes?: string | null
          total_amount?: number
        }
        Update: {
          allocation_method?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          expense_id?: string | null
          id?: string
          import_id?: string
          notes?: string | null
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "import_cost_allocations_created_fk"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_cost_allocations_expense_fk"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "import_expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_cost_allocations_import_fk"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "imports"
            referencedColumns: ["id"]
          },
        ]
      }
      import_expenses: {
        Row: {
          amount: number
          concept: string
          created_at: string
          currency: string
          id: string
          import_id: string
          notes: string | null
        }
        Insert: {
          amount: number
          concept: string
          created_at?: string
          currency?: string
          id?: string
          import_id: string
          notes?: string | null
        }
        Update: {
          amount?: number
          concept?: string
          created_at?: string
          currency?: string
          id?: string
          import_id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "import_expenses_import_fk"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "imports"
            referencedColumns: ["id"]
          },
        ]
      }
      import_profitability: {
        Row: {
          created_at: string
          created_by: string | null
          currency: string
          gross_profit: number
          id: string
          import_id: string
          margin: number
          notes: string | null
          roi: number
          total_cost: number
          total_logistics_cost: number
          total_merchandise_cost: number
          total_revenue: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          currency?: string
          gross_profit?: number
          id?: string
          import_id: string
          margin?: number
          notes?: string | null
          roi?: number
          total_cost?: number
          total_logistics_cost?: number
          total_merchandise_cost?: number
          total_revenue?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          currency?: string
          gross_profit?: number
          id?: string
          import_id?: string
          margin?: number
          notes?: string | null
          roi?: number
          total_cost?: number
          total_logistics_cost?: number
          total_merchandise_cost?: number
          total_revenue?: number
        }
        Relationships: [
          {
            foreignKeyName: "import_profitability_created_fk"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_profitability_import_fk"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "imports"
            referencedColumns: ["id"]
          },
        ]
      }
      import_purchase_orders: {
        Row: {
          created_at: string
          id: string
          import_id: string
          purchase_order_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          import_id: string
          purchase_order_id: string
        }
        Update: {
          created_at?: string
          id?: string
          import_id?: string
          purchase_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_purchase_orders_import_fk"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "imports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_purchase_orders_po_fk"
            columns: ["purchase_order_id"]
            isOneToOne: true
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      import_receipt_items: {
        Row: {
          created_at: string
          damaged_quantity: number
          expected_quantity: number
          id: string
          notes: string | null
          previously_received_quantity: number
          product_id: string
          receipt_id: string
          received_quantity: number
        }
        Insert: {
          created_at?: string
          damaged_quantity?: number
          expected_quantity?: number
          id?: string
          notes?: string | null
          previously_received_quantity?: number
          product_id: string
          receipt_id: string
          received_quantity?: number
        }
        Update: {
          created_at?: string
          damaged_quantity?: number
          expected_quantity?: number
          id?: string
          notes?: string | null
          previously_received_quantity?: number
          product_id?: string
          receipt_id?: string
          received_quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "import_receipt_items_product_fk"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_receipt_items_receipt_fk"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "import_receipts"
            referencedColumns: ["id"]
          },
        ]
      }
      import_receipts: {
        Row: {
          cancelled_at: string | null
          cancelled_by: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          created_by: string | null
          id: string
          import_id: string
          location_id: string
          notes: string | null
          received_at: string | null
          reference: string
          status: string
          updated_at: string
        }
        Insert: {
          cancelled_at?: string | null
          cancelled_by?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          import_id: string
          location_id: string
          notes?: string | null
          received_at?: string | null
          reference: string
          status?: string
          updated_at?: string
        }
        Update: {
          cancelled_at?: string | null
          cancelled_by?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          import_id?: string
          location_id?: string
          notes?: string | null
          received_at?: string | null
          reference?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_receipts_cancelled_fk"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_receipts_confirmed_fk"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_receipts_created_by_fk"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_receipts_import_fk"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "imports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_receipts_location_fk"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "inventory_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      imports: {
        Row: {
          actual_arrival: string | null
          created_at: string
          created_by: string | null
          destination_country: string
          estimated_arrival: string | null
          estimated_departure: string | null
          id: string
          notes: string | null
          origin_country: string
          reference: string
          shipping_method: string | null
          status: string
          updated_at: string
        }
        Insert: {
          actual_arrival?: string | null
          created_at?: string
          created_by?: string | null
          destination_country?: string
          estimated_arrival?: string | null
          estimated_departure?: string | null
          id?: string
          notes?: string | null
          origin_country: string
          reference: string
          shipping_method?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          actual_arrival?: string | null
          created_at?: string
          created_by?: string | null
          destination_country?: string
          estimated_arrival?: string | null
          estimated_departure?: string | null
          id?: string
          notes?: string | null
          origin_country?: string
          reference?: string
          shipping_method?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "imports_created_by_fk"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_adjustment_items: {
        Row: {
          created_at: string
          current_stock: number
          difference: number
          id: string
          inventory_adjustment_id: string
          notes: string | null
          physical_stock: number
          product_id: string
        }
        Insert: {
          created_at?: string
          current_stock?: number
          difference: number
          id?: string
          inventory_adjustment_id: string
          notes?: string | null
          physical_stock: number
          product_id: string
        }
        Update: {
          created_at?: string
          current_stock?: number
          difference?: number
          id?: string
          inventory_adjustment_id?: string
          notes?: string | null
          physical_stock?: number
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_adjustment_items_adj_fk"
            columns: ["inventory_adjustment_id"]
            isOneToOne: false
            referencedRelation: "inventory_adjustments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_adjustment_items_product_fk"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_adjustments: {
        Row: {
          cancelled_at: string | null
          cancelled_by: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          reason: string
          reference: string
          status: string
          updated_at: string
        }
        Insert: {
          cancelled_at?: string | null
          cancelled_by?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          reason: string
          reference: string
          status?: string
          updated_at?: string
        }
        Update: {
          cancelled_at?: string | null
          cancelled_by?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          reason?: string
          reference?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_adjustments_cancelled_by_fk"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_adjustments_confirmed_by_fk"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_adjustments_created_by_fk"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_balances: {
        Row: {
          id: string
          location_id: string
          on_hand: number
          product_id: string
          reserved: number
          updated_at: string
        }
        Insert: {
          id?: string
          location_id: string
          on_hand?: number
          product_id: string
          reserved?: number
          updated_at?: string
        }
        Update: {
          id?: string
          location_id?: string
          on_hand?: number
          product_id?: string
          reserved?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_balances_location_fk"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "inventory_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_balances_product_fk"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_entries: {
        Row: {
          cancelled_at: string | null
          cancelled_by: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          created_by: string | null
          entry_type: string
          id: string
          notes: string | null
          reference: string
          status: string
          supplier_name: string | null
          total_units: number
          updated_at: string
        }
        Insert: {
          cancelled_at?: string | null
          cancelled_by?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          created_by?: string | null
          entry_type: string
          id?: string
          notes?: string | null
          reference: string
          status?: string
          supplier_name?: string | null
          total_units?: number
          updated_at?: string
        }
        Update: {
          cancelled_at?: string | null
          cancelled_by?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          created_by?: string | null
          entry_type?: string
          id?: string
          notes?: string | null
          reference?: string
          status?: string
          supplier_name?: string | null
          total_units?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_entries_cancelled_by_fk"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_entries_confirmed_by_fk"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_entries_created_by_fk"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_entry_items: {
        Row: {
          created_at: string
          id: string
          inventory_entry_id: string
          notes: string | null
          product_id: string
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          inventory_entry_id: string
          notes?: string | null
          product_id: string
          quantity: number
        }
        Update: {
          created_at?: string
          id?: string
          inventory_entry_id?: string
          notes?: string | null
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_entry_items_entry_fk"
            columns: ["inventory_entry_id"]
            isOneToOne: false
            referencedRelation: "inventory_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_entry_items_product_fk"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_hold_items: {
        Row: {
          created_at: string
          hold_id: string
          id: string
          product_id: string
          quantity: number
        }
        Insert: {
          created_at?: string
          hold_id: string
          id?: string
          product_id: string
          quantity: number
        }
        Update: {
          created_at?: string
          hold_id?: string
          id?: string
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_hold_items_hold_fk"
            columns: ["hold_id"]
            isOneToOne: false
            referencedRelation: "inventory_holds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_hold_items_product_fk"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_holds: {
        Row: {
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          created_by: string | null
          customer_name: string | null
          expires_at: string | null
          id: string
          notes: string | null
          reference: string
          released_at: string | null
          released_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          created_by?: string | null
          customer_name?: string | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          reference: string
          released_at?: string | null
          released_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          created_by?: string | null
          customer_name?: string | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          reference?: string
          released_at?: string | null
          released_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_holds_confirmed_by_fk"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_holds_created_by_fk"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_holds_released_by_fk"
            columns: ["released_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_locations: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      inventory_movements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          location_id: string
          movement_type: string
          notes: string | null
          product_id: string
          quantity: number
          quantity_after: number
          quantity_before: number
          reason: string | null
          reference_id: string | null
          reference_type: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          location_id: string
          movement_type: string
          notes?: string | null
          product_id: string
          quantity: number
          quantity_after: number
          quantity_before: number
          reason?: string | null
          reference_id?: string | null
          reference_type?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          location_id?: string
          movement_type?: string
          notes?: string | null
          product_id?: string
          quantity?: number
          quantity_after?: number
          quantity_before?: number
          reason?: string | null
          reference_id?: string | null
          reference_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_location_fk"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "inventory_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_product_fk"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_user_fk"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_reservations: {
        Row: {
          created_at: string
          id: string
          location_id: string
          order_id: string
          product_id: string
          quantity: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          location_id: string
          order_id: string
          product_id: string
          quantity: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          location_id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_reservations_location_fk"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "inventory_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_reservations_order_fk"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_reservations_product_fk"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_campaigns: {
        Row: {
          budget: number | null
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          end_date: string | null
          id: string
          name: string
          segment_id: string | null
          start_date: string | null
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          budget?: number | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          segment_id?: string | null
          start_date?: string | null
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          budget?: number | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          segment_id?: string | null
          start_date?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_campaigns_segment_fk"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "customer_segments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_campaigns_user_fk"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          currency_code: string
          discount_amount: number
          id: string
          line_total: number
          order_id: string
          product_id: string | null
          product_name: string
          product_sku: string
          quantity: number
          unit_cost: number | null
          unit_price: number
        }
        Insert: {
          created_at?: string
          currency_code: string
          discount_amount?: number
          id?: string
          line_total: number
          order_id: string
          product_id?: string | null
          product_name: string
          product_sku: string
          quantity: number
          unit_cost?: number | null
          unit_price: number
        }
        Update: {
          created_at?: string
          currency_code?: string
          discount_amount?: number
          id?: string
          line_total?: number
          order_id?: string
          product_id?: string | null
          product_name?: string
          product_sku?: string
          quantity?: number
          unit_cost?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_fk"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_fk"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          new_status: string
          notes: string | null
          order_id: string
          previous_status: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          new_status: string
          notes?: string | null
          order_id: string
          previous_status?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          new_status?: string
          notes?: string | null
          order_id?: string
          previous_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_fk"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_status_history_user_fk"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          cancel_reason: string | null
          cancelled_at: string | null
          confirmation_token: string
          created_at: string
          created_by: string | null
          currency_code: string
          customer_id: string | null
          delivery_method: string | null
          discount_amount: number
          id: string
          idempotency_key: string | null
          notes: string | null
          order_number: string
          payment_method: string | null
          payment_status: string
          sale_channel: string
          shipping: number
          status: string
          subtotal: number
          taxes: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          cancel_reason?: string | null
          cancelled_at?: string | null
          confirmation_token?: string
          created_at?: string
          created_by?: string | null
          currency_code?: string
          customer_id?: string | null
          delivery_method?: string | null
          discount_amount?: number
          id?: string
          idempotency_key?: string | null
          notes?: string | null
          order_number?: string
          payment_method?: string | null
          payment_status?: string
          sale_channel?: string
          shipping?: number
          status?: string
          subtotal?: number
          taxes?: number
          total_amount?: number
          updated_at?: string
        }
        Update: {
          cancel_reason?: string | null
          cancelled_at?: string | null
          confirmation_token?: string
          created_at?: string
          created_by?: string | null
          currency_code?: string
          customer_id?: string | null
          delivery_method?: string | null
          discount_amount?: number
          id?: string
          idempotency_key?: string | null
          notes?: string | null
          order_number?: string
          payment_method?: string | null
          payment_status?: string
          sale_channel?: string
          shipping?: number
          status?: string
          subtotal?: number
          taxes?: number
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_fk"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_fk"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          currency: string
          id: string
          method: string
          notes: string | null
          order_id: string
          reference: string | null
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          method: string
          notes?: string | null
          order_id: string
          reference?: string | null
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          method?: string
          notes?: string | null
          order_id?: string
          reference?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_fk"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_user_fk"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      product_images: {
        Row: {
          alt_text: string | null
          created_at: string
          id: string
          is_primary: boolean
          product_id: string
          sort_order: number
          storage_path: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          product_id: string
          sort_order?: number
          storage_path: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          product_id?: string
          sort_order?: number
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_fk"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          archived_at:              string | null
          bcv_reference_price_usd:  number | null
          brand:                    string | null
          cash_price_usd:           number | null
          category_id:              string | null
          created_at:               string
          created_by:               string | null
          currency_code:            string
          description:              string | null
          id:                       string
          is_featured:              boolean
          is_published:             boolean
          min_stock:                number
          model:                    string | null
          name:                     string
          promotional_price:        number | null
          published_at:             string | null
          reference_cost:           number | null
          reorder_point:            number
          reorder_quantity:         number
          sale_price:               number
          short_description:        string | null
          sku:                      string
          slug:                     string
          status:                   string
          track_inventory:          boolean
          updated_at:               string
          youtube_url:              string | null
        }
        Insert: {
          archived_at?:             string | null
          bcv_reference_price_usd?: number | null
          brand?:                   string | null
          cash_price_usd?:          number | null
          category_id?:             string | null
          created_at?:              string
          created_by?:              string | null
          currency_code?:           string
          description?:             string | null
          id?:                      string
          is_featured?:             boolean
          is_published?:            boolean
          min_stock?:               number
          model?:                   string | null
          name:                     string
          promotional_price?:       number | null
          published_at?:            string | null
          reference_cost?:          number | null
          reorder_point?:           number
          reorder_quantity?:        number
          sale_price?:              number
          short_description?:       string | null
          sku:                      string
          slug:                     string
          status?:                  string
          track_inventory?:         boolean
          updated_at?:              string
          youtube_url?:             string | null
        }
        Update: {
          archived_at?:             string | null
          bcv_reference_price_usd?: number | null
          brand?:                   string | null
          cash_price_usd?:          number | null
          category_id?:             string | null
          created_at?:              string
          created_by?:              string | null
          currency_code?:           string
          description?:             string | null
          id?:                      string
          is_featured?:             boolean
          is_published?:            boolean
          min_stock?:               number
          model?:                   string | null
          name?:                    string
          promotional_price?:       number | null
          published_at?:            string | null
          reference_cost?:          number | null
          reorder_point?:           number
          reorder_quantity?:        number
          sale_price?:              number
          short_description?:       string | null
          sku?:                     string
          slug?:                    string
          status?:                  string
          track_inventory?:         boolean
          youtube_url?:             string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_fk"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_created_by_fk"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      purchase_order_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          purchase_order_id: string
          quantity: number
          total: number
          unit_cost: number
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          purchase_order_id: string
          quantity: number
          total: number
          unit_cost: number
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          purchase_order_id?: string
          quantity?: number
          total?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_order_fk"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_product_fk"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string
          created_by: string | null
          currency: string
          id: string
          notes: string | null
          reference: string
          sent_at: string | null
          sent_by: string | null
          status: string
          subtotal: number
          supplier_id: string | null
          supplier_name: string | null
          updated_at: string
        }
        Insert: {
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          notes?: string | null
          reference: string
          sent_at?: string | null
          sent_by?: string | null
          status?: string
          subtotal?: number
          supplier_id?: string | null
          supplier_name?: string | null
          updated_at?: string
        }
        Update: {
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          notes?: string | null
          reference?: string
          sent_at?: string | null
          sent_by?: string | null
          status?: string
          subtotal?: number
          supplier_id?: string | null
          supplier_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_cancelled_by_fk"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_created_by_fk"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_sent_by_fk"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_items: {
        Row: {
          id: string
          product_id: string | null
          quantity: number
          quote_id: string
          total: number
          unit_price: number
        }
        Insert: {
          id?: string
          product_id?: string | null
          quantity?: number
          quote_id: string
          total: number
          unit_price: number
        }
        Update: {
          id?: string
          product_id?: string | null
          quantity?: number
          quote_id?: string
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_product_fk"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_quote_fk"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          created_at: string
          created_by: string | null
          customer_id: string | null
          expires_at: string | null
          id: string
          notes: string | null
          status: string
          subtotal: number
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotes_customer_fk"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_user_fk"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          permission_id: string
          role_id: string
        }
        Insert: {
          permission_id: string
          role_id: string
        }
        Update: {
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_fk"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_fk"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      shipments: {
        Row: {
          carrier: string | null
          created_at: string
          created_by: string | null
          delivered_at: string | null
          id: string
          notes: string | null
          order_id: string
          shipped_at: string | null
          status: string
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          carrier?: string | null
          created_at?: string
          created_by?: string | null
          delivered_at?: string | null
          id?: string
          notes?: string | null
          order_id: string
          shipped_at?: string | null
          status?: string
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          carrier?: string | null
          created_at?: string
          created_by?: string | null
          delivered_at?: string | null
          id?: string
          notes?: string | null
          order_id?: string
          shipped_at?: string | null
          status?: string
          tracking_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipments_order_fk"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_user_fk"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      store_events: {
        Row: {
          category_id: string | null
          created_at: string
          event_type: string
          id: string
          ip_hash: string | null
          metadata: Json
          page_path: string | null
          product_id: string | null
          referrer: string | null
          search_query: string | null
          session_id: string | null
          user_agent: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          ip_hash?: string | null
          metadata?: Json
          page_path?: string | null
          product_id?: string | null
          referrer?: string | null
          search_query?: string | null
          session_id?: string | null
          user_agent?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          ip_hash?: string | null
          metadata?: Json
          page_path?: string | null
          product_id?: string | null
          referrer?: string | null
          search_query?: string | null
          session_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_events_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_events_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          city: string | null
          company: string | null
          country: string
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          phone: string | null
          tax_id: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          company?: string | null
          country: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          tax_id?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          company?: string | null
          country?: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          tax_id?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          role_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          role_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_assigned_fk"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_role_fk"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      adjust_account_balance: {
        Args: { p_account_id: string; p_delta: number }
        Returns: undefined
      }
      cancel_import_receipt: {
        Args: { p_cancelled_by?: string; p_receipt_id: string }
        Returns: {
          cancelled_at: string | null
          cancelled_by: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          created_by: string | null
          id: string
          import_id: string
          location_id: string
          notes: string | null
          received_at: string | null
          reference: string
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "import_receipts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cancel_inventory_adjustment: {
        Args: { p_adjustment_id: string; p_cancelled_by?: string }
        Returns: {
          cancelled_at: string | null
          cancelled_by: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          reason: string
          reference: string
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "inventory_adjustments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cancel_inventory_entry: {
        Args: { p_cancelled_by?: string; p_entry_id: string }
        Returns: {
          cancelled_at: string | null
          cancelled_by: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          created_by: string | null
          entry_type: string
          id: string
          notes: string | null
          reference: string
          status: string
          supplier_name: string | null
          total_units: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "inventory_entries"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      confirm_import_receipt: {
        Args: { p_confirmed_by?: string; p_receipt_id: string }
        Returns: {
          cancelled_at: string | null
          cancelled_by: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          created_by: string | null
          id: string
          import_id: string
          location_id: string
          notes: string | null
          received_at: string | null
          reference: string
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "import_receipts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      confirm_inventory_adjustment: {
        Args: { p_adjustment_id: string; p_confirmed_by?: string }
        Returns: {
          cancelled_at: string | null
          cancelled_by: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          reason: string
          reference: string
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "inventory_adjustments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      confirm_inventory_entry: {
        Args: { p_confirmed_by?: string; p_entry_id: string }
        Returns: {
          cancelled_at: string | null
          cancelled_by: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          created_by: string | null
          entry_type: string
          id: string
          notes: string | null
          reference: string
          status: string
          supplier_name: string | null
          total_units: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "inventory_entries"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      confirm_inventory_hold: {
        Args: { p_confirmed_by?: string; p_hold_id: string }
        Returns: {
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          created_by: string | null
          customer_name: string | null
          expires_at: string | null
          id: string
          notes: string | null
          reference: string
          released_at: string | null
          released_by: string | null
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "inventory_holds"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_storefront_order: {
        Args: {
          p_address: string
          p_city: string
          p_currency?: string
          p_delivery_method: string
          p_email: string
          p_first_name: string
          p_id_number: string
          p_idempotency_key: string
          p_items: Json
          p_last_name: string
          p_notes: string
          p_phone: string
          p_whatsapp: string
        }
        Returns: Json
      }
      get_storefront_order_confirmation: {
        Args: { p_confirm_token: string; p_order_number: string }
        Returns: Json
      }
      has_permission: { Args: { p_permission: string }; Returns: boolean }
      log_audit_event: {
        Args: {
          p_action: string
          p_entity_id?: string
          p_entity_type: string
          p_metadata?: Json
          p_new?: Json
          p_previous?: Json
        }
        Returns: string
      }
      record_inventory_movement: {
        Args: {
          p_created_by?: string
          p_location_id: string
          p_movement_type: string
          p_notes?: string
          p_product_id: string
          p_quantity: number
          p_reason?: string
          p_reference_id?: string
          p_reference_type?: string
        }
        Returns: {
          created_at: string
          created_by: string | null
          id: string
          location_id: string
          movement_type: string
          notes: string | null
          product_id: string
          quantity: number
          quantity_after: number
          quantity_before: number
          reason: string | null
          reference_id: string | null
          reference_type: string | null
        }
        SetofOptions: {
          from: "*"
          to: "inventory_movements"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      release_inventory_hold: {
        Args: { p_hold_id: string; p_released_by?: string }
        Returns: {
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          created_by: string | null
          customer_name: string | null
          expires_at: string | null
          id: string
          notes: string | null
          reference: string
          released_at: string | null
          released_by: string | null
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "inventory_holds"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      reserve_inventory_movement: {
        Args: {
          p_created_by?: string
          p_location_id: string
          p_movement_type: string
          p_notes?: string
          p_product_id: string
          p_quantity: number
          p_reason?: string
          p_reference_id?: string
          p_reference_type?: string
        }
        Returns: {
          created_at: string
          created_by: string | null
          id: string
          location_id: string
          movement_type: string
          notes: string | null
          product_id: string
          quantity: number
          quantity_after: number
          quantity_before: number
          reason: string | null
          reference_id: string | null
          reference_type: string | null
        }
        SetofOptions: {
          from: "*"
          to: "inventory_movements"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

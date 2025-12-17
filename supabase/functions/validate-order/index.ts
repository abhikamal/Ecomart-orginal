import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const supabaseClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { product_id, quantity = 1 } = await req.json();
    console.log(`Validating order - User: ${user.id}, Product: ${product_id}, Quantity: ${quantity}`);

    // Validate quantity
    if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 100) {
      console.error("Invalid quantity:", quantity);
      return new Response(
        JSON.stringify({ error: "Invalid quantity. Must be between 1 and 100." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch current product price from database (server-side validation)
    const { data: product, error: productError } = await supabaseAdmin
      .from("products")
      .select("id, price, is_available, seller_id, name")
      .eq("id", product_id)
      .single();

    if (productError || !product) {
      console.error("Product not found:", productError);
      return new Response(
        JSON.stringify({ error: "Product not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!product.is_available) {
      console.error("Product not available:", product_id);
      return new Response(
        JSON.stringify({ error: "Product is no longer available" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prevent buying own product
    if (product.seller_id === user.id) {
      console.error("User tried to buy own product");
      return new Response(
        JSON.stringify({ error: "You cannot purchase your own product" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate total server-side with validated price
    const total_amount = product.price * quantity;
    console.log(`Calculated total: ${total_amount} (price: ${product.price} x quantity: ${quantity})`);

    // Create order with validated data using admin client
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        buyer_id: user.id,
        product_id: product.id,
        seller_id: product.seller_id,
        total_amount,
        status: "pending",
      })
      .select()
      .single();

    if (orderError) {
      console.error("Order creation failed:", orderError);
      return new Response(
        JSON.stringify({ error: "Failed to create order" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Order created successfully: ${order.id}`);

    return new Response(
      JSON.stringify({ 
        order,
        product_name: product.name,
        validated_price: product.price,
        validated_total: total_amount
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

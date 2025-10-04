import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  imageUrl: string;
  featured?: boolean;
}

export const ProductCard = ({
  id,
  name,
  slug,
  price,
  compareAtPrice,
  imageUrl,
  featured,
}: ProductCardProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  
  const discount = compareAtPrice
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : 0;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const addToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Please sign in to add items to cart");
      window.location.href = "/auth";
      return;
    }

    setIsAdding(true);

    try {
      const { data: existingItem } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("user_id", user.id)
        .eq("product_id", id)
        .maybeSingle();

      if (existingItem) {
        const { error } = await supabase
          .from("cart_items")
          .update({ quantity: existingItem.quantity + 1 })
          .eq("id", existingItem.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("cart_items")
          .insert({ user_id: user.id, product_id: id, quantity: 1 });

        if (error) throw error;
      }

      toast.success("Added to cart!");
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Failed to add to cart");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Link to={`/product/${slug}`}>
      <Card className="group h-full overflow-hidden transition-all hover:shadow-lg">
        <div className="relative aspect-square overflow-hidden bg-muted">
          {featured && (
            <Badge className="absolute left-2 top-2 z-10 bg-secondary">
              Featured
            </Badge>
          )}
          {discount > 0 && (
            <Badge className="absolute right-2 top-2 z-10 bg-destructive">
              -{discount}%
            </Badge>
          )}
          <img
            src={imageUrl}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <CardContent className="p-4">
          <h3 className="line-clamp-2 font-semibold group-hover:text-primary">
            {name}
          </h3>
          <div className="mt-2 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className="h-4 w-4 fill-secondary text-secondary"
              />
            ))}
            <span className="ml-2 text-sm text-muted-foreground">(4.5)</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-xl font-bold">${price.toFixed(2)}</span>
            {compareAtPrice && (
              <span className="text-sm text-muted-foreground line-through">
                ${compareAtPrice.toFixed(2)}
              </span>
            )}
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <Button
            className="w-full"
            onClick={addToCart}
            disabled={isAdding}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            {isAdding ? "Adding..." : "Add to Cart"}
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
};

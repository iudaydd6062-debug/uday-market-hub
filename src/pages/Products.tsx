import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { ProductCard } from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  image_url: string;
  featured: boolean;
}

export default function Products() {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("featured");

  const search = searchParams.get("search");
  const category = searchParams.get("category");
  const featured = searchParams.get("featured");

  useEffect(() => {
    loadProducts();
  }, [search, category, featured, sortBy]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      let query = supabase.from("products").select("*");

      if (search) {
        query = query.ilike("name", `%${search}%`);
      }

      if (category) {
        const { data: categoryData } = await supabase
          .from("categories")
          .select("id")
          .eq("slug", category)
          .single();

        if (categoryData) {
          query = query.eq("category_id", categoryData.id);
        }
      }

      if (featured === "true") {
        query = query.eq("featured", true);
      }

      // Apply sorting
      if (sortBy === "price-asc") {
        query = query.order("price", { ascending: true });
      } else if (sortBy === "price-desc") {
        query = query.order("price", { ascending: false });
      } else if (sortBy === "name") {
        query = query.order("name", { ascending: true });
      } else {
        query = query.order("featured", { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    if (search) return `Search results for "${search}"`;
    if (category) return category.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    if (featured) return "Featured Products";
    return "All Products";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">{getTitle()}</h1>
            <p className="mt-2 text-muted-foreground">
              {loading ? "Loading..." : `${products.length} products found`}
            </p>
          </div>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="featured">Featured</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
              <SelectItem value="name">Name: A to Z</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-square w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-lg text-muted-foreground">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                slug={product.slug}
                price={product.price}
                compareAtPrice={product.compare_at_price}
                imageUrl={product.image_url}
                featured={product.featured}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

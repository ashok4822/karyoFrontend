import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { RootState } from "../store";
import { loadUser } from "../store/slices/authSlice";
import Header from "../components/user/Header";
import ProductCard from "../components/user/ProductCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const Index = () => {
  const dispatch = useDispatch();
  const { products } = useSelector((state) => state.products);

  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  const featuredProducts = products
    .filter((p) => p.isFeatured && p.isListed && !p.isDeleted)
    .slice(0, 3);
  const newProducts = products
    .filter((p) => p.isListed && !p.isDeleted)
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-slate-900 to-slate-700 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto px-4 py-24 lg:py-32">
          <div className="max-w-3xl">
            <Badge className="mb-4 bg-orange-500 hover:bg-orange-600">
              New Collection
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
              Adventure Awaits with Premium Backpacks
            </h1>
            <p className="text-xl mb-8 text-gray-200">
              Discover our collection of durable, stylish backpacks designed for
              every journey. From daily commutes to mountain adventures.
            </p>
            <div className="flex gap-4">
              <Button
                asChild
                size="lg"
                className="bg-orange-500 hover:bg-orange-600"
              >
                <Link to="/products">Shop Now</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white hover:text-gray-900"
              >
                <Link to="/products?category=hiking">Explore Hiking</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Featured Products</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Handpicked favorites that combine style, durability, and
              functionality
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="text-center mt-12">
            <Button asChild variant="outline" size="lg">
              <Link to="/products">View All Products</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Shop by Category
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <Link
              to="/products?category=hiking"
              className="group relative overflow-hidden rounded-2xl aspect-square"
            >
              <img
                src="https://images.unsplash.com/photo-1622260614153-03223fb72052?w=500"
                alt="Hiking Backpacks"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-6 left-6 text-white">
                <h3 className="text-2xl font-bold mb-2">Hiking</h3>
                <p className="text-gray-200">Built for the trails</p>
              </div>
            </Link>

            <Link
              to="/products?category=travel"
              className="group relative overflow-hidden rounded-2xl aspect-square"
            >
              <img
                src="https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=500"
                alt="Travel Backpacks"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-6 left-6 text-white">
                <h3 className="text-2xl font-bold mb-2">Travel</h3>
                <p className="text-gray-200">Adventure ready</p>
              </div>
            </Link>

            <Link
              to="/products?category=daily"
              className="group relative overflow-hidden rounded-2xl aspect-square"
            >
              <img
                src="https://images.unsplash.com/photo-1622260614297-b35e6b7b5e7a?w=500"
                alt="Daily Backpacks"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-6 left-6 text-white">
                <h3 className="text-2xl font-bold mb-2">Daily</h3>
                <p className="text-gray-200">Everyday essentials</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">New Arrivals</h2>
            <p className="text-gray-600">Fresh designs just landed</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {newProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">BackpackHub</h3>
              <p className="text-gray-400">
                Premium backpacks for every adventure
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link to="/products" className="hover:text-white">
                    Products
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="hover:text-white">
                    About
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-white">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Categories</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link
                    to="/products?category=hiking"
                    className="hover:text-white"
                  >
                    Hiking
                  </Link>
                </li>
                <li>
                  <Link
                    to="/products?category=travel"
                    className="hover:text-white"
                  >
                    Travel
                  </Link>
                </li>
                <li>
                  <Link
                    to="/products?category=daily"
                    className="hover:text-white"
                  >
                    Daily
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Admin</h4>
              <Link
                to="/admin/login"
                className="text-gray-400 hover:text-white"
              >
                Admin Login
              </Link>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 BackpackHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;

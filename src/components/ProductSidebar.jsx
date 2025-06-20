import React, { useState } from "react";
import "./ProductSidebar.css";

const categories = [
  "Gen Z bags",
  "Laptop bags",
  "Premium bags",
  "Campus bags",
  "School bags",
  "Unisex bags",
];
const variants = ["Colour", "Capacity"];
const brands = ["Safari", "Skybags", "Wildcraft", "Genie"];
const minPrice = 0;
const maxPrice = 5000;

const ProductSidebar = ({ onFilter, onSort }) => {
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedVariants, setSelectedVariants] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [priceRange, setPriceRange] = useState([minPrice, maxPrice]);
  const [sortOption, setSortOption] = useState("");

  const handleCheckbox = (value, selected, setSelected) => {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handlePriceChange = (e, idx) => {
    const val = Number(e.target.value);
    setPriceRange((prev) => (idx === 0 ? [val, prev[1]] : [prev[0], val]));
  };

  const handleFilter = () => {
    if (onFilter) {
      onFilter({
        categories: selectedCategories,
        variants: selectedVariants,
        brands: selectedBrands,
        priceRange,
      });
    }
  };

  const handleSort = (e) => {
    setSortOption(e.target.value);
    if (onSort) onSort(e.target.value);
  };

  return (
    <div className="product-sidebar bg-white border rounded p-3 mb-4">
      <h5 className="mb-3">Categories</h5>
      <div className="mb-4">
        {categories.map((cat) => (
          <div className="form-check" key={cat}>
            <input
              className="form-check-input"
              type="checkbox"
              id={`cat-${cat}`}
              checked={selectedCategories.includes(cat)}
              onChange={() =>
                handleCheckbox(cat, selectedCategories, setSelectedCategories)
              }
            />
            <label className="form-check-label" htmlFor={`cat-${cat}`}>
              {cat}
            </label>
          </div>
        ))}
      </div>

      <h5 className="mb-3">Variants</h5>
      <div className="mb-4">
        {variants.map((variant) => (
          <div className="form-check" key={variant}>
            <input
              className="form-check-input"
              type="checkbox"
              id={`variant-${variant}`}
              checked={selectedVariants.includes(variant)}
              onChange={() =>
                handleCheckbox(variant, selectedVariants, setSelectedVariants)
              }
            />
            <label className="form-check-label" htmlFor={`variant-${variant}`}>
              {variant}
            </label>
          </div>
        ))}
      </div>

      <h5 className="mb-3">Brand</h5>
      <div className="mb-4">
        {brands.map((brand) => (
          <div className="form-check" key={brand}>
            <input
              className="form-check-input"
              type="checkbox"
              id={`brand-${brand}`}
              checked={selectedBrands.includes(brand)}
              onChange={() =>
                handleCheckbox(brand, selectedBrands, setSelectedBrands)
              }
            />
            <label className="form-check-label" htmlFor={`brand-${brand}`}>
              {brand}
            </label>
          </div>
        ))}
      </div>

      <h5 className="mb-3">Price</h5>
      <div className="mb-4">
        <div className="d-flex align-items-center gap-2">
          <input
            type="number"
            className="form-control form-control-sm"
            min={minPrice}
            max={priceRange[1]}
            value={priceRange[0]}
            onChange={(e) => handlePriceChange(e, 0)}
            style={{ width: 80 }}
          />
          <span className="mx-2">-</span>
          <input
            type="number"
            className="form-control form-control-sm"
            min={priceRange[0]}
            max={maxPrice}
            value={priceRange[1]}
            onChange={(e) => handlePriceChange(e, 1)}
            style={{ width: 80 }}
          />
        </div>
        <input
          type="range"
          className="form-range mt-2"
          min={minPrice}
          max={maxPrice}
          value={priceRange[0]}
          onChange={(e) => handlePriceChange(e, 0)}
        />
        <input
          type="range"
          className="form-range"
          min={minPrice}
          max={maxPrice}
          value={priceRange[1]}
          onChange={(e) => handlePriceChange(e, 1)}
        />
        <div className="d-flex justify-content-between small text-muted">
          <span>Min: ₹{minPrice}</span>
          <span>Max: ₹{maxPrice}</span>
        </div>
      </div>

      <div className="mb-3">
        <button className="btn btn-primary w-100 mb-2" onClick={handleFilter}>
          Apply Filters
        </button>
        <select
          className="form-select"
          value={sortOption}
          onChange={handleSort}
        >
          <option value="">Sort By</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="name-asc">Name: A-Z</option>
          <option value="name-desc">Name: Z-A</option>
          <option value="newest">New Arrivals</option>
          <option value="ratings">Ratings</option>
          <option value="featured">Featured</option>
        </select>
      </div>
    </div>
  );
};

export default ProductSidebar;

import React, { useState, useEffect } from "react";
import { Card, Form, Button, Accordion, Badge } from "react-bootstrap";
import { FaFilter, FaTimes, FaCheck } from "react-icons/fa";
import userAxios from "../lib/userAxios";
import "./ProductFilters.css";

const ProductFilters = ({ onApplyFilters, currentFilters }) => {
  const [filters, setFilters] = useState({
    categories: [],
    brands: [],
    variantColours: [],
    variantCapacities: [],
    priceRange: [0, 5000],
  });

  const [filterData, setFilterData] = useState({
    categories: [],
    brands: [],
    variantColours: [],
    variantCapacities: [],
  });

  const [loading, setLoading] = useState(true);

  // Load filter options from backend
  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        setLoading(true);

        // Fetch categories
        const categoriesResponse = await userAxios.get("/categories");
        const categories = categoriesResponse.data.categories || [];

        // Fetch brand options
        const brandsResponse = await userAxios.get("/products/brand-options");
        const brands = brandsResponse.data.brands || [];

        // Fetch variant options
        const variantsResponse = await userAxios.get(
          "/products/variant-options"
        );
        const variants = variantsResponse.data || {};

        setFilterData({
          categories,
          brands,
          variantColours: variants.colours || [],
          variantCapacities: variants.capacities || [],
        });
      } catch (error) {
        console.error("Error fetching filter data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFilterData();
  }, []);

  // Initialize filters from props
  useEffect(() => {
    if (currentFilters) {
      setFilters(currentFilters);
    }
  }, [currentFilters]);

  const handleCategoryChange = (categoryId) => {
    setFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter((id) => id !== categoryId)
        : [...prev.categories, categoryId],
    }));
  };

  const handleBrandChange = (brand) => {
    setFilters((prev) => ({
      ...prev,
      brands: prev.brands.includes(brand)
        ? prev.brands.filter((b) => b !== brand)
        : [...prev.brands, brand],
    }));
  };

  const handleVariantColourChange = (colour) => {
    setFilters((prev) => ({
      ...prev,
      variantColours: prev.variantColours.includes(colour)
        ? prev.variantColours.filter((c) => c !== colour)
        : [...prev.variantColours, colour],
    }));
  };

  const handleVariantCapacityChange = (capacity) => {
    setFilters((prev) => ({
      ...prev,
      variantCapacities: prev.variantCapacities.includes(capacity)
        ? prev.variantCapacities.filter((c) => c !== capacity)
        : [...prev.variantCapacities, capacity],
    }));
  };

  const handlePriceRangeChange = (min, max) => {
    setFilters((prev) => ({
      ...prev,
      priceRange: [parseInt(min), parseInt(max)],
    }));
  };

  const handleApplyFilters = () => {
    onApplyFilters(filters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      categories: [],
      brands: [],
      variantColours: [],
      variantCapacities: [],
      priceRange: [0, 5000],
    };
    setFilters(clearedFilters);
    onApplyFilters(clearedFilters);
  };

  const getActiveFilterCount = () => {
    return (
      filters.categories.length +
      filters.brands.length +
      filters.variantColours.length +
      filters.variantCapacities.length +
      (filters.priceRange[0] > 0 || filters.priceRange[1] < 5000 ? 1 : 0)
    );
  };

  if (loading) {
    return (
      <Card className="mb-4 product-filters">
        <Card.Body className="text-center">
          <div className="spinner-border spinner-border-sm" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <span className="ms-2">Loading filters...</span>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="mb-4 product-filters">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center">
          <FaFilter className="me-2" />
          <strong>Filters</strong>
          {getActiveFilterCount() > 0 && (
            <Badge bg="primary" className="ms-2">
              {getActiveFilterCount()}
            </Badge>
          )}
        </div>
        {getActiveFilterCount() > 0 && (
          <Button
            variant="link"
            size="sm"
            onClick={handleClearFilters}
            className="p-0 text-decoration-none"
          >
            <FaTimes />
          </Button>
        )}
      </Card.Header>
      <Card.Body>
        <Accordion defaultActiveKey="0">
          {/* Categories */}
          <Accordion.Item eventKey="0">
            <Accordion.Header>
              Categories
              {filters.categories.length > 0 && (
                <Badge bg="secondary" className="ms-2">
                  {filters.categories.length}
                </Badge>
              )}
            </Accordion.Header>
            <Accordion.Body>
              <div className="d-flex flex-column gap-2">
                {filterData.categories.map((category) => (
                  <Form.Check
                    key={category._id}
                    type="checkbox"
                    id={`category-${category._id}`}
                    label={category.name}
                    checked={filters.categories.includes(category._id)}
                    onChange={() => handleCategoryChange(category._id)}
                  />
                ))}
              </div>
            </Accordion.Body>
          </Accordion.Item>

          {/* Price Range */}
          <Accordion.Item eventKey="1">
            <Accordion.Header>
              Price Range
              {(filters.priceRange[0] > 0 || filters.priceRange[1] < 5000) && (
                <Badge bg="secondary" className="ms-2">
                  ₹{filters.priceRange[0]} - ₹{filters.priceRange[1]}
                </Badge>
              )}
            </Accordion.Header>
            <Accordion.Body>
              <div className="price-range-inputs">
                <Form.Control
                  type="number"
                  placeholder="Min"
                  value={filters.priceRange[0]}
                  onChange={(e) =>
                    handlePriceRangeChange(
                      e.target.value,
                      filters.priceRange[1]
                    )
                  }
                  min="0"
                  max={filters.priceRange[1]}
                />
                <span>-</span>
                <Form.Control
                  type="number"
                  placeholder="Max"
                  value={filters.priceRange[1]}
                  onChange={(e) =>
                    handlePriceRangeChange(
                      filters.priceRange[0],
                      e.target.value
                    )
                  }
                  min={filters.priceRange[0]}
                  max="10000"
                />
              </div>
            </Accordion.Body>
          </Accordion.Item>

          {/* Brands */}
          <Accordion.Item eventKey="2">
            <Accordion.Header>
              Brands
              {filters.brands.length > 0 && (
                <Badge bg="secondary" className="ms-2">
                  {filters.brands.length}
                </Badge>
              )}
            </Accordion.Header>
            <Accordion.Body>
              <div className="d-flex flex-column gap-2">
                {filterData.brands.map((brand) => (
                  <Form.Check
                    key={brand}
                    type="checkbox"
                    id={`brand-${brand}`}
                    label={brand}
                    checked={filters.brands.includes(brand)}
                    onChange={() => handleBrandChange(brand)}
                  />
                ))}
              </div>
            </Accordion.Body>
          </Accordion.Item>

          {/* Variant Colors */}
          <Accordion.Item eventKey="3">
            <Accordion.Header>
              Colors
              {filters.variantColours.length > 0 && (
                <Badge bg="secondary" className="ms-2">
                  {filters.variantColours.length}
                </Badge>
              )}
            </Accordion.Header>
            <Accordion.Body>
              <div className="d-flex flex-column gap-2">
                {filterData.variantColours.map((colour) => (
                  <Form.Check
                    key={colour}
                    type="checkbox"
                    id={`colour-${colour}`}
                    label={colour}
                    checked={filters.variantColours.includes(colour)}
                    onChange={() => handleVariantColourChange(colour)}
                  />
                ))}
              </div>
            </Accordion.Body>
          </Accordion.Item>

          {/* Variant Capacities */}
          <Accordion.Item eventKey="4">
            <Accordion.Header>
              Capacities
              {filters.variantCapacities.length > 0 && (
                <Badge bg="secondary" className="ms-2">
                  {filters.variantCapacities.length}
                </Badge>
              )}
            </Accordion.Header>
            <Accordion.Body>
              <div className="d-flex flex-column gap-2">
                {filterData.variantCapacities.map((capacity) => (
                  <Form.Check
                    key={capacity}
                    type="checkbox"
                    id={`capacity-${capacity}`}
                    label={capacity}
                    checked={filters.variantCapacities.includes(capacity)}
                    onChange={() => handleVariantCapacityChange(capacity)}
                  />
                ))}
              </div>
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>

        <Button
          variant="primary"
          className="w-100 mt-3"
          onClick={handleApplyFilters}
          disabled={getActiveFilterCount() === 0}
        >
          <FaCheck className="me-2" />
          Apply Filters
        </Button>
      </Card.Body>
    </Card>
  );
};

export default ProductFilters;

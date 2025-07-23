import React, { useState, useEffect } from "react";
import { getAllActiveOffers } from "../../services/user/offerService";
import OfferCard from "../../components/user/OfferCard";
import {
  Container,
  Row,
  Col,
  Button,
  Form,
  InputGroup,
  Spinner,
  Alert,
} from "react-bootstrap";
import { FaSearch, FaGift } from "react-icons/fa";
import { useToast } from "../../hooks/use-toast";

const Offers = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchOffers();
  }, [currentPage, searchTerm, filterType]);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const response = await getAllActiveOffers(currentPage, 12);
      console.log("fetchData: ", response);
      setOffers(response.data.data);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      console.error("Error fetching offers:", error);
      toast({
        title: "Error",
        description: "Failed to fetch offers. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredOffers = offers.filter((offer) => {
    const matchesSearch =
      offer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offer.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterType === "all" || offer.offerType === filterType;

    return matchesSearch && matchesFilter;
  });

  const handleApplyOffer = (offer) => {
    // This will be handled by the parent component or navigation
    toast({
      title: "Offer Selected",
      description: `${offer.name} has been selected. You can apply it during checkout.`,
    });
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="min-vh-100 bg-light py-5">
        <Container>
          <div className="text-center">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3 text-muted">Loading offers...</p>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-light py-5">
      <Container>
        {/* Header */}
        <div className="text-center mb-5">
          <div className="d-flex align-items-center justify-content-center gap-3 mb-4">
            <FaGift className="text-primary" size={48} />
            <h1 className="display-4 fw-bold text-dark mb-0">Special Offers</h1>
          </div>
          <p className="lead text-muted mx-auto" style={{ maxWidth: "600px" }}>
            Discover amazing deals and discounts on your favorite products.
            Don't miss out on these limited-time offers!
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded shadow-sm p-4 mb-5">
          <Row className="g-3">
            <Col md={8}>
              <InputGroup>
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search offers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={4}>
              <Form.Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">All Offers</option>
                <option value="product">Product Offers</option>
                <option value="category">Category Offers</option>
                <option value="referral">Referral Offers</option>
              </Form.Select>
            </Col>
          </Row>
        </div>

        {/* Offers Grid */}
        {filteredOffers.length === 0 ? (
          <div className="text-center py-5">
            <FaGift className="text-muted mb-4" size={64} />
            <h3 className="h4 text-muted mb-2">No offers found</h3>
            <p className="text-muted">
              {searchTerm || filterType !== "all"
                ? "Try adjusting your search or filters"
                : "Check back later for new offers!"}
            </p>
          </div>
        ) : (
          <Row className="g-4 mb-5">
            {filteredOffers.map((offer) => (
              <Col key={offer._id} xs={12} sm={6} lg={4} xl={3}>
                <OfferCard
                  offer={offer}
                  onApply={handleApplyOffer}
                  showApplyButton={true}
                />
              </Col>
            ))}
          </Row>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="d-flex justify-content-center gap-2">
            <Button
              variant="outline-primary"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "primary" : "outline-primary"}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </Button>
            ))}

            <Button
              variant="outline-primary"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </Container>
    </div>
  );
};

export default Offers;

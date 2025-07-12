import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import adminAxios from "@/lib/adminAxios";
import { format } from "date-fns";

const AdminReferrals = () => {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "all",
    search: "",
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });

  useEffect(() => {
    fetchReferrals();
  }, [filters, pagination.currentPage]);

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      // Filter out "all" values and empty strings
      const filteredParams = Object.fromEntries(
        Object.entries(filters).filter(([key, value]) => value && value !== "all")
      );
      
      const params = new URLSearchParams({
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
        ...filteredParams,
      });

      const response = await adminAxios.get(`/api/referrals?${params}`);
      setReferrals(response.data.data);
      setPagination(prev => ({
        ...prev,
        totalPages: response.data.pagination.totalPages,
        totalItems: response.data.pagination.totalItems,
      }));
    } catch (error) {
      toast.error("Failed to fetch referrals");
      console.error("Error fetching referrals:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: "secondary",
      completed: "default",
      expired: "destructive",
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const getReferralTypeBadge = (referral) => {
    return (
      <Badge variant="outline">
        {referral.referralToken ? "Token" : "Code"}
      </Badge>
    );
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Referrals</h1>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Search</Label>
              <Input
                placeholder="Search referrals..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={() => setFilters({ status: "all", search: "" })} variant="outline">
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referrals List */}
      {loading ? (
        <div className="text-center py-8">Loading referrals...</div>
      ) : (
        <div className="grid gap-4">
          {referrals.map((referral) => (
            <Card key={referral._id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">
                        {referral.referrer?.firstName} {referral.referrer?.lastName}
                      </h3>
                      {getStatusBadge(referral.status)}
                      {getReferralTypeBadge(referral)}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                      <div>
                        <span className="font-medium">Referrer:</span> {referral.referrer?.email}
                      </div>
                      <div>
                        <span className="font-medium">Referred:</span> {referral.referred?.email || "Pending"}
                      </div>
                      <div>
                        <span className="font-medium">Created:</span> {format(new Date(referral.createdAt), "dd/MM/yyyy HH:mm:ss")}
                      </div>
                      <div>
                        <span className="font-medium">Expires:</span> {format(new Date(referral.expiresAt), "dd/MM/yyyy HH:mm:ss")}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Referral Code:</span> {referral.referralCode}
                      </div>
                      {referral.referralToken && (
                        <div>
                          <span className="font-medium">Referral Token:</span> {referral.referralToken.substring(0, 16)}...
                        </div>
                      )}
                      {referral.completedAt && (
                        <div>
                          <span className="font-medium">Completed:</span> {format(new Date(referral.completedAt), "dd/MM/yyyy HH:mm:ss")}
                        </div>
                      )}
                    </div>

                    {referral.rewardCoupon && (
                      <div className="mt-2 p-2 bg-green-50 rounded">
                        <span className="font-medium text-green-800">Reward Coupon:</span> {referral.rewardCoupon.code}
                        <span className="ml-2 text-green-600">
                          ({referral.rewardCoupon.discountValue}
                          {referral.rewardCoupon.discountType === "percentage" ? "%" : "₹"})
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={pagination.currentPage === 1}
              onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
            >
              Previous
            </Button>
            <span className="flex items-center px-4">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              disabled={pagination.currentPage === pagination.totalPages}
              onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {referrals.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          No referrals found
        </div>
      )}
    </div>
  );
};

export default AdminReferrals; 
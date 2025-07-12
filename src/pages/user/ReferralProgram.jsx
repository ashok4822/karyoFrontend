import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import userAxios from "@/lib/userAxios";
import { format } from "date-fns";
import { Copy, Share2, Users, Gift, TrendingUp } from "lucide-react";

const ReferralProgram = () => {
  const [referralData, setReferralData] = useState({
    referralCode: null,
    referralCount: 0,
    totalReferralRewards: 0,
  });
  const [referralHistory, setReferralHistory] = useState([]);
  const [referralStats, setReferralStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [referralLink, setReferralLink] = useState("");

  useEffect(() => {
    fetchReferralData();
    fetchReferralHistory();
    fetchReferralStats();
  }, []);

  const fetchReferralData = async () => {
    try {
      const response = await userAxios.get("/api/user/referral/code");
      setReferralData(response.data.data);
    } catch (error) {
      console.error("Error fetching referral data:", error);
    }
  };

  const fetchReferralHistory = async () => {
    try {
      const response = await userAxios.get("/api/user/referral/history");
      setReferralHistory(response.data.data);
    } catch (error) {
      console.error("Error fetching referral history:", error);
    }
  };

  const fetchReferralStats = async () => {
    try {
      const response = await userAxios.get("/api/user/referral/stats");
      setReferralStats(response.data.data);
    } catch (error) {
      console.error("Error fetching referral stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateReferralCode = async () => {
    try {
      const response = await userAxios.post("/api/user/referral/generate-code");
      setReferralData(prev => ({
        ...prev,
        referralCode: response.data.data.referralCode,
      }));
      toast.success("Referral code generated successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to generate referral code");
    }
  };

  const generateReferralLink = async () => {
    try {
      setGeneratingLink(true);
      const response = await userAxios.post("/api/user/referral/generate-link");
      setReferralLink(response.data.data.referralLink);
      toast.success("Referral link generated successfully!");
    } catch (error) {
      toast.error("Failed to generate referral link");
    } finally {
      setGeneratingLink(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const shareReferral = async (text) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join me on our platform!",
          text: `Use my referral code: ${text}`,
          url: text.includes("http") ? text : window.location.origin,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      copyToClipboard(text);
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading referral program...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Referral Program</h1>
        <p className="text-gray-600">
          Invite friends and earn rewards! Share your referral code and get exclusive discounts.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Referrals</p>
                <p className="text-2xl font-bold">{referralData.referralCount}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Rewards</p>
                <p className="text-2xl font-bold">{referralData.totalReferralRewards}</p>
              </div>
              <Gift className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold">
                  {referralStats.statusBreakdown?.completed || 0}/{referralData.referralCount || 0}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="referral-code" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="referral-code">Referral Code</TabsTrigger>
          <TabsTrigger value="referral-history">Referral History</TabsTrigger>
        </TabsList>

        <TabsContent value="referral-code" className="space-y-6">
          {/* Referral Code Section */}
          <Card>
            <CardHeader>
              <CardTitle>Your Referral Code</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {referralData.referralCode ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Input
                      value={referralData.referralCode}
                      readOnly
                      className="font-mono text-lg"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(referralData.referralCode)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => shareReferral(referralData.referralCode)}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600">
                    Share this code with your friends. When they register using your code, you'll both get rewards!
                  </p>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <p className="text-gray-600">You don't have a referral code yet.</p>
                  <Button onClick={generateReferralCode}>Generate Referral Code</Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Referral Link Section */}
          <Card>
            <CardHeader>
              <CardTitle>Referral Link</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Input
                  value={referralLink || "Generate a referral link to share"}
                  readOnly
                  className="font-mono"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateReferralLink}
                  disabled={generatingLink}
                >
                  {generatingLink ? "Generating..." : "Generate Link"}
                </Button>
                {referralLink && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(referralLink)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => shareReferral(referralLink)}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
              <p className="text-sm text-gray-600">
                Generate a unique referral link that you can share with friends. The link contains a secure token.
              </p>
            </CardContent>
          </Card>

          {/* How It Works */}
          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-blue-600 font-bold">1</span>
                  </div>
                  <h3 className="font-semibold mb-2">Share Your Code</h3>
                  <p className="text-sm text-gray-600">
                    Share your referral code or link with friends and family
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-green-600 font-bold">2</span>
                  </div>
                  <h3 className="font-semibold mb-2">They Register</h3>
                  <p className="text-sm text-gray-600">
                    When they register using your code, the referral is tracked
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-purple-600 font-bold">3</span>
                  </div>
                  <h3 className="font-semibold mb-2">Earn Rewards</h3>
                  <p className="text-sm text-gray-600">
                    You both receive exclusive discount coupons as rewards
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="referral-history" className="space-y-6">
          {/* Referral History */}
          <Card>
            <CardHeader>
              <CardTitle>Referral History</CardTitle>
            </CardHeader>
            <CardContent>
              {referralHistory.length > 0 ? (
                <div className="space-y-4">
                  {referralHistory.map((referral) => (
                    <div
                      key={referral._id}
                      className="border rounded-lg p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {referral.referred?.firstName} {referral.referred?.lastName}
                          </p>
                          <p className="text-sm text-gray-600">
                            {referral.referred?.email}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(referral.status)}
                          <Badge variant="outline">
                            {referral.referralToken ? "Token" : "Code"}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Created:</span> {format(new Date(referral.createdAt), "dd/MM/yyyy HH:mm:ss")}
                        </div>
                        <div>
                          <span className="font-medium">Expires:</span> {format(new Date(referral.expiresAt), "dd/MM/yyyy HH:mm:ss")}
                        </div>
                        {referral.completedAt && (
                          <div>
                            <span className="font-medium">Completed:</span> {format(new Date(referral.completedAt), "dd/MM/yyyy HH:mm:ss")}
                          </div>
                        )}
                      </div>

                      {referral.rewardCoupon && (
                        <div className="p-2 bg-green-50 rounded">
                          <span className="font-medium text-green-800">Reward Coupon:</span> {referral.rewardCoupon.code}
                          <span className="ml-2 text-green-600">
                            ({referral.rewardCoupon.discountValue}
                            {referral.rewardCoupon.discountType === "percentage" ? "%" : "₹"})
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No referral history yet. Start sharing your referral code!
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReferralProgram; 
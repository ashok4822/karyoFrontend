import userAxios from '../../lib/userAxios';

// Get best offer for a specific product
export const getBestOfferForProduct = async (productId) => {
  try {
    const response = await userAxios.get(`/api/offers/product/${productId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching best offer for product:', error);
    throw error;
  }
};

// Get best offers for multiple products
export const getBestOffersForProducts = async (productIds) => {
  try {
    const promises = productIds.map(productId => 
      userAxios.get(`/api/offers/product/${productId}`)
    );
    const responses = await Promise.all(promises);
    const offersMap = {};
    
    responses.forEach((response, index) => {
      if (response.data.success && response.data.data) {
        offersMap[productIds[index]] = response.data.data;
      }
    });
    
    return { success: true, data: offersMap };
  } catch (error) {
    console.error('Error fetching best offers for products:', error);
    throw error;
  }
};

// Get offers for a specific category
export const getOffersByCategory = async (categoryId, page = 1, limit = 10) => {
  try {
    const response = await userAxios.get(`/api/offers/category/${categoryId}?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching category offers:', error);
    throw error;
  }
};

// Get offers for specific products
export const getOffersByProducts = async (productIds) => {
  try {
    const response = await userAxios.post('/api/offers/products', { productIds });
    return response.data;
  } catch (error) {
    console.error('Error fetching product offers:', error);
    throw error;
  }
};

// Get all active offers (for offers page)
export const getAllActiveOffers = async (page = 1, limit = 12) => {
  try {
    console.log('Fetching offers with page:', page, 'limit:', limit);
    const response = await userAxios.get(`/api/offers?page=${page}&limit=${limit}`);
    console.log('Offers response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching active offers:', error);
    console.error('Error response:', error.response?.data);
    throw error;
  }
}; 
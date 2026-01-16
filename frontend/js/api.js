/**
 * ASA Policy App - API Client
 * 
 * Handles all communication with the backend API
 * Base URL: https://asa-policy-backend.onrender.com
 */

const API_BASE_URL = 'https://asa-policy-backend.onrender.com/api';

// Token storage key
const TOKEN_KEY = 'asa_auth_token';
const USER_KEY = 'asa_user';

/**
 * Get stored authentication token
 */
function getAuthToken() {
    return localStorage.getItem(TOKEN_KEY);
}

/**
 * Store authentication token
 */
function setAuthToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Remove authentication token
 */
function removeAuthToken() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

/**
 * Get stored user info
 */
function getStoredUser() {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
}

/**
 * Store user info
 */
function setStoredUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * Make authenticated API request
 */
async function apiRequest(endpoint, options = {}) {
    const token = getAuthToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${API_BASE_URL}${endpoint}`;
    
    try {
        const response = await fetch(url, {
            ...options,
            headers
        });

        // Handle unauthorized - clear token and redirect to login
        if (response.status === 401) {
            removeAuthToken();
            if (window.location.pathname.includes('/admin/')) {
                window.location.href = '/frontend/admin/login.html';
            }
            throw new Error('Unauthorized - Please log in again');
        }

        // Handle other errors
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Request failed' }));
            throw new Error(errorData.detail || errorData.message || `HTTP ${response.status}`);
        }

        // Parse JSON response
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
}

/**
 * Authentication API
 */
const authAPI = {
    /**
     * Login with email and password
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<Object>} Login response with token and user info
     */
    async login(email, password) {
        const response = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        
        if (response.access_token) {
            setAuthToken(response.access_token);
            setStoredUser(response.user);
        }
        
        return response;
    },

    /**
     * Logout current user
     */
    async logout() {
        try {
            await apiRequest('/auth/logout', {
                method: 'POST'
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            removeAuthToken();
        }
    },

    /**
     * Get current user info
     * @returns {Promise<Object>} Current user information
     */
    async getCurrentUser() {
        try {
            const user = await apiRequest('/auth/me');
            setStoredUser(user);
            return user;
        } catch (error) {
            // If request fails, return stored user
            return getStoredUser();
        }
    },

    /**
     * Update current user profile (name)
     * @param {Object} profileData - Profile data with name field
     * @returns {Promise<Object>} Updated user information
     */
    async updateProfile(profileData) {
        try {
            // Update user profile via API
            const response = await apiRequest('/auth/me', {
                method: 'PUT',
                body: JSON.stringify(profileData)
            });
            
            // Update stored user
            if (response) {
                setStoredUser(response);
            }
            
            return response;
        } catch (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    },

    /**
     * Check if user is authenticated
     * @returns {boolean}
     */
    isAuthenticated() {
        return !!getAuthToken();
    }
};

/**
 * Policies API
 */
const policiesAPI = {
    /**
     * Get approved policies (public)
     * @param {string} section - Optional section filter (1, 2, or 3)
     * @param {string} search - Optional search query
     * @returns {Promise<Array>} List of approved policies
     */
    async getApprovedPolicies(section = null, search = null) {
        const params = new URLSearchParams();
        if (section) params.append('section', section);
        if (search) params.append('search', search);
        
        const queryString = params.toString();
        const endpoint = `/policies/approved${queryString ? `?${queryString}` : ''}`;
        
        return await apiRequest(endpoint);
    },

    /**
     * Get all policies (admin only - requires auth)
     * @param {Object} filters - Optional filters (status, section, search, limit, offset)
     * @returns {Promise<Array>} List of all policies
     */
    async getAllPolicies(filters = {}) {
        const params = new URLSearchParams();
        Object.keys(filters).forEach(key => {
            if (filters[key] !== null && filters[key] !== undefined) {
                params.append(key, filters[key]);
            }
        });
        
        const queryString = params.toString();
        const endpoint = `/policies${queryString ? `?${queryString}` : ''}`;
        
        return await apiRequest(endpoint);
    },

    /**
     * Get single policy by ID
     * @param {string} policyId - Policy ID
     * @returns {Promise<Object>} Policy object
     */
    async getPolicy(policyId) {
        return await apiRequest(`/policies/${policyId}`);
    },

    /**
     * Create new policy (admin only)
     * @param {Object} policyData - Policy data
     * @returns {Promise<Object>} Created policy
     */
    async createPolicy(policyData) {
        return await apiRequest('/policies/', {
            method: 'POST',
            body: JSON.stringify(policyData)
        });
    },

    /**
     * Update policy (admin only)
     * @param {string} policyId - Policy ID
     * @param {Object} policyData - Updated policy data
     * @returns {Promise<Object>} Updated policy
     */
    async updatePolicy(policyId, policyData) {
        return await apiRequest(`/policies/${policyId}`, {
            method: 'PUT',
            body: JSON.stringify(policyData)
        });
    },

    /**
     * Delete policy (admin only)
     * @param {string} policyId - Policy ID
     */
    async deletePolicy(policyId) {
        return await apiRequest(`/policies/${policyId}`, {
            method: 'DELETE'
        });
    },

    /**
     * Approve policy (admin only)
     * @param {string} policyId - Policy ID
     * @returns {Promise<Object>} Approved policy
     */
    async approvePolicy(policyId) {
        return await apiRequest(`/policies/${policyId}/approve`, {
            method: 'PUT'
        });
    }
};

/**
 * Bylaws API
 */
const bylawsAPI = {
    /**
     * Get approved bylaws (public)
     * @param {string} search - Optional search query
     * @returns {Promise<Array>} List of approved bylaws
     */
    async getApprovedBylaws(search = null) {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        
        const queryString = params.toString();
        const endpoint = `/bylaws/approved${queryString ? `?${queryString}` : ''}`;
        
        return await apiRequest(endpoint);
    },

    /**
     * Get all bylaws (admin only - requires auth)
     * @param {Object} filters - Optional filters (status, search, limit, offset)
     * @returns {Promise<Array>} List of all bylaws
     */
    async getAllBylaws(filters = {}) {
        const params = new URLSearchParams();
        Object.keys(filters).forEach(key => {
            if (filters[key] !== null && filters[key] !== undefined) {
                params.append(key, filters[key]);
            }
        });
        
        const queryString = params.toString();
        const endpoint = `/bylaws${queryString ? `?${queryString}` : ''}`;
        
        return await apiRequest(endpoint);
    },

    /**
     * Get single bylaw by ID
     * @param {string} bylawId - Bylaw ID
     * @returns {Promise<Object>} Bylaw object
     */
    async getBylaw(bylawId) {
        return await apiRequest(`/bylaws/${bylawId}`);
    },

    /**
     * Create new bylaw (admin only)
     * @param {Object} bylawData - Bylaw data
     * @returns {Promise<Object>} Created bylaw
     */
    async createBylaw(bylawData) {
        return await apiRequest('/bylaws/', {
            method: 'POST',
            body: JSON.stringify(bylawData)
        });
    },

    /**
     * Update bylaw (admin only)
     * @param {string} bylawId - Bylaw ID
     * @param {Object} bylawData - Updated bylaw data
     * @returns {Promise<Object>} Updated bylaw
     */
    async updateBylaw(bylawId, bylawData) {
        return await apiRequest(`/bylaws/${bylawId}`, {
            method: 'PUT',
            body: JSON.stringify(bylawData)
        });
    },

    /**
     * Delete bylaw (admin only)
     * @param {string} bylawId - Bylaw ID
     */
    async deleteBylaw(bylawId) {
        return await apiRequest(`/bylaws/${bylawId}`, {
            method: 'DELETE'
        });
    },

    /**
     * Approve bylaw (admin only)
     * @param {string} bylawId - Bylaw ID
     * @returns {Promise<Object>} Approved bylaw
     */
    async approveBylaw(bylawId) {
        return await apiRequest(`/bylaws/${bylawId}/approve`, {
            method: 'PUT'
        });
    }
};

/**
 * Suggestions API
 */
const suggestionsAPI = {
    /**
     * Create suggestion (public - no auth required)
     * @param {Object} suggestionData - Suggestion data (policy_id, suggestion, email)
     * @returns {Promise<Object>} Created suggestion
     */
    async createSuggestion(suggestionData) {
        // Public endpoint - don't use apiRequest (no auth needed)
        const response = await fetch(`${API_BASE_URL}/suggestions/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(suggestionData)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Request failed' }));
            throw new Error(errorData.detail || errorData.message || `HTTP ${response.status}`);
        }

        return await response.json();
    },

    /**
     * Get all suggestions (admin/policy working group only)
     * @param {Object} filters - Optional filters (status, policy_id, bylaw_id, limit, offset)
     * @returns {Promise<Array>} List of suggestions
     */
    async getAllSuggestions(filters = {}) {
        const params = new URLSearchParams();
        Object.keys(filters).forEach(key => {
            if (filters[key] !== null && filters[key] !== undefined) {
                params.append(key, filters[key]);
            }
        });
        
        const queryString = params.toString();
        const endpoint = `/suggestions${queryString ? `?${queryString}` : ''}`;
        
        return await apiRequest(endpoint);
    },

    /**
     * Delete suggestion (admin/policy working group only)
     * @param {string} suggestionId - Suggestion ID
     */
    async deleteSuggestion(suggestionId) {
        return await apiRequest(`/suggestions/${suggestionId}`, {
            method: 'DELETE'
        });
    }
};

// Export API objects
window.asaAPI = {
    auth: authAPI,
    policies: policiesAPI,
    bylaws: bylawsAPI,
    suggestions: suggestionsAPI,
    getAuthToken,
    isAuthenticated: authAPI.isAuthenticated.bind(authAPI)
};


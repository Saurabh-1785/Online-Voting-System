// src/services/api.ts - Frontend API Integration Layer

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// ============================================
// Helper Functions
// ============================================

interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

async function apiCall<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const token = localStorage.getItem('authToken');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Request failed',
      };
    }

    return {
      success: true,
      data,
    };

  } catch (error: any) {
    console.error(`API call failed: ${endpoint}`, error);
    return {
      success: false,
      error: error.message || 'Network error',
    };
  }
}

// ============================================
// Authentication API
// ============================================

export const checkEligibility = async (
  epicNumber: string,
  category: string
): Promise<ApiResponse> => {
  return apiCall('/auth/check-eligibility', {
    method: 'POST',
    body: JSON.stringify({ epicNumber, category }),
  });
};

export const registerUser = async (data: {
  epicNumber: string;
  aadhaar: string;
  category: string;
  mobileEpic: string;
  mobileAadhaar: string;
  biometricData: {
    embeddingHash: string;
  };
  ipAddress?: string;
  location?: {
    latitude: number;
    longitude: number;
    country: string;
  };
}): Promise<ApiResponse> => {
  const response = await apiCall('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  // Store token if successful
  if (response.success && response.data?.token) {
    localStorage.setItem('authToken', response.data.token);
  }

  return response;
};

export const login = async (
  epicNumber: string
): Promise<ApiResponse> => {
  return apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ epicNumber }),
  });
};

export const verifyLiveness = async (data: {
  embeddingHash: string;
  similarity: number;
}): Promise<ApiResponse> => {
  return apiCall('/auth/verify-liveness', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// ============================================
// Security API
// ============================================

export const reportAnomaly = async (data: {
  epicNumber: string;
  anomalyType: 'registration' | 'voting' | 'behavioral';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  indicators: Array<{
    type: string;
    confidence: number;
    evidence: string;
  }>;
  recommendedAction: 'allow' | 'flag' | 'block' | 'manual_review';
  autoBlocked: boolean;
  ipAddress?: string;
}): Promise<ApiResponse> => {
  return apiCall('/security/anomaly', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const checkUserBlocked = async (
  epicNumber: string
): Promise<ApiResponse<{ isBlocked: boolean; reason?: string }>> => {
  return apiCall(`/security/check-blocked/${epicNumber}`, {
    method: 'GET',
  });
};

export const getSecurityStats = async (): Promise<ApiResponse> => {
  return apiCall('/security/stats', {
    method: 'GET',
  });
};

// ============================================
// Voting API
// ============================================

export const castVote = async (data: {
  encryptedVote: string;
  constituency: string;
  electionId: string;
}): Promise<ApiResponse<{ trackingCode: string }>> => {
  return apiCall('/vote/cast', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const verifyVote = async (
  trackingCode: string
): Promise<ApiResponse<{
  found: boolean;
  castAt?: Date;
  verified?: boolean;
  constituency?: string;
}>> => {
  return apiCall(`/vote/verify/${trackingCode}`, {
    method: 'GET',
  });
};

// ============================================
// Helper: Get User IP Address
// ============================================

export const getUserIpAddress = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('Failed to get IP address:', error);
    return 'unknown';
  }
};

// ============================================
// Helper: Get User Location
// ============================================

export const getUserLocation = (): Promise<{
  latitude: number;
  longitude: number;
  country: string;
} | null> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Get country from reverse geocoding (optional)
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          
          resolve({
            latitude,
            longitude,
            country: data.address?.country || 'Unknown',
          });
        } catch (error) {
          resolve({ latitude, longitude, country: 'Unknown' });
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        resolve(null);
      }
    );
  });
};

// ============================================
// Integration with AI Services
// ============================================

export const reportRegistrationAnomaly = async (
  epicNumber: string,
  aiReport: any
): Promise<void> => {
  const ipAddress = await getUserIpAddress();
  
  await reportAnomaly({
    epicNumber,
    anomalyType: 'registration',
    riskLevel: aiReport.riskLevel,
    riskScore: aiReport.coercionRiskScore || 0,
    indicators: aiReport.details?.map((detail: string) => ({
      type: 'coercion',
      confidence: 0.8,
      evidence: detail,
    })) || [],
    recommendedAction: aiReport.shouldBlock ? 'block' : 'allow',
    autoBlocked: aiReport.shouldBlock,
    ipAddress,
  });
};

export const reportVotingAnomaly = async (
  epicNumber: string,
  anomalyData: {
    ipAddress: string;
    sessionDuration: number;
  }
): Promise<void> => {
  await reportAnomaly({
    epicNumber,
    anomalyType: 'voting',
    riskLevel: 'medium',
    riskScore: 50,
    indicators: [{
      type: 'ip_clustering',
      confidence: 0.7,
      evidence: `Session duration: ${anomalyData.sessionDuration}s`,
    }],
    recommendedAction: 'flag',
    autoBlocked: false,
    ipAddress: anomalyData.ipAddress,
  });
};

// ============================================
// Token Management
// ============================================

export const logout = (): void => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('epicNumber');
};

export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('authToken');
};

export const getCurrentUser = (): { epicNumber: string } | null => {
  const epicNumber = localStorage.getItem('epicNumber');
  if (!epicNumber) return null;
  
  return { epicNumber };
};
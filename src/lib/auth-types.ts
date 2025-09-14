export interface AuthUser {
  userId?: string;
  username?: string;
  role: string;
  permissions?: string[];
}

export interface AuthResult {
  isAuthenticated: boolean;
  user?: AuthUser;
  error?: string;
}

const authTypes = {
  
};

export default authTypes;

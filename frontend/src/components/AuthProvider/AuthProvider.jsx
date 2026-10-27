import { AuthContext, useAuthState } from '../../hooks/useAuth.js';

/** Shares who is signed in with every part of the app (DD-10). */
export default function AuthProvider({ children }) {
  const auth = useAuthState();
  return <AuthContext value={auth}>{children}</AuthContext>;
}

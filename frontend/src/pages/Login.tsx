import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { loginUser, getUserProfile } from '@/services/api';
import { Spinner } from '@/components/ui/spinner';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    try {
      setLoading(true);
      const response = await loginUser(email, password);
      
      // Store token in localStorage
      if (response.data && response.data.token) {
        // Make sure to properly format the token before storing it
        const token = response.data.token;
        
        // Ensure token doesn't have 'Bearer ' prefix already
        const formattedToken = token.startsWith('Bearer ') ? token.substring(7) : token;
        localStorage.setItem('token', formattedToken);
        
        // Small delay to ensure token is stored before making the next request
        await new Promise(resolve => setTimeout(resolve, 100));
        
        try {
          // Verify token validity by making a test API request
          const userProfile = await getUserProfile();
          
          if (userProfile.data) {
            console.log('Authentication successful');
            // If the request succeeds, navigate to dashboard
            navigate('/', { replace: true });
          } else {
            throw new Error('Invalid user profile response');
          }
        } catch (verifyError) {
          console.error('Token validation failed:', verifyError);
          setError('Authentication failed: Invalid token received from server');
          localStorage.removeItem('token');
        }
      } else {
        setError('Login failed: Invalid server response');
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const errorResponse = err.response as { data?: { message?: string } };
        setError(errorResponse.data?.message || 'Login failed. Please check your credentials.');
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">FeedWise</CardTitle>
          <CardDescription className="text-center">Enter your credentials to sign in to your account</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm rounded-md bg-destructive/15 text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com" 
                required 
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Spinner size="sm" color="currentColor" />
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign in'
              )}
            </Button>
            <div className="text-center text-sm">
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary hover:underline">
                Sign up
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Login;
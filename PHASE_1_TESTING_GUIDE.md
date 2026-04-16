# Phase 1: User & Auth System - Testing Guide

## 🧪 Test Cases & Validation

Complete test checklist for the User Authentication System.

---

## 1. Unit Tests - Backend

### Test: User Registration

```python
# tests/test_auth_registration.py
def test_register_valid_user():
    """Test successful user registration"""
    response = client.post("/api/auth/register", json={
        "username": "newuser",
        "email": "new@example.com",
        "password": "SecurePass123!",
        "confirm_password": "SecurePass123!",
        "full_name": "New User"
    })
    assert response.status_code == 201
    assert response.json()["access_token"]
    assert response.json()["user"]["email"] == "new@example.com"

def test_register_duplicate_email():
    """Test registration with existing email"""
    response = client.post("/api/auth/register", json={
        "username": "user2",
        "email": "existing@example.com",
        "password": "SecurePass123!",
        "confirm_password": "SecurePass123!"
    })
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"]

def test_register_weak_password():
    """Test registration with weak password"""
    response = client.post("/api/auth/register", json={
        "username": "weakpass",
        "email": "weak@example.com",
        "password": "weak",
        "confirm_password": "weak"
    })
    assert response.status_code == 422
    assert "characters" in response.json()["detail"][0]["msg"]

def test_register_password_mismatch():
    """Test registration with mismatched passwords"""
    response = client.post("/api/auth/register", json={
        "username": "mismatch",
        "email": "mismatch@example.com",
        "password": "SecurePass123!",
        "confirm_password": "DifferentPass123!"
    })
    assert response.status_code == 422
```

### Test: User Login

```python
# tests/test_auth_login.py
def test_login_with_username():
    """Test login using username"""
    response = client.post("/api/auth/login", json={
        "email_or_username": "testuser",
        "password": "SecurePass123!"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_login_with_email():
    """Test login using email"""
    response = client.post("/api/auth/login", json={
        "email_or_username": "test@example.com",
        "password": "SecurePass123!"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_login_invalid_credentials():
    """Test login with wrong password"""
    response = client.post("/api/auth/login", json={
        "email_or_username": "testuser",
        "password": "WrongPassword123!"
    })
    assert response.status_code == 401
    assert "Invalid" in response.json()["detail"]

def test_login_nonexistent_user():
    """Test login with non-existent user"""
    response = client.post("/api/auth/login", json={
        "email_or_username": "nonexistent@example.com",
        "password": "AnyPassword123!"
    })
    assert response.status_code == 401
```

### Test: Email Verification

```python
# tests/test_email_verification.py
def test_verify_email_valid_token():
    """Test email verification with valid token"""
    # Register user first
    user_response = client.post("/api/auth/register", json={...})
    # Get token from email (mock)
    token = get_verification_token_from_db(user_response.json()["user"]["id"])
    
    response = client.post("/api/auth/verify-email", json={"token": token})
    assert response.status_code == 200
    assert "successfully" in response.json()["message"]

def test_verify_email_expired_token():
    """Test email verification with expired token"""
    response = client.post("/api/auth/verify-email", json={
        "token": "expired_token_here"
    })
    assert response.status_code == 400
    assert "expired" in response.json()["detail"]

def test_verify_email_invalid_token():
    """Test email verification with invalid token"""
    response = client.post("/api/auth/verify-email", json={
        "token": "invalid_token_format"
    })
    assert response.status_code == 400
```

### Test: Password Reset

```python
# tests/test_password_reset.py
def test_forgot_password_valid_email():
    """Test forgot password request"""
    response = client.post("/api/auth/forgot-password", json={
        "email": "test@example.com"
    })
    assert response.status_code == 200
    # Email should be sent (mock check)

def test_forgot_password_nonexistent_email():
    """Test forgot password with non-existent email (should not reveal)"""
    response = client.post("/api/auth/forgot-password", json={
        "email": "notexist@example.com"
    })
    assert response.status_code == 200
    # Should return same response as valid email

def test_reset_password_valid_token():
    """Test password reset with valid token"""
    # Request reset first
    client.post("/api/auth/forgot-password", json={"email": "test@example.com"})
    token = get_reset_token_from_db("test@example.com")
    
    response = client.post("/api/auth/reset-password", json={
        "token": token,
        "new_password": "NewPass123!",
        "confirm_password": "NewPass123!"
    })
    assert response.status_code == 200

def test_login_after_password_reset():
    """Test login with new password after reset"""
    # ... reset password ...
    
    response = client.post("/api/auth/login", json={
        "email_or_username": "test@example.com",
        "password": "NewPass123!"
    })
    assert response.status_code == 200
```

---

## 2. Integration Tests - Frontend

### Test: Sign Up Flow

```javascript
// tests/auth.signup.test.js
describe('SignUp Page', () => {
  it('should display signup form', () => {
    render(<SignUp />);
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('should show password strength indicator', async () => {
    render(<SignUp />);
    const passwordInput = screen.getByLabelText(/^password$/i);
    
    fireEvent.change(passwordInput, { target: { value: 'weak' } });
    expect(screen.getByText(/weak/i)).toBeInTheDocument();
    
    fireEvent.change(passwordInput, { target: { value: 'SecurePass123!' } });
    expect(screen.getByText(/strong/i)).toBeInTheDocument();
  });

  it('should validate form before submission', async () => {
    render(<SignUp />);
    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);
    
    expect(screen.getByText(/required/i)).toBeInTheDocument();
  });

  it('should submit valid form', async () => {
    render(<SignUp />);
    
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'newuser' }
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'new@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'SecurePass123!' }
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'SecurePass123!' }
    });
    fireEvent.click(screen.getByRole('checkbox', { name: /terms/i }));
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/success/i)).toBeInTheDocument();
    });
  });
});
```

### Test: Sign In Flow

```javascript
describe('SignIn Page', () => {
  it('should login with email', async () => {
    render(<SignIn />);
    
    fireEvent.change(screen.getByLabelText(/email or username/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'SecurePass123!' }
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    await waitFor(() => {
      expect(localStorage.getItem('access_token')).toBeTruthy();
    });
  });

  it('should show error for invalid credentials', async () => {
    render(<SignIn />);
    
    fireEvent.change(screen.getByLabelText(/email or username/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'WrongPassword!' }
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/invalid|failed/i)).toBeInTheDocument();
    });
  });
});
```

### Test: Email Verification Flow

```javascript
describe('Email Verification', () => {
  it('should display verification page after signup', () => {
    render(<VerifyEmail />);
    expect(screen.getByText(/verify your email/i)).toBeInTheDocument();
  });

  it('should verify email with token from URL', async () => {
    render(<VerifyEmail />, { initialEntries: ['/auth/verify-email?token=valid_token'] });
    
    await waitFor(() => {
      expect(screen.getByText(/verified/i)).toBeInTheDocument();
    });
  });

  it('should allow resending verification email', async () => {
    render(<VerifyEmail />);
    fireEvent.click(screen.getByRole('button', { name: /resend/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/sent/i)).toBeInTheDocument();
    });
  });
});
```

---

## 3. End-to-End Tests (Cypress/Playwright)

### Complete User Flow

```javascript
// tests/e2e/auth-flow.spec.js
describe('Complete Auth Flow', () => {
  it('should complete full registration and verification flow', () => {
    // Go to signup
    cy.visit('http://localhost:3000/auth/signup');
    
    // Fill form
    cy.get('input[name="username"]').type('newuser123');
    cy.get('input[name="email"]').type('newuser@example.com');
    cy.get('input[name="full_name"]').type('New User');
    cy.get('input[name="password"]').type('SecurePass123!');
    cy.get('input[name="confirm_password"]').type('SecurePass123!');
    cy.get('input[name="agree_terms"]').check();
    
    // Submit
    cy.get('button:contains("Create Account")').click();
    
    // Should show success and redirect
    cy.contains('successfully').should('be.visible');
    cy.url().should('include', '/auth/verify-email');
    
    // Wait for email (in test, check database)
    cy.task('getVerificationToken', { email: 'newuser@example.com' }).then(token => {
      // Visit verification link
      cy.visit(`http://localhost:3000/auth/verify-email?token=${token}`);
      cy.contains('verified').should('be.visible');
      
      // Should redirect to community
      cy.url().should('include', '/community');
    });
  });

  it('should complete login workflow', () => {
    cy.visit('http://localhost:3000/auth/signin');
    
    cy.get('input[name="email_or_username"]').type('testuser');
    cy.get('input[name="password"]').type('SecurePass123!');
    cy.get('button:contains("Sign In")').click();
    
    // Should redirect to community
    cy.url().should('include', '/community');
    cy.window().its('localStorage.access_token').should('exist');
  });

  it('should complete password reset workflow', () => {
    cy.visit('http://localhost:3000/auth/forgot-password');
    
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('button:contains("Send")').click();
    cy.contains('email').should('be.visible');
    
    // Get reset token from database/email
    cy.task('getResetToken', { email: 'test@example.com' }).then(token => {
      cy.visit(`http://localhost:3000/auth/reset-password?token=${token}`);
      
      cy.get('input[name="new_password"]').type('NewPass123!');
      cy.get('input[name="confirm_password"]').type('NewPass123!');
      cy.get('button:contains("Reset")').click();
      
      cy.contains('successful').should('be.visible');
    });
  });
});
```

---

## 4. Manual Testing Checklist

### Registration
- [ ] Valid registration creates user
- [ ] Email verification email sent
- [ ] Username uniqueness enforced
- [ ] Email uniqueness enforced
- [ ] Password strength requirements enforced
- [ ] Terms & conditions checkbox required
- [ ] Success message displays
- [ ] Tokens stored in localStorage

### Login
- [ ] Login with username works
- [ ] Login with email works
- [ ] Invalid credentials show error
- [ ] Non-existent user shows error
- [ ] Inactive user shows error
- [ ] Remember me option works
- [ ] Tokens stored after login
- [ ] Redirects to community

### Email Verification
- [ ] Verification link in email works
- [ ] Manual token entry works
- [ ] Resend email works
- [ ] Expired token shows error
- [ ] Used token shows error
- [ ] Successful verification shows confirmation

### Forgot Password
- [ ] Reset link sent to email
- [ ] Link works from email
- [ ] Manual token entry works
- [ ] Expired link shows error
- [ ] Password reset works
- [ ] Login works with new password

### Profile Management
- [ ] Profile loads after login
- [ ] User stats display correctly
- [ ] Profile edit form opens
- [ ] Profile update saves changes
- [ ] Bio edit works
- [ ] Full name edit works
- [ ] Badges display correctly
- [ ] Level and points display

### Security
- [ ] Expired token redirects to login
- [ ] Invalid token shows error
- [ ] Password hashing verified in DB
- [ ] Email verification required (optional enforcement)
- [ ] Rate limiting on auth endpoints (if implemented)
- [ ] CORS properly configured

---

## 5. Performance Tests

### Load Testing

```bash
# Using Apache Bench
ab -n 1000 -c 10 http://localhost:8000/api/auth/login

# Using wrk
wrk -t4 -c100 -d30s http://localhost:8000/api/users/profile
```

### Expected Metrics
- Signup/Login: < 200ms
- Profile load: < 150ms
- Email send: < 1s
- DB query: < 50ms

---

## 6. Security Tests

- [ ] SQL injection attempts blocked
- [ ] XSS attacks prevented
- [ ] CSRF tokens (if applicable)
- [ ] Insecure password hashing rejected
- [ ] Rate limiting active
- [ ] Invalid sessions handled
- [ ] Sensitive data not exposed in logs
- [ ] Email addresses validated
- [ ] Phone numbers validated (if used)

---

## Success Criteria

✅ All unit tests pass
✅ All integration tests pass
✅ All E2E tests pass
✅ Manual checklist items complete
✅ No security vulnerabilities found
✅ Performance within acceptable ranges
✅ Error messages user-friendly
✅ Email delivery verified
✅ Database schema correct
✅ API documentation complete

---

## Test Execution

### Run All Tests

```bash
# Backend
cd backend
pytest tests/ -v

# Frontend
cd frontend
npm run test

# E2E
npx cypress run
```

### Run Specific Test Suite

```bash
# Backend auth tests
pytest tests/test_auth_*.py -v

# Frontend signup only
npm run test -- signup
```

---

**Status**: Testing Guide Complete
**Ready for**: Phase 1 Deployment

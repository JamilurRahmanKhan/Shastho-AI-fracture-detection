/**
 * Frontend page: Signup
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

import React from 'react';
import BrandSection from '../BrandSection/BrandSection';
import './Signup.css'; // We'll create this CSS file next
import SignupForm from '../SignupForm/SignupForm';


const Signup = () => {
    return (
        <div className="signup-container">
      <div className="signup-grid">
        {/* Left Side - Branding & Features */}
        <BrandSection />
        
        {/* Right Side - Signup Form */}
        <SignupForm />
      </div>
    </div>
    );
};

export default Signup;